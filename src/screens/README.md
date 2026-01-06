# 📱 Screens (Vistas)

Este directorio contiene los componentes de **Vista (Page Views)** que actúan como contenedores principales de cada ruta de la aplicación.

## Estructura

*   **`catalogo/`**: Vistas relacionadas a la exploración de inmuebles (`Catalogo`, `DetalleModelo`, `Mapa`).
*   **`cliente/`**: Vistas del panel de usuario final (`Perfil`, `Favoritos`, `Onboarding`).
*   **`admin/`**: Panel de administración y dashboard de leads.
*   **`leads/`**: Landing pages específicas para captura.

## Responsabilidades
*   Recibir parámetros de navegación (Router).
*   Orquestar la carga de datos (usando Hooks/Context).
*   Renderizar componentes de `src/components` y `src/layouts`.
