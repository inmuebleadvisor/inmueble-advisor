import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCatalogFilter } from '../../hooks/useCatalogFilter';
import { useDevelopmentCatalog } from '../../hooks/useDevelopmentCatalog';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useFavorites } from '../../context/FavoritesContext';
import MapCatalogView from '../../components/catalogo/MapCatalogView';
import { Map as MapIcon, LayoutGrid } from 'lucide-react';

// Components
import DevelopmentCard from '../../components/catalogo/DevelopmentCard';
import PropertyCard from '../../components/catalogo/PropertyCard';
import SearchBar from '../../components/layout/SearchBar';
import FilterBar from '../../components/layout/FilterBar';
import FilterModal from '../../components/modals/FilterModal';

// Styles
import '../../styles/Catalogo.css';

export default function Catalogo() {
  const { userProfile, trackBehavior, selectedCity } = useUser();
  const { modelos: dataMaestra, amenidades: topAmenidades, loadingCatalog: loading, desarrollos } = useCatalog();
  const { isFavorite } = useFavorites(); // [NEW]
  const location = useLocation();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState(location.state?.viewMode || 'grid');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

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

  // [NEW] Compute markers for the map view
  const marcadoresVisibles = React.useMemo(() => {
    if (loading || !desarrollos || !modelosFiltrados) return [];

    const idsDesarrollosVisibles = new Set(modelosFiltrados.map(m => String(m.idDesarrollo)));

    return desarrollos.map(dev => {
      if (!idsDesarrollosVisibles.has(String(dev.id))) return null;
      if (!dev.ubicacion?.latitud || !dev.ubicacion?.longitud) return null;

      const modelosHijosFiltrados = modelosFiltrados.filter(m => String(m.idDesarrollo) === String(dev.id));

      let etiqueta = "$ Consultar";
      if (modelosHijosFiltrados.length > 0) {
        const precios = modelosHijosFiltrados.map(m => Number(m.precioNumerico));
        const min = Math.min(...precios);
        const max = Math.max(...precios);

        const formatCompact = (val) => {
          if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
          return `$${val}`;
        };

        etiqueta = formatCompact(min);
        if (min !== max) etiqueta = `${formatCompact(min)} - ${formatCompact(max)}`;
      }

      const todosModelosDelDesarrollo = dataMaestra.filter(m => String(m.idDesarrollo) === String(dev.id));
      const tieneFavorito = todosModelosDelDesarrollo.some(m => isFavorite(m.id));

      return {
        id: dev.id,
        nombre: dev.nombre,
        zona: dev.zona,
        ubicacion: { latitud: dev.ubicacion.latitud, longitud: dev.ubicacion.longitud },
        portada: dev.imagen,
        etiquetaPrecio: etiqueta,
        esFavorito: tieneFavorito
      };
    }).filter(Boolean);
  }, [desarrollos, modelosFiltrados, loading, isFavorite, dataMaestra]);

  // [NEW] Use ViewModel Hook to group models into developments
  const enrichedDevelopments = useDevelopmentCatalog(modelosFiltrados, desarrollos);

  // Scroll Reveal for Development Cards
  useScrollReveal('.catalogo__grid > article', { origin: 'bottom', interval: 100 }, [enrichedDevelopments, viewMode]);

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
          Catálogo de {selectedCity || 'México'}
        </h1>

        <div className="catalogo__view-toggle">
          <button
            className={`catalogo__toggle-btn ${viewMode === 'grid' ? 'catalogo__toggle-btn--active' : ''}`}
            onClick={() => {
              setViewMode('grid');
              trackBehavior('catalog_view_mode_change', { mode: 'grid' });
            }}
          >
            <LayoutGrid size={18} /> Lista
          </button>
          <button
            className={`catalogo__toggle-btn ${viewMode === 'map' ? 'catalogo__toggle-btn--active' : ''}`}
            onClick={() => {
              setViewMode('map');
              trackBehavior('catalog_view_mode_change', { mode: 'map' });
            }}
          >
            <MapIcon size={18} /> Mapa
          </button>
        </div>
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

      {viewMode === 'grid' ? (
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
      ) : (
        <MapCatalogView
          marcadores={marcadoresVisibles}
          trackBehavior={trackBehavior}
          isFullscreen={isMapFullscreen}
          setIsFullscreen={setIsMapFullscreen}
        />
      )}
    </div>
  );
}