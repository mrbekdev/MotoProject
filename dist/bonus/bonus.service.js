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
exports.BonusService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BonusService = class BonusService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBonusDto, createdById) {
        const { bonusDate, ...rest } = createBonusDto;
        return this.prisma.bonus.create({
            data: {
                ...rest,
                bonusDate: bonusDate ? new Date(bonusDate) : new Date(),
                createdById,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
    async findAll(skip = 0, take = 100) {
        return this.prisma.bonus.findMany({
            skip,
            take,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
    async findByUserId(userId, skip = 0, take = 100) {
        return this.prisma.bonus.findMany({
            where: {
                userId,
            },
            skip,
            take,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const bonus = await this.prisma.bonus.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!bonus) {
            throw new common_1.NotFoundException('Bonus not found');
        }
        return bonus;
    }
    async update(id, updateBonusDto) {
        const bonus = await this.prisma.bonus.findUnique({
            where: { id },
        });
        if (!bonus) {
            throw new common_1.NotFoundException('Bonus not found');
        }
        const { bonusDate, ...rest } = updateBonusDto;
        return this.prisma.bonus.update({
            where: { id },
            data: {
                ...rest,
                ...(bonusDate && { bonusDate: new Date(bonusDate) }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
    async remove(id) {
        const bonus = await this.prisma.bonus.findUnique({
            where: { id },
        });
        if (!bonus) {
            throw new common_1.NotFoundException('Bonus not found');
        }
        return this.prisma.bonus.delete({
            where: { id },
        });
    }
    async getTotalBonusByUserId(userId) {
        const result = await this.prisma.bonus.aggregate({
            where: {
                userId,
            },
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });
        return {
            totalAmount: result._sum.amount || 0,
            totalCount: result._count.id || 0,
        };
    }
    async findByTransactionId(transactionId) {
        const bonuses = await this.prisma.bonus.findMany({
            where: {
                transactionId: transactionId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        total: true,
                        finalTotal: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return bonuses;
    }
};
exports.BonusService = BonusService;
exports.BonusService = BonusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BonusService);
//# sourceMappingURL=bonus.service.js.map