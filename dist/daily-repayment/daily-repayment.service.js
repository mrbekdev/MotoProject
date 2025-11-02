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
exports.DailyRepaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DailyRepaymentService = class DailyRepaymentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDailyRepaymentDto) {
        const { transactionId, amount, channel, paidAt, paidByUserId, branchId } = createDailyRepaymentDto;
        return this.prisma.dailyRepayment.create({
            data: {
                transactionId,
                amount,
                channel,
                paidAt: new Date(paidAt),
                paidByUserId,
                branchId,
            },
            include: {
                transaction: true,
                paidBy: true,
                branch: true,
            },
        });
    }
    async findAll(query) {
        const { transactionId, branchId, paidByUserId, startDate, endDate } = query;
        const where = {};
        if (transactionId)
            where.transactionId = parseInt(transactionId);
        if (branchId)
            where.branchId = parseInt(branchId);
        if (paidByUserId)
            where.paidByUserId = parseInt(paidByUserId);
        if (startDate || endDate) {
            where.paidAt = {};
            if (startDate)
                where.paidAt.gte = new Date(startDate);
            if (endDate)
                where.paidAt.lte = new Date(endDate);
        }
        return this.prisma.dailyRepayment.findMany({
            where,
            include: {
                transaction: true,
                paidBy: true,
                branch: true,
            },
            orderBy: {
                paidAt: 'desc',
            },
        });
    }
    async findByUser(userId, branchId, startDate, endDate) {
        const where = {
            paidByUserId: userId,
        };
        if (branchId)
            where.branchId = branchId;
        if (startDate || endDate) {
            where.paidAt = {};
            if (startDate)
                where.paidAt.gte = new Date(startDate);
            if (endDate)
                where.paidAt.lte = new Date(endDate);
        }
        return this.prisma.dailyRepayment.findMany({
            where,
            include: {
                transaction: {
                    include: {
                        customer: true,
                    },
                },
                paidBy: true,
                branch: true,
            },
            orderBy: {
                paidAt: 'desc',
            },
        });
    }
    async findByCashier(cashierId, branchId, startDate, endDate) {
        console.log('DailyRepaymentService.findByCashier called with:', {
            cashierId,
            branchId,
            startDate,
            endDate
        });
        const where = {
            paidByUserId: cashierId,
        };
        if (branchId) {
            const branchIdNum = typeof branchId === 'string' ? parseInt(branchId) : branchId;
            if (!isNaN(branchIdNum)) {
                where.branchId = branchIdNum;
                console.log('Filtering by branchId:', branchIdNum);
            }
            else {
                console.log('Invalid branchId:', branchId);
            }
        }
        if (startDate || endDate) {
            where.paidAt = {};
            if (startDate) {
                where.paidAt.gte = new Date(startDate);
                console.log('Filtering by startDate:', startDate);
            }
            if (endDate) {
                where.paidAt.lte = new Date(endDate);
                console.log('Filtering by endDate:', endDate);
            }
        }
        console.log('Final where clause:', where);
        const result = await this.prisma.dailyRepayment.findMany({
            where,
            include: {
                transaction: {
                    include: {
                        customer: true,
                    },
                },
                paidBy: true,
                branch: true,
            },
            orderBy: {
                paidAt: 'desc',
            },
        });
        console.log(`Found ${result.length} daily repayments for cashier ${cashierId}`);
        return result;
    }
    async findOne(id) {
        return this.prisma.dailyRepayment.findUnique({
            where: { id },
            include: {
                transaction: true,
                paidBy: true,
                branch: true,
            },
        });
    }
    async update(id, updateDailyRepaymentDto) {
        const { amount, channel, paidAt, paidByUserId, branchId } = updateDailyRepaymentDto;
        return this.prisma.dailyRepayment.update({
            where: { id },
            data: {
                amount,
                channel,
                paidAt: paidAt ? new Date(paidAt) : undefined,
                paidByUserId,
                branchId,
            },
            include: {
                transaction: true,
                paidBy: true,
                branch: true,
            },
        });
    }
    async remove(id) {
        return this.prisma.dailyRepayment.delete({
            where: { id },
        });
    }
};
exports.DailyRepaymentService = DailyRepaymentService;
exports.DailyRepaymentService = DailyRepaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DailyRepaymentService);
//# sourceMappingURL=daily-repayment.service.js.map