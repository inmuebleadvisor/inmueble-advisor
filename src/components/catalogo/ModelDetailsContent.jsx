import React from 'react';
import { useMemo } from 'react';

// ── Subcomponentes (SRP) ────────────────────────────────────────────────────
import ModelHeader      from './model-details/ModelHeader';
import ModelPricingCard from './model-details/ModelPricingCard';
import ModelDescription from './model-details/ModelDescription';
import ModelFloorPlans  from './model-details/ModelFloorPlans';

// ── Componentes compartidos ─────────────────────────────────────────────────
import FinanciamientoWidget    from './FinanciamientoWidget';
import DevelopmentInfoSection  from './DevelopmentInfoSection';
import PropertyCard            from './PropertyCard';
import StickyActionPanel       from '../layout/StickyActionPanel';
import LeadCaptureForm         from '../leads/LeadCaptureForm';
import MortgageSimulatorModal  from '../modals/MortgageSimulatorModal';

// ── Hooks / Contexto ─────────────────────────────────────────────────────────
import { useStickyPanel } from '../../hooks/useStickyPanel';
import { useUser }        from '../../context/UserContext';

// ── Servicio de presentación (Inyección de Dependencias) ────────────────────
// 🟢 Didáctico: No importamos la clase directamente. El service.provider.js
// ya instanció el servicio y lo expuso como singleton. Lo consumimos desde ahí
// para respetar el patrón de Composition Root.
import { modelPresentationService } from '../../services/service.provider';

// ── Estilos del orquestador ─────────────────────────────────────────────────
import '../../styles/ModelDetailsContent.css';

/**
 * @component ModelDetailsContent
 * @description Componente Orquestador del detalle de un modelo.
 *
 * RESPONSABILIDAD ÚNICA: Coordinar y ensamblar los subcomponentes visuales.
 * Este componente NO formatea datos ni contiene lógica de negocio.
 * Toda esa responsabilidad recae en `ModelPresentationService`.
 *
 * Arquitectura:
 *  - Consume `modelPresentationService` (Inyección de Dependencias).
 *  - Delega renderizado a subcomponentes especializados (SRP).
 *  - Gestiona los estados de UI de alto nivel (modales abiertos/cerrados).
 *
 * @param {Object}   modelo           - Objeto del modelo inmobiliario.
 * @param {Object}   [desarrollo]     - Objeto del desarrollo/fraccionamiento.
 * @param {Object[]} [modelosHermanos=[]] - Otros modelos del mismo desarrollo.
 * @param {Function} [onBack]         - Callback de navegación atrás.
 * @param {boolean}  [isModal=false]  - Si está montado dentro de un modal.
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

    // ── Ref para el panel sticky (detecta cuando el header sale del viewport) ─
    const headerRef = React.useRef(null);
    const showFab   = useStickyPanel(headerRef);

    // ── Datos derivados via Servicio (sin lógica en el componente) ──────────
    // 🟢 Didáctico: useMemo garantiza que el servicio sólo recalcule los datos
    // cuando cambia el modelo, evitando recálculos en cada re-render.
    const galeriaItems       = useMemo(() => modelPresentationService.getGaleriaImagenes(modelo), [modelo]);
    const precioFormateado   = useMemo(() => modelPresentationService.formatoMoneda(modelo?.precioNumerico), [modelo]);
    const mantenimientoFmt   = useMemo(() => {
        const val = modelo?.precios?.mantenimientoMensual;
        return val > 0 ? modelPresentationService.formatoMoneda(val) : null;
    }, [modelo]);
    const simulatorPayload   = useMemo(() => modelPresentationService.buildSimulatorPayload(modelo, desarrollo), [modelo, desarrollo]);

    // ── Trigger de autenticación antes de abrir el formulario de captación ──
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

            {/* ── HEADER: Carrusel + Badge + Botón Volver ── */}
            <ModelHeader
                galeriaItems={galeriaItems}
                esPreventa={modelo.esPreventa}
                isModal={isModal}
                onBack={onBack}
                headerRef={headerRef}
            />

            <main className="model-details__content">

                {/* ── SECCIÓN 1: PRICING CARD ── */}
                <section className="model-details__section">
                    <ModelPricingCard
                        modelName={`${modelo.tipoVivienda ? modelo.tipoVivienda + ' ' : ''}${modelo.nombre_modelo}`}
                        precioFormateado={precioFormateado}
                        mantenimientoFormateado={mantenimientoFmt}
                        highlights={modelo.highlights || []}
                        modeloId={modelo.id}
                        onSimulate={() => setIsSimulatorOpen(true)}
                    />
                </section>

                {/* ── SECCIÓN 2: DESCRIPCIÓN Y CARACTERÍSTICAS ── */}
                <section className="model-details__section">
                    <ModelDescription modelo={modelo} />
                </section>

                {/* ── SECCIÓN 3: PLANOS (condicional) ── */}
                {modelo.plantas?.length > 0 && (
                    <section className="model-details__section">
                        <ModelFloorPlans
                            plantas={modelo.plantas}
                            nombreModelo={modelo.nombre_modelo}
                        />
                    </section>
                )}

                {/* ── SECCIÓN 4: SIMULADOR HIPOTECARIO ── */}
                <section className="model-details__section model-details__section--bordered">
                    <h3 className="model-details__section-title">Calcula tu Hipoteca</h3>
                    <p className="model-details__mortgage-intro">
                        Estimación de mensualidad para <strong>{modelo.nombre_modelo}</strong>:
                    </p>
                    <FinanciamientoWidget
                        precio={modelo.precioNumerico}
                        onSimulate={() => setIsSimulatorOpen(true)}
                    />
                </section>

                {/* ── SECCIÓN 5: CONTEXTO DEL DESARROLLO (condicional) ── */}
                {desarrollo && (
                    <section className="model-details__section model-details__section--bordered">
                        <header className="model-details__context-header">
                            <span className="model-details__context-label">Ubicado en el desarrollo:</span>
                            <h2 className="model-details__context-title">{desarrollo.nombre}</h2>
                        </header>
                        <DevelopmentInfoSection desarrollo={desarrollo} />
                    </section>
                )}

                {/* ── SECCIÓN 6: CROSS-SELLING (condicional) ── */}
                {modelosHermanos.length > 0 && (
                    <section className="model-details__cross-sell" aria-label="Otros modelos disponibles">
                        <h3 className="model-details__section-title">
                            Otras opciones en {desarrollo?.nombre || 'este desarrollo'}
                        </h3>
                        <div className="model-details__cross-sell-grid">
                            {modelosHermanos.map((hermano) => (
                                <PropertyCard key={hermano.id} item={hermano} showDevName={false} />
                            ))}
                        </div>
                    </section>
                )}

            </main>

            {/* ── FAB STICKY (aparece tras hacer scroll más allá del header) ── */}
            {showFab && (
                <StickyActionPanel
                    price={precioFormateado}
                    label="Precio de Lista"
                    onMainAction={handleOpenLeadForm}
                />
            )}

            {/* ── MODAL: FORMULARIO DE CAPTACIÓN ── */}
            {isLeadFormOpen && (
                <LeadCaptureForm
                    desarrollo={desarrollo}
                    modelo={modelo}
                    onCancel={() => setIsLeadFormOpen(false)}
                    onSuccess={() => setIsLeadFormOpen(false)}
                />
            )}

            {/* ── MODAL: SIMULADOR HIPOTECARIO ── */}
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
