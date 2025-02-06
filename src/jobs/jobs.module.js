"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const queue_module_1 = require("../infrastructure/queue/queue.module");
const integration_module_1 = require("../infrastructure/integration/integration.module");
const prisma_module_1 = require("../infrastructure/prisma/prisma.module");
const logger_module_1 = require("../infrastructure/logger/logger.module");
const folha_pagamento_processor_1 = require("./folha-pagamento.processor");
const averbacao_processor_1 = require("./averbacao.processor");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            queue_module_1.QueueModule,
            integration_module_1.IntegrationModule,
            prisma_module_1.PrismaModule,
            logger_module_1.LoggerModule,
        ],
        providers: [
            folha_pagamento_processor_1.FolhaPagamentoProcessor,
            averbacao_processor_1.AverbacaoProcessor,
        ],
    })
], JobsModule);
