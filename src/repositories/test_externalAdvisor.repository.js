
import { ExternalAdvisorRepository } from './externalAdvisor.repository';

// Mock dependencies
const mockDb = {};

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    doc: jest.fn(),
    serverTimestamp: jest.fn(),
    arrayUnion: jest.fn()
}));

import { getDocs, query, where } from 'firebase/firestore';

describe('ExternalAdvisorRepository', () => {
    let repository;

    beforeEach(() => {
        repository = new ExternalAdvisorRepository(mockDb);
        jest.clearAllMocks();
    });

    describe('getAdvisorsByDeveloper', () => {
        it('should query by idDesarrollador', async () => {
            getDocs.mockResolvedValue({
                docs: [
                    { id: 'adv1', data: () => ({ name: 'John' }) }
                ]
            });

            const result = await repository.getAdvisorsByDeveloper('dev-id');

            expect(query).toHaveBeenCalled();
            expect(where).toHaveBeenCalledWith('idDesarrollador', '==', 'dev-id');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('adv1');
        });
    });
});
