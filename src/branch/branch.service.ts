import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchType } from '@prisma/client';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    const { name, location, type, phoneNumber, customerInfoOptional } = createBranchDto as any;
    return this.prisma.branch.create({
      data: {
        name,
        address: location || null,
        type: (type as BranchType) || 'SAVDO_MARKAZ',
        phoneNumber: phoneNumber || null,
        customerInfoOptional: Boolean(customerInfoOptional) || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.branch.findUnique({
      where: { id ,AND: { status: { not: 'DELETED' } } as any},
      select: {
        id: true,
        name: true,
        address: true,
        type: true,
        phoneNumber: true,
        customerInfoOptional: true,
        cashBalance: true,
        createdAt: true,
        updatedAt: true,
        products: true,
        users: true,
      },
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      where: { status: { not: 'DELETED' } },
      select: {
        id: true,
        name: true,
        address: true,
        type: true,
        phoneNumber: true,
        customerInfoOptional: true,
        cashBalance: true,
        createdAt: true,
        updatedAt: true,
        products: true,
        users: true,
      },
    });
  }

async update(id: number, updateBranchDto: UpdateBranchDto) {
  const { name, location, type, phoneNumber, customerInfoOptional } = updateBranchDto as any;

  return this.prisma.branch.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(location !== undefined ? { address: location } : {}),
      ...(type !== undefined ? { type: type as BranchType } : {}),
      ...(phoneNumber !== undefined ? { phoneNumber } : {}),
      ...(customerInfoOptional !== undefined ? { customerInfoOptional: Boolean(customerInfoOptional) } : {}),
      updatedAt: new Date(),
    },
  });
}

  async remove(id: number) {
    const findBranch = await this.prisma.branch.findUnique({ where: { id } });
    if (!findBranch) throw new Error('Branch not found');
    return this.prisma.branch.update({
      where: { id },
      data: { status: 'DELETED', updatedAt: new Date() },
    });
  }
}


