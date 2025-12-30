# Guía de Estilos y Configuración de Colores

Este documento detalla cómo los cambios en la configuración global de colores afectan a la aplicación en sus modos **Claro (Light)** y **Oscuro (Dark)**.

## 🎨 Configuración Global (`src/index.css`)

Los colores principales se definen al inicio del archivo `src/index.css` y actúan como la fuente de verdad única para toda la aplicación.

### Variables Base

| Variable | Descripción | Valor Actual (Ejemplo) |
| :--- | :--- | :--- |
| `--base-primary-light` | **Color Primario para Modo Claro**. Se usa cuando el fondo es blanco/claro. Debe tener suficiente contraste para leerse como texto. | `#dcb23a` (Gold) |
| `--base-primary-dark` | **Color Primario para Modo Oscuro**. Se usa cuando el fondo es oscuro. Debe ser brillante y vibrante. | `#f59e0b` (Bright Gold) |
| `--base-brand-blue` | **Color de Marca Secundario**. Tono oscuro/azul corporativo. | `#0f172a` (Dark Slate) |
| `--base-accent-blue` | **Acentos y Enlaces**. Usado para hipervínculos o estados informativos. | `#0284c7` (Blue) |

---

## 🌓 Impacto por Modos

### ☀️ Modo Claro (Light Mode)

Cuando el usuario selecciona el tema claro o es el default del sistema.

| Elemento UI | Color Usado | Variable CSS | Efecto Visual |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | Blanco/Gris Muy Claro | `--bg-main` | Fondo general de la página (`body`). |
| **Fondo Tarjetas/Paneles** | Blanco Puro | `--bg-secondary` | Fondo de las tarjetas de propiedades, sidebar, modales. |
| **Texto Títulos/Cuerpo** | Marca Secundaria (Azul Oscuro) | `--text-main` | Color principal de lectura para máximo contraste. Hereda de `--base-brand-blue`. |
| **Texto Secundario** | Gris Medio | `--text-secondary` | Descripciones, etiquetas de formularios. |
| **Botones Primarios** | **Primario Claro** | `--primary-color` | Fondo de botones principales "Ver Detalles", "Contactar". Hereda de `--base-primary-light`. |
| **Iconos / Alertas** | **Primario Claro** | `--primary-color` | Iconos SVG (Pines, info), bordes de inputs activos. |
| **Insignias (Badges)** | Gradiente | `--primary-color` a Hover | Fondo de etiquetas como "Entrega Inmediata" (si aplica estilo gold). |

### 🌙 Modo Oscuro (Dark Mode Premium)

Cuando el usuario activa el switch de tema.

| Elemento UI | Color Usado | Variable CSS | Efecto Visual |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | Azul Oscuro Profundo | `--bg-main` | Fondo general (`#0f172a`). Aporta profundidad premium. |
| **Fondo Tarjetas/Paneles** | Azul Grisáceo Oscuro | `--bg-secondary` | Fondo de contenedores, ligeramente más claro que el fondo principal para elevación. |
| **Texto Títulos/Cuerpo** | Blanco Casi Puro | `--text-main` | Color de lectura principal. |
| **Texto Secundario** | Gris Azulado Claro | `--text-secondary` | Descripciones, metadatos de propiedades. |
| **Botones Primarios** | **Primario Oscuro** | `--primary-color` | Fondo brillante y vibrante. Hereda de `--base-primary-dark`. |
| **Bordes Sutiles** | Blanco (% Opacidad) | `--border-subtle` | Líneas divisorias apenas visibles para separar secciones. |
| **Brillo/Glow** | **Primario Oscuro** | `--shadow-glow` | Efecto de resplandor detrás de elementos destacados. |

---

## 🛠 Guía de Mantenimiento

### ¿Cómo cambiar el color de marca?
1. Abra `src/index.css`.
2. Busque la sección `:root` al inicio.
3. Modifique `--base-primary-light` si quiere cambiar el tono principal en modo claro (ej. a un azul corporativo).
4. Modifique `--base-primary-dark` para ajustar cómo se ve ese color en modo oscuro (generalmente una versión más brillante/pastel del mismo tono).

### ¿Cómo cambiar el fondo oscuro?
1. En `src/index.css`, busque la sección `/* --- DARK PREMIUM THEME VARIABLES --- */`.
2. Modifique `--bg-main` (fondo base) y `--bg-secondary` (fondo de componentes).
3. **Recomendación**: Mantenga `--bg-secondary` ligeramente más claro (mayor *lightness*) que `--bg-main` para mantener la jerarquía visual de profundidad.
