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

        // Extract contact info from 'clienteDatos' map (Source of Truth per DATOSESTRUCTURA.md)
        // Fallback to top-level if legacy, but prioritize the map.
        const clienteDatos = lead.clienteDatos || {};
        const email = clienteDatos.email || lead.email || "No especificado";
        const phone = clienteDatos.telefono || lead.telefono || "No especificado";
        const name = clienteDatos.nombre || lead.nombre || "Posible Cliente";

        // Extract appointment info from 'citainicial' map
        const citainicial = lead.citainicial || {};
        let appointmentInfo = "📅 Sin Cita";
        if (citainicial.dia) {
            // Convert Firestore Timestamp to readable date if necessary, 
            // or just show the string if it's already a string.
            // As we are in a cloud function, it comes as a Timestamp object usually.
            // We'll try to safe stringify it.
            let dateStr = "Fecha desconocida";
            if (citainicial.dia.toDate) {
                // Firestore Timestamp
                dateStr = citainicial.dia.toDate().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            } else if (typeof citainicial.dia === 'string') {
                dateStr = citainicial.dia;
            } else if (citainicial.dia.seconds) {
                // Raw object { seconds, nanoseconds }
                dateStr = new Date(citainicial.dia.seconds * 1000).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            }

            const timeStr = citainicial.hora || "Hora N/A";
            appointmentInfo = `📅 **Cita:** ${dateStr} - ${timeStr}`;
        }

        const source = lead.origen || "Web/App";
        const developmentId = lead.idDesarrollo || lead.nombreDesarrollo || "General";
        const price = lead.precioReferencia ? `$${lead.precioReferencia}` : "N/A";
        // const status = lead.status || "PENDIENTE";

        const message = `🎯 *Nuevo Lead Generado*\n\n🆔 **ID:** \`${id}\`\n👤 **Nombre:** ${name}\n📞 **Tel:** ${phone}\n📧 **Email:** ${email}\n\n${appointmentInfo}\n\n🏢 **Desarrollo:** \`${developmentId}\`\n💰 **Presupuesto:** ${price}\n🌍 **Origen:** ${source}\n\n_Inmueble Advisor Admin_`;

        await this.notificationPort.sendAlert(message);
    }
}
