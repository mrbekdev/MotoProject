"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDailyRepaymentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_daily_repayment_dto_1 = require("./create-daily-repayment.dto");
class UpdateDailyRepaymentDto extends (0, mapped_types_1.PartialType)(create_daily_repayment_dto_1.CreateDailyRepaymentDto) {
}
exports.UpdateDailyRepaymentDto = UpdateDailyRepaymentDto;
//# sourceMappingURL=update-daily-repayment.dto.js.map