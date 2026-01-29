# Mapeo de Procesos y Funciones del Módulo Administrador

## 1. Visión General
El módulo del Administrador proporciona herramientas para la gestión de la plataforma, exportación de datos, asignación de leads y monitoreo de rendimiento. Sigue una **Arquitectura de Capas Segregadas**:
- **Frontend**: Ubicado en `src/screens/admin/*` y orquestado por `AdminLayout`.
- **Backend**: Casos de uso en `functions/src/core/usecases` y puntos de entrada en `functions/src/interface/callable`.

> 💡 **Nota Didáctica**: Esta separación (Arquitectura Hexagonal) asegura que si el día de mañana cambiamos la base de datos (Firestore) por otra, la lógica de negocio en `core/usecases` no necesite ser modificada.

## 2. Mapa del Frontend (Interfaces de Usuario)

| Componente / Pantalla | Ruta | Funciones Clave | Servicio Asociado |
| :--- | :--- | :--- | :--- |
| **AdminLayout** | `src/layouts/AdminLayout.jsx` | Sidebar, Encabezado, Guardias de Autenticación | - |
| **AdminHome** (Dashboard) | `src/screens/admin/AdminHome.jsx` | - Ver métricas clave diarias<br>- Gráficos de tendencias<br>- Top de desarrollos inmobiliarios | `DashboardService`<br>`dashboard.getLatestStats()` |
| **AdminLeads** | `src/screens/admin/AdminLeads.jsx` | - **Filtrar**: Pendientes, Reportados, Asignados<br>- **Reportar**: Envío de WhatsApp al desarrollador<br>- **Asignar**: Vincular con un Asesor Externo | `CRMService` (local)<br>`ExternalAdvisorService` |
| **AdminDataExport** | `src/screens/admin/AdminDataExport.jsx` | - **Exportar Desarrollos**: CSV de inventario<br>- **Exportar Modelos**: CSV de unidades de vivienda | `AdminService` (local)<br>`admin.getAllDesarrollos()` |
| **AdminUsers** | `src/screens/admin/AdminUsers.jsx` | - Listado total de usuarios registrados<br>- Visualización de roles (Admin/Asesor/Cliente) | `AdminService` |

> 💡 **Nota Didáctica**: En `AdminLeads`, el proceso de "Reportar" genera un enlace de WhatsApp dinámico. Esto permite una comunicación inmediata con el desarrollador externo sin necesidad de integraciones de API complejas en esta etapa.

## 3. Mapa del Backend (Lógica y Datos)

| Caso de Uso / Función | Ruta | Tipo | Disparador (Trigger) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **GenerateDashboardStats** | `functions/.../GenerateDashboardStats.ts` | **Caso de Uso** | Programado (Diario) | Agrega datos de Firestore en la colección `stats_daily`. |
| **PromoteUserUseCase** | `functions/.../PromoteUserUseCase.ts` | **Caso de Uso** | Callable / Trigger | Lógica central para otorgar el rol de Asesor a un usuario. |
| **promoteToAdvisor** | `functions/.../promoteToAdvisor.ts` | **Interfaz** | HTTPS Callable | Endpoint para que el propio usuario solicite ser asesor. |
| **onLead*META** | `functions/.../onLead*META.ts` | **Interfaz** | Triggers de Firestore | Reporta eventos a la API de Conversiones de Meta (Facebook). |

> 💡 **Nota Didáctica**: Los **Triggers de Firestore** son funciones que "reaccionan" automáticamente cuando algo cambia en la base de datos. Por ejemplo, al crearse un Lead, el trigger de Meta se dispara solo, desacoplando la lógica de marketing de la lógica de creación del lead.

## 4. Procesos Clave

### A. Recolección de Datos para el Dashboard
1. **Disparador**: Trabajo programado (Cloud Scheduler) que se ejecuta diariamente.
2. **Acción**: Llama a `GenerateDashboardStats.execute()`.
3. **Lógica**: Consulta `users`, `leads` y `desarrollos`. Calcula usuarios activos, nuevos prospectos y proyecciones de ingresos.
4. **Persistencia**: Guarda una captura (snapshot) en `stats_daily/{YYYY-MM-DD}`.
5. **Consumo**: El componente `AdminHome` lee esta captura para mostrar las gráficas.

### B. Flujo de Asignación de Leads
1. **Usuario**: El Admin hace clic en "Asignar" en la lista de Leads.
2. **Interfaz**: Consulta asesores disponibles mediante `ExternalAdvisorService.getByDeveloper(devId)`.
3. **Opción A (Existente)**: Selecciona un asesor y llama a `crm.asignarAsesorExterno()`.
4. **Opción B (Nuevo)**: Registra un nuevo asesor y luego realiza la asignación.

### C. Exportación de Datos
1. **Usuario**: Clic en "Descargar CSV".
2. **Frontend**: Recupera todos los documentos necesarios de Firestore.
3. **Transformación**: Mapea los documentos (objetos JSON) a filas planas de texto para el archivo CSV.
4. **Salida**: El navegador inicia la descarga automática del archivo.
