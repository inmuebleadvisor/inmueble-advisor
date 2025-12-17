import React, { createContext, useContext, useEffect, useState } from 'react';
import SeasonService from '../services/SeasonService';
import { THEME_CONFIG } from '../config/theme.config';

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

    // 2. Seasonal State (System/Admin Controlled via Config)
    // We check the date on mount to see if a season is active.
    // We DO NOT persist this in localStorage because it depends on the Date/Config, not user choice.
    const [currentSeason, setCurrentSeason] = useState(() => SeasonService.getCurrentSeason());

    // 3. Derived Assets
    // We provide the correct assets to consumers based on current state
    const currentAssets = SeasonService.getThemeAssets(theme, currentSeason);

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            currentSeason,
            currentAssets
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

