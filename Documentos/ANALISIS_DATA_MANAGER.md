# Análisis Profundo: Módulo `data-manager`

**Fecha:** 30 de Diciembre, 2025
**Versión del Software Analizada:** v1.1
**Contexto:** Herramienta CLI para ingesta y gestión de datos masivos en Firestore.

---

## 1. Visión General y Arquitectura

El módulo `data-manager` es una aplicación de línea de comandos (CLI) construida sobre **Node.js**, diseñada para actuar como el puente de ingesta de datos entre fuentes externas (archivos CSV) y la base de datos **Firebase Firestore**.

Su arquitectura es modular y desacoplada, separando claramente las responsabilidades:
*   **Interfaz (CLI):** Manejada por `yargs` (`index.js`), expone comandos claros (`import`, `export`, `test-connection`).
*   **Orquestación:** `lib/import.js` coordina la lectura de archivos, validación, lógica de vinculación y escritura en lotes.
*   **Adaptación:** `lib/adapters.js` transforma datos planos y sucios (CSV) en documentos estructurados y jerárquicos (JSON/Firestore). Soporta headers flexibles para mayor compatibilidad.
*   **Validación:** `lib/schemas.js` utiliza **Zod** para asegurar integridad de tipos estricta antes de tocar la BD.
*   **Lógica de Negocio Derivada:** `lib/calculations.js` ejecuta procesos complejos de agregación y competencia (Highlights) post-ingesta.

---

## 2. Flujo de Importación y Transformación (Capítulo Detallado)

Este es el núcleo del sistema. El proceso no es una simple copia de datos; es un pipeline de transformación inteligente.

### 2.1 Qué Espera (`Inputs`)
El sistema espera archivos **CSV** con cabeceras flexibles. Gracias a los adaptadores, tolera variaciones en los nombres de las columnas:
*   **Estándar:** `precio_desde`, `ubicacion.calle`.
*   **Personalizados (Desarrolladores):** `pago_hitos_credito` (array con `|`), `contacto_nom_1` (mapeado a `contacto.principal`), etc.

Esto facilita la integración con diferentes fuentes humanas o sistemas legados sin requerir una limpieza manual previa perfecta.

### 2.2 Pipeline de Procesamiento (Fila por Fila)
Para cada fila del CSV, ocurre lo siguiente:

1.  **Lectura Streaming:** Se usa `fs.createReadStream` con `pipe`. Esto permite procesar archivos de gigabytes sin saturar la memoria RAM.
2.  **Adaptación (`adapters.js`):**
    *   **Normalización:** Limpia espacios (`trim`), convierte strings a minúsculas/slugs donde aplica.
    *   **Estructuración:** Convierte columnas planas en objetos anidados. Ej: `calle`, `colonia` -> `ubicacion: { calle, colonia }`.
    *   **Parsing Avanzado:** Parsea arrays separados por pipes (`15|15|70` -> `[15, 15, 70]`) para hitos de pago.
    *   **Cálculos Inline:**
        *   Calcula `unidadesDisponibles` basado en totales y vendidas si falta.
        *   Calcula `plusvaliaEstimada` comparando precios históricos vs actuales.
    *   **Timezone Handling:** Convierte fechas a `Firestore Timestamp`, respetando la zona horaria de la ciudad.
3.  **Vinculación e Identidad Inteligente:**
    *   **Desarrolladores:** Implementa **Deduplicación Difusa (Fuzzy Matching)**. Si llega "Grupo Impulsa" y ya existe "Impulsa Inmuebles" con coincidencia >85%, los fusiona automáticamente en vez de duplicarlos.
    *   **Desarrollos:** Vincula por nombre exacto si no trae ID explícito.
    *   **Modelos:** Genera IDs deterministas `${idDesarrollo}-${slugNombreModelo}` para asegurar idempotencia.
4.  **Validación de Esquema (`schemas.js`):**
    *   Se aplica un esquema **Zod** estricto, coerciones de tipos automáticas y saneamiento de datos.
5.  **Acumulación en Lotes (Batching):**
    *   Agrupa operaciones en lotes de **400 documentos** para eficiencia en red y costos.

### 2.3 Qué se Borra y Qué se Sustituye
*   **Estrategia `merge: true`:** El sistema usa `set(ref, data, { merge: true })`.
    *   Sustituye campos del CSV y preserva los existentes que no se tocan.
    *   **Inicialización Segura:** Para nuevos desarrolladores, inicializa arrays operativos vacíos (`asesoresAutorizados`, etc.) pero nunca los sobrescribe si ya existen.

---

## 3. Post-Procesamiento y Cálculos Automáticos

Una vez terminada la importación "cruda", el sistema dispara procesos de agregación inteligente ("Recalculates") para mantener la consistencia del negocio.

### 3.1 Nivel Desarrollo (`recalculateDevelopmentStats`)
Al importar **Modelos**, se actualizan sus **Desarrollos** padres:
*   **Precio Desde:** Mínimo precio base de modelos activos.
*   **Inventario:** Suma de `unidadesVendidas` y cálculo de `disponibles`.
*   **Contador:** Número de modelos activos.

### 3.2 Nivel Ciudad (Highlights - "La Magia")
Si cambian modelos o desarrollos, se re-evalúa **toda la oferta de la ciudad**:
*   Compite por zonas y por ciudad completa.
*   Asigna medallas ("Highlights") automáticamente (ej: "Precio más bajo", "Mayor Terreno").
*   Actualiza el campo `highlights` en los modelos ganadores y limpia a los perdedores.

### 3.3 Nivel Desarrollador (Constructoras) - **[NUEVO]**
Ahora se dispara automáticamente al importar **Desarrollos** o **Modelos**.
*   **Rastreo de Dependencias:** Al importar un desarrollo, el sistema captura el nombre de la constructora.
*   **Resolución Dinámica:** Busca la ID del desarrollador correspondiente a ese nombre.
*   **Agregación:**
    *   Lista de ID de desarrollos de esa constructora.
    *   Ciudades donde tiene presencia.
    *   Suma total de **Oferta ($)** y **Unidades por Vender**.

Esto asegura que el perfil de la desarrolladora siempre muestre su inventario real acumulado sin intervención manual.

---

## 4. Manejo de Errores y Seguridad

*   **Tolerancia a Fallos:** Errores de validación en una fila no detienen el proceso; se loguean y se continúa.
*   **Logs Detallados:** Registro en consola y archivos de logs.
*   **Atomicidad de Lotes:** Fallos de escritura se manejan por bloques.

---

## 5. Análisis FODA del Módulo

### Fortalezas (Strengths)
*   **Robustez:** Manejo de UUIDs, Batching y Retry implícito.
*   **Inteligencia:** Deduplicación Fuzzy y Cálculos en Cascada (Modelos -> Desarrollos -> Desarrolladores -> Ciudad).
*   **Flexibilidad:** Adaptadores potentes para CSVs con esquemas variados (Header Mapping).

### Oportunidades (Opportunities)
*   **Pre-validación Referencial:** Verificar existencia de IDs padres antes de cargar hijos.
*   **Rollback:** Mecanismo de deshacer importaciones masivas.

### Debilidades (Weaknesses)
*   **Dependencia de Nombres:** La vinculación Desarrollo <-> Desarrollador depende de que el string `constructora` en el CSV coincida exactamente con el `nombre` en la colección `desarrolladores` (aunque la búsqueda difusa mitiga esto en la creación del desarrollador, no en la vinculación).

### Amenazas (Threats)
*   **Costos Firestore:** Recálculos masivos implican lecturas de colecciones enteras.
