/**
 * @file SimuladorPage.jsx
 * @description Página dedicada para el Simulador de Crédito Hipotecario.
 *
 * Actúa como "espejo" de la experiencia del modal `MortgageSimulatorModal`
 * que se abre desde la página del modelo. Reutiliza el componente al 100% (DRY,
 * MANUALDEARQUITECTURA.md §7) sin duplicar ninguna lógica de cálculo financiero.
 *
 * Casos de uso:
 * - Usuarios que llegaron desde el PDF descargable (botón "Pre-Calificar Crédito").
 * - Links de campañas externas que necesitan URL directa al simulador de un modelo.
 *
 * Ruta: /simular/:id  (donde :id es el ID del modelo en Firestore)
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { useService } from '../../hooks/useService';
import { modelPresentationService } from '../../services/service.provider';
import SEOHead from '../../components/common/SEOHead';

// DRY: mismo modal que usa ModelDetailsContent.jsx
const MortgageSimulatorModal = React.lazy(() => import('../../components/modals/MortgageSimulatorModal'));

/**
 * Componente de pantalla para el Simulador de Crédito.
 * Extrae el modelo por ID via CatalogContext (Single Source of Truth),
 * construye el payload requerido por MortgageSimulatorModal mediante
 * `ModelPresentationService.buildSimulatorPayload` (evita duplicar el mapeo),
 * y delega toda la lógica de simulación al componente reutilizado.
 *
 * @returns {JSX.Element}
 */
export default function SimuladorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getModeloById, getDesarrolloById, loadingCatalog } = useCatalog();
    const { catalog: catalogService } = useService();

    const [modelo, setModelo] = useState(null);
    const [desarrollo, setDesarrollo] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Efecto principal de carga de datos.
     * Patrón idéntico al de DetalleModelo.jsx y SchedulePage.jsx:
     * primero busca en el caché del contexto, luego en el servicio como fallback.
     */
    useEffect(() => {
        if (loadingCatalog) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                let modeloFound = getModeloById(id);

                if (!modeloFound) {
                    modeloFound = await catalogService.obtenerInformacionModelo(id);
                }

                if (modeloFound) {
                    setModelo(modeloFound);

                    const idDevRaw = modeloFound.idDesarrollo
                        || modeloFound.id_desarrollo
                        || modeloFound.desarrollo_id;
                    const idDevStr = idDevRaw ? String(idDevRaw).trim() : null;

                    if (idDevStr) {
                        const devData = getDesarrolloById(idDevStr);
                        // Asegura que no se use el mismo objeto como su propio "desarrollo padre"
                        if (devData && String(devData.id) !== String(modeloFound.id)) {
                            setDesarrollo(devData);
                        }
                    }
                }
            } catch (err) {
                console.error('[SimuladorPage] Error cargando datos del modelo:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, loadingCatalog, getModeloById, getDesarrolloById, catalogService]);

    /**
     * Al cerrar el simulador, regresa a la pantalla anterior del historial.
     * Si no hay historial (llegó directo desde un PDF), va al catálogo.
     */
    const handleClose = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/catalogo');
        }
    };

    // ── Renders Condicionales ────────────────────────────────────────────────
    if (loadingCatalog || loading) {
        return (
            <div style={styles.container}>
                <SEOHead title="Simulador de Crédito" description="Cargando información del modelo..." />
                <div style={styles.loader}>Cargando simulador...</div>
            </div>
        );
    }

    if (!modelo) {
        return (
            <div style={styles.container}>
                <SEOHead title="Modelo no encontrado" description="El modelo solicitado no está disponible." noIndex={true} />
                <p style={styles.errorText}>
                    El modelo no está disponible.{' '}
                    <a href="/catalogo" style={styles.link}>Ver Catálogo</a>
                </p>
            </div>
        );
    }

    // DRY: buildSimulatorPayload centraliza el mapeo de datos necesario para el modal
    const simulatorPayload = modelPresentationService.buildSimulatorPayload(modelo, desarrollo);

    return (
        <div style={styles.container}>
            <SEOHead
                title={`Simulador de Crédito - ${modelo.nombre_modelo}`}
                description={`Simula el crédito hipotecario para el modelo ${modelo.nombre_modelo}. Calcula tu enganche, mensualidad y plazo ideal.`}
                noIndex={true}
            />
            <React.Suspense fallback={<div style={styles.loader}>Cargando simulador...</div>}>
                <MortgageSimulatorModal
                    initialPrice={modelo.precioNumerico || 1000000}
                    propertyData={simulatorPayload}
                    onClose={handleClose}
                />
            </React.Suspense>
        </div>
    );
}

// ── Estilos base ─────────────────────────────────────────────────────────────
// El modal MortgageSimulatorModal ya gestiona su propio overlay.
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    loader: {
        marginTop: '40vh',
        color: '#94a3b8',
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
    },
    errorText: {
        color: '#94a3b8',
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        marginTop: '40vh',
    },
    link: {
        color: '#f59e0b',
        fontWeight: 700,
    },
};
