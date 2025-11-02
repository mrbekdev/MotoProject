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
exports.CashierReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CashierReportService = class CashierReportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCashierReportDto) {
        return this.prisma.cashierReport.create({
            data: createCashierReportDto,
            include: {
                cashier: true,
                branch: true,
            },
        });
    }
    async findAll(query = {}) {
        const { cashierId, branchId, startDate, endDate, limit = 100 } = query;
        const where = {};
        if (cashierId) {
            where.cashierId = parseInt(cashierId);
        }
        if (branchId) {
            where.branchId = parseInt(branchId);
        }
        if (startDate || endDate) {
            where.reportDate = {};
            if (startDate) {
                where.reportDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.reportDate.lte = new Date(endDate);
            }
        }
        return this.prisma.cashierReport.findMany({
            where,
            include: {
                cashier: true,
                branch: true,
            },
            orderBy: {
                reportDate: 'desc',
            },
            take: limit === 'all' ? undefined : parseInt(limit),
        });
    }
    async findOne(id) {
        return this.prisma.cashierReport.findUnique({
            where: { id },
            include: {
                cashier: true,
                branch: true,
            },
        });
    }
    async update(id, updateCashierReportDto) {
        return this.prisma.cashierReport.update({
            where: { id },
            data: updateCashierReportDto,
            include: {
                cashier: true,
                branch: true,
            },
        });
    }
    async remove(id) {
        return this.prisma.cashierReport.delete({
            where: { id },
        });
    }
    async getCashierReport(cashierId, branchId, startDate, endDate) {
        let report = await this.prisma.cashierReport.findUnique({
            where: {
                cashierId_branchId_reportDate: {
                    cashierId,
                    branchId,
                    reportDate: startDate,
                },
            },
        });
        if (!report) {
            report = await this.generateCashierReport(cashierId, branchId, startDate, endDate);
        }
        return report;
    }
    async generateCashierReport(cashierId, branchId, startDate, endDate) {
        const transactions = await this.prisma.transaction.findMany({
            where: {
                soldByUserId: cashierId,
                fromBranchId: branchId,
                type: 'SALE',
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                items: true,
                customer: true,
                paymentSchedules: true,
            },
        });
        const dailyRepayments = await this.prisma.dailyRepayment.findMany({
            where: {
                paidByUserId: cashierId,
                transaction: {
                    fromBranchId: branchId,
                },
                paidAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        const creditRepayments = await this.prisma.creditRepayment.findMany({
            where: {
                paidByUserId: cashierId,
                transaction: {
                    fromBranchId: branchId,
                },
                paidAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        const defectiveLogs = await this.prisma.defectiveLog.findMany({
            where: {
                userId: cashierId,
                branchId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        let cashTotal = 0;
        let cardTotal = 0;
        let creditTotal = 0;
        let installmentTotal = 0;
        let upfrontTotal = 0;
        let upfrontCash = 0;
        let upfrontCard = 0;
        let soldQuantity = 0;
        let soldAmount = 0;
        let repaymentTotal = 0;
        let defectivePlus = 0;
        let defectiveMinus = 0;
        for (const transaction of transactions) {
            const finalTotal = Number(transaction.finalTotal || transaction.total || 0);
            const amountPaid = Number(transaction.amountPaid || 0);
            const downPayment = Number(transaction.downPayment || 0);
            const upfront = ['CREDIT', 'INSTALLMENT'].includes(transaction.paymentType || '') ? amountPaid : 0;
            switch (transaction.paymentType || '') {
                case 'CASH':
                    cashTotal += finalTotal;
                    break;
                case 'CARD':
                    cardTotal += finalTotal;
                    break;
                case 'CREDIT':
                    creditTotal += finalTotal;
                    upfrontTotal += upfront;
                    if (transaction.upfrontPaymentType === 'CASH') {
                        upfrontCash += upfront;
                    }
                    else if (transaction.upfrontPaymentType === 'CARD' || transaction.upfrontPaymentType === 'TERMINAL') {
                        upfrontCard += upfront;
                    }
                    break;
                case 'INSTALLMENT':
                    installmentTotal += finalTotal;
                    upfrontTotal += upfront;
                    if (transaction.upfrontPaymentType === 'CASH') {
                        upfrontCash += upfront;
                    }
                    else if (transaction.upfrontPaymentType === 'CARD' || transaction.upfrontPaymentType === 'TERMINAL') {
                        upfrontCard += upfront;
                    }
                    break;
            }
            for (const item of transaction.items) {
                soldQuantity += Number(item.quantity || 0);
                soldAmount += Number(item.total || 0);
            }
        }
        for (const repayment of dailyRepayments) {
            repaymentTotal += Number(repayment.amount || 0);
        }
        for (const repayment of creditRepayments) {
            repaymentTotal += Number(repayment.amount || 0);
        }
        for (const log of defectiveLogs) {
            const amount = Number(log.cashAmount || 0);
            if (amount > 0) {
                defectivePlus += amount;
            }
            else if (amount < 0) {
                defectiveMinus += Math.abs(amount);
            }
        }
        const reportData = {
            cashierId,
            branchId,
            reportDate: startDate,
            cashTotal,
            cardTotal,
            creditTotal,
            installmentTotal,
            upfrontTotal,
            upfrontCash,
            upfrontCard,
            soldQuantity,
            soldAmount,
            repaymentTotal,
            defectivePlus,
            defectiveMinus,
        };
        return this.prisma.cashierReport.upsert({
            where: {
                cashierId_branchId_reportDate: {
                    cashierId,
                    branchId,
                    reportDate: startDate,
                },
            },
            update: reportData,
            create: reportData,
            include: {
                cashier: true,
                branch: true,
            },
        });
    }
};
exports.CashierReportService = CashierReportService;
exports.CashierReportService = CashierReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashierReportService);
//# sourceMappingURL=cashier-report.service.js.map