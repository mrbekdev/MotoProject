"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBonusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_bonus_dto_1 = require("./create-bonus.dto");
class UpdateBonusDto extends (0, swagger_1.PartialType)(create_bonus_dto_1.CreateBonusDto) {
}
exports.UpdateBonusDto = UpdateBonusDto;
//# sourceMappingURL=update-bonus.dto.js.map