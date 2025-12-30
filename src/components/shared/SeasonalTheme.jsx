import React, { useEffect, useState } from 'react';
import '../../styles/SeasonalTheme.css';
import { useTheme } from '../../context/ThemeContext';

const SeasonalTheme = () => {
    const { currentAssets, currentSeason } = useTheme();
    const [snowflakes, setSnowflakes] = useState([]);

    useEffect(() => {
        // Only generate snowflakes if the effect is 'snow'
        if (currentAssets.effect === 'snow') {
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
        } else {
            setSnowflakes([]);
        }
    }, [currentAssets.effect]);

    // If no seasonal assets are active (footer or effect), return null
    if (!currentAssets.footer && !currentAssets.effect) return null;

    return (
        <>
            {currentAssets.effect === 'snow' && (
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
                                animationDelay: `-${flake.animationDelay}s`,
                                opacity: flake.opacity
                            }}
                        />
                    ))}
                </div>
            )}

            {currentAssets.footer && (
                <div className="seasonal-theme__footer-wrapper">
                    <img
                        src={currentAssets.footer}
                        alt={`Decoración ${currentSeason?.name || 'Temática'}`}
                        className="seasonal-theme__decoration-img"
                    />
                </div>
            )}
        </>
    );
};

export default SeasonalTheme;

