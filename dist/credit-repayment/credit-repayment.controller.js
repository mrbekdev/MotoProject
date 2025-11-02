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
exports.CreditRepaymentController = void 0;
const common_1 = require("@nestjs/common");
const credit_repayment_service_1 = require("./credit-repayment.service");
const create_credit_repayment_dto_1 = require("./dto/create-credit-repayment.dto");
const update_credit_repayment_dto_1 = require("./dto/update-credit-repayment.dto");
let CreditRepaymentController = class CreditRepaymentController {
    creditRepaymentService;
    constructor(creditRepaymentService) {
        this.creditRepaymentService = creditRepaymentService;
    }
    create(createCreditRepaymentDto) {
        return this.creditRepaymentService.create(createCreditRepaymentDto);
    }
    findAll(query) {
        return this.creditRepaymentService.findAll(query);
    }
    findByUser(userId, branchId, startDate, endDate) {
        return this.creditRepaymentService.findByUser(parseInt(userId), +branchId, startDate, endDate);
    }
    findByCashier(cashierId, branchId, startDate, endDate) {
        return this.creditRepaymentService.findByCashier(parseInt(cashierId), branchId, startDate, endDate);
    }
    findOne(id) {
        return this.creditRepaymentService.findOne(+id);
    }
    update(id, updateCreditRepaymentDto) {
        return this.creditRepaymentService.update(+id, updateCreditRepaymentDto);
    }
    remove(id) {
        return this.creditRepaymentService.remove(+id);
    }
};
exports.CreditRepaymentController = CreditRepaymentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_credit_repayment_dto_1.CreateCreditRepaymentDto]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('cashier/:cashierId'),
    __param(0, (0, common_1.Param)('cashierId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "findByCashier", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_credit_repayment_dto_1.UpdateCreditRepaymentDto]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CreditRepaymentController.prototype, "remove", null);
exports.CreditRepaymentController = CreditRepaymentController = __decorate([
    (0, common_1.Controller)('credit-repayments'),
    __metadata("design:paramtypes", [credit_repayment_service_1.CreditRepaymentService])
], CreditRepaymentController);
//# sourceMappingURL=credit-repayment.controller.js.map