import { LocationService, UserLocationWithUser } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
export declare class LocationController {
    private readonly locationService;
    private logger;
    constructor(locationService: LocationService);
    private isTashkentLocation;
    updateLocation(req: any, updateLocationDto: UpdateLocationDto): Promise<{
        success: boolean;
        location: UserLocationWithUser;
        message: string;
    }>;
    getMyLocation(req: any): Promise<{
        success: boolean;
        location: UserLocationWithUser;
        message: string;
    }>;
    getUserLocation(req: any, userId: string): Promise<{
        success: boolean;
        location: UserLocationWithUser;
        message: string;
    }>;
    getOnlineUsers(req: any, branchId?: string): Promise<{
        success: boolean;
        users: UserLocationWithUser[];
        count: number;
        message: string;
    }>;
    getNearbyUsers(req: any, radius?: string): Promise<{
        success: boolean;
        users: UserLocationWithUser[];
        count: number;
        radius: number;
        message: string;
    }>;
    deleteMyLocation(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    setOffline(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getLocationStats(req: any): Promise<{
        success: boolean;
        stats: {
            totalUsers: number;
            onlineUsers: number;
            offlineUsers: number;
        };
        message: string;
    }>;
    cleanupOfflineUsers(req: any, hours?: string): Promise<{
        success: boolean;
        deletedCount: number;
        message: string;
    }>;
}
