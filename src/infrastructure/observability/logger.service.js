"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLogger = void 0;
const common_1 = require("@nestjs/common");
const winston = __importStar(require("winston"));
const winston_elasticsearch_1 = require("winston-elasticsearch");
let CustomLogger = class CustomLogger {
    constructor() {
        const esTransport = new winston_elasticsearch_1.ElasticsearchTransport({
            level: 'info',
            clientOpts: {
                node: process.env.ELASTICSEARCH_URL,
                auth: {
                    username: process.env.ELASTICSEARCH_USER,
                    password: process.env.ELASTICSEARCH_PASS,
                },
            },
            indexPrefix: 'consignaldo-logs',
        });
        this.logger = winston.createLogger({
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            defaultMeta: { service: 'consignaldo' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple(),
                }),
                esTransport,
            ],
        });
    }
    maskSensitiveData(message) {
        if (typeof message === 'string') {
            // Mascara CPF
            message = message.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}/g, '***.***.***-**');
            // Mascara cartão de crédito
            message = message.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '****-****-****-****');
        }
        else if (typeof message === 'object') {
            Object.keys(message).forEach(key => {
                if (key.toLowerCase().includes('cpf') ||
                    key.toLowerCase().includes('cartao') ||
                    key.toLowerCase().includes('senha')) {
                    message[key] = '********';
                }
                else {
                    message[key] = this.maskSensitiveData(message[key]);
                }
            });
        }
        return message;
    }
    log(message, context) {
        this.logger.info(this.maskSensitiveData(message), { context });
    }
    error(message, trace, context) {
        this.logger.error(this.maskSensitiveData(message), { trace, context });
    }
    warn(message, context) {
        this.logger.warn(this.maskSensitiveData(message), { context });
    }
    debug(message, context) {
        this.logger.debug(this.maskSensitiveData(message), { context });
    }
    verbose(message, context) {
        this.logger.verbose(this.maskSensitiveData(message), { context });
    }
};
exports.CustomLogger = CustomLogger;
exports.CustomLogger = CustomLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CustomLogger);
