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
});
