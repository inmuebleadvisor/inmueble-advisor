import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth'; // ✅ Direct SDK Access for Verification
import { useService } from '../../hooks/useService';
import { useUser } from '../../context/UserContext';
import { META_CONFIG } from '../../config/constants';

/**
 * MetaTracker
 * 
 * Centralized component to handle PageView events.
 * Listens to route changes and fires both Browser (Pixel) and Server (CAPI) events.
 * 
 * ⚡ SMART WAIT IMPLEMENTATION (2026-01-12):
 * Solves the race condition where navigation happens before UserContext is populated.
 * It checks the low-level Firebase Auth SDK to see if a user exists vs. Context state.
 */
const MetaTracker = () => {
    const location = useLocation();
    const { meta: metaService } = useService();
    const { user, userProfile } = useUser();

    // ✅ REFS: Keep latest user state available for the async timeout
    const userRef = useRef(user);
    const userProfileRef = useRef(userProfile);

    // Update refs on every render
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

        // 🕵️‍♂️ SMART WAIT LOGIC
        // We define a recursive function to retry checking for the user if the SDK indicates they are logged in.
        let attempt = 0;
        const maxAttempts = 5; // 5 * 500ms = 2.5 seconds max wait

        const tryTrackPageView = async () => {
            attempt++;

            // 1. Get current Context State
            const currentUser = userRef.current;
            const currentProfile = userProfileRef.current;

            // 2. Check Low-Level Auth SDK State
            const auth = getAuth();
            const sdkUser = auth.currentUser;

            // 🚨 RACE CONDITION CHECK:
            // If Context is empty (currentUser == null) BUT SDK has a user (sdkUser != null),
            // it means Context makes a fetch (React state lag). We must WAIT.
            const isContextLagging = !currentUser && sdkUser;

            if (isContextLagging && attempt <= maxAttempts) {
                console.log(`⏳ [Meta Unified] Context Lag Detected (Attempt ${attempt}/${maxAttempts}). Waiting for UserContext sync...`);
                setTimeout(tryTrackPageView, 500); // Retry in 500ms
                return;
            }

            // --- PROCEED TO TRACKING ---

            if (isContextLagging && attempt > maxAttempts) {
                console.warn("⚠️ [Meta Unified] Timeout waiting for UserContext. Proceeding with potentially limited data.");
            }

            try {
                // 1. Generate Unique ID for Deduplication
                const eventId = metaService.generateEventId();
                const currentUrl = window.location.href;

                // 2. Prepare User Data (PII)
                const email = currentProfile?.email || currentUser?.email || sdkUser?.email; // Fallback to SDK email if absolutely necessary

                // Name splitting fallback
                let firstName = currentProfile?.nombre;
                let lastName = currentProfile?.apellido;

                if (!firstName && currentUser?.displayName) {
                    firstName = currentUser.displayName.split(' ')[0];
                    lastName = currentUser.displayName.split(' ').slice(1).join(' ');
                }

                // Phone Normalization
                const rawPhone = currentProfile?.telefono || '';
                const cleanPhone = rawPhone.replace(/\D/g, '');
                const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

                // ID Prefer Context, then SDK (though if we are here, Context usually is ready or we timed out)
                const uid = currentUser?.uid || sdkUser?.uid;

                console.log(`📡 [Meta Unified] Tracking PageView for ${location.pathname}`, {
                    attempt,
                    hasUid: !!uid,
                    source: currentUser ? 'Context' : (sdkUser ? 'SDK Fallback' : 'Guest')
                });

                // 3. Update Pixel Access Token / User Data (Browser)
                if (email || normalizedPhone || uid) {
                    metaService.setUserData({
                        em: email,
                        ph: normalizedPhone,
                        fn: firstName,
                        ln: lastName,
                        external_id: uid
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
        };

        // Start the check (Initial 500ms delay to allow standard settling)
        const initialTimer = setTimeout(tryTrackPageView, 500);

        return () => clearTimeout(initialTimer);

    }, [location.key, metaService]);

    return null;
};

export default MetaTracker;
