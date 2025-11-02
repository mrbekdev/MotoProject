"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashierReportModule = void 0;
const common_1 = require("@nestjs/common");
const cashier_report_service_1 = require("./cashier-report.service");
const cashier_report_controller_1 = require("./cashier-report.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let CashierReportModule = class CashierReportModule {
};
exports.CashierReportModule = CashierReportModule;
exports.CashierReportModule = CashierReportModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [cashier_report_controller_1.CashierReportController],
        providers: [cashier_report_service_1.CashierReportService],
        exports: [cashier_report_service_1.CashierReportService],
    })
], CashierReportModule);
//# sourceMappingURL=cashier-report.module.js.map