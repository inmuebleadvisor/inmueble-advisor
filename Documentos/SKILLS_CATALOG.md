# Catálogo de Skills Agénticas

Este documento mantiene un registro de las skills activas en el entorno de desarrollo, su propósito y su orden de ejecución.

## Orden de Prioridad de Ejecución

1.  **Gobernanza & Arquitectura** (Nivel más alto - Bloqueante)
    -   `deduplication-guard`: **CRÍTICO**. Se ejecuta **ANTES** de cualquier generación de código. Verifica si la funcionalidad ya existe para prevenir deuda técnica.

2.  **Diseño & UX** (Nivel medio - Guiado)
    -   `estilo-marca`: Se ejecuta después de validar la arquitectura. Aplica las guías de estilo, tokens de diseño y metodología BEM.

## Detalle de Skills

### deduplication-guard
-   **Ubicación**: `.agent/skills/deduplication-guard/`
-   **Tipo**: Procedural Logic (Python Script)
-   **Trigger**: Solicitudes de creación de código, nuevos archivos o funcionalidades.
-   **Acción**: Escanea `src/` y `functions/` buscando duplicados semánticos.

### estilo-marca
-   **Ubicación**: (Local)
-   **Tipo**: Contextual Awareness
-   **Trigger**: Solicitudes de UI, componentes o estilos.
-   **Acción**: Asegura consistencia visual y cumplimiento de manual de marca.
