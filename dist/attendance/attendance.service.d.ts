import { PrismaService } from '../prisma/prisma.service';
export declare class AttendanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkIn(params: {
        userId?: number;
        faceTemplateId?: number;
        branchId?: number;
        deviceId?: string;
        similarity?: number;
        payload?: any;
        when?: Date;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus | null;
        branchId: number | null;
        userId: number;
        deviceId: string | null;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        totalMinutes: number | null;
        notes: string | null;
    }>;
    checkOut(params: {
        userId?: number;
        faceTemplateId?: number;
        branchId?: number;
        deviceId?: string;
        similarity?: number;
        payload?: any;
        when?: Date;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus | null;
        branchId: number | null;
        userId: number;
        deviceId: string | null;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        totalMinutes: number | null;
        notes: string | null;
    }>;
    createManual(dayData: {
        userId: number;
        date: string | Date;
        branchId?: number;
        checkInAt?: Date;
        checkOutAt?: Date;
        notes?: string;
        deviceId?: string;
        status?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus | null;
        branchId: number | null;
        userId: number;
        deviceId: string | null;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        totalMinutes: number | null;
        notes: string | null;
    }>;
    findAll(query: any): Promise<{
        items: ({
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
            user: {
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
            };
            events: {
                id: number;
                createdAt: Date;
                branchId: number | null;
                userId: number;
                deviceId: string | null;
                similarity: number | null;
                payload: import("@prisma/client/runtime/library").JsonValue | null;
                dayId: number | null;
                eventType: import(".prisma/client").$Enums.AttendanceEventType;
                occurredAt: Date;
            }[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.AttendanceStatus | null;
            branchId: number | null;
            userId: number;
            deviceId: string | null;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
            totalMinutes: number | null;
            notes: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
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
        user: {
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
        };
        events: {
            id: number;
            createdAt: Date;
            branchId: number | null;
            userId: number;
            deviceId: string | null;
            similarity: number | null;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            dayId: number | null;
            eventType: import(".prisma/client").$Enums.AttendanceEventType;
            occurredAt: Date;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus | null;
        branchId: number | null;
        userId: number;
        deviceId: string | null;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        totalMinutes: number | null;
        notes: string | null;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus | null;
        branchId: number | null;
        userId: number;
        deviceId: string | null;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        totalMinutes: number | null;
        notes: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus | null;
        branchId: number | null;
        userId: number;
        deviceId: string | null;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
        totalMinutes: number | null;
        notes: string | null;
    }>;
    registerFace(body: {
        userId: number;
        deviceId?: string;
        template?: string;
        vector?: any;
        imageUrl?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        deviceId: string | null;
        template: string | null;
        vector: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    }>;
    listFaces(query: any): Promise<{
        items: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    deleteFace(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        deviceId: string | null;
        template: string | null;
        vector: import("@prisma/client/runtime/library").JsonValue | null;
        imageUrl: string | null;
    }>;
}
