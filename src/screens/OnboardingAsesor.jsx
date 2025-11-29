// src/screens/OnboardingAsesor.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// --- ICONOS ---
const Icons = {
  Search: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Check: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
};

export default function OnboardingAsesor() {
  const navigate = useNavigate();
  const { user, syncProfile } = useUser();

  // --- ESTADOS DE CONTROL ---
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isSaving, setIsSaving] = useState(false);
  
  // --- DATOS ---
  const [telefono, setTelefono] = useState('');
  
  // Inventario BD
  const [listaDB, setListaDB] = useState([]); // Base de datos completa
  const [seleccionadosDB, setSeleccionadosDB] = useState([]); // IDs seleccionados
  
  // Inventario Manual (Nuevo requerimiento)
  const [manuales, setManuales] = useState([]); // Array de objetos { id, nombre, constructora }
  const [nuevoManual, setNuevoManual] = useState({ nombre: '', constructora: '' });
  const [showManualForm, setShowManualForm] = useState(false);

  // Relaciones
  const [relaciones, setRelaciones] = useState({}); // { id: 'interno' | 'externo' }

  // UX Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('todos'); // 'todos', 'seleccionados'

  // --- 1. CARGA INICIAL ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const snap = await getDocs(collection(db, "desarrollos"));
        const data = snap.docs.map(d => ({
          id: d.id,
          nombre: d.data().nombre,
          constructora: d.data().constructora || 'Constructora General', // Asumimos campo
          ciudad: d.data().ubicacion?.ciudad || 'General'
        }));
        setListaDB(data);
      } catch (error) {
        console.error("Error loading inventory", error);
      }
    };
    cargarDatos();
  }, []);

  // --- LOGICA DE FILTRADO (MEMOIZADA) ---
  const listaVisible = useMemo(() => {
    let base = listaDB;

    // 1. Filtrar por texto (Nombre o Constructora)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      base = base.filter(item => 
        item.nombre.toLowerCase().includes(lower) || 
        item.constructora.toLowerCase().includes(lower)
      );
    }

    // 2. Filtrar por modo (Todos vs Seleccionados)
    if (filterMode === 'seleccionados') {
      base = base.filter(item => seleccionadosDB.includes(item.id));
    }

    return base;
  }, [listaDB, searchTerm, filterMode, seleccionadosDB]);

  // Total real seleccionado (BD + Manuales)
  const totalSeleccionados = seleccionadosDB.length + manuales.length;

  // --- HANDLERS ---

  const toggleDB = (id) => {
    setSeleccionadosDB(prev => {
      const exists = prev.includes(id);
      if (exists) {
        // Limpiamos relación al deseleccionar
        const newRel = { ...relaciones };
        delete newRel[id];
        setRelaciones(newRel);
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  const agregarManual = () => {
    if (!nuevoManual.nombre.trim() || !nuevoManual.constructora.trim()) return;
    const tempId = `manual_${Date.now()}`;
    setManuales([...manuales, { ...nuevoManual, id: tempId }]);
    setNuevoManual({ nombre: '', constructora: '' }); // Reset form
    setShowManualForm(false);
  };

  const borrarManual = (id) => {
    setManuales(prev => prev.filter(m => m.id !== id));
    const newRel = { ...relaciones };
    delete newRel[id];
    setRelaciones(newRel);
  };

  const setRelacionTipo = (id, tipo) => {
    setRelaciones(prev => ({ ...prev, [id]: tipo }));
  };

  // --- VALIDACIONES ---
  const isStepValid = () => {
    if (step === 1) return telefono.length >= 10;
    if (step === 2) return totalSeleccionados > 0;
    if (step === 3) {
      // Validar que TODOS (DB + Manuales) tengan relación definida
      const idsDB = seleccionadosDB;
      const idsManual = manuales.map(m => m.id);
      const todosLosIds = [...idsDB, ...idsManual];
      return todosLosIds.every(id => relaciones[id]);
    }
    return false;
  };

  // --- GUARDADO ---
  const handleFinalizar = async () => {
    setIsSaving(true);
    try {
      // Construimos el array unificado de inventario
      const inventarioDB = seleccionadosDB.map(id => ({
        idDesarrollo: id,
        origen: 'base_datos',
        tipoRelacion: relaciones[id],
        nombreBackup: listaDB.find(d => d.id === id)?.nombre // Por si acaso
      }));

      const inventarioManual = manuales.map(m => ({
        idDesarrollo: null, // No tiene ID en 'desarrollos'
        origen: 'manual',
        nombreManual: m.nombre,
        constructoraManual: m.constructora,
        tipoRelacion: relaciones[m.id],
        tempId: m.id
      }));

      const payload = {
        telefono,
        rol: 'asesor',
        onboardingCompleto: true,
        fechaRegistroAsesor: new Date().toISOString(),
        inventario: [...inventarioDB, ...inventarioManual]
      };

      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      await syncProfile();
      navigate('/perfil');

    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h2 style={styles.title}>Configura tu Perfil</h2>
            <div style={styles.stepBadge}>Paso {step}/{totalSteps}</div>
          </div>
          <div style={styles.progressTrack}>
            <div style={{...styles.progressBar, width: `${(step / totalSteps) * 100}%`}}></div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          
          {/* PASO 1: TELEFONO */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h3>Contacto 📱</h3>
              <p style={styles.desc}>Tu WhatsApp para recibir leads de clientes.</p>
              <input 
                type="tel"
                placeholder="55 1234 5678"
                value={telefono}
                onChange={e => setTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                style={styles.inputBig}
                maxLength={10}
                autoFocus
              />
            </div>
          )}

          {/* PASO 2: INVENTARIO INTELIGENTE */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h3>Selección de Inventario 🏢</h3>
              <p style={styles.desc}>Busca y selecciona lo que vendes.</p>

              {/* BUSCADOR Y FILTROS (STICKY) */}
              <div style={styles.stickyControls}>
                <div style={styles.searchBox}>
                  <Icons.Search />
                  <input 
                    type="text" 
                    placeholder="Buscar desarrollo o constructora..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                
                <div style={styles.filterTabs}>
                  <button 
                    onClick={() => setFilterMode('todos')}
                    style={filterMode === 'todos' ? styles.tabActive : styles.tab}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setFilterMode('seleccionados')}
                    style={filterMode === 'seleccionados' ? styles.tabActive : styles.tab}
                  >
                    Seleccionados <span style={styles.badgeCount}>{totalSeleccionados}</span>
                  </button>
                </div>
              </div>

              {/* LISTA DE RESULTADOS */}
              <div style={styles.listArea}>
                
                {/* 1. Lista de Manuales (Siempre arriba si hay) */}
                {(manuales.length > 0 && filterMode !== 'todos' ) && (
                  <div style={{marginBottom: '10px'}}>
                    <div style={styles.subHeader}>Agregados Manualmente</div>
                    {manuales.map(m => (
                      <div key={m.id} style={styles.manualItem}>
                        <div>
                          <div style={{fontWeight:'bold'}}>{m.nombre}</div>
                          <div style={{fontSize:'0.8rem', color:'#666'}}>{m.constructora} (Externo)</div>
                        </div>
                        <button onClick={() => borrarManual(m.id)} style={styles.trashBtn}><Icons.Trash /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Lista de Base de Datos */}
                {listaVisible.length === 0 ? (
                  <p style={{textAlign:'center', color:'#999', marginTop:'20px'}}>No encontramos resultados.</p>
                ) : (
                  listaVisible.map(item => {
                    const isSelected = seleccionadosDB.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleDB(item.id)}
                        style={{
                          ...styles.optionItem,
                          backgroundColor: isSelected ? '#eff6ff' : 'white',
                          borderColor: isSelected ? 'var(--primary-color)' : '#eee'
                        }}
                      >
                        <div style={{...styles.checkbox, backgroundColor: isSelected ? 'var(--primary-color)' : 'white'}}>
                          {isSelected && <Icons.Check />}
                        </div>
                        <div>
                          <div style={{fontWeight: 'bold', color: isSelected ? 'var(--primary-color)' : '#333'}}>{item.nombre}</div>
                          <div style={{fontSize: '0.8rem', color: '#666'}}>
                            {item.constructora} • {item.ciudad}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* AGREGAR MANUALMENTE */}
              <div style={styles.addManualSection}>
                {!showManualForm ? (
                  <button onClick={() => setShowManualForm(true)} style={styles.linkBtn}>
                    ¿No encuentras tu desarrollo? + Agrégalo aquí
                  </button>
                ) : (
                  <div style={styles.manualForm}>
                    <h4 style={{margin:'0 0 10px 0'}}>Nuevo Desarrollo</h4>
                    <input 
                      placeholder="Nombre del Desarrollo" 
                      value={nuevoManual.nombre}
                      onChange={e => setNuevoManual({...nuevoManual, nombre: e.target.value})}
                      style={styles.miniInput}
                    />
                    <input 
                      placeholder="Constructora" 
                      value={nuevoManual.constructora}
                      onChange={e => setNuevoManual({...nuevoManual, constructora: e.target.value})}
                      style={styles.miniInput}
                    />
                    <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                      <button onClick={agregarManual} style={styles.smallPrimaryBtn}>Agregar</button>
                      <button onClick={() => setShowManualForm(false)} style={styles.smallSecondaryBtn}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: RELACIONES */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h3>Define tu Relación 🤝</h3>
              <p style={styles.desc}>¿Cómo operas con cada uno?</p>
              
              <div style={styles.scrollArea}>
                {/* Combinamos DB y Manuales para iterar */}
                {[
                  ...seleccionadosDB.map(id => ({ ...listaDB.find(d => d.id === id), type: 'db' })),
                  ...manuales.map(m => ({ ...m, type: 'manual' }))
                ].map(item => (
                  <div key={item.id} style={styles.relationCard}>
                    <div style={styles.relationHeader}>
                      <span style={{fontWeight:'bold'}}>{item.nombre}</span>
                      {item.type === 'manual' && <span style={styles.tagManual}>Manual</span>}
                    </div>
                    
                    <div style={styles.toggleGroup}>
                      <button 
                        onClick={() => setRelacionTipo(item.id, 'interno')}
                        style={{
                          ...styles.toggleBtn,
                          backgroundColor: relaciones[item.id] === 'interno' ? 'var(--primary-color)' : '#f3f4f6',
                          color: relaciones[item.id] === 'interno' ? 'white' : '#64748b'
                        }}
                      >
                        Soy Interno
                      </button>
                      <button 
                        onClick={() => setRelacionTipo(item.id, 'externo')}
                        style={{
                          ...styles.toggleBtn,
                          backgroundColor: relaciones[item.id] === 'externo' ? '#10b981' : '#f3f4f6',
                          color: relaciones[item.id] === 'externo' ? 'white' : '#64748b'
                        }}
                      >
                        Soy Broker
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER NAV */}
        <div style={styles.footer}>
          <button 
            onClick={() => setStep(s => s - 1)} 
            disabled={step === 1}
            style={{...styles.navBtn, visibility: step === 1 ? 'hidden' : 'visible', backgroundColor: '#e5e7eb', color: '#333'}}
          >
            Atrás
          </button>

          {step < totalSteps ? (
            <button 
              onClick={() => setStep(s => s + 1)} 
              disabled={!isStepValid()}
              style={{...styles.navBtn, opacity: isStepValid() ? 1 : 0.5}}
            >
              Siguiente
            </button>
          ) : (
            <button 
              onClick={handleFinalizar} 
              disabled={isSaving || !isStepValid()}
              style={{...styles.navBtn, backgroundColor: '#10b981', opacity: (!isStepValid() || isSaving) ? 0.6 : 1}}
            >
              {isSaving ? 'Guardando...' : 'Finalizar Registro'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- ESTILOS UX/UI MEJORADOS ---
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', backgroundColor: '#f3f4f6', fontFamily: "'Segoe UI', sans-serif" },
  card: { width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', height: '85vh', maxHeight: '800px', overflow: 'hidden' },
  
  header: { padding: '25px 30px', borderBottom: '1px solid #f3f4f6', backgroundColor: 'white', zIndex: 10 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  title: { margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#111827' },
  stepBadge: { fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-color)', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '20px' },
  progressTrack: { height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' },
  
  content: { flex: 1, padding: '0', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }, // Importante para scroll interno
  
  // Inputs Step 1
  inputBig: { width: '100%', padding: '20px', fontSize: '1.5rem', textAlign: 'center', borderRadius: '16px', border: '2px solid #e5e7eb', marginTop: '20px', fontWeight: 'bold', outline: 'none', color: '#333' },
  desc: { color: '#6b7280', margin: '0 0 20px 0', padding: '0 30px' },
  
  // Step 2 Styles
  stickyControls: { padding: '0 20px 10px 20px', backgroundColor: 'white', borderBottom: '1px solid #f3f4f6', zIndex: 5 },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '12px 15px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '10px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem' },
  filterTabs: { display: 'flex', gap: '5px', padding: '5px', backgroundColor: '#f3f4f6', borderRadius: '10px' },
  tab: { flex: 1, padding: '8px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#666', fontWeight: '600' },
  tabActive: { flex: 1, padding: '8px', border: 'none', background: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--primary-color)', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  badgeCount: { backgroundColor: 'var(--primary-color)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px' },
  
  listArea: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  
  optionItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '2px solid', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.1s ease-in-out' },
  checkbox: { width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' },
  
  // Manual Add
  addManualSection: { padding: '20px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fafafa' },
  linkBtn: { background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 'bold', cursor: 'pointer', width: '100%', textDecoration: 'underline' },
  manualForm: { backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  miniInput: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' },
  smallPrimaryBtn: { padding: '8px 15px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  smallSecondaryBtn: { padding: '8px 15px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', fontSize: '0.9rem' },
  
  manualItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '10px', marginBottom: '5px' },
  trashBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' },
  subHeader: { fontSize: '0.8rem', fontWeight: 'bold', color: '#999', marginBottom: '5px', textTransform: 'uppercase' },

  // Step 3
  scrollArea: { padding: '0 30px', overflowY: 'auto', flex: 1 },
  relationCard: { backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px', marginBottom: '15px' },
  relationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  tagManual: { fontSize: '0.7rem', backgroundColor: '#fff7ed', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ffedd5' },
  toggleGroup: { display: 'flex', gap: '8px' },
  toggleBtn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s' },

  footer: { padding: '20px 30px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', backgroundColor: 'white' },
  navBtn: { padding: '14px 28px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'opacity 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};