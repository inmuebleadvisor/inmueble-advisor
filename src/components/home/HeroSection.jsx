import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../layout/SearchBar';
import '../../styles/components/home/HeroSection.css';

/**
 * @file HeroSection.jsx (Refactored as Content)
 * @description Maneja el texto, buscador y filtros rápidos.
 * @responsibility Presentación de valor y navegación inicial.
 */
export default function HeroSection() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        navigate('/catalogo', { state: { searchQuery: searchTerm } });
    };

    const applyFilter = (filterType, value) => {
        navigate('/catalogo', { state: { [filterType]: value } });
    };

    return (
        <div className="hero-content">
            <h1 className="hero-content__title">
                Encuentra tu sueño, <br />
                <span className="hero-content__highlight">encuentra tu hogar</span>
            </h1>
            <p className="hero-content__subtitle">
                Explora desarrollos exclusivos y preventas únicas en tu ciudad.
            </p>

            <div
                className="hero-content__search-container"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            >
                <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />
            </div>

            <div className="hero-content__filters">
                <button
                    className="hero-content__filter-chip"
                    onClick={() => applyFilter('rangoPrecio', 'economico')}
                >
                    💰 Precio
                </button>
                <button
                    className="hero-content__filter-chip"
                    onClick={() => navigate('/catalogo', { state: { viewMode: 'map' } })}
                >
                    📍 Mapa
                </button>
            </div>
        </div>
    );
}
