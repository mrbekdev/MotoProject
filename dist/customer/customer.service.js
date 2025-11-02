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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomerService = class CustomerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrFindByName(customerName) {
        if (!customerName || customerName === 'Номаълум Мижоз') {
            return null;
        }
        const email = `${customerName.replace(/\s+/g, '').toLowerCase()}@example.com`;
        return this.prisma.customer.upsert({
            where: { email },
            update: { fullName: customerName, updatedAt: new Date() },
            create: {
                fullName: customerName,
                email,
                phone: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async create(createCustomerDto) {
        return this.prisma.customer.create({
            data: {
                fullName: createCustomerDto.fullName,
                phone: createCustomerDto.phone || '',
                address: createCustomerDto.address,
                email: createCustomerDto.email,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: { transactions: { include: { items: { include: { product: true } } } } },
        });
        if (!customer)
            throw new common_1.HttpException('Customer not found', common_1.HttpStatus.NOT_FOUND);
        return customer;
    }
    async findAll(skip, take, filters) {
        let where = {};
        if (filters?.phone) {
            where.phone = { contains: filters.phone, mode: 'insensitive' };
        }
        if (filters?.email) {
            where.email = { contains: filters.email, mode: 'insensitive' };
        }
        if (filters?.fullName) {
            where.OR = [
                { fullName: { contains: filters.fullName, mode: 'insensitive' } },
                { firstName: { contains: filters.fullName, mode: 'insensitive' } },
                { lastName: { contains: filters.fullName, mode: 'insensitive' } }
            ];
        }
        const customers = await this.prisma.customer.findMany({
            skip,
            take,
            where,
            include: {
                transactions: {
                    include: {
                        items: { include: { product: true } },
                        paymentSchedules: {
                            include: {
                                paidBy: true
                            }
                        }
                    }
                }
            },
        });
        const customersWithRating = customers.map(customer => {
            const creditTransactions = customer.transactions.filter(t => t.paymentType === 'CREDIT' || t.paymentType === 'INSTALLMENT');
            let totalMonths = 0;
            let goodMonths = 0;
            let badMonths = 0;
            let totalCredit = 0;
            let totalPaid = 0;
            let totalRemaining = 0;
            creditTransactions.forEach(transaction => {
                totalCredit += transaction.finalTotal || 0;
                totalPaid += transaction.amountPaid || 0;
                totalRemaining += transaction.remainingBalance || 0;
                transaction.paymentSchedules.forEach(schedule => {
                    totalMonths++;
                    if (schedule.rating === 'YAXSHI') {
                        goodMonths++;
                    }
                    else if (schedule.rating === 'YOMON') {
                        badMonths++;
                    }
                });
            });
            let ratingScore = 0;
            if (totalMonths > 0) {
                const badRatio = badMonths / totalMonths;
                const goodRatio = goodMonths / totalMonths;
                if (badRatio > goodRatio) {
                    ratingScore = badRatio;
                }
                else {
                    ratingScore = 0.5 - goodRatio;
                }
            }
            return {
                ...customer,
                rating: {
                    totalMonths,
                    goodMonths,
                    badMonths,
                    totalCredit,
                    totalPaid,
                    totalRemaining,
                    ratingScore,
                    isGood: goodMonths > badMonths,
                    isBad: badMonths > goodMonths,
                    isNeutral: goodMonths === badMonths
                }
            };
        });
        customersWithRating.sort((a, b) => b.rating.ratingScore - a.rating.ratingScore);
        return customersWithRating;
    }
    async update(id, updateCustomerDto) {
        return this.prisma.customer.update({
            where: { id },
            data: {
                fullName: updateCustomerDto.fullName,
                phone: updateCustomerDto.phone,
                address: updateCustomerDto.address,
                email: updateCustomerDto.email,
                updatedAt: new Date(),
            },
        });
    }
    async remove(id) {
        return this.prisma.customer.delete({ where: { id } });
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map