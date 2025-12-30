// src/components/LeadCard.jsx
import React from 'react';
// ✅ Importamos las constantes para usar los códigos universales
import { STATUS } from '../config/constants';
import { calcularComisionEstimada, registrarHito } from '../services/crm.service'; // Importar servicios B2B
import './LeadCard.css';

// --- DICCIONARIO DE ESTADOS (Usando las claves de STATUS) ---
// PORQUÉ: La Card debe saber qué color usar en base al código de status de la BD. 
// Usar las constantes aquí asegura que el mapping BD -> UI siempre funcione.
const ESTADOS = {
  [STATUS.LEAD_NEW]: { label: '🆕 Nuevo', color: '#3b82f6', bg: '#eff6ff' },
  [STATUS.LEAD_CONTACTED]: { label: '📞 Contactado', color: '#8b5cf6', bg: '#f5f3ff' },
  [STATUS.LEAD_VISIT_SCHEDULED]: { label: '📅 Visita Agendada', color: '#f59e0b', bg: '#fffbeb' },
  [STATUS.LEAD_VISIT_CONFIRMED]: { label: '✅ Visita Confirmada', color: '#059669', bg: '#ecfdf5' },
  [STATUS.LEAD_VISITED]: { label: '👀 Ya Visitó', color: '#0d9488', bg: '#f0fdfa' },
  [STATUS.LEAD_RESERVED]: { label: '📝 Apartado', color: '#db2777', bg: '#fdf2f8' },
  [STATUS.LEAD_WON]: { label: '💰 Vendido', color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
  [STATUS.LEAD_LOST]: { label: '❌ Perdido', color: '#dc2626', bg: '#fef2f2' },
  [STATUS.LEAD_CLOSED]: { label: '📜 Escriturado', color: '#1e293b', bg: '#e5e7eb' },
  [STATUS.LEAD_PENDING_ADMIN]: { label: '⏳ Pendiente Admin', color: '#9ca3af', bg: '#f3f4f6' },
  [STATUS.LEAD_PENDING_ASSIGNMENT]: { label: '🤖 Asignando...', color: '#6366f1', bg: '#e0e7ff' },

  // 🟢 NUEVOS ESTADOS
  [STATUS.LEAD_PENDING_DEVELOPER_CONTACT]: { label: '⚠️ Reportar a Dev', color: '#b91c1c', bg: '#fee2e2', border: '#f87171' },
  [STATUS.LEAD_REPORTED]: { label: '📤 Reportado', color: '#d97706', bg: '#ffedd5', border: '#fbbf24' },
  [STATUS.LEAD_ASSIGNED_EXTERNAL]: { label: '👤 Asignado Externo', color: '#4338ca', bg: '#e0e7ff', border: '#a5b4fc' }
};

// --- ICONOS ---
const Icons = {
  Phone: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Whatsapp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
  Time: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  ArrowRight: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
};

export default function LeadCard({ lead, onAction }) {
  // Configuración visual según el estado actual. Usamos la clave del lead como índice.
  // PORQUÉ: Si el status del lead no coincide con ninguna clave de ESTADOS, 
  // se usa un fallback seguro (STATUS.LEAD_NEW).
  const configEstado = ESTADOS[lead.status] || ESTADOS[STATUS.LEAD_NEW];

  // Formato de fecha amigable (Added simplified mock function if not available, or assume it works)
  // Assuming formatDate is globally available or imported, but it wasn't in the original imports?
  // Original code tried to use formatDate in line 114 but defined getTiempoTranscurrido in line 44.
  // I will assume formatDate was missing or intended to be getTiempoTranscurrido or similar.
  // Wait, line 114 uses formatDate(lead.fechaCreacion). But formatDate is NOT defined in original file.
  // I will replace it with a simple creation date formatter or just reuse getTiempoTranscurrido if appropriate,
  // but better to fix the reference error if it existed. I'll define a helper.
  const formatDate = (date) => {
    if (!date) return '';
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  const getTiempoTranscurrido = (fecha) => {
    // PORQUÉ: Verificamos si es un Timestamp de Firestore (objeto con .toDate) 
    // o una cadena (ej. el historial antiguo).
    if (!fecha) return 'Reciente';

    let targetDate;
    if (fecha.toDate) { // Si es un Timestamp de Firestore
      targetDate = fecha.toDate();
    } else { // Si es una cadena ISO (ej. el historial)
      targetDate = new Date(fecha);
    }

    const diff = new Date() - targetDate;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${Math.floor(horas / 24)}d`;
  };

  return (
    <div className="lead-card">

      {/* 1. HEADER: Nombre y Estado */}
      <div className="lead-card__header">
        <div>
          <h3 className="lead-card__name">{lead.clienteDatos?.nombre || 'Cliente Nuevo'}</h3>
          <span className="lead-card__time-tag">
            <Icons.Time /> {getTiempoTranscurrido(lead.fechaUltimaInteraccion)}
          </span>
        </div>
        <span
          className="lead-card__status-badge"
          style={{
            backgroundColor: configEstado.bg,
            color: configEstado.color,
            border: configEstado.border ? `1px solid ${configEstado.border}` : 'none'
          }}
        >
          {configEstado.label}
        </span>
      </div>

      {/* 2. BODY: Interés e Info */}
      <div className="lead-card__body">
        <div className="lead-card__interest-box">
          <span className="lead-card__label">Interesado en:</span>
          <p className="lead-card__value">{lead.nombreDesarrollo || 'Desarrollo General'}</p>
          <p className="lead-card__sub-value">{lead.modeloInteres || 'Modelo por definir'}</p>
        </div>

        {/* Botones de Contacto Rápido */}
        <div className="lead-card__contact-row">
          {lead.clienteDatos?.telefono && (
            <a
              href={`https://wa.me/52${lead.clienteDatos.telefono}?text=Hola ${lead.clienteDatos.nombre}, soy tu asesor de Inmueble Advisor...`}
              target="_blank"
              rel="noopener noreferrer"
              className="lead-card__whatsapp-btn"
            >
              <Icons.Whatsapp /> WhatsApp
            </a>
          )}
          {lead.clienteDatos?.telefono && (
            <a href={`tel:${lead.clienteDatos.telefono}`} className="lead-card__phone-btn">
              <Icons.Phone />
            </a>
          )}
        </div>
      </div>

      <div className="lead-card__footer">
        <span className="lead-card__fecha">Creado: {formatDate(lead.fechaCreacion)}</span>
      </div>

      {/* --- SECCIÓN B2B: FINANCIAL & MILESTONES --- */}
      {lead.status === STATUS.LEAD_ASSIGNED_EXTERNAL && (
        <div className="lead-card__b2b-section">

          {/* 1. BADGE FINANCIERO */}
          <div className="lead-card__financial-badge">
            <span>💰 Comisión Estimada:</span>
            <strong className="lead-card__financial-amount">
              $ {Math.round(calcularComisionEstimada(lead.precioPresupuesto || 0, { porcentaje: 3.5 })).toLocaleString()}
            </strong>
            {/* Nota: En prod, pasar la policy real del desarrollo, aquí hardcoded 3.5% como default o leer de 'lead.desarrolloData' */}
          </div>

          {/* 2. CHECKLIST DE HITOS */}
          <div className="lead-card__milestone-checklist">
            <p className="lead-card__milestone-title">🏁 Seguimiento de Cierre:</p>
            {['Apartado', 'Crédito Aprobado', 'Promesa Compraventa', 'Escrituración'].map((hito) => {
              const alcanzado = lead.seguimientoB2B?.hitosAlcanzados?.some(h => h.hito === hito);
              return (
                <div key={hito} className="lead-card__milestone-item">
                  <input
                    type="checkbox"
                    checked={alcanzado}
                    disabled={alcanzado} // Una vez marcado, safe
                    onChange={() => {
                      if (confirm(`¿Confirmas que se alcanzó el hito: ${hito}?`)) {
                        registrarHito(lead.id, hito, 'admin_user'); // TODO: Pass real user ID
                        // Trigger callback or force refresh if needed
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{
                    color: alcanzado ? '#166534' : '#666',
                    textDecoration: alcanzado ? 'none' : 'none',
                    fontWeight: alcanzado ? '600' : '400'
                  }}>
                    {hito}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
