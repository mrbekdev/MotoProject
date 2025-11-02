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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const XLSX = require("xlsx");
const currency_exchange_rate_service_1 = require("../currency-exchange-rate/currency-exchange-rate.service");
let ProductService = class ProductService {
    prisma;
    currencyExchangeRateService;
    constructor(prisma, currencyExchangeRateService) {
        this.prisma = prisma;
        this.currencyExchangeRateService = currencyExchangeRateService;
    }
    async generateUniqueBarcode(tx) {
        let counterRecord = await tx.barcodeCounter.findFirst();
        if (!counterRecord) {
            counterRecord = await tx.barcodeCounter.create({
                data: { counter: 1n },
            });
        }
        else {
            counterRecord = await tx.barcodeCounter.update({
                where: { id: counterRecord.id },
                data: {
                    counter: { increment: 1 },
                },
            });
        }
        return counterRecord.counter.toString();
    }
    async create(createProductDto, userId, prismaClient = this.prisma) {
        const product = await prismaClient.product.create({
            data: {
                name: createProductDto.name,
                barcode: await this.generateUniqueBarcode(prismaClient),
                categoryId: createProductDto.categoryId,
                branchId: createProductDto.branchId,
                price: createProductDto.price,
                marketPrice: createProductDto.marketPrice,
                model: createProductDto.model,
                initialQuantity: createProductDto.quantity,
                quantity: createProductDto.quantity,
                status: createProductDto.status || 'IN_STORE',
                defectiveQuantity: 0,
                bonusPercentage: createProductDto.bonusPercentage || 0,
                sizeType: createProductDto.sizeType || 'NONE',
                sizeLabel: createProductDto.sizeLabel,
                sizeNumber: createProductDto.sizeNumber,
                areaSqm: createProductDto.areaSqm,
            },
        });
        if (createProductDto.quantity && createProductDto.quantity > 0) {
            const transaction = await prismaClient.transaction.create({
                data: {
                    userId,
                    type: 'PURCHASE',
                    status: 'COMPLETED',
                    discount: 0,
                    total: 0,
                    finalTotal: 0,
                    amountPaid: 0,
                    remainingBalance: 0,
                    description: 'Initial stock for product creation',
                },
            });
            await prismaClient.transactionItem.create({
                data: {
                    transactionId: transaction.id,
                    productId: product.id,
                    quantity: createProductDto.quantity,
                    price: 0,
                    total: 0,
                },
            });
        }
        return product;
    }
    async findAll(branchId, search, includeZeroQuantity = false) {
        const where = {};
        if (branchId)
            where.branchId = +branchId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (!includeZeroQuantity) {
            where.quantity = { gt: 0 };
        }
        const products = await this.prisma.product.findMany({
            where,
            include: { category: true, branch: true },
            orderBy: { id: 'asc' },
        });
        const productsWithSomPrices = await Promise.all(products.map(async (product) => {
            const priceInSom = await this.currencyExchangeRateService.convertCurrency(product.price, 'USD', 'UZS', product.branchId);
            return {
                ...product,
                priceInSom,
                priceInDollar: product.price,
            };
        }));
        return productsWithSomPrices;
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                branch: true,
                category: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        }
        const priceInSom = await this.currencyExchangeRateService.convertCurrency(product.price, 'USD', 'UZS', product.branchId);
        return {
            ...product,
            priceInSom,
            priceInDollar: product.price,
        };
    }
    async findOneByBranch(id, branchId) {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                branchId
            },
            include: {
                branch: true,
                category: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        }
        const priceInSom = await this.currencyExchangeRateService.convertCurrency(product.price, 'USD', 'UZS', product.branchId);
        return {
            ...product,
            priceInSom,
            priceInDollar: product.price,
        };
    }
    async update(id, updateProductDto, userId, prismaClient = this.prisma) {
        const product = await prismaClient.product.findUnique({ where: { id } });
        if (!product) {
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        }
        const isPriceUpdated = updateProductDto.price !== undefined && updateProductDto.price !== product.price;
        const isMarketPriceUpdated = updateProductDto.marketPrice !== undefined && updateProductDto.marketPrice !== product.marketPrice;
        const isBonusUpdated = updateProductDto.bonusPercentage !== undefined && updateProductDto.bonusPercentage !== product.bonusPercentage;
        const updatedProduct = await prismaClient.product.update({
            where: { id },
            data: {
                name: updateProductDto.name,
                categoryId: updateProductDto.categoryId,
                branchId: updateProductDto.branchId,
                price: updateProductDto.price,
                marketPrice: updateProductDto.marketPrice,
                model: updateProductDto.model,
                status: updateProductDto.status,
                quantity: updateProductDto.quantity,
                bonusPercentage: updateProductDto.bonusPercentage,
                sizeType: updateProductDto.sizeType,
                sizeLabel: updateProductDto.sizeLabel,
                sizeNumber: updateProductDto.sizeNumber,
                areaSqm: updateProductDto.areaSqm,
            },
        });
        if ((isPriceUpdated || isMarketPriceUpdated || isBonusUpdated) && updatedProduct.name && updatedProduct.model) {
            const updateData = {};
            if (isPriceUpdated) {
                updateData.price = updatedProduct.price;
            }
            if (isMarketPriceUpdated) {
                updateData.marketPrice = updatedProduct.marketPrice;
            }
            if (isBonusUpdated) {
                updateData.bonusPercentage = updatedProduct.bonusPercentage;
            }
            await prismaClient.product.updateMany({
                where: {
                    name: updatedProduct.name,
                    model: updatedProduct.model,
                    id: { not: id },
                },
                data: updateData,
            });
        }
        const priceInSom = await this.currencyExchangeRateService.convertCurrency(updatedProduct.price, 'USD', 'UZS', updatedProduct.branchId);
        return {
            ...updatedProduct,
            priceInSom,
            priceInDollar: updatedProduct.price,
        };
    }
    async markAsDefective(id, description, userId) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id } });
            if (!product) {
                throw new common_1.NotFoundException('Mahsulot topilmadi');
            }
            if (product.quantity === 0) {
                throw new common_1.BadRequestException('Mahsulot miqdori 0 ga teng, defective qilib bo\'lmaydi');
            }
            const defectiveQty = product.quantity;
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    status: 'DEFECTIVE',
                    defectiveQuantity: (product.defectiveQuantity || 0) + defectiveQty,
                    quantity: 0,
                },
            });
            await tx.defectiveLog.create({
                data: {
                    productId: id,
                    quantity: defectiveQty,
                    description,
                    userId,
                },
            });
            const transDesc = `Mahsulot to'liq defective qilib belgilandi. ${defectiveQty} ta. Sababi: ${description}`;
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: 'WRITE_OFF',
                    status: 'COMPLETED',
                    discount: 0,
                    total: 0,
                    finalTotal: 0,
                    amountPaid: 0,
                    remainingBalance: 0,
                    description: transDesc,
                },
            });
            await tx.transactionItem.create({
                data: {
                    transactionId: transaction.id,
                    productId: id,
                    quantity: defectiveQty,
                    price: 0,
                    total: 0,
                },
            });
            return updatedProduct;
        });
    }
    async markPartialDefective(id, defectiveCount, description, userId) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id } });
            if (!product) {
                throw new common_1.NotFoundException('Mahsulot topilmadi');
            }
            if (defectiveCount <= 0) {
                throw new common_1.BadRequestException('Defective miqdor 0 dan katta bo\'lishi kerak');
            }
            if (defectiveCount > product.quantity) {
                throw new common_1.BadRequestException('Defective miqdor mavjud mahsulot miqdoridan ko\'p bo\'lishi mumkin emas');
            }
            const newQuantity = product.quantity - defectiveCount;
            const newDefectiveQuantity = (product.defectiveQuantity || 0) + defectiveCount;
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    quantity: newQuantity,
                    defectiveQuantity: newDefectiveQuantity,
                    status: newQuantity === 0 ? 'DEFECTIVE' : product.status,
                },
            });
            await tx.defectiveLog.create({
                data: {
                    productId: id,
                    quantity: defectiveCount,
                    description,
                    userId,
                },
            });
            const transDesc = `${defectiveCount} ta mahsulot defective qilib belgilandi. Sababi: ${description}`;
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: 'WRITE_OFF',
                    status: 'COMPLETED',
                    discount: 0,
                    total: 0,
                    finalTotal: 0,
                    amountPaid: 0,
                    remainingBalance: 0,
                    description: transDesc,
                },
            });
            await tx.transactionItem.create({
                data: {
                    transactionId: transaction.id,
                    productId: id,
                    quantity: defectiveCount,
                    price: 0,
                    total: 0,
                },
            });
            return updatedProduct;
        });
    }
    async restoreDefectiveProduct(id, restoreCount, userId) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id } });
            if (!product) {
                throw new common_1.NotFoundException('Mahsulot topilmadi');
            }
            if (!product.defectiveQuantity || product.defectiveQuantity === 0) {
                throw new common_1.BadRequestException('Bu mahsulotda defective miqdor mavjud emas');
            }
            if (restoreCount <= 0) {
                throw new common_1.BadRequestException('Qaytarish miqdori 0 dan katta bo\'lishi kerak');
            }
            if (restoreCount > product.defectiveQuantity) {
                throw new common_1.BadRequestException('Qaytarish miqdori defective miqdoridan ko\'p bo\'lishi mumkin emas');
            }
            const newQuantity = product.quantity + restoreCount;
            const newDefectiveQuantity = product.defectiveQuantity - restoreCount;
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    quantity: newQuantity,
                    defectiveQuantity: newDefectiveQuantity,
                    status: newDefectiveQuantity === 0 ? 'FIXED' : product.status,
                },
            });
            const transDesc = `${restoreCount} ta defective mahsulot qaytarildi`;
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: 'RETURN',
                    status: 'COMPLETED',
                    discount: 0,
                    total: 0,
                    finalTotal: 0,
                    amountPaid: 0,
                    remainingBalance: 0,
                    description: transDesc,
                },
            });
            await tx.transactionItem.create({
                data: {
                    transactionId: transaction.id,
                    productId: id,
                    quantity: restoreCount,
                    price: 0,
                    total: 0,
                },
            });
            return updatedProduct;
        });
    }
    async bulkMarkDefective(ids, description, userId) {
        return this.prisma.$transaction(async (tx) => {
            const products = await tx.product.findMany({ where: { id: { in: ids } } });
            if (products.length !== ids.length) {
                throw new common_1.NotFoundException('Ba\'zi mahsulotlar topilmadi');
            }
            for (const product of products) {
                if (product.quantity === 0) {
                    continue;
                }
                const defectiveQty = product.quantity;
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        status: 'DEFECTIVE',
                        defectiveQuantity: defectiveQty,
                        quantity: 0,
                    },
                });
                await tx.defectiveLog.create({
                    data: {
                        productId: product.id,
                        quantity: defectiveQty,
                        description,
                        userId,
                    },
                });
                const transDesc = `Bulk: Mahsulot to'liq defective qilib belgilandi. ${defectiveQty} ta. Sababi: ${description}`;
                const transaction = await tx.transaction.create({
                    data: {
                        userId,
                        type: 'WRITE_OFF',
                        status: 'COMPLETED',
                        discount: 0,
                        total: 0,
                        finalTotal: 0,
                        amountPaid: 0,
                        remainingBalance: 0,
                        description: transDesc,
                    },
                });
                await tx.transactionItem.create({
                    data: {
                        transactionId: transaction.id,
                        productId: product.id,
                        quantity: defectiveQty,
                        price: 0,
                        total: 0,
                    },
                });
            }
            return { message: 'Tanlangan mahsulotlar defective qilindi', count: ids.length };
        });
    }
    async bulkRestoreDefective(ids, userId) {
        return this.prisma.$transaction(async (tx) => {
            const products = await tx.product.findMany({ where: { id: { in: ids } } });
            if (products.length !== ids.length) {
                throw new common_1.NotFoundException('Ba\'zi mahsulotlar topilmadi');
            }
            for (const product of products) {
                if (!product.defectiveQuantity || product.defectiveQuantity === 0) {
                    continue;
                }
                const restoreCount = product.defectiveQuantity;
                const newQuantity = product.quantity + restoreCount;
                const newDefectiveQuantity = 0;
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        quantity: newQuantity,
                        defectiveQuantity: newDefectiveQuantity,
                        status: 'FIXED',
                    },
                });
                const transDesc = `Bulk: ${restoreCount} ta defective mahsulot qaytarildi`;
                const transaction = await tx.transaction.create({
                    data: {
                        userId,
                        type: 'RETURN',
                        status: 'COMPLETED',
                        discount: 0,
                        total: 0,
                        finalTotal: 0,
                        amountPaid: 0,
                        remainingBalance: 0,
                        description: transDesc,
                    },
                });
                await tx.transactionItem.create({
                    data: {
                        transactionId: transaction.id,
                        productId: product.id,
                        quantity: restoreCount,
                        price: 0,
                        total: 0,
                    },
                });
            }
            return { message: 'Tanlangan defective mahsulotlar qaytarildi', count: ids.length };
        });
    }
    async getDefectiveProducts(branchId) {
        const where = {
            defectiveQuantity: { gt: 0 },
        };
        if (branchId) {
            where.branchId = branchId;
        }
        const products = await this.prisma.product.findMany({
            where,
            include: {
                category: true,
                branch: true,
            },
            orderBy: { id: 'asc' },
        });
        const productsWithSomPrices = await Promise.all(products.map(async (product) => {
            const priceInSom = await this.currencyExchangeRateService.convertCurrency(product.price, 'USD', 'UZS', product.branchId);
            return {
                ...product,
                priceInSom,
                priceInDollar: product.price,
            };
        }));
        return productsWithSomPrices;
    }
    async getFixedProducts(branchId) {
        const where = {
            status: 'FIXED',
        };
        if (branchId) {
            where.branchId = branchId;
        }
        const products = await this.prisma.product.findMany({
            where,
            include: {
                category: true,
                branch: true,
            },
            orderBy: { id: 'asc' },
        });
        const productsWithSomPrices = await Promise.all(products.map(async (product) => {
            const priceInSom = await this.currencyExchangeRateService.convertCurrency(product.price, 'USD', 'UZS', product.branchId);
            return {
                ...product,
                priceInSom,
                priceInDollar: product.price,
            };
        }));
        return productsWithSomPrices;
    }
    async remove(id, userId) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id } });
            if (!product) {
                throw new common_1.NotFoundException('Mahsulot topilmadi');
            }
            const deletedProduct = await tx.product.delete({
                where: { id },
            });
            return deletedProduct;
        });
    }
    async uploadExcel(file, fromBranchId, categoryId, status, userId) {
        try {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            return this.prisma.$transaction(async (tx) => {
                for (const row of data) {
                    let barcode = row['barcode'] ? String(row['barcode']) : null;
                    if (!barcode) {
                        barcode = await this.generateUniqueBarcode(tx);
                    }
                    const createProductDto = {
                        barcode: barcode,
                        name: String(row['name'] || ''),
                        quantity: Number(row['quantity']) || 0,
                        price: Number(row['price']) || 0,
                        marketPrice: row['marketPrice'] ? Number(row['marketPrice']) : undefined,
                        model: row['model'] ? String(row['model']) : undefined,
                        description: row['description'] ? String(row['description']) : undefined,
                        branchId: fromBranchId,
                        categoryId: categoryId,
                        status: (status || 'IN_STORE'),
                        bonusPercentage: row['bonusPercentage'] ? Number(row['bonusPercentage']) : 0,
                        ...(row['sizeType'] ? { sizeType: String(row['sizeType']) } : {}),
                        ...(row['sizeLabel'] ? { sizeLabel: String(row['sizeLabel']) } : {}),
                        ...(row['sizeNumber'] ? { sizeNumber: Number(row['sizeNumber']) } : {}),
                        ...(row['areaSqm'] ? { areaSqm: Number(row['areaSqm']) } : {}),
                    };
                    const existing = await tx.product.findUnique({
                        where: {
                            barcode_branchId: {
                                barcode,
                                branchId: fromBranchId,
                            },
                        },
                    });
                    if (existing) {
                        const newQuantity = existing.quantity + createProductDto.quantity;
                        const updateDto = {
                            ...createProductDto,
                            quantity: newQuantity,
                        };
                        await this.update(existing.id, updateDto, userId, tx);
                    }
                    else {
                        await this.create(createProductDto, userId, tx);
                    }
                }
                return { message: 'Mahsulotlar muvaffaqiyatli yuklandi' };
            });
        }
        catch (error) {
            throw new common_1.BadRequestException('Excel faylini o\'qishda xatolik: ' + error.message);
        }
    }
    async removeMany(ids) {
        const products = await this.prisma.product.findMany({
            where: { id: { in: ids } },
        });
        if (products.length !== ids.length) {
            throw new common_1.NotFoundException("Ba'zi mahsulotlar topilmadi");
        }
        const deleted = await this.prisma.product.deleteMany({
            where: { id: { in: ids } },
        });
        return {
            message: "Mahsulotlar muvaffaqiyatli o'chirildi",
            count: deleted.count,
        };
    }
    async getPriceInSom(productId, branchId) {
        const product = branchId
            ? await this.findOneByBranch(productId, branchId)
            : await this.findOne(productId);
        if (!product)
            return null;
        return {
            priceInDollar: product.price,
            priceInSom: product.priceInSom,
        };
    }
    async getPriceInDollar(productId, branchId) {
        const product = branchId
            ? await this.findOneByBranch(productId, branchId)
            : await this.findOne(productId);
        if (!product)
            return null;
        return {
            priceInDollar: product.price,
            priceInSom: product.priceInSom,
        };
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        currency_exchange_rate_service_1.CurrencyExchangeRateService])
], ProductService);
//# sourceMappingURL=product.service.js.map