# Manual de Importación de Datos a Base de Datos (Inmueble Advisor)

Este documento detalla el proceso técnico y práctico para importar masivamente información de "Desarrollos" y "Modelos" hacia la base de datos Firestore, utilizando la herramienta CLI `data-manager` desarrollada para este proyecto.

---

## 1. Requisitos Técnicos Previos

Antes de iniciar cualquier importación, asegúrate de cumplir con lo siguiente en tu entorno local:

1.  **Node.js**: Debes tener instalado Node.js (v16 o superior).
2.  **Dependencias**: Ejecuta `npm install` dentro de la carpeta `data-manager`.
3.  **Credenciales de Firebase**:
    *   Debes tener el archivo `service-account.json` ubicado en la raíz de la carpeta `data-manager/`.
    *   Este archivo contiene las llaves privadas de administración de Firebase y **no debe subirse al repositorio**.
    *   Si no lo tienes, descárgalo desde la consola de Firebase: *Configuración del proyecto -> Cuentas de servicio -> Generar nueva clave privada*.

---

## 2. Herramienta: Data Manager CLI

El proyecto incluye una herramienta de línea de comandos ubicada en `/data-manager/index.js` que facilita la carga, validación y procesamiento de datos.

### Comandos Principales

Probar conexión:
```bash
node index.js test-connection
```

Importar datos:
```bash
node index.js import [coleccion] [ruta_archivo.csv]
```
*   `[coleccion]`: Puede ser `desarrollos` o `modelos`.
*   `[ruta_archivo.csv]`: Ruta relativa o absoluta al archivo CSV con los datos.

Exportar datos (para respaldo o revisión):
```bash
node index.js export [coleccion] --format csv
```

---

## 3. Preparación de Datos (Práctico)

Los datos deben prepararse en formato **CSV (Comma Separated Values)**. A continuación se detallan las columnas esperadas para cada colección. El sistema utiliza esquemas de validación (Zod) para asegurar la integirdad.

### A. Colección: `desarrollos`

Este archivo contiene la información general del proyecto inmobiliario.

**Columnas Importantes:**
*   `nombre` (Requerido): Nombre único del desarrollo.
*   `descripcion`: Texto descriptivo.
*   `constructora`: Nombre de la desarrolladora.
*   `activo`: `true` o `false`.
*   `ubicacion.ciudad`, `ubicacion.estado`, `ubicacion.latitud`, `ubicacion.longitud`: Datos geográficos.
*   `amenidades`: Lista separada por `|` (pipe). Ej: `Alberca|Gimnasio|Seguridad`.
*   `precios.desde`: Precio base referencial (aunque se recalcula automáticamente con los modelos).

**Nota de Vinculación:**
Si el desarrollo ya existe en la base de datos con el mismo nombre, el script intentará vincularlo automáticamente en lugar de crear uno nuevo, actualizando sus datos.

### B. Colección: `modelos`

Este archivo contiene los prototipos o unidades específicas dentro de una desarrollo.

**Columnas Importantes:**
*   `idDesarrollo` (Requerido): El ID del desarrollo padre al que pertenece este modelo.
    *   *Tip*: Primero exporta los desarrollos a CSV para obtener sus IDs y usarlos aquí.
*   `nombreModelo` (Requerido): Ej: "Modelo A", "Penthouse".
*   `precio.base`: Valor numérico del precio.
*   `recamaras`, `banos`, `niveles`, `cajones`: Valores numéricos.
*   `m2`, `terreno`: Superficies.
*   `status`: Estado de venta (Ej: "Disponible", "Vendido").

### C. Colección: `desarrolladores`

Este archivo contiene información corporativa y esquemas de pago de las constructoras.

**Columnas Importantes:**
*   `ID` (Opcional): Identificador manual.
*   `Nombre` (Requerido): Nombre exacto de la constructora. **Vital**: Debe coincidir con el campo `constructora` de la colección `desarrollos` para que el sistema los vincule.
*   **Esquema de Pago** (Sub-campos): Valores numéricos representing percentages (0-100).
    *   `EsquemaPago.Apartado`
    *   `EsquemaPago.Enganche`
    *   `EsquemaPago.AprobacionCredito`
    *   `EsquemaPago.Escrituracion`
*   **Contacto** (Sub-campos):
    *   `Contacto.Nombre1`, `Contacto.Telefono1`, `Contacto.Mail1`, `Contacto.Puesto1`
    *   `Contacto.Nombre2`, `Contacto.Telefono2`, `Contacto.Mail2`, `Contacto.Puesto2`
*   `AsesoresDesarrollo`: Lista de IDs de los asesores (separados por `|`).

**Nota de Vinculación Automática:**
Al importar desarrolladores, el sistema busca automáticamente todos los `desarrollos` que tengan el mismo nombre en el campo `constructora` y calcula:
*   `desarrollos`: Lista de IDs encontrados.
*   `ciudades`: Ciudades donde se ubican esos desarrollos.
*   `ofertaTotal` y `viviendasxVender`: Sumatoria de inventario.

---

## 4. Proceso de Importación (Paso a Paso)

