// src/components/LeadCard.jsx
import React from 'react';
// ✅ Importamos las constantes para usar los códigos universales
import { STATUS } from '../config/constants'; 

// --- DICCIONARIO DE ESTADOS (Usando las nuevas claves) ---
// Mapeamos los códigos de STATUS de la BD a la representación visual.
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
  [STATUS.LEAD_PENDING_ASSIGNMENT]: { label: '🤖 Asignando...', color: '#6366f1', bg: '#e0e7ff' }
};

// --- ICONOS ---
const Icons = {
  Phone: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Whatsapp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
  Time: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ArrowRight: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
};

export default function LeadCard({ lead, onAction }) {
  // Configuración visual según el estado actual
  const configEstado = ESTADOS[lead.status] || ESTADOS[STATUS.LEAD_NEW];
  
  // Formato de fecha amigable (Ahora trabaja con Firestore Timestamp o ISO string)
  const getTiempoTranscurrido = (fecha) => {
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
    <div style={styles.card}>
      
      {/* 1. HEADER: Nombre y Estado */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.name}>{lead.clienteDatos?.nombre || 'Cliente Nuevo'}</h3>
          <span style={styles.timeTag}>
            <Icons.Time /> {getTiempoTranscurrido(lead.fechaUltimaInteraccion)}
          </span>
        </div>
        <span 
          style={{
            ...styles.statusBadge, 
            backgroundColor: configEstado.bg, 
            color: configEstado.color,
            border: configEstado.border ? `1px solid ${configEstado.border}` : 'none'
          }}
        >
          {configEstado.label}
        </span>
      </div>

      {/* 2. BODY: Interés e Info */}
      <div style={styles.body}>
        <div style={styles.interestBox}>
          <span style={styles.label}>Interesado en:</span>
          <p style={styles.value}>{lead.nombreDesarrollo || 'Desarrollo General'}</p>
          <p style={styles.subValue}>{lead.modeloInteres || 'Modelo por definir'}</p>
        </div>

        {/* Botones de Contacto Rápido */}
        <div style={styles.contactRow}>
          {lead.clienteDatos?.telefono && (
            <a 
              href={`https://wa.me/52${lead.clienteDatos.telefono}?text=Hola ${lead.clienteDatos.nombre}, soy tu asesor de Inmueble Advisor...`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsAppBtn}
            >
              <Icons.Whatsapp /> WhatsApp
            </a>
          )}
          {lead.clienteDatos?.telefono && (
            <a href={`tel:${lead.clienteDatos.telefono}`} style={styles.phoneBtn}>
              <Icons.Phone />
            </a>
          )}
        </div>
      </div>

      {/* 3. FOOTER: Acción Principal (Avanzar Embudo) */}
      <button 
        onClick={() => onAction(lead)} 
        style={styles.actionButton}
      >
        Gestionar / Avanzar <Icons.ArrowRight />
      </button>

    </div>
  );
}

// --- ESTILOS (Sin cambios) ---
const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #f3f4f6',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default'
  },
  header: {
    padding: '16px 16px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #f9fafb'
  },
  name: {
    margin: '0 0 4px 0',
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1f2937'
  },
  timeTag: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  body: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  interestBox: {
    backgroundColor: '#f9fafb',
    padding: '10px',
    borderRadius: '8px'
  },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: '2px'
  },
  value: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#374151'
  },
  subValue: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#6b7280'
  },
  contactRow: {
    display: 'flex',
    gap: '10px'
  },
  whatsAppBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#25D366',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
    textDecoration: 'none',
    boxShadow: '0 2px 5px rgba(37, 211, 102, 0.2)'
  },
  phoneBtn: {
    width: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    color: '#374151',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  actionButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};