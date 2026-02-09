import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadRepository } from '../../src/repositories/lead.repository';
import { doc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => {
    return {
        collection: vi.fn(),
        doc: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        getDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        getDocs: vi.fn(),
        orderBy: vi.fn(),
        serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
        arrayUnion: vi.fn((x) => ['UNION', x]),
        Timestamp: {
            now: vi.fn(() => 'MOCK_NOW')
        }
    };
});

describe('LeadRepository', () => {
    let repo;
    const mockDb = {};

    beforeEach(() => {
        repo = new LeadRepository(mockDb);
        vi.clearAllMocks();
    });

    it('should update lead status and append to history', async () => {
        const leadId = 'lead123';
        const updateData = {
            status: 'CONTACTADO',
            note: 'Llamada exitosa',
            changedBy: 'USER_1'
        };

        await repo.updateLead(leadId, updateData);

        expect(doc).toHaveBeenCalledWith(mockDb, 'leads', leadId);

        // Verify updateDoc call arguments
        const expectedUpdate = {
            status: 'CONTACTADO',
            updatedAt: 'MOCK_TIMESTAMP',
            statusHistory: ['UNION', {
                status: 'CONTACTADO',
                timestamp: 'MOCK_NOW',
                note: 'Llamada exitosa',
                changedBy: 'USER_1'
            }]
        };

        // Check if updateDoc was called with matching object structure
        expect(updateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
            status: 'CONTACTADO',
            statusHistory: expect.any(Array)
        }));
    });

    it('should update lead without status history if status is not present', async () => {
        const leadId = 'lead123';
        const updateData = {
            someField: 'value'
        };

        await repo.updateLead(leadId, updateData);

        expect(updateDoc).toHaveBeenCalledWith(undefined, {
            someField: 'value',
            updatedAt: 'MOCK_TIMESTAMP'
        });

        // Ensure arrayUnion was NOT called
        expect(arrayUnion).not.toHaveBeenCalled();
    });
});
