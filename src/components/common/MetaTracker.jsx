import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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

    // ✅ REF: Track if component is mounted to prevent memory leaks / ghost runs
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        // ✅ Ensure Pixel is Initialized
        if (!metaService.initialized) {
            metaService.init(META_CONFIG.PIXEL_ID);
        }

        // Avoid duplicate tracking for the same key
        if (lastTrackedKey.current === location.key) return;
        lastTrackedKey.current = location.key;

        // 🛑 EXCLUSION: Skip PageView on routes that fire ViewContent
        // This prevents double-counting and ensures granular signals.
        const VIEW_CONTENT_ROUTES = [
            /^\/desarrollo\/[^/]+/, // Matches /desarrollo/:id
            /^\/modelo\/[^/]+/      // Matches /modelo/:id
        ];

        if (VIEW_CONTENT_ROUTES.some(regex => regex.test(location.pathname))) {
            console.log(`[Meta Unified] Skipping PageView for ${location.pathname} (ViewContent Active)`);
            return;
        }

        // 🕵️‍♂️ SMART WAIT LOGIC
        let attempt = 0;
        const maxAttempts = 5;
        let timerId = null; // Store timer ID for cleanup

        const tryTrackPageView = async () => {
            if (!isMounted.current) return; // Prevent run if unmounted

            attempt++;

            // 1. Get current Context State
            const currentUser = userRef.current;
            const currentProfile = userProfileRef.current;

            // 2. Check Low-Level Auth SDK State
            const auth = getAuth();
            const sdkUser = auth.currentUser;

            // 🚨 RACE CONDITION CHECK (User Context)
            const isContextLagging = !currentUser && sdkUser;

            // 🚨 PIXEL LOAD CHECK (New: Wait for fbq to be defined)
            const isPixelReady = typeof window !== 'undefined' && !!window.fbq;

            // Wait if either Context is lagging OR Pixel is not ready
            if ((isContextLagging || !isPixelReady) && attempt <= maxAttempts) {
                const reasons = [];
                if (isContextLagging) reasons.push("UserContext");
                if (!isPixelReady) reasons.push("Pixel(fbq)");

                console.log(`⏳ [Meta Unified] Waiting for dependencies (${reasons.join(', ')})... (Attempt ${attempt}/${maxAttempts})`);
                timerId = setTimeout(tryTrackPageView, 500);
                return;
            }

            if ((isContextLagging || !isPixelReady) && attempt > maxAttempts) {
                console.warn("⚠️ [Meta Unified] Timeout waiting for dependencies. Proceeding with potentially limited data or Server-Only tracking.");
                if (!isPixelReady) console.error("⛔ [Meta Unified] 'window.fbq' is undefined. Pixel script might be blocked by AdBlocker or failed to load.");
            }

            try {
                // 1. Generate Unique ID for Deduplication
                const metaEventId = metaService.generateEventId();
                const currentUrl = window.location.href;

                // 2. Prepare User Data (PII)
                const email = currentProfile?.email || currentUser?.email || sdkUser?.email;

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

                const uid = currentUser?.uid || sdkUser?.uid;

                // 3. Update Pixel Access Token / User Data
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
                const browserPayload = {
                    eventName: 'PageView',
                    eventID: metaEventId, // ✅ Use uppercase D for absolute consistency
                    params: {} // Standard for PageView
                };

                // ✅ STANDARDIZED SYNC LOG (Mirroring Schedule)
                console.log(`[Meta Sync] Browser Payload:`, browserPayload);

                if (metaEventId) {
                    metaService.track('PageView', browserPayload.params, metaEventId);
                } else {
                    console.error("❌ [Meta Unified] Generated Event ID is null! This should not happen.");
                }

                // 5. Track Server Event (CAPI)
                // Use Refactored MetaService CAPI Method
                metaService.trackPageViewCAPI(metaEventId, {
                    urlOrigen: currentUrl,
                    clientUserAgent: navigator.userAgent,
                    fbp: metaService.getFbp(),
                    fbc: metaService.getFbc(),
                    email,
                    telefono: normalizedPhone,
                    nombre: firstName,
                    apellido: lastName,
                    external_id: uid
                }).catch(err => {
                    console.warn("[Meta Unified] CAPI PageView failed", err);
                });

            } catch (error) {
                console.error("[Meta Unified] Tracking error:", error);
            }
        };

        // Start the check
        timerId = setTimeout(tryTrackPageView, 500);

        return () => {
            isMounted.current = false;
            if (timerId) clearTimeout(timerId);
        };

    }, [location.key, metaService]);

    return null;
};

export default MetaTracker;
