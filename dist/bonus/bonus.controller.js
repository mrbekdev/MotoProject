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
exports.BonusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bonus_service_1 = require("./bonus.service");
const create_bonus_dto_1 = require("./dto/create-bonus.dto");
const update_bonus_dto_1 = require("./dto/update-bonus.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BonusController = class BonusController {
    bonusService;
    constructor(bonusService) {
        this.bonusService = bonusService;
    }
    async create(createBonusDto, req) {
        try {
            const createdById = req.user.userId;
            return await this.bonusService.create(createBonusDto, createdById);
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async findAll(skip = '0', take = '100') {
        return this.bonusService.findAll(+skip, +take);
    }
    async findByUserId(userId, skip = '0', take = '100') {
        return this.bonusService.findByUserId(+userId, +skip, +take);
    }
    async getTotalBonusByUserId(userId) {
        return this.bonusService.getTotalBonusByUserId(+userId);
    }
    async findByTransactionId(transactionId) {
        try {
            return await this.bonusService.findByTransactionId(+transactionId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async findOne(id) {
        try {
            return await this.bonusService.findOne(+id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
        }
    }
    async update(id, updateBonusDto) {
        try {
            return await this.bonusService.update(+id, updateBonusDto);
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async remove(id) {
        try {
            return await this.bonusService.remove(+id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.BonusController = BonusController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new bonus' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bonus created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bonus_dto_1.CreateBonusDto, Object]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bonuses' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, description: 'Number of records to skip' }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, description: 'Number of records to take' }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bonuses by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, description: 'Number of records to skip' }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, description: 'Number of records to take' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "findByUserId", null);
__decorate([
    (0, common_1.Get)('user/:userId/total'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total bonus amount and count by user ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "getTotalBonusByUserId", null);
__decorate([
    (0, common_1.Get)('transaction/:transactionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bonus details by transaction ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus details found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No bonus found for this transaction' }),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "findByTransactionId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bonus by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bonus not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bonus' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bonus not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bonus_dto_1.UpdateBonusDto]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete bonus' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Bonus not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BonusController.prototype, "remove", null);
exports.BonusController = BonusController = __decorate([
    (0, swagger_1.ApiTags)('Bonuses'),
    (0, common_1.Controller)('bonuses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [bonus_service_1.BonusService])
], BonusController);
//# sourceMappingURL=bonus.controller.js.map