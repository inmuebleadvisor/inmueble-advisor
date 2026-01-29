import { STATUS_LABELS } from "../constants";
import { BaseMessageBuilder } from "./BaseMessageBuilder";

export class LeadMessageBuilder {
    static formatMessage(lead: any, clientUser: any | null, otherLeads: any[]): string {
        // --- EXTRACTION ---
        const clienteDatos = lead.clienteDatos || {};
        const name = clienteDatos.nombre || lead.nombre || "Posible Cliente";
        const phone = clienteDatos.telefono || lead.telefono || "No especificado";
        const email = clienteDatos.email || lead.email || "No especificado";
        const desarrollo = lead.nombreDesarrollo || lead.idDesarrollo || "Desarrollo General";

        // --- BUILD MESSAGE ---
        let mensaje = `🔔 *Nuevo LEAD Reportado*\n\n`;
        mensaje += `Interesado en *${BaseMessageBuilder.escapeMarkdown(desarrollo)}*\n\n`;

        // A. Cita
        const citainicial = lead.citainicial || {};
        if (citainicial.dia) {
            mensaje += `📅 *Cita Agendada:*\n`;
            mensaje += `${BaseMessageBuilder.fmtDate(citainicial.dia)} a las ${citainicial.hora || 'Hora N/A'}\n\n`;
        }

        // B. Cliente
        mensaje += `👤 *Cliente:* ${BaseMessageBuilder.escapeMarkdown(name)}\n`;
        mensaje += `📞 *Tel:* ${BaseMessageBuilder.escapeMarkdown(phone)}\n`;
        mensaje += `📧 *Email:* ${BaseMessageBuilder.escapeMarkdown(email)}\n\n`;

        // C. Interés
        if (lead.modeloInteres) {
            mensaje += `🏠 *Modelo:* ${BaseMessageBuilder.escapeMarkdown(lead.modeloInteres)}\n`;
        }
        if (lead.precioReferencia) {
            mensaje += `💰 *Ref:* ${BaseMessageBuilder.fmtMoney(lead.precioReferencia)}\n`;
        }

        // D. Perfil Financiero
        const perfil = clientUser?.perfilFinanciero;
        if (perfil) {
            mensaje += `\n💼 *Perfil Financiero:*\n`;
            if (perfil.capitalInicial) mensaje += `- Efvo: ${BaseMessageBuilder.fmtMoney(perfil.capitalInicial)}\n`;
            if (perfil.mensualidadMaxima) mensaje += `- Mensualidad: ${BaseMessageBuilder.fmtMoney(perfil.mensualidadMaxima)}\n`;
            if (perfil.recamarasDeseadas) mensaje += `- Habs: ${perfil.recamarasDeseadas}\n`;

            let interes = 'Indistinto';
            if (perfil.interesInmediato === true) interes = 'Entrega Inmediata';
            if (perfil.interesInmediato === false) interes = 'Preventa';
            mensaje += `- Interés: ${interes}\n`;
        }

        // E. Historial
        const relevantHistory = otherLeads.filter(l => l.id !== lead.id).slice(0, 3);
        if (relevantHistory.length > 0) {
            mensaje += `\n📜 *Historial de Interés:*\n`;
            relevantHistory.forEach(l => {
                const statusText = STATUS_LABELS[l.status] || l.status;
                const devName = l.nombreDesarrollo || l.idDesarrollo;
                mensaje += `- ${BaseMessageBuilder.escapeMarkdown(devName)} (${statusText})\n`;
            });
        }

        mensaje += `\n${BaseMessageBuilder.getFooter()}`;

        return mensaje;
    }
}
