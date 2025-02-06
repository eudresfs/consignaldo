"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = void 0;
const morgan_1 = __importDefault(require("morgan"));
/**
 * Middleware de logging utilizando Morgan.
 * O modo 'combined' gera logs completos no formato Apache.
 */
exports.loggerMiddleware = (0, morgan_1.default)('combined');
