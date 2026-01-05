
export interface User {
    uid: string;
    email: string;
    role: 'admin' | 'asesor' | 'cliente';
    onboardingCompleto: boolean;
    // ... other fields
}

export interface UserRepository {
    getUserById(uid: string): Promise<User | null>;
    updateUserRole(uid: string, role: string, extraData: any): Promise<void>;
}
