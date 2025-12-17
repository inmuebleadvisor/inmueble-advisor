// src/screens/Favoritos.jsx
// ÚLTIMA MODIFICACION: 05/12/2025
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';
import ImageLoader from '../components/ImageLoader';

// Componentes UI Reusables
import Modal from '../components/Modal';
import ModelDetailsContent from '../components/ModelDetailsContent';
import DevelopmentDetailsContent from '../components/DevelopmentDetailsContent';

// --- ICONOS ---
const Icons = {
    Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
    X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Compare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l5 5" /><path d="M4 4l5 5" /></svg>,
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
    Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
};

export default function Favoritos() {
    const { favoritosIds, toggleFavorite } = useFavorites();
    const { modelos, loadingCatalog, getDesarrolloById, getModeloById } = useCatalog();

    // Estado para la selección de comparación
    const [selectedIds, setSelectedIds] = useState([]);
    const [isComparing, setIsComparing] = useState(false);

    // Estados para Modal (Popup)
    const [modalOpen, setModalOpen] = useState(false);
    const [activeItem, setActiveItem] = useState(null); // ID del item activo
    const [modalType, setModalType] = useState('model'); // 'model' or 'development'

    // 1. Hidratación de datos
    const favoritosHydrated = useMemo(() => {
        if (loadingCatalog) return [];
        return modelos.filter(m => favoritosIds.includes(m.id));
    }, [favoritosIds, modelos, loadingCatalog]);

    // Helpers
    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            if (selectedIds.length >= 3) return alert("Puedes comparar máximo 3 propiedades a la vez.");
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    // Helpers de datos
    const getDesarrolloForModel = (modelo) => {
        const idDevRaw = modelo.idDesarrollo || modelo.id_desarrollo || modelo.desarrollo_id;
        if (!idDevRaw) return null;
        const dev = getDesarrolloById(String(idDevRaw).trim());
        // Evitar referencias circulares si el ID coincide consigo mismo (data sucia)
        if (dev && String(dev.id) === String(modelo.id)) return null;
        return dev;
    };

    // HANDLERS PARA MODALES
    const openModelPopup = (e, item) => {
        e.stopPropagation();
        setActiveItem(item);
        setModalType('model');
        setModalOpen(true);
    };

    const openDevelopmentPopup = (e, devId) => {
        if (e) e.stopPropagation();
        // Buscamos desarrollo on demand
        const dev = getDesarrolloById(String(devId));
        if (dev) {
            setActiveItem(dev);
            setModalType('development');
            setModalOpen(true);
        }
    };

    // Datos para la tabla de comparación
    const propiedadesAComparar = useMemo(() => {
        return favoritosHydrated.filter(p => selectedIds.includes(p.id));
    }, [favoritosHydrated, selectedIds]);

    // Agrupación por Desarrollo (Moved up to avoid conditional hook execution)
    const groupedFavorites = useMemo(() => {
        const groups = {};
        favoritosHydrated.forEach(model => {
            const dev = getDesarrolloForModel(model);
            const devId = dev ? dev.id : 'unknown';
            const devName = dev ? dev.nombre : (model.nombreDesarrollo || 'Otros');

            if (!groups[devId]) {
                groups[devId] = {
                    id: devId,
                    name: devName,
                    desarrollo: dev,
                    items: []
                };
            }
            groups[devId].items.push(model);
        });
        return Object.values(groups);
    }, [favoritosHydrated, getDesarrolloById]);


    // --- RENDERIZADO: ESTADO VACÍO ---
    if (!loadingCatalog && favoritosHydrated.length === 0) {
        return (
            <div className="main-content" style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>💔</div>
                <h2 style={{ color: 'var(--text-main)' }}>Tu lista está vacía</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '10px auto' }}>
                    Explora nuestro catálogo y guarda las propiedades que te interesen para compararlas aquí.
                </p>
                <Link to="/catalogo" style={styles.btnPrimary}>Ir al Catálogo</Link>
            </div>
        );
    }

    // CONTENIDO DEL MODAL
    const renderModalContent = () => {
        if (!activeItem) return null;

        if (modalType === 'model') {
            // Necesitamos reconstruir las props que espera ModelDetailsContent
            // 'activeItem' es el modelo completo
            const desarrollo = getDesarrolloForModel(activeItem);
            const hermanos = modelos.filter(m => {
                // Lógica simple de hermanos: mismo desarrollo
                const activeIdDev = desarrollo ? String(desarrollo.id) : null;
                const mIdDev = m.idDesarrollo || m.id_desarrollo || m.desarrollo_id;
                return activeIdDev && String(mIdDev) === activeIdDev && String(m.id) !== String(activeItem.id);
            });

            return (
                <ModelDetailsContent
                    modelo={activeItem}
                    desarrollo={desarrollo}
                    modelosHermanos={hermanos} // Quizá limitar esto en modal?
                    isModal={true}
                />
            );
        } else {
            // development
            return (
                <DevelopmentDetailsContent
                    desarrollo={activeItem}
                    isModal={true}
                />
            );
        }
    };

    // --- RENDERIZADO: MODO COMPARACIÓN (TABLA) ---
    if (isComparing) {
        return (
            <div className="main-content animate-fade-in" style={{ paddingBottom: '50px' }}>
                <div style={styles.compareHeader}>
                    <button onClick={() => setIsComparing(false)} style={styles.backLink}>&larr; Volver a mis favoritos</button>
                    <h2 style={styles.pageTitle}>Comparativa</h2>
                </div>

                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.stickyColHeader}>Característica</th>
                                {propiedadesAComparar.map(item => (
                                    <th key={item.id} style={styles.thModel}>
                                        <div style={styles.thContent}>
                                            <div style={styles.thImgWrapper}>
                                                <ImageLoader src={item.imagen} style={styles.thImg} />
                                                <button
                                                    onClick={() => {
                                                        handleSelect(item.id);
                                                        if (selectedIds.length <= 1) setIsComparing(false);
                                                    }}
                                                    style={styles.removeBtnTable}
                                                >
                                                    <Icons.X />
                                                </button>
                                            </div>
                                            <span style={styles.thTitle}>{item.nombre_modelo}</span>
                                            <span style={styles.thPrice}>{formatoMoneda(item.precioNumerico)}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                // 3.1 & 3.2 Cambios solicitados en tabla
                                {
                                    label: 'Zona/Sector',
                                    val: (m) => {
                                        const dev = getDesarrolloForModel(m);
                                        return m.zona || dev?.zona || dev?.ubicacion?.ciudad || 'N/A';
                                    }
                                },
                                {
                                    label: 'Colonia',
                                    val: (m) => {
                                        const dev = getDesarrolloForModel(m);
                                        return m.ubicacion?.colonia || m.colonia || dev?.ubicacion?.colonia || 'N/A';
                                    }
                                },
                                {
                                    label: 'Desarrollo', // 3.3 Link Popup
                                    val: (m) => {
                                        const dev = getDesarrolloForModel(m);
                                        return m.nombreDesarrollo || dev?.nombre || 'Desarrollo';
                                    },
                                    isLink: true,
                                    onClick: (m) => openDevelopmentPopup(null, m.idDesarrollo || m.id_desarrollo)
                                },
                                { label: 'Construcción', val: (m) => `${m.m2} m²` },
                                {
                                    label: 'Costo por m²', // 3.4 Nuevo cálculo
                                    val: (m) => m.m2 > 0 ? formatoMoneda(m.precioNumerico / m.m2) : 'N/A',
                                    style: { fontSize: '0.85rem', color: 'var(--text-secondary)' }
                                },
                                { label: 'Recámaras', val: (m) => m.recamaras },
                                { label: 'Baños', val: (m) => m.banos },
                                { label: 'Niveles', val: (m) => m.niveles || 1 },
                                { label: 'Entrega', val: (m) => m.esPreventa ? 'Pre-Venta' : 'Inmediata', highlight: true },
                            ].map((row, idx) => (
                                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-main)' }}>
                                    <td style={styles.stickyCol}>{row.label}</td>
                                    {propiedadesAComparar.map(item => (
                                        <td key={item.id} style={{
                                            ...styles.td,
                                            fontWeight: row.highlight ? 'bold' : 'normal',
                                            color: row.highlight ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            ...(row.style || {}) // Custom styles merging
                                        }}>
                                            {row.isLink ? (
                                                <button
                                                    onClick={() => row.onClick(item)}
                                                    style={styles.linkButton}
                                                >
                                                    {row.val(item)}
                                                </button>
                                            ) : (
                                                row.val(item)
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Fila de Acción (Popup) - Task 2 */}
                            <tr>
                                <td style={{ ...styles.stickyCol, borderBottom: 'none' }}></td>
                                {propiedadesAComparar.map(item => (
                                    <td key={item.id} style={{ padding: '20px', borderBottom: 'none' }}>
                                        <button
                                            onClick={(e) => openModelPopup(e, item)}
                                            style={styles.btnAction}
                                        >
                                            Ver Detalle <Icons.Eye />
                                        </button>
                                        {/* Fallback link to full page just in case */}
                                        <Link to={`/modelo/${item.id}`} style={styles.tinyLink}>
                                            Ir a página completa
                                        </Link>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* MODAL (Reusable for Table Context) */}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={modalType === 'model' ? 'Detalle del Modelo' : 'Detalle del Desarrollo'}
                >
                    {renderModalContent()}
                </Modal>

            </div>
        );
    }

    // --- RENDERIZADO: MODO GALERÍA (DEFAULT) ---


    const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

    const getImageForModel = (model) => {
        // Si la imagen es el fallback o no existe, intentamos usar la del desarrollo
        if (!model.imagen || model.imagen === FALLBACK_IMG) {
            const dev = getDesarrolloForModel(model);
            if (dev && dev.imagen && dev.imagen !== FALLBACK_IMG) {
                return dev.imagen;
            }
        }
        return model.imagen;
    };

    const getPriceDisplay = (price) => {
        if (!price || price === 0) return 'Pendiente';
        return formatCurrency(price);
    };

    // Helper local para consistencia si formatoMoneda cambia
    const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="main-content" style={styles.pageContainer}>
            <header style={styles.header}>
                <h1 style={styles.pageTitle}>Mis Favoritos ({favoritosHydrated.length})</h1>
                <p style={styles.subtitle}>Selecciona hasta 3 propiedades para enfrentarlas.</p>
            </header>

            {groupedFavorites.map(group => (
                <div key={group.id} style={styles.groupSection}>
                    <div style={styles.groupHeader}>
                        <h2 style={styles.groupTitle}>{group.name}</h2>
                        {group.desarrollo && (
                            <button
                                onClick={(e) => openDevelopmentPopup(e, group.id)}
                                style={styles.viewDevBtn}
                            >
                                Ver Desarrollo
                            </button>
                        )}
                    </div>

                    <div style={styles.grid}>
                        {group.items.map(item => {
                            const isSelected = selectedIds.includes(item.id);
                            const displayImage = getImageForModel(item);

                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        ...styles.card,
                                        borderColor: isSelected ? 'var(--primary-color)' : 'transparent',
                                        boxShadow: isSelected ? '0 0 0 3px rgba(0, 57, 106, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={() => handleSelect(item.id)}
                                >
                                    <div style={{
                                        ...styles.checkbox,
                                        backgroundColor: isSelected ? 'var(--primary-color)' : 'white',
                                        borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-subtle)'
                                    }}>
                                        {isSelected && <Icons.Check />}
                                    </div>

                                    <div style={styles.cardImgWrapper}>
                                        <ImageLoader src={displayImage} style={styles.cardImg} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                            style={styles.cardTrashBtn}
                                        >
                                            <Icons.Trash />
                                        </button>

                                        <button
                                            onClick={(e) => openModelPopup(e, item)}
                                            style={styles.cardPopupBtn}
                                        >
                                            <Icons.Eye />
                                        </button>
                                    </div>

                                    <div style={styles.cardBody}>
                                        <h3 style={styles.cardTitle}>{item.nombre_modelo}</h3>
                                        <div style={styles.cardPrice}>{getPriceDisplay(item.precioNumerico)}</div>
                                        <div style={styles.cardSpecs}>
                                            <span>{item.recamaras} Rec</span> • <span>{item.m2} m²</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* FLOATING ACTION BAR */}
            <div style={{
                ...styles.floatingBar,
                transform: selectedIds.length > 0 ? 'translateY(0)' : 'translateY(150%)'
            }}>
                <div style={styles.floatingContent}>
                    <span style={{ fontWeight: '600' }}>{selectedIds.length} seleccionadas</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setSelectedIds([])} style={styles.btnGhost}>Limpiar</button>
                        <button
                            onClick={() => setIsComparing(true)}
                            disabled={selectedIds.length < 2}
                            style={{
                                ...styles.btnCompare,
                                opacity: selectedIds.length < 2 ? 0.5 : 1,
                                cursor: selectedIds.length < 2 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Comparar ahora <Icons.Compare />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL (Reusable for Grid Context) */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalType === 'model' ? 'Detalle del Modelo' : 'Detalle del Desarrollo'}
            >
                {renderModalContent()}
            </Modal>

        </div>
    );
}

// --- ESTILOS CSS-IN-JS MEJORADOS ---
const styles = {
    pageContainer: { paddingBottom: '120px', fontFamily: "'Segoe UI', sans-serif", position: 'relative', zIndex: 2 },
    header: { marginBottom: '20px' },
    pageTitle: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 5px 0' },
    subtitle: { color: 'var(--text-secondary)', fontSize: '1rem' },

    // Group Sections
    groupSection: { marginBottom: '40px' },
    groupHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' },
    groupTitle: { fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 },
    viewDevBtn: { background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },

    // Estado Vacío
    emptyContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' },
    emptyIcon: { fontSize: '4rem', marginBottom: '20px' },

    // Grid de Tarjetas
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' },
    '@media (min-width: 768px)': {
        grid: { gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px' }
    },

    card: { backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease', border: '2px solid transparent' },
    checkbox: { position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px', borderRadius: '6px', border: '2px solid', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    cardImgWrapper: { height: '140px', position: 'relative', backgroundColor: 'var(--bg-main)' },
    cardImg: { width: '100%', height: '100%', objectFit: 'cover' },

    cardTrashBtn: { position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },

    cardPopupBtn: { position: 'absolute', bottom: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },

    cardBody: { padding: '12px' },
    cardTitle: { fontSize: '1rem', fontWeight: '700', margin: '0 0 2px 0', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    // cardDev eliminado porque ahora agrupamos
    cardPrice: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' },
    cardSpecs: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' },

    // Barra Flotante
    floatingBar: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--base-brand-blue)', borderRadius: '50px', padding: '12px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: 'white', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 100 },
    floatingContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnGhost: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' },
    btnCompare: { backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    btnPrimary: { backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 24px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginTop: '20px' },

    // Vista de Tabla (Comparativa)
    compareHeader: { marginBottom: '20px' },
    backLink: { background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px', padding: 0 },

    tableWrapper: { overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: 'var(--bg-secondary)' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '600px' },

    // Columnas Sticky (La primera columna se queda fija)
    stickyColHeader: { position: 'sticky', left: 0, backgroundColor: 'var(--bg-main)', zIndex: 20, padding: '15px', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', width: '120px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' },
    stickyCol: { position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 10, padding: '15px', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem', borderRight: '1px solid var(--border-subtle)' },

    thModel: { padding: '15px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', minWidth: '180px', verticalAlign: 'top' },
    thContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    thImgWrapper: { width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', position: 'relative' },
    thImg: { width: '100%', height: '100%', objectFit: 'cover' },
    removeBtnTable: { position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    thTitle: { fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.2' },
    thPrice: { color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem', marginTop: '4px' },

    td: { padding: '15px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.95rem' },
    btnAction: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', backgroundColor: 'var(--base-brand-blue)', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', border: 'none', cursor: 'pointer' },
    linkButton: { background: 'none', border: 'none', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600', fontSize: 'inherit' },
    tinyLink: { display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textDecoration: 'none' }
};
