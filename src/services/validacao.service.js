"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidacaoService = void 0;
/**
 * Serviço para validação das regras de negócio relacionadas à Averbação.
 */
class ValidacaoService {
    /**
     * Valida regras de margem, prazo e dia de corte.
     * Neste exemplo, a implementação é simulada.
     * @param dto Dados de criação da averbação
     */
    async validarMargem(dto) {
        // Implemente aqui as validações específicas (ex.: verificação do salário,
        // prazo mínimo/máximo, dia de corte, etc.).
        // Se houver violação de regra, lance uma exceção apropriada.
        return;
    }
}
exports.ValidacaoService = ValidacaoService;
