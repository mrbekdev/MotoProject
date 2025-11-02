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
exports.UserBranchAccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UserBranchAccessService = class UserBranchAccessService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: +createDto.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${createDto.userId} not found`);
        }
        const branch = await this.prisma.branch.findUnique({
            where: { id: +createDto.branchId },
        });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch with ID ${createDto.branchId} not found`);
        }
        const existingAccess = await this.prisma.userBranchAccess.findUnique({
            where: {
                userId_branchId: {
                    userId: +createDto.userId,
                    branchId: +createDto.branchId,
                },
            },
        });
        if (existingAccess) {
            throw new Error('User already has access to this branch');
        }
        const access = await this.prisma.userBranchAccess.create({
            data: {
                userId: +createDto.userId,
                branchId: +createDto.branchId,
            },
            select: {
                id: true,
                userId: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return access;
    }
    async findAll() {
        return this.prisma.userBranchAccess.findMany({
            select: {
                id: true,
                userId: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const access = await this.prisma.userBranchAccess.findUnique({
            where: { id: +id },
            select: {
                id: true,
                userId: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!access) {
            throw new common_1.NotFoundException(`UserBranchAccess with ID ${id} not found`);
        }
        return access;
    }
    async update(id, updateDto) {
        const existingAccess = await this.prisma.userBranchAccess.findUnique({
            where: { id: +id },
        });
        if (!existingAccess) {
            throw new common_1.NotFoundException(`UserBranchAccess with ID ${id} not found`);
        }
        if (updateDto.userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: +updateDto.userId },
            });
            if (!user) {
                throw new common_1.NotFoundException(`User with ID ${updateDto.userId} not found`);
            }
        }
        if (updateDto.branchId) {
            const branch = await this.prisma.branch.findUnique({
                where: { id: +updateDto.branchId },
            });
            if (!branch) {
                throw new common_1.NotFoundException(`Branch with ID ${updateDto.branchId} not found`);
            }
        }
        if (updateDto.userId || updateDto.branchId) {
            const userId = updateDto.userId || existingAccess.userId;
            const branchId = updateDto.branchId || existingAccess.branchId;
            const duplicate = await this.prisma.userBranchAccess.findFirst({
                where: {
                    userId: +userId,
                    branchId: +branchId,
                    id: { not: +id },
                },
            });
            if (duplicate) {
                throw new Error('This user-branch access already exists');
            }
        }
        const updatedAccess = await this.prisma.userBranchAccess.update({
            where: { id },
            data: updateDto,
            select: {
                id: true,
                userId: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return updatedAccess;
    }
    async remove(id) {
        const access = await this.prisma.userBranchAccess.findUnique({
            where: { id: +id },
        });
        if (!access) {
            throw new common_1.NotFoundException(`UserBranchAccess with ID ${id} not found`);
        }
        await this.prisma.userBranchAccess.delete({
            where: { id: +id },
        });
    }
    async findByUserId(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        return this.prisma.userBranchAccess.findMany({
            where: { userId: +userId },
            select: {
                id: true,
                userId: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                    },
                },
            },
        });
    }
    async findByBranchId(branchId) {
        const branch = await this.prisma.branch.findUnique({
            where: { id: branchId },
        });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch with ID ${branchId} not found`);
        }
        return this.prisma.userBranchAccess.findMany({
            where: { branchId: +branchId },
            select: {
                id: true,
                userId: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
        });
    }
};
exports.UserBranchAccessService = UserBranchAccessService;
exports.UserBranchAccessService = UserBranchAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserBranchAccessService);
//# sourceMappingURL=user-branch-access.service.js.map