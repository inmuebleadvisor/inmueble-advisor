import { NotificationPort } from "../interfaces/NotificationPort";
import { UserRepository } from "../entities/User";
import { LeadRepository } from "../interfaces/LeadRepository";
import { LeadMessageBuilder } from "../services/LeadMessageBuilder";

interface LeadData {
    id: string;
    uid: string;
    clienteUid?: string;
    [key: string]: any;
}

export class NotifyNewLead {
    constructor(
        private notificationPort: NotificationPort,
        private userRepo: UserRepository,
        private leadRepo: LeadRepository
    ) { }

    async execute(lead: LeadData): Promise<void> {
        const uid = lead.uid || lead.clienteUid;

        // 1. Fetch Client Profile (if uid exists)
        let clientUser = null;
        if (uid) {
            try {
                clientUser = await this.userRepo.getUserById(uid);
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }
        }

        // 2. Fetch History (Other leads for this user)
        let otherLeads: any[] = [];
        if (uid) {
            try {
                otherLeads = await this.leadRepo.getLeadsByUserId(uid);
            } catch (err) {
                console.error("Error fetching lead history:", err);
            }
        }

        // 3. Build Message using Shared Logic
        const message = LeadMessageBuilder.formatMessage(lead, clientUser, otherLeads);

        // 4. Send
        await this.notificationPort.sendAlert(message);
    }
}
