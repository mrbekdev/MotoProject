"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateReceiptDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_receipt_dto_1 = require("./create-receipt.dto");
class UpdateReceiptDto extends (0, swagger_1.PartialType)(create_receipt_dto_1.CreateReceiptDto) {
}
exports.UpdateReceiptDto = UpdateReceiptDto;
//# sourceMappingURL=update-receipt.dto.js.map