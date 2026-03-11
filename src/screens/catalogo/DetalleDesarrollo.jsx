// src/screens/DetalleDesarrollo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useUser } from '../../context/UserContext';
import { useService } from '../../hooks/useService';
import { useCatalog } from '../../context/CatalogContext';

import DevelopmentDetailsContent from '../../components/catalogo/DevelopmentDetailsContent';

export default function DetalleDesarrollo() {
  const { id } = useParams();
  const { user, userProfile, trackBehavior, selectedCity, updateSelectedCity } = useUser(); // ✅ Get User Context
  const { loadingCatalog } = useCatalog();
  const { catalog: catalogService, meta: metaService } = useService(); // ✅ SERVICE INJECTION
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [desarrollo, setDesarrollo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. CARGA DE DATOS
  useEffect(() => {
    // Si el catálogo global aún carga, esperamos para no hacer peticiones dobles
    if (loadingCatalog) return;

    const cargarDesarrollo = async () => {
      setLoading(true);
      try {
        const data = await catalogService.obtenerInformacionDesarrollo(id);
        setDesarrollo(data);

        if (data) {
          // Extraer la ciudad de desarrollo y actualizar el contexto de usuario global
          if (data.ubicacion?.ciudad && data.ubicacion.ciudad !== selectedCity) {
            updateSelectedCity(data.ubicacion.ciudad);
          }

          trackBehavior('view_development', { id: id, name: data.nombre });

          // 1. Generate Unique Event ID for Deduplication
          const eventId = metaService.generateEventId();

          // Calculate Value (Min Price)
          const minPrice = data.modelos?.length > 0
            ? Math.min(...data.modelos.map(m => m.precioNumerico || 0))
            : 0;

          // 2. Meta Pixel: ViewContent
          metaService.track('ViewContent', {
            content_name: data.nombre,
            content_category: 'Vivienda Nueva',
            content_ids: [id],
            content_type: 'product',
            value: minPrice,
            currency: 'MXN'
          }, eventId); // Pass eventId

          // 3. Server-Side CAPI: ViewContent (Intent)
          // 3. Server-Side CAPI: ViewContent (Intent)
          const trackCAPI = async () => {
            try {
              // 🛡️ Safe PII Extraction
              const email = userProfile?.email || user?.email; // Prefer profile (DB) over Auth
              const firstName = userProfile?.nombre || user?.displayName?.split(' ')[0];
              const lastName = userProfile?.apellido || user?.displayName?.split(' ').slice(1).join(' ');

              // Phone Normalization (Standardized)
              const rawPhone = userProfile?.telefono || '';
              const cleanPhone = rawPhone.replace(/\D/g, '');
              const normalizedPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

              // 🍪 PII for Browser Pixel (Advanced Matching)
              if (email || normalizedPhone || user?.uid) {
                metaService.setUserData({
                  em: email,
                  ph: normalizedPhone,
                  fn: firstName,
                  ln: lastName,
                  external_id: user?.uid // ✅ External ID (UID)
                });
              }

              console.log("[Meta CAPI] Sending 'ViewContent' intent...");

              // Refactored Service Call
              await metaService.trackIntentCAPI(eventId, {
                // Content Context
                nombreDesarrollo: data.nombre,
                urlOrigen: window.location.href,
                // Price Context
                value: minPrice,
                currency: 'MXN',
                // Technical Context
                fbp: metaService.getFbp(),
                fbc: metaService.getFbc(),
                clientUserAgent: navigator.userAgent,
                // 👤 User Context (For Match Quality)
                email: email,
                telefono: normalizedPhone,
                nombre: firstName,
                apellido: lastName,
                external_id: user?.uid // ✅ External ID (UID)
                // Note: IP is auto-captured by Callable
              });
            } catch (e) {
              console.warn("[Meta CAPI] Failed to capture ViewContent intent", e);
              // Fail silently, don't block UI
            }
          };
          trackCAPI();
        }
      } catch (error) {
        console.error("Error cargando desarrollo:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDesarrollo();
    window.scrollTo(0, 0);
  }, [id, loadingCatalog]);

  if (loadingCatalog || loading) {
    return (
      <div className="dev-details dev-details--loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando desarrollo...</p>
      </div>
    );
  }

  if (!desarrollo) {
    return (
      <div className="dev-details dev-details--error" style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--text-main)' }}>Desarrollo no encontrado</h2>
        <button onClick={() => navigate('/catalogo')} className="btn btn-secondary">Volver al Catálogo</button>
      </div>
    );
  }

  return (
    <DevelopmentDetailsContent
      desarrollo={desarrollo}
      onBack={() => navigate(-1)}
    />
  );
}

