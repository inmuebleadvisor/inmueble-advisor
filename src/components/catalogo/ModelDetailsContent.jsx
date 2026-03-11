import React from 'react';
import { useMemo } from 'react';

// ── Subcomponentes (SRP) ────────────────────────────────────────────────────
import ModelHeader      from './model-details/ModelHeader';
// El PricingCard ahora funge como el contenido principal del Sidebar en Desktop
import ModelPricingCard from './model-details/ModelPricingCard';
import ModelHeaderInfo  from './model-details/ModelHeaderInfo';
import ModelDescription from './model-details/ModelDescription';
import ModelFloorPlans  from './model-details/ModelFloorPlans';

// ── Componentes compartidos ─────────────────────────────────────────────────
import FinanciamientoWidget    from './FinanciamientoWidget';
import DevelopmentInfoSection  from './DevelopmentInfoSection';
import PropertyCard            from './PropertyCard';
import StickyActionPanel       from '../layout/StickyActionPanel'; // Fixed bottom bar en móvil
import LeadCaptureForm         from '../leads/LeadCaptureForm';
import MortgageSimulatorModal  from '../modals/MortgageSimulatorModal';

// ── Hooks / Contexto ─────────────────────────────────────────────────────────
import { useUser }        from '../../context/UserContext';
import { useStickyPanel } from '../../hooks/useStickyPanel';

// ── Servicio de presentación (Inyección de Dependencias) ────────────────────
import { modelPresentationService } from '../../services/service.provider';

// ── Estilos del orquestador ─────────────────────────────────────────────────
import '../../styles/ModelDetailsContent.css';

/**
 * @component ModelDetailsContent
 * @description Componente Orquestador del detalle de un modelo (Layout Marketplace)
 */
