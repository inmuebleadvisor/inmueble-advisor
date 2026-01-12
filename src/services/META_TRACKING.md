# Arquitectura de Rastreo Meta (Hybrid Tracking) 📡

Este documento detalla la implementación del sistema de rastreo híbrido para Meta Ads (Facebook/Instagram), combinando **Browser Pixel** y **Conversion API (CAPI)** para maximizar la calidad del matching de eventos (EMQ) y la resiliencia ante bloqueadores de anuncios.

## 1. Principios de Diseño
El sistema sigue un modelo de **Deduplicación Estricta**:
- Cada evento se envía **simultáneamente** desde el navegador y el servidor.
- Ambos eventos comparten un **Event ID (`metaEventId`)** único generado en el cliente.
- Meta procesa ambos y descarta el duplicado, quedándose con la señal más rica (generalmente CAPI con PII segura).

## 2. Mapa de Eventos

| Evento | Trigger (Disparo) | Responsable (Frontend) | Responsable (Backend/CAPI) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **`PageView`** | Cambio de ruta (SPA) | `<MetaTracker />` | `onLeadPageViewMETA` | Trafico general y audiencias por URL. |
| **`ViewContent`** | Carga de detalles de desarrollo | `DevelopmentDetailsContent` | `onLeadIntentMETA` (Restringido) | Retargeting dinámico (DPA) basado en ID de producto. |
| **`Contact`** | Apertura de Modal de Agenda | `LeadCaptureForm` (al abrir) | `onLeadContactMETA` | Medir intención alta de clientes potenciales. |
| **`Schedule`** | Confirmación exitosa de Cita | `LeadCaptureForm` (al éxito) | `onLeadCreatedMETA` | **Conversión Principal**. Optimización de ROI. |

## 3. Componentes Clave

### A. `MetaTracker.jsx` (Global)
- **Ubicación**: `src/components/common/MetaTracker.jsx`
- **Función**: Escucha `useLocation` para disparar `PageView` automáticamente.
- **Lógica**:
    1. Genera UUID (`metaEventId`).
    2. Extrae PII del `UserContext` (si existe).
    3. Dispara Pixel (`fbq track PageView`).
    4. Invoca Cloud Function `onLeadPageViewMETA`.

### B. `MetaService` (Servicio Frontend)
- **Ubicación**: `src/services/meta.service.js`
- **Función**: Facade para el objeto `window.fbq`.
- **Métodos**:
    - `init(pixelId)`: Configura el Pixel (sin trackeo automático).
    - `track(event, params, id)`: Envía eventos al navegador.
    - `setUserData(userData)`: Configura *Advanced Matching* en el navegador.

### C. Cloud Functions (CAPI)
- **Ubicación**: `functions/src/interface/callable/*`
- **Función**: Reciben el evento del frontend y lo reenvían a Meta Graph API.
- **Robustez**: Implementan lógica de respaldo para alias de datos:
    - **Email**: `email` || `clienteDatos.email` || `correo`
    - **Teléfono**: `telefono` || `clienteDatos.telefono` || `celular`
    - **Cookies**: `fbp` || `_fbp`, `fbc` || `_fbc`
- **Seguridad**: Manejan tokens de acceso de servidor y normalizan datos de usuario (SHA256 hash automático por SDK o manual si es raw).

## 4. Configuración Requerida

### Variables de Entorno (Frontend)
- `META_PIXEL_ID`: ID público del Pixel (Hardcoded o en constantes).

### Variables de Cliente (Backend - Firebase Config)
Las funciones requieren acceso a la API de Meta. Asegurar que las variables de entorno de Firebase estén seteadas:

```bash
firebase functions:config:set meta.pixel_id="25721482294159393" meta.access_token="EAAG..."
```

## 5. Pruebas y Depuración (Testing)

### Modo Pruebas
Para verificar los eventos en tiempo real en la consola de "Eventos de Prueba" de Meta:

1. Configurar `TEST_EVENT_CODE` en las constantes (ej. `"TEST1234"`).
2. El `MetaService` inyectará este código en cada evento.

### Verificación Manual
1. Abrir **Meta Pixel Helper** en Chrome.
2. Navegar por el sitio.
3. Verificar que cada `PageView` tenga un `Event ID`.
4. Verificar logs de consola para mensajes `[Meta Unified]`.
