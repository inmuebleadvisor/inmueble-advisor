// src/screens/DetalleModelo.jsx
// ÚLTIMA MODIFICACION: 23/01/2026 (Meta Hybrid Tracking)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCatalog } from '../../context/CatalogContext';
import { useService } from '../../hooks/useService'; // ✅ Import Service Hook

// Componentes UI
import ModelDetailsContent from '../../components/catalogo/ModelDetailsContent';

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
};

const formatoMoneda = (val) => {
  if (!val || isNaN(val)) return 'Precio Pendiente';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function DetalleModelo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, trackBehavior } = useUser(); // ✅ Get User Context for PII
  const { meta: metaService } = useService(); // ✅ Inject Meta Service
  const { loadingCatalog, getModeloById, getDesarrolloById, modelos } = useCatalog();

  // Estados de datos
  const [modelo, setModelo] = useState(null);
  const [desarrollo, setDesarrollo] = useState(null);
  const [modelosHermanos, setModelosHermanos] = useState([]);



  // 0. SCROLL RESTORATION (Standard)
  useEffect(() => {
    // With Remount Strategy, this runs once on "mount" which is perfect.
    // Instant behavior ensures no visual jump.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []); // Run ONCE on mount (because we force remount on ID change)

  // 1. EFECTO PRINCIPAL: CARGA Y VINCULACIÓN DE DATOS
  useEffect(() => {
    if (loadingCatalog) return;

    // A. Buscar el modelo actual
    const modeloEncontrado = getModeloById(id);

    if (modeloEncontrado) {
      setModelo(modeloEncontrado);
      trackBehavior('view_item', { item_id: id, item_name: modeloEncontrado.nombre_modelo });

      // ============================================
      // 🚀 META ADS HYBRID TRACKING (ViewContent)
      // ============================================
      const trackMetaViewContent = async () => {
        try {
          // 1. Generate Unique Event ID
          const eventId = metaService.generateEventId();
          const price = Number(modeloEncontrado.precioNumerico) || 0;
          const contentName = `${modeloEncontrado.nombre_modelo} (${modeloEncontrado.nombreDesarrollo || 'Modelo'})`;

          // 2. Browser Pixel (Standard)
          metaService.track('ViewContent', {
            content_name: contentName,
            content_ids: [id],
            content_type: 'product',
            content_category: 'Vivienda Nueva',
            value: price,
            currency: 'MXN'
          }, eventId);

          // 3. User Data Extraction & Normalization
          const email = userProfile?.email || user?.email;
          const firstName = userProfile?.nombre || user?.displayName?.split(' ')[0];
          const lastName = userProfile?.apellido || user?.displayName?.split(' ').slice(1).join(' ');

          const rawPhone = userProfile?.telefono || '';
          const cleanPhone = rawPhone.replace(/\D/g, '');
          const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

          // 4. Update Pixel User Data (Advanced Matching)
          if (email || normalizedPhone || user?.uid) {
            metaService.setUserData({
              em: email,
              ph: normalizedPhone,
              fn: firstName,
              ln: lastName,
              external_id: user?.uid
            });
          }

          // 5. Server CAPI (Intent)
          await metaService.trackIntentCAPI(eventId, {
            // Content Context
            nombreDesarrollo: contentName, // Mapping as Main Content Name
            urlOrigen: window.location.href,
            value: price,
            currency: 'MXN',
            // Technical Context
            fbp: metaService.getFbp(),
            fbc: metaService.getFbc(),
            clientUserAgent: navigator.userAgent,
            // User Context
            email: email,
            telefono: normalizedPhone,
            nombre: firstName,
            apellido: lastName,
            external_id: user?.uid
          });

          console.log(`[Meta Hybrid] ViewContent tracked for Model: ${contentName}`);

        } catch (error) {
          console.warn("[Meta Hybrid] Tracking failed:", error);
        }
      };

      trackMetaViewContent();
      // ============================================


      // B. Buscar al Desarrollo Padre (Vinculación)
      const idDevRaw = modeloEncontrado.idDesarrollo || modeloEncontrado.id_desarrollo || modeloEncontrado.desarrollo_id;
      const idPadreString = idDevRaw ? String(idDevRaw).trim() : null;

      if (idPadreString) {
        const devData = getDesarrolloById(idPadreString);

        if (devData && String(devData.id) !== String(modeloEncontrado.id)) {
          setDesarrollo(devData);
        } else {
          setDesarrollo(null);
        }

        // C. Cross-Selling (Hermanos)
        const hermanos = modelos.filter(m => {
          const mIdDev = String(m.idDesarrollo || m.id_desarrollo || '').trim();
          return mIdDev === idPadreString && String(m.id) !== String(id);
        });
        setModelosHermanos(hermanos);
      } else {
        setDesarrollo(null);
        setModelosHermanos([]);
      }
    } else {
      setModelo(null);
    }



  }, [id, loadingCatalog, getModeloById, getDesarrolloById, modelos]);

  if (loadingCatalog) return <div style={styles.centerContainer}><p>Cargando catálogo...</p></div>;
  if (!modelo) return <div style={styles.errorContainer}><h2>Propiedad no disponible</h2></div>;

  return (
    <ModelDetailsContent
      modelo={modelo}
      desarrollo={desarrollo}
      modelosHermanos={modelosHermanos}
      onBack={() => navigate(-1)}
    />
  );
}

const styles = {
  centerContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' },
  errorContainer: { padding: '40px', textAlign: 'center', color: '#374151', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
};