export default function ModelDetailsContent({
    modelo,
    desarrollo,
    modelosHermanos = [],
    onBack,
    isModal = false
}) {
    // ── Estado de UI (modales) ──────────────────────────────────────────────
    const [isLeadFormOpen,  setIsLeadFormOpen]  = React.useState(false);
    const [isSimulatorOpen, setIsSimulatorOpen] = React.useState(false);

    // ── Contexto de usuario (para el trigger de autenticación) ─────────────
    const { user, loginWithGoogle } = useUser();

    // ── Ref para detectar cuándo mostrar la Fixed Bottom Bar en móvil ───────
    // Observamos el H1 (o inicio del main) para saber cuándo el usuario ya hizo algo de scroll
    const titleRef = React.useRef(null);
    const showFixedBar = useStickyPanel(titleRef);

    // ── Datos derivados via Servicio (sin lógica en el componente) ──────────
    const galeriaItems       = useMemo(() => modelPresentationService.getGaleriaImagenes(modelo), [modelo]);
    const precioFormateado   = useMemo(() => modelPresentationService.formatoMoneda(modelo?.precioNumerico), [modelo]);
    const mantenimientoFmt   = useMemo(() => {
        const val = modelo?.precios?.mantenimientoMensual;
        return val > 0 ? modelPresentationService.formatoMoneda(val) : null;
    }, [modelo]);
    const simulatorPayload   = useMemo(() => modelPresentationService.buildSimulatorPayload(modelo, desarrollo), [modelo, desarrollo]);

    // ── Trigger de autenticación ────────────────────────────────────────────
    const handleOpenLeadForm = async () => {
        if (!user) {
            try {
                const logueado = await loginWithGoogle();
                if (!logueado) return;
            } catch {
                console.error('[ModelDetails] Login cancelado o fallido');
                return;
            }
        }
        setIsLeadFormOpen(true);
    };

    if (!modelo) return null;

    return (
        <article className={`model-details ${isModal ? 'model-details--modal' : ''}`}>
            
            <main className="model-details__content">
                
                {/* ── BREADCRUMBS (Estilo Marketplace) ── */}
                {!isModal && (
                    <nav className="model-details__breadcrumbs" aria-label="Ruta de navegación">
                        <a href="/" className="model-details__breadcrumb-link">Inicio</a>
                        <span>/</span>
                        {desarrollo && (
                            <>
                                <a href={`/desarrollo/${desarrollo.slug || desarrollo.id}`} className="model-details__breadcrumb-link">
                                    {desarrollo.nombre}
                                </a>
                                <span>/</span>
                            </>
                        )}
                        <span className="model-details__breadcrumb-current" ref={titleRef}>
                            {modelo.nombre_modelo}
                        </span>
                    </nav>
                )}

                {/* ── GRID PRINCIPAL MARKETPLACE (1 col móvil / 3 cols desktop) ── */}
                <div className="model-details__layout-wrapper">
                    
                    {/* ── COLUMNA IZQUIERDA: Main Content (lg:col-span-2) ── */}
                    <div className="model-details__main-column">
                        
                        {/* 1. Galería Contenida (Aspect Video) */}
                        <section className="model-details__section">
                            <ModelHeader
                                galeriaItems={galeriaItems}
                                esPreventa={modelo.esPreventa}
                                isModal={isModal}
                                onBack={onBack}
                            />
                        </section>

                        {/* 2. Título General y Características (Grid 4 cards) */}
                        <section className="model-details__section">
                             <ModelHeaderInfo modelo={modelo} desarrollo={desarrollo} />
                             
                             {/* Pricing para Mobile Únicamente (el aside centraliza Desktop) */}
                             <div className="model-details__mobile-pricing">
                                <ModelPricingCard
                                    precioFormateado={precioFormateado}
                                    mantenimientoFormateado={mantenimientoFmt}
                                    onSchedule={handleOpenLeadForm}
                                />
                                <div style={{ marginTop: '24px' }}>
                                    <FinanciamientoWidget
                                        precio={modelo.precioNumerico}
                                        onSimulate={() => setIsSimulatorOpen(true)}
                                    />
                                </div>
                             </div>
                        </section>

                        {/* 3. Detalles de Propiedad */}
                        <section className="model-details__section model-details__section--bordered">
                            <ModelDescription modelo={modelo} />
                        </section>

                        {/* 4. Planos (condicional) */}
                        {modelo.plantas?.length > 0 && (
                            <section className="model-details__section model-details__section--bordered">
                                <ModelFloorPlans
                                    plantas={modelo.plantas}
                                    nombreModelo={modelo.nombre_modelo}
                                />
                            </section>
                        )}

                        {/* 5. Desarrollo Info Contextual */}
                        {desarrollo && (
                            <section className="model-details__section model-details__section--bordered">
                                <h2 className="model-details__section-title">Ubicación y Desarrollo</h2>
                                <DevelopmentInfoSection desarrollo={desarrollo} />
                            </section>
                        )}
                    </div>

                    {/* ── COLUMNA DERECHA: ASIDE (Sticky Sidebar en Desktop) ── */}
                    <aside className="model-details__sidebar-column">
                        <div className="model-details__sticky-wrapper">
                            
                            {/* Tarjeta Principal de Conversión */}
                            <ModelPricingCard
                                precioFormateado={precioFormateado}
                                mantenimientoFormateado={mantenimientoFmt}
                                onSchedule={handleOpenLeadForm}
                                isDesktopSidebar={true}
                            />

                            {/* Widget Calculadora Rápida */}
                            <div className="model-details__widget-wrapper">
                                <FinanciamientoWidget
                                    precio={modelo.precioNumerico}
                                    onSimulate={() => setIsSimulatorOpen(true)}
                                />
                            </div>

                        </div>
                    </aside>

                </div> {/* Fin CSS Grid LayoutWrapper */}

                {/* ── CROSS SELL (Row Completo debajo del Grid) ── */}
                {modelosHermanos.length > 0 && (
                    <section className="model-details__cross-sell">
                        <h2 className="model-details__section-title">
                            Otras opciones disponibles
                        </h2>
                        <div className="model-details__cross-sell-grid">
                            {modelosHermanos.map((hermano) => (
                                <PropertyCard key={hermano.id} item={hermano} showDevName={false} />
                            ))}
                        </div>
                    </section>
                )}

            </main>

            {/* ── FIXED BOTTOM ACTION BAR (Solo Móvil) ── */}
            {/* FIX BUG 6: StickyActionPanel fuera del <main>. Ya usa position:fixed,
                no necesita envoltura de layout. El CSS ya lo oculta en ≥1024px. */}
            {showFixedBar && (
                <StickyActionPanel
                    onMainAction={handleOpenLeadForm}
                />
            )}

            {/* ── MODALES ── */}
            {isLeadFormOpen && (
                <LeadCaptureForm
                    desarrollo={desarrollo}
                    modelo={modelo}
                    onCancel={() => setIsLeadFormOpen(false)}
                    onSuccess={() => setIsLeadFormOpen(false)}
                />
            )}
            {isSimulatorOpen && (
                <MortgageSimulatorModal
                    initialPrice={modelo.precioNumerico}
                    propertyData={simulatorPayload}
                    onClose={() => setIsSimulatorOpen(false)}
                />
            )}

        </article>
    );
}
