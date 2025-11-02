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
exports.CurrencyExchangeRateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CurrencyExchangeRateService = class CurrencyExchangeRateService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCurrencyExchangeRateDto, userId) {
        return this.prisma.currencyExchangeRate.create({
            data: {
                ...createCurrencyExchangeRateDto,
                createdBy: userId,
            },
            include: {
                branch: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async findAll(branchId) {
        const where = { isActive: true };
        if (branchId) {
            where.OR = [
                { branchId: branchId },
                { branchId: null },
            ];
        }
        return this.prisma.currencyExchangeRate.findMany({
            where,
            include: {
                branch: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        return this.prisma.currencyExchangeRate.findUnique({
            where: { id },
            include: {
                branch: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async getActiveRate(fromCurrency, toCurrency, branchId) {
        const where = {
            fromCurrency,
            toCurrency,
            isActive: true,
        };
        if (branchId) {
            where.OR = [
                { branchId: branchId },
                { branchId: null },
            ];
        }
        return this.prisma.currencyExchangeRate.findFirst({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findByCurrencies(fromCurrency, toCurrency, branchId) {
        const where = {
            fromCurrency,
            toCurrency,
            isActive: true,
        };
        if (branchId) {
            where.OR = [
                { branchId: branchId },
                { branchId: null },
            ];
        }
        return this.prisma.currencyExchangeRate.findFirst({
            where,
            orderBy: [
                { branchId: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }
    async update(id, updateCurrencyExchangeRateDto) {
        return this.prisma.currencyExchangeRate.update({
            where: { id },
            data: updateCurrencyExchangeRateDto,
            include: {
                branch: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async remove(id) {
        return this.prisma.currencyExchangeRate.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async getCurrentRate(fromCurrency, toCurrency, branchId) {
        const rate = await this.findByCurrencies(fromCurrency, toCurrency, branchId);
        return rate?.rate || 1;
    }
    async convertCurrency(amount, fromCurrency, toCurrency, branchId) {
        if (fromCurrency === toCurrency) {
            return amount;
        }
        const rate = await this.getCurrentRate(fromCurrency, toCurrency, branchId);
        return amount * rate;
    }
};
exports.CurrencyExchangeRateService = CurrencyExchangeRateService;
exports.CurrencyExchangeRateService = CurrencyExchangeRateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CurrencyExchangeRateService);
//# sourceMappingURL=currency-exchange-rate.service.js.map