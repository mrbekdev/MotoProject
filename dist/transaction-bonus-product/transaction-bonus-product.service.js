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
exports.TransactionBonusProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionBonusProductService = class TransactionBonusProductService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsdToUzsRate(branchId) {
        const byBranch = await this.prisma.currencyExchangeRate.findMany({
            where: { fromCurrency: 'USD', toCurrency: 'UZS', isActive: true, branchId: branchId ?? undefined },
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        if (byBranch?.[0]?.rate)
            return byBranch[0].rate;
        const global = await this.prisma.currencyExchangeRate.findMany({
            where: { fromCurrency: 'USD', toCurrency: 'UZS', isActive: true, branchId: null },
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        return global?.[0]?.rate ?? 1;
    }
    async create(createTransactionBonusProductDto) {
        const { transactionId, productId, quantity } = createTransactionBonusProductDto;
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new Error('Product not found');
        }
        if (product.quantity < quantity) {
            throw new Error('Insufficient product quantity');
        }
        return this.prisma.$transaction(async (prisma) => {
            const bonusProduct = await prisma.transactionBonusProduct.create({
                data: {
                    transactionId,
                    productId,
                    quantity,
                },
                include: {
                    product: true,
                    transaction: true,
                },
            });
            await prisma.product.update({
                where: { id: productId },
                data: {
                    quantity: {
                        decrement: quantity,
                    },
                },
            });
            return bonusProduct;
        });
    }
    async createMultiple(transactionId, bonusProducts) {
        return this.prisma.$transaction(async (prisma) => {
            const createdBonusProducts = [];
            for (const bonusProduct of bonusProducts) {
                const product = await prisma.product.findUnique({
                    where: { id: bonusProduct.productId },
                });
                if (!product) {
                    console.error(`❌ Service: Product ${bonusProduct.productId} not found`);
                    throw new Error(`Product with ID ${bonusProduct.productId} not found`);
                }
                if (product.quantity < bonusProduct.quantity) {
                    console.error(`❌ Service: Insufficient quantity for product ${product.name}. Available: ${product.quantity}, Requested: ${bonusProduct.quantity}`);
                    throw new Error(`Insufficient quantity for product ${product.name}`);
                }
                const createdBonusProduct = await prisma.transactionBonusProduct.create({
                    data: {
                        transactionId,
                        productId: bonusProduct.productId,
                        quantity: bonusProduct.quantity,
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                model: true,
                                barcode: true,
                                price: true,
                                quantity: true,
                            },
                        },
                    },
                });
                console.log(`✅ Service: Created bonus product:`, {
                    id: createdBonusProduct.id,
                    transactionId: createdBonusProduct.transactionId,
                    productId: createdBonusProduct.productId,
                    quantity: createdBonusProduct.quantity,
                    productName: createdBonusProduct.product.name
                });
                const updatedProduct = await prisma.product.update({
                    where: { id: bonusProduct.productId },
                    data: {
                        quantity: {
                            decrement: bonusProduct.quantity,
                        },
                    },
                    select: { id: true, name: true, quantity: true }
                });
                console.log(`📉 Service: Updated product inventory - ${updatedProduct.name}: ${updatedProduct.quantity + bonusProduct.quantity} → ${updatedProduct.quantity}`);
                createdBonusProducts.push(createdBonusProduct);
            }
            console.log(`🎉 Service: Successfully created ${createdBonusProducts.length} bonus products for transaction ${transactionId}`);
            return createdBonusProducts;
        });
    }
    async findAll() {
        return this.prisma.transactionBonusProduct.findMany({
            include: {
                product: true,
                transaction: true,
            },
        });
    }
    async findByTransactionId(transactionId) {
        console.log(`🔍 Service: Searching for bonus products with transactionId: ${transactionId}`);
        const bonusProducts = await this.prisma.transactionBonusProduct.findMany({
            where: { transactionId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        model: true,
                        barcode: true,
                        price: true,
                        quantity: true,
                    },
                },
                transaction: {
                    select: { id: true, fromBranchId: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`📊 Service: Found ${bonusProducts.length} bonus products`);
        if (bonusProducts.length > 0) {
            bonusProducts.forEach((bp, index) => {
                console.log(`  Bonus Product ${index + 1}:`, {
                    id: bp.id,
                    transactionId: bp.transactionId,
                    productId: bp.productId,
                    quantity: bp.quantity,
                    product: bp.product ? {
                        id: bp.product.id,
                        name: bp.product.name,
                        barcode: bp.product.barcode,
                        price: bp.product.price,
                    } : null,
                });
            });
        }
        else {
            console.log('⚠️ Service: No bonus products found for this transaction');
        }
        const rate = await this.getUsdToUzsRate(bonusProducts[0]?.transaction?.fromBranchId ?? undefined);
        return bonusProducts.map((bp) => ({
            ...bp,
            product: bp.product ? { ...bp.product, priceUZS: Math.round((bp.product.price || 0) * rate) } : null,
            totalValueUZS: Math.round((bp.product?.price || 0) * rate * bp.quantity),
            usdToUzsRate: rate,
        }));
    }
    async checkTransactionExists(transactionId) {
        console.log(`🔍 Service: Checking if transaction ${transactionId} exists`);
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            select: { id: true, type: true, createdAt: true },
        });
        if (transaction) {
            console.log(`✅ Service: Transaction ${transactionId} exists:`, transaction);
        }
        else {
            console.log(`❌ Service: Transaction ${transactionId} not found`);
        }
        return transaction;
    }
    async findOne(id) {
        return this.prisma.transactionBonusProduct.findUnique({
            where: { id },
            include: {
                product: true,
                transaction: true,
            },
        });
    }
    async update(id, updateTransactionBonusProductDto) {
        return this.prisma.transactionBonusProduct.update({
            where: { id },
            data: updateTransactionBonusProductDto,
            include: {
                product: true,
                transaction: true,
            },
        });
    }
    async remove(id) {
        const bonusProduct = await this.prisma.transactionBonusProduct.findUnique({
            where: { id },
        });
        if (!bonusProduct) {
            throw new Error('Bonus product not found');
        }
        return this.prisma.$transaction(async (prisma) => {
            await prisma.product.update({
                where: { id: bonusProduct.productId },
                data: {
                    quantity: {
                        increment: bonusProduct.quantity,
                    },
                },
            });
            return prisma.transactionBonusProduct.delete({
                where: { id },
            });
        });
    }
    async getTotalBonusProductsValueByUserId(userId, startDate, endDate) {
        console.log(`🔍 Service: Getting total bonus products value for user ${userId}`);
        const whereClause = {
            transaction: {
                soldByUserId: userId,
            },
        };
        if (startDate || endDate) {
            whereClause.transaction.createdAt = {};
            if (startDate) {
                whereClause.transaction.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.transaction.createdAt.lte = new Date(endDate);
            }
        }
        const bonusProducts = await this.prisma.transactionBonusProduct.findMany({
            where: whereClause,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        model: true,
                        price: true,
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        createdAt: true,
                        soldByUserId: true,
                        fromBranchId: true,
                    },
                },
            },
        });
        console.log(`📊 Service: Found ${bonusProducts.length} bonus products for user ${userId}`);
        const rate = await this.getUsdToUzsRate(bonusProducts[0]?.transaction?.fromBranchId ?? undefined);
        const totalValueUZS = bonusProducts.reduce((sum, bonusProduct) => {
            const unitUZS = (bonusProduct.product?.price || 0) * rate;
            const productValue = unitUZS * bonusProduct.quantity;
            return sum + productValue;
        }, 0);
        console.log(`💰 Service: Total bonus products value (UZS) for user ${userId}: ${totalValueUZS}`);
        return {
            totalValueUZS,
            usdToUzsRate: rate,
            totalProducts: bonusProducts.length,
            bonusProducts: bonusProducts.map(bp => ({
                id: bp.id,
                transactionId: bp.transactionId,
                productId: bp.productId,
                quantity: bp.quantity,
                productName: bp.product?.name,
                productPriceUSD: bp.product?.price,
                productPriceUZS: Math.round((bp.product?.price || 0) * rate),
                totalProductValueUZS: Math.round((bp.product?.price || 0) * rate * bp.quantity),
                transactionDate: bp.transaction.createdAt,
            })),
        };
    }
    async createFromDescription(transactionId, bonusDescription) {
        console.log(`🔄 Service: Parsing bonus description for transaction ${transactionId}`);
        console.log('Description:', bonusDescription);
        const maxRetries = 5;
        const delayMs = 400;
        let transaction = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            transaction = await this.checkTransactionExists(transactionId);
            if (transaction)
                break;
            console.warn(`⏳ Service: Transaction ${transactionId} not found (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
            await new Promise((res) => setTimeout(res, delayMs));
        }
        if (!transaction) {
            console.error(`❌ Service: Transaction ${transactionId} not found after ${maxRetries} attempts`);
            throw new Error(`Transaction ${transactionId} not found`);
        }
        const existingBonusProducts = await this.findByTransactionId(transactionId);
        if (existingBonusProducts.length > 0) {
            console.log(`⚠️ Service: Bonus products already exist for transaction ${transactionId}, skipping creation`);
            return existingBonusProducts;
        }
        const bonusProductsData = this.parseBonusProductsFromDescription(bonusDescription);
        if (bonusProductsData.length === 0) {
            console.log(`⚠️ Service: No bonus products found in description`);
            return [];
        }
        console.log(`📦 Service: Found ${bonusProductsData.length} bonus products in description:`, bonusProductsData);
        try {
            const createdBonusProducts = await this.createMultiple(transactionId, bonusProductsData);
            console.log(`✅ Service: Successfully created ${createdBonusProducts.length} bonus products from description`);
            return createdBonusProducts;
        }
        catch (error) {
            console.error(`❌ Service: Error creating bonus products from description:`, error);
            console.log(`🔄 Service: Attempting to create generic bonus products without inventory deduction`);
            return this.createGenericBonusProducts(transactionId, bonusProductsData);
        }
    }
    parseBonusProductsFromDescription(description) {
        const bonusProducts = [];
        console.log('🔍 Service: Parsing bonus description:', description);
        const bonusProductsMatch = description.match(/Bonus mahsulotlar:\s*([^.]+)/);
        if (bonusProductsMatch) {
            console.log('📦 Service: Found bonus products section:', bonusProductsMatch[1]);
            const productsText = bonusProductsMatch[1];
            const productMatches = productsText.match(/([^,]+)\s*x(\d+)/g);
            if (productMatches) {
                console.log('🔍 Service: Found product matches:', productMatches);
                productMatches.forEach((match, index) => {
                    const [, productName, quantityStr] = match.match(/([^,]+)\s*x(\d+)/) || [];
                    if (productName && quantityStr) {
                        console.log(`📦 Service: Parsed product ${index + 1}: ${productName.trim()} x${quantityStr}`);
                        bonusProducts.push({
                            productId: 1,
                            quantity: parseInt(quantityStr)
                        });
                    }
                });
            }
        }
        const valueMatch = description.match(/Bonus mahsulotlar qiymati:\s*([\d,]+)/);
        if (valueMatch && bonusProducts.length === 0) {
            const totalValue = parseInt(valueMatch[1].replace(/,/g, ''));
            console.log('💰 Service: Found bonus products value:', totalValue);
            if (totalValue > 0) {
                if (totalValue >= 200000) {
                    bonusProducts.push({ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }, { productId: 3, quantity: 1 });
                }
                else if (totalValue >= 100000) {
                    bonusProducts.push({ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 });
                }
                else if (totalValue >= 50000) {
                    bonusProducts.push({ productId: 1, quantity: 1 });
                }
                else {
                    bonusProducts.push({ productId: 1, quantity: 1 });
                }
                console.log(`📦 Service: Creating ${bonusProducts.length} bonus products based on value ${totalValue}`);
            }
        }
        if (bonusProducts.length === 0) {
            const somMatch = description.match(/([\d,]+)\s*so[ʻ']m/i);
            if (somMatch) {
                const value = parseInt(somMatch[1].replace(/,/g, ''));
                console.log('💰 Service: Found som value in description:', value);
                if (value > 10000) {
                    if (value >= 200000) {
                        bonusProducts.push({ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 });
                    }
                    else if (value >= 100000) {
                        bonusProducts.push({ productId: 1, quantity: 2 });
                    }
                    else {
                        bonusProducts.push({ productId: 1, quantity: 1 });
                    }
                    console.log(`📦 Service: Creating ${bonusProducts.length} bonus products based on som value ${value}`);
                }
            }
        }
        console.log(`✅ Service: Parsed ${bonusProducts.length} bonus products from description`);
        return bonusProducts;
    }
    async createGenericBonusProducts(transactionId, bonusProductsData) {
        console.log(`🔄 Service: Creating generic bonus products without inventory deduction`);
        const availableProducts = await this.prisma.product.findMany({
            where: {
                quantity: { gt: 0 }
            },
            select: { id: true, name: true, model: true, price: true, barcode: true },
            take: 10,
            orderBy: { price: 'asc' }
        });
        if (availableProducts.length === 0) {
            console.log(`⚠️ Service: No products available for bonus products`);
            return [];
        }
        const createdBonusProducts = [];
        for (const bonusProductData of bonusProductsData) {
            const productIndex = createdBonusProducts.length % availableProducts.length;
            const selectedProduct = availableProducts[productIndex];
            const bonusProduct = await this.prisma.transactionBonusProduct.create({
                data: {
                    transactionId,
                    productId: selectedProduct.id,
                    quantity: bonusProductData.quantity,
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            barcode: true,
                            price: true,
                            quantity: true,
                        },
                    },
                },
            });
            createdBonusProducts.push(bonusProduct);
            console.log(`✅ Service: Created bonus product record:`, {
                id: bonusProduct.id,
                transactionId: bonusProduct.transactionId,
                productId: bonusProduct.productId,
                quantity: bonusProduct.quantity,
                productName: bonusProduct.product.name,
                productPrice: bonusProduct.product.price
            });
        }
        return createdBonusProducts;
    }
};
exports.TransactionBonusProductService = TransactionBonusProductService;
exports.TransactionBonusProductService = TransactionBonusProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionBonusProductService);
//# sourceMappingURL=transaction-bonus-product.service.js.map