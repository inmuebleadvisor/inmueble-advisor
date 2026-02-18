import React, { createContext, useContext } from 'react';
import { THEME_ASSETS } from '../config/theme.config';

/**
 * @fileoverview ThemeContext simplificado — Dark Premium es el único tema.
 * Provee los assets visuales (logo, decoraciones) a los componentes consumidores.
 * No existe toggle de tema. El tema es estático.
 */

const ThemeContext = createContext();

/**
 * Proveedor de tema estático (Dark Premium).
 * @param {object} props - Props del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que consumen el contexto.
 * @returns {React.ReactElement} Provider con assets del tema oscuro.
 */
export function ThemeProvider({ children }) {
    // Dark Premium es el único tema. No hay toggle.
    const currentAssets = {
        logo: THEME_ASSETS.logoDark,
        footer: THEME_ASSETS.footerDecoration,
        effect: THEME_ASSETS.backgroundEffect
    };

    return (
        <ThemeContext.Provider value={{ currentAssets }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook para acceder al contexto de tema.
 * @returns {{ currentAssets: { logo: string, footer: string|null, effect: string|null } }}
 */
export const useTheme = () => useContext(ThemeContext);
