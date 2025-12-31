# 🏗️ ESQUEMA DE DATOS - INMUEBLE ADVISOR WEB

**ÚLTIMA MODIFICACION:** 30/12/2025
**ESTADO:** Actualizado para V2 (Nested Schemas & Strict Typing)

Este documento describe la estructura detallada de las colecciones principales de la base de datos de Inmueble Advisor Web. Refleja la arquitectura de datos validada por el módulo `data-manager`.

---

## 1. Colección: `DESARROLLADORES` (Empresas)

Representa a las empresas constructoras o grupos inmobiliarios. Actúa como entidad padre para los desarrollos.

| Campo | Tipo | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **PK Auto/Slug** | Identificador único (ej: `grupo-impulsa`). Generado por Slug o importado. |
| **nombre** | `string` | Simple | Nombre comercial de la desarrolladora. |
| **status** | `string` | Simple | Estado operativo (ej: `activo`). |
| **fiscal** | `map` | Objeto | Datos fiscales. |
| fiscal.razonSocial | `string` | Sub-campo | Razón social oficial. |
| **comisiones** | `map` | Objeto | Configuración de comisiones para asesores. |
| comisiones.porcentajeBase | `number` | Sub-campo | Porcentaje base de comisión (ej. 3.0). |
| comisiones.hitos | `map` | Sub-objeto | Arrays de porcentajes de pago según esquema. |
| comisiones.hitos.credito | `number[]` | Lista | [30, 20, 50] |
| comisiones.hitos.contado | `number[]` | Lista | [15, 15, 70] |
| comisiones.hitos.directo | `number[]` | Lista | [50, 50] |
| **contacto** | `map` | Objeto | Contactos operativos principales. |
| contacto.principal | `map` | Sub-objeto | Contacto primario. |
| contacto.secundario | `map` | Sub-objeto | Contacto secundario. |
| *contacto.[role].nombre* | `string` | Sub-campo | Nombre del contacto. |
| *contacto.[role].telefono* | `string` | Sub-campo | Teléfono directo. |
| *contacto.[role].email* | `string` | Sub-campo | Email corporativo. |
| *contacto.[role].puesto* | `string` | Sub-campo | Cargo (ej. "Gerente Ventas"). |
| **operacion** | `map` | **Protegido** | Datos operativos internos (No se sobrescribe en import). |
| operacion.asesoresAutorizados | `string[]` | Lista | IDs de asesores con permiso de venta. |
| operacion.asesoresConLeads | `string[]` | Lista | IDs de asesores con leads activos. |
| **stats** | `map` | **Calculado** | Estadísticas agregadas automáticamente. |
| stats.ofertaTotal | `number` | Auto | Valor total del inventario ($). |
| stats.viviendasxVender | `number` | Auto | Unidades disponibles totales. |
| **ciudades** | `string[]` | Calculado | Lista de ciudades donde tiene presencia activa. |
| **desarrollos** | `string[]` | Calculado | Lista de IDs de desarrollos asociados. |
| **updatedAt** | `timestamp` | Simple | Fecha última modificación. |

---

## 2. Colección: `DESARROLLOS` (Desarrollos Inmobiliarios)

Representa un complejo habitacional. Vinculado a una Constructora y una Geografía Estandarizada.

