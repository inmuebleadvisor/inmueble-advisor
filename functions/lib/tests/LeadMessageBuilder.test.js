"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LeadMessageBuilder_1 = require("../../src/core/services/LeadMessageBuilder");
const chai_1 = require("chai");
describe("LeadMessageBuilder", () => {
    it("should escape special characters in lead data", () => {
        const lead = {
            nombre: "Juan_Perez",
            email: "test*lead@example.com",
            nombreDesarrollo: "Bosque_Real",
            id: "lead123"
        };
        const message = LeadMessageBuilder_1.LeadMessageBuilder.formatMessage(lead, null, []);
        (0, chai_1.expect)(message).to.contain("Juan\\_Perez");
        (0, chai_1.expect)(message).to.contain("test\\*lead@example.com");
        (0, chai_1.expect)(message).to.contain("Bosque\\_Real");
    });
    it("should format money correctly", () => {
        const lead = {
            precioReferencia: 2500000,
            id: "lead456"
        };
        const message = LeadMessageBuilder_1.LeadMessageBuilder.formatMessage(lead, null, []);
        // MXN formatting check (Intl can vary slightly by environment, but basic currency symbol and digits should be there)
        (0, chai_1.expect)(message).to.contain("$2,500,000");
    });
    it("should format dates correctly from Firestore-like object", () => {
        const lead = {
            citainicial: {
                dia: { seconds: 1738195200 },
                hora: "10:00 AM"
            },
            id: "lead789"
        };
        const message = LeadMessageBuilder_1.LeadMessageBuilder.formatMessage(lead, null, []);
        (0, chai_1.expect)(message).to.contain("enero"); // 1738195200 is Jan 2025
    });
    it("should include financial profile if provided", () => {
        const lead = { id: "lead1" };
        const clientUser = {
            perfilFinanciero: {
                capitalInicial: 500000,
                mensualidadMaxima: 15000
            }
        };
        const message = LeadMessageBuilder_1.LeadMessageBuilder.formatMessage(lead, clientUser, []);
        (0, chai_1.expect)(message).to.contain("Perfil Financiero");
        (0, chai_1.expect)(message).to.contain("$500,000");
        (0, chai_1.expect)(message).to.contain("$15,000");
    });
});
//# sourceMappingURL=LeadMessageBuilder.test.js.map