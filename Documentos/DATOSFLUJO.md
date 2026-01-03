# 🔄 MAPA DE FLUJO DE DATOS (Data Lineage)

**Estado:** Actualizado (Sincronizado con Codebase)
**Validación:** `data-manager` + `src/repositories` + `src/services`

Este documento traza la ruta completa del dato, desde un archivo CSV crudo hasta su renderizado en React.

---

## 1. Etapa de Ingesta de Catálogo (Data Ingestion)

El punto de entrada es el CLI `data-manager`.

### 1.1 Fuente (CSV)
Archivos de **Desarrollos, Modelos y Desarrolladores**.
*   **Desafío:** Datos sucios (fechas variadas, strings vacíos).
*   **Solución:** Los **Adapters** (`adapters/index.js`) normalizan nombres de columnas.

### 1.2 Validación Estricta (Zod Layer)
*   **Schema Validation:** Si un campo obligatorio falta o el tipo es incorrecto, la fila se **descarta**.
*   **Result:** Solo datos limpios entran a Firestore.

### 1.3 Post-Procesamiento (Triggers)
1.  **Historial de Precios:** Detecta cambios en `precio.base` y archiva el valor anterior.
2.  **Agregación (Stats):** Suma inventarios y calcula rangos de precios en el Desarrollo padre.
3.  **Geo-Highlights:** Recalcula "Top Desarrollos" por ciudad.

---

## 2. Etapa de Generación de Leads (CRM Flow)
 
 El flujo ha evolucionado para incluir muros de autenticación y lógica de agendamiento.
 
 ### 2.1 Trigger & Validación (UI Layer)
 *   **Componente:** `LeadCaptureForm.jsx`
 *   **Auth Wall:** Si `!user`, se bloquea la vista y se fuerza el Login con Google.
 *   **Paso 1 - Agendamiento:** El usuario selecciona fecha y hora en `AppointmentScheduler`.
     *   *Output:* Objeto `{ dia: Date, hora: "HH:mm" }`.
 *   **Paso 2 - Datos Personales:** Se pre-llenan con `UserContext`.
 
 ### 2.2 Orquestación (Service Layer)
 *   **Servicio:** `LeadAssignmentService.generarLeadAutomatico`
 *   **Cliente Unificado:**
     *   Verifica si el email/teléfono ya existe en `ClientService`.
     *   Si existe, reutiliza el UID. Si no, crea un nuevo cliente.
 *   **Resolución de Desarrollador:**
     *   Si falta el `idDesarrollador`, lo busca en tiempo real usando `CatalogRepository`.
 *   **Construcción de Payload:**
     *   Empaqueta `clienteDatos`, `snapshot` del inmueble y `citainicial`.
     *   Asigna estado inicial: `PENDING_DEVELOPER_CONTACT`.
 
 ### 2.3 Persistencia (Repository Layer)
 *   **`LeadRepository.createLead`**:
     *   Recibe el objeto denormalizado.
     *   Agrega `createdAt`, `updatedAt` (ServerTimestamp).
     *   Inicializa `statusHistory`.
 
 ### 2.4 Gestión Administrativa (Manual)
 *   **Panel Admin:** `/admin/leads` (`AdminLeads.jsx`)
 *   **Acción 1: Reportar (Whatsapp):**
     *   Genera deep-link de Whatsapp al contacto del Desarrollador.
     *   Cambia estado a `REPORTED`.
 *   **Acción 2: Asignar:**
     *   Permite seleccionar o registrar un nuevo `ExternalAdvisor`.
     *   Cambia estado a `ASSIGNED_EXTERNAL`.
 
 ---
 
 ## 3. Etapa de Almacenamiento (Firestore)
 
 Base de datos NoSQL orientada a documentos.
 
 *   **Colección `desarrollos`**: Documentos pesados.
 *   **Colección `modelos`**: Documentos ligeros.
 *   **Colección `leads`**: Datos transaccionales. Contiene la verdad completa del contacto (`clienteDatos`).
 *   **Colección `external_advisors`**: Directorio de vendedores de las constructoras.
 
 ---
 
 ## 4. Diagrama de Flujo Actualizado
 
 ```mermaid
 graph TD
     subgraph UI_Interaction [Frontend Interaction]
     User((Usuario)) -->|Click Interes| Auth{Está Logueado?}
     Auth -- No --> Login[Google Login Modal]
     Login --> Scheduler
     Auth -- Si --> Scheduler[Appointment Scheduler]
     Scheduler --> Form[Datos Contacto]
     Form -->|Submit| Service[LeadAssignmentService]
     end
     
     subgraph Backend_Logic [Service Logic]
     Service -->|Lookup| ClientCheck{Existe Cliente?}
     ClientCheck -->|No| CreateClient[Crear Cliente]
     ClientCheck -->|Si| ReuseUID[Reusar UID]
     Service -->|Resolve| DevLookup[Buscar ID Desarrollador]
     Service -->|Persist| Repo[LeadRepository]
     end
     
     subgraph Admin_Ops [Admin Operations]
     Admin((Admin)) -->|View| Dashboard[/admin/leads]
     Dashboard -->|Action| WA[Reportar via WhatsApp]
     WA --> StatusRep[[Status: REPORTED]]
     Dashboard -->|Action| Assign[Asignar Asesor Externo]
     Assign --> StatusAss[[Status: ASSIGNED_EXTERNAL]]
     end
 
     Repo --> Firestore[(Firestore LEADS)]
     StatusRep --> Firestore
     StatusAss --> Firestore
 ```