| Campo | Tipo | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **PK Determinista** | Slug único: `constructora-nombre` (ej: `impulsa-guadalupe-loft`). |
| **nombre** | `string` | Requerido | Nombre comercial del desarrollo. |
| **descripcion** | `string` | Simple | Descripción comercial. |
| **constructora** | `string` | Requerido | Nombre de la constructora (FK Lógica con Desarrolladores). |
| **activo** | `boolean` | Default `true` | Visibilidad del desarrollo. |
| **geografiaId** | `string` | **FK Geo** | ID estandarizado de la ciudad (ej: `mx-sin-cul`). |
| **ubicacion** | `map` | Objeto | Coordenadas y dirección física. |
| ubicacion.calle | `string` | Sub-campo | Calle y número. |
| ubicacion.colonia | `string` | Sub-campo | Colonia. |
| ubicacion.cp | `number` | **Nuevo** | Código Postal (ej: 80000). |
| ubicacion.localidad | `string` | **Nuevo** | Localidad o sector específico. |
| ubicacion.ciudad | `string` | Sub-campo | Ciudad (Normalizada por adaptador). |
| ubicacion.estado | `string` | Sub-campo | Estado. |
| ubicacion.zona | `string` | Sub-campo | Sector o Zona Comercial (Ej: Marina, Tres Ríos). |
| ubicacion.latitud | `number` | Sub-campo | Coordenada GPS. |
| ubicacion.longitud | `number` | Sub-campo | Coordenada GPS. |
| **caracteristicas** | `map` | Objeto | Amenidades y entorno. |
| caracteristicas.amenidades | `string[]` | Lista | Ej: ["Alberca", "Gym"]. |
| caracteristicas.entorno | `string[]` | Lista | Ej: ["Cerca de Parque", "Escuelas"]. |
| **financiamiento** | `map` | Objeto | Condiciones comerciales. |
| financiamiento.aceptaCreditos | `string[]` | Lista | Ej: ["Infonavit", "Bancario"]. |
| financiamiento.apartadoMinimo | `number` | Sub-campo | Monto ($) para apartar. |
| financiamiento.engancheMinimoPorcentaje | `number` | Sub-campo | % Mínimo de enganche. |
| **media** | `map` | Objeto | URLs multimedia. |
| media.cover | `string` | URL | Imagen de portada. |
| media.gallery | `string[]` | URLs | Galería de imágenes. |
| media.brochure | `string` | URL | PDF informativo. |
| media.video | `string` | URL | Video promocional. |
| **comisiones** | `map` | Objeto | Override de comisiones (Opcional). |
| comisiones.overridePct | `number` | Sub-campo | % específico para este desarrollo si difiere del developer. |
| **infoComercial** | `map` | Objeto | Datos de entrega y ventas. |
| infoComercial.cantidadModelos | `number` | Sub-campo | Número de prototipos diferentes. |
| infoComercial.fechaInicioVenta | `timestamp` | Sub-campo | Fecha inicio de ventas. |
| infoComercial.unidadesTotales | `number` | Sub-campo | Total construidas. |
| infoComercial.unidadesVendidas | `number` | Sub-campo | Total vendidas. |
| infoComercial.unidadesDisponibles | `number` | Manual/Auto | Stock actual (Manual o Calculado). |
| infoComercial.plusvaliaPromedio | `number` | Sub-campo | % Plusvalía histórica. |
| **precios** | `map` | Objeto | Resumen de precios (Calculado desde Modelos). |
| precios.desde | `number` | Calculado | Precio más bajo disponible. |
| **stats** | `map` | **Protegido** | Estadísticas internas (No se borran al importar). |
| stats.rangoPrecios | `number[]` | Auto | [min, max] de precios actuales. |
| stats.inventario | `number` | Auto | Suma real de inventario de modelos. |
| **scoreCard** | `any` | **Protegido** | Calificación del desarrollo (Motor externo). |
| **promocion** | `map` | Objeto | Campaña activa. |
| promocion.nombre | `string` | Sub-campo | Título de la promo. |
| promocion.fecha_inicio | `timestamp` | Sub-campo | (Timezone Safe). |
| promocion.fecha_fin | `timestamp` | Sub-campo | (Timezone Safe). |
| **analisisIA** | `map` | Objeto | Insights generados por IA. |
| analisisIA.resumen | `string` | Sub-campo | Resumen ejecutivo. |
| analisisIA.puntosFuertes | `string[]` | Sub-campo | Listado de fortalezas. |
| analisisIA.puntosDebiles | `string[]` | Sub-campo | Listado de debilidades. |
| **legal** | `map` | Objeto | Información legal. |
| legal.regimenPropiedad | `string` | Sub-campo | Ej: Condominio, Privada. |

