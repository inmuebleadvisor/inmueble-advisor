# Estructura del Proyecto Inmueble Advisor

Este documento describe la estructura organizativa y arquitectónica actual del proyecto **Inmueble Advisor** (fecha: Enero 2026).

## 1. Visión General del Directorio Raíz

*   **`src/`**: Contiene todo el código fuente del frontend (aplicación React).
*   **`functions/`**: Contiene el código del backend (Firebase Cloud Functions).
*   **`Documentos/`**: Documentación del proyecto (Manual de Arquitectura, guías de estilo, estructura de datos).
*   **`public/`**: Archivos estáticos públicos.
*   **`scripts/`**: Scripts de utilidad (ej. migraciones o tareas de mantenimiento).
*   **`tests/`**: Tests automatizados.
*   **`data-manager/`**: Herramientas o scripts para gestión de datos (posiblemente seeders o backups).

## 2. Arquitectura Frontend (`src/`)

El frontend sigue una **Clean Architecture** adaptada a React, separando claramente la responsabilidad de acceso a datos, lógica de negocio y presentación.

### Capas Principales

#### 📂 `repositories/` (Capa de Acceso a Datos)
*   **Propósito**: Abstraer la interacción directa con la base de datos (Firestore).
*   **Patrón**: Repository Pattern.
*   **Ejemplos**: `user.repository.js`, `lead.repository.js`.
*   **Responsabilidad**: Solo operaciones CRUD y consultas a la base de datos. No contiene lógica de negocio compleja.

#### 📂 `services/` (Capa de Lógica de Negocio)
*   **Propósito**: Contener la lógica de negocio y orquestar llamadas a los repositorios.
*   **Patrón Moderno**: Inyección de Dependencias vía React Context.
*   **Ejemplos**: `auth.service.js`, `crm.service.js`.
*   **Consumo**: Los componentes deben utilizar Hooks (`useService()`) para acceder a la lógica.
*   **Archivo de Inicialización**: `service.provider.js`. Este archivo actúa únicamente como "Fábrica" ("Composition Root") para instanciar las clases. **NO debe importarse directamente en los componentes**. Su único propósito es alimentar el `ServiceProvider` (Contexto).

#### 📂 `screens/` (Capa de Presentación - Páginas)
*   **Propósito**: Representar las vistas o páginas completas de la aplicación.
*   **Responsabilidad**: Estructurar el layout de la página y conectar los componentes con los servicios/estado global.
*   **Ejemplos**: `AdminHome.jsx` (probablemente), páginas de login, dashboard.

#### 📂 `components/` (Capa de Presentación - Componentes)
*   **Propósito**: Componentes de UI reutilizables y aislados.
*   **Responsabilidad**: Renderizar UI basada en props. Deberían ser agnósticos de la lógica de negocio compleja cuando sea posible.

### Otros Directorios Importantes

*   **`context/`**: Manejo del estado global de React (ej. `AuthContext`, `ThemeContext`).
*   **`hooks/`**: Custom Hooks para extraer lógica de componentes (ej. hooks para formularios, listeners, etc.).
*   **`utils/`**: Funciones puras de utilidad (formateo de fechas, validadores).
*   **`types/`**: Definiciones de tipos (aunque el proyecto es JS, puede contener JSDoc types o definiciones TS si se migra).
*   **`config/`**: Configuraciones generales.
*   **`firebase/`**: Inicialización y configuración de Firebase (`config.js`).
*   **`styles/`**: Archivos CSS o módulos de estilos.
*   **`assets/`**: Imágenes e iconos.
*   **`layouts/`**: Componentes que definen estructuras comunes (ej. `AdminLayout`, `AuthLayout`).

## 3. Backend (`functions/`)

Contiene la lógica de servidor ejecutada en Firebase Cloud Functions.

*   **`src/`**: Código fuente de las funciones (TypeScript), organizado bajo **Clean Architecture**:
    *   **`/src/core`**: Dominio y Lógica de Negocio Pura (Use Cases, Entities).
    *   **`/src/infrastructure`**: Adaptadores de Salida (Repositories, Servicios Externos).
    *   **`/src/interface`**: Adaptadores de Entrada (Triggers, Callable Functions).
*   **`lib/`**: Código compilado (JavaScript) listo para despliegue.
*   **Propósito**: Manejar triggers de Firestore, autenticación avanzada, tareas programadas o lógica sensible que no debe estar en el cliente.

## 4. Documentación Referenciada

En la carpeta `Documentos/` se encuentran guías esenciales que rigen el desarrollo:

*   **`MANUALDEARQUITECTURA.md`**: Define los principios arquitectónicos.
*   **`DATOSESTRUCTURA.md`**: Esquema de datos y modelos.
*   **`ESTILOS_GUIA.md` y `ESTILOS_TEMPORADA.md`**: Guías de diseño y UI.
*   **`BIGQUERY_SETUP.md`**: Configuración de analítica.

## 5. Notas Importantes sobre el Desarrollo

*   **CSS BEM**: Se debe aplicar la metodología BEM para los estilos CSS.
*   **Inyección de Dependencias**: Se prioriza el uso de Hooks (`useService`) para mantener los componentes desacoplados y testables. Evitar la importación directa de `services` desde `serviceProvider.js` (marcado como Legacy para consumo directo).
