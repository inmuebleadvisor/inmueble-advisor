import { describe, it, expect } from 'vitest';
import { getDevelopmentStatusTag } from './developmentService';

describe('developmentService', () => {
    describe('getDevelopmentStatusTag', () => {
        it('debe retornar null si no hay desarrollo', () => {
            expect(getDevelopmentStatusTag(null)).toBeNull();
        });

        it('debe detectar PRE-VENTA desde modelos', () => {
            const dev = {
                matchingModels: [{ status: 'PREVENTA' }]
            };
            const res = getDevelopmentStatusTag(dev);
            expect(res.label).toBe('PRE-VENTA');
            expect(res.class).toBe('development-card__status-tag--warning');
        });

        it('debe detectar ENTREGA INMEDIATA desde el desarrollo', () => {
            const dev = {
                status: 'INMEDIATA'
            };
            const res = getDevelopmentStatusTag(dev);
            expect(res.label).toBe('ENTREGA INMEDIATA');
            expect(res.class).toBe('development-card__status-tag--success');
        });

        it('debe manejar status mixto (Info)', () => {
            const dev = {
                status: 'PREVENTA',
                matchingModels: [{ status: 'INMEDIATA' }]
            };
            const res = getDevelopmentStatusTag(dev);
            expect(res.label).toBe('Inmediato/Preventa');
            expect(res.class).toBe('development-card__status-tag--info');
        });
    });
});
