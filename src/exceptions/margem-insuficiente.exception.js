"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MargemInsuficienteException = void 0;
const common_1 = require("@nestjs/common");
class MargemInsuficienteException extends common_1.HttpException {
    constructor(data) {
        super({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            message: 'Margem consignável insuficiente',
            error: 'MargemInsuficiente',
            data,
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.MargemInsuficienteException = MargemInsuficienteException;
