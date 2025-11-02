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
exports.DefectiveLogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DefectiveLogService = class DefectiveLogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recalculatePaymentSchedules(transactionId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                items: true,
                paymentSchedules: true
            }
        });
        if (!transaction || (transaction.paymentType !== 'CREDIT' && transaction.paymentType !== 'INSTALLMENT')) {
            return;
        }
        if (transaction.paymentSchedules.length > 0) {
            await this.prisma.paymentSchedule.deleteMany({
                where: { transactionId }
            });
        }
        const allItems = transaction.items;
        const remainingItems = allItems.filter(item => item.quantity > 0);
        if (remainingItems.length === 0) {
            return;
        }
        let originalTotalPrincipal = 0;
        let originalWeightedPercentSum = 0;
        let originalPercentWeightBase = 0;
        let totalMonths = 0;
        for (const item of allItems) {
            const originalQuantity = item.quantity + (item.status === 'RETURNED' ? 0 : 0);
            const principal = (item.price || 0) * originalQuantity;
            originalTotalPrincipal += principal;
            if (item.creditPercent) {
                originalWeightedPercentSum += principal * (item.creditPercent || 0);
                originalPercentWeightBase += principal;
            }
            if (item.creditMonth) {
                totalMonths = Math.max(totalMonths, item.creditMonth || 0);
            }
        }
        let remainingTotalPrincipal = 0;
        let remainingWeightedPercentSum = 0;
        let remainingPercentWeightBase = 0;
        for (const item of remainingItems) {
            const principal = (item.price || 0) * (item.quantity || 0);
            remainingTotalPrincipal += principal;
            if (item.creditPercent) {
                remainingWeightedPercentSum += principal * (item.creditPercent || 0);
                remainingPercentWeightBase += principal;
            }
        }
        if (remainingTotalPrincipal > 0 && totalMonths > 0) {
            const originalUpfrontPayment = transaction.amountPaid || 0;
            const upfrontRatio = originalTotalPrincipal > 0 ? remainingTotalPrincipal / originalTotalPrincipal : 0;
            const proportionalUpfront = originalUpfrontPayment * upfrontRatio;
            const remainingPrincipal = Math.max(0, remainingTotalPrincipal - proportionalUpfront);
            const effectivePercent = remainingPercentWeightBase > 0 ? (remainingWeightedPercentSum / remainingPercentWeightBase) : 0;
            console.log('=== RECALCULATING PAYMENT SCHEDULE ===');
            console.log('originalTotalPrincipal:', originalTotalPrincipal);
            console.log('remainingTotalPrincipal:', remainingTotalPrincipal);
            console.log('originalUpfrontPayment:', originalUpfrontPayment);
            console.log('proportionalUpfront:', proportionalUpfront);
            console.log('remainingPrincipal:', remainingPrincipal);
            console.log('effectivePercent:', effectivePercent);
            const interestAmount = remainingPrincipal * effectivePercent;
            const remainingWithInterest = remainingPrincipal + interestAmount;
            const monthlyPayment = remainingWithInterest / totalMonths;
            let remainingBalance = remainingWithInterest;
            console.log('interestAmount:', interestAmount);
            console.log('remainingWithInterest:', remainingWithInterest);
            console.log('monthlyPayment:', monthlyPayment);
            const schedules = [];
            for (let month = 1; month <= totalMonths; month++) {
                const currentPayment = month === totalMonths ? remainingBalance : monthlyPayment;
                remainingBalance -= currentPayment;
                schedules.push({
                    transactionId,
                    month,
                    payment: currentPayment,
                    remainingBalance: Math.max(0, remainingBalance),
                    isPaid: false,
                    paidAmount: 0
                });
            }
            if (schedules.length > 0) {
                await this.prisma.paymentSchedule.createMany({
                    data: schedules
                });
            }
            await this.prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    total: remainingTotalPrincipal,
                    finalTotal: remainingWithInterest
                }
            });
        }
    }
    async create(createDefectiveLogDto) {
        const { productId, quantity, description, userId, branchId, actionType = 'DEFECTIVE', isFromSale, transactionId, customerId, cashAdjustmentDirection, cashAmount: cashAmountInput, exchangeWithProductId, replacementQuantity, replacementUnitPrice } = createDefectiveLogDto;
        const product = await this.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        }
        if (branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: branchId }
            });
            if (!branch) {
                throw new common_1.NotFoundException('Filial topilmadi');
            }
        }
        if (actionType === 'DEFECTIVE') {
            if (!isFromSale) {
                if (quantity > product.quantity) {
                    throw new common_1.BadRequestException(`Defective miqdori mavjud miqdordan ko'p bo'lishi mumkin emas. Mavjud: ${product.quantity}, so'ralgan: ${quantity}`);
                }
            }
        }
        let cashAmount = 0;
        let newQuantity = product.quantity;
        let newDefectiveQuantity = product.defectiveQuantity;
        let newReturnedQuantity = product.returnedQuantity;
        let newExchangedQuantity = product.exchangedQuantity;
        let newStatus = product.status;
        switch (actionType) {
            case 'DEFECTIVE':
                cashAmount = -(product.price * quantity);
                if (isFromSale) {
                    newQuantity = product.quantity;
                }
                else {
                    newQuantity = Math.max(0, product.quantity - quantity);
                }
                newDefectiveQuantity = product.defectiveQuantity + quantity;
                newStatus = newQuantity === 0 ? client_1.ProductStatus.DEFECTIVE : client_1.ProductStatus.IN_STORE;
                break;
            case 'FIXED':
                cashAmount = product.price * quantity;
                newDefectiveQuantity = Math.max(0, product.defectiveQuantity - quantity);
                newQuantity = product.quantity + quantity;
                newStatus = client_1.ProductStatus.IN_STORE;
                break;
            case 'RETURN':
                if (typeof cashAmountInput === 'number' && cashAdjustmentDirection) {
                    cashAmount = (cashAdjustmentDirection === 'PLUS' ? 1 : -1) * Math.abs(Number(cashAmountInput) || 0);
                }
                else {
                    cashAmount = -(product.price * quantity);
                }
                newReturnedQuantity = product.returnedQuantity + quantity;
                newStatus = client_1.ProductStatus.RETURNED;
                newQuantity = product.quantity + quantity;
                break;
            case 'EXCHANGE':
                if (typeof cashAmountInput === 'number' && cashAdjustmentDirection) {
                    cashAmount = (cashAdjustmentDirection === 'PLUS' ? 1 : -1) * Math.abs(Number(cashAmountInput) || 0);
                }
                else {
                    cashAmount = product.price * quantity;
                }
                newExchangedQuantity = product.exchangedQuantity + quantity;
                newStatus = client_1.ProductStatus.EXCHANGED;
                newQuantity = product.quantity + quantity;
                break;
            default:
                throw new common_1.BadRequestException('Noto\'g\'ri action type');
        }
        let shouldRecalculate = false;
        let recalcForTxId = null;
        const result = await this.prisma.$transaction(async (prisma) => {
            const defectiveLog = await prisma.defectiveLog.create({
                data: {
                    productId,
                    quantity,
                    description,
                    userId,
                    branchId,
                    cashAmount,
                    actionType
                },
                include: {
                    product: true,
                    user: true,
                    branch: true
                }
            });
            await prisma.product.update({
                where: { id: productId },
                data: {
                    quantity: newQuantity,
                    defectiveQuantity: newDefectiveQuantity,
                    returnedQuantity: newReturnedQuantity,
                    exchangedQuantity: newExchangedQuantity,
                    status: newStatus
                }
            });
            if (isFromSale && transactionId) {
                const tx = await prisma.transaction.findUnique({
                    where: { id: Number(transactionId) },
                    include: { items: true }
                });
                if (tx) {
                    const orig = tx.items.find(i => i.productId === productId);
                    if (orig) {
                        if (Number(quantity) > Number(orig.quantity)) {
                            throw new common_1.BadRequestException(`Tanlangan sotuvda mavjud miqdordan ko'p (${orig.quantity}) qaytarib/almashtirib bo'lmaydi`);
                        }
                        if (actionType === 'RETURN' || actionType === 'EXCHANGE') {
                            const remainingQty = Math.max(0, Number(orig.quantity) - Number(quantity));
                            if (remainingQty === 0) {
                                await prisma.transactionItem.update({
                                    where: { id: orig.id },
                                    data: {
                                        quantity: 0,
                                        total: 0,
                                        status: 'RETURNED'
                                    }
                                });
                            }
                            else {
                                const unitPrice = (orig.sellingPrice ?? orig.price) || 0;
                                await prisma.transactionItem.update({
                                    where: { id: orig.id },
                                    data: {
                                        quantity: remainingQty,
                                        total: remainingQty * unitPrice
                                    }
                                });
                            }
                            if (actionType === 'RETURN') {
                                const txBonusProducts = await prisma.transactionBonusProduct.findMany({ where: { transactionId: tx.id } });
                                if (txBonusProducts.length > 0) {
                                    for (const bp of txBonusProducts) {
                                        try {
                                            await prisma.product.update({
                                                where: { id: bp.productId },
                                                data: { quantity: { increment: Number(bp.quantity || 0) } }
                                            });
                                        }
                                        catch (_) { }
                                    }
                                    await prisma.transactionBonusProduct.deleteMany({ where: { transactionId: tx.id } });
                                }
                                await prisma.bonus.deleteMany({ where: { transactionId: tx.id } });
                                await prisma.transaction.update({ where: { id: tx.id }, data: { extraProfit: 0 } });
                            }
                        }
                        if (actionType === 'EXCHANGE') {
                            const replacementQty = Math.max(1, Number(replacementQuantity || quantity) || quantity);
                            const replProdId = Number(exchangeWithProductId);
                            const replPrice = Number(replacementUnitPrice ?? 0);
                            const existingRepl = await prisma.transactionItem.findFirst({
                                where: { transactionId: tx.id, productId: replProdId, price: replPrice },
                                orderBy: { createdAt: 'desc' }
                            });
                            if (existingRepl) {
                                await prisma.transactionItem.update({
                                    where: { id: existingRepl.id },
                                    data: {
                                        quantity: existingRepl.quantity + replacementQty,
                                        total: (existingRepl.quantity + replacementQty) * (existingRepl.sellingPrice ?? existingRepl.price)
                                    }
                                });
                            }
                            else {
                                await prisma.transactionItem.create({
                                    data: {
                                        transactionId: tx.id,
                                        productId: replProdId,
                                        quantity: replacementQty,
                                        price: replPrice,
                                        sellingPrice: replPrice,
                                        originalPrice: replPrice,
                                        total: replacementQty * replPrice
                                    }
                                });
                            }
                            const repl = await prisma.product.findUnique({ where: { id: replProdId } });
                            if (!repl) {
                                throw new common_1.NotFoundException('Almashtiriladigan mahsulot topilmadi');
                            }
                            if (replacementQty > repl.quantity) {
                                throw new common_1.BadRequestException(`Almashtirish miqdori mavjud miqdordan ko'p. Mavjud: ${repl.quantity}, so'ralgan: ${replacementQty}`);
                            }
                            await prisma.product.update({
                                where: { id: repl.id },
                                data: { quantity: Math.max(0, repl.quantity - replacementQty) }
                            });
                        }
                        const newItems = await prisma.transactionItem.findMany({ where: { transactionId: tx.id } });
                        const newTotal = newItems.reduce((s, it) => s + it.total, 0);
                        await prisma.transaction.update({
                            where: { id: tx.id },
                            data: { total: newTotal, finalTotal: newTotal }
                        });
                        if (tx.paymentType === 'CREDIT' || tx.paymentType === 'INSTALLMENT') {
                            shouldRecalculate = true;
                            recalcForTxId = tx.id;
                        }
                    }
                }
            }
            if (branchId) {
                await prisma.branch.update({
                    where: { id: branchId },
                    data: {
                        cashBalance: {
                            increment: cashAmount
                        }
                    }
                });
            }
            return defectiveLog;
        }, { timeout: 15000 });
        if (shouldRecalculate && recalcForTxId) {
            try {
                await this.recalculatePaymentSchedules(recalcForTxId);
            }
            catch (_) { }
        }
        return result;
    }
    async findAll(query = {}) {
        const { branchId, actionType, startDate, endDate } = query;
        const where = {};
        if (branchId) {
            where.branchId = parseInt(branchId);
        }
        if (actionType) {
            where.actionType = actionType;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        return this.prisma.defectiveLog.findMany({
            where,
            include: {
                product: true,
                user: true,
                branch: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findByProduct(productId) {
        return this.prisma.defectiveLog.findMany({
            where: { productId },
            include: {
                product: true,
                user: true,
                branch: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findOne(id) {
        const defectiveLog = await this.prisma.defectiveLog.findUnique({
            where: { id },
            include: {
                product: true,
                user: true,
                branch: true
            }
        });
        if (!defectiveLog) {
            throw new common_1.NotFoundException('Defective log topilmadi');
        }
        return defectiveLog;
    }
    async update(id, updateDefectiveLogDto) {
        const defectiveLog = await this.findOne(id);
        return this.prisma.defectiveLog.update({
            where: { id },
            data: updateDefectiveLogDto,
            include: {
                product: true,
                user: true,
                branch: true
            }
        });
    }
    async markAsFixed(productId, quantity, userId, branchId) {
        return this.create({
            productId,
            quantity,
            description: 'Mahsulot tuzatildi',
            userId,
            branchId,
            actionType: 'FIXED'
        });
    }
    async returnProduct(productId, quantity, description, userId, branchId) {
        return this.create({
            productId,
            quantity,
            description,
            userId,
            branchId,
            actionType: 'RETURN'
        });
    }
    async exchangeProduct(productId, quantity, description, userId, branchId) {
        return this.create({
            productId,
            quantity,
            description,
            userId,
            branchId,
            actionType: 'EXCHANGE'
        });
    }
    async remove(id) {
        const defectiveLog = await this.findOne(id);
        return this.prisma.defectiveLog.delete({
            where: { id }
        });
    }
    async getDefectiveProducts(branchId) {
        const where = {
            status: client_1.ProductStatus.DEFECTIVE
        };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.prisma.product.findMany({
            where,
            include: {
                category: true,
                branch: true,
                DefectiveLog: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
    }
    async getFixedProducts(branchId) {
        const where = {
            status: client_1.ProductStatus.FIXED
        };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.prisma.product.findMany({
            where,
            include: {
                category: true,
                branch: true,
                DefectiveLog: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
    }
    async getReturnedProducts(branchId) {
        const where = {
            status: client_1.ProductStatus.RETURNED
        };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.prisma.product.findMany({
            where,
            include: {
                category: true,
                branch: true,
                DefectiveLog: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
    }
    async getExchangedProducts(branchId) {
        const where = {
            status: client_1.ProductStatus.EXCHANGED
        };
        if (branchId) {
            where.branchId = branchId;
        }
        return this.prisma.product.findMany({
            where,
            include: {
                category: true,
                branch: true,
                DefectiveLog: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
    }
    async getStatistics(branchId, startDate, endDate) {
        const where = {};
        if (branchId) {
            where.branchId = branchId;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [defectiveStats, fixedStats, returnStats, exchangeStats, cashFlow] = await Promise.all([
            this.prisma.defectiveLog.aggregate({
                where: { ...where, actionType: 'DEFECTIVE' },
                _sum: { quantity: true, cashAmount: true },
                _count: true
            }),
            this.prisma.defectiveLog.aggregate({
                where: { ...where, actionType: 'FIXED' },
                _sum: { quantity: true, cashAmount: true },
                _count: true
            }),
            this.prisma.defectiveLog.aggregate({
                where: { ...where, actionType: 'RETURN' },
                _sum: { quantity: true, cashAmount: true },
                _count: true
            }),
            this.prisma.defectiveLog.aggregate({
                where: { ...where, actionType: 'EXCHANGE' },
                _sum: { quantity: true, cashAmount: true },
                _count: true
            }),
            this.prisma.defectiveLog.aggregate({
                where,
                _sum: { cashAmount: true }
            })
        ]);
        return {
            defectiveProducts: {
                quantity: defectiveStats._sum.quantity || 0,
                cashAmount: defectiveStats._sum.cashAmount || 0,
                count: defectiveStats._count || 0
            },
            fixedProducts: {
                quantity: fixedStats._sum.quantity || 0,
                cashAmount: fixedStats._sum.cashAmount || 0,
                count: fixedStats._count || 0
            },
            returnedProducts: {
                quantity: returnStats._sum.quantity || 0,
                cashAmount: returnStats._sum.cashAmount || 0,
                count: returnStats._count || 0
            },
            exchangedProducts: {
                quantity: exchangeStats._sum.quantity || 0,
                cashAmount: exchangeStats._sum.cashAmount || 0,
                count: exchangeStats._count || 0
            },
            totalCashFlow: cashFlow._sum.cashAmount || 0
        };
    }
};
exports.DefectiveLogService = DefectiveLogService;
exports.DefectiveLogService = DefectiveLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DefectiveLogService);
//# sourceMappingURL=defective-log.service.js.map