import { UserRole } from '@prisma/client';
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    username?: string;
    password?: string;
    phone?: string;
    role?: UserRole;
    branchId?: number;
    allowedBranches?: number[];
    workStartTime?: string;
    workEndTime?: string;
    workShift?: string;
    isActive?: boolean;
}
