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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const { allowedBranches, workStartTime, workEndTime, workShift, ...userData } = createUserDto;
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const data = {
            ...userData,
            password: hashedPassword,
            workStartTime,
            workEndTime,
            workShift: workShift || 'DAY',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        let finalAllowedBranches = allowedBranches || [];
        if (finalAllowedBranches.length === 0) {
            const allBranches = await this.prisma.branch.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true }
            });
            finalAllowedBranches = allBranches.map(b => b.id);
        }
        data.allowedBranches = {
            create: finalAllowedBranches.map(branchId => ({
                branch: { connect: { id: branchId } }
            }))
        };
        if (userData.role === 'MARKETING') {
            delete data.branchId;
        }
        return this.prisma.user.create({
            data,
            include: {
                branch: true,
                allowedBranches: {
                    include: {
                        branch: true
                    }
                }
            }
        });
    }
    async findAll(skip, take) {
        return this.prisma.user.findMany({
            skip,
            take,
            where: {
                status: {
                    not: 'DELETED',
                },
            },
            include: {
                branch: true,
                allowedBranches: {
                    include: {
                        branch: true
                    }
                }
            },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                branch: true,
                allowedBranches: {
                    include: {
                        branch: true
                    }
                }
            },
        });
        if (!user || user.status === 'DELETED') {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async update(id, updateUserDto) {
        const { allowedBranches, workStartTime, workEndTime, workShift, ...userData } = updateUserDto;
        const data = { ...userData, updatedAt: new Date() };
        if (userData.password) {
            data.password = await bcrypt.hash(userData.password, 10);
        }
        if (workStartTime)
            data.workStartTime = workStartTime;
        if (workEndTime)
            data.workEndTime = workEndTime;
        if (workShift)
            data.workShift = workShift;
        if (allowedBranches !== undefined) {
            await this.prisma.userBranchAccess.deleteMany({
                where: { userId: id }
            });
            let finalAllowedBranches = allowedBranches;
            if (finalAllowedBranches.length === 0) {
                const allBranches = await this.prisma.branch.findMany({
                    where: { status: 'ACTIVE' },
                    select: { id: true }
                });
                finalAllowedBranches = allBranches.map(b => b.id);
            }
            data.allowedBranches = {
                create: finalAllowedBranches.map(branchId => ({
                    branch: { connect: { id: branchId } }
                }))
            };
        }
        if (userData.role === 'MARKETING') {
            delete data.branchId;
        }
        const roleEnum = userData.role;
        const updateData = {
            updatedAt: new Date(),
        };
        if (userData.firstName !== undefined)
            updateData.firstName = userData.firstName;
        if (userData.lastName !== undefined)
            updateData.lastName = userData.lastName;
        if (userData.username !== undefined)
            updateData.username = userData.username;
        if (userData.phone !== undefined)
            updateData.phone = userData.phone;
        if (userData.role !== undefined)
            updateData.role = roleEnum;
        if (userData.isActive !== undefined)
            updateData.status = userData.isActive ? 'ACTIVE' : 'DELETED';
        if (workStartTime !== undefined)
            updateData.workStartTime = workStartTime;
        if (workEndTime !== undefined)
            updateData.workEndTime = workEndTime;
        if (workShift !== undefined)
            updateData.workShift = workShift;
        if (userData.branchId !== undefined && userData.role !== 'MARKETING')
            updateData.branchId = userData.branchId;
        if (data.password)
            updateData.password = data.password;
        return this.prisma.user.update({
            where: {
                id: id
            },
            data: updateData
        });
    }
    async remove(id) {
        const findUser = await this.prisma.user.findUnique({ where: { id } });
        if (!findUser)
            throw new Error('User not found');
        return this.prisma.user.update({
            where: { id },
            data: { status: 'DELETED', updatedAt: new Date() },
        });
    }
    async findByUsername(username) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: {
                branch: true,
                allowedBranches: {
                    include: {
                        branch: true
                    }
                }
            }
        });
        return user;
    }
    async getUserWithBranches(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                branch: true,
                allowedBranches: {
                    include: {
                        branch: true
                    }
                }
            }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async checkUsernameExists(username, excludeUserId) {
        const existingUser = await this.prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });
        if (!existingUser)
            return false;
        if (excludeUserId && existingUser.id === excludeUserId) {
            return false;
        }
        return true;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map