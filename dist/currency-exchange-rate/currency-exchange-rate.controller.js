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
exports.CurrencyExchangeRateController = void 0;
const common_1 = require("@nestjs/common");
const currency_exchange_rate_service_1 = require("./currency-exchange-rate.service");
const create_currency_exchange_rate_dto_1 = require("./dto/create-currency-exchange-rate.dto");
const update_currency_exchange_rate_dto_1 = require("./dto/update-currency-exchange-rate.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let CurrencyExchangeRateController = class CurrencyExchangeRateController {
    currencyExchangeRateService;
    constructor(currencyExchangeRateService) {
        this.currencyExchangeRateService = currencyExchangeRateService;
    }
    create(createCurrencyExchangeRateDto, req) {
        return this.currencyExchangeRateService.create(createCurrencyExchangeRateDto, req.user.id);
    }
    findAll(branchId) {
        const branchIdNum = branchId ? parseInt(branchId) : undefined;
        return this.currencyExchangeRateService.findAll(branchIdNum);
    }
    getCurrentRate(fromCurrency, toCurrency, branchId) {
        const branchIdNum = branchId ? parseInt(branchId) : undefined;
        return this.currencyExchangeRateService.getCurrentRate(fromCurrency, toCurrency, branchIdNum);
    }
    convertCurrency(amount, fromCurrency, toCurrency, branchId) {
        const amountNum = parseFloat(amount);
        const branchIdNum = branchId ? parseInt(branchId) : undefined;
        return this.currencyExchangeRateService.convertCurrency(amountNum, fromCurrency, toCurrency, branchIdNum);
    }
    findOne(id) {
        return this.currencyExchangeRateService.findOne(+id);
    }
    update(id, updateCurrencyExchangeRateDto) {
        return this.currencyExchangeRateService.update(+id, updateCurrencyExchangeRateDto);
    }
    remove(id) {
        return this.currencyExchangeRateService.remove(+id);
    }
};
exports.CurrencyExchangeRateController = CurrencyExchangeRateController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_currency_exchange_rate_dto_1.CreateCurrencyExchangeRateDto, Object]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('current-rate'),
    __param(0, (0, common_1.Query)('fromCurrency')),
    __param(1, (0, common_1.Query)('toCurrency')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "getCurrentRate", null);
__decorate([
    (0, common_1.Get)('convert'),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('fromCurrency')),
    __param(2, (0, common_1.Query)('toCurrency')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "convertCurrency", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_currency_exchange_rate_dto_1.UpdateCurrencyExchangeRateDto]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CurrencyExchangeRateController.prototype, "remove", null);
exports.CurrencyExchangeRateController = CurrencyExchangeRateController = __decorate([
    (0, common_1.Controller)('currency-exchange-rates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [currency_exchange_rate_service_1.CurrencyExchangeRateService])
], CurrencyExchangeRateController);
//# sourceMappingURL=currency-exchange-rate.controller.js.map