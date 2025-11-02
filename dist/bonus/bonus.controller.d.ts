import { BonusService } from './bonus.service';
import { CreateBonusDto } from './dto/create-bonus.dto';
import { UpdateBonusDto } from './dto/update-bonus.dto';
export declare class BonusController {
    private readonly bonusService;
    constructor(bonusService: BonusService);
    create(createBonusDto: CreateBonusDto, req: any): Promise<any>;
    findAll(skip?: string, take?: string): Promise<any>;
    findByUserId(userId: string, skip?: string, take?: string): Promise<any>;
    getTotalBonusByUserId(userId: string): Promise<{
        totalAmount: any;
        totalCount: any;
    }>;
    findByTransactionId(transactionId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateBonusDto: UpdateBonusDto): Promise<any>;
    remove(id: string): Promise<any>;
}
