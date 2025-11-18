import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Put,
} from '@nestjs/common';
import { PaymentScheduleService } from './payment-schedule.service';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment-schedules')
@UseGuards(JwtAuthGuard)
export class PaymentScheduleController {
  constructor(private readonly paymentScheduleService: PaymentScheduleService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) {
      throw new (require('@nestjs/common').BadRequestException)(`Invalid payment schedule id: ${id}`);
    }
    return this.paymentScheduleService.findOne(num);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any, @Req() req: Request) {
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) {
      throw new (require('@nestjs/common').BadRequestException)(`Invalid payment schedule id: ${id}`);
    }
    const body = updateData || {};
    const paidByUserId = body.paidByUserId ?? (req as any)?.user?.id ?? null;
    const paidChannel = (body.paidChannel || 'CASH').toString();
    const paidAt = body.paidAt;
    return this.paymentScheduleService.update(num, { ...body, paidByUserId, paidChannel, paidAt });
  }
}
