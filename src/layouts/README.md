# Layouts 🏗️

Este directorio contiene los componentes de estructura principal de la aplicación. Los layouts definen el "cascarón" o marco donde se renderizan las diferentes pantallas (screens) mediante el uso de `<Outlet />` de `react-router-dom`.

## 📂 Contenido del Módulo

### 1. `MainLayout.jsx`
Es el layout principal utilizado para la navegación pública y del cliente.
- **Componentes Incluidos:**
    - `Navbar`: Barra de navegación superior.
    - `main`: Contenedor principal para el contenido dinámico.
    - `Footer`: Pie de página con enlaces legales, leyenda informativa y derechos de autor.
    - `WhatsAppButton`: Botón flotante de contacto.
- **Lógica Destacada:**
    - Detecta si la ruta actual es el Home (`/`) o el panel administrador para ajustar el padding mediante la clase `main-content--full`.
    - Centraliza la inyección de estilos globales de layout definidos en `src/styles/Layout.css`.

### 2. `AdminLayout.jsx`
Estructura dedicada exclusivamente al panel de administración.
- **Componentes Incluidos:**
    - `AdminSidebar`: Menú lateral de navegación administrativa.
    - `AdminHeader`: Encabezado del panel.
    - `Outlet`: Área de renderizado para las herramientas administrativas.
- **Estado Local:**
    - Gestiona el estado `isSidebarCollapsed` para permitir la expansión/contracción del menú lateral.
- **Estilos:** Utiliza `src/styles/Admin.css` para su apariencia específica.

## 🛠️ Directrices de Uso

1. **Persistencia de Estado:** Al agregar elementos globales (como banners de notificación o modales persistentes), deben colocarse en `MainLayout` si afectan a toda la aplicación cliente.
2. **Responsividad:** Los layouts deben asegurar que el contenido principal sea accesible en todos los tamaños de pantalla. `MainLayout` aplica clases condicionales para maximizar el espacio cuando es necesario.
3. **Separación de Responsabilidades:** La lógica de negocio pesada debe residir en hooks o contextos; los layouts solo deben orquestar la disposición visual y el estado mínimo de la interfaz (ej: colapso de sidebar).

---
*Documentación generada automáticamente para asegurar la trazabilidad del diseño estructural.*
