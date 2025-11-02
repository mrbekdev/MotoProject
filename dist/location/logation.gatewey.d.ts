import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService, UserLocationWithUser } from './location.service';
import { JwtService } from '@nestjs/jwt';
interface AuthenticatedSocket extends Socket {
    userId?: number;
    userData?: {
        sub: number;
        role: string;
        name?: string;
        username?: string;
        branch?: string;
    };
}
export declare class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private locationService;
    private jwtService;
    server: Server;
    private logger;
    private connectedUsers;
    private emitOnlineUsersDebounced;
    private emitAllLocationsDebounced;
    constructor(locationService: LocationService, jwtService: JwtService);
    private isTashkentLocation;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleLocationUpdate(client: AuthenticatedSocket, data: {
        userId?: number;
        latitude: number;
        longitude: number;
        address?: string;
        isOnline?: boolean;
    }): Promise<void>;
    handleGetNearbyUsers(client: AuthenticatedSocket, data: {
        radius?: number;
    }): Promise<void>;
    handleGetAllOnlineUsers(client: AuthenticatedSocket, data: {
        branchId?: number;
    }): Promise<void>;
    handleGetUserLocation(client: AuthenticatedSocket, data: {
        targetUserId: number;
    }): Promise<void>;
    handleRequestAllLocations(client: AuthenticatedSocket): Promise<void>;
    handlePing(client: AuthenticatedSocket): void;
    private emitOnlineUsers;
    private emitAllLocationsToAdmins;
    private emitLocationToAdmins;
    private getAdminSockets;
    private handleSocketError;
    private isValidCoordinate;
    forceEmitAllLocations(): Promise<void>;
    broadcastLocationUpdate(location: UserLocationWithUser): Promise<void>;
    getConnectedUsersCount(): number;
    getConnectedAdminsCount(): number;
}
export {};
