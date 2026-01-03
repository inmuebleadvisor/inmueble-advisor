# 🏗️ ESQUEMA DE DATOS - INMUEBLE ADVISOR WEB

**ÚLTIMA MODIFICACION:** 02/01/2026
**ESTADO:** Validado contra `data-manager/lib/models/schemas.js` (Catalog) y `src/repositories` (CRM).

Este documento describe la estructura **real** de las colecciones en Firebase Firestore, validada por la capa de aplicación (`Zod Schemas` y Repositorios).

---

## 1. Colección: `DESARROLLADORES` (Empresas)

**ID del Documento:** Slug generado automáticamente (ej: `grupo-impulsa`).

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **Sí** | Identificador único. |
| **nombre** | `string` | **Sí** | Nombre comercial. |
| **status** | `enum` | **Sí** | `activo` (default), `inactivo`, `suspendido`. |
| **fiscal** | `map` | No | Datos fiscales. |
| &nbsp;&nbsp;`.razonSocial` | `string` | No | Razón Social. |
| **comisiones** | `map` | No | Configuración de pagos. |
| &nbsp;&nbsp;`.porcentajeBase` | `number` | No | % Base de comisión. |
| &nbsp;&nbsp;`.hitos` | `map` | No | Esquemas de pago. |
| &nbsp;&nbsp;&nbsp;&nbsp;`.credito` | `number[]` | No | Array de % (ej. `[30, 20, 50]`). Debe sumar 100%. |
| &nbsp;&nbsp;&nbsp;&nbsp;`.contado` | `number[]` | No | Array de %. |
| &nbsp;&nbsp;&nbsp;&nbsp;`.directo` | `number[]` | No | Array de %. |
| **contacto** | `map` | No | Información de contacto. |
| &nbsp;&nbsp;`.principal` | `map` | No | Contacto primario. |
| &nbsp;&nbsp;`.secundario` | `map` | No | Contacto secundario. |
| &nbsp;&nbsp;*campos internos:* | | | `.nombre`, `.telefono`, `.email`, `.puesto` |
| **operacion** | `map` | No | **Protegido**. Datos operativos internos. |
| &nbsp;&nbsp;`.asesoresAutorizados` | `string[]` | No | IDs de venta. |
| &nbsp;&nbsp;`.asesoresConLeads` | `string[]` | No | Control de leads. |
| **stats** | `map` | No | **Calculado** (Auto-generated). |
| &nbsp;&nbsp;`.ofertaTotal` | `number` | No | Suma de unidades. |
| &nbsp;&nbsp;`.viviendasxVender` | `number` | No | Inventario disponible. |
| **ciudades** | `string[]` | No | **Calculado**. Lista de ciudades donde opera. |
| **desarrollos** | `string[]` | No | **Calculado**. Lista de IDs de desarrollos. |
| **updatedAt** | `Timestamp` | No | Última actualización. |

---

## 2. Colección: `DESARROLLOS` (Proyectos)

