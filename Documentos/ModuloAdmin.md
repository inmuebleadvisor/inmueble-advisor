# Documentación Técnica: Módulo Administrador

## 1. Visión General y Alcance

El **Módulo Administrador** de Inmueble Advisor es el centro de control centralizado diseñado para la gestión B2B (Business-to-Business) y la supervisión operativa de la plataforma. Su objetivo principal es facilitar la conexión entre Desarrolladores y Leads, así como la administración de usuarios del sistema.

### Alcance Funcional
1.  **Dashboard General (KPIs)**: Visualización de métricas clave en tiempo real (Leads Totales, Activos, Ganados, Perdidos).
2.  **Gestión de Leads B2B**:
    *   Visualización de Leads generados por clientes.
    *   **Reporte a Developer**: Funcionalidad para notificar vía WhatsApp a los desarrolladores sobre nuevos prospectos.
    *   **Asignación de Asesores Externos**: Registro de asesores inmobiliarios externos asignados a cada lead.
    *   Seguimiento de estados (Nuevo -> Reportado -> Asignado -> Ganado/Perdido).
3.  **Gestión de Usuarios**: Listado y control de usuarios registrados (Clientes y Asesores propios).
4.  **Configuración del Sistema**: Visualización del estado de temporadas y configuraciones globales.

## 2. Arquitectura Técnica

El módulo sigue la arquitectura modular definida en el `MANUALDEARQUITECTURA.md`, separando responsabilidades en Capas (UI, Servicios, Repositorios).

### Estructura de Componentes
El módulo reside bajo la ruta `/administrador` y utiliza un Layout dedicado.

*   **Layout**: `src/layouts/AdminLayout.jsx` (Sidebar + Header + Content Area).
*   **Vistas (Screens)**:
    *   `src/screens/admin/AdminHome.jsx`: Resumen y KPIs.
    *   `src/screens/admin/AdminLeads.jsx`: Tabla avanzada de gestión de leads.
    *   `src/screens/admin/AdminUsers.jsx`: Tabla de usuarios.
    *   `src/screens/admin/AdminDataExport.jsx`: Herramienta de exportación masiva de datos.
*   **Componentes Reutilizables**:
    *   `src/components/admin/KPICard.jsx`: Tarjetas de métricas.
    *   `src/components/admin/DataTable.jsx`: Tabla genérica con soporte para filtros y acciones.
    *   `src/components/admin/ExternalAdvisorModal.jsx`: Modal para asignación de asesores.

### Capa de Datos, Servicios y Repositorios

Siguiendo el principio **SRP (Single Responsibility Principle)** y **Dependency Injection (DI)**:

1.  **Repositorios (`src/repositories/`)**:
    *   Encargados **exclusivos** del acceso directo a Firebase Firestore.
    *   Ejemplos: `UserRepository`, `LeadRepository`, `CatalogRepository`.
    *   No contienen lógica de negocio, solo CRUD y queries.

2.  **Servicios (`src/services/`)**:
    *   Contienen la lógica de negocio y orquestación.
    *   **No acceden a la DB directamente**, sino que consumen los Repositorios inyectados.
    *   **`src/services/admin.service.js`**: Facade para lectura de datos globales (Users, Leads) usando `UserRepository` y `LeadRepository`.
    *   **`src/services/crm.service.js`**: Maneja la lógica transaccional de Leads (cambios de estado, asignaciones) usando `LeadRepository` y `ExternalAdvisorService`.

3.  **Inyección de Dependencias**:
    *   Centralizada en `src/services/serviceProvider.js`.
    *   Los componentes de React consumen estos servicios a través del `ServiceContext` y el hook `useServiceContext()`.

## 3. Guía de Estilos y UI

El diseño se adhiere estrictamente a `Documentos/ESTILOS_GUIA.md`:

*   **Colores**:
    *   Fondos: `--bg-main` para el layout general, `--bg-secondary` para tarjetas/tablas.
    *   Acentos: `--primary-color` para acciones principales.
    *   Textos: `--text-main` y `--text-secondary`.
*   **Modo Oscuro**: Todos los componentes responden automáticamente a las variables CSS globales para soportar el tema oscuro premium.
*   **Metodología CSS**: Se utiliza **BEM** (Block Element Modifier) para las clases CSS (ej. `.admin-card__title`, `.admin-sidebar--collapsed`).

## 4. Seguridad

*   **Protección de Rutas**: El acceso a `/administrador` está protegido por el HOC `ProtectedRoute` con la bandera `requireAdmin={true}`.
*   **Permisos de Datos**: Las reglas de seguridad de Firebase (Firestore Rules) deben validar que solo el `uid` con rol de administrador pueda leer/escribir en las proyecciones globales de datos.

## 5. Glosario de Estados (Leads)

*   `PENDING_DEVELOPER_CONTACT`: Lead nuevo, requiere acción manual de reporte.
*   `REPORTED`: Lead notificado al desarrollador (vía WhatsApp).
*   `ASSIGNED_EXTERNAL`: Lead asignado a un asesor externo específico.
*   `WON/LOST`: Estados finales de cierre.
