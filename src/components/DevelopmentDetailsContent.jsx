import React, { useState, useRef, useMemo } from 'react';
import ImageLoader from './ImageLoader';
import PropertyCard from './PropertyCard';
import DevelopmentInfoSection from './DevelopmentInfoSection';
import { useNavigate } from 'react-router-dom';
import Delightbox from './common/Delightbox'; // Import Delightbox
import { IMAGES } from '../config/constants';

// Icons
const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
    MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
};

export default function DevelopmentDetailsContent({
    desarrollo,
    onBack,
    isModal = false
}) {
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showDelightbox, setShowDelightbox] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);

    // GALERÍA HEADER
    const galeriaImagenes = useMemo(() => {
        if (!desarrollo || !desarrollo.multimedia) return [];
        // La lógica de unificación ya está en el servicio (catalog.service.js), 
        // desarrollo.multimedia.galeria ya debería traer todo unificado.
        return desarrollo.multimedia.galeria || [];
    }, [desarrollo]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
            setActiveIndex(index);
        }
    };

    if (!desarrollo) return null;

    const modelos = desarrollo.modelos || [];
    const direccionCompleta = [
        desarrollo.ubicacion?.calle,
        desarrollo.ubicacion?.colonia,
        desarrollo.ubicacion?.ciudad
    ].filter(Boolean).join(', ');

    return (
        <div className="animate-fade-in" style={isModal ? styles.modalContainer : styles.pageContainer}>

            {/* HEADER: Carrusel Principal */}
            <header style={styles.carouselWrapper}>
                <div
                    ref={scrollRef}
                    style={styles.carouselContainer}
                    className="hide-scrollbar"
                    onScroll={handleScroll}
                >
                    {galeriaImagenes.map((img, idx) => (
                        <div
                            key={idx}
                            style={{ ...styles.carouselSlide, cursor: 'zoom-in' }}
                            onClick={() => {
                                setShowDelightbox(true);
                                setInitialImageIndex(idx);
                            }}
                        >
                            <ImageLoader
                                src={img}
                                alt={`${desarrollo.nombre} - vista ${idx}`}
                                style={styles.headerImage}
                            />
                        </div>
                    ))}
                </div>

                {/* DELIGHTBOX INTEGRATION */}
                {showDelightbox && (
                    <Delightbox
                        isOpen={showDelightbox}
                        images={galeriaImagenes}
                        initialIndex={initialImageIndex}
                        onClose={() => setShowDelightbox(false)}
                    />
                )}

                {!isModal && onBack && (
                    <button onClick={onBack} style={styles.floatingBackButton} aria-label="Volver">
                        <Icons.Back />
                    </button>
                )}

                <div style={styles.statusBadgeOverlay}>
                    {desarrollo.status || 'En Venta'}
                </div>

                {galeriaImagenes.length > 1 && (
                    <div style={styles.imageCounter}>
                        {activeIndex + 1} / {galeriaImagenes.length}
                    </div>
                )}

                <div style={styles.headerGradient}></div>
            </header>

            <main style={styles.contentBody}>

                {/* TÍTULO Y UBICACIÓN RÁPIDA */}
                <div style={styles.titleSection}>
                    <h1 style={styles.devTitle}>{desarrollo.nombre}</h1>
                    <div style={styles.locationRow}>
                        <Icons.MapPin />
                        <span>
                            {desarrollo.ubicacion?.colonia
                                ? desarrollo.ubicacion.colonia
                                : (desarrollo.zona
                                    ? `Zona: ${desarrollo.zona}`
                                    : "Ubicación pendiente")}
                        </span>
                    </div>
                    <p style={styles.addressText}>{direccionCompleta}</p>
                </div>

                <hr style={styles.divider} />

                {/* SECCIÓN DE INFORMACIÓN TÉCNICA */}
                <DevelopmentInfoSection desarrollo={desarrollo} />

                {/* LISTA DE MODELOS DISPONIBLES */}
                <section style={styles.modelsSection}>
                    <div style={styles.sectionHeaderRow}>
                        <h3 style={styles.sectionTitle}>Modelos Disponibles</h3>
                        <span style={styles.modelCountBadge}>{modelos.length}</span>
                    </div>

                    <div style={styles.modelsGrid}>
                        {modelos.map((modelo) => (
                            <PropertyCard
                                key={modelo.id}
                                item={modelo}
                                showDevName={false}
                            />
                        ))}
                    </div>

                    {modelos.length === 0 && (
                        <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                            Próximamente modelos disponibles.
                        </p>
                    )}
                </section>

            </main>
        </div>
    );
}

// --- ESTILOS ---
const styles = {
    pageContainer: { backgroundColor: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '40px', fontFamily: "'Outfit', sans-serif" },
    modalContainer: { backgroundColor: 'var(--bg-main)', minHeight: 'auto', paddingBottom: '40px', fontFamily: "'Outfit', sans-serif" },
    carouselWrapper: { position: 'relative', width: '100%', height: '320px', backgroundColor: 'var(--bg-tertiary)' }, // Taller header
    carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%', scrollBehavior: 'smooth' },
    carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
    headerImage: { width: '100%', height: '100%', objectFit: 'cover' },

    // Buttons & Badges
    floatingBackButton: { position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10, color: 'white', backdropFilter: 'blur(4px)' },
    statusBadgeOverlay: { position: 'absolute', bottom: '20px', right: '20px', backgroundColor: 'var(--primary-color)', color: 'var(--text-inverse)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' },
    imageCounter: { position: 'absolute', bottom: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10 },

    // Gradients
    headerGradient: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '120px', background: 'linear-gradient(to top, var(--bg-main), rgba(15, 23, 42, 0))', pointerEvents: 'none' },

    // Content
    contentBody: { padding: '0 24px', position: 'relative', zIndex: 2, marginTop: '-40px' },
    titleSection: { marginBottom: '20px' },
    devTitle: { fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: '1.1' },
    locationRow: { display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: '600', fontSize: '1.1rem', marginBottom: '8px' },
    locationIcon: { color: 'var(--primary-color)' }, // Helper if needed
    addressText: { color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' },

    divider: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '30px 0' },

    // Models Section
    modelsSection: { backgroundColor: 'var(--bg-secondary)', margin: '30px -24px 0', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' },
    sectionHeaderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
    sectionTitle: { fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' },
    modelCountBadge: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.05)' },
    modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
};
