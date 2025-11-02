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
exports.TransactionController = void 0;
const common_1 = require("@nestjs/common");
const transaction_service_1 = require("./transaction.service");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const update_transaction_dto_1 = require("./dto/update-transaction.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let TransactionController = class TransactionController {
    transactionService;
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    create(createTransactionDto, user) {
        const dtoWithSoldBy = {
            ...createTransactionDto,
            soldByUserId: createTransactionDto.soldByUserId || user.id,
            userId: createTransactionDto.userId || user.id
        };
        return this.transactionService.create(dtoWithSoldBy, user.id);
    }
    findAll(query) {
        return this.transactionService.findAll(query);
    }
    async findDeliveryOrders() {
        return this.transactionService.findByType('DELIVERY');
    }
    async updateStatus(id, body, user) {
        return this.transactionService.updateStatus(parseInt(id), body.status, user.id);
    }
    async findByProductId(productId, month) {
        console.log(`Controller: Finding transactions for productId: ${productId}, month: ${month}`);
        const parsedProductId = parseInt(productId);
        if (isNaN(parsedProductId) || parsedProductId <= 0) {
            console.log(`Invalid productId: ${productId}`);
            return {
                transactions: [],
                statusCounts: { PENDING: 0, COMPLETED: 0, CANCELLED: 0, total: 0 },
                typeCounts: { SALE: 0, PURCHASE: 0, TRANSFER: 0, RETURN: 0, WRITE_OFF: 0, STOCK_ADJUSTMENT: 0 }
            };
        }
        const result = await this.transactionService.findByProductId(parsedProductId, month);
        console.log(`Controller: Returning ${result.transactions.length} transactions`);
        return result;
    }
    getStatistics(branchId, startDate, endDate) {
        return this.transactionService.getStatistics(branchId ? parseInt(branchId) : undefined, startDate, endDate);
    }
    getDebts(branchId, customerId) {
        return this.transactionService.getDebts({
            branchId: branchId ? parseInt(branchId) : undefined,
            customerId: customerId ? parseInt(customerId) : undefined,
        });
    }
    getPendingTransfers(branchId) {
        return this.transactionService.getPendingTransfers(branchId ? parseInt(branchId) : undefined);
    }
    getTransfersByBranch(branchId) {
        return this.transactionService.getTransfersByBranch(parseInt(branchId));
    }
    findOne(id) {
        return this.transactionService.findOne(+id);
    }
    getPaymentSchedules(id) {
        return this.transactionService.getPaymentSchedules(+id);
    }
    update(id, updateTransactionDto) {
        return this.transactionService.update(+id, updateTransactionDto);
    }
    updatePaymentStatus(id, body) {
        return this.transactionService.updatePaymentStatus(+id, body.month, body.paid);
    }
    remove(id, user) {
        return this.transactionService.remove(+id, user);
    }
    createTransfer(transferData, user) {
        return this.transactionService.createTransfer({
            ...transferData,
            userId: user.id,
            soldByUserId: user.id
        });
    }
    approveTransfer(id, user) {
        return this.transactionService.approveTransfer(+id, user.id);
    }
    rejectTransfer(id) {
        return this.transactionService.rejectTransfer(+id);
    }
};
exports.TransactionController = TransactionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_dto_1.CreateTransactionDto, Object]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('delivery'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "findDeliveryOrders", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "findByProductId", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('debts'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "getDebts", null);
__decorate([
    (0, common_1.Get)('pending-transfers'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "getPendingTransfers", null);
__decorate([
    (0, common_1.Get)('transfers/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "getTransfersByBranch", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/payment-schedules'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "getPaymentSchedules", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transaction_dto_1.UpdateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/payment-status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "updatePaymentStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "createTransfer", null);
__decorate([
    (0, common_1.Post)(':id/approve-transfer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "approveTransfer", null);
__decorate([
    (0, common_1.Post)(':id/reject-transfer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TransactionController.prototype, "rejectTransfer", null);
exports.TransactionController = TransactionController = __decorate([
    (0, common_1.Controller)('transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [transaction_service_1.TransactionService])
], TransactionController);
//# sourceMappingURL=transaction.controller.js.map