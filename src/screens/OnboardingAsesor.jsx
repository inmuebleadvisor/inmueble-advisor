// src/screens/OnboardingAsesor.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { obtenerInventarioDesarrollos } from '../services/catalog.service';

const CheckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>;

export default function OnboardingAsesor() {
  const navigate = useNavigate();
  const { convertirEnAsesor, userProfile, loadingUser } = useUser();

  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [inventarioDB, setInventarioDB] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (loadingUser) return;

    // ✅ FIX CRÍTICO: Si ya es asesor Y TIENE EL ONBOARDING COMPLETO, redirigir al Dashboard.
    // O SI ES ADMIN, redirigir al panel de administrador.
    if (userProfile?.role === 'admin') {
      navigate('/administrador');
      return;
    }

    if (userProfile?.role === 'asesor' && userProfile?.onboardingCompleto === true) {
      navigate('/account-asesor');
      return;
    }

    // Si el usuario llega hasta aquí, necesita el wizard (es cliente o asesor incompleto).
    // Cargamos los datos del inventario para el paso 2.
    const cargar = async () => {
      setLoadingData(true);
      try {
        const data = await obtenerInventarioDesarrollos();
        setInventarioDB(data);
      } catch (error) {
        console.error("Error al cargar inventario:", error);
      } finally {
        setLoadingData(false);
      }
    };
    cargar();
  }, [userProfile, loadingUser, navigate]);

  const listaFiltrada = useMemo(() => {
    if (!searchTerm) return inventarioDB;
    const lower = searchTerm.toLowerCase();
    return inventarioDB.filter(item =>
      item.nombre.toLowerCase().includes(lower) ||
      item.constructora.toLowerCase().includes(lower)
    );
  }, [inventarioDB, searchTerm]);

  const handleToggle = (id) => {
    setSeleccionados(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      return [...prev, id];
    });
  };

  const handleFinalizar = async () => {
    if (!telefono || telefono.length < 10) {
      alert("Por favor ingresa un teléfono válido de 10 dígitos.");
      setStep(1);
      return;
    }

    if (seleccionados.length === 0) {
      if (!window.confirm("No has seleccionado ningún desarrollo. Tu perfil estará vacío. ¿Continuar?")) return;
    }

    setIsSaving(true);
    try {
      // ✅ CORRECCIÓN CRÍTICA: Schema V1 (Boolean 'activo')
      const inventarioFinal = seleccionados.map(id => ({
        tipo: 'db',
        idDesarrollo: id,
        activo: false, // <--- Boolean explícito (false = pendiente de activación por Admin)
        fechaSolicitud: new Date().toISOString()
      }));

      const datosInicialesAsesor = {
        telefono,
        inventario: inventarioFinal,
        scoreGlobal: 70, // ✅ CORRECCIÓN: Inicio Estricto (0 ventas + 30 + 20 + 20)
        metricas: {
          tasaCierre: 0,
          promedioResenas: 0,
          totalLeadsAsignados: 0,
          cumplimientoAdmin: 100,
          ultimaActualizacionInventario: new Date().toISOString(),
          // Valores iniciales para el Score Card
          puntosEncuestas: 30,
          puntosActualizacion: 20,
          puntosComunicacion: 20
        }
      };

      await convertirEnAsesor(datosInicialesAsesor);
      // Redirección final a la cuenta de asesor
      navigate('/account-asesor', { replace: true });

    } catch (error) {
      console.error("Error al finalizar registro:", error);
      alert("Hubo un problema al guardar tus datos. Por favor intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  // ... (El resto del renderizado UI se mantiene igual)
  return (
    <div className="main-content" style={styles.container}>
      <div style={styles.card}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: step === 1 ? '50%' : '100%' }}></div>
        </div>

        <h2 style={styles.title}>
          {step === 1 ? '📱 Tu Contacto' : '🏢 Tu Inventario'}
        </h2>
        <p style={styles.subtitle}>
          {step === 1
            ? 'El medio principal por donde te llegarán los leads.'
            : 'Selecciona los desarrollos que estás autorizado a vender.'}
        </p>

        {step === 1 && (
          <div style={styles.stepContent}>
            <div style={styles.inputWrapper}>
              <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🇲🇽 +52</span>
              <input
                type="tel"
                placeholder="123 456 7890"
                value={telefono}
                maxLength={10}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                style={styles.inputBig}
                autoFocus
              />
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '15px', textAlign: 'center' }}>
              Te enviaremos notificaciones de nuevos clientes a este número.
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ ...styles.stepContent, justifyContent: 'flex-start', padding: 0 }}>
            <div style={styles.searchContainer}>
              <input
                placeholder="🔍 Buscar desarrollo o constructora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.inputSearch}
              />
            </div>

            <div style={styles.listContainer}>
              {loadingData && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <p>Cargando catálogo...</p>
                </div>
              )}

              {!loadingData && listaFiltrada.map(item => {
                const isSelected = seleccionados.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggle(item.id)}
                    style={{
                      ...styles.itemRow,
                      backgroundColor: isSelected ? '#eff6ff' : 'white',
                      borderColor: isSelected ? 'var(--primary-color)' : '#e5e7eb'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', color: '#374151' }}>{item.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.constructora} • {item.ubicacion?.ciudad || 'General'}</div>
                    </div>
                    {isSelected && (
                      <div style={{
                        color: 'var(--primary-color)',
                        backgroundColor: '#dbeafe',
                        borderRadius: '50%',
                        width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.noticeBar}>
              ℹ️ Los desarrollos seleccionados quedarán pendientes de validación.
            </div>
          </div>
        )}

        <div style={styles.footer}>
          {step === 2 && (
            <button onClick={() => setStep(1)} style={styles.btnSecondary}>Atrás</button>
          )}
          <button
            onClick={() => {
              if (step === 1) {
                if (telefono.length < 10) alert("El teléfono debe tener 10 dígitos");
                else setStep(2);
              } else {
                handleFinalizar();
              }
            }}
            disabled={isSaving}
            style={styles.btnPrimary}
          >
            {step === 1 ? 'Siguiente 👉' : (isSaving ? 'Guardando Perfil...' : 'Finalizar Registro 🎉')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Segoe UI', sans-serif", padding: '20px' },
  card: { width: '100%', maxWidth: '480px', height: '85vh', maxHeight: '700px', backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  progressBar: { height: '6px', width: '100%', backgroundColor: '#f3f4f6' },
  progressFill: { height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.4s ease-in-out' },
  title: { textAlign: 'center', margin: '30px 0 5px', color: '#111827', fontSize: '1.5rem', fontWeight: '800' },
  subtitle: { textAlign: 'center', color: '#6b7280', fontSize: '0.95rem', padding: '0 30px', marginBottom: '25px', lineHeight: '1.4' },
  stepContent: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', overflow: 'hidden' },
  inputWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px', width: '80%', margin: '0 auto' },
  inputBig: { fontSize: '1.8rem', textAlign: 'left', border: 'none', width: '100%', outline: 'none', fontWeight: 'bold', color: '#374151', letterSpacing: '1px' },
  searchContainer: { padding: '15px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: 'white', zIndex: 10 },
  inputSearch: { width: '100%', padding: '12px 15px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none', backgroundColor: '#f9fafb', transition: 'all 0.2s' },
  listContainer: { flex: 1, overflowY: 'auto', padding: '15px 20px' },
  itemRow: { padding: '12px 15px', border: '1px solid', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.1s' },
  noticeBar: { backgroundColor: '#fffbeb', color: '#b45309', fontSize: '0.75rem', padding: '8px', textAlign: 'center', borderTop: '1px solid #fcd34d' },
  footer: { padding: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '15px', backgroundColor: 'white' },
  btnPrimary: { flex: 1, padding: '16px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  btnSecondary: { padding: '16px 24px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }
};