import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

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

    async logout() {
        await signOut(this.auth);
    }

    /**
     * Convert current user to Advisor.
     */
    async convertToAdvisor(uid, currentRole, extraData) {
        const newRole = currentRole === 'admin' ? 'admin' : 'asesor';

        await this.userRepository.updateUser(uid, {
            role: newRole,
            onboardingCompleto: true,
            fechaRegistroAsesor: new Date().toISOString(),
            ...extraData
        });

        return this.userRepository.getUserById(uid);
    }
}
