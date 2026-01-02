# 📟 GUÍA DE OPERACIÓN - DATA MANAGER CLI

**Versión:** 1.0
**Fuente de Verdad:** `data-manager/index.js` y `data-manager/lib/adapters/index.js`

El `Data Manager` es la herramienta de línea de comandos para sincronizar los CSV maestros con Firebase Firestore.

> ⚠️ **IMPORTANTE:** Esta herramienta SOLO gestiona el **Catálogo** (`Desarrollos`, `Modelos`, `Desarrolladores`).
> Las colecciones **CRM** (`Leads`, `Asesores Externos`) se gestionan exclusivamente desde la Aplicación Web o API, no desde CSV.

---

## 🚀 Comandos Disponibles

Ejecutar desde la carpeta: `/data-manager`

### 1. Probar Conexión
Verifica que las credenciales de Firebase sean correctas.
```bash
node index.js test-connection
```

### 2. Importar Datos (Ingesta)
Sube información desde un CSV local.
```bash
node index.js import [coleccion] [ruta_archivo] [opciones]
```

**Colecciones Soportadas:**
*   `desarrollos`
*   `modelos`
*   `desarrolladores` (Empresas)

**Colecciones NO Soportadas (Use la App):**
*   ❌ `leads`
*   ❌ `external_advisors`

**Opciones:**
*   `--region "NombreCiudad"`: Optimiza la memoria limitando la búsqueda de duplicados (útil para `desarrolladores`).

**Ejemplos:**
```bash
# Carga estándar
node index.js import desarrollos "C:/datos/master_desarrollos.csv"

# Carga de modelos
node index.js import modelos "C:/datos/inventario_2025.csv"

# Carga optimizada por ciudad
node index.js import desarrolladores "C:/datos/devs_culiacan.csv" --region "Culiacan"
```

### 3. Exportar Datos (Respaldo)
Descarga la base de datos actual a JSON o CSV.
```bash
node index.js export [coleccion] --format=[json|csv]
```
*   Los archivos se guardan en `data-manager/output/`.
*   Formato default: `json`.

---

## 📋 Diccionario de Columnas CSV (Mapeo Exacto)

El sistema normalizará automáticamente los nombres de columnas. Se aceptan las siguientes variaciones:

### A. DESARROLLOS (`desarrollos`)

| Columna CSV (Cualquiera funciona) | Campo DB Destino | Notas |
| :--- | :--- | :--- |
| `Nombre`, `nombre` | `nombre` | **Requerido** |
| `Constructora`, `constructora` | `constructora` | **Requerido** |
| `descripcion` | `descripcion` | |
| `activo` | `activo` | `TRUE` / `1` / `ON` |
| `ubicacion.calle`, `calle` | `ubicacion.calle` | |
| `ubicacion.colonia`, `colonia` | `ubicacion.colonia` | |
| `ubicacion.cp`, `codigopostal` | `ubicacion.cp` | |
| `ubicacion.ciudad`, `ciudad` | `ubicacion.ciudad` | **Crucial** para Geo-Tagging |
| `ubicacion.latitud`, `latitud` | `ubicacion.latitud` | |
| `amenidades` | `caracteristicas.amenidades` | Separar con `|` (Pipes) |
| `entorno` | `caracteristicas.entorno` | Separar con `|` (Pipes) |
| `acepta_creditos` | `financiamiento.aceptaCreditos` | Separar con `|` |
| `apartado_monto` | `financiamiento.apartadoMinimo` | Numérico |
| `enganche_pct` | `financiamiento.engancheMinimoPorcentaje` | Numérico (ej: 10) |
| `url_cover` | `media.cover` | URL Imagen Principal |
| `url_gallery` | `media.gallery` | URLs separadas por `|` |
| `url_brochure` | `media.brochure` | URL PDF |
| `unidades_totales`, `viviendas_totales` | `infoComercial.unidadesTotales` | |
| `unidades_vendidas`, `viviendas_vendidas` | `infoComercial.unidadesVendidas` | |
| `unidades_disponibles` | `infoComercial.unidadesDisponibles` | |
| `promocion_nombre` | `promocion.nombre` | |
| `promocion_inicio` | `promocion.fecha_inicio` | Formato `YYYY-MM-DD` |
| `promocion_fin` | `promocion.fecha_fin` | Formato `YYYY-MM-DD` |
| `ia_resumen` | `analisisIA.resumen` | Generado por IA |

### B. MODELOS (`modelos`)

| Columna CSV (Cualquiera funciona) | Campo DB Destino | Notas |
| :--- | :--- | :--- |
| `id_desarrollo`, `idDesarrollo` | `idDesarrollo` | **Requerido** (o usar nombre+const) |
| `nombre_modelo`, `nombreModelo` | `nombreModelo` | **Requerido** |
| `nombre_desarrollo` | (Auxiliar) | Se usa si falta `id_desarrollo` |
| `constructora` | (Auxiliar) | Se usa si falta `id_desarrollo` |
| `status`, `estado` | `status` | `Preventa | Entrega Inmediata` |
| `tipo_vivienda` | `tipoVivienda` | `Casa`, `Depto`, etc. |
| `recamaras` | `recamaras` | Numérico |
| `banos` | `banos` | Numérico |
| `m2_const`, `m2` | `m2` | Metros de Construcción |
| `m2_terreno`, `terreno` | `terreno` | Metros de Terreno |
| `precio_base`, `precio_inicial` | `precios.base` | **Precio Actual** |
| `precio_orig_lista`, `precios.inicial` | `precios.inicial` | Precio Lanzamiento |
| `mantenimiento` | `precios.mantenimientoMensual` | |
| `tiempo_entrega` | `infoComercial.tiempoEntrega` | Texto libre |
| `img_cover` | `media.cover` | |
| `img_galeria` | `media.gallery` | Separar con `|` |
| `url_plantas` | `media.plantasArquitectonicas` | Separar con `|` |
| `url_video` | `media.videoPromocional` | |

---

## ⚙️ Procesos Automáticos

1.  **Validación Inteligente (Zod)**
    *   Si una fila no cumple con los tipos de datos (ej. texto en campo numérico), la fila se **rechaza** y se muestra una `x` roja en la consola.
    *   Si faltan campos opcionales, se carga sin ellos.
    *   Si faltan campos obligatorios (`id`, `nombre`), falla.

2.  **Cálculo de Precios por m²**
    *   Si provees `precio_base` y `m2`, el sistema calcula automáticamente `precio_m2`.

3.  **Historial de Precios**
    *   Si importas un modelo que ya existe y el `precio_base` es diferente, el precio anterior se guarda automáticamente en `preciosHistoricos` con la fecha de hoy.
    *   Se recalcula la `plusvaliaReal`.

4.  **Recálculo de Estadísticas (Triggers)**
    *   Al terminar la importación de Modelos, se actualizan los Desarrollos padres:
        *   `rangoPrecios` (Min/Max de los modelos).
        *   `inventario` (Suma de unidades disponibles).
        *   `precios.desde` (Precio más bajo).
    *   Se regeneran los `Highlights` de las ciudades afectadas.
