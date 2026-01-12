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

    // ✅ REFS: Keep latest user state available for the async timeout
    const userRef = useRef(user);
    const userProfileRef = useRef(userProfile);

    // Update refs on every render so the timeout always sees the "future" state
    userRef.current = user;
    userProfileRef.current = userProfile;

    // Tracker for last location to prevent duplicates
    const lastTrackedKey = useRef(null);

    useEffect(() => {
        // ✅ Ensure Pixel is Initialized
        if (!metaService.initialized) {
            metaService.init(META_CONFIG.PIXEL_ID);
        }

        // Avoid duplicate tracking for the same key
        if (lastTrackedKey.current === location.key) return;
        lastTrackedKey.current = location.key;

        // 🕒 DEBOUNCE: Wait 500ms for UserContext to settle (Race Condition Fix)
        // This ensures that if a login/navigation happens simultaneously, we capture the user ID.
        const timerId = setTimeout(async () => {
            try {
                // Read from Refs to get the LATEST state at execution time
                const currentUser = userRef.current;
                const currentProfile = userProfileRef.current;

                // 1. Generate Unique ID for Deduplication
                const eventId = metaService.generateEventId();
                const currentUrl = window.location.href;

                // 2. Prepare User Data (PII)
                const email = currentProfile?.email || currentUser?.email;
                const phone = currentProfile?.telefono;
                const firstName = currentProfile?.nombre || currentUser?.displayName?.split(' ')[0];
                const lastName = currentProfile?.apellido || currentUser?.displayName?.split(' ').slice(1).join(' ');
                const uid = currentUser?.uid;

                // Phone Normalization (Standardized)
                const rawPhone = currentProfile?.telefono || '';
                const cleanPhone = rawPhone.replace(/\D/g, '');
                const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

                console.log(`📡 [Meta Unified] Preparing PageView for ${location.pathname}`, { uid, email });

                // 3. Update Pixel Access Token / User Data (Browser)
                if (email || normalizedPhone || uid) {
                    metaService.setUserData({
                        em: email,
                        ph: normalizedPhone,
                        fn: firstName,
                        ln: lastName,
                        external_id: uid // ✅ External ID
                    });
                }

                // 4. Track Browser Event (Pixel)
                metaService.track('PageView', {}, eventId);

                // 5. Track Server Event (CAPI)
                const functionsInstance = getFunctions();
                const onLeadPageViewMETA = httpsCallable(functionsInstance, 'onLeadPageViewMETA');

                // Fire and forget CAPI
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
                        apellido: lastName,
                        external_id: uid
                    }
                }).catch(err => {
                    console.warn("[Meta Unified] CAPI PageView failed", err);
                });

            } catch (error) {
                console.error("[Meta Unified] Tracking error:", error);
            }
        }, 500); // 500ms Settle Time

        // Cleanup: Clear timeout if user navigates away quickly (prevents firing for skipped pages)
        return () => clearTimeout(timerId);

    }, [location.key, metaService]); // Only trigger on location change

    return null;
};

export default MetaTracker;
