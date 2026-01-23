import React, { useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useCatalog } from '../../../context/CatalogContext';
import { useService } from '../../../hooks/useService';
import { useUser } from '../../../context/UserContext';
import './WhatsAppButton.css';

/**
 * WhatsAppButton Component
 * 
 * Botón flotante que redirige a WhatsApp con un mensaje contextual
 * basado en la ruta actual (Modelo, Desarrollo, Asesor, etc).
 */
const WhatsAppButton = () => {
    const location = useLocation();
    const { getModeloById, getDesarrolloById } = useCatalog();
    const { meta: metaService } = useService();
    const { user, userProfile } = useUser();

    // Ocultar en Home
    if (location.pathname === '/') return null;

    // Número de teléfono destino (sin signos, solo dígitos)
    const PHONE_NUMBER = '524491987425';

    // Lógica para determinar el mensaje basado en la ruta
    const contextData = useMemo(() => {
        const currentPath = location.pathname;

        // 1. Caso DETALLE MODELO: /modelo/:id
        const matchModelo = matchPath({ path: "/modelo/:id" }, currentPath);
        if (matchModelo && matchModelo.params.id) {
            const id = decodeURIComponent(matchModelo.params.id);
            const modelo = getModeloById(id);
            const nombreModelo = modelo ? modelo.nombre_modelo : 'este modelo';
            const nombreDesarrollo = modelo?.nombreDesarrollo ? ` del desarrollo ${modelo.nombreDesarrollo}` : '';
            return {
                message: `Hola, estoy viendo el modelo ${nombreModelo}${nombreDesarrollo} y tengo una duda:`,
                contentName: `${nombreModelo}${nombreDesarrollo}`
            };
        }

        // 2. Caso DETALLE DESARROLLO: /desarrollo/:id
        const matchDesarrollo = matchPath({ path: "/desarrollo/:id" }, currentPath);
        if (matchDesarrollo && matchDesarrollo.params.id) {
            const id = decodeURIComponent(matchDesarrollo.params.id);
            const desarrollo = getDesarrolloById(id);
            const nombreDesarrollo = desarrollo ? desarrollo.nombre : 'este desarrollo';
            return {
                message: `Hola, estoy en el desarrollo ${nombreDesarrollo} y tengo una duda:`,
                contentName: nombreDesarrollo
            };
        }

        // 3. Caso SECCIÓN VENDEDOR: /soy-asesor o /account-asesor
        if (currentPath.includes('asesor')) {
            return {
                message: "Hola, estoy en la seccion de Vendedor y tengo una duda:",
                contentName: "Seccion Asesor"
            };
        }

        // 4. Caso DEFAULT: Mensaje más amigable solicitado por el usuario
        return {
            message: "Hola, estoy interesad@ y quiero resolver algunas dudas para poder agendar una cita, mi nombre es: ",
            contentName: "General WhatsApp"
        };

    }, [location.pathname, getModeloById, getDesarrolloById]);

    const handleWhatsAppClick = (e) => {
        // 1. Generate Event ID
        const eventId = metaService.generateEventId();

        // 2. PII Extraction
        const email = userProfile?.email || user?.email;
        const firstName = userProfile?.nombre || user?.displayName?.split(' ')[0];
        const lastName = userProfile?.apellido || user?.displayName?.split(' ').slice(1).join(' ');

        const rawPhone = userProfile?.telefono || '';
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

        // 3. Set User Data (Advanced Matching)
        if (email || normalizedPhone || user?.uid) {
            metaService.setUserData({
                em: email,
                ph: normalizedPhone,
                fn: firstName,
                ln: lastName,
                external_id: user?.uid
            });
        }

        // 4. Browser Track
        metaService.trackContact({
            content_name: contextData.contentName,
            content_category: 'WhatsApp Contact',
            source_url: window.location.href
        }, eventId);

        // 5. CAPI Track (Fire and Forget)
        metaService.trackContactCAPI(eventId, {
            nombreDesarrollo: contextData.contentName,
            urlOrigen: window.location.href,
            fbp: metaService.getFbp(),
            fbc: metaService.getFbc(),
            clientUserAgent: navigator.userAgent,
            email: email,
            telefono: normalizedPhone,
            nombre: firstName,
            apellido: lastName,
            external_id: user?.uid
        }).catch(err => console.warn("[Meta WhatsApp] CAPI Failed", err));
    };

    // Generar URL de WhatsApp
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(contextData.message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
            aria-label="Contactar por WhatsApp"
            onClick={handleWhatsAppClick}
        >
            <svg className="whatsapp-btn__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        </a>
    );
};

export default WhatsAppButton;
