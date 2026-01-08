# Componentes de Leads 🎯

Módulo encargado de la visualización y captura de prospectos (Leads).

## Componentes Principales

### 1. `LeadCard.jsx`
Tarjeta visual que muestra la información de un lead en listas o tableros kanban.
*   **Características:**
    *   Muestra estado con código de colores (`ESTADOS`).
    *   Botones de acción rápida (WhatsApp, Llamada).
    *   Checklist B2B para seguimiento de hitos.
*   **Dependencias:**
    *   `UserContext`: Para registrar hitos con el ID del usuario real.
    *   `formatters.js`: Para visualización uniforme de fechas.

### 2. `LeadCaptureForm.jsx`
Formulario modal para que visitantes o usuarios registrados agenden citas.
*   **Flujo:**
    1.  Selección de Fecha (usando `AppointmentScheduler`).
    2.  Captura de Datos (Nombre, Teléfono).
    3.  Confirmación y prevención de duplicados.
*   **Integraciones:**
    *   **Meta Ads API (CAPI):** Envía eventos `Contact` y `Schedule` server-side para deduplicación.
    *   **Confetti:** Feedback visual al completar.

## Notas de Mantenimiento
*   **Logs:** Se han silenciado logs de depuración (`console.log`) para mantener la consola limpia en producción.
*   **Fechas:** Utilizar siempre las utilidades de `src/utils/formatters.js` en lugar de crear formateadores locales.
