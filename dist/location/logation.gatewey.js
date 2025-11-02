"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const location_service_1 = require("./location.service");
const jwt_1 = require("@nestjs/jwt");
const lodash_1 = require("lodash");
let LocationGateway = class LocationGateway {
    locationService;
    jwtService;
    server;
    logger = new common_1.Logger('LocationGateway');
    connectedUsers = new Map();
    emitOnlineUsersDebounced = (0, lodash_1.debounce)(this.emitOnlineUsers.bind(this), 1000);
    emitAllLocationsDebounced = (0, lodash_1.debounce)(this.emitAllLocationsToAdmins.bind(this), 500);
    constructor(locationService, jwtService) {
        this.locationService = locationService;
        this.jwtService = jwtService;
    }
    isTashkentLocation(latitude, longitude, address) {
        return ((Math.abs(latitude - 41.3111) < 0.01 && Math.abs(longitude - 69.2797) < 0.01) ||
            (Math.abs(latitude - 41.2995) < 0.01 && Math.abs(longitude - 69.2401) < 0.01) ||
            address === 'Initial connection - Tashkent');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                throw new common_1.UnauthorizedException('Token not provided');
            }
            let payload;
            try {
                payload = this.jwtService.verify(token);
            }
            catch (error) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            if (typeof payload.sub !== 'number' || !payload.sub || typeof payload.role !== 'string') {
                throw new common_1.UnauthorizedException('Invalid token payload');
            }
            client.userId = payload.sub;
            client.userData = {
                sub: payload.sub,
                role: payload.role,
                name: payload.name,
                username: payload.username,
                branch: payload.branch,
            };
            this.connectedUsers.set(client.userId, client.id);
            this.logger.log(`User ${client.userId} (${payload.role}) connected: ${client.id}`);
            this.emitOnlineUsersDebounced();
            if (client.userData?.role === 'ADMIN') {
                const onlineUsers = await this.locationService.getAllOnlineUsers();
                const validUsers = onlineUsers.filter((user) => !this.isTashkentLocation(user.latitude, user.longitude, user.address));
                client.emit('adminAllLocations', validUsers);
                this.logger.log(`Sent adminAllLocations to admin ${client.userId}: ${validUsers.length} users`);
            }
            const myLocation = await this.locationService.getUserLocation(client.userId);
            client.emit('myLocationUpdated', myLocation);
            client.emit('connectionSuccess', {
                userId: client.userId,
                role: client.userData.role,
                message: 'Successfully connected to location service',
            });
        }
        catch (error) {
            this.handleSocketError(client, error, 'Connection error');
        }
    }
    async handleDisconnect(client) {
        if (typeof client.userId === 'number') {
            try {
                this.connectedUsers.delete(client.userId);
                await this.locationService.setUserOffline(client.userId);
                this.logger.log(`User ${client.userId} disconnected: ${client.id}`);
                this.emitOnlineUsersDebounced();
                this.emitAllLocationsDebounced();
            }
            catch (error) {
                this.logger.error(`Error during disconnect for user ${client.userId}:`, error);
            }
        }
    }
    async handleLocationUpdate(client, data) {
        if (typeof client.userId !== 'number') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('User not authenticated'), 'Authentication error');
        }
        if (data.userId && client.userId !== data.userId) {
            return this.handleSocketError(client, new common_1.UnauthorizedException('Cannot update other user location'), 'Authorization error');
        }
        try {
            if (!this.isValidCoordinate(data.latitude) || !this.isValidCoordinate(data.longitude)) {
                throw new Error(`Invalid coordinates: lat=${data.latitude}, lng=${data.longitude}`);
            }
            if (!this.locationService.validateCoordinates(data.latitude, data.longitude)) {
                throw new Error('Coordinates out of valid range');
            }
            if (this.isTashkentLocation(data.latitude, data.longitude, data.address)) {
                throw new Error('Default Tashkent coordinates are not allowed');
            }
            this.logger.log(`Received updateLocation for user ${client.userId}:`, {
                latitude: data.latitude,
                longitude: data.longitude,
                address: data.address,
                timestamp: new Date().toISOString(),
            });
            const updatedLocation = await this.locationService.updateUserLocation(client.userId, {
                userId: client.userId,
                latitude: data.latitude,
                longitude: data.longitude,
                address: data.address || 'Updated location',
                isOnline: data.isOnline ?? true,
            });
            this.server.emit('locationUpdated', {
                userId: client.userId,
                latitude: updatedLocation.latitude,
                longitude: updatedLocation.longitude,
                address: updatedLocation.address,
                lastSeen: updatedLocation.lastSeen,
                isOnline: updatedLocation.isOnline,
                user: updatedLocation.user,
            });
            await this.emitLocationToAdmins(updatedLocation);
            client.emit('locationUpdateConfirmed', {
                success: true,
                location: updatedLocation,
                timestamp: new Date(),
            });
            try {
                const nearbyUsers = await this.locationService.getNearbyUsers(client.userId, 5);
                client.emit('nearbyUsers', nearbyUsers);
            }
            catch (nearbyError) {
                this.logger.warn(`Failed to get nearby users for ${client.userId}:`, nearbyError);
            }
            this.logger.log(`Location updated for user ${client.userId}: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`);
        }
        catch (error) {
            this.handleSocketError(client, error, 'Location update error');
        }
    }
    async handleGetNearbyUsers(client, data) {
        if (typeof client.userId !== 'number') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('User not authenticated'), 'Authentication error');
        }
        try {
            const radius = Math.min(Math.max(data.radius || 5, 0.1), 100);
            const nearbyUsers = await this.locationService.getNearbyUsers(client.userId, radius);
            client.emit('nearbyUsers', nearbyUsers);
            this.logger.log(`Sent nearbyUsers to user ${client.userId}: ${nearbyUsers.length} users within ${radius}km`);
        }
        catch (error) {
            this.handleSocketError(client, error, 'Get nearby users error');
        }
    }
    async handleGetAllOnlineUsers(client, data) {
        if (typeof client.userId !== 'number') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('User not authenticated'), 'Authentication error');
        }
        try {
            const branchId = data?.branchId ? parseInt(data.branchId.toString(), 10) : undefined;
            if (branchId !== undefined && (isNaN(branchId) || branchId < 1)) {
                throw new Error('Invalid branchId');
            }
            const onlineUsers = await this.locationService.getAllOnlineUsers(branchId);
            const validUsers = onlineUsers.filter((user) => !this.isTashkentLocation(user.latitude, user.longitude, user.address));
            client.emit('onlineUsers', validUsers);
            this.logger.log(`Sent onlineUsers to user ${client.userId}: ${validUsers.length}/${onlineUsers.length} valid users${branchId ? ` for branch ${branchId}` : ''}`);
        }
        catch (error) {
            this.handleSocketError(client, error, 'Get online users error');
        }
    }
    async handleGetUserLocation(client, data) {
        if (typeof client.userId !== 'number') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('User not authenticated'), 'Authentication error');
        }
        if (client.userData?.role !== 'ADMIN') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('Only admins can view specific user locations'), 'Authorization error');
        }
        try {
            const targetUserId = parseInt(data.targetUserId.toString(), 10);
            if (isNaN(targetUserId) || targetUserId < 1) {
                throw new Error('Invalid target user ID');
            }
            const location = await this.locationService.getUserLocation(targetUserId);
            if (this.isTashkentLocation(location.latitude, location.longitude, location.address)) {
                throw new Error('User has default Tashkent coordinates');
            }
            client.emit('userLocation', location);
            this.logger.log(`Sent userLocation for user ${targetUserId} to admin ${client.userId}`);
        }
        catch (error) {
            this.handleSocketError(client, error, 'Get user location error');
        }
    }
    async handleRequestAllLocations(client) {
        if (typeof client.userId !== 'number') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('User not authenticated'), 'Authentication error');
        }
        if (client.userData?.role !== 'ADMIN') {
            return this.handleSocketError(client, new common_1.UnauthorizedException('Only admins can view all locations'), 'Authorization error');
        }
        try {
            const onlineUsers = await this.locationService.getAllOnlineUsers();
            const validLocations = onlineUsers.filter((user) => !this.isTashkentLocation(user.latitude, user.longitude, user.address));
            client.emit('adminAllLocations', validLocations);
            this.logger.log(`Sent adminAllLocations to admin ${client.userId}: ${validLocations.length}/${onlineUsers.length} valid locations`);
        }
        catch (error) {
            this.handleSocketError(client, error, 'Get all locations error');
        }
    }
    handlePing(client) {
        client.emit('pong', {
            timestamp: new Date(),
            userId: client.userId,
            connected: true,
        });
    }
    async emitOnlineUsers() {
        try {
            const onlineUsers = await this.locationService.getAllOnlineUsers();
            const validUsers = onlineUsers.filter((user) => !this.isTashkentLocation(user.latitude, user.longitude, user.address));
            this.server.emit('onlineUsersUpdated', validUsers);
            this.logger.log(`Emitted onlineUsersUpdated: ${validUsers.length}/${onlineUsers.length} valid users`);
        }
        catch (error) {
            this.logger.error('Emit online users error:', error);
        }
    }
    async emitAllLocationsToAdmins() {
        try {
            const onlineUsers = await this.locationService.getAllOnlineUsers();
            const validLocations = onlineUsers.filter((user) => !this.isTashkentLocation(user.latitude, user.longitude, user.address));
            const adminSockets = this.getAdminSockets();
            adminSockets.forEach((socketId) => {
                this.server.to(socketId).emit('adminAllLocations', validLocations);
            });
            this.logger.log(`Emitted adminAllLocations to ${adminSockets.length} admins: ${validLocations.length}/${onlineUsers.length} valid locations`);
        }
        catch (error) {
            this.logger.error('Emit all locations to admins error:', error);
        }
    }
    async emitLocationToAdmins(location) {
        try {
            if (!this.isValidCoordinate(location.latitude) || !this.isValidCoordinate(location.longitude)) {
                this.logger.warn(`Skipping emit to admins for invalid coordinates: ${location.latitude}, ${location.longitude}`);
                return;
            }
            if (this.isTashkentLocation(location.latitude, location.longitude, location.address)) {
                this.logger.warn(`Skipping emit to admins for Tashkent location: user ${location.userId}`);
                return;
            }
            const adminSockets = this.getAdminSockets();
            adminSockets.forEach((socketId) => {
                this.server.to(socketId).emit('adminLocationUpdate', location);
            });
            this.logger.log(`Sent adminLocationUpdate to ${adminSockets.length} admins for user ${location.userId}`);
        }
        catch (error) {
            this.logger.error('Emit location to admins error:', error);
        }
    }
    getAdminSockets() {
        return Array.from(this.connectedUsers.entries())
            .filter(([_, socketId]) => {
            const socket = this.server.sockets.sockets.get(socketId);
            return socket?.userData?.role === 'ADMIN';
        })
            .map(([_, socketId]) => socketId);
    }
    handleSocketError(client, error, context) {
        this.logger.error(`${context} for client ${client.id}:`, error);
        client.emit('error', {
            message: error.message || 'An error occurred',
            context: context,
            timestamp: new Date(),
        });
        if (error instanceof common_1.UnauthorizedException) {
            this.logger.warn(`Disconnecting unauthorized client: ${client.id}`);
            client.disconnect();
        }
    }
    isValidCoordinate(coord) {
        return typeof coord === 'number' && !isNaN(coord) && isFinite(coord) && coord !== 0;
    }
    async forceEmitAllLocations() {
        await this.emitAllLocationsToAdmins();
        await this.emitOnlineUsers();
    }
    async broadcastLocationUpdate(location) {
        if (this.isValidCoordinate(location.latitude) && this.isValidCoordinate(location.longitude) &&
            !this.isTashkentLocation(location.latitude, location.longitude, location.address)) {
            this.server.emit('locationUpdated', location);
            await this.emitLocationToAdmins(location);
        }
    }
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    getConnectedAdminsCount() {
        return this.getAdminSockets().length;
    }
};
exports.LocationGateway = LocationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LocationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LocationGateway.prototype, "handleLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getNearbyUsers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LocationGateway.prototype, "handleGetNearbyUsers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getAllOnlineUsers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LocationGateway.prototype, "handleGetAllOnlineUsers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getUserLocation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LocationGateway.prototype, "handleGetUserLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('requestAllLocations'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationGateway.prototype, "handleRequestAllLocations", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LocationGateway.prototype, "handlePing", null);
exports.LocationGateway = LocationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [location_service_1.LocationService,
        jwt_1.JwtService])
], LocationGateway);
//# sourceMappingURL=logation.gatewey.js.map