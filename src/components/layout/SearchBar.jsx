// src/components/catalogo/SearchBar.jsx
import React from 'react';
import { Icons } from '../common/Icons';
import '../../styles/Catalogo.css';

/**
 * @file SearchBar.jsx
 * @description Componente de entrada de texto reutilizable para búsquedas.
 * Mantiene estilos consistentes y maneja la limpieza del input y las pulsaciones de teclas.
 */
export default function SearchBar({ searchTerm, setSearchTerm, onClick, readOnly, autoFocus, onKeyDown }) {
    return (
        <div className="search-bar" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className={`search-bar__container ${onClick ? 'search-bar__container--trigger' : ''}`}>
                <div className="search-bar__icon">
                    <Icons.Search />
                </div>
                <input
                    type="text"
                    placeholder="Buscar desarrollo, zona, constructora..."
                    className="search-bar__input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    readOnly={readOnly}
                    autoFocus={autoFocus}
                    onKeyDown={onKeyDown}
                    style={{ cursor: onClick ? 'pointer' : 'text' }}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="search-bar__clear">
                        <Icons.Close />
                    </button>
                )}
            </div>
        </div>
    );
}
