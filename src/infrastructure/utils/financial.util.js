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
exports.FinancialUtil = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const moment = __importStar(require("moment-business-days"));
let FinancialUtil = class FinancialUtil {
    constructor(config) {
        this.config = config;
        // Carrega feriados do banco de dados ou arquivo de configuração
        const holidays = this.config.get('holidays') || [];
        moment.updateLocale('pt-br', {
            holidays,
            holidayFormat: 'YYYY-MM-DD',
        });
    }
    roundCurrency(value) {
        return Math.round(value * 100) / 100;
    }
    roundPercentage(value) {
        return Math.round(value * 10000) / 10000;
    }
    calculateDueDate(baseDate, installmentNumber) {
        const date = moment(baseDate).businessAdd(installmentNumber * 30);
        return date.toDate();
    }
    calculateWorkingDays(startDate, endDate) {
        return moment(startDate).businessDiff(moment(endDate));
    }
    isWorkingDay(date) {
        return moment(date).isBusinessDay();
    }
    nextWorkingDay(date) {
        return moment(date).nextBusinessDay().toDate();
    }
    previousWorkingDay(date) {
        return moment(date).prevBusinessDay().toDate();
    }
    calculateIOF(valor, prazo, taxa, isRefinancing = false) {
        // IOF para operações de crédito
        const iofDiario = this.roundCurrency(valor * 0.0082 * Math.min(prazo, 365));
        const iofAdicional = this.roundCurrency(valor * 0.0038);
        // IOF reduzido para refinanciamento
        if (isRefinancing) {
            return this.roundCurrency((iofDiario + iofAdicional) * 0.5);
        }
        return this.roundCurrency(iofDiario + iofAdicional);
    }
    calculatePMT(valor, prazo, taxaAnual, tipo = 'PRICE') {
        const taxaMensal = this.annualToMonthlyRate(taxaAnual);
        if (tipo === 'SAC') {
            const amortizacao = valor / prazo;
            const juros = valor * taxaMensal;
            return this.roundCurrency(amortizacao + juros);
        }
        const taxa = taxaMensal;
        const pmt = (valor * taxa * Math.pow(1 + taxa, prazo)) /
            (Math.pow(1 + taxa, prazo) - 1);
        return this.roundCurrency(pmt);
    }
    annualToMonthlyRate(annualRate) {
        return this.roundPercentage(Math.pow(1 + annualRate, 1 / 12) - 1);
    }
    monthlyToAnnualRate(monthlyRate) {
        return this.roundPercentage(Math.pow(1 + monthlyRate, 12) - 1);
    }
    calculateCET(valor, parcela, prazo, tarifas, iof) {
        let taxa = 0.01; // Taxa inicial
        const tolerance = 0.0000001;
        let iteration = 0;
        const maxIterations = 100;
        while (iteration < maxIterations) {
            const npv = this.calculateNPV(valor, parcela, prazo, taxa);
            const derivative = this.calculateNPVDerivative(valor, parcela, prazo, taxa);
            const delta = npv / derivative;
            taxa -= delta;
            if (Math.abs(delta) < tolerance) {
                break;
            }
            iteration++;
        }
        // Converte para taxa anual
        const taxaAnual = this.monthlyToAnnualRate(taxa);
        return this.roundPercentage(taxaAnual * 100);
    }
    calculateNPV(valor, parcela, prazo, taxa) {
        let npv = -valor;
        for (let i = 1; i <= prazo; i++) {
            npv += parcela / Math.pow(1 + taxa, i);
        }
        return npv;
    }
    calculateNPVDerivative(valor, parcela, prazo, taxa) {
        let derivative = 0;
        for (let i = 1; i <= prazo; i++) {
            derivative -= (i * parcela) / Math.pow(1 + taxa, i + 1);
        }
        return derivative;
    }
};
exports.FinancialUtil = FinancialUtil;
exports.FinancialUtil = FinancialUtil = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FinancialUtil);
