import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, List, Home as HomeIcon, Building2, Construction } from 'lucide-react';
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

    return (
        <>
            <h1 className="hero-content__title">
                Encuentra tu <span className="hero-content__title-extra"><span className="hero-content__highlight">Sueño</span>,<br />encuentra tu </span>
                <span className="hero-content__highlight">Hogar</span>
            </h1>


            <div className="hero-content__search-wrapper" onClick={() => navigate('/catalogo', { state: { openSearchModal: true } })}>
                <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    readOnly={true}
                    onClick={() => navigate('/catalogo', { state: { openSearchModal: true } })}
                />
            </div>

            <div className="hero-content__filters">
                <button
                    className="hero-content__filter-chip"
                    onClick={() => navigate('/catalogo', { state: { viewMode: 'grid' } })}
                >
                    <List size={20} strokeWidth={2} className="hero-content__chip-icon" />
                    Lista
                </button>
                <button
                    className="hero-content__filter-chip"
                    onClick={() => navigate('/catalogo', { state: { viewMode: 'map' } })}
                >
                    <MapPin size={20} strokeWidth={2} className="hero-content__chip-icon" />
                    Mapa
                </button>
                <button
                    className="hero-content__filter-chip"
                    onClick={() => navigate('/catalogo', { state: { tipo: 'casa', resetFilters: true } })}
                >
                    <HomeIcon size={18} /> Casas
                </button>
                <button
                    className="hero-content__filter-chip"
                    onClick={() => navigate('/catalogo', { state: { tipo: 'departamento', resetFilters: true } })}
                >
                    <Building2 size={18} /> Deptos
                </button>
                <button
                    className="hero-content__filter-chip"
                    onClick={() => navigate('/catalogo', { state: { status: 'preventa', resetFilters: true } })}
                >
                    <Construction size={18} /> Preventa
                </button>
            </div>
        </>
    );
}
