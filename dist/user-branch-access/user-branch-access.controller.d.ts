import { UserBranchAccessService } from './user-branch-access.service';
import { CreateUserBranchAccessDto } from './dto/create-user-branch-access.dto';
import { UpdateUserBranchAccessDto } from './dto/update-user-branch-access.dto';
import { UserBranchAccessResponseDto } from './dto/user-branch-access-response.dto';
export declare class UserBranchAccessController {
    private readonly userBranchAccessService;
    constructor(userBranchAccessService: UserBranchAccessService);
    create(createUserBranchAccessDto: CreateUserBranchAccessDto): Promise<UserBranchAccessResponseDto>;
    findAll(userId?: string, branchId?: string): Promise<UserBranchAccessResponseDto[]>;
    findOne(id: number): Promise<UserBranchAccessResponseDto>;
    update(id: number, updateUserBranchAccessDto: UpdateUserBranchAccessDto): Promise<UserBranchAccessResponseDto>;
    remove(id: number): Promise<void>;
}
