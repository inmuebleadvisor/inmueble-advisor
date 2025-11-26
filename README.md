📘 Inmueble Advisor: Manual de Arquitectura y Diseño (Blueprint)

Este documento define las reglas estrictas de desarrollo, diseño visual, flujo de datos y arquitectura para la Web App Progresiva (PWA) "Inmueble Advisor".

1. Stack Tecnológico 🛠️

Core: React (Vite).

Routing: React Router DOM (v6+).

Estilos: CSS-in-JS (Objetos de estilo) + Variables CSS Globales.

Mapas: React-Leaflet + OpenStreetMap.

Estado: Context API (UserContext).

Persistencia: LocalStorage (gestionado exclusivamente vía Context).

Despliegue: Vercel (SPA configuration).

2. Estructura de Archivos (Estricta) 📂

El proyecto debe mantener esta jerarquía para garantizar la navegación y carga de datos:

src/
├── assets/              # Recursos estáticos
├── components/
│    └── Layout.jsx      # Marco principal (Header, Outlet, Footer)
├── context/
│    └── UserContext.jsx # Única fuente de verdad para Sesión y Analytics
├── data/
│    ├── desarrollos.json # "Tabla" Padre (Ubicación, Amenidades generales)
│    └── modelos.json     # "Tabla" Hija (Precios, Habitaciones, Fotos interiores)
├── screens/             # Pantallas (Vistas completas)
│    ├── Catalogo.jsx    # Listado con filtros
│    ├── DetalleModelo.jsx
│    ├── DetalleDesarrollo.jsx
│    ├── Mapa.jsx        # Mapa interactivo con Leaflet
│    └── Perfil.jsx
├── App.jsx              # Router principal (Rutas anidadas)
├── index.css            # Variables globales y reset
└── main.jsx             # Punto de entrada
root/
└── vercel.json          # Configuración de reescritura para SPA (evitar 404s)


3. Sistema de Diseño (Visual) 🎨

Identidad

Color Primario: var(--primary-color) -> #00396a (Azul corporativo).

Fondo General: var(--bg-color) -> #f4f6f9 (Gris muy claro).

Tipografía: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif.

Reglas de Estilo (CSS-in-JS)

No usar archivos .css separados por componente.

Definir un objeto const styles = { ... } al final del archivo JSX.

Usar className="main-content" (definida en index.css) para el contenedor principal de cada pantalla, lo que garantiza márgenes responsivos automáticos.

Iconografía

No instalar librerías pesadas (como FontAwesome).

Usar SVGs en línea (inline) dentro de un objeto const Icons = { ... } en el mismo archivo del componente.

Header y Navegación

El Header debe mostrar el logo oficial optimizado para fondo azul.

El menú activo debe tener: fontWeight: '700' y borderBottom: '3px solid #fbbf24' (Amarillo/Dorado).

4. Arquitectura de Datos y Relaciones 🧠

Simulamos una base de datos relacional usando dos JSONs.

Entidades

Desarrollo (Padre): Contiene la geolocalización (lat, lng), nombre del fraccionamiento, zona y amenidades generales (parques, seguridad).

ID: id_desarrollo (string).

Modelo (Hijo): Contiene el precio específico, número de recámaras, m² de construcción y fotos de la casa.

Foreign Key: id_desarrollo (debe coincidir con el Padre).

Generación de Slugs (IDs de URL)

Para crear URLs amigables y únicas en el Router, usamos esta fórmula al procesar los datos:
const uniqueId = ${idDesarrollo}-${nombreModeloSlug}-${index}
Ejemplo: 2846-aguila-0

Regla de Filtrado en Mapa vs. Catálogo

Catálogo: Muestra Casas (Modelos) individuales.

Mapa: Muestra Puntos (Desarrollos).

Lógica: Un desarrollo aparece en el mapa SI Y SOLO SI al menos uno de sus modelos cumple con los filtros activos (precio, recámaras).

Etiqueta: El pin del mapa debe mostrar el rango de precios: "$1.2M - $1.5M".

5. Reglas de Oro de Programación (Golden Rules) ⚠️

1. Estado y Contexto (UserContext)

Prohibido: Leer localStorage directamente dentro de los componentes (screens).

Correcto: Usar el hook const { user, trackBehavior } = useUser();.

Razón: Mantener la reactividad y centralizar la lógica de sesión.

2. Analytics (TrackBehavior)

Cada interacción importante debe registrarse:

trackBehavior('view_item', { ... })

trackBehavior('filter_change', { ... })

Importante: Usar useEffect con dependencias estrictas [id] para evitar bucles infinitos al registrar visitas.

3. Manejo de Errores e Imágenes

Siempre usar un Fallback Image (imagen por defecto) si la URL de la foto falla.

Validar precios: Si el precio es 0, null o NaN, el ítem no debe mostrarse o debe manejarse para no romper cálculos matemáticos (como el Math.min del mapa).

4. Rutas (React Router)

Usar rutas relativas dentro de App.jsx.

Siempre incluir la configuración de "rewrites" en vercel.json para producción:

{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }


6. Snippets Comunes 📋

Formato de Moneda (MXN)

const formatoMoneda = (val) => {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN', 
    maximumFractionDigits: 0 
  }).format(val);
};


Importación de Imágenes (Leaflet)

Para mapas, siempre incluir al inicio:

import 'leaflet/dist/leaflet.css';