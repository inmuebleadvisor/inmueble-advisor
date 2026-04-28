/**
 * @file UnaCasaParaMi.jsx
 * @description Landing pública de agendado de citas personalizadas vía Google Calendar.
 *
 * Permite a visitantes (leads externos desde campañas, tarjetas de presentación,
 * redes sociales, etc.) agendar directamente una cita con un asesor inmobiliario
 * sin requerir autenticación.
 *
 * Arquitectura (MANUALDEARQUITECTURA.md §4B):
 * - Screen: Composición visual pura, sin lógica de negocio.
 * - Estilos: BEM (Bloque: `appointment`), tokens CSS de index.css.
 * - SEO: Indexable como landing de conversión.
 *
 * Ruta: /unacasaparami (pública, sin ProtectedRoute)
 */

import React, { useState } from 'react';
import { Calendar, ShieldCheck, CheckCircle } from 'lucide-react';
import SEOHead from '../../components/common/SEOHead';
import '../../styles/screens/UnaCasaParaMi.css';

/**
 * URL del schedule de Google Calendar Appointment Scheduling.
 * Se centraliza aquí para facilitar su actualización futura.
 * @type {string}
 */
const GOOGLE_CALENDAR_SCHEDULE_URL =
    'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3Xln2T6oK3H0VhE0llAUY8ykACr85nCQfB86HrvlT95_5CY76KdyykBWK-PGAf2ZHTPNojN0r5?gv=true';

/**
 * Datos de los badges de confianza (trust signals).
 * Se mantienen como estructura de datos para facilitar iteración
 * y futura internacionalización.
 *
 * @type {Array<{id: string, Icon: React.ComponentType, text: string}>}
 */
const TRUST_SIGNALS = [
    {
        id: 'schedule',
        Icon: Calendar,
        text: 'Elige el horario que te convenga',
    },
    {
        id: 'privacy',
        Icon: ShieldCheck,
        text: 'Datos protegidos y privados',
    },
    {
        id: 'no-commitment',
        Icon: CheckCircle,
        text: 'Sin compromiso, cancela cuando quieras',
    },
];

/**
 * Componente de pantalla para la landing de citas.
 * Renderiza un hero introductorio, el iframe de Google Calendar embebido
 * en un contenedor responsivo, y badges de confianza.
 *
 * @returns {JSX.Element} La landing de agendado de citas.
 */
export default function UnaCasaParaMi() {
    const [iframeLoaded, setIframeLoaded] = useState(false);

    /**
     * Handler invocado cuando el iframe termina de cargar.
     * Actualiza el estado para ocultar el indicador de carga.
     */
    const handleIframeLoad = () => {
        setIframeLoaded(true);
    };

    return (
        <>
            <SEOHead
                title="Agenda tu Cita — Una Casa Para Ti"
                description="Agenda una cita personalizada con un asesor inmobiliario experto. Sin compromiso, sin presión — solo orientación profesional para encontrar tu hogar ideal."
                noIndex={false}
            />

            <section className="appointment" aria-labelledby="appointment-title">

                {/* ── HERO ──────────────────────────────────────────────── */}
                <header className="appointment__hero">
                    <div className="appointment__hero-container">
                        <h1 id="appointment-title" className="appointment__title">
                            Encuentra Una Casa Para Ti
                        </h1>
                        <p className="appointment__subtitle">
                            Agenda una cita personalizada con un asesor inmobiliario experto.
                            Sin compromiso, sin presión — solo orientación profesional para tu búsqueda.
                        </p>
                    </div>
                </header>

                {/* ── GOOGLE CALENDAR EMBED ──────────────────────────────── */}
                <div className="appointment__embed">
                    <div className="appointment__embed-wrapper">
                        {!iframeLoaded && (
                            <div
                                className="appointment__loading"
                                role="status"
                                aria-live="polite"
                            >
                                Cargando calendario...
                            </div>
                        )}
                        <iframe
                            className="appointment__iframe"
                            src={GOOGLE_CALENDAR_SCHEDULE_URL}
                            title="Agendar cita con asesor inmobiliario — Google Calendar"
                            loading="lazy"
                            allow="camera; microphone"
                            referrerPolicy="no-referrer-when-downgrade"
                            onLoad={handleIframeLoad}
                            style={!iframeLoaded ? { height: 0, overflow: 'hidden' } : undefined}
                        />
                    </div>
                </div>

                {/* ── TRUST SIGNALS ──────────────────────────────────────── */}
                <footer className="appointment__trust" aria-label="Garantías del servicio">
                    {TRUST_SIGNALS.map(({ id, Icon, text }) => (
                        <div key={id} className="appointment__trust-item">
                            <Icon
                                className="appointment__trust-icon"
                                size={24}
                                strokeWidth={2}
                                aria-hidden="true"
                            />
                            <p className="appointment__trust-text">{text}</p>
                        </div>
                    ))}
                </footer>

            </section>
        </>
    );
}
