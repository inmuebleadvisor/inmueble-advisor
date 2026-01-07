import { NotificationPort } from "../interfaces/NotificationPort";

interface LeadData {
    id: string;
    [key: string]: any;
}

export class NotifyNewLead {
    constructor(private notificationPort: NotificationPort) { }

    async execute(lead: LeadData): Promise<void> {
        // Safe extraction of fields, assuming structure from LeadRepository
        // but being resilient to missing data.
        const id = lead.id || "Desconocido";
        const email = lead.email || "No especificado";
        const phone = lead.telefono || lead.phone || "No especificado";
        const source = lead.origen || lead.source || "Web/App";
        const developmentId = lead.idDesarrollo || "General";
        const price = lead.precioReferencia ? `$${lead.precioReferencia}` : "N/A";

        // Attempt to guess user name or identifier
        const name = lead.nombre || lead.name || lead.contactName || "Posible Cliente";

        const message = `🎯 *Nuevo Lead Generado*\n\n🆔 **ID:** \`${id}\`\n👤 **Nombre:** ${name}\n📞 **Tel:** ${phone}\n📧 **Email:** ${email}\n🏢 **Desarrollo:** \`${developmentId}\`\n💰 **Presupuesto:** ${price}\n🌍 **Origen:** ${source}\n\n_Inmueble Advisor Admin_`;

        await this.notificationPort.sendAlert(message);
    }
}
