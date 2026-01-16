import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEME_CONFIG, THEME_ASSETS } from '../config/theme.config';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // 1. Theme State (User Preference)
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem(THEME_CONFIG.storageKeys.theme);
        if (saved) return saved;
        return THEME_CONFIG.defaultTheme;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_CONFIG.storageKeys.theme, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === THEME_CONFIG.themes.dark ? THEME_CONFIG.themes.light : THEME_CONFIG.themes.dark);
    };

    // 2. Derived Assets (Simplified)
    const currentAssets = {
        logo: theme === 'light' ? THEME_ASSETS.logoLight : THEME_ASSETS.logoDark,
        footer: THEME_ASSETS.footerDecoration,
        effect: THEME_ASSETS.backgroundEffect
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            currentAssets
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

