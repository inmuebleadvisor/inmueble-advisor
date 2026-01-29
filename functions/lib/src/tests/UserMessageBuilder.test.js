"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserMessageBuilder_1 = require("../../src/core/services/UserMessageBuilder");
const chai_1 = require("chai");
describe("UserMessageBuilder", () => {
    it("should escape underscores and asterisks in display name and email", () => {
        const user = {
            uid: "123",
            displayName: "Juan_Perez",
            email: "test*user_1@example.com"
        };
        const message = UserMessageBuilder_1.UserMessageBuilder.formatMessage(user);
        // Telegram Markdown V1 uses \ to escape
        (0, chai_1.expect)(message).to.contain("Juan\\_Perez");
        (0, chai_1.expect)(message).to.contain("test\\*user\\_1@example.com");
    });
    it("should handle missing data gracefully", () => {
        const user = { uid: "456" };
        const message = UserMessageBuilder_1.UserMessageBuilder.formatMessage(user);
        (0, chai_1.expect)(message).to.contain("Usuario sin nombre");
        (0, chai_1.expect)(message).to.contain("No especificado");
    });
});
//# sourceMappingURL=UserMessageBuilder.test.js.map