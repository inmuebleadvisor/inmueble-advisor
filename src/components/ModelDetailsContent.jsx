import React, { useMemo } from 'react';
import { IMAGES } from '../config/constants';
import Carousel from './Carousel';
import CaracteristicasBox from './CaracteristicasBox';
import AmenidadesList from './AmenidadesList';
import FinanciamientoWidget from './FinanciamientoWidget';
import DevelopmentInfoSection from './DevelopmentInfoSection';
import PropertyCard from './PropertyCard';
import FavoriteBtn from './FavoriteBtn';

// Icons defined locally since they are small
const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
    Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const formatoMoneda = (val) => {
    if (!val || isNaN(val)) return 'Precio Pendiente';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function ModelDetailsContent({
    modelo,
    desarrollo,
    modelosHermanos = [],
    onBack, // Optional: if provided, shows back button (e.g., for full screen). If in modal, might not need it or handled differently.
    isModal = false // To adjust styles for modal view
}) {
    const galeriaImagenes = useMemo(() => {
        if (!modelo) return [];
        const items = (modelo.imagenes || []).map(url => ({ url, type: 'image' }));
        if (modelo.media?.video || modelo.media?.videoPromocional || modelo.video) {
            const vid = modelo.media?.video || modelo.media?.videoPromocional || modelo.video;
            items.unshift({ url: vid, type: 'video' });
        }
        if (items.length === 0) {
            items.push({ url: IMAGES.FALLBACK_PROPERTY, type: 'image' });
        }
        return items;
    }, [modelo]);

    if (!modelo) return null;

    return (
        <div style={isModal ? styles.modalContainer : styles.pageContainer}>

            {/* --- HEADER: CARRUSEL --- */}
            <header style={styles.carouselWrapper}>
                <Carousel items={galeriaImagenes} />

                {/* Only show floating back button if handler provided and NOT in modal (modals usually have their own close) */}
                {!isModal && onBack && (
                    <button onClick={onBack} style={styles.floatingBackButton} aria-label="Volver">
                        <Icons.Back />
                    </button>
                )}

                <span style={{ ...styles.statusBadge, backgroundColor: modelo.esPreventa ? '#f59e0b' : '#10b981' }}>
                    {modelo.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
                </span>
                <div style={styles.headerGradient}></div>
            </header>

            <main style={styles.contentBody}>

                {/* ================================================================== */}
                {/* SECCIÓN 1: DATOS DEL MODELO (Lo que estás comprando)               */}
                {/* ================================================================== */}
                <section style={styles.sectionBlock}>
                    <div style={styles.titleSectionContainer}>
                        <div style={styles.titleSectionLeft}>
                            <h1 style={styles.modelTitle}>
                                {modelo.tipoVivienda ? `${modelo.tipoVivienda} ` : ''}
                                {modelo.nombre_modelo}
                            </h1>
                            <div style={styles.priceContainer}>
                                <span style={styles.priceLabel}>Precio de Lista</span>
                                <span style={styles.priceValue}>{formatoMoneda(modelo.precioNumerico)}</span>
                                {modelo.precios?.mantenimientoMensual > 0 && (
                                    <span style={styles.maintenanceLabel}>+ {formatoMoneda(modelo.precios.mantenimientoMensual)} mant. mensual</span>
                                )}

                                {/* ⭐ HIGHLIGHTS INLINE ⭐ */}
                                {modelo.highlights && modelo.highlights.length > 0 && (
                                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {modelo.highlights.map((highlight, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '20px', height: '20px', borderRadius: '50%',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--primary-color)'
                                                }}>
                                                    <Icons.Check />
                                                </div>
                                                <span style={{ fontWeight: '500' }}>{highlight}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={styles.favoriteWrapper}>
                            <FavoriteBtn modeloId={modelo.id} style={styles.favoriteButtonOverride} />
                        </div>
                    </div>

                    <CaracteristicasBox
                        recamaras={modelo.recamaras}
                        banos={modelo.banos}
                        m2={modelo.m2}
                        niveles={modelo.niveles}
                        terreno={modelo.terreno}
                    />

                    <hr style={styles.divider} />

                    <h3 style={styles.sectionTitle}>Descripción del Modelo</h3>
                    <p style={styles.descriptionText}>
                        {modelo.descripcion || `Conoce el modelo ${modelo.nombre_modelo}, diseñado para tu comodidad.`}
                    </p>
                    {modelo.amenidades && modelo.amenidades.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '10px' }}>Amenidades Exclusivas:</h4>
                            <AmenidadesList amenidades={modelo.amenidades} />
                        </div>
                    )}
                </section>

                {/* ================================================================== */}
                {/* SECCIÓN 2: FINANCIAMIENTO                                          */}
                {/* ================================================================== */}
                <section style={{ ...styles.sectionBlock, marginTop: '40px' }}>
                    <h3 style={styles.sectionTitle}>Calcula tu Hipoteca</h3>
                    <p style={{ marginBottom: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                        Estimación de mensualidad para <strong>{modelo.nombre_modelo}</strong>:
                    </p>
                    <FinanciamientoWidget precio={modelo.precioNumerico} />
                </section>

                {/* ================================================================== */}
                {/* SECCIÓN 3: CONTEXTO DEL DESARROLLO (El Entorno)                    */}
                {/* ================================================================== */}
                {desarrollo && (
                    <section style={{ ...styles.sectionBlock, marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '30px' }}>
                        <div style={styles.contextHeader}>
                            <span style={styles.contextLabel}>Ubicado en el desarrollo:</span>
                            <h2 style={styles.contextTitle}>{desarrollo.nombre}</h2>
                        </div>
                        <DevelopmentInfoSection desarrollo={desarrollo} />
                    </section>
                )}

                {/* ================================================================== */}
                {/* SECCIÓN 4: CROSS-SELLING (Otros modelos)                           */}
                {/* ================================================================== */}
                {/* We hide cross-selling in modal to avoid navigation confusion or recursive modals for now, unless requested. 
            User said "popup... to remember details", usually just the item itself. 
            But letting user navigate inside modal is cool. I'll leave it but maybe simpler?
            For now, keep it. */}
                {modelosHermanos.length > 0 && (
                    <section style={styles.modelsSection}>
                        <h3 style={styles.sectionTitle}>Otras opciones en {desarrollo ? desarrollo.nombre : 'este desarrollo'}</h3>
                        <div style={styles.modelsGrid}>
                            {modelosHermanos.map((hermano) => (
                                <PropertyCard
                                    key={hermano.id}
                                    item={hermano}
                                    showDevName={false}
                                />
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}

// Estilos
// Estilos
const styles = {
    pageContainer: { backgroundColor: 'var(--bg-main)', minHeight: '100%', paddingBottom: '60px', fontFamily: "'Outfit', sans-serif" },
    modalContainer: { backgroundColor: 'var(--bg-main)', minHeight: 'auto', paddingBottom: '40px', fontFamily: "'Outfit', sans-serif" },
    carouselWrapper: { position: 'relative', width: '100%', height: '350px', backgroundColor: 'var(--bg-tertiary)' }, // Taller header
    headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '120px', background: 'linear-gradient(to top, var(--bg-main), rgba(15, 23, 42, 0))', pointerEvents: 'none', zIndex: 5 },

    floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10, color: 'white', backdropFilter: 'blur(4px)' },
    statusBadge: { position: 'absolute', top: '20px', right: '20px', color: 'var(--text-inverse)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' },

    contentBody: { padding: '0 24px', position: 'relative', zIndex: 6, marginTop: '-30px' },
    sectionBlock: { marginBottom: '30px', display: 'block' },

    // Glassmorphic title container
    titleSectionContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', backgroundColor: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' },
    titleSectionLeft: { flex: 1 },
    modelTitle: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: '1.2' },

    priceContainer: { display: 'flex', flexDirection: 'column' },
    priceLabel: { fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' },
    priceValue: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-color)' },
    maintenanceLabel: { fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' },

    highlightsButton: { marginTop: '12px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--primary-color)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', maxWidth: 'fit-content', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s', color: 'var(--primary-color)' },

    favoriteWrapper: { flexShrink: 0, marginLeft: '15px', marginTop: '5px' },
    favoriteButtonOverride: { backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' },

    divider: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '30px 0' },
    sectionTitle: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '15px', color: 'var(--text-main)' },
    descriptionText: { color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1rem' },

    contextHeader: { marginBottom: '20px', paddingLeft: '15px', borderLeft: '4px solid var(--primary-color)' },
    contextLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' },
    contextTitle: { fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 },

    modelsSection: { backgroundColor: 'var(--bg-secondary)', margin: '40px -24px 0', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' },
    modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }
};
