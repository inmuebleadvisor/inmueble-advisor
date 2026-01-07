import posthog from 'posthog-js';

const apiKey = import.meta.env.VITE_APP_POSTHOG_KEY;
const apiHost = import.meta.env.VITE_APP_POSTHOG_HOST || 'https://us.i.posthog.com';

if (apiKey) {
    posthog.init(apiKey, {
        api_host: apiHost,
        person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
        session_recording: {
            maskAllInputs: true,
            maskInputOptions: {
                password: true,
            }
        },
        loaded: (posthog) => {
            if (import.meta.env.DEV) posthog.debug();
        }
    });
}

export default posthog;
