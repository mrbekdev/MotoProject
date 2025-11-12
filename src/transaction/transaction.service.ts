import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType, TransactionStatus, PaymentType } from '@prisma/client';
import { CurrencyExchangeRateService } from '../currency-exchange-rate/currency-exchange-rate.service';
import { BonusService } from '../bonus/bonus.service';
import { DeliveryTasksGateway } from './delivery-tasks.gateway';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private currencyExchangeRateService: CurrencyExchangeRateService,
    private bonusService: BonusService,
    private deliveryGateway: DeliveryTasksGateway,
  ) {}

  // Normalize phone to a consistent format for storage/lookup
  // - removes spaces and non-digits except leading '+'
  // - if it looks like 12 digits starting with 998, ensures it has leading '+'
  private normalizePhone(input?: string | null): string | null {
    if (!input) return null;
    const raw = String(input).trim();
    // Remove spaces
    let p = raw.replace(/\s+/g, '');
    // If there are letters or other characters (except leading '+'), strip non-digits
    const hasOnlyPlusAndDigits = /^\+?\d+$/.test(p);
    if (!hasOnlyPlusAndDigits) {
      p = p.replace(/[^\d+]/g, '');
    }
    // Ensure + on 12-digit Uzbekistan numbers
    if (/^998\d{9}$/.test(p)) {
      p = `+${p}`;
    }
    // Also handle missing plus on already +998 formatted numbers without plus
    if (/^\d{12}$/.test(p) && p.startsWith('998')) {
      p = `+${p}`;
    }
    return p || null;
  }

  async create(createTransactionDto: CreateTransactionDto, userId?: number) {
    const { items, customer, ...restDto } = createTransactionDto as any;
    // Extract client-side helpers so they don't leak into Prisma create()
    const immediatePayments: Array<{ channel: string; amount: number }> =
      (restDto as any).immediatePayments ||
      (restDto as any).payments ||
      (restDto as any).splitPayments ||
      [];
    const {
      cashierId,
      immediatePayments: _omitImmediate,
      payments: _omitPayments,
      ...transactionData
    } = restDto as any;

    // User role ni tekshirish - endi frontend da tanlanadi
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new BadRequestException('User topilmadi');
      }
    }

    // Customer yaratish yoki mavjudini yangilash (passportSeries va jshshir-ni ham saqlash)
    let customerId: number | null = null;
    if (customer) {
      const rawPhone = (customer as any).phone as string | undefined;
      const normalizedPhone = this.normalizePhone(rawPhone);

      // Try to find existing customer by several phone variants if phone present
      let existingCustomer: any = null;
      if (normalizedPhone) {
        const variants = new Set<string>();
        variants.add(normalizedPhone);
        variants.add((normalizedPhone || '').replace(/\s+/g, ''));
        const noPlus = normalizedPhone.startsWith('+') ? normalizedPhone.substring(1) : normalizedPhone;
        variants.add(noPlus);
        // If starts with +998 add plain 998 variant
        if (/^\+998\d{9}$/.test(normalizedPhone)) variants.add(`998${normalizedPhone.substring(4)}`);
        existingCustomer = await this.prisma.customer.findFirst({
          where: { phone: { in: Array.from(variants) } }
        });
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Agar yangi ma'lumotlar kelgan bo'lsa, ularni yangilaymiz
        const updateData: any = {};
        if (customer.fullName && customer.fullName !== existingCustomer.fullName) {
          updateData.fullName = customer.fullName;
        }
        if (normalizedPhone && normalizedPhone !== existingCustomer.phone) {
          updateData.phone = normalizedPhone;
        }
        if (customer.passportSeries && customer.passportSeries !== existingCustomer.passportSeries) {
          updateData.passportSeries = customer.passportSeries;
        }
        if (customer.jshshir && customer.jshshir !== existingCustomer.jshshir) {
          updateData.jshshir = customer.jshshir;
        }
        if (typeof customer.address === 'string' && customer.address !== existingCustomer.address) {
          updateData.address = customer.address;
        }
        if (Object.keys(updateData).length > 0) {
          await this.prisma.customer.update({
            where: { id: existingCustomer.id },
            data: updateData
          });
        }
      } else {
        // Create even if phone is missing; store normalized phone if present
        const newCustomer = await this.prisma.customer.create({
          data: {
            fullName: customer.fullName ? customer.fullName : '',
            phone: normalizedPhone || (rawPhone ? rawPhone.replace(/\s+/g, '') : ''),
            passportSeries: customer.passportSeries || null,
            jshshir: customer.jshshir || null,
            address: customer.address || null,
          }
        });
        customerId = newCustomer.id;
      }
    }

    // Validate upfrontPaymentType (allow CASH, CARD, TERMINAL)
    const upfrontPaymentType = (transactionData as any).upfrontPaymentType;
    if (upfrontPaymentType && !['CASH', 'CARD', 'TERMINAL'].includes(upfrontPaymentType)) {
      throw new BadRequestException('Invalid upfrontPaymentType. Must be CASH, CARD, or TERMINAL');
    }

    // Resolve created-by and sold-by users
    const createdByUserId = userId ?? transactionData.userId ?? null;
    const soldByUserId = (transactionData as any).soldByUserId ?? userId ?? createdByUserId ?? null;

    // Compute totals and interest ONCE at sale time to avoid monthly reapplication
    let computedTotal = 0;
    let weightedPercentSum = 0;
    let percentWeightBase = 0;
    for (const item of items) {
      const principal = (item.price || 0) * (item.quantity || 0);
      computedTotal += principal;
      if (item.creditPercent) {
        weightedPercentSum += principal * (item.creditPercent || 0);
        percentWeightBase += principal;
      }
    }
    const upfrontPayment = Number((transactionData as any).downPayment || (transactionData as any).amountPaid || 0) || 0;
    const remainingPrincipal = Math.max(0, computedTotal - upfrontPayment);
    const effectivePercent = percentWeightBase > 0 ? (weightedPercentSum / percentWeightBase) : 0;
    const interestAmount = (transactionData as any).paymentType === PaymentType.CREDIT || (transactionData as any).paymentType === PaymentType.INSTALLMENT
      ? remainingPrincipal * effectivePercent
      : 0;
    const remainingWithInterest = remainingPrincipal + interestAmount;
    const finalTotalOnce = upfrontPayment + remainingWithInterest;

    // Transaction yaratish
    const createdTransaction = await this.prisma.$transaction(async (tx) => {
      // Build Prisma create data without leaking unknown args (e.g., immediatePayments)
      const data: any = {
        type: transactionData.type,
        status: transactionData.status,
        discount: transactionData.discount,
        total: computedTotal,
        finalTotal: finalTotalOnce,
        paymentType: transactionData.paymentType,
        upfrontPaymentType: (transactionData as any).upfrontPaymentType || 'CASH',
        termUnit: (transactionData as any).termUnit || 'MONTHS',
        deliveryMethod: transactionData.deliveryMethod,
        deliveryType: transactionData.deliveryType,
        deliveryAddress: transactionData.deliveryAddress,
        amountPaid: transactionData.amountPaid,
        downPayment: transactionData.downPayment,
        remainingBalance: remainingWithInterest,
        days: transactionData.days,
        months: transactionData.months,
        transactionType: transactionData.transactionType,
        receiptId: transactionData.receiptId,
        description: transactionData.description,
        creditRepaymentAmount: transactionData.creditRepaymentAmount,
        lastRepaymentDate: transactionData.lastRepaymentDate,
        extraProfit: transactionData.extraProfit,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            sellingPrice: item.sellingPrice || item.price,
            originalPrice: item.originalPrice || item.price,
            total: item.total || (item.price * item.quantity),
            creditMonth: item.creditMonth,
            creditPercent: item.creditPercent,
            monthlyPayment: item.monthlyPayment || null,
          }))
        },
      };
      const connectCustomerId = (customerId != null ? Number(customerId) : undefined) ?? ((transactionData as any).customerId != null ? Number((transactionData as any).customerId) : undefined);
      if (connectCustomerId) {
        data.customer = { connect: { id: connectCustomerId } };
      }
      if (createdByUserId) data.user = { connect: { id: Number(createdByUserId) } };
      if (soldByUserId) data.soldBy = { connect: { id: Number(soldByUserId) } };
      if ((transactionData as any).fromBranchId) data.fromBranch = { connect: { id: Number((transactionData as any).fromBranchId) } };
      if ((transactionData as any).toBranchId) data.toBranch = { connect: { id: Number((transactionData as any).toBranchId) } };

      const transaction = await tx.transaction.create({
        data,
        include: {
          items: true,
          customer: true,
          user: true,
          soldBy: true,
          dailyRepayments: true,
        },
      });

      // Persist split immediate payments using existing DailyRepayment table (no schema changes)
      try {
        const pt = String((transactionData as any)?.paymentType || '').toUpperCase();
        const isImmediate = ['CASH', 'CARD', 'TERMINAL', 'MIXED'].includes(pt);
        if (Array.isArray(immediatePayments) && immediatePayments.length > 0 && isImmediate) {
          const valid = immediatePayments
            .filter((p: any) => p && ['CASH', 'CARD', 'TERMINAL'].includes(String(p.channel).toUpperCase()) && Number(p.amount) > 0)
            .map((p: any) => ({
              transactionId: transaction.id,
              channel: String(p.channel).toUpperCase(),
              amount: Number(p.amount),
              paidAt: transaction.createdAt as any,
              paidByUserId: Number(soldByUserId || createdByUserId) || null,
              branchId: Number((transactionData as any)?.fromBranchId) || null,
            }));
          if (valid.length > 0) {
            await (tx as any).dailyRepayment.createMany({ data: valid });
          }
        } else if (isImmediate) {
          // Fallback: if no split array provided but amountPaid present, persist as a single-channel repayment
          const amt = Number((transactionData as any)?.amountPaid || 0) || 0;
          if (amt > 0 && ['CASH', 'CARD', 'TERMINAL'].includes(pt)) {
            await (tx as any).dailyRepayment.create({
              data: {
                transactionId: transaction.id,
                channel: pt,
                amount: amt,
                paidAt: transaction.createdAt as any,
                paidByUserId: Number(soldByUserId || createdByUserId) || null,
                branchId: Number((transactionData as any)?.fromBranchId) || null,
              }
            });
          }
        }
      } catch (e) {
        try { console.warn('[TransactionService] Failed to persist immediate payments via DailyRepayment:', (e as any)?.message || e); } catch {}
      }

      // Decrement inventory for SALE transactions immediately
      if ((transactionData as any)?.type === 'SALE') {
        for (const it of items) {
          if (!it.productId) continue;
          const prod = await tx.product.findUnique({
            where: { id: it.productId },
            include: { category: { select: { type: true } } }
          });
          if (!prod) {
            throw new BadRequestException(`Product not found: ${it.productId}`);
          }
          // Optional check: fromBranchId consistency; if provided and mismatched, proceed but do not block
          if ((transactionData as any)?.fromBranchId && prod.branchId !== (transactionData as any).fromBranchId) {
            try { console.warn(`[TransactionService] Sale fromBranchId ${ (transactionData as any).fromBranchId } differs from product.branchId ${prod.branchId} for product ${prod.id}`); } catch {}
          }

          const soldQtyRaw = Number(it.quantity) || 0;
          const hasArea = (prod as any).category?.type === 'AREA_SQM';

          if (hasArea) {
            const currentArea = Math.max(0, Number(prod.areaSqm ?? 0) || 0);
            const soldArea = Math.max(0, soldQtyRaw);
            if (soldArea > currentArea) {
              throw new BadRequestException(`Insufficient area for product ${prod.name || prod.id}. Available: ${currentArea} m², requested: ${soldArea} m²`);
            }
            const newArea = Number((currentArea - soldArea).toFixed(4));
            await tx.product.update({
              where: { id: prod.id },
              data: {
                areaSqm: newArea,
                status: newArea === 0 ? ('SOLD' as any) : ('IN_STORE' as any),
              },
            });
          } else {
            const soldQty = Math.max(0, Math.floor(soldQtyRaw));
            const currentQty = Math.max(0, Number(prod.quantity) || 0);
            if (soldQty > currentQty) {
              throw new BadRequestException(`Insufficient stock for product ${prod.name || prod.id}. Available: ${currentQty}, requested: ${soldQty}`);
            }
            const newQty = currentQty - soldQty;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                quantity: newQty,
                status: newQty === 0 ? ('SOLD' as any) : ('IN_STORE' as any),
              },
            });
          }
        }
      }
      // Increment inventory for PURCHASE transactions
      else if ((transactionData as any)?.type === 'PURCHASE') {
        // Try to resolve branch type for status decision
        let branchType: string | null = null;
        try {
          const b = (transactionData as any)?.fromBranchId
            ? await tx.branch.findUnique({ where: { id: Number((transactionData as any).fromBranchId) }, select: { type: true } })
            : null;
          branchType = (b?.type as any) || null;
        } catch {}

        for (const it of items) {
          if (!it.productId) continue;
          const prod = await tx.product.findUnique({
            where: { id: it.productId },
            include: { category: { select: { type: true } } }
          });
          if (!prod) {
            throw new BadRequestException(`Product not found: ${it.productId}`);
          }
          const addRaw = Number(it.quantity) || 0;
          const hasArea = (prod as any).category?.type === 'AREA_SQM';

          if (hasArea) {
            const currentArea = Math.max(0, Number(prod.areaSqm ?? 0) || 0);
            const addedArea = Math.max(0, addRaw);
            const newArea = Number((currentArea + addedArea).toFixed(4));
            await tx.product.update({
              where: { id: prod.id },
              data: {
                areaSqm: newArea,
                status: branchType === 'SKLAD' ? ('IN_WAREHOUSE' as any) : ('IN_STORE' as any)
              }
            });
          } else {
            const addQty = Math.max(0, Math.floor(addRaw));
            const currentQty = Math.max(0, Number(prod.quantity) || 0);
            const newQty = currentQty + addQty;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                quantity: newQty,
                status: branchType === 'SKLAD' ? ('IN_WAREHOUSE' as any) : ('IN_STORE' as any)
              }
            });
          }
        }
      }
      // Create delivery task if applicable (even if no specific auditor yet)
      const hasDelivery = Boolean(
        String((transactionData as any)?.deliveryType).toUpperCase() === 'DELIVERY' ||
        !!(transactionData as any)?.deliveryAddress
      );
      // Debug log
      try {
        console.log('[TransactionService] Task check:', {
          transactionId: transaction.id,
          deliveryUserId: (transactionData as any)?.deliveryUserId,
          deliveryType: (transactionData as any)?.deliveryType,
          deliveryAddress: (transactionData as any)?.deliveryAddress
        });
      } catch {}

      if (hasDelivery) {
        try {
          // avoid duplicates if any
          const existing = await (tx as any).task.findFirst({
            where: { transactionId: transaction.id }
          });
          if (!existing) {
            const createdTask = await (tx as any).task.create({
              data: {
                transactionId: transaction.id,
                auditorId: (transactionData as any)?.deliveryUserId ? Number((transactionData as any).deliveryUserId) : null,
                status: 'PENDING' as any,
              }
            });
            try { console.log('[TransactionService] Task created for transaction', transaction.id); } catch {}
            try { this.deliveryGateway.emitTaskCreated({ id: createdTask.id, transactionId: transaction.id, status: createdTask.status, auditorId: createdTask.auditorId }); } catch {}
          } else {
            try { console.log('[TransactionService] Task already exists for transaction', transaction.id); } catch {}
          }
        } catch (e) {
          try { console.error('[TransactionService] Task creation error:', e?.message || e); } catch {}
        }
      }
      return transaction;
    });

    // After transaction is created, calculate and create sales bonuses for SALE type
    try {
      const txType = (transactionData as any)?.type;
      if (txType === 'SALE' && soldByUserId) {
        // Reload the transaction with items to ensure calculation has full context
        const txFull = await this.prisma.transaction.findUnique({
          where: { id: createdTransaction.id },
          include: {
            items: true,
            customer: true,
            user: true,
            soldBy: true,
          },
        });
        if (txFull) {
          await this.calculateAndCreateSalesBonuses(txFull as any, Number(soldByUserId), Number(createdByUserId) || undefined);
        }
      }
    } catch (e) {
      try { console.error('Bonus calculation error (post-creation):', (e as any)?.message || e); } catch {}
      // Do not block transaction return on bonus errors
    }

    return createdTransaction;
  }

  async recalculateBonusesForTransaction(transactionId: number) {
    if (!transactionId || isNaN(Number(transactionId))) {
      throw new BadRequestException('Invalid transaction ID');
    }

    // Load transaction with items and participants
    const txFull = await this.prisma.transaction.findUnique({
      where: { id: Number(transactionId) },
      include: {
        items: true,
        customer: true,
        user: true,
        soldBy: true,
      },
    });
    if (!txFull) throw new NotFoundException('Transaction not found');

    // Clean up previous SALES_BONUS entries for this transaction to avoid duplication
    try {
      await (this.prisma as any).bonus.deleteMany({
        where: { transactionId: Number(transactionId), reason: 'SALES_BONUS' },
      });
    } catch (e) {
      try { console.warn('[TransactionService] Failed to delete previous bonuses for transaction', transactionId, e?.message || e); } catch {}
    }

    const soldByUserId = txFull.soldByUserId || txFull.userId || null;
    if (!soldByUserId) {
      // No seller associated; skip
      return { success: false, message: 'No seller associated with transaction' } as any;
    }

    await this.calculateAndCreateSalesBonuses(txFull as any, Number(soldByUserId), Number(txFull.userId) || undefined);
    return { success: true } as any;
  }

  // Qarzdorliklar ro'yxati (kredit / bo'lib to'lash)
  async getDebts(params: { branchId?: number; customerId?: number }) {
    const { branchId, customerId } = params || {};

    const where: any = {
      paymentType: {
        in: [PaymentType.CREDIT, PaymentType.INSTALLMENT]
      },
      status: { not: TransactionStatus.CANCELLED }
    };

    if (customerId) where.customerId = customerId;
    if (branchId) {
      // Filial bo'yicha mos keladigan transactionlar
      where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
        paymentSchedules: { orderBy: { month: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const debts = transactions
      .map((t) => {
        const schedules = t.paymentSchedules || [];
        const totalPayable = schedules.reduce((sum, s) => sum + (s.payment || 0), 0);
        const totalPaidFromSchedules = schedules.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
        const upfrontPaid = (t.downPayment || 0) + (t.amountPaid || 0);
        const totalPaid = totalPaidFromSchedules + upfrontPaid;
        const outstanding = Math.max(0, totalPayable - totalPaid);

        // Keyingi to'lov (to'lanmagan birinchi oy)
        const nextDue = schedules.find(
          (s) => (s.paidAmount || 0) < (s.payment || 0) && !s.isPaid
        );

        const monthlyPayment = schedules.length > 0 ? schedules[0].payment : 0;

        return {
          transactionId: t.id,
          customer: t.customer
            ? {
                id: t.customer.id,
                fullName: t.customer.fullName,
                phone: t.customer.phone
              }
            : null,
          createdAt: t.createdAt,
          paymentType: t.paymentType,
          totalPayable,
          totalPaid,
          outstanding,
          monthlyPayment,
          nextDue: nextDue
            ? {
                month: nextDue.month,
                amountDue: Math.max(0, (nextDue.payment || 0) - (nextDue.paidAmount || 0)),
                remainingBalance: nextDue.remainingBalance
              }
            : null,
          items: (t.items || []).map((it) => ({
            id: it.id,
            productId: it.productId,
            productName: it.product?.name,
            quantity: it.quantity,
            price: it.price,
            total: it.total
          }))
        };
      })
      .filter((d) => d.outstanding > 0);

    // Mijoz bo'yicha jamlama
    const customerMap = new Map<
      number,
      {
        customerId: number;
        fullName: string | null;
        phone: string | null;
        totalPayable: number;
        totalPaid: number;
        outstanding: number;
        transactions: typeof debts;
      }
    >();

    for (const d of debts) {
      const key = d.customer?.id || 0;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: key,
          fullName: d.customer?.fullName || null,
          phone: d.customer?.phone || null,
          totalPayable: 0,
          totalPaid: 0,
          outstanding: 0,
          transactions: []
        });
      }
      const agg = customerMap.get(key)!;
      agg.totalPayable += d.totalPayable;
      agg.totalPaid += d.totalPaid;
      agg.outstanding += d.outstanding;
      agg.transactions.push(d);
    }

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.outstanding - a.outstanding
    );

    const totalOutstanding = debts.reduce((sum, d) => sum + d.outstanding, 0);

    return {
      debts,
      customers,
      summary: {
        totalOutstanding,
        totalCustomers: customers.length,
        totalDebtTransactions: debts.length
      }
    };
  }

  // Mahsulot bo'yicha sotuvlar (sodda hisobot)
  async getProductSales(params: {
    productId?: number;
    branchId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { productId, branchId, startDate, endDate } = params || {};

    const where: any = {
      transaction: {
        type: TransactionType.SALE as any
      }
    };

    if (productId) where.productId = productId;
    if (branchId) where.transaction.fromBranchId = branchId;

    if (startDate || endDate) {
      where.transaction.createdAt = {};
      if (startDate) where.transaction.createdAt.gte = new Date(startDate);
      if (endDate) where.transaction.createdAt.lte = new Date(endDate);
    }

    const items = await this.prisma.transactionItem.findMany({
      where,
      include: {
        product: true,
        transaction: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mahsulot bo'yicha jamlash
    const productMap = new Map<
      number,
      { productId: number; productName: string | null; totalQuantity: number; totalAmount: number }
    >();

    // Sana bo'yicha jamlash (kunlik)
    const dailyMap = new Map<
      string,
      { date: string; totalQuantity: number; totalAmount: number }
    >();

    for (const it of items) {
      const pid = it.productId || 0;
      const pname = it.product?.name || null;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: pid,
          productName: pname,
          totalQuantity: 0,
          totalAmount: 0
        });
      }
      const pAgg = productMap.get(pid)!;
      pAgg.totalQuantity += it.quantity;
      pAgg.totalAmount += it.total;

      const d = it.transaction?.createdAt
        ? new Date(it.transaction.createdAt)
        : new Date(it.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { date: key, totalQuantity: 0, totalAmount: 0 });
      }
      const dAgg = dailyMap.get(key)!;
      dAgg.totalQuantity += it.quantity;
      dAgg.totalAmount += it.total;
    }

    const products = Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );
    const daily = Array.from(dailyMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));

    const totals = products.reduce(
      (acc, p) => {
        acc.totalQuantity += p.totalQuantity;
        acc.totalAmount += p.totalAmount;
        return acc;
      },
      { totalQuantity: 0, totalAmount: 0 }
    );

    return { products, daily, totals };
  }

  async findOne(id: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        user: true,
        soldBy: true,
        fromBranch: true,
        toBranch: true,
        paymentSchedules: true,
      }
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async findAll(query: any) {
    const {
      startDate,
      endDate,
      branchId,
      type,
      limit,
      include: includeParam,
      fields: fieldsParam,
    } = query || {};

    const where: any = {};
    if (type) where.type = type as any;
    if (branchId) where.OR = [{ fromBranchId: Number(branchId) }, { toBranchId: Number(branchId) }];
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const take = limit === 'all' ? undefined : (Number(limit) || 50);

    // Build include from query (defaults keep current behavior)
    const includeSet = new Set<string>(
      String(includeParam || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    const wantAllDefault = includeSet.size === 0; // no include passed -> include common relations
    const include: any = {
      // Always include items with product to satisfy frontend expectations (DefectiveManagement.jsx)
      items: { include: { product: true } },
      // Always include minimal user and soldBy to provide phone fallback
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      soldBy: { select: { id: true, firstName: true, lastName: true, phone: true } },
      // Other relations are optional/defaults
      customer: wantAllDefault || includeSet.has('customer'),
      fromBranch: wantAllDefault || includeSet.has('frombranch'),
      toBranch: wantAllDefault || includeSet.has('tobranch'),
      dailyRepayments: wantAllDefault || includeSet.has('dailyrepayments'),
      paymentSchedules: includeSet.has('paymentschedules'),
    };

    // Remove false keys to avoid Prisma validation errors
    Object.keys(include).forEach((k) => include[k] === false && delete include[k]);

    // Optional scalar field selection
    let select: any | undefined;
    if (fieldsParam) {
      select = {};
      const fieldSet = new Set<string>(
        String(fieldsParam)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      for (const f of fieldSet) select[f] = true;
      // Ensure id and createdAt are present
      select.id = true;
      select.createdAt = select.createdAt ?? true;
      // Ensure extraProfit is included as requested by frontend
      select.extraProfit = true;
      // When select is used, relations must be added under select
      if (include.customer) select.customer = { select: { id: true, fullName: true, phone: true } };
      if (include.items) select.items = { include: { product: true } } as any;
      if (include.user) select.user = { select: { id: true, firstName: true, lastName: true } };
      if (include.soldBy) select.soldBy = { select: { id: true, firstName: true, lastName: true } };
      if (include.fromBranch) select.fromBranch = true;
      if (include.toBranch) select.toBranch = true;
      if (include.dailyRepayments) select.dailyRepayments = true;
      if (include.paymentSchedules) select.paymentSchedules = true;
    }

    const queryArgs: any = {
      where,
      orderBy: { createdAt: 'desc' },
      ...(take ? { take } : {}),
      ...(select ? { select } : { include }),
    };

    const transactions = await this.prisma.transaction.findMany(queryArgs);
    const normalized = transactions.map((t: any) => {
      const clean = (v: any) => (typeof v === 'string' ? v.trim() : '');
      const fullFromModel = clean(t?.customer?.fullName);
      const phoneFromCustomer = clean(t?.customer?.phone);
      const prevDerived = clean(t?.customerName);
      const soldByName = [clean(t?.soldBy?.firstName), clean(t?.soldBy?.lastName)].filter(Boolean).join(' ').trim();
      const userName = [clean(t?.user?.firstName), clean(t?.user?.lastName)].filter(Boolean).join(' ').trim();
      const resolvedName = fullFromModel || prevDerived || soldByName || userName || '';
      const resolvedPhone = phoneFromCustomer || '';
      const ensuredCustomer = {
        ...(t?.customer || {}),
        fullName: (resolvedName || 'Номаълум'),
        phone: resolvedPhone,
      };
      return {
        ...t,
        customer: ensuredCustomer,
        customerName: ensuredCustomer.fullName,
        extraProfit: Number(t?.extraProfit || 0),
      };
    });
    return { transactions: normalized };
  }

  async findByType(type: string) {
    const isDeliveryType = type === 'DELIVERY';
    return this.prisma.transaction.findMany({
      where: isDeliveryType
        ? {
            OR: [
              { type: 'DELIVERY' as any },
              {
                AND: [
                  { type: 'SALE' as any },
                  {
                    OR: [
                      { deliveryType: 'DELIVERY' },
                      { deliveryAddress: { not: null } }
                    ]
                  }
                ]
              }
            ],
            status: { not: 'CANCELLED' as any }
          }
        : { type: type as any, status: { not: 'CANCELLED' as any } },
      include: {
        customer: true,
        items: { include: { product: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: number, status: string, userId?: number) {
    // First, update the transaction status (and assign deliveryUserId on accept)
    const data: any = { status: status as any, updatedById: userId || null };
    if (status === 'IN_PROGRESS' && userId) {
      data.deliveryUserId = userId;
    }
    const tx = await this.prisma.transaction.update({
      where: { id },
      data
    });

    // Then, sync the delivery task if exists
    try {
      const task = await (this.prisma as any).task.findFirst({ where: { transactionId: id } });
      if (task) {
        const taskUpdate: any = { status: status as any };
        if (status === 'IN_PROGRESS' && userId && !task.auditorId) {
          taskUpdate.auditorId = userId;
        }
        const updatedTask = await (this.prisma as any).task.update({ where: { id: task.id }, data: taskUpdate });
        try { this.deliveryGateway.emitTaskUpdated({ id: updatedTask.id, transactionId: id, status: updatedTask.status, auditorId: updatedTask.auditorId }); } catch {}
      }
    } catch (e) {
      try { console.warn('[TransactionService] Failed to sync task status:', (e as any)?.message || e); } catch {}
    }

    return tx;
  }

  async findByProductId(productId: number, month?: string) {
    let start: Date | undefined;
    let end: Date | undefined;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      if (y && m) {
        start = new Date(y, m - 1, 1);
        end = new Date(y, m, 0, 23, 59, 59);
      }
    }
    const whereTx: any = { items: { some: { productId } } };
    if (start || end) {
      whereTx.createdAt = {};
      if (start) whereTx.createdAt.gte = start;
      if (end) whereTx.createdAt.lte = end;
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereTx,
      include: {
        customer: true,
        items: { include: { product: true } },
        user: true,
        soldBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const statusCounts = transactions.reduce((acc: any, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});

    const typeCounts = transactions.reduce((acc: any, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});

    return { transactions, statusCounts: { total: statusCounts.total || 0, ...statusCounts }, typeCounts };
  }

  async update(id: number, dto: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: dto as any,
      include: {
        customer: true,
        items: { include: { product: true } },
        user: true,
        soldBy: true
      }
    });
  }

  async remove(id: number, _user?: any) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  // Kredit to'lovlarini boshqarish
  async getPaymentSchedules(transactionId: number) {
    // Validate that transactionId is provided and is a valid number
    if (transactionId === undefined || transactionId === null || isNaN(transactionId) || transactionId <= 0) {
      throw new BadRequestException('Invalid transaction ID provided');
    }

    const transaction = await this.findOne(transactionId);
    return transaction.paymentSchedules;
  }

  // Auditor uchun delivery tasklar
  async getDeliveryTasksForUser(auditorId: number) {
    const tasks = await (this.prisma as any).task.findMany({
      where: {
        status: { not: 'CANCELLED' as any },
        OR: [
          { auditorId: auditorId },       // assigned to me
          { auditorId: null }             // unassigned / free tasks
        ]
      },
      include: {
        transaction: {
          include: {
            customer: true,
            items: { include: { product: true } },
            user: { select: { id: true, firstName: true, lastName: true } },
            soldBy: { select: { id: true, firstName: true, lastName: true } },
            fromBranch: true,
            toBranch: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return tasks;
  }

  // Auditor delivery stats for admin reports
  async getDeliveryTaskStats(startDate?: Date, endDate?: Date, branchId?: number) {
    const where: any = {
      status: { not: 'CANCELLED' as any },
    };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (branchId) {
      where.transaction = {
        OR: [
          { fromBranchId: Number(branchId) },
          { toBranchId: Number(branchId) }
        ]
      } as any;
    }

    const tasks = await (this.prisma as any).task.findMany({
      where,
      include: {
        auditor: { select: { id: true, firstName: true, lastName: true, username: true } },
        transaction: { select: { fromBranchId: true, toBranchId: true, finalTotal: true, total: true } }
      }
    });

    const byAuditor: Record<string, any> = {};
    for (const t of tasks) {
      const aid = t.auditor?.id ? String(t.auditor.id) : 'UNASSIGNED';
      if (!byAuditor[aid]) {
        byAuditor[aid] = {
          auditorId: t.auditor?.id || null,
          auditorName: t.auditor ? `${t.auditor.firstName || ''} ${t.auditor.lastName || ''}`.trim() || t.auditor.username || `#${t.auditor.id}` : '—',
          pending: 0,
          in_progress: 0,
          completed: 0,
          total: 0,
          // amount aggregates
          in_progressAmount: 0,
          completedAmount: 0,
          totalAmount: 0,
        };
      }
      const bucket = byAuditor[aid];
      const s = String(t.status || '').toUpperCase();
      const amt = Number(t.transaction?.finalTotal ?? t.transaction?.total ?? 0) || 0;
      if (s === 'PENDING') bucket.pending += 1;
      else if (s === 'IN_PROGRESS') { bucket.in_progress += 1; bucket.in_progressAmount += amt; }
      else if (s === 'COMPLETED') { bucket.completed += 1; bucket.completedAmount += amt; }
      bucket.total += 1;
      bucket.totalAmount += amt;
    }
    const list = Object.values(byAuditor);
    return { stats: list } as any;
  }

  async updateTaskStatus(taskId: number, status: string, userId?: number) {
    if (!taskId || isNaN(Number(taskId))) {
      throw new BadRequestException('Invalid task ID');
    }
    // Update task first
    const task = await (this.prisma as any).task.findUnique({ where: { id: Number(taskId) } });
    if (!task) throw new NotFoundException('Task not found');

    const taskUpdate: any = { status: status as any };
    if (status === 'IN_PROGRESS' && userId) {
      // Force-assign to the acting user on accept
      taskUpdate.auditorId = Number(userId);
    }
    if (status === 'COMPLETED' && userId && !task.auditorId) {
      // If somehow was not assigned, backfill assignment to the actor
      taskUpdate.auditorId = Number(userId);
    }
    if (status === 'PENDING') {
      // On cancel to pending, unassign any auditor
      taskUpdate.auditorId = null;
    }
    const updatedTask = await (this.prisma as any).task.update({ where: { id: Number(taskId) }, data: taskUpdate });
    try { this.deliveryGateway.emitTaskUpdated({ id: updatedTask.id, transactionId: updatedTask.transactionId, status: updatedTask.status, auditorId: updatedTask.auditorId }); } catch {}

    // Sync related transaction
    try {
      const txId = Number(task.transactionId);
      const txData: any = { updatedById: userId || null };
      // Map task status -> transaction status (TransactionStatus has no IN_PROGRESS)
      if (status === 'COMPLETED') {
        txData.status = TransactionStatus.COMPLETED;
      } else if (status === 'CANCELLED') {
        txData.status = TransactionStatus.CANCELLED;
      } else {
        // For PENDING or IN_PROGRESS keep transaction as PENDING
        txData.status = TransactionStatus.PENDING;
      }
      if (status === 'IN_PROGRESS' && userId) {
        // Assign transaction to the same user on accept
        txData.deliveryUserId = Number(userId);
      } else if (status === 'PENDING') {
        // On cancel to pending, unassign any delivery user
        txData.deliveryUserId = null;
      }
      await this.prisma.transaction.update({ where: { id: txId }, data: txData });
    } catch (e) {
      try { console.warn('[TransactionService] Failed to sync transaction from task:', (e as any)?.message || e); } catch {}
    }

    return updatedTask;
  }

  async updatePaymentStatus(transactionId: number, month: number, paid: boolean) {
    // Validate that transactionId is provided and is a valid number
    if (transactionId === undefined || transactionId === null || isNaN(transactionId) || transactionId <= 0) {
      throw new BadRequestException('Invalid transaction ID provided');
    }

    const schedule = await this.prisma.paymentSchedule.findFirst({
      where: { transactionId, month }
    });

    if (!schedule) {
      throw new NotFoundException('Payment schedule not found');
    }

    // PaymentSchedule modelida paid field yo'q, shuning uchun boshqa yechim ishlatamiz
    return this.prisma.paymentSchedule.update({
      where: { id: schedule.id },
      data: { 
        // paid field yo'q, shuning uchun boshqa field bilan belgilaymiz
        remainingBalance: paid ? 0 : schedule.remainingBalance
        }
      });
    }

  // Filiallar orasida o'tkazma
  async createTransfer(transferData: any) {
    const { fromBranchId, toBranchId, items, ...data } = transferData;

    // Umumiy summani hisoblash
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // O'tkazma yaratish
    const transfer = await this.prisma.transaction.create({
      data: {
        ...data,
        type: TransactionType.TRANSFER,
        fromBranchId: fromBranchId,
        toBranchId: toBranchId,
        status: TransactionStatus.PENDING,
        total: total,
        finalTotal: total, // Transfer uchun total va finalTotal bir xil
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            sellingPrice: item.sellingPrice || item.price,
            originalPrice: item.originalPrice || item.price,
            total: item.price * item.quantity
          }))
        }
      },
      include: {
        customer: true,
        user: true,
        soldBy: true,
        items: {
          include: {
            product: true
          }
        },
        paymentSchedules: true
      }
    });

    // Mahsulot miqdorlarini darhol yangilash - manba filialdan kamaytirish va maqsad filialga qo'shish
    await this.updateProductQuantitiesForTransfer(transfer);

    // Inventar yangilangach, yangilangan tranzaksiyani qayta yuklaymiz (item miqdorlari moslashtirilgan bo'lishi mumkin)
    const refreshed = await this.prisma.transaction.findUnique({
      where: { id: transfer.id },
      include: {
        customer: true,
        user: true,
        soldBy: true,
        items: { include: { product: true } },
        paymentSchedules: true
      }
    });

    return { success: true, data: refreshed } as any;
  }


  async getTransfersByBranch(branchId: number) {
    const where: any = {
      type: TransactionType.TRANSFER
    };

    // Filialdan chiqgan va kirgan o'tkazmalarni olish
    where.OR = [
      { fromBranchId: branchId },
      { toBranchId: branchId }
    ];

    let tx = await this.prisma.transaction.findMany({
      where,
      include: {
        fromBranch: true,
        toBranch: true,
        soldBy: true,
        user: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
                branch: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return tx;
  }

  // Pending transferlarni olish
  async getPendingTransfers(branchId?: number) {
    const where: any = {
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING
    };

    if (branchId) {
      where.OR = [
        { fromBranchId: branchId },
        { toBranchId: branchId }
      ];
    }

    let tx = await this.prisma.transaction.findMany({
      where,
      include: {
        fromBranch: true,
        toBranch: true,
        soldBy: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return tx;
  }

  private async updateProductQuantitiesForTransfer(transfer: any) {
    for (const item of transfer.items) {
      if (!item.productId) continue;

      // Manba filialdan mahsulotni topish (ID bo'yicha). Branch bilan cheklamaymiz, chunki ayrim hollarda transfer.fromBranchId mos kelmasligi mumkin
      const sourceProduct = await this.prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!sourceProduct) {
        console.log(`❌ Source product not found for productId=${item.productId} in branch ${transfer.fromBranchId}`);
        continue;
      }

      // Agar manba mahsulot branchi transfer.fromBranchId dan farq qilsa, ogohlantiramiz va davom etamiz
      if (sourceProduct.branchId !== transfer.fromBranchId) {
        console.log(`⚠️ Source product branch (${sourceProduct.branchId}) differs from transfer.fromBranchId (${transfer.fromBranchId}). Proceeding with actual source branch.`);
      }

      // Haqiqiy ko'chiriladigan miqdor: mavjud qolgan son bilan cheklaymiz
      const requestedQty = Number(item.quantity) || 0;
      const availableQty = Number(sourceProduct.quantity) || 0;
      const transferQty = Math.min(Math.max(0, requestedQty), availableQty);

      console.log(`🔄 Processing transfer item: ${sourceProduct.name} (requested: ${requestedQty}, available: ${availableQty}, willTransfer: ${transferQty})`);

      if (transferQty <= 0) {
        console.log('⚠️ Nothing to transfer for this item');
        continue;
      }

      // Manba filialdan kamaytirish
      const newSourceQty = Math.max(0, availableQty - transferQty);
      await this.prisma.product.update({
        where: { id: sourceProduct.id },
        data: {
          quantity: newSourceQty,
          status: newSourceQty === 0 ? 'SOLD' : 'IN_STORE'
        }
      });
      console.log(`📤 Source product updated: ${sourceProduct.name}, ${availableQty} -> ${newSourceQty}`);

      // Maqsad filialda mahsulotni topish yoki yaratish
      let targetProduct: any = null;

      // Prefer barcode if available on source product or item.product
      const barcode = (item as any).product?.barcode || sourceProduct.barcode;
      if (barcode) {
        targetProduct = await this.prisma.product.findFirst({
          where: { barcode, branchId: transfer.toBranchId }
        });
        if (targetProduct) {
          console.log(`✅ Found existing target by barcode: ${targetProduct.name}`);
        }
      }

      if (!targetProduct) {
        // Fallback to name+model match
        const name = (item as any).product?.name || sourceProduct.name;
        const model = (item as any).product?.model || sourceProduct.model || '';
        const searchConditions: any = {
          AND: [
            {
              OR: [
                { name: { equals: name, mode: 'insensitive' } },
                { name: { contains: name, mode: 'insensitive' } },
                { name: { contains: name?.trim?.() || name, mode: 'insensitive' } }
              ]
            },
            { branchId: transfer.toBranchId }
          ]
        };
        if (model && model.trim()) {
          searchConditions.AND.push({
            OR: [
              { model: { equals: model, mode: 'insensitive' } },
              { model: { contains: model, mode: 'insensitive' } },
              { model: { contains: model.trim(), mode: 'insensitive' } }
            ]
          });
        } else {
          searchConditions.AND.push({ OR: [{ model: null }, { model: '' }, { model: { equals: '', mode: 'insensitive' } }] });
        }
        targetProduct = await this.prisma.product.findFirst({ where: searchConditions });
      }

      if (targetProduct) {
        const newQuantity = (Number(targetProduct.quantity) || 0) + transferQty;
        await this.prisma.product.update({
          where: { id: targetProduct.id },
          data: {
            quantity: newQuantity,
            status: 'IN_WAREHOUSE',
            bonusPercentage: sourceProduct?.bonusPercentage ?? targetProduct.bonusPercentage
          }
        });
        console.log(`📥 Updated target product ${targetProduct.name}: +${transferQty} -> ${newQuantity}`);
      } else {
        // Create new product at target
        const safeBarcode = barcode || `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
          const newProduct = await this.prisma.product.create({
            data: {
              name: (item as any).product?.name || sourceProduct.name,
              barcode: safeBarcode,
              model: (item as any).product?.model || sourceProduct.model,
              price: (item as any).product?.price || sourceProduct.price,
              quantity: transferQty,
              status: 'IN_WAREHOUSE',
              branchId: transfer.toBranchId,
              categoryId: (item as any).product?.categoryId || sourceProduct.categoryId,
              marketPrice: (item as any).product?.marketPrice || sourceProduct.marketPrice,
              bonusPercentage: sourceProduct?.bonusPercentage ?? (item as any).product?.bonusPercentage ?? 0
            }
          });
          console.log(`✅ New target product created: ${newProduct.name} (+${transferQty})`);
        } catch (error: any) {
          if (error?.code === 'P2002') {
            const uniqueBarcode = `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newProduct = await this.prisma.product.create({
              data: {
                name: (item as any).product?.name || sourceProduct.name,
                barcode: uniqueBarcode,
                model: (item as any).product?.model || sourceProduct.model,
                price: (item as any).product?.price || sourceProduct.price,
                quantity: transferQty,
                status: 'IN_WAREHOUSE',
                branchId: transfer.toBranchId,
                categoryId: (item as any).product?.categoryId || sourceProduct.categoryId,
                marketPrice: (item as any).product?.marketPrice || sourceProduct.marketPrice,
                bonusPercentage: sourceProduct?.bonusPercentage ?? (item as any).product?.bonusPercentage ?? 0
              }
            });
            console.log(`✅ New target product created with unique barcode: ${newProduct.name} (+${transferQty})`);
          } else {
            throw error;
          }
        }
      }

      // Agar transfer cheklangan bo'lsa, transactionItem miqdorini ham moslashtiramiz
      if (transferQty !== requestedQty) {
        await this.prisma.transactionItem.update({
          where: { id: item.id },
          data: { quantity: transferQty, total: (item.price || 0) * transferQty }
        }).catch(() => {});
        console.log(`ℹ️ Transaction item ${item.id} quantity adjusted from ${requestedQty} to ${transferQty}`);
      }
    }
  }

  async approveTransfer(id: number, approvedById: number) {
    // Validate that id is provided and is a valid number
    if (id === undefined || id === null || isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid transaction ID provided');
    }

    const transaction = await this.findOne(id);
    
    if (transaction.type !== TransactionType.TRANSFER) {
      throw new BadRequestException('Only transfer transactions can be approved');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending');
    }

    // O'tkazmani tasdiqlash - mahsulotlar allaqachon ko'chirilgan
    return (this.prisma as any).transaction.update({
      where: { id },
      data: {
        status: TransactionStatus.COMPLETED,
        userId: approvedById
      }
    });
  }

  async rejectTransfer(id: number) {
    // Validate that id is provided and is a valid number
    if (id === undefined || id === null || isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid transaction ID provided');
    }

    const transaction = await this.findOne(id);
    
    if (transaction.type !== TransactionType.TRANSFER) {
      throw new BadRequestException('Only transfer transactions can be rejected');
    }

    return (this.prisma as any).transaction.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED }
    });
  }

  // Statistika
  async getStatistics(branchId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    const whereOr: any = [];
    
    if (branchId) {
      whereOr.push({ fromBranchId: branchId });
      whereOr.push({ toBranchId: branchId });
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Agar branchId berilgan bo'lsa, OR shartini qo'shamiz
    if (whereOr.length > 0) {
      where.OR = whereOr;
    }

    // Credit va daily repaymentlar uchun where clause
    const repaymentWhere: any = {};
    if (branchId) {
      repaymentWhere.branchId = branchId;
    }
    if (startDate || endDate) {
      repaymentWhere.paidAt = {};
      if (startDate) repaymentWhere.paidAt.gte = new Date(startDate);
      if (endDate) repaymentWhere.paidAt.lte = new Date(endDate);
    }

    // Get credit and daily repayments separately to avoid potential Prisma client issues
    let creditRepaymentsCash: any = { _sum: { amount: 0 }, _count: 0 };
    let creditRepaymentsCard: any = { _sum: { amount: 0 }, _count: 0 };
    let dailyRepaymentsCash: any = { _sum: { amount: 0 }, _count: 0 };
    let dailyRepaymentsCard: any = { _sum: { amount: 0 }, _count: 0 };

    try {
      [creditRepaymentsCash, creditRepaymentsCard, dailyRepaymentsCash, dailyRepaymentsCard] = await Promise.all([
        (this.prisma as any).creditRepayment.aggregate({
          where: { ...repaymentWhere, channel: 'CASH' },
          _sum: { amount: true },
          _count: true
        }),
        (this.prisma as any).creditRepayment.aggregate({
          where: { ...repaymentWhere, channel: 'CARD' },
          _sum: { amount: true },
          _count: true
        }),
        (this.prisma as any).dailyRepayment.aggregate({
          where: { ...repaymentWhere, channel: 'CASH' },
          _sum: { amount: true },
          _count: true
        }),
        (this.prisma as any).dailyRepayment.aggregate({
          where: { ...repaymentWhere, channel: 'CARD' },
          _sum: { amount: true },
          _count: true
        })
      ]);
    } catch (error) {
      console.warn('Failed to fetch repayment statistics:', error);
      // Use default values if repayment tables don't exist or have issues
    }

    const [totalSales, creditSales, cashSales, cardSales, purchases, transfers, upfrontCashSales, upfrontCardSales] = await Promise.all([
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.SALE },
        _sum: { finalTotal: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.SALE, paymentType: PaymentType.CREDIT },
        _sum: { finalTotal: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.SALE, paymentType: PaymentType.CASH },
        _sum: { finalTotal: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.SALE, paymentType: PaymentType.CARD },
        _sum: { finalTotal: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.PURCHASE },
        _sum: { finalTotal: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.TRANSFER },
        _sum: { finalTotal: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.SALE, upfrontPaymentType: 'CASH' },
        _sum: { downPayment: true, amountPaid: true },
        _count: true
      }),
      (this.prisma as any).transaction.aggregate({
        where: { ...where, type: TransactionType.SALE, upfrontPaymentType: 'CARD' },
        _sum: { downPayment: true, amountPaid: true },
        _count: true
      })
    ]);

    // Calculate total repayments by channel
    const totalCashRepayments = (creditRepaymentsCash._sum.amount || 0) + (dailyRepaymentsCash._sum.amount || 0);
    const totalCardRepayments = (creditRepaymentsCard._sum.amount || 0) + (dailyRepaymentsCard._sum.amount || 0);
    const totalRepayments = totalCashRepayments + totalCardRepayments;

    return {
      totalSales: totalSales._sum.finalTotal || 0,
      totalTransactions: totalSales._count || 0,
      creditSales: creditSales._sum.finalTotal || 0,
      creditTransactions: creditSales._count || 0,
      cashSales: cashSales._sum.finalTotal || 0,
      cashTransactions: cashSales._count || 0,
      cardSales: cardSales._sum.finalTotal || 0,
      cardTransactions: cardSales._count || 0,
      totalPurchases: purchases._sum.finalTotal || 0,
      purchaseTransactions: purchases._count || 0,
      totalTransfers: transfers._sum.finalTotal || 0,
      transferTransactions: transfers._count || 0,
      upfrontCashTotal: (upfrontCashSales._sum.downPayment || 0) + (upfrontCashSales._sum.amountPaid || 0),
      upfrontCashTransactions: upfrontCashSales._count || 0,
      upfrontCardTotal: (upfrontCardSales._sum.downPayment || 0) + (upfrontCardSales._sum.amountPaid || 0),
      upfrontCardTransactions: upfrontCardSales._count || 0,
      // Add repayment totals
      creditRepaymentsCash: totalCashRepayments,
      creditRepaymentsCard: totalCardRepayments,
      totalCreditRepayments: totalRepayments,
      creditRepaymentTransactions: (creditRepaymentsCash._count || 0) + (creditRepaymentsCard._count || 0) + (dailyRepaymentsCash._count || 0) + (dailyRepaymentsCard._count || 0)
    };
  }

  // Currency conversion methods
  async getTransactionWithCurrencyConversion(id: number, branchId?: number) {
    const transaction = await this.findOne(id);
    if (!transaction) return null;

    // Convert totals to som
    const totalInSom = await this.currencyExchangeRateService.convertCurrency(
      transaction.total,
      'USD',
      'UZS',
      branchId || transaction.fromBranchId || undefined,
    );

    const finalTotalInSom = await this.currencyExchangeRateService.convertCurrency(
      transaction.finalTotal,
      'USD',
      'UZS',
      branchId || transaction.fromBranchId || undefined,
    );

    return {
      ...transaction,
      totalInSom,
      finalTotalInSom,
      totalInDollar: transaction.total,
      finalTotalInDollar: transaction.finalTotal,
    };
  }

  async getTransactionsWithCurrencyConversion(branchId?: number, startDate?: string, endDate?: string) {
    const result = await this.findAll({ branchId, startDate, endDate });
    const transactions = result.transactions;
    
    // Convert all transaction totals to som
    const transactionsWithCurrency = await Promise.all(
      transactions.map(async (transaction) => {
        const totalInSom = await this.currencyExchangeRateService.convertCurrency(
          transaction.total,
          'USD',
          'UZS',
          branchId || transaction.fromBranchId || undefined,
        );

        const finalTotalInSom = await this.currencyExchangeRateService.convertCurrency(
          transaction.finalTotal,
          'USD',
          'UZS',
          branchId || transaction.fromBranchId || undefined,
        );

        return {
          ...transaction,
          totalInSom,
          finalTotalInSom,
          totalInDollar: transaction.total,
          finalTotalInDollar: transaction.finalTotal,
        };
      })
    );

    return {
      ...result,
      transactions: transactionsWithCurrency,
    };
  }

  /**
   * Avtomatik bonus hisoblash va yaratish
   * CASHIER bozor narxini o'zgartirib, bozor narxidan qimmatroq sotsa, 
   * sotish narxidan bozor narxini ayirib, ayirmaning product ichidagi bonus foizini hisoblab
   * belgilangan sotuvchiga bonus tariqasida qo'shilishi kerak
   */
  private async calculateAndCreateSalesBonuses(transaction: any, soldByUserId: number, createdById?: number) {
    try {

      // Sotuvchining branch ma'lumotini olish
      const seller = await this.prisma.user.findUnique({
        where: { id: soldByUserId },
        include: { branch: true }
      });

      if (!seller) {
        console.log(' Sotuvchi topilmadi, bonus hisoblanmaydi');
        return;
      }

      // Branch tekshiruvini majburiy qilmaymiz: avvalo tranzaksiya branchini ishlatamiz, yo'q bo'lsa sotuvchinikini, bo'lmasa branchsiz davom etamiz
      const branchContextId = transaction.fromBranchId || transaction.toBranchId || seller.branchId || null;

      console.log(' Sotuvchi topildi:', seller.username, 'Role:', seller.role, 'BranchContextId:', branchContextId, 'SellerBranch:', seller.branch?.name);

      // USD->UZS kursini aniqlash (branch bo'yicha, bo'lmasa global fallback)
      let usdToUzsRateBranch = 0;
      let usdToUzsRateGlobal = 0;
      try {
        usdToUzsRateBranch = await this.currencyExchangeRateService.convertCurrency(1, 'USD', 'UZS', branchContextId || undefined);
      } catch {}
      try {
        usdToUzsRateGlobal = await this.currencyExchangeRateService.convertCurrency(1, 'USD', 'UZS', undefined);
      } catch {}
      const usdToSomRate = (usdToUzsRateBranch && usdToUzsRateBranch > 1)
        ? usdToUzsRateBranch
        : (usdToUzsRateGlobal && usdToUzsRateGlobal > 1)
          ? usdToUzsRateGlobal
          : (usdToUzsRateBranch || usdToUzsRateGlobal || 1);
      console.log(' USD/UZS kursi tanlandi:', usdToSomRate, '(branch=', usdToUzsRateBranch, ', global=', usdToUzsRateGlobal, ')');

      // Bonus products qiymatini hisoblash - Frontend dan UZS da kelgan narhlarni ishlatish
      console.log('\n Bonus products qidirilmoqda, transaction ID:', transaction.id);
      
      const bonusProducts = await this.prisma.transactionBonusProduct.findMany({
        where: { transactionId: transaction.id },
        include: { product: true }
      });

      console.log(' Database dan topilgan bonus products:', bonusProducts.length, 'ta');
      console.log(' Bonus products ma\'lumotlari:', JSON.stringify(bonusProducts, null, 2));

      let totalBonusProductsValue = 0;
      let totalBonusProductsCount = 0;
      if (bonusProducts.length > 0) {
        console.log('\n Bonus products topildi:', bonusProducts.length, 'ta');
        for (const bonusProduct of bonusProducts) {
          console.log(`\n Bonus product tekshirilmoqda:`);
          console.log(`  - Product ID: ${bonusProduct.productId}`);
          console.log(`  - Product name: ${bonusProduct.product?.name}`);
          console.log(`  - Product price (USD): ${bonusProduct.product?.price}`);
          console.log(`  - Quantity: ${bonusProduct.quantity}`);
          
          // Kurs xizmatidan foydalanib USD -> UZS ga aniq konvertatsiya (filial konteksti bilan)
          const productPriceInUzs = Math.round(Number(bonusProduct.product?.price || 0) * usdToSomRate);
          const productTotalValue = productPriceInUzs * bonusProduct.quantity;
          totalBonusProductsValue += productTotalValue;
          totalBonusProductsCount += Number(bonusProduct.quantity || 0);
          console.log(`  - Price in UZS (calculated): ${productPriceInUzs.toLocaleString()} som`);
          console.log(`  - Total value: ${productTotalValue.toLocaleString()} som`);
        }
        console.log('\n Jami bonus products qiymati:', Math.round(totalBonusProductsValue).toLocaleString(), 'som');
      } else {
        console.log(' Bonus products topilmadi yoki bo\'sh');
        // FALLBACK: Transaction ichidagi nol narxli (bonus sifatida yuborilgan) itemlardan foydalanamiz
        // Shart: sellingPrice == 0 yoki price == 0 bo'lsa, bu item bonus deb qabul qilamiz
        const potentialBonusItems = (transaction.items || []).filter((it: any) => {
          const sp = Number(it.sellingPrice ?? it.price ?? 0);
          const p = Number(it.price ?? 0);
          return (sp === 0 || p === 0) && (it.productId != null);
        });

        if (potentialBonusItems.length > 0) {
          console.log(` Fallback: ${potentialBonusItems.length} ta nol narxli item topildi, bonus sifatida hisoblaymiz`);
          const createdFallbackBonusProducts: any[] = [];
          for (const bi of potentialBonusItems) {
            // Product bazaviy narxini USD dan UZS ga o'tkazamiz
            const dbProduct = bi.product || (bi.productId
              ? await this.prisma.product.findUnique({ where: { id: Number(bi.productId) } })
              : null);
            const unitCostUZS = dbProduct?.price
              ? Math.round(Number(dbProduct.price) * usdToSomRate)
              : 0;
            const qty = Number(bi.quantity || 1);
            const itemValue = unitCostUZS * qty;
            totalBonusProductsValue += itemValue;
            totalBonusProductsCount += qty;
            console.log(`  Fallback item productId=${bi.productId} qty=${qty} unitCostUZS=${unitCostUZS} total=${itemValue}`);

            // Ma'lumotlar yaxlitligi uchun TransactionBonusProduct yozuvini ham yaratib qo'yamiz (agar productId mavjud bo'lsa)
            if (bi.productId) {
              try {
                const created = await this.prisma.transactionBonusProduct.create({
                  data: {
                    transactionId: transaction.id,
                    productId: Number(bi.productId),
                    quantity: qty,
                  }
                });
                createdFallbackBonusProducts.push(created);
              } catch (e) {
                console.warn(' Fallback TransactionBonusProduct yaratishda xatolik:', e?.message || e);
              }
            }
          }
          console.log(' Fallback jami bonus qiymati:', Math.round(totalBonusProductsValue).toLocaleString(), 'som');
          if (createdFallbackBonusProducts.length > 0) {
            console.log(` ${createdFallbackBonusProducts.length} ta fallback TransactionBonusProduct yozuvi yaratildi`);
          }
        }
      }

      // Transaction darajasida umumiy narx farqini jamlash uchun akkumulyator
      let totalPriceDifferenceForTransaction = 0;

      // 1-bosqich: Har bir mahsulot uchun narx farqini hisoblab, jami farqni yig'ish
      const itemDiffs: Array<{
        item: any;
        productInfo: any;
        sellingPrice: number;
        quantity: number;
        bonusPercentage: number;
        costInUzs: number;
        priceDifference: number;
      }> = [];
      // Arzon sotilgan mahsulotlar uchun batafsil ro'yxat va tranzaksiya darajasida umumiy yig'indilar
      const negativeItems: Array<{
        item: any;
        productInfo: any;
        sellingPrice: number;
        quantity: number;
        costInUzs: number;
        lossAmount: number;
      }> = [];
      let totalSellingAll = 0;
      let totalCostAll = 0;

      for (const item of transaction.items) {
        console.log('\n Mahsulot tekshirilmoqda (precompute):', item.productName);

        // Bonus sifatida yuborilgan nol narxli qatordan jamlashni chiqarib tashlaymiz
        const spCandidate = Number(item.sellingPrice ?? item.price ?? 0);
        const pCandidate = Number(item.price ?? 0);
        const isBonusLine = (spCandidate === 0 || pCandidate === 0) && (item.productId != null);
        if (isBonusLine) {
          console.log('   - Nol narxli bonus qator, jamlashdan chiqarib tashlandi');
          continue;
        }

        // Sotish narxini doim UZS da ishlatamiz.
        // Agar item.sellingPrice mavjud bo'lsa, u frontenddan UZS ko'rinishida keladi va BE tarafida konvertatsiya qilinmaydi.
        // Aks holda, item.price USD bo'lishi mumkin, shuning uchun USD -> UZS konvertatsiya qilamiz.
        let sellingPrice = 0;
        if (item?.sellingPrice != null) {
          const rawSp = Number(item.sellingPrice);
          sellingPrice = Math.round(rawSp);
        } else {
          const sellingPriceUsd = Number(item.price || 0);
          sellingPrice = Math.round(sellingPriceUsd * usdToSomRate);
        }
        const quantity = Number(item.quantity || 1);

        // Product ma'lumotlarini olish (agar item.product yo'q bo'lsa)
        let productInfo = item.product;
        let bonusPercentage = Number(productInfo?.bonusPercentage || 0);

        if (!productInfo || bonusPercentage === 0) {
          if (item.productId) {
            const dbProduct = await this.prisma.product.findUnique({ where: { id: item.productId } });
            console.log(' Database dan product ma\'lumoti olindi:', dbProduct?.name);
            if (dbProduct) {
              productInfo = dbProduct;
              bonusPercentage = Number(dbProduct.bonusPercentage || 0);
            }
          }
        }

        const costInUzs = productInfo?.price
          ? Math.round(Number(productInfo.price) * usdToSomRate)
          : 0;
        const priceDifference = (sellingPrice > costInUzs && bonusPercentage > 0)
          ? (sellingPrice - costInUzs) * quantity
          : 0;

        // Tranzaksiya darajasida umumiy sotish va umumiy kelish yig'indilarini jamlash
        totalSellingAll += sellingPrice * quantity;
        totalCostAll += costInUzs * quantity;
        if (sellingPrice < costInUzs) {
          const loss = (costInUzs - sellingPrice) * quantity;
          negativeItems.push({ item, productInfo, sellingPrice, quantity, costInUzs, lossAmount: loss });
        }

        if (priceDifference > 0) {
          totalPriceDifferenceForTransaction += priceDifference;
          itemDiffs.push({ item, productInfo, sellingPrice, quantity, bonusPercentage, costInUzs, priceDifference });
        } else {
          console.log(' Bonus yaratilmadi (precompute):');
          if (sellingPrice <= costInUzs) console.log('   - Sotish narxi kelish narxidan yuqori emas');
          if (bonusPercentage <= 0) console.log('   - Mahsulotda bonus foizi yo\'q');
        }
      }

      console.log(`\n Jami narx farqi (transaction-level): ${totalPriceDifferenceForTransaction} som`);

      // Transaction darajasida sof ortiqcha pool (bonus mahsulotlar qiymati ayirilganidan keyin)
      const transactionNetExtraPool = Math.max(0, Math.round(totalPriceDifferenceForTransaction) - Math.round(totalBonusProductsValue));
      console.log(' Transaction net extra pool (after bonus products subtraction):', transactionNetExtraPool, 'som');

      // 2-bosqich: Sof ortiqchani (pool) ulushlab taqsimlab, keyin foizni qo'llash
      // Barcha itemlar bo'yicha hisoblangan bonuslarni bitta tranzaksiya-level bonus yozuviga jamlaymiz
      let totalBonusForSeller = 0;
      const perItemCalc: Array<{ name: string; model?: string | null; qty: number; share: number; netExtra: number; percent: number; bonus: number }>= [];
      for (const info of itemDiffs) {
        const { item, productInfo, sellingPrice, quantity, bonusPercentage, priceDifference } = info;

        const share = totalPriceDifferenceForTransaction > 0 ? (priceDifference / totalPriceDifferenceForTransaction) : 0;
        const netExtraAmount = Math.round(transactionNetExtraPool * share);
        const bonusAmount = Math.round(netExtraAmount * (bonusPercentage / 100));

        totalBonusForSeller += bonusAmount;
        perItemCalc.push({
          name: productInfo?.name || item.productName,
          model: productInfo?.model || null,
          qty: quantity,
          share,
          netExtra: netExtraAmount,
          percent: bonusPercentage,
          bonus: bonusAmount,
        });
      }

      // Determine a primary item (the one generating the bonus) for clearer description
      let primaryName: string | undefined;
      let primaryModel: string | null | undefined;
      let primarySellingPerUnit: number | undefined;
      let primaryCostPerUnit: number | undefined;
      let primaryPercent: number | undefined;
      if (perItemCalc.length === 1) {
        // Single item case
        const p = perItemCalc[0];
        const info = itemDiffs[0];
        primaryName = p.name;
        primaryModel = p.model || null;
        primarySellingPerUnit = Math.round(info.sellingPrice);
        primaryCostPerUnit = Math.round(info.costInUzs);
        primaryPercent = p.percent;
      } else if (perItemCalc.length > 1) {
        // Choose the item with the largest share
        let maxIdx = 0;
        for (let i = 1; i < perItemCalc.length; i++) {
          if (perItemCalc[i].share > perItemCalc[maxIdx].share) maxIdx = i;
        }
        const p = perItemCalc[maxIdx];
        const info = itemDiffs[maxIdx];
        primaryName = p.name;
        primaryModel = p.model || null;
        primarySellingPerUnit = Math.round(info.sellingPrice);
        primaryCostPerUnit = Math.round(info.costInUzs);
        primaryPercent = p.percent;
      }

      if (totalBonusForSeller > 0) {
        // Bonus products ma'lumotlarini kurs orqali UZS ga konvert qilib tayyorlaymiz
        const bonusProductsData = [] as any[];
        for (const bp of bonusProducts) {
          const priceInUzs = Math.round(Number(bp.product?.price || 0) * usdToSomRate);
          bonusProductsData.push({
            productId: bp.productId,
            productName: bp.product?.name || 'Номаълум махсулот',
            productModel: bp.product?.model || null,
            productCode: bp.product?.barcode || 'N/A',
            quantity: bp.quantity,
            price: priceInUzs,
            totalValue: priceInUzs * bp.quantity
          });
        }

        const sellingTotal = Math.round(totalSellingAll);
        const costPlusBonus = Math.round(totalCostAll) + Math.round(totalBonusProductsValue);
        const transactionNetSurplus = sellingTotal - costPlusBonus;

        // primary* variables are computed above for use in both bonus and penalty descriptions

        const bonusData = {
          userId: soldByUserId,
          branchId: branchContextId || undefined,
          amount: totalBonusForSeller,
          reason: 'SALES_BONUS',
          description: `Mahsulot(lar)ni kelish narxidan yuqori bahoda sotgani uchun avtomatik bonus. Transaction ID: ${transaction.id}. ${primaryName ? `Mahsulot: ${primaryName} (${primaryModel || '-'})` + ', ' : ''}${primarySellingPerUnit ? `Sotish: ${primarySellingPerUnit.toLocaleString()} som, ` : `Sotish: ${sellingTotal.toLocaleString()} som, `}${primaryCostPerUnit ? `Kelish: ${primaryCostPerUnit.toLocaleString()} som, ` : `Kelish: ${Math.round(totalCostAll).toLocaleString()} som, `}Bonus mahsulotlar: ${Math.round(totalBonusProductsCount)} ta, ${Math.round(totalBonusProductsValue).toLocaleString()} som, Sof foyda: ${transactionNetSurplus.toLocaleString()} som, ${primaryPercent != null ? `Bonus foizi: ${primaryPercent}%, ` : ''}Bonus: ${totalBonusForSeller.toLocaleString()} som.`,
          bonusProducts: bonusProductsData.length > 0 ? bonusProductsData : null,
          transactionId: transaction.id,
          bonusDate: new Date().toISOString()
        } as any;

        console.log(' Transaction-level BONUS yaratilmoqda:', bonusData);
        await this.bonusService.create(bonusData, createdById || soldByUserId);
        console.log(` BONUS YARATILDI (transaction-level): ${totalBonusForSeller} som`);
      }

      // Transaction darajasida jami (foyda yoki kamomad) ni hisoblab, database ga saqlash
      // Formulalar:
      //   sellingTotal = totalSellingAll
      //   costPlusBonus = totalCostAll + totalBonusProductsValue
      //   grossDiffAfterBonusCost = sellingTotal - costPlusBonus
      const sellingTotal = Math.round(totalSellingAll);
      const costPlusBonus = Math.round(totalCostAll) + Math.round(totalBonusProductsValue);
      const grossDiffAfterBonusCost = sellingTotal - costPlusBonus; // manfiy bo'lishi ham mumkin
      try {
        console.log(' Transaction-level extraProfit saqlanmoqda (gross diff, bonus cost bilan):', grossDiffAfterBonusCost, 'som');
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { extraProfit: grossDiffAfterBonusCost }
        });
      } catch (e) {
        console.error(' extraProfit ni saqlashda xatolik:', e);
      }

      console.log(' BONUS CALCULATION COMPLETED\n');
      console.log(' Penalty check (with bonus cost): selling=', sellingTotal, ' cost+bonus=', costPlusBonus, ' grossDiff=', grossDiffAfterBonusCost);
      if (grossDiffAfterBonusCost < 0) {
        const netDeficit = Math.abs(grossDiffAfterBonusCost);
        try {
          // Build bonusProducts payload once for penalties as well
          const penaltyBonusProductsData = [] as any[];
          for (const bp of bonusProducts) {
            const priceInUzs = Math.round(Number(bp.product?.price || 0) * usdToSomRate);
            penaltyBonusProductsData.push({
              productId: bp.productId,
              productName: bp.product?.name || 'Номаълум махсулот',
              productModel: bp.product?.model || null,
              productCode: bp.product?.barcode || 'N/A',
              quantity: bp.quantity,
              price: priceInUzs,
              totalValue: priceInUzs * bp.quantity
            });
          }
          const penaltyData = {
            userId: soldByUserId,
            branchId: branchContextId || undefined,
            amount: -netDeficit, // manfiy summa
            reason: 'SALES_PENALTY',
            description: `Arzon (kelish narxidan past) sotuv uchun umumiy jarima. Transaction ID: ${transaction.id}. ${primaryName ? `Mahsulot: ${primaryName} (${primaryModel || '-'})` + ', ' : ''}${primarySellingPerUnit ? `Sotish: ${primarySellingPerUnit.toLocaleString()} som, ` : `Sotish: ${sellingTotal.toLocaleString()} som, `}${primaryCostPerUnit ? `Kelish: ${primaryCostPerUnit.toLocaleString()} som, ` : `Kelish: ${Math.round(totalCostAll).toLocaleString()} som, `}Bonus mahsulotlar: ${Math.round(totalBonusProductsCount)} ta, ${Math.round(totalBonusProductsValue).toLocaleString()} som, Jami kamomad: ${netDeficit.toLocaleString()} som.`,
            bonusProducts: penaltyBonusProductsData.length > 0 ? penaltyBonusProductsData : null,
            transactionId: transaction.id,
            bonusDate: new Date().toISOString()
          } as any;
          console.log(' PENALTY BONUS yaratilmoqda:', penaltyData);
          await this.bonusService.create(penaltyData, createdById || soldByUserId);
          console.log(` PENALTY BONUS YARATILDI: ${-netDeficit} som (manfiy)`);
        } catch (e) {
          console.error(' Penalty bonus yaratishda xatolik:', e);
        }
      }
      // Agar umumiy natija manfiy bo'lmasa ham, ayrim mahsulotlar kelishdan past sotilgan bo'lsa, ularning jami zarari uchun jarima yozuvi yaratiladi
      else {
        const totalPerItemLoss = negativeItems.reduce((sum, n) => sum + (n.lossAmount || 0), 0);
        if (totalPerItemLoss > 0) {
          try {
            const penaltyData = {
              userId: soldByUserId,
              branchId: branchContextId || undefined,
              amount: -Math.round(totalPerItemLoss),
              reason: 'SALES_PENALTY',
              description: `Kelish narxidan past sotilgan mahsulotlar uchun jarima. Transaction ID: ${transaction.id}. Jami zarar: ${Math.round(totalPerItemLoss).toLocaleString()} som. Tafsilotlar: `
                + negativeItems.map(n => `${n.item.productName || n.productInfo?.name} (${n.productInfo?.model || '-'}) qty=${n.quantity}, sotish=${n.sellingPrice}, kelish=${n.costInUzs}, zarar=${n.lossAmount}`).join(' | '),
              bonusProducts: null,
              transactionId: transaction.id,
              bonusDate: new Date().toISOString()
            } as any;
            console.log(' PER-ITEM LOSS PENALTY yaratilmoqda:', penaltyData);
            await this.bonusService.create(penaltyData, createdById || soldByUserId);
            console.log(` PER-ITEM LOSS PENALTY YARATILDI: ${-Math.round(totalPerItemLoss)} som (manfiy)`);
          } catch (e) {
            console.error(' Per-item loss penalty yaratishda xatolik:', e);
          }
        }
      }
    } catch (error) {
      console.error(' Bonus hisoblashda xatolik:', error);
      // Bonus yaratishda xatolik bo'lsa ham, asosiy tranzaksiya davom etsin
    }
  }
}