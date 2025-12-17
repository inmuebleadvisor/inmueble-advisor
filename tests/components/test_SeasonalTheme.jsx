import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SeasonalTheme from '../../src/components/SeasonalTheme';
import React from 'react';
import '@testing-library/jest-dom';

const EXPECTED_URL = "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2Ftematico%2Fpie%20de%20nieve%20con%20monito%20de%20nieve.png?alt=media";

// Initial Mock: seasonalEnabled = true
const mockUseTheme = vi.fn(() => ({ seasonalEnabled: true }));

vi.mock('../../src/context/ThemeContext', () => ({
    useTheme: () => mockUseTheme()
}));

describe('SeasonalTheme', () => {
    it('renders everything when enabled', () => {
        mockUseTheme.mockReturnValue({ seasonalEnabled: true });
        const { container } = render(<SeasonalTheme />);

        const snowContainer = container.querySelector('.seasonal-theme__snow-container');
        expect(snowContainer).toBeInTheDocument();

        const img = screen.getByAltText('Decoración Navideña');
        expect(img).toBeInTheDocument();
    });

    it('renders nothing when disabled', () => {
        mockUseTheme.mockReturnValue({ seasonalEnabled: false });
        const { container } = render(<SeasonalTheme />);

        const snowContainer = container.querySelector('.seasonal-theme__snow-container');
        expect(snowContainer).not.toBeInTheDocument();

        const img = screen.queryByAltText('Decoración Navideña');
        expect(img).not.toBeInTheDocument();
    });
});
