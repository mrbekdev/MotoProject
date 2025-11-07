import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntStoreService {
  constructor(private prisma: PrismaService) {}

  async create(value: number) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      throw new BadRequestException('value (number) is required');
    }
    return this.prisma.intStore.create({ data: { value: Number(value) } });
  }

  async findAll() {
    return this.prisma.intStore.findMany({ orderBy: { id: 'desc' } });
  }

  async findOne(id: number) {
    const row = await this.prisma.intStore.findUnique({ where: { id: Number(id) } });
    if (!row) throw new NotFoundException('IntStore not found');
    return row;
    }

  async update(id: number, value: number) {
    if (id === undefined || id === null || Number.isNaN(Number(id))) {
      throw new BadRequestException('Valid id is required');
    }
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      throw new BadRequestException('value (number) is required');
    }
    try {
      return await this.prisma.intStore.update({ where: { id: Number(id) }, data: { value: Number(value) } });
    } catch (e) {
      throw new NotFoundException('IntStore not found');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.intStore.delete({ where: { id: Number(id) } });
    } catch (e) {
      throw new NotFoundException('IntStore not found');
    }
  }
}
