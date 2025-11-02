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
exports.CashierReportController = void 0;
const common_1 = require("@nestjs/common");
const cashier_report_service_1 = require("./cashier-report.service");
const create_cashier_report_dto_1 = require("./dto/create-cashier-report.dto");
const update_cashier_report_dto_1 = require("./dto/update-cashier-report.dto");
let CashierReportController = class CashierReportController {
    cashierReportService;
    constructor(cashierReportService) {
        this.cashierReportService = cashierReportService;
    }
    create(createCashierReportDto) {
        return this.cashierReportService.create(createCashierReportDto);
    }
    findAll(query) {
        return this.cashierReportService.findAll(query);
    }
    findOne(id) {
        return this.cashierReportService.findOne(+id);
    }
    update(id, updateCashierReportDto) {
        return this.cashierReportService.update(+id, updateCashierReportDto);
    }
    remove(id) {
        return this.cashierReportService.remove(+id);
    }
    getCashierReport(cashierId, branchId, startDate, endDate) {
        return this.cashierReportService.getCashierReport(+cashierId, +branchId, new Date(startDate), new Date(endDate));
    }
};
exports.CashierReportController = CashierReportController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cashier_report_dto_1.CreateCashierReportDto]),
    __metadata("design:returntype", void 0)
], CashierReportController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashierReportController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashierReportController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_cashier_report_dto_1.UpdateCashierReportDto]),
    __metadata("design:returntype", void 0)
], CashierReportController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashierReportController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('cashier/:cashierId'),
    __param(0, (0, common_1.Param)('cashierId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], CashierReportController.prototype, "getCashierReport", null);
exports.CashierReportController = CashierReportController = __decorate([
    (0, common_1.Controller)('cashier-reports'),
    __metadata("design:paramtypes", [cashier_report_service_1.CashierReportService])
], CashierReportController);
//# sourceMappingURL=cashier-report.controller.js.map