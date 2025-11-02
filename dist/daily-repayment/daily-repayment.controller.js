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
exports.DailyRepaymentController = void 0;
const common_1 = require("@nestjs/common");
const daily_repayment_service_1 = require("./daily-repayment.service");
const create_daily_repayment_dto_1 = require("./dto/create-daily-repayment.dto");
const update_daily_repayment_dto_1 = require("./dto/update-daily-repayment.dto");
let DailyRepaymentController = class DailyRepaymentController {
    dailyRepaymentService;
    constructor(dailyRepaymentService) {
        this.dailyRepaymentService = dailyRepaymentService;
    }
    create(createDailyRepaymentDto) {
        return this.dailyRepaymentService.create(createDailyRepaymentDto);
    }
    findAll(query) {
        return this.dailyRepaymentService.findAll(query);
    }
    findByUser(userId, branchId, startDate, endDate) {
        return this.dailyRepaymentService.findByUser(parseInt(userId), +branchId, startDate, endDate);
    }
    findByCashier(cashierId, branchId, startDate, endDate) {
        return this.dailyRepaymentService.findByCashier(parseInt(cashierId), branchId, startDate, endDate);
    }
    findOne(id) {
        return this.dailyRepaymentService.findOne(+id);
    }
    update(id, updateDailyRepaymentDto) {
        return this.dailyRepaymentService.update(+id, updateDailyRepaymentDto);
    }
    remove(id) {
        return this.dailyRepaymentService.remove(+id);
    }
};
exports.DailyRepaymentController = DailyRepaymentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_daily_repayment_dto_1.CreateDailyRepaymentDto]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('cashier/:cashierId'),
    __param(0, (0, common_1.Param)('cashierId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "findByCashier", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_daily_repayment_dto_1.UpdateDailyRepaymentDto]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DailyRepaymentController.prototype, "remove", null);
exports.DailyRepaymentController = DailyRepaymentController = __decorate([
    (0, common_1.Controller)('daily-repayments'),
    __metadata("design:paramtypes", [daily_repayment_service_1.DailyRepaymentService])
], DailyRepaymentController);
//# sourceMappingURL=daily-repayment.controller.js.map