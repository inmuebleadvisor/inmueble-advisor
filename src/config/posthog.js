import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_APP_POSTHOG;
const apiHost = import.meta.env.VITE_APP_POSTHOG_HOST || 'https://us.i.posthog.com';

if (apiKey) {
    posthog.init(apiKey, {
        api_host: apiHost,
        person_profiles: 'identified_only',
        session_recording: {
            maskAllInputs: true,
            maskInputOptions: {
                password: true,
            }
        },
        loaded: (ph) => {
            if (import.meta.env.DEV) ph.debug();
            console.log("🚀 PostHog initialized successfully");
        }
    });
} else {
    if (!import.meta.env.DEV) {
        console.warn("⚠️ PostHog API Key is missing in Production environment. Tracking will not work.");
    }
}

export default posthog;