---

## 3. Colección: `MODELOS` (Prototipos)

Tipos de vivienda disponibles dentro de un desarrollo.

| Campo | Tipo | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **PK Comuesta** | `desarrolloId` + `-` + `slugModelo`. |
| **idDesarrollo** | `string` | **FK** | ID del desarrollo padre. |
| **nombreModelo** | `string` | Requerido | Nombre del prototipo (ej: "Ceiba"). |
| **activo** | `boolean` | Default `true` | Disponibilidad. |
| **status** | `string` `string[]` | Flexible | Estado de venta (ej: "Entrega Inmediata", "Preventa"). |
| **tipoVivienda** | `string` | Default `Casas` | Tipo (Casa, Depto, Loft). |
| **specs** | - | - | Especificaciones directas (Root level). |
| m2 | `number` | Simple | Construcción. |
| terreno | `number` | Simple | Terreno. |
| recamaras | `number` | Simple | Habitaciones. |
| banos | `number` | Simple | Baños (Float para medios baños). |
| niveles | `number` | Simple | Pisos. |
| cajones | `number` | Simple | Estacionamientos. |
| frente | `number` | Simple | Metros de frente (Terreno). |
| fondo | `number` | Simple | Metros de fondo (Terreno). |
| amenidades | `string[]` | Lista | Amenidades específicas del modelo. |
| **precios** | `map` | Objeto | Precios y Valor. |
| precios.base | `number` | Requerido | Precio de lista actual. |
| precios.inicial | `number` | Opcional | Precio "Friend & Family" o lanzamiento. |
| precios.metroCuadrado | `number` | Calculado | Precio / m2. |
| precios.mantenimientoMensual | `number` | Opcional | Cuota de mantenimiento. |
| **preciosHistoricos** | `object[]` | **Historial** | Registro de cambios de precio. |
| preciosHistoricos[].fecha | `timestamp` | Sub-campo | Fecha del cambio. |
| preciosHistoricos[].precio | `number` | Sub-campo | Valor anterior. |
| **plusvaliaReal** | `number` | **Calculado** | % Crecimiento real (Base vs Inicial/Histórico). |
| **acabados** | `map` | Objeto | Detalles de terminados. |
| acabados.cocina | `string` | Sub-campo | Ej: "Granito". |
| acabados.pisos | `string` | Sub-campo | Ej: "Porcelanato". |
| **media** | `map` | Objeto | Multimedia específica. |
| media.cover | `string` | URL | Imagen de portada. |
| media.gallery | `string[]` | URLs | Galería de imágenes. |
| media.plantasArquitectonicas | `string[]` | URLs | Planos. |
| media.recorridoVirtual | `string` | URL | Tour 3D / Matterport. |
| media.videoPromocional | `string` | URL | Video promocional. |
| **highlights** | `string[]` | **Calculado** | Badges competitivos (ej: "Mayor Terreno de la Zona"). |
| **promocion** | `map` | Objeto | Promoción específica del modelo. |

---

## 4. Diccionarios y Auxiliares

### Geo-Dictionary (`geografiaId`)
Identificadores únicos para ciudades y zonas, usados para agregación y SEO.
Formato: `mx-[estado]-[ciudad]` (ej: `mx-sin-cul`, `mx-sin-mzt`).

---

## Consideraciones de Importación (Data Manager)

*   **Identidad:** Los IDs de Desarrollo son deterministas. Si cambias el nombre de la constructora o del desarrollo, cambiará el ID (generando un nuevo doc).
*   **Safe Merge:** La importación utiliza `merge: true`.
*   **Campos Protegidos:**
    *   `desarrollo.stats`, `desarrollo.scoreCard`
    *   `desarrollador.operacion`, `desarrollador.stats`
    *   *Estos campos no son sobrescritos por el CSV.*
*   **Timezones:** Las fechas (`fechaEntrega`, Promociones) se convierten a UTC respetando la zona horaria física de la ciudad del desarrollo.