**ID del Documento:** `slug(constructora) + '-' + slug(nombre)` (Determinista).

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **Sí** | PK. |
| **nombre** | `string` | **Sí** | Nombre del desarrollo. |
| **descripcion** | `string` | No | Descripción comercial. |
| **constructora** | `string` | **Sí** | Nombre exacto de la constructora. |
| **activo** | `boolean` | **Sí** | Default `true`. |
| **geografiaId** | `string` | No | ID normalizado (ej: `mx-sin-cul`). |
| **ubicacion** | `map` | **Sí** | Datos geográficos. |
| &nbsp;&nbsp;`.calle` | `string` | No | |
| &nbsp;&nbsp;`.colonia` | `string` | No | |
| &nbsp;&nbsp;`.cp` | `number` | No | |
| &nbsp;&nbsp;`.localidad` | `string` | No | |
| &nbsp;&nbsp;`.ciudad` | `string` | No | |
| &nbsp;&nbsp;`.estado` | `string` | No | |
| &nbsp;&nbsp;`.zona` | `string` | No | |
| &nbsp;&nbsp;`.latitud` | `number` | No | |
| &nbsp;&nbsp;`.longitud` | `number` | No | |
| **caracteristicas** | `map` | No | |
| &nbsp;&nbsp;`.amenidades` | `string[]` | No | |
| &nbsp;&nbsp;`.entorno` | `string[]` | No | |
| **financiamiento** | `map` | No | |
| &nbsp;&nbsp;`.aceptaCreditos` | `string[]` | No | Ej: `['Infonavit', 'Bancario']` |
| &nbsp;&nbsp;`.apartadoMinimo` | `number` | No | |
| &nbsp;&nbsp;`.engancheMinimoPorcentaje` | `number` | No | |
| **media** | `map` | No | URLs. |
| &nbsp;&nbsp;`.cover` | `url` | No | |
| &nbsp;&nbsp;`.gallery` | `url[]` | No | |
| &nbsp;&nbsp;`.brochure` | `url` | No | |
| &nbsp;&nbsp;`.video` | `url` | No | |
| **comisiones** | `map` | No | |
| &nbsp;&nbsp;`.overridePct` | `number` | No | Comisión específica para este desarrollo. |
| **infoComercial** | `map` | No | |
| &nbsp;&nbsp;`.cantidadModelos` | `number` | No | |
| &nbsp;&nbsp;`.fechaInicioVenta` | `Timestamp/Str` | No | |
| &nbsp;&nbsp;`.unidadesTotales` | `number` | No | |
| &nbsp;&nbsp;`.unidadesVendidas` | `number` | No | |
| &nbsp;&nbsp;`.unidadesDisponibles` | `number` | No | |
| &nbsp;&nbsp;`.plusvaliaPromedio` | `number` | No | |
| **precios** | `map` | No | |
| &nbsp;&nbsp;`.desde` | `number` | No | **Calculado** (Lowest Model Price). |
| &nbsp;&nbsp;`.moneda` | `string` | No | |
| **stats** | `map` | No | **Calculado**. |
| &nbsp;&nbsp;`.rangoPrecios` | `number[]` | No | `[min, max]` |
| &nbsp;&nbsp;`.inventario` | `number` | No | Suma de inventario real. |
| **promocion** | `map` | No | |
| &nbsp;&nbsp;`.nombre` | `string` | No | |
| &nbsp;&nbsp;`.fecha_inicio` | `Timestamp` | No | |
| &nbsp;&nbsp;`.fecha_fin` | `Timestamp` | No | |
| **analisisIA** | `map` | No | |
| &nbsp;&nbsp;`.resumen` | `string` | No | |
| &nbsp;&nbsp;`.puntosFuertes` | `string[]` | No | |
| &nbsp;&nbsp;`.puntosDebiles` | `string[]` | No | |
| **legal** | `map` | No | |
| &nbsp;&nbsp;`.regimenPropiedad` | `string` | No | |
| **updatedAt** | `Timestamp` | No | |

---

## 3. Colección: `MODELOS` (Unidades)

**ID del Documento:** `idDesarrollo + '-' + slug(nombreModelo)` (O manual).

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **Sí** | PK. |
| **idDesarrollo** | `string` | **Sí** | FK a Desarrollo. |
| **nombreModelo** | `string` | **Sí** | Nombre del prototipo. |
| **activo** | `boolean` | **Sí** | Default `true`. |
| **status** | `string \| string[]` | No | Ej: `'Preventa'` o `['Preventa', 'Entrega Inmediata']`. |
| **tipoVivienda** | `string` | **Sí** | Default `'Casa'`. |
| **Specs** | | | (Campos directos en raíz). |
| &nbsp;&nbsp;`recamaras` | `number` | No | |
| &nbsp;&nbsp;`banos` | `number` | No | |
| &nbsp;&nbsp;`niveles` | `number` | No | |
| &nbsp;&nbsp;`cajones` | `number` | No | |
| &nbsp;&nbsp;`m2` | `number` | No | Construcción. |
| &nbsp;&nbsp;`terreno` | `number` | No | |
| &nbsp;&nbsp;`frente` | `number` | No | |
| &nbsp;&nbsp;`fondo` | `number` | No | |
| &nbsp;&nbsp;`amenidades` | `string[]` | No | Amenidades propias del modelo. |
| **precios** | `map` | No | |
| &nbsp;&nbsp;`.base` | `number` | **Sí** | Precio actual de lista. |
| &nbsp;&nbsp;`.inicial` | `number` | No | Precio original (para cálculo plusvalía). |
| &nbsp;&nbsp;`.metroCuadrado` | `number` | No | **Calculado**. |
| &nbsp;&nbsp;`.mantenimientoMensual` | `number` | No | |
| &nbsp;&nbsp;`.moneda` | `string` | No | |
| **preciosHistoricos** | `array` | No | Historial autogenerado. |
| &nbsp;&nbsp;`{ fecha, precio }` | `object` | | |
| **plusvaliaReal** | `number` | No | **Calculado**. % Crecimiento. |
| **acabados** | `map` | No | |
| &nbsp;&nbsp;`.cocina` | `string` | No | |
| &nbsp;&nbsp;`.pisos` | `string` | No | |
| **media** | `map` | No | |
| &nbsp;&nbsp;`.cover` | `url` | No | |
| &nbsp;&nbsp;`.gallery` | `url[]` | No | |
| &nbsp;&nbsp;`.plantasArquitectonicas` | `url[]` | No | |
| &nbsp;&nbsp;`.recorridoVirtual` | `url` | No | |
| &nbsp;&nbsp;`.videoPromocional` | `url` | No | |
| **highlights** | `string[]` | No | |
| **promocion** | `map` | No | Igual a Desarrollo. |
| **analisisIA** | `map` | No | Igual a Desarrollo. |
| **infoComercial** | `map` | No | |
| &nbsp;&nbsp;`.unidadesVendidas` | `number` | No | |
| &nbsp;&nbsp;`.plusvaliaEstimada` | `number` | No | |
| &nbsp;&nbsp;`.fechaInicioVenta` | `string` | No | |
| &nbsp;&nbsp;`.tiempoEntrega` | `string` | No | Ej: "Diciembre 2025". |
| **updatedAt** | `Timestamp` | No | |

