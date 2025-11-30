// src/screens/OnboardingAsesor.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerInventarioDesarrollos } from '../services/dataService'; // ✅ Servicio optimizado

// --- ICONOS (SVG Inline para rendimiento) ---
const Icons = {
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
};

export default function OnboardingAsesor() {
  const navigate = useNavigate();
  // Extraemos la función especial para cambiar de rol solo al final
  const { convertirEnAsesor } = useUser(); 

  // --- ESTADOS DE CONTROL ---
  const [step, setStep] = useState(1); // 1: Teléfono, 2: Inventario
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- DATOS DEL FORMULARIO ---
  const [telefono, setTelefono] = useState('');
  
  // Inventario (Base de Datos + Manuales)
  const [inventarioDB, setInventarioDB] = useState([]); // Lista cruda desde Firebase
  const [seleccionados, setSeleccionados] = useState([]); // IDs seleccionados
  const [manuales, setManuales] = useState([]); // {id, nombre, constructora} agregados a mano
  
  // --- UX / FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [nuevoManual, setNuevoManual] = useState({ nombre: '', constructora: '' });

  // 1. CARGA DE DATOS (Al montar el componente)
  useEffect(() => {
    const cargar = async () => {
      setLoadingData(true);
      // Usamos el servicio centralizado para aprovechar el caché
      const data = await obtenerInventarioDesarrollos();
      setInventarioDB(data);
      setLoadingData(false);
    };
    cargar();
  }, []);

  // 2. FILTRADO INTELIGENTE (Memoizado para no alentar la UI)
  const listaVisible = useMemo(() => {
    if (!searchTerm) return inventarioDB;
    const lower = searchTerm.toLowerCase();
    // Filtramos por nombre del desarrollo o constructora
    return inventarioDB.filter(item => 
      item.nombre.toLowerCase().includes(lower) || 
      item.constructora.toLowerCase().includes(lower)
    );
  }, [inventarioDB, searchTerm]);

  // --- HANDLERS (Manejadores de eventos) ---

  // Seleccionar/Deseleccionar item de la BD
  const toggleSeleccion = (id) => {
    setSeleccionados(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Agregar item manual si no existe en la lista
  const agregarManual = () => {
    if (!nuevoManual.nombre) return;
    // Creamos un ID temporal único
    setManuales(prev => [...prev, { ...nuevoManual, id: `manual_${Date.now()}` }]);
    setNuevoManual({ nombre: '', constructora: '' });
    setShowManualForm(false);
  };

  // --- VALIDACIÓN Y GUARDADO FINAL ---
  const handleFinalizar = async () => {
    if (!telefono || telefono.length < 10) return alert("Por favor ingresa un teléfono válido de 10 dígitos.");
    
    setIsSaving(true);
    try {
      // Unificamos la data seleccionada para guardarla
      const inventarioFinal = [
        ...seleccionados.map(id => ({ tipo: 'db', idDesarrollo: id })),
        ...manuales.map(m => ({ tipo: 'manual', nombreManual: m.nombre, constructoraManual: m.constructora }))
      ];

      // 🚀 MOMENTO CRÍTICO: Aquí convertimos al usuario de 'cliente' a 'asesor'
      await convertirEnAsesor({
        telefono,
        inventario: inventarioFinal
      });

      // ✅ REDIRECCIÓN AL DASHBOARD DEL ASESOR (AccountAsesor)
      navigate('/account-asesor');

    } catch (error) {
      console.error("Error al finalizar registro:", error);
      alert("Hubo un problema al guardar tus datos. Por favor intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* HEADER CON BARRA DE PROGRESO */}
        <div style={styles.header}>
          <div style={styles.progressRow}>
            {/* Indicadores visuales de paso */}
            <div style={{...styles.stepDot, backgroundColor: step >= 1 ? 'var(--primary-color)' : '#e5e7eb'}}>1</div>
            <div style={styles.connector} />
            <div style={{...styles.stepDot, backgroundColor: step >= 2 ? 'var(--primary-color)' : '#e5e7eb'}}>2</div>
          </div>
          <h2 style={styles.title}>
            {step === 1 ? 'Tu Contacto' : 'Tu Inventario'}
          </h2>
          <p style={styles.subtitle}>
            {step === 1 ? 'Medio principal para recibir leads' : 'Selecciona los desarrollos que vendes'}
          </p>
        </div>

        {/* PASO 1: TELÉFONO */}
        {step === 1 && (
          <div style={styles.body}>
            <div style={styles.inputWrapper}>
              <span style={{fontSize:'2rem'}}>📱</span>
              <input 
                type="tel" 
                placeholder="55 1234 5678" 
                value={telefono}
                maxLength={10}
                // Solo permite números
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g,''))}
                style={styles.bigInput}
                autoFocus
              />
            </div>
            <p style={styles.hint}>Ingresa tu número a 10 dígitos.</p>
          </div>
        )}

        {/* PASO 2: INVENTARIO */}
        {step === 2 && (
          <div style={styles.bodyNoPadding}>
            {/* Buscador Fijo Arriba */}
            <div style={styles.stickySearch}>
              <div style={styles.searchBox}>
                <Icons.Search />
                <input 
                  placeholder="Buscar desarrollo o constructora..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {/* Lista Scrollable */}
            <div style={styles.listContainer}>
              {loadingData ? (
                <p style={{padding:'20px', textAlign:'center', color:'#999'}}>Cargando catálogo...</p>
              ) : (
                <>
                  {/* Items Agregados Manualmente */}
                  {manuales.map(m => (
                    <div key={m.id} style={styles.itemRowManual}>
                      <div>
                        <div style={styles.itemName}>{m.nombre}</div>
                        <div style={styles.itemSub}>Manual • {m.constructora}</div>
                      </div>
                      <button onClick={() => setManuales(prev => prev.filter(x => x.id !== m.id))} style={styles.trashBtn}>
                        <Icons.Trash />
                      </button>
                    </div>
                  ))}

                  {/* Items de la Base de Datos */}
                  {listaVisible.map(item => {
                    const isSelected = seleccionados.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => toggleSeleccion(item.id)}
                        style={{
                          ...styles.itemRow,
                          backgroundColor: isSelected ? '#eff6ff' : 'white',
                          borderColor: isSelected ? 'var(--primary-color)' : '#eee'
                        }}
                      >
                        <div style={styles.itemInfo}>
                          <div style={{...styles.itemName, color: isSelected ? 'var(--primary-color)' : '#333'}}>
                            {item.nombre}
                          </div>
                          <div style={styles.itemSub}>{item.constructora}</div>
                        </div>
                        {isSelected && <div style={styles.checkIcon}><Icons.Check /></div>}
                      </div>
                    );
                  })}
                  
                  {/* Sección para Agregar Manualmente */}
                  <div style={styles.manualSection}>
                    {!showManualForm ? (
                      <button onClick={() => setShowManualForm(true)} style={styles.addBtn}>
                        ¿No encuentras tu desarrollo? + Agregar Manualmente
                      </button>
                    ) : (
                      <div style={styles.manualForm}>
                        <input 
                          placeholder="Nombre del Desarrollo" 
                          value={nuevoManual.nombre} 
                          onChange={e => setNuevoManual({...nuevoManual, nombre: e.target.value})}
                          style={styles.inputSmall}
                        />
                        <input 
                          placeholder="Constructora" 
                          value={nuevoManual.constructora} 
                          onChange={e => setNuevoManual({...nuevoManual, constructora: e.target.value})}
                          style={styles.inputSmall}
                        />
                        <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                          <button onClick={agregarManual} style={styles.btnSmallPrimary}>Agregar</button>
                          <button onClick={() => setShowManualForm(false)} style={styles.btnSmallSec}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS (Botones Siguiente/Atrás) */}
        <div style={styles.footer}>
          {step === 2 && (
            <button onClick={() => setStep(1)} style={styles.btnBack}>Atrás</button>
          )}
          
          <button 
            onClick={() => {
              if (step === 1) {
                if (telefono.length < 10) return alert("Teléfono inválido");
                setStep(2);
              } else {
                handleFinalizar();
              }
            }}
            disabled={isSaving}
            style={{...styles.btnPrimary, width: step === 1 ? '100%' : 'auto', flex: 1}}
          >
            {step === 1 ? 'Siguiente' : (isSaving ? 'Guardando...' : 'Finalizar Registro')}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ESTILOS RESPONSIVOS ---
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Segoe UI', sans-serif" },
  card: { width: '100%', maxWidth: '480px', height: '90vh', maxHeight: '700px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  
  header: { padding: '30px 30px 10px 30px', textAlign: 'center' },
  progressRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  stepDot: { width: '30px', height: '30px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', transition: 'background 0.3s' },
  connector: { width: '40px', height: '2px', backgroundColor: '#e5e7eb', margin: '0 10px' },
  title: { margin: '0 0 5px 0', color: '#111827', fontSize: '1.5rem', fontWeight: '800' },
  subtitle: { margin: 0, color: '#6b7280', fontSize: '0.95rem' },
  
  body: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  bodyNoPadding: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '16px', border: '2px solid #e5e7eb' },
  bigInput: { border: 'none', background: 'transparent', fontSize: '1.5rem', fontWeight: 'bold', width: '100%', outline: 'none', color: '#333' },
  hint: { textAlign: 'center', color: '#9ca3af', marginTop: '10px', fontSize: '0.9rem' },
  
  stickySearch: { padding: '15px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: 'white' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f3f4f6', padding: '10px 15px', borderRadius: '12px' },
  searchInput: { border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '1rem' },
  
  listContainer: { flex: 1, overflowY: 'auto', padding: '15px' },
  itemRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', borderRadius: '12px', border: '1px solid', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.1s' },
  itemRowManual: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', borderRadius: '12px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', marginBottom: '8px' },
  itemName: { fontWeight: '700', fontSize: '0.95rem' },
  itemSub: { fontSize: '0.8rem', color: '#6b7280' },
  checkIcon: { color: 'var(--primary-color)' },
  trashBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  
  manualSection: { marginTop: '20px', padding: '10px', borderTop: '1px solid #f3f4f6' },
  addBtn: { width: '100%', padding: '12px', color: 'var(--primary-color)', background: '#eff6ff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  manualForm: { backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px' },
  inputSmall: { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd' },
  btnSmallPrimary: { backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  btnSmallSec: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  
  footer: { padding: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '15px' },
  btnBack: { padding: '15px 25px', borderRadius: '12px', border: 'none', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 'bold', cursor: 'pointer' },
  btnPrimary: { padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }
};