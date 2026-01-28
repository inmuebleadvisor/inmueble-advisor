
import { STATUS, STATUS_LABELS } from './constants';

describe('STATUS Constants', () => {
    test('STATUS keys should match expectation', () => {
        expect(STATUS.LEAD_PENDING_DEVELOPER_CONTACT).toBe('PENDING_DEVELOPER_CONTACT');
        expect(STATUS.LEAD_REPORTED).toBe('REPORTED');
    });
});

describe('STATUS_LABELS Translations', () => {
    test('should have a label for every relevant status', () => {
        const relevantStatuses = [
            STATUS.LEAD_PENDING_DEVELOPER_CONTACT,
            STATUS.LEAD_REPORTED,
            STATUS.LEAD_NEW,
            STATUS.LEAD_VISIT_SCHEDULED
        ];

        relevantStatuses.forEach(status => {
            expect(STATUS_LABELS[status]).toBeDefined();
            expect(typeof STATUS_LABELS[status]).toBe('string');
            expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
        });
    });

    test('should provide professional Spanish translations', () => {
        expect(STATUS_LABELS[STATUS.LEAD_PENDING_DEVELOPER_CONTACT]).toBe('Solicitud de Información');
        expect(STATUS_LABELS[STATUS.LEAD_VISIT_SCHEDULED]).toBe('Cita Agendada');
        expect(STATUS_LABELS[STATUS.LEAD_VISITED]).toBe('Visita Realizada');
    });
});

describe('UI_OPCIONES Configuration (Soft Login)', () => {
    test('REQUIRE_AUTH_FOR_DETAILS should be false for Soft Login strategy', () => {
        const { UI_OPCIONES } = require('./constants');
        expect(UI_OPCIONES.REQUIRE_AUTH_FOR_DETAILS).toBe(false);
    });
});
