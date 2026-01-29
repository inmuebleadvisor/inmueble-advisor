# Manual Técnico: Módulo Administrador (2026)

**Versión:** 2.0 (Post-Migración a Looker Studio - Enero 2026)
**Ubicación:** `/src/screens/admin`
**Acceso:** Ruta protegida `/administrador` (Requiere rol: `admin` o `asesor`)

---

## 1. Visión General
El Módulo Administrador gestiona la operación central de la plataforma, incluyendo usuarios, leads e inventario. Las analíticas de negocio (BI) han sido delegadas a **Looker Studio** para garantizar robustez, escalabilidad y consultas en tiempo real sin impactar el rendimiento de la aplicación.

---

## 2. Arquitectura de Datos y Flujo

### 2.1 Modelo de Servicios
La lógica operativa reside en `AdminService.js`. El dashboard interno ha sido remplazado por una integración externa.

| Capa | Responsabilidad | Archivos Clave |
| :--- | :--- | :--- |
| **UI (Vista)** | Renderizar gestión operativa y portal de analíticas. | `AdminHome.jsx`, `AdminLeads.jsx`, `AdminUsers.jsx` |
| **Servicio (Lógica)** | Orquestar transacciones operativas (CRM, Usuarios). | `admin.service.js` |
| **Infraestructura** | Analíticas avanzadas y Visualización de datos. | **Looker Studio** (vía BigQuery) |

### 2.2 Integración con Looker Studio
El sistema de visualización de datos funciona de la siguiente manera:
1.  **Ingesta:** Las extensiones de Firebase sincronizan Firestore con BigQuery en tiempo real.
2.  **Procesamiento:** BigQuery actúa como el Data Warehouse central.
3.  **Visualización:** Looker Studio consulta directamente BigQuery para generar reportes interactivos.
4.  **Acceso:** El panel de **Analíticas** en la aplicación (`AdminHome.jsx`) actúa como el portal de acceso a estos reportes externos.

---

## 3. Componentes Principales

### 3.1 Portal de Analíticas (`AdminHome.jsx`)
Sustituye al antiguo dashboard interno.
*   **Función:** Proporciona un punto de entrada centralizado para los reportes de Looker Studio.
*   **Implementación:** Componente limpio preparado para la inserción de `iframes` de reportes.

### 3.2 Gestión de Leads (`AdminLeads.jsx`)
Tabla operativa para la gestión de prospectos y asignación de ventas.
*   **Funcionalidad:** Permite reportar leads a desarrolladores y asignarlos a asesores externos.
*   **Data Hook:** Consume datos de `useAdminData.js`, el cual orquesta las llamadas a través de `admin.service.js`.

### 3.3 Gestión de Usuarios (`AdminUsers.jsx`)
Directorio operativo de usuarios del sistema.
*   **Promoción de Roles:** Permite a un Administrador promover a un "Cliente" al rol de "Asesor".
*   **Seguridad:** Validado por el backend en Cloud Functions para garantizar que solo administradores realicen esta acción.

---

## 4. Estándares de Diseño y Estilo

*   **UI/UX:** El módulo sigue la identidad **Gold/Slate** de Inmueble Advisor.
*   **Componentes:** Uso intensivo de `DataTable.jsx` para consistencia en la visualización de listas.
*   **Iconografía:** Integración con `lucide-react`. El icono de `BarChart2` identifica las secciones de análisis.

---
*Este documento es el reflejo fiel de la arquitectura del proyecto tras la simplificación de analíticas realizada el 29 de Enero de 2026. La responsabilidad de cálculo de métricas recae ahora 100% en infraestructura de BI (Looker/BigQuery).*
