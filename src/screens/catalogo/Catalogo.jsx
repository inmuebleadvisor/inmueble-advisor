// src/screens/Catalogo.jsx
// ÚLTIMA MODIFICACION: 10/02/2026 (Refactor: Vista por Desarrollos)
import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCatalogFilter } from '../../hooks/useCatalogFilter';
import { useDevelopmentCatalog } from '../../hooks/useDevelopmentCatalog'; // [NEW]
import { useScrollReveal } from '../../hooks/useScrollReveal';

// Components
import DevelopmentCard from '../../components/catalogo/DevelopmentCard'; // [NEW]
import PropertyCard from '../../components/catalogo/PropertyCard';
import SearchBar from '../../components/layout/SearchBar';
import FilterBar from '../../components/layout/FilterBar';
import FilterModal from '../../components/modals/FilterModal';

// Styles
import '../../styles/Catalogo.css';

export default function Catalogo() {
  const { userProfile } = useUser();
  const { modelos: dataMaestra, amenidades: topAmenidades, loadingCatalog: loading, desarrollos } = useCatalog();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Use Custom Hook for Filter Logic
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

  // [NEW] Use ViewModel Hook to group models into developments
  const enrichedDevelopments = useDevelopmentCatalog(modelosFiltrados, desarrollos);

  // Scroll Reveal for Development Cards
  useScrollReveal('.catalogo__grid > article', { origin: 'bottom', interval: 100 }, [enrichedDevelopments]);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="catalogo catalogo--loading">
        <p className="catalogo__loading-text">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="catalogo animate-fade-in">

      <header className="catalogo__header">
        <h1 className="catalogo__title">
          {userProfile?.nombre ? `Hola, ${userProfile.nombre}` : 'Catálogo'}
        </h1>
        <p className="catalogo__subtitle">Explora nuestros desarrollos exclusivos</p>
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
        {/* Render Developments instead of Models */}
        {enrichedDevelopments.map((dev) => (
          <DevelopmentCard
            key={dev.id}
            development={dev}
          />
        ))}

        {/* Empty State / Suggestions */}
        {enrichedDevelopments.length === 0 && (
          <div className="catalogo__empty">
            <h3>No encontramos resultados exactos</h3>
            <p>Intenta ajustar tus filtros o explora estas opciones cercanas a tu presupuesto:</p>

            {suggestions && suggestions.length > 0 && (
              <div className="catalogo__suggestions">
                <p className="catalogo__subtitle" style={{ marginBottom: '1rem' }}>Sugerencias (Modelos individuales):</p>
                <div className="catalogo__grid" style={{ marginTop: '0', padding: 0, gap: '1rem' }}>
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