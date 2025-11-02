import { PrismaService } from '../prisma/prisma.service';
import { CreateBonusDto } from './dto/create-bonus.dto';
import { UpdateBonusDto } from './dto/update-bonus.dto';
export declare class BonusService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createBonusDto: CreateBonusDto, createdById: number): Promise<any>;
    findAll(skip?: number, take?: number): Promise<any>;
    findByUserId(userId: number, skip?: number, take?: number): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, updateBonusDto: UpdateBonusDto): Promise<any>;
    remove(id: number): Promise<any>;
    getTotalBonusByUserId(userId: number): Promise<{
        totalAmount: any;
        totalCount: any;
    }>;
    findByTransactionId(transactionId: number): Promise<any>;
}
