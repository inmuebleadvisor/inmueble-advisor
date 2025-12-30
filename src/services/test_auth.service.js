import { AuthService } from './auth.service';

const mockAuth = {};
const mockGoogleProvider = {};
const mockUserRepository = {
    getUserById: vi.fn(),
    createUserWithId: vi.fn(),
    updateUser: vi.fn()
};

// Mock firebase functions
vi.mock('firebase/auth', () => ({
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
}));

import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

describe('AuthService', () => {
    let service;

    beforeEach(() => {
        service = new AuthService(mockAuth, mockGoogleProvider, mockUserRepository);
        vi.clearAllMocks();
    });

    it('loginWithGoogle should return user and profile', async () => {
        const mockFirebaseUser = { uid: 'u1', email: 'test@test.com' };
        signInWithPopup.mockResolvedValue({ user: mockFirebaseUser });
        mockUserRepository.getUserById.mockResolvedValue({ role: 'admin' });

        const result = await service.loginWithGoogle();

        expect(result.user).toEqual(mockFirebaseUser);
        expect(result.profile).toEqual({ role: 'admin' });
    });

    it('loginWithGoogle should create new user if not exists', async () => {
        const mockFirebaseUser = { uid: 'u2', email: 'new@test.com' };
        signInWithPopup.mockResolvedValue({ user: mockFirebaseUser });
        mockUserRepository.getUserById.mockResolvedValue(null);
        mockUserRepository.createUserWithId.mockResolvedValue({ role: 'cliente' });

        const result = await service.loginWithGoogle();

        expect(mockUserRepository.createUserWithId).toHaveBeenCalled();
        expect(result.profile).toEqual({ role: 'cliente' });
    });
});
