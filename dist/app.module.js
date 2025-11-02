"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const branch_module_1 = require("./branch/branch.module");
const user_module_1 = require("./user/user.module");
const category_module_1 = require("./category/category.module");
const product_module_1 = require("./product/product.module");
const transaction_module_1 = require("./transaction/transaction.module");
const auth_module_1 = require("./auth/auth.module");
const customer_module_1 = require("./customer/customer.module");
const payment_schedule_module_1 = require("./payment-schedule/payment-schedule.module");
const defective_log_module_1 = require("./defective-log/defective-log.module");
const currency_exchange_rate_module_1 = require("./currency-exchange-rate/currency-exchange-rate.module");
const daily_repayment_module_1 = require("./daily-repayment/daily-repayment.module");
const credit_repayment_module_1 = require("./credit-repayment/credit-repayment.module");
const cashier_report_module_1 = require("./cashier-report/cashier-report.module");
const bonus_module_1 = require("./bonus/bonus.module");
const transaction_bonus_product_module_1 = require("./transaction-bonus-product/transaction-bonus-product.module");
const work_schedule_module_1 = require("./work-schedule/work-schedule.module");
const attendance_module_1 = require("./attendance/attendance.module");
const user_branch_access_module_1 = require("./user-branch-access/user-branch-access.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            branch_module_1.BranchModule,
            user_module_1.UserModule,
            category_module_1.CategoryModule,
            product_module_1.ProductModule,
            transaction_module_1.TransactionModule,
            auth_module_1.AuthModule,
            customer_module_1.CustomerModule,
            payment_schedule_module_1.PaymentScheduleModule,
            defective_log_module_1.DefectiveLogModule,
            currency_exchange_rate_module_1.CurrencyExchangeRateModule,
            daily_repayment_module_1.DailyRepaymentModule,
            credit_repayment_module_1.CreditRepaymentModule,
            cashier_report_module_1.CashierReportModule,
            bonus_module_1.BonusModule,
            transaction_bonus_product_module_1.TransactionBonusProductModule,
            work_schedule_module_1.WorkScheduleModule,
            attendance_module_1.AttendanceModule,
            user_branch_access_module_1.UserBranchAccessModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map