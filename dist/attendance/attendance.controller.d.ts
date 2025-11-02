import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    private lastEventPayload;
    private lastImageDataUrl;
    private lastUpdatedAt;
    checkIn(req: Request, res: Response, files: Express.Multer.File[] | undefined, body: any): Promise<{
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
    }> | Response<any, Record<string, any>>;
    checkOut(req: Request, res: Response, files: Express.Multer.File[] | undefined, body: any): Promise<{
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
    }> | Response<any, Record<string, any>>;
    private tryParseXml;
    createManual(body: any): Promise<{
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
    getLast(): {
        updatedAt: string | null;
        event: any;
        imageDataUrl: string | null;
    };
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
    update(id: string, body: any): Promise<{
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
    remove(id: string): Promise<{
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
    registerFace(body: any): Promise<{
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
    deleteFace(id: string): Promise<{
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
