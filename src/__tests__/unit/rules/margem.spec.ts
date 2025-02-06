import { Test, TestingModule } from '@nestjs/testing';
import { MargemService } from '../../../services/margem.service';
import { MargemInsuficienteException } from '../../../exceptions/margem-insuficiente.exception';

describe('MargemService', () => {
  let service: MargemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MargemService],
    }).compile();

    service = module.get<MargemService>(MargemService);
  });

  describe('validarMargem', () => {
    it('deve aprovar quando parcela está dentro da margem', async () => {
      const salario = 5000;
      const parcela = 1000; // 20% do salário

      const result = await service.validarMargem({ 
        salario, 
        parcela,
        matricula: '123456'
      });

      expect(result).toBe(true);
    });

    it('deve rejeitar quando parcela excede margem', async () => {
      const salario = 5000;
      const parcela = 2000; // 40% do salário

      await expect(
        service.validarMargem({ 
          salario, 
          parcela,
          matricula: '123456'
        })
      ).rejects.toThrow(MargemInsuficienteException);
    });

    it('deve considerar outros contratos ativos', async () => {
      const salario = 5000;
      const parcelaExistente = 1000; // 20% do salário
      const novaParcela = 750; // 15% do salário

      // Mock de contratos existentes
      jest.spyOn(service as any, 'getContratosAtivos').mockResolvedValue([
        { parcela: parcelaExistente }
      ]);

      const result = await service.validarMargem({
        salario,
        parcela: novaParcela,
        matricula: '123456'
      });

      expect(result).toBe(true);
    });

    it('deve rejeitar quando soma das parcelas excede margem', async () => {
      const salario = 5000;
      const parcelaExistente = 1000; // 20% do salário
      const novaParcela = 1000; // 20% do salário

      // Mock de contratos existentes
      jest.spyOn(service as any, 'getContratosAtivos').mockResolvedValue([
        { parcela: parcelaExistente }
      ]);

      await expect(
        service.validarMargem({
          salario,
          parcela: novaParcela,
          matricula: '123456'
        })
      ).rejects.toThrow(MargemInsuficienteException);
    });
  });

  describe('calcularMargemDisponivel', () => {
    it('deve calcular margem corretamente', async () => {
      const salario = 5000;
      const margemEsperada = 1500; // 30% do salário

      const margem = await service.calcularMargemDisponivel({
        salario,
        matricula: '123456'
      });

      expect(margem).toBe(margemEsperada);
    });

    it('deve descontar contratos existentes', async () => {
      const salario = 5000;
      const parcelaExistente = 500;
      const margemEsperada = 1000; // 30% - parcela existente

      // Mock de contratos existentes
      jest.spyOn(service as any, 'getContratosAtivos').mockResolvedValue([
        { parcela: parcelaExistente }
      ]);

      const margem = await service.calcularMargemDisponivel({
        salario,
        matricula: '123456'
      });

      expect(margem).toBe(margemEsperada);
    });
  });
});
