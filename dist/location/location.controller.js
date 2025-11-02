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
exports.LocationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const location_service_1 = require("./location.service");
const update_location_dto_1 = require("./dto/update-location.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let LocationController = class LocationController {
    locationService;
    logger = new common_1.Logger('LocationController');
    constructor(locationService) {
        this.locationService = locationService;
    }
    isTashkentLocation(latitude, longitude) {
        return Math.abs(latitude - 41.3111) < 0.01 && Math.abs(longitude - 69.2797) < 0.01;
    }
    async updateLocation(req, updateLocationDto) {
        try {
            const userId = req.user.sub;
            const latitude = typeof updateLocationDto.latitude === 'number' ? updateLocationDto.latitude : 0;
            const longitude = typeof updateLocationDto.longitude === 'number' ? updateLocationDto.longitude : 0;
            if (!this.locationService.validateCoordinates(latitude, longitude) || this.isTashkentLocation(latitude, longitude)) {
                throw new common_1.HttpException('Invalid coordinates provided or default Tashkent coordinates', common_1.HttpStatus.BAD_REQUEST);
            }
            const location = await this.locationService.updateUserLocation(userId, {
                ...updateLocationDto,
                userId,
                latitude,
                longitude,
            });
            this.logger.log(`Location updated for user ${userId}: lat=${latitude}, lng=${longitude}`);
            return {
                success: true,
                location,
                message: 'Location updated successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to update location for user ${req.user?.sub}:`, error);
            throw new common_1.HttpException(error.message || 'Failed to update location', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getMyLocation(req) {
        try {
            const userId = req.user.sub;
            const location = await this.locationService.getUserLocation(userId);
            this.logger.log(`Retrieved location for user ${userId}`);
            return {
                success: true,
                location,
                message: 'Location retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get location for user ${req.user?.sub}:`, error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException('Location not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException(error.message || 'Failed to get location', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserLocation(req, userId) {
        try {
            if (req.user.role !== 'ADMIN') {
                throw new common_1.ForbiddenException("Only admins can view other users' locations");
            }
            const targetUserId = parseInt(userId, 10);
            if (isNaN(targetUserId)) {
                throw new common_1.HttpException('Invalid user ID', common_1.HttpStatus.BAD_REQUEST);
            }
            const location = await this.locationService.getUserLocation(targetUserId);
            this.logger.log(`Admin ${req.user.sub} retrieved location for user ${targetUserId}`);
            return {
                success: true,
                location,
                message: 'User location retrieved successfully',
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Failed to get location for user ${userId}:`, error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException('User location not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException(error.message || 'Failed to get user location', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getOnlineUsers(req, branchId) {
        try {
            if (req.user.role !== 'ADMIN') {
                throw new common_1.ForbiddenException('Only admins can view all online users');
            }
            const branchIdNum = branchId ? parseInt(branchId, 10) : undefined;
            if (branchId && isNaN(branchIdNum)) {
                throw new common_1.HttpException('Invalid branch ID', common_1.HttpStatus.BAD_REQUEST);
            }
            const users = await this.locationService.getAllOnlineUsers(branchIdNum);
            this.logger.log(`Admin ${req.user.sub} retrieved ${users.length} online users${branchId ? ` for branch ${branchId}` : ''}`);
            return {
                success: true,
                users,
                count: users.length,
                message: 'Online users retrieved successfully',
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Failed to get online users:`, error);
            throw new common_1.HttpException(error.message || 'Failed to get online users', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getNearbyUsers(req, radius) {
        try {
            const userId = req.user.sub;
            let radiusKm = 5;
            if (radius) {
                radiusKm = parseFloat(radius);
                if (isNaN(radiusKm) || radiusKm < 0) {
                    throw new common_1.HttpException('Invalid radius value', common_1.HttpStatus.BAD_REQUEST);
                }
                radiusKm = Math.min(radiusKm, 100);
            }
            const users = await this.locationService.getNearbyUsers(userId, radiusKm);
            this.logger.log(`Retrieved ${users.length} nearby users for user ${userId} within ${radiusKm}km`);
            return {
                success: true,
                users,
                count: users.length,
                radius: radiusKm,
                message: 'Nearby users retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get nearby users for user ${req.user?.sub}:`, error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException('Your location not found. Please update your location first.', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException(error.message || 'Failed to get nearby users', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async deleteMyLocation(req) {
        try {
            const userId = req.user.sub;
            await this.locationService.deleteUserLocation(userId);
            this.logger.log(`Deleted location for user ${userId}`);
            return {
                success: true,
                message: 'Location deleted successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to delete location for user ${req.user?.sub}:`, error);
            if (error.message.includes('not found')) {
                throw new common_1.HttpException('Location not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException(error.message || 'Failed to delete location', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async setOffline(req) {
        try {
            const userId = req.user.sub;
            await this.locationService.setUserOffline(userId);
            this.logger.log(`Set user ${userId} offline`);
            return {
                success: true,
                message: 'User set to offline successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to set user ${req.user?.sub} offline:`, error);
            throw new common_1.HttpException(error.message || 'Failed to set offline', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getLocationStats(req) {
        try {
            if (req.user.role !== 'ADMIN') {
                throw new common_1.ForbiddenException('Only admins can view location statistics');
            }
            const stats = await this.locationService.getLocationStats();
            this.logger.log(`Admin ${req.user.sub} retrieved location statistics`);
            return {
                success: true,
                stats,
                message: 'Location statistics retrieved successfully',
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Failed to get location stats:`, error);
            throw new common_1.HttpException(error.message || 'Failed to get location statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async cleanupOfflineUsers(req, hours) {
        try {
            if (req.user.role !== 'ADMIN') {
                throw new common_1.ForbiddenException('Only admins can cleanup offline locations');
            }
            let hoursNum = 24;
            if (hours) {
                hoursNum = parseInt(hours, 10);
                if (isNaN(hoursNum) || hoursNum < 1) {
                    throw new common_1.HttpException('Invalid hours value', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            const deletedCount = await this.locationService.cleanupOfflineUsers(hoursNum);
            this.logger.log(`Admin ${req.user.sub} cleaned up ${deletedCount} offline locations older than ${hoursNum} hours`);
            return {
                success: true,
                deletedCount,
                message: `Cleaned up ${deletedCount} offline locations successfully`,
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Failed to cleanup offline locations:`, error);
            throw new common_1.HttpException(error.message || 'Failed to cleanup offline locations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.LocationController = LocationController;
__decorate([
    (0, common_1.Post)('update'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true })),
    (0, swagger_1.ApiOperation)({ summary: 'Update user location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid coordinates or data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_location_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)('my-location'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location found successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Location not found' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getMyLocation", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific user location (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'Target user ID', type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User location found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User location not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getUserLocation", null);
__decorate([
    (0, common_1.Get)('online-users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all online users (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, description: 'Filter by branch ID', type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of online users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getOnlineUsers", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({ summary: 'Get nearby users within specified radius' }),
    (0, swagger_1.ApiQuery)({ name: 'radius', required: false, description: 'Radius in kilometers (default: 5, max: 100)', type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of nearby users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid radius' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User location not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getNearbyUsers", null);
__decorate([
    (0, common_1.Delete)('my-location'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete current user location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Location not found' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "deleteMyLocation", null);
__decorate([
    (0, common_1.Put)('offline'),
    (0, swagger_1.ApiOperation)({ summary: 'Set current user offline' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User set to offline successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "setOffline", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get location statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location statistics retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getLocationStats", null);
__decorate([
    (0, common_1.Delete)('cleanup-offline'),
    (0, swagger_1.ApiOperation)({ summary: 'Cleanup old offline user locations (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'hours', required: false, description: 'Remove offline locations older than X hours (default: 24)', type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Offline locations cleaned up successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Admin access required' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('hours')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "cleanupOfflineUsers", null);
exports.LocationController = LocationController = __decorate([
    (0, swagger_1.ApiTags)('Location'),
    (0, common_1.Controller)('location'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [location_service_1.LocationService])
], LocationController);
//# sourceMappingURL=location.controller.js.map