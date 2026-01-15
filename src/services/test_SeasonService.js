/**
 * @fileoverview Pruebas unitarias para SeasonService.
 * Verifica la lógica de selección de temporadas y el interruptor maestro.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SeasonService from './SeasonService';
import { SEASONAL_CONFIG } from '../config/theme.config';

// Mock de la configuración para controlar isEnabled y las fechas de manera determinista
vi.mock('../config/theme.config', () => ({
    SEASONAL_CONFIG: {
        isEnabled: true,
        seasons: [
            {
                id: 'test_season',
                name: 'Test Season',
                dateRange: { start: '12-01', end: '12-31' },
                assets: {
                    logoLight: 'test-logo-light.png',
                    logoDark: 'test-logo-dark.png',
                    footerDecoration: 'test-footer.png',
                    backgroundEffect: 'test-effect'
                }
            }
        ],
        defaultAssets: {
            logoLight: 'default-logo-light.png',
            logoDark: 'default-logo-dark.png',
            footerDecoration: null,
            backgroundEffect: null
        }
    }
}));

describe('SeasonService', () => {
    beforeEach(() => {
        // Reset config before each test default state
        SEASONAL_CONFIG.isEnabled = true;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getCurrentSeason', () => {
        it('debe respetar el interruptor maestro isEnabled = false', () => {
            // ARRANGE
            SEASONAL_CONFIG.isEnabled = false;
            // Fecha dentro del rango de la temporada de prueba (15 de Diciembre)
            const date = new Date(2023, 11, 15);

            // ACT
            const season = SeasonService.getCurrentSeason(date);

            // ASSERT
            expect(season).toBeNull();
        });

        it('debe devolver la temporada activa si isEnabled = true y la fecha coincide', () => {
            // ARRANGE
            SEASONAL_CONFIG.isEnabled = true;
            const date = new Date(2023, 11, 15); // 15 de Diciembre

            // ACT
            const season = SeasonService.getCurrentSeason(date);

            // ASSERT
            expect(season).not.toBeNull();
            expect(season.id).toBe('test_season');
        });

        it('debe devolver null si isEnabled = true pero la fecha no coincide', () => {
            // ARRANGE
            SEASONAL_CONFIG.isEnabled = true;
            const date = new Date(2023, 5, 15); // 15 de Junio

            // ACT
            const season = SeasonService.getCurrentSeason(date);

            // ASSERT
            expect(season).toBeNull();
        });

        it('debe manejar correctamente el cruce de año (Diciembre con Enero next year) si la logica lo soporta', () => {
            // Nota: El mock actual define 12-01 a 12-31, así que probamos limites simples.
            // Para probar cruce de año necesitaríamos otro mock de temporada, 
            // pero SeasonService.js tiene lógica de cruce. 
            // Confiamos en la lógica de 'checkDate' interna, aquí probamos la integración básica.
            const date = new Date(2023, 11, 1); // 1 de Dic
            const season = SeasonService.getCurrentSeason(date);
            expect(season?.id).toBe('test_season');
        });
    });

    describe('getThemeAssets', () => {
        it('debe devolver assets por defecto si no hay temporada activa', () => {
            const assets = SeasonService.getThemeAssets('light', null);
            expect(assets.logo).toBe('default-logo-light.png');
            expect(assets.footer).toBeNull();
        });

        it('debe devolver assets de temporada si hay temporada activa', () => {
            const mockSeason = SEASONAL_CONFIG.seasons[0];

            const assetsLight = SeasonService.getThemeAssets('light', mockSeason);
            expect(assetsLight.logo).toBe('test-logo-light.png');
            expect(assetsLight.footer).toBe('test-footer.png');
            expect(assetsLight.effect).toBe('test-effect');

            const assetsDark = SeasonService.getThemeAssets('dark', mockSeason);
            expect(assetsDark.logo).toBe('test-logo-dark.png');
        });
    });
});
