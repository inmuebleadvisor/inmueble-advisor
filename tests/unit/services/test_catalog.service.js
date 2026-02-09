import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogService } from '../../../src/services/catalog.service';

describe('CatalogService', () => {
    let catalogService;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            getAllModelos: vi.fn(),
            getDesarrollosByCiudad: vi.fn(),
            getModelosByDesarrolloIds: vi.fn(),
            getAllDesarrollos: vi.fn()
        };
        catalogService = new CatalogService(mockRepository);
    });

    it('should fetch unified models using repository', async () => {
        const mockModelos = [{ id: 1, name: 'Model A' }];
        mockRepository.getAllModelos.mockResolvedValue(mockModelos);

        const result = await catalogService.obtenerDatosUnificados();

        expect(mockRepository.getAllModelos).toHaveBeenCalled();
        expect(result).toEqual(mockModelos);
    });

    it('should use cache for subsequent calls', async () => {
        mockRepository.getAllModelos.mockResolvedValue([{ id: 1 }]);

        await catalogService.obtenerDatosUnificados();
        await catalogService.obtenerDatosUnificados();

        expect(mockRepository.getAllModelos).toHaveBeenCalledTimes(1);
    });

    it('should filter by city using repository', async () => {
        const ciudad = 'Cancun';
        mockRepository.getDesarrollosByCiudad.mockResolvedValue([{ id: 'dev1' }]);
        mockRepository.getModelosByDesarrolloIds.mockResolvedValue([{ id: 'm1', idDesarrollo: 'dev1' }]);

        await catalogService.obtenerDatosUnificados(ciudad);

        expect(mockRepository.getDesarrollosByCiudad).toHaveBeenCalledWith(ciudad);
        expect(mockRepository.getModelosByDesarrolloIds).toHaveBeenCalledWith(['dev1']);
    });

    it('should handle errors gracefully returning empty array', async () => {
        mockRepository.getAllModelos.mockRejectedValue(new Error('DB Error'));

        const result = await catalogService.obtenerDatosUnificados();

        expect(result).toEqual([]);
    });

    it('should filter catalog using static method filterCatalog', () => {
        const data = [
            { id: 1, precioNumerico: 1000000, recamaras: 3, idDesarrollo: 'd1', activo: true },
            { id: 2, precioNumerico: 5000000, recamaras: 1, idDesarrollo: 'd1', activo: true }
        ];
        const desarrollos = [{ id: 'd1', activo: true }];
        const filters = { precioMax: 2000000, habitaciones: 2, showNoPrice: false, status: 'all', tipo: 'all' };

        const filtered = CatalogService.filterCatalog(data, desarrollos, filters, '');

        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe(1);
    });
});
