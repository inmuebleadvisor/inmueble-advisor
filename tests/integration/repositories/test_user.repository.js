import { UserRepository } from '../../../src/repositories/user.repository';
import { getDoc, setDoc, doc } from 'firebase/firestore';

// Mocks for Firebase Firestore
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        doc: vi.fn(),
        collection: vi.fn(),
        getDocs: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        serverTimestamp: () => 'TIMESTAMP'
    };
});

const mockDb = {};

describe('UserRepository', () => {
    let repo;

    beforeEach(() => {
        repo = new UserRepository(mockDb);
        vi.clearAllMocks();
    });

    it('getUserById should return data if exists', async () => {
        const mockSnap = {
            exists: () => true,
            id: 'u1',
            data: () => ({ name: 'Test' })
        };
        getDoc.mockResolvedValue(mockSnap);
        doc.mockReturnValue('ref');

        const result = await repo.getUserById('u1');

        expect(doc).toHaveBeenCalledWith(mockDb, 'users', 'u1');
        expect(getDoc).toHaveBeenCalledWith('ref');
        expect(result).toEqual({ uid: 'u1', name: 'Test' });
    });

    it('getUserById should return null if not exists', async () => {
        const mockSnap = {
            exists: () => false
        };
        getDoc.mockResolvedValue(mockSnap);

        const result = await repo.getUserById('u1');
        expect(result).toBeNull();
    });

    it('createUserWithId should set document with specific ID', async () => {
        doc.mockReturnValue('ref');
        const userData = { name: 'New' };

        const result = await repo.createUserWithId('uNew', userData);

        expect(doc).toHaveBeenCalledWith(mockDb, 'users', 'uNew');
        expect(setDoc).toHaveBeenCalledWith('ref', expect.objectContaining({
            name: 'New',
            createdAt: 'TIMESTAMP'
        }));
        expect(result.uid).toBe('uNew');
    });
});
