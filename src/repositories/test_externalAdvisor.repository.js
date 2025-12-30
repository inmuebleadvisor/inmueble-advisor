
import { ExternalAdvisorRepository } from './externalAdvisor.repository';

// Mock objects
const mockDb = {};
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn();
const mockServerTimestamp = vi.fn(() => 'TIMESTAMP');

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
    collection: (...args) => mockCollection(...args),
    query: (...args) => mockQuery(...args),
    where: (...args) => mockWhere(...args),
    getDocs: (...args) => mockGetDocs(...args),
    addDoc: (...args) => mockAddDoc(...args),
    updateDoc: (...args) => mockUpdateDoc(...args),
    doc: (...args) => mockDoc(...args),
    serverTimestamp: () => mockServerTimestamp(),
    arrayUnion: (val) => val
}));

describe('ExternalAdvisorRepository', () => {
    let repository;

    beforeEach(() => {
        repository = new ExternalAdvisorRepository(mockDb);
        vi.clearAllMocks();
    });

    it('findByPhone returns null if phone is missing', async () => {
        const result = await repository.findByPhone(null);
        expect(result).toBeNull();
    });

    it('findByPhone returns advisor if found', async () => {
        mockGetDocs.mockResolvedValue({
            empty: false,
            docs: [{ id: '123', data: () => ({ name: 'John' }) }]
        });

        const result = await repository.findByPhone('5551234');
        expect(result).toEqual({ id: '123', name: 'John' });
        expect(mockWhere).toHaveBeenCalledWith('telefono', '==', '5551234');
    });

    it('create adds a new advisor with timestamp', async () => {
        mockAddDoc.mockResolvedValue({ id: 'new_id' });
        const data = { name: 'Jane' };

        const result = await repository.create(data);

        expect(mockAddDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
            name: 'Jane',
            createdAt: 'TIMESTAMP'
        }));
        expect(result).toEqual({ id: 'new_id', name: 'Jane' });
    });
});
