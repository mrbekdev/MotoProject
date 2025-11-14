import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(data: { amount: number; reason: string; description?: string; branchId?: number }) {
    return this.prisma.expense.create({
      data: {
        amount: data.amount,
        reason: data.reason,
        description: data.description,
        branchId: data.branchId ?? null,
      },
    });
  }

  async findAll(params: { startDate?: string; endDate?: string; branchId?: number }) {
    const where: any = {};
    if (params.branchId) where.branchId = params.branchId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }
    return this.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async total(params: { startDate?: string; endDate?: string; branchId?: number }) {
    const where: any = {};
    if (params.branchId) where.branchId = params.branchId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }
    const res = await this.prisma.expense.aggregate({ _sum: { amount: true }, where });
    return { total: Number(res._sum.amount || 0) };
  }
}
