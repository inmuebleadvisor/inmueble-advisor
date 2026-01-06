import React, { useMemo } from 'react';
import { IMAGES } from '../../config/constants';
import Carousel from './Carousel';
import CaracteristicasBox from '../common/CaracteristicasBox';
import AmenidadesList from './AmenidadesList';
import FinanciamientoWidget from './FinanciamientoWidget';
import DevelopmentInfoSection from './DevelopmentInfoSection';
import PropertyCard from './PropertyCard';
import FavoriteBtn from '../common/FavoriteBtn';
import StickyActionPanel from '../layout/StickyActionPanel';
import Delightbox from '../common/Delightbox';
import { useStickyPanel } from '../../hooks/useStickyPanel';
import '../../styles/ModelDetailsContent.css'; // BEM Styles relocated
// import Modal from '../modals/Modal'; // Generic Modal
import LeadCaptureForm from '../leads/LeadCaptureForm'; // New Capture Form

// Icons defined locally since they are small UI helpers
const Icons = {
    Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
    Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
};

const formatoMoneda = (val) => {
    if (!val || isNaN(val)) return 'Precio Pendiente';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function ModelDetailsContent({
    modelo,
    desarrollo,
    modelosHermanos = [],
    onBack,
    isModal = false
}) {
    // State for floor plans lightbox
    const [isFloorPlanOpen, setIsFloorPlanOpen] = React.useState(false);
    const [floorPlanIndex, setFloorPlanIndex] = React.useState(0);

    // Lead Form Modal State
    const [isLeadFormOpen, setIsLeadFormOpen] = React.useState(false);

    const headerRef = React.useRef(null);
    const showFab = useStickyPanel(headerRef);

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
        <div className={`model-details ${isModal ? 'model-details--modal' : ''}`}>

            {/* --- HEADER --- */}
            <header ref={headerRef} className="model-details__header">
                <Carousel items={galeriaImagenes} />

                {!isModal && onBack && (
                    <button onClick={onBack} className="model-details__back-btn" aria-label="Volver">
                        <Icons.Back />
                    </button>
                )}

                <span className="model-details__status-badge" style={{ backgroundColor: modelo.esPreventa ? '#f59e0b' : '#10b981' }}>
                    {modelo.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
                </span>
                <div className="model-details__header-gradient"></div>
            </header>

            <main className="model-details__content">

                {/* --- SECCIÓN 1: DATOS --- */}
                <section className="model-details__section">
                    <div className="model-details__title-card">
                        <div className="model-details__title-left">
                            <h1 className="model-details__name">
                                {modelo.tipoVivienda ? `${modelo.tipoVivienda} ` : ''}
                                {modelo.nombre_modelo}
                            </h1>
                            <div className="model-details__price-box">
                                <span className="model-details__price-label">Precio de Lista</span>
                                <span className="model-details__price-val">{formatoMoneda(modelo.precioNumerico)}</span>
                                {modelo.precios?.mantenimientoMensual > 0 && (
                                    <span className="model-details__price-maintenance">+ {formatoMoneda(modelo.precios.mantenimientoMensual)} mant. mensual</span>
                                )}

                                {modelo.highlights && modelo.highlights.length > 0 && (
                                    <div className="model-details__highlights">
                                        {modelo.highlights.map((highlight, index) => (
                                            <div key={index} className="model-details__highlight-item">
                                                <div className="model-details__check-icon">
                                                    <Icons.Check />
                                                </div>
                                                <span className="model-details__highlight-text">{highlight}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                className="model-details__cta-primary"
                                onClick={() => setIsLeadFormOpen(true)}
                            >
                                <Icons.Calendar />
                                <span>Cotizar / Agendar</span>
                            </button>
                        </div>

                        <div className="model-details__fav-wrapper">
                            <FavoriteBtn modeloId={modelo.id} className="model-details__fav-btn-override" />
                        </div>
                    </div>

                    <CaracteristicasBox
                        recamaras={modelo.recamaras}
                        banos={modelo.banos}
                        m2={modelo.m2}
                        niveles={modelo.niveles}
                        terreno={modelo.terreno}
                    />

                    <hr className="model-details__divider" />

                    <h3 className="model-details__section-title">Descripción del Modelo</h3>
                    <p className="model-details__description">
                        {modelo.descripcion || `Conoce el modelo ${modelo.nombre_modelo}, diseñado para tu comodidad.`}
                    </p>
                    {modelo.amenidades && modelo.amenidades.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 className="model-details__amenities-title">Amenidades Exclusivas:</h4>
                            <AmenidadesList amenidades={modelo.amenidades} />
                        </div>
                    )}
                </section>

                {/* --- SECCIÓN 1.5: PLANOS --- */}
                {modelo.plantas && modelo.plantas.length > 0 && (
                    <section className="model-details__section">
                        <h3 className="model-details__section-title">Distribución y Planos</h3>
                        <p className="model-details__description" style={{ marginBottom: '20px' }}>
                            Consulta la distribución arquitectónica de {modelo.nombre_modelo}.
                        </p>

                        <div className="model-details__floor-plans-grid">
                            {modelo.plantas.map((url, index) => (
                                <button
                                    key={index}
                                    className="model-details__floor-plan-card"
                                    onClick={() => {
                                        setFloorPlanIndex(index);
                                        setIsFloorPlanOpen(true);
                                    }}
                                >
                                    <div className="model-details__floor-plan-wrapper">
                                        <img
                                            src={url}
                                            alt={`Planta ${index + 1}`}
                                            className="model-details__floor-plan-img"
                                            loading="lazy"
                                        />
                                        <div className="model-details__magnify-overlay">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                        </div>
                                    </div>
                                    <span className="model-details__floor-plan-label">Planta {index + 1}</span>
                                </button>
                            ))}
                        </div>

                        <Delightbox
                            isOpen={isFloorPlanOpen}
                            images={modelo.plantas}
                            initialIndex={floorPlanIndex}
                            onClose={() => setIsFloorPlanOpen(false)}
                        />
                    </section>
                )}

                {/* --- SECCIÓN 2: FINANCIAMIENTO --- */}
                <section className="model-details__section model-details__section--border-top">
                    <h3 className="model-details__section-title">Calcula tu Hipoteca</h3>
                    <p className="model-details__mortgage-intro">
                        Estimación de mensualidad para <strong>{modelo.nombre_modelo}</strong>:
                    </p>
                    <FinanciamientoWidget precio={modelo.precioNumerico} />
                </section>

                {/* --- SECCIÓN 3: CONTEXTO --- */}
                {desarrollo && (
                    <section className="model-details__section model-details__section--border-top">
                        <div className="model-details__context-header">
                            <span className="model-details__context-label">Ubicado en el desarrollo:</span>
                            <h2 className="model-details__context-title">{desarrollo.nombre}</h2>
                        </div>
                        <DevelopmentInfoSection desarrollo={desarrollo} />
                    </section>
                )}

                {/* --- SECCIÓN 4: CROSS-SELLING --- */}
                {modelosHermanos.length > 0 && (
                    <section className="model-details__models-section">
                        <h3 className="model-details__section-title">Otras opciones en {desarrollo ? desarrollo.nombre : 'este desarrollo'}</h3>
                        <div className="model-details__models-grid">
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

            {/* FLOATING ACTION BUTTON (Sticky Bottom) - Shows only after scroll */}
            {showFab && (
                <StickyActionPanel
                    price={formatoMoneda(modelo.precioNumerico)}
                    label="Precio de Lista"
                    onMainAction={() => setIsLeadFormOpen(true)}
                />
            )}

            {/* --- LEAD CAPTURE MODAL - Unboxed --- */}
            {isLeadFormOpen && (
                <LeadCaptureForm
                    desarrollo={desarrollo}
                    modelo={modelo}
                    onCancel={() => setIsLeadFormOpen(false)}
                    onSuccess={() => {
                        setIsLeadFormOpen(false);
                        // Confetti handles feedback
                    }}
                />
            )}
        </div >
    );
}


