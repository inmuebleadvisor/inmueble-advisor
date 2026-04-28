/**
 * @file test_UnaCasaParaMi.jsx
 * @description Tests unitarios para el screen UnaCasaParaMi.
 *
 * Valida la estructura renderizada, atributos de accesibilidad del iframe,
 * integración SEO y presencia de trust signals.
 *
 * Siguiendo MANUALDEARQUITECTURA.md §5: tests estructurales para la capa visual.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock de SEOHead para aislar el test del componente externo
vi.mock('../../components/common/SEOHead', () => ({
    default: ({ title, description, noIndex }) => (
        <div
            data-testid="seo-head"
            data-title={title}
            data-description={description}
            data-noindex={String(noIndex)}
        />
    ),
}));

// Mock de lucide-react para evitar dependencia de rendering SVG
vi.mock('lucide-react', () => ({
    Calendar: (props) => <svg data-testid="icon-calendar" {...props} />,
    ShieldCheck: (props) => <svg data-testid="icon-shield" {...props} />,
    CheckCircle: (props) => <svg data-testid="icon-check" {...props} />,
}));

import UnaCasaParaMi from './UnaCasaParaMi';

describe('UnaCasaParaMi', () => {
    /**
     * Verifica que el componente se monta sin errores.
     */
    it('renders without crashing', () => {
        const { container } = render(<UnaCasaParaMi />);
        expect(container.querySelector('.appointment')).toBeTruthy();
    });

    /**
     * Verifica que SEOHead recibe las props correctas para indexación.
     */
    it('renders SEOHead with correct title and indexable flag', () => {
        render(<UnaCasaParaMi />);
        const seoHead = screen.getByTestId('seo-head');
        expect(seoHead.dataset.title).toContain('Agenda tu Cita');
        expect(seoHead.dataset.noindex).toBe('false');
    });

    /**
     * Verifica que el iframe de Google Calendar está presente con la URL correcta.
     */
    it('renders the Google Calendar appointment iframe', () => {
        const { container } = render(<UnaCasaParaMi />);
        const iframe = container.querySelector('.appointment__iframe');
        expect(iframe).toBeTruthy();
        expect(iframe.getAttribute('src')).toContain(
            'calendar.google.com/calendar/appointments'
        );
    });

    /**
     * Verifica atributos de accesibilidad en el iframe.
     */
    it('iframe has accessibility and performance attributes', () => {
        const { container } = render(<UnaCasaParaMi />);
        const iframe = container.querySelector('.appointment__iframe');
        expect(iframe.getAttribute('title')).toBeTruthy();
        expect(iframe.getAttribute('loading')).toBe('lazy');
    });

    /**
     * Verifica que los 3 trust signals se renderizan.
     */
    it('renders all three trust signal badges', () => {
        const { container } = render(<UnaCasaParaMi />);
        const trustItems = container.querySelectorAll('.appointment__trust-item');
        expect(trustItems.length).toBe(3);
    });

    /**
     * Verifica el título principal (h1) con contenido esperado.
     */
    it('renders the main heading with correct text', () => {
        render(<UnaCasaParaMi />);
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.textContent).toContain('Encuentra Una Casa Para Ti');
    });
});
