import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrencyExchangeRateModule } from '../currency-exchange-rate/currency-exchange-rate.module';
import { BonusModule } from '../bonus/bonus.module';
import { JwtModule } from '@nestjs/jwt';
import { DeliveryTasksGateway } from './delivery-tasks.gateway';

@Module({
  imports: [
    CurrencyExchangeRateModule,
    BonusModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, DeliveryTasksGateway],
  exports: [TransactionService],
})
export class TransactionModule {}
