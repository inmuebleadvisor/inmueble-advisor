// src/screens/AccountAsesor.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { obtenerInventarioDesarrollos } from '../services/dataService';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- ICONOS ---
const Icons = {
  Trophy: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8m-4-9v9m-2.062-5.36L15 15.586l4.939-4.939a2.939 2.939 0 0 0-4.158-4.158L10 10.586l-2.781-2.781a2.939 2.939 0 0 0-4.158 4.158L8 16.94z"/></svg>,
  Edit: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Clock: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
};

export default function AccountAsesor() {
  const { user, userProfile } = useUser();
  
  // Estados
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null); // Item siendo editado
  
  // Formulario de edición
  const [formData, setFormData] = useState({ precio: '', disponibilidad: 'inmediata', notas: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. CARGA DE DATOS (Hidratar el inventario del usuario con nombres reales)
  useEffect(() => {
    const cargarDatos = async () => {
      if (userProfile?.inventario) {
        const catalogoGlobal = await obtenerInventarioDesarrollos();
        
        // Cruzamos los IDs del usuario con el catálogo global para obtener nombres
        const miInventario = userProfile.inventario.map(item => {
          if (item.tipo === 'db') {
            const dataReal = catalogoGlobal.find(d => d.id === item.idDesarrollo);
            return { ...item, ...dataReal };
          }
          return { ...item, nombre: item.nombreManual, constructora: item.constructoraManual };
        });
        
        setInventario(miInventario);
      }
      setLoading(false);
    };
    cargarDatos();
  }, [userProfile]);

  // 2. MANEJO DE ACTUALIZACIONES (SOLICITUD AL ADMIN)
  const handleUpdateClick = (item) => {
    setEditingItem(item);
    setFormData({ precio: '', disponibilidad: 'inmediata', notas: '' });
  };

  const enviarSolicitud = async () => {
    setIsSubmitting(true);
    try {
      // EN LUGAR DE ACTUALIZAR, CREAMOS UNA SOLICITUD EN 'requests'
      await addDoc(collection(db, "solicitudes_cambios"), {
        asesorUid: user.uid,
        asesorNombre: userProfile.nombre,
        desarrolloId: editingItem.id || editingItem.nombreManual, // ID o Nombre si es manual
        nombreDesarrollo: editingItem.nombre,
        cambiosSolicitados: formData,
        status: 'pendiente', // 🔒 EL ADMIN DEBE APROBAR ESTO
        fecha: serverTimestamp()
      });

      alert("Solicitud enviada al administrador. Tus cambios se reflejarán una vez aprobados.");
      setEditingItem(null); // Cerrar modal
    } catch (error) {
      console.error("Error enviando solicitud:", error);
      alert("Error al enviar solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Cargando tu perfil...</div>;

  return (
    <div className="main-content" style={styles.container}>
      
      {/* HEADER DASHBOARD */}
      <header style={styles.header}>
        <div style={styles.welcomeRow}>
          <div style={styles.avatar}>{userProfile?.nombre?.charAt(0)}</div>
          <div>
            <h1 style={styles.title}>Hola, {userProfile?.nombre}</h1>
            <p style={styles.subtitle}>Panel de Asesor Certificado</p>
          </div>
        </div>

        {/* SCORE CARD */}
        <div style={styles.scoreCard}>
          <div style={styles.scoreHeader}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <Icons.Trophy />
              <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>Tu Score de Calidad</span>
            </div>
            <span style={styles.scoreValue}>98/100</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{...styles.progressBarFill, width: '98%'}}></div>
          </div>
          <div style={styles.scoreMetrics}>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Leads Asignados</span>
              <span style={styles.metricVal}>12</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Tasa de Respuesta</span>
              <span style={styles.metricVal}>4 min</span>
            </div>
            <div style={styles.metric}>
              <span style={styles.metricLabel}>Reseñas</span>
              <span style={styles.metricVal}>4.9 ★</span>
            </div>
          </div>
        </div>
      </header>

      {/* INVENTARIO ACTIVO */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Tu Inventario Asignado</h2>
        <p style={styles.sectionDesc}>Estos son los desarrollos donde estás autorizado para recibir leads.</p>

        <div style={styles.inventoryGrid}>
          {inventario.map((item, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.badge}>{item.tipo === 'db' ? 'Verificado' : 'Manual'}</span>
                {item.tipo === 'db' && <span style={styles.statusDot}>● Activo</span>}
              </div>
              
              <h3 style={styles.cardTitle}>{item.nombre}</h3>
              <p style={styles.cardSubtitle}>{item.constructora}</p>
              <p style={styles.cardLoc}>{item.ciudad}</p>

              <div style={styles.cardActions}>
                <button 
                  onClick={() => handleUpdateClick(item)}
                  style={styles.btnUpdate}
                >
                  <Icons.Edit /> Solicitar Actualización
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL DE EDICIÓN */}
      {editingItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Actualizar: {editingItem.nombre}</h3>
            <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'20px'}}>
              Los cambios deben ser validados por administración para asegurar la calidad de los datos.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nuevo Precio (Desde)</label>
              <input 
                type="number" 
                style={styles.input} 
                placeholder="Ej. 2500000"
                value={formData.precio}
                onChange={e => setFormData({...formData, precio: e.target.value})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Disponibilidad</label>
              <select 
                style={styles.input}
                value={formData.disponibilidad}
                onChange={e => setFormData({...formData, disponibilidad: e.target.value})}
              >
                <option value="inmediata">Entrega Inmediata</option>
                <option value="preventa">Pre-Venta</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notas para el Admin</label>
              <textarea 
                style={{...styles.input, height:'80px'}} 
                placeholder="Explica qué cambió (Ej. Nueva torre abierta...)"
                value={formData.notas}
                onChange={e => setFormData({...formData, notas: e.target.value})}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setEditingItem(null)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={enviarSolicitud} disabled={isSubmitting} style={styles.btnSubmit}>
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ESTILOS
const styles = {
  container: { paddingBottom: '80px', fontFamily: "'Segoe UI', sans-serif" },
  header: { backgroundColor: 'white', padding: '30px 20px', borderBottom: '1px solid #e5e7eb', marginBottom: '30px' },
  welcomeRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
  avatar: { width: '50px', height: '50px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' },
  title: { margin: 0, fontSize: '1.5rem', color: '#111' },
  subtitle: { margin: 0, color: '#6b7280', fontSize: '0.9rem' },
  
  scoreCard: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', color: 'white', boxShadow: '0 10px 25px rgba(30, 41, 59, 0.2)' },
  scoreHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  scoreValue: { fontSize: '1.5rem', fontWeight: '800', color: '#4ade80' },
  progressBarBg: { height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginBottom: '20px' },
  progressBarFill: { height: '100%', backgroundColor: '#4ade80', borderRadius: '4px' },
  scoreMetrics: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' },
  metricLabel: { display: 'block', fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' },
  metricVal: { fontSize: '1.1rem', fontWeight: 'bold' },

  section: { padding: '0 20px' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '800', color: '#111', marginBottom: '5px' },
  sectionDesc: { color: '#666', fontSize: '0.9rem', marginBottom: '20px' },
  
  inventoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  badge: { fontSize: '0.7rem', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', color: '#4b5563' },
  statusDot: { fontSize: '0.75rem', color: '#10b981', fontWeight: '600' },
  cardTitle: { margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#111' },
  cardSubtitle: { margin: 0, color: '#6b7280', fontSize: '0.9rem' },
  cardLoc: { margin: '5px 0 15px 0', color: '#9ca3af', fontSize: '0.85rem' },
  
  cardActions: { borderTop: '1px solid #f3f4f6', paddingTop: '15px' },
  btnUpdate: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#eff6ff', color: 'var(--primary-color)', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(3px)' },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.9rem', color: '#374151' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  btnCancel: { flex: 1, padding: '12px', border: 'none', backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnSubmit: { flex: 2, padding: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};