---

## 4. Colección: `LEADS` (Clientes Potenciales)

**ID del Documento:** Auto-generated (Firestore).

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| **uid** | `string` | **Sí** | ID del usuario generador (User/Client). |
| **clienteUid** | `string` | **Sí** | Redundancia del UID para búsquedas directas. |
| **clienteDatos** | `map` | **Sí** | Datos de contacto (Fuente de Verdad). |
| &nbsp;&nbsp;`.nombre` | `string` | | |
| &nbsp;&nbsp;`.email` | `string` | | |
| &nbsp;&nbsp;`.telefono` | `string` | | |
| **idDesarrollo** | `string` | **Sí** | ID del desarrollo. |
| **idDesarrollador** | `string` | **Sí** | ID de la empresa desarrolladora. |
| **nombreDesarrollo** | `string` | No | Nombre denormalizado para UI. |
| **modeloInteres** | `string` | No | Nombre del modelo (ej. "Prototipo A"). |
| **precioReferencia** | `number` | No | Precio al momento de generar el lead. |
| **status** | `string` | **Sí** | `PENDING_DEVELOPER_CONTACT`, `REPORTED`, `ASSIGNED_EXTERNAL`, `WON`. |
| **origen** | `string` | No | Ej: `web_cita_vip`, `web_automatico`. |
| **urlOrigen** | `string` | No | URL exacta de captura. |
| **snapshot** | `map` | No | Contexto inmutable del producto. |
| &nbsp;&nbsp;`.idModelo` | `string` | | |
| &nbsp;&nbsp;`.modeloNombre` | `string` | | |
| &nbsp;&nbsp;`.desarrolloNombre` | `string` | | |
| &nbsp;&nbsp;`.precioAtCapture` | `number` | | |
| **citainicial** | `map` | No | Objeto de cita agendada. |
| &nbsp;&nbsp;`.dia` | `Timestamp` | | Fecha de la cita. |
| &nbsp;&nbsp;`.hora` | `string` | | Hora "HH:mm". |
| **idAsesorAsignado** | `string` | No | ID del asesor externo asignado (si aplica). |
| **asesorUid** | `string` | No | ID interno de control (ej. `MANUAL_B2B_PROCESS`). |
| **statusHistory** | `map[]` | **Sí** | Historial de auditoría. |
| &nbsp;&nbsp;`.status` | `string` | | Estado aplicado. |
| &nbsp;&nbsp;`.timestamp` | `Timestamp` | | Fecha del cambio. |
| &nbsp;&nbsp;`.note` | `string` | | Razón del cambio. |
| &nbsp;&nbsp;`.changedBy` | `string` | | Actor (SYSTEM, Admin UID). |
| **createdAt** | `Timestamp` | **Sí** | Fecha de creación. |
| **updatedAt** | `Timestamp` | **Sí** | Última modificación. |

---

## 5. Colección: `EXTERNAL_ADVISORS` (Asesores Externos)

**ID del Documento:** Auto-generated.

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| **idDesarrollador** | `string` | **Sí** | Empresa a la que pertenece. |
| **nombre** | `string` | **Sí** | |
| **whatsapp** | `string` | **Sí** | Clave única de búsqueda. Solo números. |
| **email** | `string` | No | |
| **puesto** | `string` | No | Default `Asesor Comercial`. |
| **activo** | `boolean` | **Sí** | Default `true`. |
| **leadsAsignadosAcumulados** | `number` | No | KPI. |
| **leadsCerrados** | `number` | No | KPI. |
| **leadsAsignados** | `map[]` | No | Historial de leads. |
| &nbsp;&nbsp;`.idLead` | `string` | | |
| &nbsp;&nbsp;`.fechaAsignacion` | `iso-string` | | |
| **createdAt** | `Timestamp` | **Sí** | |
| **lastUpdated** | `Timestamp` | No | |