import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(createUserDto: CreateUserDto): Promise<{
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        allowedBranches: ({
            branch: {
                name: string;
                type: import(".prisma/client").$Enums.BranchType;
                phoneNumber: string | null;
                id: number;
                address: string | null;
                cashBalance: number;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.BranchStatus;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            branchId: number;
            userId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        firstName: string | null;
        lastName: string | null;
        username: string;
        password: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        branchId: number | null;
        workStartTime: string | null;
        workEndTime: string | null;
        workShift: string | null;
    }>;
    findOne(id: string): Promise<{
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        allowedBranches: ({
            branch: {
                name: string;
                type: import(".prisma/client").$Enums.BranchType;
                phoneNumber: string | null;
                id: number;
                address: string | null;
                cashBalance: number;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.BranchStatus;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            branchId: number;
            userId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        firstName: string | null;
        lastName: string | null;
        username: string;
        password: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        branchId: number | null;
        workStartTime: string | null;
        workEndTime: string | null;
        workShift: string | null;
    }>;
    checkUsername(username: string, currentUserId?: string): Promise<{
        exists: boolean;
        userId: number | null | undefined;
    }>;
    findAll(skip?: string, take?: string): Promise<({
        branch: {
            name: string;
            type: import(".prisma/client").$Enums.BranchType;
            phoneNumber: string | null;
            id: number;
            address: string | null;
            cashBalance: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.BranchStatus;
        } | null;
        allowedBranches: ({
            branch: {
                name: string;
                type: import(".prisma/client").$Enums.BranchType;
                phoneNumber: string | null;
                id: number;
                address: string | null;
                cashBalance: number;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.BranchStatus;
            };
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            branchId: number;
            userId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        firstName: string | null;
        lastName: string | null;
        username: string;
        password: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        branchId: number | null;
        workStartTime: string | null;
        workEndTime: string | null;
        workShift: string | null;
    })[]>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        firstName: string | null;
        lastName: string | null;
        username: string;
        password: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        branchId: number | null;
        workStartTime: string | null;
        workEndTime: string | null;
        workShift: string | null;
    }>;
    remove(id: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        firstName: string | null;
        lastName: string | null;
        username: string;
        password: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        branchId: number | null;
        workStartTime: string | null;
        workEndTime: string | null;
        workShift: string | null;
    }>;
}
