# Análisis del Customer Journey y Dashboard del Asesor

Este documento detalla el análisis del flujo del usuario "Asesor" y la implementación técnica actual de su Dashboard, identificando códigos inconclusos, deuda técnica y fallos críticos.

---

## 1. Análisis del Customer Journey (Asesor)

El viaje del asesor dentro de la plataforma consta de tres etapas principales: **Captación**, **Onboarding** y **Operación**.

### 1.1. Etapa de Captación
- **Punto de Entrada**: Ruta pública `/soy-asesor`.
- **Interacción**:
  - El usuario visualiza la propuesta de valor ("Leads pre-calificados", "Sin mensualidad").
  - Hace clic en **"Comenzar Registro Gratuito"**.
  - **Lógica de Autenticación**:
    - Si no está logueado: Se dispara el popup de Google Login.
    - Si ya está logueado (o al terminar el login): El sistema detecta su rol.
- **Redireccionamiento Inteligente**:
  - Si el usuario ya es `asesor`: Redirige a `/account-asesor` (Dashboard).
  - Si el usuario es `cliente` o nuevo: Redirige a `/onboarding-asesor`.

### 1.2. Etapa de Onboarding
- **Ruta**: `/onboarding-asesor` (Protegida, requiere login).
- **Control de Flujo**:
  - Si un asesor con `onboardingCompleto: true` intenta entrar aquí, es redirigido automáticamente al Dashboard.
- **Wizard de 2 Pasos**:
  1.  **Contacto**: Solicitud de número telefónico (validación de 10 dígitos).
  2.  **Inventario**: Selección de desarrollos que el asesor está autorizado a comercializar.
      - *Nota*: Los desarrollos se guardan con estado `activo: false` (pendiente de aprobación Admin).
- **Cierre**:
  - Al finalizar, se actualiza el perfil del usuario en Firestore:
    - `role` cambia a `'asesor'`.
    - `onboardingCompleto` se establece en `true`.
  - Redirección final al Dashboard.

### 1.3. Etapa de Operación (Dashboard)
- **Ruta**: `/account-asesor`.
- **Experiencia**:
  - **Hero Section**: Visualización de Nivel (Elite/Pro), Score Global y Métricas.
  - **Gestión de Leads**: Tablero principal con leads "Por Atender".
  - **Inventario**: Widget lateral para ver el estado de sus desarrollos (Activo/Bloqueado).

---

## 2. Análisis del Código del Dashboard (`AccountAsesor.jsx`)

### 2.1. Componentes Involucrados
*   **Pantalla Principal**: `src/screens/AccountAsesor.jsx`.
*   **Tarjeta de Lead**: `src/components/LeadCard.jsx`.
*   **Modal de Acción**: `src/components/LeadActionModal.jsx`.
*   **Servicios**: `crm.service.js` (Lectura de leads), `catalog.service.js` (Inventario), `analytics.service.js` (Cálculo local de métricas).

### 2.2. Estado de la Implementación

| Funcionalidad | Estado | Observación |
| :--- | :--- | :--- |
| **Lista de Leads** | ✅ Completo | Implementado con `onSnapshot` (Tiempo Real). Excelente práctica. |
| **Métricas (Score)** | ⚠️ Parcial | El `scoreGlobal` viene de BD (backend), pero `tasaCierre` se calcula en frontend. |
| **Gestión de Estados** | ✅ Completo | `LeadActionModal` permite mover leads por el embudo correctamente. |
| **Inventario** | ⚠️ Básico | Solo lectura (antes). Ahora incluye modal de solicitud de nuevos desarrollos. |
| **Historial** | ⚠️ Básico | Lista simple sin filtros ni paginación "Cargar más". |

---

## 3. Códigos Inconclusos, Fallos Críticos y Deuda Técnica

A continuación se listan los problemas hallados tras la revisión del código fuente.

### 🔴 Fallos Críticos (Critical Failures)

1.  **Sincronización de Permisos de Inventario**:
    *   **El Problema**: El inventario se carga usando `userProfile.inventario` en `AccountAsesor.jsx`.
    *   **La Causa**: `UserContext` obtiene el perfil del usuario (`userProfile`) usando `getDoc` (una sola vez al login), **NO** usa `onSnapshot` para el perfil.
    *   **El Impacto**: Si un administrador aprueba el inventario de un asesor (cambia `activo: false` a `true` en BD), **el asesor NO se enterará ni verá el cambio reflejado** hasta que recargue la página o cierre sesión.

2.  **Validación de Inventario "Quemada"**:
    *   El código asume que el inventario tiene la estructura `{ idDesarrollo, activo: boolean }`.
    *   Si el esquema de la base de datos cambia o si se borra un desarrollo de la colección `desarrollos`, `hidratarInventarioAsesor` podría fallar.

### 🟡 Códigos Inconclusos (Unfinished Code / TODOs)

1.  **Simulacion de Leads en Producción**:
    *   En `AccountAsesor.jsx` existe la función `handleSimularLead` y un botón de "Test Tube" (`Icons.Test`) visible en la UI.
    *   **Riesgo**: Este código genera leads falsos. Debe ser protegido.

2.  **Gestión de Inventario Post-Onboarding**:
    *   ~~**Faltante**: No existe ninguna interfaz en el Dashboard para que el asesor pueda **agregar nuevos desarrollos**.~~ (Corregido: Implementado modal de solicitud en `AccountAsesor.jsx`).
    *   **Estado Actual**: Se ha añadido un botón de "+" en el widget de inventario.

3.  **Perfil de Usuario Estático**:
    *   No hay funcionalidad para editar el teléfono, foto o nombre desde el dashboard.

### 🟠 Deuda Técnica y Calidad de Código

1.  **Estilos en Línea (Inline Styles)**:
    *   El archivo `AccountAsesor.jsx` tiene más de 50 líneas de objeto `styles` al final.

2.  **Responsividad Limitada**:
    *   Usa lógica `isDesktop` en JS en lugar de CSS Media Queries.

## 4. Analítica y Niveles de Asesor (Gamificación)

El sistema implementa un modelo de meritocracia basado en métricas clave que definen el nivel del asesor.

### Lógica de Niveles (Gamificación)
El nivel se determina puramente por el **Score Global** (0-100).
*   **Elite**: Score >= 90.
*   **Pro**: Score >= 80 y < 90.
*   **Rookie**: Score < 80.

*Fuente: `AccountAsesor.jsx` (Cálculo directo en render).*

### Origen de las Métricas

| Métrica | Origen de Datos | Cálculo / Fuente |
| :--- | :--- | :--- |
| **Score Global** | Backend (Firestore) | Propiedad `userProfile.scoreGlobal`. Calculado y actualizado exclusivamente por Cloud Functions para evitar manipulación. |
| **Tasa de Cierre** | Frontend (`analytics.service.js`) | `(Leads Ganados / Total Leads Finalizados) * 100`. Se recalcula en tiempo real en el cliente cada vez que cambian los leads. |
| **Promedio Reseñas** | Backend (Firestore) | Propiedad `userProfile.metricas.promedioResenas`. |
| **Ventas Acumuladas** | Frontend (`analytics.service.js`) | Sumatoria de `lead.cierre.montoFinal` de todos los leads con status `WON`. |

Esta arquitectura híbrida permite mostrar feedback inmediato en métricas operativas (Tasa de cierre, Ventas) mientras se protege la integridad del nivel del asesor (Score) en el servidor.
