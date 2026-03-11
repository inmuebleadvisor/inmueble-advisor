import { useMemo } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { useService } from './useService';
import { useUser } from '../context/UserContext';

/**
 * @hook useWhatsAppContact
 * @description Hook reutilizable que encapsula la lógica de contacto por WhatsApp.
 * Genera la URL contextual basada en la ruta actual y dispara el tracking de Meta
 * Pixel + CAPI al hacer clic.
 *
 * DRY: Centraliza la lógica que antes estaba duplicada en
 *   - StickyActionPanel.jsx
 *   - ModelPricingCard.jsx
 *
 * @returns {{ whatsappUrl: string, handleWhatsAppClick: Function }}
 *
 * @example
 *   const { whatsappUrl, handleWhatsAppClick } = useWhatsAppContact();
 *   <a href={whatsappUrl} onClick={handleWhatsAppClick}>WhatsApp</a>
 */
export function useWhatsAppContact() {
    const location = useLocation();
    const { getModeloById, getDesarrolloById } = useCatalog();
    const { meta: metaService } = useService();
    const { user, userProfile } = useUser();

    const PHONE_NUMBER = '526673031923';

    /**
     * Mensaje contextual basado en la ruta actual.
     * Misma lógica que WhatsAppButton global, centralizada aquí.
     * @type {{ message: string, contentName: string }}
     */
    const contextData = useMemo(() => {
        const currentPath = location.pathname;

        // Caso: Página de detalle de Modelo
        const matchModelo = matchPath({ path: '/modelo/:id' }, currentPath);
        if (matchModelo?.params?.id) {
            const modelo = getModeloById(decodeURIComponent(matchModelo.params.id));
            const nombre = modelo ? modelo.nombre_modelo : 'este modelo';
            const desarrollo = modelo?.nombreDesarrollo
                ? ` del desarrollo ${modelo.nombreDesarrollo}`
                : '';
            return {
                message: `Hola, estoy viendo el modelo ${nombre}${desarrollo} y me gustaría obtener más información.`,
                contentName: `${nombre}${desarrollo}`
            };
        }

        // Caso: Página de detalle de Desarrollo
        const matchDesarrollo = matchPath({ path: '/desarrollo/:id' }, currentPath);
        if (matchDesarrollo?.params?.id) {
            const des = getDesarrolloById(decodeURIComponent(matchDesarrollo.params.id));
            const nombre = des ? des.nombre : 'este desarrollo';
            return {
                message: `Hola, estoy en el desarrollo ${nombre} y me gustaría obtener más información.`,
                contentName: nombre
            };
        }

        // Caso: Default
        return {
            message: 'Hola, estoy interesad@ y quiero resolver algunas dudas para poder agendar una cita, mi nombre es: ',
            contentName: 'General WhatsApp'
        };
    }, [location.pathname, getModeloById, getDesarrolloById]);

    /** URL final de WhatsApp con el mensaje pre-cargado */
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(contextData.message)}`;

    /**
     * Dispara el tracking de Meta Pixel + CAPI al hacer clic.
     * Fire-and-forget para no bloquear la navegación.
     */
    const handleWhatsAppClick = () => {
        const eventId = metaService.generateEventId();
        const pii = metaService.prepareUserData(user, userProfile);

        if (Object.keys(pii).length > 0) {
            metaService.setUserData(pii);
        }

        metaService.trackContact({
            content_name: contextData.contentName,
            content_category: 'WhatsApp Contact',
            source_url: window.location.href
        }, eventId);

        metaService.trackContactCAPI(eventId, pii, {
            nombreDesarrollo: contextData.contentName
        }).catch(err => console.warn('[useWhatsAppContact] CAPI Failed', err));
    };

    return { whatsappUrl, handleWhatsAppClick };
}
