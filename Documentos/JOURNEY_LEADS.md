# Lead Journey: Flujo Completo del Prospecto

Este documento detalla el ciclo de vida de un Lead en la plataforma Inmueble Advisor bajo el modelo de negocio **Developer-Centric B2B** (Implementado Dic 2025).

---

## 🏗️ 1. Captura (El Origen)

### 📌 Nivel Práctico
Un usuario visita el sitio web, navega por el catálogo y muestra interés en un desarrollo o modelo específico. Rellena un formulario de contacto o solicita información.

### ⚙️ Nivel Técnico
1.  **Frontend**: `src/screens/cliente/OnboardingCliente.jsx` o formularios de detalle.
2.  **Acción**: Se invoca `addDoc` a la colección `leads`.
3.  **Datos Clave Iniciales**:
    *   `clienteDatos`: { nombre, telefono, email, presupuesto }
    *   `desarrolloId`: ID del desarrollo de interés.
    *   `status`: Se inicializa como `PENDING_DEVELOPER_CONTACT` (constante `STATUS.LEAD_PENDING_DEVELOPER_CONTACT`).
    *   `origen`: 'web_organico'

---

## 📢 2. Reporte al Desarrollador (Manual-Tech)

### 📌 Nivel Práctico
El Administrador de Inmueble Advisor revisa su **Dashboard** diariamente.
1.  Identifica leads en la columna roja **"Por Reportar"**.
2.  Hace clic en **"📲 Reportar WA"**.
3.  Se abre WhatsApp Web con un mensaje pre-redactado dirigido al contacto del Desarrollador.
4.  El Admin envía el mensaje y confirma en el Dashboard que la acción fue realizada.

### ⚙️ Nivel Técnico
1.  **Componente**: `src/screens/admin/AdminLeads.jsx`.
2.  **Lógica**: `handleReportLead`.
    *   Genera link `wa.me` dinámico con datos del lead.
3.  **Cambio de Estado**:
    *   Al confirmar, llama a `crm.service.js:marcarComoReportado`.
    *   **Update Firestore**: `leads/{id}` -> `status: 'REPORTED'`, `seguimientoB2B.status: 'REPORTED'`.
    *   **UI**: La tarjeta se mueve a la columna naranja "Esperando Asesor".

---

## 👤 3. Asignación de Asesor Externo

### 📌 Nivel Práctico
El Desarrollador responde el WhatsApp indicando: *"Asignalo a Juan Pérez (6671234567)"*.
1.  El Admin busca el lead en **"Esperando Asesor"**.
2.  Hace clic en **"👤 Asignar"**.
3.  Busca a "Juan Pérez" en el sistema o lo registra nuevo.
4.  Confirma la asignación.

### ⚙️ Nivel Técnico
1.  **Componente**: `src/components/admin/ExternalAdvisorModal.jsx`.
2.  **Servicio**: `externalAdvisor.service.js` (Lógica Anti-Duplicados).
    *   Busca en colección `external_advisors` por teléfono.
    *   Si no existe, crea documento.
3.  **Vinculación**:
    *   Llama a `crm.service.js:asignarAsesorExterno`.
    *   **Update Firestore**: 
        *   `status: 'ASSIGNED_EXTERNAL'`
        *   `externalAdvisor`: { nombre, telefono } (Snapshot para render rápido)
        *   `seguimientoB2B`: { vendedorExternoId: 'ID_REF', status: 'ASSIGNED' }

---

## 🏁 4. Seguimiento y Cierre (Hitos)

### 📌 Nivel Práctico
El Admin realiza seguimiento periódico (semanal) con los asesores externos.
1.  Busca el lead en la columna azul **"En Seguimiento"**.
2.  Abre la tarjeta para ver el **Checklist de Hitos**.
3.  Marca los avances según informe el asesor (ej. "Ya apartó").

### ⚙️ Nivel Técnico
1.  **Componente**: `src/components/LeadCard.jsx`.
2.  **Visualización**:
    *   Muestra **Badge Financiero**: `calcularComisionEstimada()` (Precio * % Policy).
3.  **Acción**: `registrarHito(leadId, 'Apartado')`.
    *   **Update Firestore**: `leads/{id}` -> `arrayUnion` en `seguimientoB2B.hitosAlcanzados`.
    *   **Audit Trail**: Se guarda timestamp y usuario que marcó el check.

---

## 📊 Resumen del Modelo de Datos (B2B Object)

```javascript
// Estructura dentro de leads/{id}
{
  id: "lead_123",
  status: "ASSIGNED_EXTERNAL", // Status Global
  
  // Objeto Central B2B
  seguimientoB2B: {
    status: "ASSIGNED", // REPORTED | ASSIGNED
    vendedorExternoId: "adv_999",
    hitosAlcanzados: [
      { hito: "Apartado", fecha: Timestamp, usuarioResponsable: "admin" }
    ]
  },

  // Datos Financieros (Calculados)
  precioPresupuesto: 3500000,
  // Comisión imputada en UI: $122,500 (3.5%)
}
```
