
import { LeadMessageBuilder } from "../../src/core/services/LeadMessageBuilder";
import { expect } from "chai";

describe("LeadMessageBuilder", () => {
    it("should escape special characters in lead data", () => {
        const lead = {
            nombre: "Juan_Perez",
            email: "test*lead@example.com",
            nombreDesarrollo: "Bosque_Real",
            id: "lead123"
        };
        const message = LeadMessageBuilder.formatMessage(lead, null, []);

        expect(message).to.contain("Juan\\_Perez");
        expect(message).to.contain("test\\*lead@example.com");
        expect(message).to.contain("Bosque\\_Real");
    });

    it("should format money correctly", () => {
        const lead = {
            precioReferencia: 2500000,
            id: "lead456"
        };
        const message = LeadMessageBuilder.formatMessage(lead, null, []);
        // MXN formatting check (Intl can vary slightly by environment, but basic currency symbol and digits should be there)
        expect(message).to.contain("$2,500,000");
    });

    it("should format dates correctly from Firestore-like object", () => {
        const lead = {
            citainicial: {
                dia: { seconds: 1738195200 }, // Simulated timestamp
                hora: "10:00 AM"
            },
            id: "lead789"
        };
        const message = LeadMessageBuilder.formatMessage(lead, null, []);
        expect(message).to.contain("enero"); // 1738195200 is Jan 2025
    });

    it("should include financial profile if provided", () => {
        const lead = { id: "lead1" };
        const clientUser = {
            perfilFinanciero: {
                capitalInicial: 500000,
                mensualidadMaxima: 15000
            }
        };
        const message = LeadMessageBuilder.formatMessage(lead, clientUser, []);
        expect(message).to.contain("Perfil Financiero");
        expect(message).to.contain("$500,000");
        expect(message).to.contain("$15,000");
    });
});
