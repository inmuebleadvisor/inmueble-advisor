"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyNewLead = void 0;
const LeadMessageBuilder_1 = require("../services/LeadMessageBuilder");
class NotifyNewLead {
    constructor(notificationPort, userRepo, leadRepo) {
        this.notificationPort = notificationPort;
        this.userRepo = userRepo;
        this.leadRepo = leadRepo;
    }
    async execute(lead) {
        const uid = lead.uid || lead.clienteUid;
        // 1. Fetch Client Profile (if uid exists)
        let clientUser = null;
        if (uid) {
            try {
                clientUser = await this.userRepo.getUserById(uid);
            }
            catch (err) {
                console.error("Error fetching user profile:", err);
            }
        }
        // 2. Fetch History (Other leads for this user)
        let otherLeads = [];
        if (uid) {
            try {
                otherLeads = await this.leadRepo.getLeadsByUserId(uid);
            }
            catch (err) {
                console.error("Error fetching lead history:", err);
            }
        }
        // 3. Build Message using Shared Logic
        const message = LeadMessageBuilder_1.LeadMessageBuilder.formatMessage(lead, clientUser, otherLeads);
        // 4. Send
        await this.notificationPort.sendAlert(message);
    }
}
exports.NotifyNewLead = NotifyNewLead;
//# sourceMappingURL=NotifyNewLead.js.map