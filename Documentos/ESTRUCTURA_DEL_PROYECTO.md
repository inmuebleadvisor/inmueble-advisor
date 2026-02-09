# Estructura del Proyecto Inmueble Advisor

Este documento describe la arquitectura técnica y la organización de directorios del proyecto **Inmueble Advisor**. Sirve como guía de referencia para entender dónde ubicar nuevos archivos y cómo interactúan los componentes existentes.

## 1. Visión General

El repositorio opera como un **Monorepo** que contiene tanto el Frontend (Single Page Application con React) como el Backend (Serverless con Firebase Cloud Functions).

### Directorio Raíz

| Carpeta | Descripción |
| :--- | :--- |
| `src/` | Código fuente del Frontend (React). |
| `functions/` | Código fuente del Backend (Firebase Cloud Functions). |
| `Documentos/` | Documentación oficial del proyecto (Arquitectura, Guías, Auditorías). |
| `public/` | Archivos estáticos públicos (favicon, robots.txt, manifest). |
| `scripts/` | Scripts de mantenimiento y utilidad (ej. migraciones). |
| `tests/` | Tests de integración y end-to-end (Cypress/Playwright si aplica). |

---

## 2. Arquitectura Frontend (`src/`)

El frontend sigue una **Clean Architecture** pragmática adaptada a React. El objetivo es desacoplar la UI de la lógica de negocio y del acceso a datos.

### Estructura de Directorios

#### 📂 `repositories/` (Capa de Datos)
Encargada de la comunicación directa con fuentes de datos externas (Firestore, Storage, APIs).
*   **Patrón**: Repository Pattern.
*   **Regla**: Solo operaciones CRUD. No debe contener lógica de negocio.
*   **Ejemplo**: `user.repository.js` (métodos `getById`, `create`, `update`).

#### 📂 `services/` (Capa de Negocio)
Contiene la lógica de negocio pura de la aplicación.
*   **Patrón**: Inyección de Dependencias.
*   **Regla**: Orquesta las llamadas a los repositorios y aplica reglas de negocio.
*   **Ejemplo**: `auth.service.js` (método `login` que llama a `userRepository.findByEmail`).

#### 📂 `screens/` (Vistas)
Representan las páginas completas de la aplicación.
*   **Responsabilidad**: Estructurar el layout y conectar los componentes con los servicios.
*   **Ejemplo**: `LoginScreen.jsx`, `DashboardScreen.jsx`.

#### 📂 `components/` (UI Reutilizable)
Componentes visuales aislados.
*   **Responsabilidad**: Renderizar UI basada en `props`. Deben ser "tontos" (presentacionales) siempre que sea posible.
*   **Estilo**: Usan CSS con metodología **BEM**.

#### 📂 `layouts/`
Componentes que envuelven a las `screens` para proveer estructuras comunes (Header, Footer, Sidebar).
*   **Ejemplo**: `MainLayout.jsx`, `AuthLayout.jsx`.

#### 📂 `context/`
Estado global de la aplicación (React Context).
*   **Uso**: Proveer servicios e información transversal (Usuario autenticado, Tema).

#### 📂 `config/`
Configuraciones estáticas y variables de entorno.
*   **Ejemplo**: `firebaseConfig.js`, `routes.js`.

---

## 3. Arquitectura Backend (`functions/src/`)

El backend reside en `functions/` y utiliza **TypeScript**. Sigue una **Arquitectura Hexagonal** (Ports and Adapters) para mantener el núcleo de dominio aislado de la infraestructura.

### Estructura de Directorios

#### 📂 `core/` (El "Hexágono")
Contiene la lógica de dominio pura. No depende de librerías externas ni de Firebase.
*   **Entities**: Modelos de dominio.
*   **Use Cases**: Lógica de aplicación (ej. `CreateUserUseCase`).

#### 📂 `infrastructure/` (Adaptadores)
Implementaciones concretas de interfaces definidas por el Core.
*   **Repositories**: Implementación de acceso a Firestore.
*   **Services**: Implementación de servicios externos (ej. envío de correos).

#### 📂 `interface/` (Puertos de Entrada)
Puntos de entrada a la aplicación.
*   **Cloud Functions**: Triggers de Firestore, HTTP requests, Pub/Sub.
*   **Controllers**: Manejadores de las peticiones.

---

## 4. Estándares de Desarrollo

### Frontend
1.  **CSS BEM**: Todos los estilos deben seguir la convención **Block Element Modifier**.
    *   Ejemplo: `.card__title--highlighted`
2.  **Inyección de Dependencias**: Los componentes no deben importar servicios directamente (singleton). Deben consumirlos a través de Hooks o Contexto.
    ```javascript
    // ✅ Correcto
    const { authService } = useServices();
    
    // ❌ Incorrecto
    import authService from '../services/auth.service';
    ```

### Backend
1.  **TypeScript**: Todo el código nuevo en `functions` debe ser TypeScript estricto.
2.  **Validación**: Usar librerías como `zod` para validar entradas en los controladores.
