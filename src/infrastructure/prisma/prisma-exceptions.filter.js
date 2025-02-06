"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
// src/infrastructure/prisma/prisma-exceptions.filter.ts
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaExceptionFilter = class PrismaExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Erro interno do servidor';
        switch (exception.code) {
            case 'P2002': // Unique constraint violation
                status = common_1.HttpStatus.CONFLICT;
                message = 'Registro duplicado';
                break;
            case 'P2025': // Record not found
                status = common_1.HttpStatus.NOT_FOUND;
                message = 'Registro não encontrado';
                break;
            case 'P2003': // Foreign key constraint failed
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Violação de integridade referencial';
                break;
            case 'P2014': // Required relation violation
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Violação de relacionamento entre modelos';
                break;
        }
        response.status(status).json({
            statusCode: status,
            message,
            error: exception.message,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaExceptionFilter);
