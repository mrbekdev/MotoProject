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
exports.DefectiveLogController = void 0;
const common_1 = require("@nestjs/common");
const defective_log_service_1 = require("./defective-log.service");
const create_defective_log_dto_1 = require("./dto/create-defective-log.dto");
const update_defective_log_dto_1 = require("./dto/update-defective-log.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let DefectiveLogController = class DefectiveLogController {
    defectiveLogService;
    constructor(defectiveLogService) {
        this.defectiveLogService = defectiveLogService;
    }
    create(createDefectiveLogDto, req) {
        return this.defectiveLogService.create({
            ...createDefectiveLogDto,
            userId: req.user?.userId
        });
    }
    findAll(query) {
        return this.defectiveLogService.findAll(query);
    }
    getDefectiveProducts(branchId) {
        return this.defectiveLogService.getDefectiveProducts(branchId ? +branchId : undefined);
    }
    getFixedProducts(branchId) {
        return this.defectiveLogService.getFixedProducts(branchId ? +branchId : undefined);
    }
    getReturnedProducts(branchId) {
        return this.defectiveLogService.getReturnedProducts(branchId ? +branchId : undefined);
    }
    getExchangedProducts(branchId) {
        return this.defectiveLogService.getExchangedProducts(branchId ? +branchId : undefined);
    }
    getStatistics(branchId, startDate, endDate) {
        return this.defectiveLogService.getStatistics(branchId ? +branchId : undefined, startDate, endDate);
    }
    findByProduct(productId) {
        return this.defectiveLogService.findByProduct(+productId);
    }
    findOne(id) {
        return this.defectiveLogService.findOne(+id);
    }
    update(id, updateDefectiveLogDto) {
        return this.defectiveLogService.update(+id, updateDefectiveLogDto);
    }
    markAsFixed(productId, body, req) {
        return this.defectiveLogService.markAsFixed(+productId, body.quantity, req.user?.userId, body.branchId);
    }
    returnProduct(productId, body, req) {
        return this.defectiveLogService.returnProduct(+productId, body.quantity, body.description, req.user?.userId, body.branchId);
    }
    exchangeProduct(productId, body, req) {
        return this.defectiveLogService.exchangeProduct(+productId, body.quantity, body.description, req.user?.userId, body.branchId);
    }
    remove(id) {
        return this.defectiveLogService.remove(+id);
    }
};
exports.DefectiveLogController = DefectiveLogController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_defective_log_dto_1.CreateDefectiveLogDto, Object]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('defective-products'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "getDefectiveProducts", null);
__decorate([
    (0, common_1.Get)('fixed-products'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "getFixedProducts", null);
__decorate([
    (0, common_1.Get)('returned-products'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "getReturnedProducts", null);
__decorate([
    (0, common_1.Get)('exchanged-products'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "getExchangedProducts", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "findByProduct", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_defective_log_dto_1.UpdateDefectiveLogDto]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('mark-as-fixed/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "markAsFixed", null);
__decorate([
    (0, common_1.Post)('return/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "returnProduct", null);
__decorate([
    (0, common_1.Post)('exchange/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "exchangeProduct", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DefectiveLogController.prototype, "remove", null);
exports.DefectiveLogController = DefectiveLogController = __decorate([
    (0, common_1.Controller)('defective-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [defective_log_service_1.DefectiveLogService])
], DefectiveLogController);
//# sourceMappingURL=defective-log.controller.js.map