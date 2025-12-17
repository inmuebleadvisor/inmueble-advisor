import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SeasonalTheme from '../src/components/SeasonalTheme';
import * as ThemeContextModule from '../src/context/ThemeContext';

// Mock ThemeContext
vi.mock('../src/context/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('SeasonalTheme', () => {
    it('should return null (render nothing) when no assets are provided', () => {
        ThemeContextModule.useTheme.mockReturnValue({
            currentAssets: { footer: null, effect: null },
            currentSeason: null
        });

        const { container } = render(<SeasonalTheme />);
        expect(container.firstChild).toBeNull();
    });

    it('should render footer image when provided', () => {
        ThemeContextModule.useTheme.mockReturnValue({
            currentAssets: { footer: 'https://example.com/footer.png', effect: null },
            currentSeason: { name: 'TestSeason' }
        });

        render(<SeasonalTheme />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://example.com/footer.png');
        expect(img).toHaveAttribute('alt', 'Decoración TestSeason');
    });

    it('should render snow effect when effect is "snow"', () => {
        ThemeContextModule.useTheme.mockReturnValue({
            currentAssets: { footer: null, effect: 'snow' },
            currentSeason: { name: 'Winter' }
        });

        const { container } = render(<SeasonalTheme />);
        // Check for snow container
        const snowContainer = container.querySelector('.seasonal-theme__snow-container');
        expect(snowContainer).toBeInTheDocument();
        // Check if snowflakes are generated (component logic generates 50)
        expect(snowContainer.children.length).toBe(50);
    });
});
