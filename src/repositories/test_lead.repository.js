
import { LeadRepository } from './lead.repository';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
const mockDb = {
    collection: jest.fn(),
};

// Mock Firestore functions since they are imported directly
// In a real jest environment with babel-rewire or similar, we might mock them differently.
// For now, we assume we can mock the behavior by mocking the repo's internal methods or the db calls if possible.
// However, since the repo imports directly from firebase/firestore, unit testing without a real emulator or deep mocking is hard.
// We will write the test structure assuming standard jest usage where we might mock the module 'firebase/firestore'.

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    doc: jest.fn(),
    serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
    orderBy: jest.fn(),
    arrayUnion: jest.fn(val => val),
    getDoc: jest.fn(),
    Timestamp: {
        now: jest.fn(() => 'MOCK_NOW')
    }
}));

import { addDoc, getDocs, updateDoc } from 'firebase/firestore';

describe('LeadRepository', () => {
    let leadRepository;

    beforeEach(() => {
        leadRepository = new LeadRepository(mockDb);
        jest.clearAllMocks();
    });

    describe('createLead', () => {
        it('should throw error if mandatory fields are missing', async () => {
            await expect(leadRepository.createLead({})).rejects.toThrow("Missing required fields");
        });

        it('should create a lead with correct schema', async () => {
            const leadData = {
                uid: 'user123',
                idDesarrollo: 'dev1',
                idDesarrollador: 'developer1',
                email: 'test@test.com',
                precioReferencia: 1000000
            };

            addDoc.mockResolvedValue({ id: 'new-lead-id' });

            const result = await leadRepository.createLead(leadData);

            expect(addDoc).toHaveBeenCalledWith(
                undefined, // collection result (mocked)
                expect.objectContaining({
                    uid: 'user123',
                    idDesarrollo: 'dev1',
                    idDesarrollador: 'developer1',
                    status: 'PENDIENTE',
                    statusHistory: expect.any(Array)
                })
            );
            expect(result).toBe('new-lead-id');
        });
    });

    describe('updateStatus', () => {
        it('should update status and append to history', async () => {
            await leadRepository.updateStatus('lead1', 'CONTACTADO', { note: 'Called user' });

            expect(updateDoc).toHaveBeenCalledWith(
                undefined, // doc ref
                expect.objectContaining({
                    status: 'CONTACTADO',
                    statusHistory: expect.anything() // arrayUnion result
                })
            );
        });
    });
});
