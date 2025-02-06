import { FormatoRelatorio } from '../../../domain/relatorios/relatorios.types';
import { Template } from '@prisma/client';

export abstract class RelatorioGenerator<T = any> {
  protected readonly template: Template;
  protected readonly formato: FormatoRelatorio;
  protected readonly filtros?: Record<string, any>;

  constructor(template: Template, formato: FormatoRelatorio, filtros?: Record<string, any>) {
    this.template = template;
    this.formato = formato;
    this.filtros = filtros;
  }

  abstract buscarDados(): Promise<T[]>;
  abstract processarDados(dados: T[]): Promise<any>;
  abstract gerarArquivo(dados: any): Promise<string>;

  async gerar(): Promise<string> {
    const dados = await this.buscarDados();
    const dadosProcessados = await this.processarDados(dados);
    return this.gerarArquivo(dadosProcessados);
  }

  protected aplicarTemplate(dados: any): string {
    let conteudo = this.template.layout;

    // Substituir placeholders no template
    Object.entries(dados).forEach(([chave, valor]) => {
      conteudo = conteudo.replace(new RegExp(`{{${chave}}}`, 'g'), String(valor));
    });

    // Adicionar cabeçalho e rodapé se existirem
    if (this.template.cabecalho) {
      conteudo = this.template.cabecalho + '\n' + conteudo;
    }
    if (this.template.rodape) {
      conteudo = conteudo + '\n' + this.template.rodape;
    }

    return conteudo;
  }

  protected formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR');
  }

  protected formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  protected formatarPorcentagem(valor: number): string {
    return (valor * 100).toFixed(2) + '%';
  }
}
