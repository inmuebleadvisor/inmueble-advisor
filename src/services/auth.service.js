import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Service for handling Authentication and User Profile management.
 * Facades Firebase Auth and User Repository.
 */
export class AuthService {
    /**
     * @param {import('firebase/auth').Auth} auth
     * @param {import('firebase/auth').AuthProvider} googleProvider
     * @param {import('../repositories/user.repository').UserRepository} userRepository
     */
    constructor(auth, googleProvider, userRepository) {
        this.auth = auth;
        this.googleProvider = googleProvider;
        this.userRepository = userRepository;
    }

    /**
     * Subscribe to auth state changes.
     * @param {Function} callback - Function to call with (user, profile) or (null, null)
     * @returns {Function} Unsubscribe function
     */
    subscribeToAuthChanges(callback) {
        return onAuthStateChanged(this.auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch full profile from DB
                const profile = await this.userRepository.getUserById(firebaseUser.uid);
                callback(firebaseUser, profile);
            } else {
                callback(null, null);
            }
        });
    }

    /**
     * Login with Google.
     * Creates a new user with role 'cliente' if not exists.
     */
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.googleProvider);
            const firebaseUser = result.user;

            let userProfile = await this.userRepository.getUserById(firebaseUser.uid);

            if (!userProfile) {
                // Usuario Nuevo -> Nace como Cliente
                const newUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    nombre: firebaseUser.displayName,
                    foto: firebaseUser.photoURL,
                    role: 'cliente',
                    fechaRegistro: new Date().toISOString(),
                    onboardingCompleto: false
                };
                userProfile = await this.userRepository.createUserWithId(firebaseUser.uid, newUser);
            }

            return { user: firebaseUser, profile: userProfile };
        } catch (error) {
            console.error("AuthService Login Error:", error);
            throw error;
        }
    }

    /**
     * Signs out the current user.
     */
    async logout() {
        await signOut(this.auth);
    }

    /**
     * Convert current user to Advisor.
     * Uses Cloud Function 'promoteToAdvisor' for security.
     */
    async convertToAdvisor(uid, currentRole, extraData) {
        try {
            const promoteToAdvisorFn = httpsCallable(functions, 'promoteToAdvisor');

            // Call the Cloud Function. 
            // Note: uid is not passed as it is retrieved from context.auth in the backend.
            // We pass extraData if we decide to handle it later, though currently backend ignores it.
            await promoteToAdvisorFn({ ...extraData });

            // Return updated profile
            return this.userRepository.getUserById(uid);
        } catch (error) {
            console.error("Error calling promoteToAdvisor:", error);

            // Mapping specific Firebase Functions errors to user-friendly messages
            // https://firebase.google.com/docs/auth/admin/errors
            if (error.code === 'functions/unauthenticated') {
                throw new Error("Sesión expirada. Por favor, recarga e intenta nuevamente.");
            }
            if (error.code === 'functions/permission-denied') {
                throw new Error("No tienes permisos para realizar esta acción.");
            }
            if (error.code === 'functions/internal') {
                throw new Error("Ocurrió un error interno en el servidor. Intenta más tarde.");
            }

            // Fallback for other errors
            throw new Error(error.message || "No se pudo actualizar el rol a Asesor.");
        }
    }
}
