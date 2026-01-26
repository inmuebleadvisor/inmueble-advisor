"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadMessageBuilder = void 0;
const constants_1 = require("../constants");
class LeadMessageBuilder {
    static formatMessage(lead, clientUser, otherLeads) {
        // --- HELPERS ---
        const fmtMoney = (amount) => {
            if (!amount)
                return 'N/A';
            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(amount));
        };
        const fmtDate = (timestamp) => {
            if (!timestamp)
                return 'Por confirmar';
            let date;
            if (timestamp.toDate) {
                date = timestamp.toDate();
            }
            else if (timestamp.seconds) { // Firestore timestamp object (not class instance)
                date = new Date(timestamp.seconds * 1000);
            }
            else {
                date = new Date(timestamp);
            }
            // Use specific locale/timezone if possible, simplified for Node
            return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });
        };
        // --- EXTRACTION ---
        const clienteDatos = lead.clienteDatos || {};
        const name = clienteDatos.nombre || lead.nombre || "Posible Cliente";
        const phone = clienteDatos.telefono || lead.telefono || "No especificado";
        const email = clienteDatos.email || lead.email || "No especificado";
        const desarrollo = lead.nombreDesarrollo || lead.idDesarrollo || "Desarrollo General";
        // --- BUILD MESSAGE ---
        let mensaje = `🔔 *Nuevo LEAD Reportado*\n\n`;
        mensaje += `Interesado en *${desarrollo}*\n\n`;
        // A. Cita
        const citainicial = lead.citainicial || {};
        if (citainicial.dia) {
            mensaje += `📅 *Cita Agendada:*\n`;
            mensaje += `${fmtDate(citainicial.dia)} a las ${citainicial.hora || 'Hora N/A'}\n\n`;
        }
        // B. Cliente
        mensaje += `👤 *Cliente:* ${name}\n`;
        mensaje += `📞 *Tel:* ${phone}\n`;
        mensaje += `📧 *Email:* ${email}\n\n`;
        // C. Interés
        if (lead.modeloInteres) {
            mensaje += `🏠 *Modelo:* ${lead.modeloInteres}\n`;
        }
        if (lead.precioReferencia) {
            mensaje += `💰 *Ref:* ${fmtMoney(lead.precioReferencia)}\n`;
        }
        // D. Perfil Financiero
        const perfil = clientUser === null || clientUser === void 0 ? void 0 : clientUser.perfilFinanciero;
        if (perfil) {
            mensaje += `\n💼 *Perfil Financiero:*\n`;
            if (perfil.capitalInicial)
                mensaje += `- Efvo: ${fmtMoney(perfil.capitalInicial)}\n`;
            if (perfil.mensualidadMaxima)
                mensaje += `- Mensualidad: ${fmtMoney(perfil.mensualidadMaxima)}\n`;
            if (perfil.recamarasDeseadas)
                mensaje += `- Habs: ${perfil.recamarasDeseadas}\n`;
            let interes = 'Indistinto';
            if (perfil.interesInmediato === true)
                interes = 'Entrega Inmediata';
            if (perfil.interesInmediato === false)
                interes = 'Preventa';
            mensaje += `- Interés: ${interes}\n`;
        }
        // E. Historial
        const relevantHistory = otherLeads.filter(l => l.id !== lead.id).slice(0, 3);
        if (relevantHistory.length > 0) {
            mensaje += `\n📜 *Historial de Interés:*\n`;
            relevantHistory.forEach(l => {
                const statusText = constants_1.STATUS_LABELS[l.status] || l.status;
                const devName = l.nombreDesarrollo || l.idDesarrollo;
                mensaje += `- ${devName} (${statusText})\n`;
            });
        }
        mensaje += `\n_Inmueble Advisor Admin_`;
        return mensaje;
    }
}
exports.LeadMessageBuilder = LeadMessageBuilder;
//# sourceMappingURL=LeadMessageBuilder.js.map