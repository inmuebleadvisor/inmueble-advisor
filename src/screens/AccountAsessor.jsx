// src/screens/AccountAsessor.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '../context/UserContext';
// ✅ Importaciones modulares y STATUS para consistencia
import { hidratarInventarioAsesor } from '../services/catalog.service'; 
import { obtenerLeadsAsignados } from '../services/crm.service'; // Mantenemos para carga inicial/manual si es necesario
import { calcularEstadisticasAsesor } from '../services/analytics.service'; 
import { generarLeadAutomatico } from '../services/leadAssignmentService';
import { STATUS } from '../config/constants';

import LeadCard from '../components/LeadCard'; 
import LeadActionModal from '../components/LeadActionModal'; 

// Importación de Firestore necesaria para onSnapshot
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'; 
import { db } from '../firebase/config';

// Gráficos
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// --- ICONOS (Sin cambios) ---
const Icons = {
  Crown: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>,
  Lock: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Wallet: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>,
  Test: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>,
  History: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  ChevronDown: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>,
  ChevronUp: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
};

export default function AccountAsesor() {
  const { user, userProfile } = useUser();
  
  // Estados de Datos
  const [inventario, setInventario] = useState([]);
  const [leads, setLeads] = useState([]); 
  const [stats, setStats] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  // Estados UI
  const [leadToEdit, setLeadToEdit] = useState(null); 
  const [simulando, setSimulando] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // --- 1. FUNCIÓN DE CÁLCULO DE MÉTRICAS (Depende de Leads) ---
  const calcularMetricas = useCallback((leadsData) => {
    // PORQUÉ: Recalcular las métricas (Score) cada vez que la lista de leads cambia
    // es crucial para mantener la información del dashboard actualizada.
    const metricasCalculadas = calcularEstadisticasAsesor(leadsData);
    setStats(metricasCalculadas);
  }, []);

  // --- 2. LISTENERS EN TIEMPO REAL (onSnapshot) ---
  useEffect(() => {
    // PORQUÉ: Verificamos si el usuario es un asesor y su UID está disponible
    if (!user?.uid || userProfile?.role !== 'asesor') {
      setLoading(false);
      return;
    }

    // A. ESCUCHA DE LEADS (Live Data)
    // Ya no usamos obtenerLeadsAsignados (que es getDocs). Usamos onSnapshot.
    const q = query(
      collection(db, "leads"), 
      where("asesorUid", "==", user.uid),
      orderBy("fechaUltimaInteraccion", "desc") // Ordenamos por interacción más reciente
    );

    // PORQUÉ: onSnapshot crea una conexión activa. Cada vez que un lead 
    // cambie (ej. el backend lo asigna o el asesor lo gestiona), se actualiza 
    // el estado local, eliminando la necesidad de recarga manual/setTimeout.
    const unsubscribeLeads = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(leadsData);
      calcularMetricas(leadsData); // Recalculamos métricas con los nuevos leads
    }, (error) => {
      console.error("Error en la escucha de leads:", error);
    });

    // B. CARGA ÚNICA DE INVENTARIO
    const cargarInventario = async () => {
      if (userProfile?.inventario) {
         try {
           const dataInv = await hidratarInventarioAsesor(userProfile.inventario);
           setInventario(dataInv);
         } catch (err) {
           console.error("Error cargando inventario:", err);
         }
      }
      setLoading(false);
    };

    cargarInventario();

    // Cleanup function: Se ejecuta cuando el componente se desmonta o las dependencias cambian
    // Esto es CRÍTICO para prevenir fugas de memoria en la conexión de Firestore.
    return () => {
      unsubscribeLeads(); 
    };

  }, [user?.uid, userProfile, calcularMetricas]); // Dependencias para re-ejecutar el efecto


  // --- HANDLERS ---
  const handleSimularLead = async () => {
    // ✅ CORRECCIÓN 1: Inventario ahora usa el booleano 'activo'
    const desarrolloActivo = inventario.find(i => i.activo === true);
    if (!desarrolloActivo) return alert("❌ Error: No tienes inventario ACTIVO.");

    setSimulando(true);
    try {
        const fakeId = Math.floor(Math.random() * 9000) + 1000;
        const datosCliente = {
            nombre: `Prospecto #${fakeId}`,
            email: `cliente${fakeId}@mail.com`,
            telefono: `55${fakeId}0000`
        };
        
        const resultado = await generarLeadAutomatico(
            datosCliente, 
            desarrolloActivo.idDesarrollo, 
            desarrolloActivo.nombre, 
            "Modelo Prototipo"
        );

        if (resultado.success) {
            alert(`🔔 Solicitud enviada para:\n${datosCliente.nombre}\n\nEl sistema de asignación está procesando la solicitud.`);
            // PORQUÉ: Ya no necesitamos un setTimeout. El onSnapshot (Task 2.4)
            // se encargará de actualizar la lista automáticamente cuando el backend
            // complete la asignación.
        } else {
            alert(`Error al generar lead: ${resultado.error}`);
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión al simular lead.");
    } finally {
        setSimulando(false);
    }
  };
  
  const handleModalSuccess = () => {
    // PORQUÉ: Cuando el modal se cierra, onSnapshot actualizará la lista 
    // y recalculará las métricas automáticamente. No necesitamos ninguna acción.
    setLeadToEdit(null);
  };

  // --- FILTROS Y DATOS CALCULADOS ---
  // ✅ Usamos useMemo para evitar recálculos innecesarios en cada render.
  const leadsFinalizados = [STATUS.LEAD_WON, STATUS.LEAD_LOST, STATUS.LEAD_CLOSED];
  const activeLeads = useMemo(() => leads.filter(l => !leadsFinalizados.includes(l.status)), [leads]);
  const historyLeads = useMemo(() => leads.filter(l => leadsFinalizados.includes(l.status)), [leads]);

  // Datos
  const score = userProfile?.scoreGlobal || 80;
  const nivel = score >= 90 ? 'Elite' : (score >= 80 ? 'Pro' : 'Rookie');
  
  const chartData = stats ? [
    { name: 'Activos', value: stats.activos, color: '#3b82f6' },
    { name: 'Cerrados', value: stats.ganados, color: '#10b981' },
    { name: 'Perdidos', value: stats.totalLeads - (stats.activos + stats.ganados), color: '#e5e7eb' },
  ] : [];

  const formatoDinero = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  if (loading) return <div style={styles.loaderContainer}>Cargando...</div>;

  return (
    <div className="main-content animate-fade-in" style={styles.container}>
      
      {/* 1. HERO CARD */}
      <header style={styles.heroCard}>
        <div style={styles.heroContent}>
          <div style={styles.userInfo}>
            <div style={styles.avatarBig}>{userProfile?.nombre?.charAt(0)}</div>
            <div>
              <h1 style={styles.userName}>{userProfile?.nombre}</h1>
              <div style={styles.userRoleBadge}><Icons.Crown /> Asesor {nivel}</div>
            </div>
          </div>
          
          <div style={styles.scoreBlock}>
            <div style={styles.scoreCircle}>
              <span style={styles.scoreNumber}>{score}</span>
              <span style={styles.scoreLabel}>SCORE</span>
            </div>
            <div style={styles.scoreMeta}>
              <span>Tasa Cierre: <strong>{stats?.tasaCierre || 0}%</strong></span>
              <span>Reseñas: <strong>{userProfile?.metricas?.promedioResenas || 0}★</strong></span>
            </div>
          </div>
        </div>
        <div style={styles.heroDecoration}></div>
      </header>

      {/* 2. GRID PRINCIPAL (Adaptable por Estado) */}
      <div style={{
        ...styles.dashboardLayout,
        gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr'
      }}>
        
        {/* LEADS ACTIVOS */}
        <main style={styles.mainColumn}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <Icons.Users /> Por Atender <span style={styles.countBadge}>{activeLeads.length}</span>
            </h2>
            <button onClick={handleSimularLead} disabled={simulando} style={styles.btnTest} title="Simular entrada de lead nuevo">
               {simulando ? '...' : <Icons.Test />}
            </button>
          </div>

          {activeLeads.length === 0 ? (
            <div style={styles.emptyState}>
              <p>Estás al día. Sin leads pendientes.</p>
            </div>
          ) : (
            <div style={styles.leadsStack}>
              {activeLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onAction={setLeadToEdit} />
              ))}
            </div>
          )}

          {/* HISTORIAL */}
          {historyLeads.length > 0 && (
            <div style={styles.historySection}>
              <button onClick={() => setShowHistory(!showHistory)} style={styles.historyToggleBtn}>
                <div style={{display:'flex', gap:'10px'}}><Icons.History /> Historial ({historyLeads.length})</div>
                {showHistory ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
              </button>
              {showHistory && (
                <div style={styles.leadsStack}>
                  {historyLeads.map(lead => (
                    <div key={lead.id} style={{opacity: 0.7}}>
                      <LeadCard lead={lead} onAction={setLeadToEdit} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* BARRA LATERAL */}
        <aside style={styles.sideColumn}>
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statLabel}>Ventas Acumuladas</span>
              <Icons.Wallet />
            </div>
            <div style={styles.statValue}>{stats ? formatoDinero(stats.totalVendido) : '$0'}</div>
            <div style={{height: '100px', width: '100%'}}>
               <ResponsiveContainer>
                 <PieChart>
                   <Pie data={chartData} innerRadius={30} outerRadius={45} dataKey="value">
                     {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                   </Pie>
                   <RechartsTooltip />
                 </PieChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.inventoryWidget}>
            <h3 style={styles.widgetTitle}>Mi Inventario</h3>
            <div style={styles.inventoryList}>
              {inventario.map((item, idx) => (
                <div key={idx} style={styles.invItem}>
                  {/* ✅ CORRECCIÓN 3: Inventario utiliza el booleano 'activo' */}
                  <div style={{...styles.statusDot, backgroundColor: item.activo ? '#10b981' : '#f59e0b'}} />
                  <div style={{flex: 1}}>
                    <div style={styles.invName}>{item.nombre}</div>
                    <div style={styles.invStatus}>{item.activo ? 'Activo' : 'Pendiente'}</div>
                  </div>
                  {!item.activo && <Icons.Lock />}
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {leadToEdit && (
        // Usamos la nueva función handleModalSuccess que ya no requiere recarga manual
        <LeadActionModal lead={leadToEdit} onClose={() => setLeadToEdit(null)} onSuccess={handleModalSuccess} />
      )}
    </div>
  );
}

// --- ESTILOS (Sin cambios) ---
const styles = {
  container: { paddingBottom: '80px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh' },
  loaderContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#64748b' },
  
  heroCard: { 
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
    margin: '20px', borderRadius: '24px', padding: '25px', color: 'white', 
    position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
  },
  heroContent: { position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' },
  heroDecoration: { position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: 1 },
  
  userInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  avatarBig: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.2)' },
  userName: { margin: 0, fontSize: '1.5rem', fontWeight: '700', lineHeight: 1.2 },
  userRoleBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', marginTop: '5px' },

  scoreBlock: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px 15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' },
  scoreCircle: { width: '50px', height: '50px', borderRadius: '50%', border: '3px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  scoreNumber: { fontSize: '1.2rem', fontWeight: '800', color: '#10b981' },
  scoreLabel: { fontSize: '0.45rem', textTransform: 'uppercase' },
  scoreMeta: { display: 'flex', flexDirection: 'column', fontSize: '0.75rem', opacity: 0.9 },

  dashboardLayout: { display: 'grid', gap: '25px', padding: '0 20px', maxWidth: '1200px', margin: '0 auto' },
  mainColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '1.3rem', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', gap: '10px' },
  countBadge: { backgroundColor: '#e2e8f0', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px' },
  btnTest: { background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' },
  
  emptyState: { textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '20px', border: '1px dashed #cbd5e1' },
  leadsStack: { display: 'flex', flexDirection: 'column', gap: '15px' },

  historySection: { marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' },
  historyToggleBtn: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },

  sideColumn: { display: 'flex', flexDirection: 'column', gap: '25px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  statHeader: { display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '10px' },
  statLabel: { fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' },
  chartLegend: { display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' },

  inventoryWidget: { backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  widgetTitle: { fontSize: '1rem', fontWeight: '700', color: '#334155', margin: '0 0 15px 0' },
  inventoryList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  invItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  invName: { fontSize: '0.85rem', fontWeight: '600', color: '#334155' },
  invStatus: { fontSize: '0.7rem', color: '#94a3b8' },
  lockIcon: { color: '#f59e0b' }
};