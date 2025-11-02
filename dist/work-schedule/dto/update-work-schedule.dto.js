"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkScheduleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_work_schedule_dto_1 = require("./create-work-schedule.dto");
class UpdateWorkScheduleDto extends (0, mapped_types_1.PartialType)(create_work_schedule_dto_1.CreateWorkScheduleDto) {
}
exports.UpdateWorkScheduleDto = UpdateWorkScheduleDto;
//# sourceMappingURL=update-work-schedule.dto.js.map