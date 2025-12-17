import React, { useEffect, useState } from 'react';
import '../styles/SeasonalTheme.css';
import { useTheme } from '../context/ThemeContext';

// URL provided by user: inmueble-advisor-app.firebasestorage.app/Institucional/tematico/pie de nieve con monito de nieve.png
const FOOTER_DECORATION_URL = "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2Ftematico%2Fpie%20de%20nieve%20con%20monito%20de%20nieve.png?alt=media";

const SeasonalTheme = () => {
    const { seasonalEnabled } = useTheme();
    const [snowflakes, setSnowflakes] = useState([]);

    useEffect(() => {
        // Generate snowflakes only once on mount
        const count = 50;
        const flakes = [];
        for (let i = 0; i < count; i++) {
            flakes.push({
                id: i,
                left: Math.random() * 100, // percentage
                animationDuration: Math.random() * 5 + 5, // 5-10s
                animationDelay: Math.random() * 5, // 0-5s
                opacity: Math.random() * 0.5 + 0.3,
                size: Math.random() * 5 + 5 // 5-10px
            });
        }
        setSnowflakes(flakes);
    }, []);

    if (!seasonalEnabled) return null;

    return (
        <>
            <div className="seasonal-theme__snow-container" aria-hidden="true">
                {snowflakes.map((flake) => (
                    <div
                        key={flake.id}
                        className="seasonal-theme__snow"
                        style={{
                            left: `${flake.left}%`,
                            width: `${flake.size}px`,
                            height: `${flake.size}px`,
                            animationDuration: `${flake.animationDuration}s`,
                            animationDelay: `-${flake.animationDelay}s`, // Negative delay to start mid-animation
                            opacity: flake.opacity
                        }}
                    />
                ))}
            </div>

            <div className="seasonal-theme__footer-wrapper">
                <img
                    src={FOOTER_DECORATION_URL}
                    alt="Decoración Navideña"
                    className="seasonal-theme__decoration-img"
                />
            </div>
        </>
    );
};

export default SeasonalTheme;
