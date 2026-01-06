import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            style={{
                background: 'none',
                border: '1px solid var(--text-secondary)',
                borderRadius: '20px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                opacity: 0.8
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
    );
}
