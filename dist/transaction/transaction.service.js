"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const currency_exchange_rate_service_1 = require("../currency-exchange-rate/currency-exchange-rate.service");
const bonus_service_1 = require("../bonus/bonus.service");
let TransactionService = class TransactionService {
    prisma;
    currencyExchangeRateService;
    bonusService;
    constructor(prisma, currencyExchangeRateService, bonusService) {
        this.prisma = prisma;
        this.currencyExchangeRateService = currencyExchangeRateService;
        this.bonusService = bonusService;
    }
    async create(createTransactionDto, userId) {
        const { items, customer, ...transactionData } = createTransactionDto;
        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new common_1.BadRequestException('User topilmadi');
            }
        }
        let customerId = null;
        if (customer) {
            const existingCustomer = await this.prisma.customer.findFirst({
                where: { phone: customer.phone }
            });
            if (existingCustomer) {
                customerId = existingCustomer.id;
                const updateData = {};
                if (customer.fullName && customer.fullName !== existingCustomer.fullName) {
                    updateData.fullName = customer.fullName;
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
            }
            else {
                const newCustomer = await this.prisma.customer.create({
                    data: {
                        fullName: customer.fullName ? customer.fullName : '',
                        phone: customer.phone ? customer.phone : '',
                        passportSeries: customer.passportSeries || null,
                        jshshir: customer.jshshir || null,
                        address: customer.address || null,
                    }
                });
                customerId = newCustomer.id;
            }
        }
        const upfrontPaymentType = transactionData.upfrontPaymentType;
        if (upfrontPaymentType && !['CASH', 'CARD', 'TERMINAL'].includes(upfrontPaymentType)) {
            throw new common_1.BadRequestException('Invalid upfrontPaymentType. Must be CASH, CARD, or TERMINAL');
        }
        const createdByUserId = userId ?? transactionData.userId ?? null;
        const soldByUserId = transactionData.soldByUserId ?? userId ?? createdByUserId ?? null;
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
        const upfrontPayment = Number(transactionData.downPayment || transactionData.amountPaid || 0) || 0;
        const remainingPrincipal = Math.max(0, computedTotal - upfrontPayment);
        const effectivePercent = percentWeightBase > 0 ? (weightedPercentSum / percentWeightBase) : 0;
        const interestAmount = transactionData.paymentType === client_1.PaymentType.CREDIT || transactionData.paymentType === client_1.PaymentType.INSTALLMENT
            ? remainingPrincipal * effectivePercent
            : 0;
        const remainingWithInterest = remainingPrincipal + interestAmount;
        const finalTotalOnce = upfrontPayment + remainingWithInterest;
        const { cashierId, ...cleanTransactionData } = transactionData;
        const transaction = await this.prisma.transaction.create({
            data: {
                ...cleanTransactionData,
                customerId,
                userId: createdByUserId || null,
                soldByUserId: soldByUserId || null,
                upfrontPaymentType: transactionData.upfrontPaymentType || 'CASH',
                termUnit: transactionData.termUnit || 'MONTHS',
                total: computedTotal,
                finalTotal: finalTotalOnce,
                remainingBalance: remainingWithInterest,
                ...(transactionData.termUnit === 'DAYS' ? {
                    days: transactionData.days || 0,
                    months: 0
                } : {
                    months: transactionData.months || 0,
                    days: 0
                }),
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        sellingPrice: item.sellingPrice || item.price,
                        originalPrice: item.originalPrice || item.price,
                        total: item.total || (item.price * item.quantity),
                        creditMonth: item.creditMonth,
                        creditPercent: item.creditPercent,
                        monthlyPayment: item.monthlyPayment || this.calculateMonthlyPayment(item)
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
        if (transaction.paymentType === client_1.PaymentType.CREDIT || transaction.paymentType === client_1.PaymentType.INSTALLMENT) {
            const isDays = transaction.termUnit === 'DAYS';
            if (isDays) {
                await this.createDailyPaymentSchedule(transaction.id, transaction.items, createTransactionDto.downPayment || 0);
            }
            else {
                await this.createPaymentSchedule(transaction.id, transaction.items, createTransactionDto.downPayment || 0);
            }
        }
        await this.updateProductQuantities(transaction);
        if (soldByUserId && transactionData.type === client_1.TransactionType.SALE) {
            const cashierId = transactionData.cashierId || userId;
            setTimeout(async () => {
                try {
                    await this.calculateAndCreateSalesBonuses(transaction, soldByUserId, cashierId);
                }
                catch (error) {
                    console.error('Delayed bonus calculation error:', error);
                }
            }, 2000);
        }
        return transaction;
    }
    calculateMonthlyPayment(item) {
        if (!item.creditMonth || !item.creditPercent)
            return 0;
        const totalWithInterest = item.price * item.quantity * (1 + item.creditPercent);
        return totalWithInterest / item.creditMonth;
    }
    async createDailyPaymentSchedule(transactionId, items, downPayment = 0) {
        const schedules = [];
        let totalPrincipal = 0;
        let weightedPercentSum = 0;
        let percentWeightBase = 0;
        let totalDays = 0;
        for (const item of items) {
            const principal = (item.price || 0) * (item.quantity || 0);
            totalPrincipal += principal;
            if (item.creditPercent) {
                weightedPercentSum += principal * (item.creditPercent || 0);
                percentWeightBase += principal;
            }
            if (item.creditMonth) {
                totalDays = Math.max(totalDays, item.creditMonth || 0);
            }
        }
        if (totalPrincipal > 0 && totalDays > 0) {
            const upfrontPayment = downPayment || 0;
            const remainingPrincipal = Math.max(0, totalPrincipal - upfrontPayment);
            const effectivePercent = percentWeightBase > 0 ? (weightedPercentSum / percentWeightBase) : 0;
            const interestAmount = remainingPrincipal * effectivePercent;
            const remainingWithInterest = remainingPrincipal + interestAmount;
            console.log('interestAmount:', interestAmount);
            console.log('remainingWithInterest:', remainingWithInterest);
            console.log('totalDays:', totalDays);
            schedules.push({
                transactionId,
                month: 1,
                payment: remainingWithInterest,
                remainingBalance: remainingWithInterest,
                isPaid: false,
                paidAmount: 0,
                dueDate: new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000),
                isDailyInstallment: true,
                daysCount: totalDays,
                installmentType: 'DAILY',
                totalDays: totalDays,
                remainingDays: totalDays
            });
        }
        if (schedules.length > 0) {
            await this.prisma.paymentSchedule.createMany({
                data: schedules
            });
        }
    }
    async createPaymentSchedule(transactionId, items, downPayment = 0) {
        const schedules = [];
        let totalPrincipal = 0;
        let weightedPercentSum = 0;
        let percentWeightBase = 0;
        let totalMonths = 0;
        for (const item of items) {
            const principal = (item.price || 0) * (item.quantity || 0);
            totalPrincipal += principal;
            if (item.creditPercent) {
                weightedPercentSum += principal * (item.creditPercent || 0);
                percentWeightBase += principal;
            }
            if (item.creditMonth) {
                totalMonths = Math.max(totalMonths, item.creditMonth || 0);
            }
        }
        if (totalPrincipal > 0 && totalMonths > 0) {
            const upfrontPayment = downPayment || 0;
            const remainingPrincipal = Math.max(0, totalPrincipal - upfrontPayment);
            const effectivePercent = percentWeightBase > 0 ? (weightedPercentSum / percentWeightBase) : 0;
            const interestAmount = remainingPrincipal * effectivePercent;
            const remainingWithInterest = remainingPrincipal + interestAmount;
            const monthlyPayment = remainingWithInterest / totalMonths;
            let remainingBalance = remainingWithInterest;
            console.log('interestAmount:', interestAmount);
            console.log('remainingWithInterest:', remainingWithInterest);
            console.log('monthlyPayment:', monthlyPayment);
            for (let month = 1; month <= totalMonths; month++) {
                const currentPayment = month === totalMonths ? remainingBalance : monthlyPayment;
                remainingBalance -= currentPayment;
                schedules.push({
                    transactionId,
                    month,
                    payment: currentPayment,
                    remainingBalance: Math.max(0, remainingBalance),
                    isPaid: false,
                    paidAmount: 0,
                    installmentType: 'MONTHLY',
                    totalMonths: totalMonths,
                    remainingMonths: totalMonths - month + 1
                });
            }
        }
        if (schedules.length > 0) {
            await this.prisma.paymentSchedule.createMany({
                data: schedules
            });
        }
    }
    async updateProductQuantities(transaction) {
        for (const item of transaction.items) {
            if (item.productId) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product)
                    continue;
                if (product.branchId !== transaction.fromBranchId) {
                    console.log(`⚠️ Product ${product.id} branch (${product.branchId}) differs from fromBranchId (${transaction.fromBranchId}) for transaction ${transaction.id}. Proceeding with actual product branch.`);
                }
                let newQuantity = product.quantity;
                let newStatus = product.status;
                if (transaction.type === 'SALE') {
                    newQuantity = Math.max(0, product.quantity - item.quantity);
                    newStatus = newQuantity === 0 ? 'SOLD' : 'IN_STORE';
                }
                else if (transaction.type === 'PURCHASE') {
                    newQuantity = product.quantity + item.quantity;
                    newStatus = 'IN_WAREHOUSE';
                }
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: newQuantity,
                        status: newStatus
                    }
                });
            }
        }
    }
    async findAll(query = {}) {
        const { page = '1', limit = query.limit === 'all' ? undefined : (query.limit || 'all'), type, status, branchId, customerId, userId, startDate, endDate, paymentType, upfrontPaymentType, productId } = query;
        const parsedPage = parseInt(page) || 1;
        const parsedLimit = limit && limit !== 'all' ? parseInt(limit) : undefined;
        console.log('=== BACKEND DEBUG ===');
        console.log('Query params:', query);
        console.log('BranchId:', branchId);
        console.log('UserId:', userId);
        const where = {};
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (branchId) {
            where.OR = [
                { fromBranchId: parseInt(branchId) },
                { toBranchId: parseInt(branchId) }
            ];
            console.log('Where clause:', where);
        }
        if (customerId)
            where.customerId = parseInt(customerId);
        if (userId) {
            where.OR = where.OR ? [
                ...where.OR,
                { soldByUserId: parseInt(userId) },
                { userId: parseInt(userId) }
            ] : [
                { soldByUserId: parseInt(userId) },
                { userId: parseInt(userId) }
            ];
        }
        if (paymentType)
            where.paymentType = paymentType;
        if (upfrontPaymentType)
            where.upfrontPaymentType = upfrontPaymentType;
        if (productId) {
            where.items = {
                some: {
                    productId: parseInt(productId)
                }
            };
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                customer: true,
                user: true,
                soldBy: true,
                fromBranch: true,
                toBranch: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: parsedLimit ? (parsedPage - 1) * parsedLimit : 0,
            take: parsedLimit,
        });
        const total = await this.prisma.transaction.count({ where });
        return {
            transactions,
            pagination: {
                page: parsedPage,
                limit: parsedLimit || total,
                total,
                pages: parsedLimit ? Math.ceil(total / parsedLimit) : 1
            }
        };
    }
    async findByProductId(productId, month) {
        console.log(`Finding transactions for productId: ${productId}`);
        const product = await this.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            console.log(`Product with ID ${productId} not found`);
            return {
                transactions: [],
                statusCounts: { PENDING: 0, COMPLETED: 0, CANCELLED: 0, total: 0 },
                typeCounts: { SALE: 0, PURCHASE: 0, TRANSFER: 0, RETURN: 0, WRITE_OFF: 0, STOCK_ADJUSTMENT: 0 }
            };
        }
        console.log(`Product found: ${product.name}`);
        const whereClause = {
            items: {
                some: {
                    productId: productId
                }
            }
        };
        if (month) {
            const [year, monthNum] = month.split('-');
            const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
            whereClause.createdAt = {
                gte: startDate,
                lte: endDate
            };
            console.log(`Filtering by month: ${month}, from ${startDate} to ${endDate}`);
        }
        const transactions = await this.prisma.transaction.findMany({
            where: whereClause,
            include: {
                customer: true,
                user: true,
                soldBy: true,
                fromBranch: true,
                toBranch: true,
                items: {
                    where: {
                        productId: productId
                    },
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const transactionsWithAmounts = transactions.map(transaction => {
            let calculatedTotal = transaction.totalAmount;
            if (!calculatedTotal || calculatedTotal === 0) {
                calculatedTotal = transaction.items.reduce((sum, item) => {
                    return sum + (item.total || (item.quantity * item.price));
                }, 0);
            }
            return {
                ...transaction,
                totalAmount: calculatedTotal
            };
        });
        console.log(`Found ${transactions.length} transactions for product ${productId}`);
        const statusCounts = {
            PENDING: 0,
            COMPLETED: 0,
            CANCELLED: 0,
            total: transactions.length
        };
        const typeCounts = {
            SALE: 0,
            PURCHASE: 0,
            TRANSFER: 0,
            RETURN: 0,
            WRITE_OFF: 0,
            STOCK_ADJUSTMENT: 0
        };
        transactionsWithAmounts.forEach(transaction => {
            statusCounts[transaction.status]++;
            typeCounts[transaction.type]++;
        });
        console.log('Status counts:', statusCounts);
        console.log('Type counts:', typeCounts);
        console.log('Transactions with amounts:', transactionsWithAmounts.map(t => ({ id: t.id, totalAmount: t.totalAmount, status: t.status, type: t.type })));
        return {
            transactions: transactionsWithAmounts,
            statusCounts,
            typeCounts
        };
    }
    async findOne(id) {
        if (id === undefined || id === null || isNaN(id) || id <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        let transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                customer: true,
                user: true,
                soldBy: true,
                fromBranch: true,
                toBranch: true,
                items: {
                    include: {
                        product: true
                    }
                },
                paymentSchedules: {
                    orderBy: { month: 'asc' },
                    include: { paidBy: true }
                }
            }
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        const hydrated = await this.hydrateMissingProducts([transaction]);
        return hydrated[0];
    }
    async findByType(type) {
        return this.prisma.transaction.findMany({
            where: {
                type: type,
                status: { not: 'CANCELLED' }
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async updateStatus(id, status, userId) {
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException('Invalid status');
        }
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        if (status === 'COMPLETED') {
            const pendingItems = await this.prisma.transactionItem.findMany({
                where: {
                    transactionId: id,
                    status: 'PENDING'
                }
            });
            if (pendingItems.length > 0) {
                throw new common_1.BadRequestException('Cannot complete transaction with pending items');
            }
        }
        const updatedTransaction = await this.prisma.transaction.update({
            where: { id },
            data: {
                status: status,
                updatedAt: new Date(),
                updatedBy: { connect: { id: +userId } }
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (status === 'COMPLETED' && transaction.type === 'DELIVERY') {
            await this.processDeliveryCompletion(transaction);
        }
        return updatedTransaction;
    }
    async processDeliveryCompletion(transaction) {
        for (const item of transaction.items) {
            await this.prisma.product.update({
                where: { id: item.productId },
                data: {
                    quantity: {
                        decrement: item.quantity
                    }
                }
            });
        }
    }
    async hydrateMissingProducts(transactions) {
        try {
            const missingIdsSet = new Set();
            for (const tr of transactions) {
                if (!Array.isArray(tr?.items))
                    continue;
                for (const it of tr.items) {
                    const raw = it?.productId;
                    const pid = raw == null ? null : Number(raw);
                    if (pid && !it?.product)
                        missingIdsSet.add(pid);
                }
            }
            const missingIds = Array.from(missingIdsSet);
            if (missingIds.length === 0)
                return transactions;
            const products = await this.prisma.product.findMany({
                where: { id: { in: missingIds } },
            });
            const idToProduct = {};
            for (const p of products)
                idToProduct[p.id] = p;
            for (const tr of transactions) {
                if (!Array.isArray(tr?.items))
                    continue;
                for (const it of tr.items) {
                    if (it && it.productId != null && !it.product) {
                        const pid = Number(it.productId);
                        it.product = (pid && idToProduct[pid]) ? idToProduct[pid] : null;
                    }
                }
            }
            return transactions;
        }
        catch (e) {
            return transactions;
        }
    }
    async update(id, updateTransactionDto) {
        if (id === undefined || id === null || isNaN(id) || id <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        const transaction = await this.findOne(id);
        if (transaction.status === client_1.TransactionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Completed transactions cannot be modified');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: updateTransactionDto,
            include: {
                customer: true,
                user: true,
                soldBy: true,
                fromBranch: true,
                toBranch: true,
                items: {
                    include: {
                        product: true
                    }
                },
                paymentSchedules: {
                    orderBy: { month: 'asc' }
                }
            }
        });
    }
    async remove(id, currentUser) {
        if (id === undefined || id === null || isNaN(id) || id <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        const transaction = await this.findOne(id);
        if (transaction.status === client_1.TransactionStatus.COMPLETED) {
            const role = currentUser?.role || currentUser?.userRole;
            if (role !== 'ADMIN') {
                throw new common_1.BadRequestException('Completed transactions cannot be deleted');
            }
        }
        return await this.prisma.$transaction(async (tx) => {
            for (const item of transaction.items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            quantity: { increment: item.quantity },
                            status: 'IN_STORE'
                        }
                    });
                }
            }
            try {
                await tx.creditRepayment.deleteMany({ where: { transactionId: id } });
            }
            catch { }
            try {
                await tx.dailyRepayment.deleteMany({ where: { transactionId: id } });
            }
            catch { }
            await tx.paymentSchedule.deleteMany({ where: { transactionId: id } });
            await tx.transactionItem.deleteMany({ where: { transactionId: id } });
            return tx.transaction.delete({ where: { id } });
        });
    }
    async getDebts(params) {
        const { branchId, customerId } = params || {};
        const where = {
            paymentType: {
                in: [client_1.PaymentType.CREDIT, client_1.PaymentType.INSTALLMENT]
            },
            status: { not: client_1.TransactionStatus.CANCELLED }
        };
        if (customerId)
            where.customerId = customerId;
        if (branchId) {
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
            const nextDue = schedules.find((s) => (s.paidAmount || 0) < (s.payment || 0) && !s.isPaid);
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
        const customerMap = new Map();
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
            const agg = customerMap.get(key);
            agg.totalPayable += d.totalPayable;
            agg.totalPaid += d.totalPaid;
            agg.outstanding += d.outstanding;
            agg.transactions.push(d);
        }
        const customers = Array.from(customerMap.values()).sort((a, b) => b.outstanding - a.outstanding);
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
    async getProductSales(params) {
        const { productId, branchId, startDate, endDate } = params || {};
        const where = {
            transaction: {
                type: client_1.TransactionType.SALE
            }
        };
        if (productId)
            where.productId = productId;
        if (branchId)
            where.transaction.fromBranchId = branchId;
        if (startDate || endDate) {
            where.transaction.createdAt = {};
            if (startDate)
                where.transaction.createdAt.gte = new Date(startDate);
            if (endDate)
                where.transaction.createdAt.lte = new Date(endDate);
        }
        const items = await this.prisma.transactionItem.findMany({
            where,
            include: {
                product: true,
                transaction: true
            },
            orderBy: { createdAt: 'desc' }
        });
        const productMap = new Map();
        const dailyMap = new Map();
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
            const pAgg = productMap.get(pid);
            pAgg.totalQuantity += it.quantity;
            pAgg.totalAmount += it.total;
            const d = it.transaction?.createdAt
                ? new Date(it.transaction.createdAt)
                : new Date(it.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!dailyMap.has(key)) {
                dailyMap.set(key, { date: key, totalQuantity: 0, totalAmount: 0 });
            }
            const dAgg = dailyMap.get(key);
            dAgg.totalQuantity += it.quantity;
            dAgg.totalAmount += it.total;
        }
        const products = Array.from(productMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
        const daily = Array.from(dailyMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
        const totals = products.reduce((acc, p) => {
            acc.totalQuantity += p.totalQuantity;
            acc.totalAmount += p.totalAmount;
            return acc;
        }, { totalQuantity: 0, totalAmount: 0 });
        return { products, daily, totals };
    }
    async getPaymentSchedules(transactionId) {
        if (transactionId === undefined || transactionId === null || isNaN(transactionId) || transactionId <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        const transaction = await this.findOne(transactionId);
        return transaction.paymentSchedules;
    }
    async updatePaymentStatus(transactionId, month, paid) {
        if (transactionId === undefined || transactionId === null || isNaN(transactionId) || transactionId <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        const schedule = await this.prisma.paymentSchedule.findFirst({
            where: { transactionId, month }
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Payment schedule not found');
        }
        return this.prisma.paymentSchedule.update({
            where: { id: schedule.id },
            data: {
                remainingBalance: paid ? 0 : schedule.remainingBalance
            }
        });
    }
    async createTransfer(transferData) {
        const { fromBranchId, toBranchId, items, ...data } = transferData;
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const transfer = await this.prisma.transaction.create({
            data: {
                ...data,
                type: client_1.TransactionType.TRANSFER,
                fromBranchId: fromBranchId,
                toBranchId: toBranchId,
                status: client_1.TransactionStatus.PENDING,
                total: total,
                finalTotal: total,
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
        await this.updateProductQuantitiesForTransfer(transfer);
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
        return { success: true, data: refreshed };
    }
    async getTransfersByBranch(branchId) {
        const where = {
            type: client_1.TransactionType.TRANSFER
        };
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
        tx = await this.hydrateMissingProducts(tx);
        return tx;
    }
    async getPendingTransfers(branchId) {
        const where = {
            type: client_1.TransactionType.TRANSFER,
            status: client_1.TransactionStatus.PENDING
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
        tx = await this.hydrateMissingProducts(tx);
        return tx;
    }
    async updateProductQuantitiesForTransfer(transfer) {
        for (const item of transfer.items) {
            if (!item.productId)
                continue;
            const sourceProduct = await this.prisma.product.findUnique({
                where: { id: item.productId }
            });
            if (!sourceProduct) {
                console.log(`❌ Source product not found for productId=${item.productId} in branch ${transfer.fromBranchId}`);
                continue;
            }
            if (sourceProduct.branchId !== transfer.fromBranchId) {
                console.log(`⚠️ Source product branch (${sourceProduct.branchId}) differs from transfer.fromBranchId (${transfer.fromBranchId}). Proceeding with actual source branch.`);
            }
            const requestedQty = Number(item.quantity) || 0;
            const availableQty = Number(sourceProduct.quantity) || 0;
            const transferQty = Math.min(Math.max(0, requestedQty), availableQty);
            console.log(`🔄 Processing transfer item: ${sourceProduct.name} (requested: ${requestedQty}, available: ${availableQty}, willTransfer: ${transferQty})`);
            if (transferQty <= 0) {
                console.log('⚠️ Nothing to transfer for this item');
                continue;
            }
            const newSourceQty = Math.max(0, availableQty - transferQty);
            await this.prisma.product.update({
                where: { id: sourceProduct.id },
                data: {
                    quantity: newSourceQty,
                    status: newSourceQty === 0 ? 'SOLD' : 'IN_STORE'
                }
            });
            console.log(`📤 Source product updated: ${sourceProduct.name}, ${availableQty} -> ${newSourceQty}`);
            let targetProduct = null;
            const barcode = item.product?.barcode || sourceProduct.barcode;
            if (barcode) {
                targetProduct = await this.prisma.product.findFirst({
                    where: { barcode, branchId: transfer.toBranchId }
                });
                if (targetProduct) {
                    console.log(`✅ Found existing target by barcode: ${targetProduct.name}`);
                }
            }
            if (!targetProduct) {
                const name = item.product?.name || sourceProduct.name;
                const model = item.product?.model || sourceProduct.model || '';
                const searchConditions = {
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
                }
                else {
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
            }
            else {
                const safeBarcode = barcode || `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                try {
                    const newProduct = await this.prisma.product.create({
                        data: {
                            name: item.product?.name || sourceProduct.name,
                            barcode: safeBarcode,
                            model: item.product?.model || sourceProduct.model,
                            price: item.product?.price || sourceProduct.price,
                            quantity: transferQty,
                            status: 'IN_WAREHOUSE',
                            branchId: transfer.toBranchId,
                            categoryId: item.product?.categoryId || sourceProduct.categoryId,
                            marketPrice: item.product?.marketPrice || sourceProduct.marketPrice,
                            bonusPercentage: sourceProduct?.bonusPercentage ?? item.product?.bonusPercentage ?? 0
                        }
                    });
                    console.log(`✅ New target product created: ${newProduct.name} (+${transferQty})`);
                }
                catch (error) {
                    if (error?.code === 'P2002') {
                        const uniqueBarcode = `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const newProduct = await this.prisma.product.create({
                            data: {
                                name: item.product?.name || sourceProduct.name,
                                barcode: uniqueBarcode,
                                model: item.product?.model || sourceProduct.model,
                                price: item.product?.price || sourceProduct.price,
                                quantity: transferQty,
                                status: 'IN_WAREHOUSE',
                                branchId: transfer.toBranchId,
                                categoryId: item.product?.categoryId || sourceProduct.categoryId,
                                marketPrice: item.product?.marketPrice || sourceProduct.marketPrice,
                                bonusPercentage: sourceProduct?.bonusPercentage ?? item.product?.bonusPercentage ?? 0
                            }
                        });
                        console.log(`✅ New target product created with unique barcode: ${newProduct.name} (+${transferQty})`);
                    }
                    else {
                        throw error;
                    }
                }
            }
            if (transferQty !== requestedQty) {
                await this.prisma.transactionItem.update({
                    where: { id: item.id },
                    data: { quantity: transferQty, total: (item.price || 0) * transferQty }
                }).catch(() => { });
                console.log(`ℹ️ Transaction item ${item.id} quantity adjusted from ${requestedQty} to ${transferQty}`);
            }
        }
    }
    async approveTransfer(id, approvedById) {
        if (id === undefined || id === null || isNaN(id) || id <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        const transaction = await this.findOne(id);
        if (transaction.type !== client_1.TransactionType.TRANSFER) {
            throw new common_1.BadRequestException('Only transfer transactions can be approved');
        }
        if (transaction.status !== client_1.TransactionStatus.PENDING) {
            throw new common_1.BadRequestException('Transaction is not pending');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: {
                status: client_1.TransactionStatus.COMPLETED,
                userId: approvedById
            }
        });
    }
    async rejectTransfer(id) {
        if (id === undefined || id === null || isNaN(id) || id <= 0) {
            throw new common_1.BadRequestException('Invalid transaction ID provided');
        }
        const transaction = await this.findOne(id);
        if (transaction.type !== client_1.TransactionType.TRANSFER) {
            throw new common_1.BadRequestException('Only transfer transactions can be rejected');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: { status: client_1.TransactionStatus.CANCELLED }
        });
    }
    async getStatistics(branchId, startDate, endDate) {
        const where = {};
        const whereOr = [];
        if (branchId) {
            whereOr.push({ fromBranchId: branchId });
            whereOr.push({ toBranchId: branchId });
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        if (whereOr.length > 0) {
            where.OR = whereOr;
        }
        const repaymentWhere = {};
        if (branchId) {
            repaymentWhere.branchId = branchId;
        }
        if (startDate || endDate) {
            repaymentWhere.paidAt = {};
            if (startDate)
                repaymentWhere.paidAt.gte = new Date(startDate);
            if (endDate)
                repaymentWhere.paidAt.lte = new Date(endDate);
        }
        let creditRepaymentsCash = { _sum: { amount: 0 }, _count: 0 };
        let creditRepaymentsCard = { _sum: { amount: 0 }, _count: 0 };
        let dailyRepaymentsCash = { _sum: { amount: 0 }, _count: 0 };
        let dailyRepaymentsCard = { _sum: { amount: 0 }, _count: 0 };
        try {
            [creditRepaymentsCash, creditRepaymentsCard, dailyRepaymentsCash, dailyRepaymentsCard] = await Promise.all([
                this.prisma.creditRepayment.aggregate({
                    where: { ...repaymentWhere, channel: 'CASH' },
                    _sum: { amount: true },
                    _count: true
                }),
                this.prisma.creditRepayment.aggregate({
                    where: { ...repaymentWhere, channel: 'CARD' },
                    _sum: { amount: true },
                    _count: true
                }),
                this.prisma.dailyRepayment.aggregate({
                    where: { ...repaymentWhere, channel: 'CASH' },
                    _sum: { amount: true },
                    _count: true
                }),
                this.prisma.dailyRepayment.aggregate({
                    where: { ...repaymentWhere, channel: 'CARD' },
                    _sum: { amount: true },
                    _count: true
                })
            ]);
        }
        catch (error) {
            console.warn('Failed to fetch repayment statistics:', error);
        }
        const [totalSales, creditSales, cashSales, cardSales, purchases, transfers, upfrontCashSales, upfrontCardSales] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.SALE },
                _sum: { finalTotal: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.SALE, paymentType: client_1.PaymentType.CREDIT },
                _sum: { finalTotal: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.SALE, paymentType: client_1.PaymentType.CASH },
                _sum: { finalTotal: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.SALE, paymentType: client_1.PaymentType.CARD },
                _sum: { finalTotal: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.PURCHASE },
                _sum: { finalTotal: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.TRANSFER },
                _sum: { finalTotal: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.SALE, upfrontPaymentType: 'CASH' },
                _sum: { downPayment: true, amountPaid: true },
                _count: true
            }),
            this.prisma.transaction.aggregate({
                where: { ...where, type: client_1.TransactionType.SALE, upfrontPaymentType: 'CARD' },
                _sum: { downPayment: true, amountPaid: true },
                _count: true
            })
        ]);
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
            creditRepaymentsCash: totalCashRepayments,
            creditRepaymentsCard: totalCardRepayments,
            totalCreditRepayments: totalRepayments,
            creditRepaymentTransactions: (creditRepaymentsCash._count || 0) + (creditRepaymentsCard._count || 0) + (dailyRepaymentsCash._count || 0) + (dailyRepaymentsCard._count || 0)
        };
    }
    async getTransactionWithCurrencyConversion(id, branchId) {
        const transaction = await this.findOne(id);
        if (!transaction)
            return null;
        const totalInSom = await this.currencyExchangeRateService.convertCurrency(transaction.total, 'USD', 'UZS', branchId || transaction.fromBranchId || undefined);
        const finalTotalInSom = await this.currencyExchangeRateService.convertCurrency(transaction.finalTotal, 'USD', 'UZS', branchId || transaction.fromBranchId || undefined);
        return {
            ...transaction,
            totalInSom,
            finalTotalInSom,
            totalInDollar: transaction.total,
            finalTotalInDollar: transaction.finalTotal,
        };
    }
    async getTransactionsWithCurrencyConversion(branchId, startDate, endDate) {
        const result = await this.findAll({ branchId, startDate, endDate });
        const transactions = result.transactions;
        const transactionsWithCurrency = await Promise.all(transactions.map(async (transaction) => {
            const totalInSom = await this.currencyExchangeRateService.convertCurrency(transaction.total, 'USD', 'UZS', branchId || transaction.fromBranchId || undefined);
            const finalTotalInSom = await this.currencyExchangeRateService.convertCurrency(transaction.finalTotal, 'USD', 'UZS', branchId || transaction.fromBranchId || undefined);
            return {
                ...transaction,
                totalInSom,
                finalTotalInSom,
                totalInDollar: transaction.total,
                finalTotalInDollar: transaction.finalTotal,
            };
        }));
        return {
            ...result,
            transactions: transactionsWithCurrency,
        };
    }
    async calculateAndCreateSalesBonuses(transaction, soldByUserId, createdById) {
        try {
            console.log(' BONUS CALCULATION STARTED');
            console.log('Transaction ID:', transaction.id);
            console.log('Sold by user ID:', soldByUserId);
            console.log('Created by ID (cashier):', createdById);
            const seller = await this.prisma.user.findUnique({
                where: { id: soldByUserId },
                include: { branch: true }
            });
            if (!seller) {
                console.log(' Sotuvchi topilmadi, bonus hisoblanmaydi');
                return;
            }
            const branchContextId = transaction.fromBranchId || transaction.toBranchId || seller.branchId || null;
            console.log(' Sotuvchi topildi:', seller.username, 'Role:', seller.role, 'BranchContextId:', branchContextId, 'SellerBranch:', seller.branch?.name);
            let usdToUzsRateBranch = 0;
            let usdToUzsRateGlobal = 0;
            try {
                usdToUzsRateBranch = await this.currencyExchangeRateService.convertCurrency(1, 'USD', 'UZS', branchContextId || undefined);
            }
            catch { }
            try {
                usdToUzsRateGlobal = await this.currencyExchangeRateService.convertCurrency(1, 'USD', 'UZS', undefined);
            }
            catch { }
            const usdToSomRate = (usdToUzsRateBranch && usdToUzsRateBranch > 1)
                ? usdToUzsRateBranch
                : (usdToUzsRateGlobal && usdToUzsRateGlobal > 1)
                    ? usdToUzsRateGlobal
                    : (usdToUzsRateBranch || usdToUzsRateGlobal || 1);
            console.log(' USD/UZS kursi tanlandi:', usdToSomRate, '(branch=', usdToUzsRateBranch, ', global=', usdToUzsRateGlobal, ')');
            console.log('\n Bonus products qidirilmoqda, transaction ID:', transaction.id);
            const bonusProducts = await this.prisma.transactionBonusProduct.findMany({
                where: { transactionId: transaction.id },
                include: { product: true }
            });
            console.log(' Database dan topilgan bonus products:', bonusProducts.length, 'ta');
            console.log(' Bonus products ma\'lumotlari:', JSON.stringify(bonusProducts, null, 2));
            let totalBonusProductsValue = 0;
            if (bonusProducts.length > 0) {
                console.log('\n Bonus products topildi:', bonusProducts.length, 'ta');
                for (const bonusProduct of bonusProducts) {
                    console.log(`\n Bonus product tekshirilmoqda:`);
                    console.log(`  - Product ID: ${bonusProduct.productId}`);
                    console.log(`  - Product name: ${bonusProduct.product?.name}`);
                    console.log(`  - Product price (USD): ${bonusProduct.product?.price}`);
                    console.log(`  - Quantity: ${bonusProduct.quantity}`);
                    const productPriceInUzs = Math.round(Number(bonusProduct.product?.price || 0) * usdToSomRate);
                    const productTotalValue = productPriceInUzs * bonusProduct.quantity;
                    totalBonusProductsValue += productTotalValue;
                    console.log(`  - Price in UZS (calculated): ${productPriceInUzs.toLocaleString()} som`);
                    console.log(`  - Total value: ${productTotalValue.toLocaleString()} som`);
                }
                console.log('\n Jami bonus products qiymati:', Math.round(totalBonusProductsValue).toLocaleString(), 'som');
            }
            else {
                console.log(' Bonus products topilmadi yoki bo\'sh');
                const potentialBonusItems = (transaction.items || []).filter((it) => {
                    const sp = Number(it.sellingPrice ?? it.price ?? 0);
                    const p = Number(it.price ?? 0);
                    return (sp === 0 || p === 0) && (it.productId != null);
                });
                if (potentialBonusItems.length > 0) {
                    console.log(` Fallback: ${potentialBonusItems.length} ta nol narxli item topildi, bonus sifatida hisoblaymiz`);
                    const createdFallbackBonusProducts = [];
                    for (const bi of potentialBonusItems) {
                        const dbProduct = bi.product || (bi.productId
                            ? await this.prisma.product.findUnique({ where: { id: Number(bi.productId) } })
                            : null);
                        const unitCostUZS = dbProduct?.price
                            ? Math.round(Number(dbProduct.price) * usdToSomRate)
                            : 0;
                        const qty = Number(bi.quantity || 1);
                        const itemValue = unitCostUZS * qty;
                        totalBonusProductsValue += itemValue;
                        console.log(`  Fallback item productId=${bi.productId} qty=${qty} unitCostUZS=${unitCostUZS} total=${itemValue}`);
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
                            }
                            catch (e) {
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
            let totalPriceDifferenceForTransaction = 0;
            const itemDiffs = [];
            const negativeItems = [];
            let totalSellingAll = 0;
            let totalCostAll = 0;
            for (const item of transaction.items) {
                console.log('\n Mahsulot tekshirilmoqda (precompute):', item.productName);
                let sellingPrice = 0;
                if (item?.sellingPrice != null) {
                    const rawSp = Number(item.sellingPrice);
                    if (rawSp > 0 && rawSp < Math.max(usdToSomRate / 2, 10000)) {
                        sellingPrice = Math.round(rawSp * usdToSomRate);
                    }
                    else {
                        sellingPrice = Math.round(rawSp);
                    }
                }
                else {
                    const sellingPriceUsd = Number(item.price || 0);
                    sellingPrice = Math.round(sellingPriceUsd * usdToSomRate);
                }
                const quantity = Number(item.quantity || 1);
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
                totalSellingAll += sellingPrice * quantity;
                totalCostAll += costInUzs * quantity;
                if (sellingPrice < costInUzs) {
                    const loss = (costInUzs - sellingPrice) * quantity;
                    negativeItems.push({ item, productInfo, sellingPrice, quantity, costInUzs, lossAmount: loss });
                }
                if (priceDifference > 0) {
                    totalPriceDifferenceForTransaction += priceDifference;
                    itemDiffs.push({ item, productInfo, sellingPrice, quantity, bonusPercentage, costInUzs, priceDifference });
                }
                else {
                    console.log(' Bonus yaratilmadi (precompute):');
                    if (sellingPrice <= costInUzs)
                        console.log('   - Sotish narxi kelish narxidan yuqori emas');
                    if (bonusPercentage <= 0)
                        console.log('   - Mahsulotda bonus foizi yo\'q');
                }
            }
            console.log(`\n Jami narx farqi (transaction-level): ${totalPriceDifferenceForTransaction} som`);
            const transactionNetExtraPool = Math.max(0, Math.round(totalPriceDifferenceForTransaction) - Math.round(totalBonusProductsValue));
            console.log(' Transaction net extra pool (after bonus products subtraction):', transactionNetExtraPool, 'som');
            for (const info of itemDiffs) {
                const { item, productInfo, sellingPrice, quantity, bonusPercentage, costInUzs, priceDifference } = info;
                const share = totalPriceDifferenceForTransaction > 0
                    ? (priceDifference / totalPriceDifferenceForTransaction)
                    : 0;
                const allocatedBonusProductsValue = Math.round(totalBonusProductsValue * share);
                const netExtraAmount = Math.round(transactionNetExtraPool * share);
                const bonusAmount = Math.round(netExtraAmount * (bonusPercentage / 100));
                console.log(' Bonus hisoblash (allocated):');
                console.log('  - Narx farqi (selling - cost):', priceDifference, 'som');
                console.log('  - Ajratilgan bonus products qiymati:', allocatedBonusProductsValue, 'som');
                console.log('  - Sof ortiqcha summa:', netExtraAmount, 'som');
                console.log('  - Bonus foizi:', bonusPercentage, '%');
                console.log('  - Bonus miqdori:', bonusAmount, 'som');
                if (bonusAmount > 0) {
                    const bonusProductsData = [];
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
                    const bonusData = {
                        userId: soldByUserId,
                        branchId: branchContextId || undefined,
                        amount: bonusAmount,
                        reason: 'SALES_BONUS',
                        description: `${productInfo?.name || item.productName} (${productInfo?.model || '-'}) mahsulotini kelish narxidan yuqori bahoda sotgani uchun avtomatik bonus. Transaction ID: ${transaction.id}, Sotish narxi: ${sellingPrice.toLocaleString()} som, Kelish narxi: ${Math.round(costInUzs).toLocaleString()} som, Miqdor: ${quantity}, Bonus mahsulotlar umumiy qiymati: ${totalBonusProductsValue.toLocaleString()} som, Ajratilgan ulush: ${allocatedBonusProductsValue.toLocaleString()} som, Sof ortiqcha: ${netExtraAmount.toLocaleString()} som, Bonus foizi: ${bonusPercentage}%`,
                        bonusProducts: bonusProductsData.length > 0 ? bonusProductsData : null,
                        transactionId: transaction.id,
                        bonusDate: new Date().toISOString()
                    };
                    console.log(' Bonus yaratilmoqda:', bonusData);
                    await this.bonusService.create(bonusData, createdById || soldByUserId);
                    console.log(` BONUS YARATILDI: ${bonusAmount} som`);
                    console.log(`   Mahsulot: ${productInfo?.name || item.productName}`);
                    console.log(`   Sotuvchi: ${seller.username} (ID: ${soldByUserId})`);
                    console.log(`   Yaratuvchi: Kassir (ID: ${createdById})`);
                }
            }
            const sellingTotal = Math.round(totalSellingAll);
            const costPlusBonus = Math.round(totalCostAll) + Math.round(totalBonusProductsValue);
            const grossDiffAfterBonusCost = sellingTotal - costPlusBonus;
            try {
                console.log(' Transaction-level extraProfit saqlanmoqda (gross diff, bonus cost bilan):', grossDiffAfterBonusCost, 'som');
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { extraProfit: grossDiffAfterBonusCost }
                });
            }
            catch (e) {
                console.error(' extraProfit ni saqlashda xatolik:', e);
            }
            console.log(' BONUS CALCULATION COMPLETED\n');
            console.log(' Penalty check (with bonus cost): selling=', sellingTotal, ' cost+bonus=', costPlusBonus, ' grossDiff=', grossDiffAfterBonusCost);
            if (grossDiffAfterBonusCost < 0) {
                const netDeficit = Math.abs(grossDiffAfterBonusCost);
                try {
                    const penaltyBonusProductsData = [];
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
                    const bonusProductsInfo = (bonusProducts && bonusProducts.length > 0)
                        ? ' Bonus mahsulotlar: ' + bonusProducts
                            .map(bp => `${bp.product?.name || 'Номаълум махсулот'} (${bp.product?.model || '-'}) qty=${bp.quantity}`)
                            .join(' | ')
                        : '';
                    const penaltyData = {
                        userId: soldByUserId,
                        branchId: branchContextId || undefined,
                        amount: -netDeficit,
                        reason: 'SALES_PENALTY',
                        description: `Arzon (kelish narxidan past) sotuv uchun umumiy jarima. Transaction ID: ${transaction.id}. Umumiy sotish: ${sellingTotal.toLocaleString()} som, Bonus mahsulotlar qiymati: ${Math.round(totalBonusProductsValue).toLocaleString()} som, Umumiy kelish: ${Math.round(totalCostAll).toLocaleString()} som, Jami kamomad: ${netDeficit.toLocaleString()} som. Tafsilotlar: `
                            + negativeItems.map(n => `${n.item.productName || n.productInfo?.name} (${n.productInfo?.model || '-'}) qty=${n.quantity}, sotish=${n.sellingPrice}, kelish=${n.costInUzs}, zarar=${n.lossAmount}`).join(' | ')
                            + bonusProductsInfo,
                        bonusProducts: penaltyBonusProductsData.length > 0 ? penaltyBonusProductsData : null,
                        transactionId: transaction.id,
                        bonusDate: new Date().toISOString()
                    };
                    console.log(' PENALTY BONUS yaratilmoqda:', penaltyData);
                    await this.bonusService.create(penaltyData, createdById || soldByUserId);
                    console.log(` PENALTY BONUS YARATILDI: ${-netDeficit} som (manfiy)`);
                }
                catch (e) {
                    console.error(' Penalty bonus yaratishda xatolik:', e);
                }
            }
        }
        catch (error) {
            console.error(' Bonus hisoblashda xatolik:', error);
        }
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        currency_exchange_rate_service_1.CurrencyExchangeRateService,
        bonus_service_1.BonusService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map