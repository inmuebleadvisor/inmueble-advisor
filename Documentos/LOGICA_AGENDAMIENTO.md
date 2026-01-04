# Documentación del Sistema de Agendamiento de Citas

Este documento detalla la lógica de negocio, condicionantes y flujo de datos del sistema de agendamiento de citas en **Inmueble Advisor**.

## Componentes Principales

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| **Frontend UI** | `src/components/leads/LeadCaptureForm.jsx` | Captura de datos, manejo de pasos (Wizard), validación visual y gestión de estilos BEM. |
| **Business Logic** | `src/services/appointment.service.js` | Cálculo puro de horarios (slots), reglas de tiempo y validación de fechas (sin dependencias UI). |
| **Orchestrator** | `src/services/leadAssignmentService.js` | Conecta el Frontend con los Repositorios. Gestiona la creación del Lead, verificación de duplicados y reprogramación. |
| **Persistence** | `src/repositories/lead.repository.js` | Interacción directa con Firebase Firestore. Guardado de leads y consultas de citas activas. |

## Lógica de Negocio y Condicionantes (`appointment.service.js`)

El sistema genera slots de tiempo dinámicamente basándose en las siguientes reglas estrictas:

### 1. Horario de Operación
- **Inicio**: 07:00 AM (`CONFIG.START_HOUR`)
- **Cierre**: 09:00 PM (`CONFIG.END_HOUR`)
- **Último Slot**: 08:00 PM (para terminar a las 09:00 PM).
- **Duración**: 60 minutos por cita.

### 2. Reglas de Tiempo (Validaciones)
- **Buffer Mínimo**: No se puede agendar con menos de **2 horas** de anticipación desde el momento actual.
- **Ventana Máxima**: Solo se permite agendar en los próximos **15 días** (`CONFIG.MAX_DAYS_WINDOW`).
- **Fechas Pasadas**: Bloqueadas automáticamente.

### 3. Prevención de Duplicados
Antes de permitir agendar, el sistema verifica si el usuario (`uid`) ya tiene una cita futura activa para el desarrollo específico (`idDesarrollo`).
- Si existe: Se muestra una pantalla de bloqueo con los detalles de la cita existente y opción a **Reprogramar**.
- Si no existe: Se permite crear un nuevo Lead y Cita.

## Estructura de Datos (Campos Guardados)

Cuando se confirma una cita, se guarda un objeto `lead` en Firestore con la siguiente estructura relevante para el agendamiento:

### Objeto `citainicial`
Este sub-objeto es crítico y contiene la información de la reserva.
```javascript
citainicial: {
  dia: Date,      // Objeto Date de Javascript (convertido a Timestamp por Firebase)
  hora: "14:00"   // String en formato HH:mm formato 24h para ordenamiento simple
}
```

### Campos del Lead (Raíz)
```javascript
{
  uid: "...",                // ID del usuario (Firebase Auth)
  idDesarrollo: "...",       // ID del desarrollo inmobiliario
  idAsesorAsignado: null,    // Inicialmente null, asignado posteriormente
  status: "PENDIENTE...",    // Estado inicial del flujo
  createdAt: serverTimestamp(),
  snapshot: { ... }          // Copia de los datos del modelo/desarrollo al momento de la cita (Precio, Nombre, etc.)
}
```

## Flujo de Reprogramación
Si el usuario decide cambiar su cita existente:
1. `LeadCaptureForm` detecta `isRescheduling = true`.
2. Llama a `leadAssignment.rescheduleAppointment(leadId, newCita)`.
3. El servicio actualiza **solo** el campo `citainicial` y agrega una entrada al historial (`statusHistory`) indicando el cambio por el usuario.
4. **No** se crea un nuevo documento de Lead; se recicla el existente para mantener la trazabilidad.

## Pruebas Unitarias
La lógica de cálculo de slots está cubierta por tests en:
`tests/unit/appointment.service.test.js`
Ejecutar con: `npx vitest run tests/unit/appointment.service.test.js`
