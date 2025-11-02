import { PrismaService } from '../prisma/prisma.service';
export interface UserLocationWithUser {
    userId: number;
    latitude: number;
    longitude: number;
    address?: string;
    isOnline: boolean;
    lastSeen: Date;
    updatedAt: Date;
    user: {
        id: number;
        name: string;
        username?: string;
        role: string;
        branch?: {
            id: number;
            name: string;
        };
    };
}
export declare class LocationService {
    private prisma;
    private logger;
    constructor(prisma: PrismaService);
    validateCoordinates(latitude: number, longitude: number): boolean;
    updateUserLocation(userId: number, data: {
        userId: number;
        latitude: number;
        longitude: number;
        address?: string;
        isOnline?: boolean;
    }): Promise<UserLocationWithUser>;
    getUserLocation(userId: number): Promise<UserLocationWithUser>;
    getAllOnlineUsers(branchId?: number): Promise<UserLocationWithUser[]>;
    getNearbyUsers(userId: number, radius: number): Promise<UserLocationWithUser[]>;
    setUserOffline(userId: number): Promise<void>;
    deleteUserLocation(userId: number): Promise<void>;
    private calculateDistance;
    private toRadians;
    getLocationStats(): Promise<{
        totalUsers: number;
        onlineUsers: number;
        offlineUsers: number;
    }>;
    cleanupOfflineUsers(olderThanHours?: number): Promise<number>;
}
