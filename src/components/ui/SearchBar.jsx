// src/components/catalogo/SearchBar.jsx
import React from 'react';
import { Icons } from './Icons';
import '../../styles/Catalogo.css';

export default function SearchBar({ searchTerm, setSearchTerm }) {
    return (
        <div className="search-bar">
            <div className="search-bar__container">
                <div className="search-bar__icon">
                    <Icons.Search />
                </div>
                <input
                    type="text"
                    placeholder="Buscar desarrollo, zona, constructora..."
                    className="search-bar__input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
