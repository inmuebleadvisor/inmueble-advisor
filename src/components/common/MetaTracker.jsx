import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useService } from '../../hooks/useService';
import { useUser } from '../../context/UserContext';
import { META_CONFIG } from '../../config/constants'; // ✅ Import Config

/**
 * MetaTracker
 * 
 * Centralized component to handle PageView events.
 * Listens to route changes and fires both Browser (Pixel) and Server (CAPI) events.
 * Ensures PII is sent if the user is logged in.
 */
const MetaTracker = () => {
    const location = useLocation();
    const { meta: metaService } = useService();
    const { user, userProfile } = useUser();

    // Prevent double firing in React.StrictMode local dev, though for prod useEffect dependency is enough.
    // We want to track every unique location key.
    const lastTrackedKey = useRef(null);

    useEffect(() => {
        // ✅ Ensure Pixel is Initialized (Race Condition Fix)
        if (!metaService.initialized) {
            metaService.init(META_CONFIG.PIXEL_ID);
        }

        // Avoid duplicate tracking for the same exact location state/key
        if (lastTrackedKey.current === location.key) return;
        lastTrackedKey.current = location.key;

        const trackPageView = async () => {
            try {
                // 1. Generate Unique ID for Deduplication
                const eventId = metaService.generateEventId();
                const currentUrl = window.location.href;

                // 2. Prepare User Data (PII)
                const email = userProfile?.email || user?.email;
                const phone = userProfile?.telefono;
                const firstName = userProfile?.nombre || user?.displayName?.split(' ')[0];
                const lastName = userProfile?.apellido || user?.displayName?.split(' ').slice(1).join(' ');

                // Phone Normalization (Standardized)
                const rawPhone = userProfile?.telefono || '';
                const cleanPhone = rawPhone.replace(/\D/g, '');
                const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

                // 3. Update Pixel Access Token / User Data for Advanced Matching (Browser)
                if (email || normalizedPhone) {
                    metaService.setUserData({
                        em: email,
                        ph: normalizedPhone,
                        fn: firstName,
                        ln: lastName
                    });
                }

                // 4. Track Browser Event (Pixel)
                metaService.track('PageView', {}, eventId);

                // 5. Track Server Event (CAPI)
                const functionsInstance = getFunctions();
                const onLeadPageViewMETA = httpsCallable(functionsInstance, 'onLeadPageViewMETA');

                console.log(`[Meta Unified] Tracking PageView: ${location.pathname} (ID: ${eventId})`);

                // Fire and forget CAPI to not block UI
                onLeadPageViewMETA({
                    metaEventId: eventId,
                    leadData: {
                        urlOrigen: currentUrl,
                        clientUserAgent: navigator.userAgent,
                        fbp: metaService.getFbp(),
                        fbc: metaService.getFbc(),
                        // PII for CAPI
                        email,
                        telefono: normalizedPhone,
                        nombre: firstName,
                        apellido: lastName
                    }
                }).catch(err => {
                    console.warn("[Meta Unified] CAPI PageView failed", err);
                });

            } catch (error) {
                console.error("[Meta Unified] Tracking error:", error);
            }
        };

        trackPageView();

    }, [location.key, metaService, user, userProfile, location.pathname]);
    // Intentionally depend on location.key to track history changes properly
    // user/userProfile might change late, but usually we care about the navigation event itself.
    // If user logs in mid-page, we generally don't re-fire PageView unless they navigate.

    return null;
};

export default MetaTracker;
