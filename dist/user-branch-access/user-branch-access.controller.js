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
exports.UserBranchAccessController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_branch_access_service_1 = require("./user-branch-access.service");
const create_user_branch_access_dto_1 = require("./dto/create-user-branch-access.dto");
const update_user_branch_access_dto_1 = require("./dto/update-user-branch-access.dto");
const user_branch_access_response_dto_1 = require("./dto/user-branch-access-response.dto");
let UserBranchAccessController = class UserBranchAccessController {
    userBranchAccessService;
    constructor(userBranchAccessService) {
        this.userBranchAccessService = userBranchAccessService;
    }
    create(createUserBranchAccessDto) {
        return this.userBranchAccessService.create(createUserBranchAccessDto);
    }
    findAll(userId, branchId) {
        if (userId) {
            return this.userBranchAccessService.findByUserId(parseInt(userId, 10));
        }
        if (branchId) {
            return this.userBranchAccessService.findByBranchId(parseInt(branchId, 10));
        }
        return this.userBranchAccessService.findAll();
    }
    findOne(id) {
        return this.userBranchAccessService.findOne(id);
    }
    update(id, updateUserBranchAccessDto) {
        return this.userBranchAccessService.update(id, updateUserBranchAccessDto);
    }
    remove(id) {
        return this.userBranchAccessService.remove(id);
    }
};
exports.UserBranchAccessController = UserBranchAccessController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user-branch access' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User-branch access created successfully', type: user_branch_access_response_dto_1.UserBranchAccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User or Branch not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already has access to this branch' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_branch_access_dto_1.CreateUserBranchAccessDto]),
    __metadata("design:returntype", void 0)
], UserBranchAccessController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all user-branch accesses' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all user-branch accesses', type: [user_branch_access_response_dto_1.UserBranchAccessResponseDto] }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, type: Number, description: 'Filter by branch ID' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UserBranchAccessController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a user-branch access by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User-branch access ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User-branch access found', type: user_branch_access_response_dto_1.UserBranchAccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User-branch access not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UserBranchAccessController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a user-branch access' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User-branch access ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User-branch access updated', type: user_branch_access_response_dto_1.UserBranchAccessResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User-branch access, User, or Branch not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'This user-branch access already exists' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_branch_access_dto_1.UpdateUserBranchAccessDto]),
    __metadata("design:returntype", void 0)
], UserBranchAccessController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a user-branch access' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User-branch access ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'User-branch access deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User-branch access not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UserBranchAccessController.prototype, "remove", null);
exports.UserBranchAccessController = UserBranchAccessController = __decorate([
    (0, swagger_1.ApiTags)('user-branch-access'),
    (0, common_1.Controller)('user-branch-access'),
    __metadata("design:paramtypes", [user_branch_access_service_1.UserBranchAccessService])
], UserBranchAccessController);
//# sourceMappingURL=user-branch-access.controller.js.map