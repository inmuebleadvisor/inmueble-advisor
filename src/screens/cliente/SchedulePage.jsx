/**
 * @file SchedulePage.jsx
 * @description Página dedicada para agendar visita a un modelo de vivienda.
 *
 * Actúa como "espejo" de la experiencia de agendado que ofrece el Modal
 * `LeadCaptureForm`. Reutiliza el componente existente al 100% (Regla DRY,
 * MANUALDEARQUITECTURA.md §7) sin duplicar ninguna lógica de negocio.
 *
 * Casos de uso:
 * - Usuarios que llegaron desde el PDF descargable (botón "Agenda tu Recorrido").
 * - Links de campañas directas que necesitan una URL pública de conversión.
 *
 * Ruta: /agendar/:id  (donde :id es el ID del modelo en Firestore)
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { useService } from '../../hooks/useService';
import SEOHead from '../../components/common/SEOHead';

// DRY: mismo formulario que se usa en el Modal de ModelDetailsContent.
const LeadCaptureForm = React.lazy(() => import('../../components/leads/LeadCaptureForm'));

/**
 * Componente de Pantalla para Agendar Cita.
 * Extrae el modelo por ID via CatalogContext (Single Source of Truth),
 * y delega toda la lógica de agendado al componente `LeadCaptureForm`.
 *
 * @returns {JSX.Element}
 */
export default function SchedulePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getModeloById, getDesarrolloById, loadingCatalog } = useCatalog();
    const { catalog: catalogService } = useService();

    const [modelo, setModelo] = useState(null);
    const [desarrollo, setDesarrollo] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Efecto principal de carga de datos.
     * Sigue el mismo patrón que DetalleModelo.jsx: primero busca en el caché
     * del contexto, y si no lo encuentra, lo solicita al servicio.
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

                    const idDevRaw = modeloFound.idDesarrollo || modeloFound.id_desarrollo || modeloFound.desarrollo_id;
                    const idDevStr = idDevRaw ? String(idDevRaw).trim() : null;

                    if (idDevStr) {
                        const devData = getDesarrolloById(idDevStr);
                        // Asegurar que no se use el mismo objeto como su propio "desarrollo padre"
                        if (devData && String(devData.id) !== String(modeloFound.id)) {
                            setDesarrollo(devData);
                        }
                    }
                }
            } catch (err) {
                console.error('[SchedulePage] Error cargando datos del modelo:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, loadingCatalog, getModeloById, getDesarrolloById, catalogService]);

    // ── Handlers de navegación (delegados al LeadCaptureForm) ───────────────
    /**
     * Al cancelar el agendado, regresa a la pantalla anterior del historial.
     * Si no hay historial (llegó desde un PDF), va al catálogo.
     */
    const handleCancel = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/catalogo');
        }
    };

    /**
     * Al completar el agendado con éxito, navega al inicio.
     */
    const handleSuccess = () => {
        navigate('/');
    };

    // ── Renders Condicionales ────────────────────────────────────────────────
    if (loadingCatalog || loading) {
        return (
            <div style={styles.container}>
                <SEOHead title="Agendar Visita" description="Cargando información del modelo..." />
                <div style={styles.loader}>Cargando información...</div>
            </div>
        );
    }

    if (!modelo) {
        return (
            <div style={styles.container}>
                <SEOHead title="Modelo no encontrado" description="El modelo solicitado no está disponible." noIndex={true} />
                <p style={styles.errorText}>El modelo no está disponible. <a href="/catalogo" style={styles.link}>Ver Catálogo</a></p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <SEOHead
                title={`Agendar Visita - ${modelo.nombre_modelo}`}
                description={`Agenda tu visita exclusiva al modelo ${modelo.nombre_modelo}. Selecciona una fecha y confirma tus datos.`}
                noIndex={true}
            />
            <React.Suspense fallback={<div style={styles.loader}>Cargando formulario...</div>}>
                <LeadCaptureForm
                    modelo={modelo}
                    desarrollo={desarrollo}
                    onCancel={handleCancel}
                    onSuccess={handleSuccess}
                />
            </React.Suspense>
        </div>
    );
}

// ── Estilos base ─────────────────────────────────────────────────────────────
// Estilos minimalistas: el modal LeadCaptureForm ya gestiona su propio overlay.
const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#0f172a', // Mismo fondo oscuro que el modal
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loader: {
        color: '#94a3b8',
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
    },
    errorText: {
        color: '#94a3b8',
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
    },
    link: {
        color: '#f59e0b',
        fontWeight: 700,
    },
};
