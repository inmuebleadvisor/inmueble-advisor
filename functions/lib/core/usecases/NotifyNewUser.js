"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyNewUser = void 0;
const UserMessageBuilder_1 = require("../services/UserMessageBuilder");
class NotifyNewUser {
    constructor(notificationPort) {
        this.notificationPort = notificationPort;
    }
    async execute(user) {
        const message = UserMessageBuilder_1.UserMessageBuilder.formatMessage(user);
        await this.notificationPort.sendAlert(message);
    }
}
exports.NotifyNewUser = NotifyNewUser;
//# sourceMappingURL=NotifyNewUser.js.map