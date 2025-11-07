import { Module } from '@nestjs/common';
import { IntStoreService } from './int-store.service';
import { IntStoreController } from './int-store.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [IntStoreController],
  providers: [IntStoreService, PrismaService],
  exports: [IntStoreService],
})
export class IntStoreModule {}
