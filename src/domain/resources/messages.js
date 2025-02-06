"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
exports.Messages = {
    // Validações gerais
    VALIDATION: {
        REQUIRED_FIELD: 'Campo obrigatório não preenchido',
        INVALID_FORMAT: 'Formato inválido',
        INVALID_VALUE: 'Valor inválido'
    },
    // Averbação
    AVERBACAO: {
        MARGEM_INSUFICIENTE: 'Margem consignável insuficiente',
        PRAZO_INVALIDO: 'Prazo inválido para o tipo de produto',
        DIA_CORTE_INVALIDO: 'Dia de corte inválido',
        SITUACAO_INVALIDA: 'Situação da averbação inválida para esta operação',
        PARCELA_NAO_ENCONTRADA: 'Parcela não encontrada',
        CONTRATO_NAO_ENCONTRADO: 'Contrato não encontrado'
    },
    // Funcionário
    FUNCIONARIO: {
        NAO_ENCONTRADO: 'Funcionário não encontrado',
        SITUACAO_INVALIDA: 'Situação do funcionário não permite esta operação',
        MARGEM_BLOQUEADA: 'Margem do funcionário está bloqueada'
    },
    // Empresa
    EMPRESA: {
        NAO_ENCONTRADA: 'Empresa não encontrada',
        SITUACAO_INVALIDA: 'Situação da empresa não permite esta operação',
        TIPO_INVALIDO: 'Tipo de empresa inválido para esta operação'
    },
    // Solicitação
    SOLICITACAO: {
        NAO_ENCONTRADA: 'Solicitação não encontrada',
        TIPO_INVALIDO: 'Tipo de solicitação inválido',
        SITUACAO_INVALIDA: 'Situação da solicitação não permite esta operação'
    },
    // Produto
    PRODUTO: {
        NAO_ENCONTRADO: 'Produto não encontrado',
        TIPO_INVALIDO: 'Tipo de produto inválido',
        GRUPO_INVALIDO: 'Grupo de produto inválido'
    }
};
