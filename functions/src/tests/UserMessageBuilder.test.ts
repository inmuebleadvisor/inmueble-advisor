
import { UserMessageBuilder } from "../../src/core/services/UserMessageBuilder";
import { expect } from "chai";

describe("UserMessageBuilder", () => {
    it("should escape underscores and asterisks in display name and email", () => {
        const user = {
            uid: "123",
            displayName: "Juan_Perez",
            email: "test*user_1@example.com"
        };
        const message = UserMessageBuilder.formatMessage(user);

        // Telegram Markdown V1 uses \ to escape
        expect(message).to.contain("Juan\\_Perez");
        expect(message).to.contain("test\\*user\\_1@example.com");
    });

    it("should handle missing data gracefully", () => {
        const user = { uid: "456" };
        const message = UserMessageBuilder.formatMessage(user);
        expect(message).to.contain("Usuario sin nombre");
        expect(message).to.contain("No especificado");
    });
});
