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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LocationService = class LocationService {
    prisma;
    logger = new common_1.Logger('LocationService');
    constructor(prisma) {
        this.prisma = prisma;
    }
    validateCoordinates(latitude, longitude) {
        const isValid = latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
        if (!isValid) {
            this.logger.warn(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
        }
        return isValid;
    }
    async updateUserLocation(userId, data) {
        if (!this.validateCoordinates(data.latitude, data.longitude)) {
            this.logger.error(`Invalid coordinates for user ${userId}:`, {
                latitude: data.latitude,
                longitude: data.longitude
            });
            throw new Error('Invalid coordinates');
        }
        if ((Math.abs(data.latitude - 41.3111) < 0.01 && Math.abs(data.longitude - 69.2797) < 0.01) ||
            (Math.abs(data.latitude - 41.2995) < 0.01 && Math.abs(data.longitude - 69.2401) < 0.01)) {
            this.logger.warn(`Default Tashkent coordinates for user ${userId}, rejecting update`);
            throw new Error('Default Tashkent coordinates are not allowed');
        }
        try {
            const updatedLocation = await this.prisma.userLocation.upsert({
                where: { userId },
                update: {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    address: data.address,
                    isOnline: data.isOnline ?? true,
                    lastSeen: new Date(),
                    updatedAt: new Date(),
                },
                create: {
                    userId,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    address: data.address,
                    isOnline: data.isOnline ?? true,
                    lastSeen: new Date(),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            role: true,
                            branch: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            this.logger.log(`Updated location for user ${userId}:`, {
                lat: updatedLocation.latitude,
                lng: updatedLocation.longitude,
                isOnline: updatedLocation.isOnline,
                address: updatedLocation.address
            });
            return updatedLocation;
        }
        catch (error) {
            this.logger.error(`Failed to update location for user ${userId}:`, error);
            throw new Error(`Failed to update location: ${error.message}`);
        }
    }
    async getUserLocation(userId) {
        try {
            const location = await this.prisma.userLocation.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            role: true,
                            branch: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!location) {
                this.logger.warn(`Location for user ${userId} not found`);
                throw new common_1.NotFoundException(`Location for user ${userId} not found`);
            }
            if ((Math.abs(location.latitude - 41.3111) < 0.01 && Math.abs(location.longitude - 69.2797) < 0.01) ||
                (Math.abs(location.latitude - 41.2995) < 0.01 && Math.abs(location.longitude - 69.2401) < 0.01)) {
                this.logger.warn(`User ${userId} has default Tashkent coordinates`);
                throw new common_1.NotFoundException(`User ${userId} has default Tashkent coordinates`);
            }
            this.logger.log(`Fetched location for user ${userId}`);
            return location;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to get location for user ${userId}:`, error);
            throw new Error(`Failed to get user location: ${error.message}`);
        }
    }
    async getAllOnlineUsers(branchId) {
        try {
            const whereCondition = {
                isOnline: true,
            };
            if (branchId) {
                whereCondition.user = { branchId };
            }
            const users = await this.prisma.userLocation.findMany({
                where: whereCondition,
                include: {
                    user: {
                        select: {
                            id: true,
                            role: true,
                            branch: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    lastSeen: 'desc',
                },
            });
            const validUsers = users.filter((user) => !((Math.abs(user.latitude - 41.3111) < 0.01 && Math.abs(user.longitude - 69.2797) < 0.01) ||
                (Math.abs(user.latitude - 41.2995) < 0.01 && Math.abs(user.longitude - 69.2401) < 0.01)));
            this.logger.log(`Fetched ${validUsers.length}/${users.length} valid online users${branchId ? ` for branch ${branchId}` : ''}`);
            return validUsers;
        }
        catch (error) {
            this.logger.error('Failed to get all online users:', error);
            throw new Error(`Failed to get online users: ${error.message}`);
        }
    }
    async getNearbyUsers(userId, radius) {
        try {
            const userLocation = await this.getUserLocation(userId);
            const allLocations = await this.prisma.userLocation.findMany({
                where: {
                    isOnline: true,
                    userId: { not: userId },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            role: true,
                            branch: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            const nearbyUsers = allLocations
                .map((loc) => {
                if ((Math.abs(loc.latitude - 41.3111) < 0.01 && Math.abs(loc.longitude - 69.2797) < 0.01) ||
                    (Math.abs(loc.latitude - 41.2995) < 0.01 && Math.abs(loc.longitude - 69.2401) < 0.01)) {
                    return null;
                }
                const distance = this.calculateDistance(userLocation.latitude, userLocation.longitude, loc.latitude, loc.longitude);
                if (distance <= radius) {
                    return {
                        ...loc,
                        distance: Math.round(distance * 100) / 100
                    };
                }
                return null;
            })
                .filter((loc) => loc !== null)
                .sort((a, b) => a.distance - b.distance);
            this.logger.log(`Found ${nearbyUsers.length} nearby users for user ${userId} within ${radius}km`);
            return nearbyUsers;
        }
        catch (error) {
            this.logger.error(`Failed to get nearby users for user ${userId}:`, error);
            throw new Error(`Failed to get nearby users: ${error.message}`);
        }
    }
    async setUserOffline(userId) {
        try {
            const result = await this.prisma.userLocation.updateMany({
                where: { userId },
                data: {
                    isOnline: false,
                    lastSeen: new Date(),
                    updatedAt: new Date()
                },
            });
            if (result.count === 0) {
                this.logger.warn(`No location record found for user ${userId} to set offline`);
                return;
            }
            this.logger.log(`Set user ${userId} offline`);
        }
        catch (error) {
            this.logger.error(`Failed to set user ${userId} offline:`, error);
        }
    }
    async deleteUserLocation(userId) {
        try {
            await this.prisma.userLocation.delete({
                where: { userId },
            });
            this.logger.log(`Deleted location for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete location for user ${userId}:`, error);
            throw new common_1.NotFoundException(`Location for user ${userId} not found`);
        }
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    async getLocationStats() {
        try {
            const totalUsers = await this.prisma.userLocation.count();
            const onlineUsers = await this.prisma.userLocation.count({
                where: { isOnline: true }
            });
            const stats = {
                totalUsers,
                onlineUsers,
                offlineUsers: totalUsers - onlineUsers
            };
            this.logger.log('Location stats:', stats);
            return stats;
        }
        catch (error) {
            this.logger.error('Failed to get location stats:', error);
            throw new Error('Failed to get location statistics');
        }
    }
    async cleanupOfflineUsers(olderThanHours = 24) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);
            const result = await this.prisma.userLocation.deleteMany({
                where: {
                    isOnline: false,
                    lastSeen: {
                        lt: cutoffDate
                    }
                }
            });
            this.logger.log(`Cleaned up ${result.count} offline user locations older than ${olderThanHours} hours`);
            return result.count;
        }
        catch (error) {
            this.logger.error('Failed to cleanup offline users:', error);
            throw new Error('Failed to cleanup offline users');
        }
    }
};
exports.LocationService = LocationService;
exports.LocationService = LocationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LocationService);
//# sourceMappingURL=location.service.js.map