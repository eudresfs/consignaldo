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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prometheus = __importStar(require("prom-client"));
let MetricsService = class MetricsService {
    onModuleInit() {
        // Métricas HTTP
        this.httpRequestDuration = new prometheus.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        });
        // Métricas de Negócio
        this.activeLoans = new prometheus.Gauge({
            name: 'active_loans_total',
            help: 'Total number of active loans',
            labelNames: ['consignataria'],
        });
        this.loanAmount = new prometheus.Histogram({
            name: 'loan_amount_reais',
            help: 'Distribution of loan amounts in reais',
            buckets: [5000, 10000, 15000, 20000, 30000, 50000],
        });
        // Métricas de Erro
        this.errorCounter = new prometheus.Counter({
            name: 'application_errors_total',
            help: 'Total number of application errors',
            labelNames: ['type', 'code'],
        });
        // Métricas de Integração
        this.bankIntegrationDuration = new prometheus.Histogram({
            name: 'bank_integration_duration_seconds',
            help: 'Duration of bank integration operations',
            labelNames: ['bank', 'operation'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
        });
        // Registra coletor padrão
        prometheus.collectDefaultMetrics();
    }
    // Métodos para registrar métricas
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestDuration
            .labels(method, route, statusCode.toString())
            .observe(duration);
    }
    recordLoanCreated(consignataria, amount) {
        this.activeLoans.inc({ consignataria });
        this.loanAmount.observe(amount);
    }
    recordLoanFinished(consignataria) {
        this.activeLoans.dec({ consignataria });
    }
    recordError(type, code) {
        this.errorCounter.inc({ type, code });
    }
    recordBankIntegration(bank, operation, duration) {
        this.bankIntegrationDuration
            .labels(bank, operation)
            .observe(duration);
    }
    // Método para expor métricas
    async getMetrics() {
        return prometheus.register.metrics();
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