### Paso 1: Verificar el archivo CSV
Guarda tu archivo CSV (ej. `nuevos_desarrollos.csv`) dentro de la carpeta `data-manager` (o cualquier ruta accesible). Asegúrate de que tenga encabezados que coincidan con los nombres de campo (puedes ver `lib/schemas.js` o `lib/adapters.js` para los mapeos exactos).


### Paso 2: Ejecutar el comando
Abre una terminal en la carpeta `data-manager` y ejecuta:

```bash
node index.js import desarrollos nuevos_desarrollos.csv
```

### Paso 3: Monitorear la ejecución
La consola mostrará el progreso:
*   `.` (Punto verde): Registro importado/actualizado correctamente.
*   `x` (Cruz roja): Registro omitido por error de validación (faltan campos requeridos, tipos de dato incorrectos).
*   `E` (Letra E roja): Error inesperado de escritura.

### Paso 4: Revisar Logs
Si hubo errores, se generará información detallada en los logs (aunque la salida estándar te dará una idea inmediata).

### Paso 5: Recálculo Automático (Detalle Técnico)

Al finalizar la importación, el script ejecuta procesos de post-procesamiento para asegurar que la información agregada en niveles superiores (Desarrollos y Ciudades) sea consistente con los cambios individuales en los Modelos.

#### 1. Recálculos de Desarrollos
Este proceso sincroniza el documento del **Desarrollo** con la realidad de sus **Modelos** activos. Para cada desarrollo afectado, el sistema consulta todos sus modelos vinculados y calcula:

*   **Precio Desde (`precios.desde`)**: Identifica el precio base (`precios.base`) más bajo de entre todos los modelos marcados como activos.
*   **Cantidad de Modelos (`infoComercial.cantidadModelos`)**: Cuenta el número total de modelos activos vinculados al desarrollo.
*   **Unidades Vendidas (`infoComercial.unidadesVendidas`)**: Suma el campo `unidadesVendidas` de cada modelo individual para reflejar el avance de ventas global del desarrollo.
*   **Unidades Disponibles (`infoComercial.unidadesDisponibles`)**: Si el desarrollo tiene definido un número de `unidadesTotales`, resta las unidades vendidas totales para obtener el inventario remanente.

#### 2. Highlights de Ciudad y Zona
Este es un análisis competitivo que otorga "insignias" o etiquetas de valor a los mejores modelos dentro de su mercado local (Ciudad y Zona).

**Métricas Evaluadas:**
Para cada ciudad afectada, el sistema analiza cuatro variables clave:
1.  **Precio**: El más bajo.
2.  **Precio por m²**: El más bajo (eficiencia de costo).
3.  **Superficie de Terreno**: El más alto (amplitud).
4.  **Metros de Construcción**: El más alto (tamaño de la vivienda).

**Lógica de Asignación:**
El sistema determina ganadores en dos niveles:
*   **Nivel Ciudad**: Compara todos los modelos de la ciudad. El ganador recibe una etiqueta como *"Modelo con el precio más bajo de [Ciudad]"*.
*   **Nivel Zona**: Compara modelos solo dentro de la misma zona residencial (ej. Norte, Sur, Centro). El ganador recibe una etiqueta como *"Modelo con más m² de construcción de la zona [Zona]"*.

#### 3. Recálculos de Desarrolladores
Este proceso vincula a los **Desarrolladores** con sus proyectos activos en la base de datos basándose en la coincidencia del nombre (`Nombre` vs `constructora`). Calcula automáticamente:

*   **Lista de Desarrollos (`desarrollos`)**: Recopila todos los IDs de desarrollos que pertenecen a esta constructora.
*   **Ciudades (`ciudades`)**: Identifica todas las ciudades únicas donde la constructora tiene proyectos.
*   **Oferta Total (`ofertaTotal`)**: Sumatoria de las unidades totales de todos sus desarrollos.
*   **Viviendas por Vender (`viviendasxVender`)**: Sumatoria del inventario disponible en todos sus desarrollos.

> [!IMPORTANT]
> Para que el recálculo sea exitoso, asegúrate de que el nombre del desarrollador en el CSV coincida exactamente con el campo `constructora` usado en el CSV de desarrollos.

> **Importante sobre Highlights**: Este proceso sobrescribe el campo `highlights` del modelo. Si un modelo es ganador en múltiples categorías o niveles (ej. es el más barato de su zona Y de toda la ciudad), recibirá todas las etiquetas correspondientes simultáneamente.

---

## 6. Validaciones Técnicas y Errores Comunes

El sistema (ubicado en `lib/import.js`) protege la integridad de la base de datos mediante:

*   **Validación de Tipos (Schemas Zod)**: Si envías texto en un campo numérico (ej. precio "1.5 MDP"), el sistema intentará convertirlo. Si falla, descartará el registro.
*   **Ids Automáticos**: Si no provees un `id` en el CSV, Firestore generará uno automáticamente.
*   **Transacciones en Lote (Batch)**: Las escrituras se hacen en grupos de 400 para optimizar el rendimiento y reducir costos de red.

**Errores frecuentes:**
*   *Error: Service account not found*: Falta el archivo `service-account.json`.
*   *Error: ID Desarrollo requerido*: Estás importando modelos sin especificar a qué desarrollo pertenecen.
*   *Validación fallida en 'amenidades'*: Asegúrate de usar el separador `|` y no comas, si el script así lo espera (ver `parseArray` en `schemas.js`).
