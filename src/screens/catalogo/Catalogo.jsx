// src/screens/Catalogo.jsx
// ÚLTIMA MODIFICACION: 03/12/2025
import React, { useState } from 'react'; // Only useState for modal, if needed, but hook handles filters
import { useUser } from '../../context/UserContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCatalogFilter } from '../../hooks/useCatalogFilter';
import { useScrollReveal } from '../../hooks/useScrollReveal';

// Components
import PropertyCard from '../../components/catalogo/PropertyCard';
import SearchBar from '../../components/layout/SearchBar';
import FilterBar from '../../components/layout/FilterBar';
import FilterModal from '../../components/modals/FilterModal';

// Styles
import '../../styles/Catalogo.css';

import { useTheme } from '../../context/ThemeContext';

export default function Catalogo() {
  const { userProfile } = useUser();
  const { currentSeason } = useTheme(); // Consume theme context
  const { modelos: dataMaestra, amenidades: topAmenidades, loadingCatalog: loading, desarrollos } = useCatalog();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Use Custom Hook for Logic
  const {
    filtros,
    setFiltros,
    searchTerm,
    setSearchTerm,
    hayFiltrosActivos,
    modelosFiltrados,
    suggestions,
    limpiarTodo
  } = useCatalogFilter(dataMaestra, desarrollos, loading);

  // Alternating animations: Odd from left, Even from right
  useScrollReveal('.catalogo__grid .card:nth-of-type(odd)', { origin: 'left', interval: 100 }, [modelosFiltrados]);
  useScrollReveal('.catalogo__grid .card:nth-of-type(even)', { origin: 'right', interval: 100 }, [modelosFiltrados]);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="catalogo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="catalogo animate-fade-in">

      <header className="catalogo__header">
        <h1 className="catalogo__title">
          {/* Seasonal Theme: Revert to "Hola," after holidays or if disabled */}
          {currentSeason
            ? (userProfile?.nombre ? `Felices fiestas, ${userProfile.nombre}` : 'Catálogo')
            : (userProfile?.nombre ? `Hola, ${userProfile.nombre}` : 'Catálogo')
          }
        </h1>
        <p className="catalogo__subtitle">Encuentra tu hogar ideal</p>
      </header>

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <FilterBar
        setIsFilterOpen={setIsFilterOpen}
        hayFiltrosActivos={hayFiltrosActivos}
        limpiarTodo={limpiarTodo}
        filtros={filtros}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filtros={filtros}
        setFiltros={setFiltros}
        limpiarTodo={limpiarTodo}
        topAmenidades={topAmenidades}
        resultadosCount={modelosFiltrados.length}
      />

      <section className="catalogo__grid">
        {modelosFiltrados.map((item) => (
          <PropertyCard
            key={item.id}
            item={item}
            showDevName={true}
          />
        ))}

        {modelosFiltrados.length === 0 && (
          <div className="catalogo__empty">
            <h3>No encontramos resultados exactos</h3>
            <p>Intenta ajustar tus filtros o explora estas opciones cercanas a tu presupuesto:</p>

            {suggestions && suggestions.length > 0 && (
              <div className="catalogo__suggestions">

                <div className="catalogo__grid" style={{ marginTop: '1rem', padding: 0, gap: '1rem' }}>
                  {suggestions.map((item) => (
                    <PropertyCard
                      key={`sugg-${item.id}`}
                      item={item}
                      showDevName={true}
                    />
                  ))}
                </div>
              </div>
            )}

            <button onClick={limpiarTodo} className="catalogo__retry-btn" style={{ marginTop: '2rem' }}>Ver Todo el Catálogo</button>
          </div>
        )}
      </section>
    </div>
  );
}