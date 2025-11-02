import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findAll(skip: number, take: number): Promise<({
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
    findOne(id: number): Promise<{
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
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
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
    remove(id: number): Promise<{
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
    findByUsername(username: string): Promise<({
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
    }) | null>;
    getUserWithBranches(userId: number): Promise<{
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
    checkUsernameExists(username: string, excludeUserId?: number): Promise<boolean>;
}
