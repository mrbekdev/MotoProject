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
exports.BranchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchService = class BranchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBranchDto) {
        const { name, location, type } = createBranchDto;
        return this.prisma.branch.create({
            data: {
                name,
                address: location || null,
                type: type || 'SAVDO_MARKAZ',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async findOne(id) {
        return this.prisma.branch.findUnique({
            where: { id, AND: { status: { not: 'DELETED' } } },
            select: {
                id: true,
                name: true,
                address: true,
                type: true,
                phoneNumber: true,
                cashBalance: true,
                createdAt: true,
                updatedAt: true,
                products: true,
                users: true,
            },
        });
    }
    async findAll() {
        return this.prisma.branch.findMany({
            where: { status: { not: 'DELETED' } },
            select: {
                id: true,
                name: true,
                address: true,
                type: true,
                phoneNumber: true,
                cashBalance: true,
                createdAt: true,
                updatedAt: true,
                products: true,
                users: true,
            },
        });
    }
    async update(id, updateBranchDto) {
        const { name, location, type } = updateBranchDto;
        return this.prisma.branch.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(location !== undefined ? { address: location } : {}),
                ...(type !== undefined ? { type: type } : {}),
                updatedAt: new Date(),
                phoneNumber: updateBranchDto.phoneNumber,
            },
        });
    }
    async remove(id) {
        const findBranch = await this.prisma.branch.findUnique({ where: { id } });
        if (!findBranch)
            throw new Error('Branch not found');
        return this.prisma.branch.update({
            where: { id },
            data: { status: 'DELETED', updatedAt: new Date() },
        });
    }
};
exports.BranchService = BranchService;
exports.BranchService = BranchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchService);
//# sourceMappingURL=branch.service.js.map