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
exports.PaymentScheduleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentScheduleService = class PaymentScheduleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(id) {
        const schedule = await this.prisma.paymentSchedule.findUnique({
            where: { id },
            include: {
                transaction: {
                    include: {
                        customer: true,
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                },
                repayments: {
                    include: { paidBy: true },
                    orderBy: { paidAt: 'asc' }
                },
                paidBy: true
            }
        });
        if (!schedule) {
            throw new common_1.HttpException('Payment schedule not found', common_1.HttpStatus.NOT_FOUND);
        }
        return schedule;
    }
    async update(id, updateData) {
        console.log('Payment schedule update received:', { id, updateData });
        const { paidAmount, isPaid, paidAt, paidChannel, paidByUserId, amountDelta, rating, note, ...rest } = updateData;
        console.log('Extracted paidChannel:', { paidChannel, type: typeof paidChannel, isNull: paidChannel === null, isUndefined: paidChannel === undefined });
        const validUpdateData = Object.entries(rest).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
                acc[key] = value;
            }
            return acc;
        }, {});
        const existing = await this.prisma.paymentSchedule.findUnique({
            where: { id },
            include: {
                transaction: true
            }
        });
        if (!existing) {
            throw new common_1.HttpException('Payment schedule not found', common_1.HttpStatus.NOT_FOUND);
        }
        const existingPaidAmount = existing.paidAmount || 0;
        const inputHasPaidAmount = paidAmount !== undefined && paidAmount !== null;
        const inputHasDelta = amountDelta !== undefined && amountDelta !== null;
        const deltaPaid = inputHasDelta
            ? Math.max(0, Number(amountDelta))
            : (inputHasPaidAmount ? Math.max(0, Number(paidAmount) - existingPaidAmount) : 0);
        const requestedPaidAmount = inputHasDelta
            ? existingPaidAmount + deltaPaid
            : (inputHasPaidAmount ? Number(paidAmount) : existingPaidAmount);
        const effectivePaidAt = paidAt ? new Date(paidAt) : (deltaPaid > 0 ? new Date() : undefined);
        const data = {
            ...validUpdateData,
            paidAmount: inputHasPaidAmount ? requestedPaidAmount : undefined,
            isPaid: isPaid !== undefined ? isPaid : undefined,
            paidAt: effectivePaidAt,
            paidChannel: paidChannel !== undefined ? paidChannel : undefined,
            paidByUserId: paidByUserId !== undefined ? paidByUserId : undefined,
            rating: rating !== undefined ? rating : undefined,
            repaymentDate: effectivePaidAt
        };
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        if (existing.isDailyInstallment && deltaPaid > 0) {
            const currentRemaining = existing.remainingBalance || 0;
            const newRemaining = Math.max(0, currentRemaining - deltaPaid);
            data.remainingBalance = newRemaining;
            console.log('Daily installment schedule - updating remaining balance:', {
                scheduleId: id,
                currentRemaining,
                deltaPaid,
                newRemaining
            });
            if (newRemaining <= 0) {
                data.isPaid = true;
                console.log('Daily installment fully paid, marking as paid');
            }
        }
        console.log('Final update data being saved:', data);
        const result = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.paymentSchedule.findUnique({
                where: { id },
                include: {
                    transaction: {
                        include: {
                            customer: true,
                            fromBranch: true,
                            toBranch: true,
                            items: {
                                include: {
                                    product: true
                                }
                            }
                        }
                    }
                }
            });
            if (!existing) {
                throw new Error(`Payment schedule with ID ${id} not found`);
            }
            const updatedSchedule = await tx.paymentSchedule.update({
                where: { id },
                data,
                include: {
                    transaction: {
                        include: {
                            customer: true,
                            items: { include: { product: true } }
                        }
                    }
                }
            });
            if (deltaPaid > 0 && effectivePaidAt) {
                console.log('Creating PaymentRepayment with channel:', { paidChannel, type: typeof paidChannel, isNull: paidChannel === null, isUndefined: paidChannel === undefined });
                await tx.paymentRepayment.create({
                    data: {
                        transactionId: updatedSchedule.transactionId,
                        scheduleId: updatedSchedule.id,
                        amount: deltaPaid,
                        channel: (paidChannel !== undefined && paidChannel !== null ? paidChannel : 'CASH'),
                        paidAt: effectivePaidAt,
                        paidByUserId: paidByUserId ? Number(paidByUserId) : null
                    }
                });
                let targetBranchId = null;
                if (paidByUserId) {
                    const cashier = await tx.user.findUnique({ where: { id: Number(paidByUserId) }, select: { branchId: true } });
                    if (cashier && cashier.branchId)
                        targetBranchId = cashier.branchId;
                }
                if (!targetBranchId && existing.transaction?.fromBranchId) {
                    targetBranchId = existing.transaction.fromBranchId;
                }
                if (targetBranchId && ((paidChannel || 'CASH').toUpperCase() === 'CASH')) {
                    await tx.branch.update({
                        where: { id: targetBranchId },
                        data: { cashBalance: { increment: deltaPaid } }
                    });
                }
                try {
                    if (existing.isDailyInstallment) {
                        const currentRemaining = existing.remainingBalance || 0;
                        const newRemaining = Math.max(0, currentRemaining - deltaPaid);
                        console.log('Daily installment payment - updating remaining balance:', {
                            scheduleId: id,
                            currentRemaining,
                            deltaPaid,
                            newRemaining
                        });
                        await tx.transaction.update({
                            where: { id: existing.transactionId },
                            data: {
                                lastRepaymentDate: effectivePaidAt,
                                remainingBalance: newRemaining,
                                creditRepaymentAmount: { increment: deltaPaid }
                            }
                        });
                        if (newRemaining <= 0) {
                            await tx.transaction.update({
                                where: { id: existing.transactionId },
                                data: {
                                    status: 'COMPLETED'
                                }
                            });
                            console.log('Daily installment transaction completed');
                        }
                    }
                    else {
                        await tx.transaction.update({
                            where: { id: existing.transactionId },
                            data: { lastRepaymentDate: effectivePaidAt }
                        });
                    }
                }
                catch (_) { }
            }
            return updatedSchedule;
        });
        return result;
    }
};
exports.PaymentScheduleService = PaymentScheduleService;
exports.PaymentScheduleService = PaymentScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentScheduleService);
//# sourceMappingURL=payment-schedule.service.js.map