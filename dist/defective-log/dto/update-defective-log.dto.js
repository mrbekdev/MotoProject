"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDefectiveLogDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_defective_log_dto_1 = require("./create-defective-log.dto");
class UpdateDefectiveLogDto extends (0, mapped_types_1.PartialType)(create_defective_log_dto_1.CreateDefectiveLogDto) {
}
exports.UpdateDefectiveLogDto = UpdateDefectiveLogDto;
//# sourceMappingURL=update-defective-log.dto.js.map