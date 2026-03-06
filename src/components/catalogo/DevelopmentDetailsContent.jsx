import React, { useState, useRef, useMemo } from 'react';
import ImageLoader from '../common/ImageLoader';
import PropertyCard from './PropertyCard';
import DevelopmentInfoSection from './DevelopmentInfoSection';
import StickyActionPanel from '../layout/StickyActionPanel';
import Delightbox from '../common/Delightbox';
import FavoriteBtn from '../common/FavoriteBtn';
import { useStickyPanel } from '../../hooks/useStickyPanel';
import { useService } from '../../hooks/useService';
import '../../styles/components/DevelopmentDetails.css';
// import Modal from '../shared/Modal'; // Removed: LeadCaptureForm is now self-contained
import LeadCaptureForm from '../leads/LeadCaptureForm';
import MortgageSimulatorModal from '../modals/MortgageSimulatorModal';
import { getFunctions, httpsCallable } from 'firebase/functions'; // CAPI: PageView/Contact Intent
import { useUser } from '../../context/UserContext'; // ✅ Import User Context

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
    const headerRef = useRef(null);

    const [showDelightbox, setShowDelightbox] = useState(false);
    const [initialImageIndex, setInitialImageIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0); // Fixed missing state
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false); // New state for modal
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false); // State para Simulador

    // 🟢 Didáctico: Gatillo de autenticación para desarrollos
    const handleOpenLeadForm = async () => {
        if (!user) {
            try {
                const logueado = await loginWithGoogle();
                if (!logueado) return;
            } catch (error) {
                console.error("Login fallido");
                return;
            }
        }
        setIsLeadFormOpen(true);
    };

    // 1. Control de visibilidad del ActionPanel usando Custom Hook
    const showActionPanel = useStickyPanel(headerRef);
    const { meta: metaService } = useService();
    const { user, userProfile, loginWithGoogle } = useUser(); // ✅ Get User Context

    // Meta Pixel & CAPI: PageView -> MOVED TO MetaTracker (Global)
    // Legacy Code Removed


    // Meta Pixel & CAPI: Contact (Track when form opens)
    // REMOVED: User requested Contact to fire ONLY on WhatsApp clicks.
    // Legacy Code Removed

    const galeriaImagenes = useMemo(() => {
        if (!desarrollo || !desarrollo.multimedia) return [];
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

    // Formatear precio para el ActionPanel
    const precioDesde = modelos.length > 0
        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Math.min(...modelos.map(m => m.precioNumerico || 0)))
        : null;

    return (
        <div className={`dev-details ${isModal ? 'dev-details--modal' : ''}`}>

            {/* HEADER: Carrusel Principal */}
            <header ref={headerRef} className="dev-details__header">
                <div
                    ref={scrollRef}
                    style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%', scrollBehavior: 'smooth' }}
                    className="hide-scrollbar"
                    onScroll={handleScroll}
                >
                    {galeriaImagenes.map((img, idx) => (
                        <div
                            key={idx}
                            style={{ minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative', cursor: 'zoom-in' }}
                            onClick={() => {
                                setShowDelightbox(true);
                                setInitialImageIndex(idx);
                            }}
                        >
                            <ImageLoader
                                src={img}
                                alt={`${desarrollo.nombre} - vista ${idx}`}
                                className="dev-details__header-image"
                            />
                        </div>
                    ))}
                </div>

                {showDelightbox && (
                    <Delightbox
                        isOpen={showDelightbox}
                        images={galeriaImagenes}
                        initialIndex={initialImageIndex}
                        onClose={() => setShowDelightbox(false)}
                    />
                )}

                {!isModal && onBack && (
                    <button onClick={onBack} className="dev-details__back-btn" aria-label="Volver">
                        <Icons.Back />
                    </button>
                )}

                <div
                    style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
                    className="animate-fade-in"
                >
                    <FavoriteBtn modeloId={desarrollo.id} />
                </div>

                <div style={{ position: 'absolute', bottom: '30px', right: '24px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                    <div className="dev-details__status-badge" style={{ position: 'relative', bottom: 'auto', right: 'auto', boxShadow: 'none' }}>
                        {desarrollo.status || 'En Venta'}
                    </div>
                    <button
                        onClick={() => setIsSimulatorOpen(true)}
                        style={{ backgroundColor: '#0f172a', color: 'white', padding: '8px 18px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', textTransform: 'uppercase', transition: 'transform 0.2s, background-color 0.2s', letterSpacing: '0.5px' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#0f172a'; }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>
                        Simulador
                    </button>
                </div>

                <div className="dev-details__header-gradient"></div>
            </header>

            <main className="dev-details__content">

                {/* TÍTULO Y UBICACIÓN RÁPIDA */}
                <div className="dev-details__title-section animate-fade-in-up">
                    <h1 className="dev-details__title">{desarrollo.nombre}</h1>
                    <div className="dev-details__location-row">
                        <Icons.MapPin />
                        <span>
                            {desarrollo.ubicacion?.colonia || desarrollo.zona || "Ubicación pendiente"}
                        </span>
                    </div>
                    <p className="dev-details__address">{direccionCompleta}</p>
                </div>

                <hr className="dev-details__divider" />

                {/* SECCIÓN DE INFORMACIÓN TÉCNICA */}
                <DevelopmentInfoSection desarrollo={desarrollo} />

                {/* LISTA DE MODELOS DISPONIBLES */}
                <section style={{ backgroundColor: 'var(--bg-secondary)', margin: '40px -24px 0', padding: '40px 24px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Modelos Disponibles</h3>
                        <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800' }}>
                            {modelos.length}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {modelos.map((modelo) => (
                            <PropertyCard
                                key={modelo.id}
                                item={modelo}
                                showDevName={false}
                            />
                        ))}
                    </div>

                    {modelos.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '30px' }}>
                            Próximamente modelos disponibles.
                        </p>
                    )}
                </section>
            </main>

            {/* STICKY ACTION PANEL */}
            {showActionPanel && (
                <StickyActionPanel
                    price={precioDesde}
                    label="Precios desde"
                    onMainAction={handleOpenLeadForm}
                />
            )}

            {/* LEAD CAPTURE MODAL - Unboxed for full control */}
            {isLeadFormOpen && (
                <LeadCaptureForm
                    desarrollo={desarrollo}
                    modelo={null}
                    onCancel={() => setIsLeadFormOpen(false)}
                    onSuccess={() => {
                        setIsLeadFormOpen(false);
                        // Optional: trigger a success toast or lightweight feedback if needed, 
                        // though confetti handles the main "reward".
                    }}
                />
            )}

            {/* MORTGAGE SIMULATOR MODAL */}
            {isSimulatorOpen && (
                <MortgageSimulatorModal
                    initialPrice={precioDesde ? Number(precioDesde.replace(/[^0-9.-]+/g, "")) : 1000000}
                    propertyData={{
                        title: desarrollo.nombre || 'Desarrollo',
                        subtitle: desarrollo.ciudad || '',
                        image: desarrollo.imagenPrincipal || desarrollo.imagenes?.[0] || ''
                    }}
                    onClose={() => setIsSimulatorOpen(false)}
                />
            )}
        </div>
    );
}
