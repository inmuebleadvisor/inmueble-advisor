import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return 'dark'; // Force Default Dark Premium as per user request context
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const [seasonalEnabled, setSeasonalEnabled] = useState(() => {
        const saved = localStorage.getItem('seasonalEnabled');
        return saved !== null ? JSON.parse(saved) : true; // Default ON
    });

    useEffect(() => {
        localStorage.setItem('seasonalEnabled', JSON.stringify(seasonalEnabled));
    }, [seasonalEnabled]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const toggleSeasonal = () => {
        setSeasonalEnabled(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, seasonalEnabled, toggleSeasonal }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
