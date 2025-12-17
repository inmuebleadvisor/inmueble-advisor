import { describe, it, expect } from 'vitest';
import SeasonService from '../src/services/SeasonService';
import { SEASONAL_CONFIG } from '../src/config/theme.config';

describe('SeasonService', () => {

    describe('getCurrentSeason', () => {
        it('should return null when date is out of any season range', () => {
            // Pick a date definitely not in Dec/Jan (assuming default config only has xmas)
            const date = new Date('2024-06-15');
            const season = SeasonService.getCurrentSeason(date);
            expect(season).toBeNull();
        });

        it('should return christmas season for December 25th', () => {
            const date = new Date('2024-12-25');
            const season = SeasonService.getCurrentSeason(date);
            expect(season).toBeDefined();
            expect(season.id).toBe('christmas');
        });

        it('should return christmas season for January 5th (Year Wrap)', () => {
            const date = new Date('2025-01-05');
            const season = SeasonService.getCurrentSeason(date);
            expect(season).toBeDefined();
            expect(season.id).toBe('christmas');
        });
    });

    describe('getThemeAssets', () => {
        it('should return default assets when no season is active', () => {
            const assets = SeasonService.getThemeAssets('dark', null);
            expect(assets.logo).toBe(SEASONAL_CONFIG.defaultAssets.logoDark);
            expect(assets.footer).toBeNull();
        });

        it('should return seasonal assets when season is active', () => {
            const mockSeason = {
                assets: {
                    logoDark: 'dark-xmas.png',
                    logoLight: 'light-xmas.png',
                    footerDecoration: 'footer.png',
                    backgroundEffect: 'snow'
                }
            };
            const assets = SeasonService.getThemeAssets('dark', mockSeason);
            expect(assets.logo).toBe('dark-xmas.png');
            expect(assets.footer).toBe('footer.png');
            expect(assets.effect).toBe('snow');
        });
    });
});
