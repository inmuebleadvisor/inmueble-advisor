// src/components/LeadActionModal.jsx
import React, { useState } from 'react';
import { actualizarEstadoLead } from '../services/dataService';

// Opciones del Embudo (Orden lógico)
const OPCIONES_ESTADO = [
  { val: 'contactado', label: '📞 Contactado' },
  { val: 'visita_agendada', label: '📅 Visita Agendada' },
  { val: 'visita_confirmada', label: '✅ Visita Confirmada' },
  { val: 'visito', label: '👀 Ya Visitó' },
  { val: 'apartado', label: '📝 Apartado' },
  { val: 'vendido', label: '💰 Vendido (Cierre)' },
  { val: 'perdido', label: '❌ Perdido / Descartado' }
];

export default function LeadActionModal({ lead, onClose, onSuccess }) {
  // Estados del Formulario
  const [nuevoEstado, setNuevoEstado] = useState(lead.status);
  const [notas, setNotas] = useState('');
  
  // Datos Obligatorios Condicionales
  const [montoVenta, setMontoVenta] = useState('');
  const [modeloVendido, setModeloVendido] = useState(lead.modeloInteres || '');
  const [motivoPerdida, setMotivoPerdida] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LÓGICA DE GUARDADO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validaciones de Negocio
    if (nuevoEstado === 'vendido') {
      if (!montoVenta || montoVenta <= 0) return alert("Para marcar como vendido, el monto real es obligatorio.");
      if (!modeloVendido) return alert("Debes especificar qué modelo se vendió.");
    }
    if (nuevoEstado === 'perdido' && !motivoPerdida) {
      return alert("Por favor indica el motivo de pérdida para mejorar la calidad de leads.");
    }

    setIsSubmitting(true);
    try {
      // 2. Preparar Datos Extra
      const datosExtra = {
        monto: nuevoEstado === 'vendido' ? Number(montoVenta) : null,
        modelo: nuevoEstado === 'vendido' ? modeloVendido : null,
        motivo: nuevoEstado === 'perdido' ? motivoPerdida : null,
        notas: notas // Bitácora (Fase 3)
      };

      // 3. Llamar al Servicio (Firebase)
      await actualizarEstadoLead(lead.id, nuevoEstado, datosExtra);
      
      // 4. Feedback y Cierre
      onSuccess(); // Recarga la lista en el padre
      onClose();   // Cierra el modal
      
    } catch (error) {
      console.error("Error actualizando lead:", error);
      alert("No se pudo actualizar el estado. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        <div style={styles.header}>
          <h3 style={styles.title}>Gestionar Lead</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        <div style={styles.leadSummary}>
          <strong>Cliente:</strong> {lead.clienteDatos?.nombre}<br/>
          <span style={{fontSize:'0.85rem', color:'#666'}}>
            Interés: {lead.nombreDesarrollo}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* SELECTOR DE ESTADO */}
          <div style={styles.group}>
            <label style={styles.label}>Nuevo Estado:</label>
            <select 
              value={nuevoEstado} 
              onChange={(e) => setNuevoEstado(e.target.value)}
              style={styles.select}
            >
              <option value={lead.status} disabled>-- Estado Actual --</option>
              {OPCIONES_ESTADO.map(opt => (
                <option key={opt.val} value={opt.val}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* CAMPOS CONDICIONALES: VENTA */}
          {nuevoEstado === 'vendido' && (
            <div style={styles.conditionalBoxGreen}>
              <h4 style={styles.condTitle}>🎉 ¡Felicidades por el cierre!</h4>
              <p style={styles.condText}>Estos datos son necesarios para calcular tus comisiones y score.</p>
              
              <div style={styles.group}>
                <label style={styles.label}>Precio Final de Venta ($):</label>
                <input 
                  type="number" 
                  placeholder="Ej: 2500000"
                  value={montoVenta}
                  onChange={(e) => setMontoVenta(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.group}>
                <label style={styles.label}>Modelo Vendido:</label>
                <input 
                  type="text" 
                  placeholder="Ej: Modelo Águila"
                  value={modeloVendido}
                  onChange={(e) => setModeloVendido(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          )}

          {/* CAMPOS CONDICIONALES: PÉRDIDA */}
          {nuevoEstado === 'perdido' && (
            <div style={styles.conditionalBoxRed}>
              <h4 style={styles.condTitleRed}>Cierre de Expediente</h4>
              <div style={styles.group}>
                <label style={styles.label}>Motivo de pérdida:</label>
                <select 
                  value={motivoPerdida} 
                  onChange={(e) => setMotivoPerdida(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">Selecciona un motivo...</option>
                  <option value="sin_presupuesto">Presupuesto insuficiente</option>
                  <option value="zona">No le gustó la ubicación</option>
                  <option value="competencia">Compró con la competencia</option>
                  <option value="sin_interes">Ya no está interesado</option>
                  <option value="datos_falsos">No contesta / Datos erróneos</option>
                </select>
              </div>
            </div>
          )}

          {/* BOTONES */}
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancelar</button>
            <button 
              type="submit" 
              disabled={isSubmitting || nuevoEstado === lead.status}
              style={{
                ...styles.btnSubmit,
                opacity: (isSubmitting || nuevoEstado === lead.status) ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Guardando...' : 'Actualizar Estado'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' },
  modal: { backgroundColor: 'white', width: '90%', maxWidth: '450px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' },
  header: { padding: '15px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#111' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' },
  leadSummary: { padding: '15px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6', fontSize: '0.95rem' },
  form: { padding: '20px' },
  group: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600', color: '#374151' },
  select: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', backgroundColor: 'white' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' },
  
  conditionalBoxGreen: { backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '15px' },
  condTitle: { margin: '0 0 10px 0', fontSize: '0.95rem', color: '#166534' },
  condText: { fontSize: '0.8rem', color: '#15803d', marginBottom: '10px' },
  
  conditionalBoxRed: { backgroundColor: '#fef2f2', padding: '15px', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '15px' },
  condTitleRed: { margin: '0 0 10px 0', fontSize: '0.95rem', color: '#991b1b' },

  actions: { display: 'flex', gap: '10px', marginTop: '10px' },
  btnCancel: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600', color: '#374151' },
  btnSubmit: { flex: 2, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }
};