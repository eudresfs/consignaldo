"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrazoInvalidoException = void 0;
const common_1 = require("@nestjs/common");
class PrazoInvalidoException extends common_1.HttpException {
    constructor(data) {
        super({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: 'Prazo ou valor inválido para o produto',
            error: 'PrazoInvalido',
            data,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.PrazoInvalidoException = PrazoInvalidoException;
