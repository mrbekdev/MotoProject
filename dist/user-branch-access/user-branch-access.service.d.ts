import { PrismaService } from '../prisma/prisma.service';
import { CreateUserBranchAccessDto } from './dto/create-user-branch-access.dto';
import { UpdateUserBranchAccessDto } from './dto/update-user-branch-access.dto';
import { UserBranchAccessResponseDto } from './dto/user-branch-access-response.dto';
export declare class UserBranchAccessService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createDto: CreateUserBranchAccessDto): Promise<UserBranchAccessResponseDto>;
    findAll(): Promise<UserBranchAccessResponseDto[]>;
    findOne(id: number): Promise<UserBranchAccessResponseDto>;
    update(id: number, updateDto: UpdateUserBranchAccessDto): Promise<UserBranchAccessResponseDto>;
    remove(id: number): Promise<void>;
    findByUserId(userId: number): Promise<UserBranchAccessResponseDto[]>;
    findByBranchId(branchId: number): Promise<UserBranchAccessResponseDto[]>;
}
