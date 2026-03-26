import { describe, it, expect } from 'vitest';
import { ModelPresentationService } from './ModelPresentationService';
import { IMAGES } from '../../config/constants';

describe('ModelPresentationService', () => {
    let service;

    beforeEach(() => {
        service = new ModelPresentationService();
    });

    describe('getGaleriaImagenes', () => {
        it('should fallback to default image when model is null', () => {
            const items = service.getGaleriaImagenes(null);
            expect(items).toEqual([]);
        });

        it('should fallback to default image when empty', () => {
            const items = service.getGaleriaImagenes({});
            expect(items).toEqual([{ url: IMAGES.FALLBACK_PROPERTY, type: 'image' }]);
        });

        it('should map images correctly', () => {
            const items = service.getGaleriaImagenes({ imagenes: ['img1.jpg', 'img2.jpg'] });
            expect(items).toEqual([
                { url: 'img1.jpg', type: 'image' },
                { url: 'img2.jpg', type: 'image' }
            ]);
        });

        it('should prioritize video at the start of array', () => {
            const items = service.getGaleriaImagenes({
                video: 'vid.mp4',
                imagenes: ['img1.jpg']
            });
            expect(items).toEqual([
                { url: 'vid.mp4', type: 'video' },
                { url: 'img1.jpg', type: 'image' }
            ]);
        });
    });

    describe('formatoMoneda', () => {
        it('should handle undefined or null values', () => {
            expect(service.formatoMoneda(null)).toBe('Precio Pendiente');
            expect(service.formatoMoneda(undefined)).toBe('Precio Pendiente');
            expect(service.formatoMoneda('ABC')).toBe('Precio Pendiente');
        });

        it('should format standard numbers to MXN currency string', () => {
            const formatted = service.formatoMoneda(1500000);
            // Replace unbreakable spaces logic based on Node versions 
            // Intl sometimes uses \xa0 instead of space
            expect(formatted.replace(/\s|\xa0/g, '')).toBe('$1,500,000');
        });
    });

    describe('buildSimulatorPayload', () => {
        it('should build payload correctly from basic model and development parameters', () => {
            const model = {
                nombre_modelo: 'Aura',
                tipoVivienda: 'Casa',
                esPreventa: true,
                recamaras: 3,
                banos: 2,
                m2: 120,
                imagenes: ['img.jpg']
            };

            const development = {
                nombre: 'Valle Dorado'
            };

            const payload = service.buildSimulatorPayload(model, development);

            expect(payload.title).toBe('Aura');
            expect(payload.developmentName).toBe('Valle Dorado');
            expect(payload.subtitle).toBe('Casa');
            expect(payload.deliveryStatus).toBe('Preventa');
            expect(payload.image).toBe('img.jpg');
            expect(payload.bedrooms).toBe(3);
            expect(payload.bathrooms).toBe(2);
            expect(payload.area).toBe(120);
        });
    });

    describe('getCaracteristicas', () => {
        it('should correctly extract features and levels', () => {
            const data = { recamaras: 3, banos: 2.5, m2: 150, terreno: 200, niveles: 2 };
            const chars = service.getCaracteristicas(data);
            expect(chars.recamaras).toBe(3);
            expect(chars.banos).toBe('2.5');
            expect(chars.construccion).toBe(150);
            expect(chars.terreno).toBe(200);
            expect(chars.niveles).toBe(2);
        });

        it('should handle nested caracteristicas object safely', () => {
            const data = { caracteristicas: { recamaras: 2, niveles: 1 } };
            const chars = service.getCaracteristicas(data);
            expect(chars.recamaras).toBe(2);
            expect(chars.niveles).toBe(1);
        });
    });

    describe('getHighlights', () => {
        it('should return valid string highlights and ignore invalid ones', () => {
            const data = { highlights: ['Gran patio', null, '', 'Luz natural'] };
            const highlights = service.getHighlights(data);
            expect(highlights).toEqual(['Gran patio', 'Luz natural']);
        });

        it('should return empty array if no highlights exist', () => {
            expect(service.getHighlights({})).toEqual([]);
        });
    });

    describe('getInfoComercial', () => {
        it('should extract valid commercial strings from infoComercial', () => {
            const data = { infoComercial: { promocion: 'Bono $50,000', texto_venta: ' ' } };
            const bullets = service.getInfoComercial(data);
            expect(bullets).toContain('Bono $50,000');
            expect(bullets).not.toContain(' ');
        });

        it('should format numeric apartado and enganche from both model and dev fallbacks', () => {
            const modelo = { precios: { apartado: 15000, enganche: 0.10 } };
            const bullets = service.getInfoComercial(modelo);
            expect(bullets.some(b => b.includes('Aparta desde') && b.includes('15,000'))).toBeTruthy();
            expect(bullets.some(b => b.includes('Enganche desde 10%'))).toBeTruthy();
        });

        it('should fallback to desarrollo if modelo lacks features', () => {
            const modelo = {};
            const desarrollo = { financiamiento: { apartadoMinimo: 20000 } };
            const bullets = service.getInfoComercial(modelo, desarrollo);
            expect(bullets.some(b => b.includes('Aparta desde') && b.includes('20,000'))).toBeTruthy();
        });
    });
});
