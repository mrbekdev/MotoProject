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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const product_service_1 = require("./product.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ProductController = class ProductController {
    productService;
    constructor(productService) {
        this.productService = productService;
    }
    create(req, createProductDto) {
        return this.productService.create(createProductDto, req.user.id);
    }
    findAll(branchId, search, includeZeroQuantity = 'false') {
        const parsedBranchId = branchId ? parseInt(branchId) : undefined;
        return this.productService.findAll(parsedBranchId, search, includeZeroQuantity === 'true');
    }
    getDefectiveProducts(branchId) {
        const parsedBranchId = branchId ? parseInt(branchId) : undefined;
        return this.productService.getDefectiveProducts(parsedBranchId);
    }
    getFixedProducts(branchId) {
        const parsedBranchId = branchId ? parseInt(branchId) : undefined;
        return this.productService.getFixedProducts(parsedBranchId);
    }
    findOne(id) {
        return this.productService.findOne(id);
    }
    update(req, id, updateProductDto) {
        return this.productService.update(id, updateProductDto, req.user.id);
    }
    markAsDefective(req, id, body) {
        if (!body.description) {
            throw new common_1.BadRequestException('Description is required');
        }
        return this.productService.markAsDefective(id, body.description, req.user.id);
    }
    markPartialDefective(req, id, body) {
        if (!body.description) {
            throw new common_1.BadRequestException('Description is required');
        }
        if (!body.defectiveCount || body.defectiveCount <= 0) {
            throw new common_1.BadRequestException('Valid defectiveCount is required');
        }
        return this.productService.markPartialDefective(id, body.defectiveCount, body.description, req.user.id);
    }
    restoreDefectiveProduct(req, id, body) {
        if (!body.restoreCount || body.restoreCount <= 0) {
            throw new common_1.BadRequestException('Valid restoreCount is required');
        }
        return this.productService.restoreDefectiveProduct(id, body.restoreCount, req.user.id);
    }
    bulkMarkDefective(req, body) {
        return this.productService.bulkMarkDefective(body.ids, body.description, req.user.id);
    }
    bulkRestoreDefective(req, body) {
        return this.productService.bulkRestoreDefective(body.ids, req.user.id);
    }
    remove(req, id) {
        return this.productService.remove(id, req.user.id);
    }
    uploadExcel(req, file, branchId, categoryId, status) {
        return this.productService.uploadExcel(file, branchId, categoryId, status, req.user.id);
    }
    bulkRemove(req, body) {
        return this.productService.removeMany(body.ids);
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('includeZeroQuantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('defective'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getDefectiveProducts", null);
__decorate([
    (0, common_1.Get)('fixed'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getFixedProducts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/mark-defective'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "markAsDefective", null);
__decorate([
    (0, common_1.Put)(':id/partial-defective'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "markPartialDefective", null);
__decorate([
    (0, common_1.Put)(':id/restore-defective'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "restoreDefectiveProduct", null);
__decorate([
    (0, common_1.Post)('bulk-defective'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "bulkMarkDefective", null);
__decorate([
    (0, common_1.Post)('bulk-restore-defective'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "bulkRestoreDefective", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('branchId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)('categoryId', common_1.ParseIntPipe)),
    __param(4, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Number, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "uploadExcel", null);
__decorate([
    (0, common_1.Delete)('bulk'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "bulkRemove", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [product_service_1.ProductService])
], ProductController);
//# sourceMappingURL=product.controller.js.map