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
exports.TransactionBonusProductController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const transaction_bonus_product_service_1 = require("./transaction-bonus-product.service");
const create_transaction_bonus_product_dto_1 = require("./dto/create-transaction-bonus-product.dto");
const update_transaction_bonus_product_dto_1 = require("./dto/update-transaction-bonus-product.dto");
let TransactionBonusProductController = class TransactionBonusProductController {
    transactionBonusProductService;
    constructor(transactionBonusProductService) {
        this.transactionBonusProductService = transactionBonusProductService;
    }
    create(createTransactionBonusProductDto) {
        return this.transactionBonusProductService.create(createTransactionBonusProductDto);
    }
    async createMultiple(transactionId, bonusProducts) {
        console.log(`🎁 Controller: Creating ${bonusProducts.length} bonus products for transaction ${transactionId}`);
        console.log('Bonus products data:', JSON.stringify(bonusProducts, null, 2));
        try {
            const result = await this.transactionBonusProductService.createMultiple(transactionId, bonusProducts);
            console.log(`✅ Controller: Successfully created ${result.length} bonus products`);
            return result;
        }
        catch (error) {
            console.error(`❌ Controller: Error creating bonus products:`, error);
            throw error;
        }
    }
    findAll() {
        return this.transactionBonusProductService.findAll();
    }
    async findByTransactionId(transactionId) {
        console.log(`🔍 Controller: Searching for bonus products for transaction ID: ${transactionId}`);
        try {
            const transaction = await this.transactionBonusProductService.checkTransactionExists(transactionId);
            if (!transaction) {
                console.log(`❌ Transaction ${transactionId} does not exist`);
                return [];
            }
            const result = await this.transactionBonusProductService.findByTransactionId(transactionId);
            console.log(`✅ Controller: Found ${result.length} bonus products for transaction ${transactionId}`);
            if (result.length === 0) {
                console.log(`⚠️ Controller: No bonus products found for transaction ${transactionId}, but transaction exists`);
                console.log('💡 This means bonus products were not created during the sale process');
                console.log('💡 Check if SalesManagement component is calling the bonus products API after creating transaction');
            }
            return result;
        }
        catch (error) {
            console.error(`❌ Controller: Error fetching bonus products for transaction ${transactionId}:`, error);
            throw error;
        }
    }
    findOne(id) {
        return this.transactionBonusProductService.findOne(id);
    }
    update(id, updateTransactionBonusProductDto) {
        return this.transactionBonusProductService.update(id, updateTransactionBonusProductDto);
    }
    remove(id) {
        return this.transactionBonusProductService.remove(id);
    }
    async createFromDescription(transactionId, data) {
        console.log(`🔄 Controller: Creating bonus products from description for transaction ${transactionId}`);
        console.log('Bonus description:', data.bonusDescription);
        try {
            const result = await this.transactionBonusProductService.createFromDescription(transactionId, data.bonusDescription);
            console.log(`✅ Controller: Successfully created ${result.length} bonus products from description`);
            return result;
        }
        catch (error) {
            console.error(`❌ Controller: Error creating bonus products from description:`, error);
            throw error;
        }
    }
    async getTotalBonusProductsValueByUserId(userId, startDate, endDate) {
        console.log(`🔍 Controller: Getting total bonus products value for user ${userId}`);
        if (startDate)
            console.log(`📅 Start date: ${startDate}`);
        if (endDate)
            console.log(`📅 End date: ${endDate}`);
        try {
            const result = await this.transactionBonusProductService.getTotalBonusProductsValueByUserId(userId, startDate, endDate);
            console.log(`✅ Controller: Total bonus products value (UZS) for user ${userId}: ${result.totalValueUZS}`);
            return result;
        }
        catch (error) {
            console.error(`❌ Controller: Error getting bonus products value for user ${userId}:`, error);
            throw error;
        }
    }
};
exports.TransactionBonusProductController = TransactionBonusProductController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_bonus_product_dto_1.CreateTransactionBonusProductDto]),
    __metadata("design:returntype", void 0)
], TransactionBonusProductController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('multiple/:transactionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create multiple bonus products for a transaction' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bonus products created successfully' }),
    __param(0, (0, common_1.Param)('transactionId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", Promise)
], TransactionBonusProductController.prototype, "createMultiple", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TransactionBonusProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('transaction/:transactionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bonus products by transaction ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus products found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No bonus products found for this transaction' }),
    __param(0, (0, common_1.Param)('transactionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TransactionBonusProductController.prototype, "findByTransactionId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TransactionBonusProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_transaction_bonus_product_dto_1.UpdateTransactionBonusProductDto]),
    __metadata("design:returntype", void 0)
], TransactionBonusProductController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TransactionBonusProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('create-from-description/:transactionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create bonus products from bonus description retroactively' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bonus products created from description successfully' }),
    __param(0, (0, common_1.Param)('transactionId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TransactionBonusProductController.prototype, "createFromDescription", null);
__decorate([
    (0, common_1.Get)('user/:userId/total-value'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total value of bonus products given to a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Total bonus products value calculated successfully' }),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], TransactionBonusProductController.prototype, "getTotalBonusProductsValueByUserId", null);
exports.TransactionBonusProductController = TransactionBonusProductController = __decorate([
    (0, swagger_1.ApiTags)('Transaction Bonus Products'),
    (0, common_1.Controller)('transaction-bonus-products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [transaction_bonus_product_service_1.TransactionBonusProductService])
], TransactionBonusProductController);
//# sourceMappingURL=transaction-bonus-product.controller.js.map