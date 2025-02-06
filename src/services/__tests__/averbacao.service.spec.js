"use strict";
describe('AverbacaoService', () => {
    let service;
    let repository;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AverbacaoService,
                {
                    provide: AverbacaoRepository,
                    useFactory: repositoryMockFactory
                }
            ]
        }).compile();
        service = module.get(AverbacaoService);
        repository = module.get(AverbacaoRepository);
    });
    it('should create averbacao', async () => {
        const dto = createMockAverbacaoDto();
        const expected = createMockAverbacao();
        repository.create.mockResolvedValue(expected);
        const result = await service.create(dto);
        expect(result).toEqual(expected);
    });
});
