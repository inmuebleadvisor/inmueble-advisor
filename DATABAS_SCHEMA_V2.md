# 📘 Diccionario de Datos (Schema) - Inmueble Advisor v1.1 (ACTUALIZADO)
**ÚLTIMA MODIFICACION: 02/12/2025**

Este documento define la estructura de datos después de la Fase 2 de optimización. Se ha priorizado la consistencia de tipos (**Number**, **Timestamp**, **Boolean**) para el procesamiento en Cloud Functions y en la capa de servicios.

**ADVERTENCIA CRÍTICA DE DATOS:**
Los campos de geolocalización (`ubicacion.latitud`/`longitud`) en la base de datos *deberían* ser **Number** (según arquitectura), pero algunos registros reales aún están como **String**. El código del *frontend* usa `parseFloat` para manejar esta inconsistencia.

---

## 1. Colección: `modelos` 🏠

*Representa una unidad tipo (casa o departamento) disponible.*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `id` | String | ID único del modelo (Generado por concatenación) |
| `id_desarrollo` | String | ID del desarrollo padre |
| `nombreModelo` | String | Nombre comercial del modelo (ej. "Águila") |
| `nombreDesarrollo` | String | Nombre del desarrollo padre (Desnormalizado) |
| `constructora` | String | Nombre de la constructora (Desnormalizado) |
| `precioNumerico` | **Number** | Precio de lista base |
| `recamaras` | **Number** | Cantidad de habitaciones |
| `banos` | **Number** | Cantidad de baños |
| `niveles` | **Number** | Pisos de la propiedad |
| `m2` | **Number** | Metros de construcción |
| `terreno` | **Number** | Metros de terreno |
| `amenidades` | Array[String] | Amenidades específicas del modelo |
| `amenidadesDesarrollo` | Array[String] | Amenidades del desarrollo (Copia, para filtros) |
| `tipoVivienda` | String | "Casas", "Departamentos" |
| `esPreventa` | **Boolean** | `true` si es preventa |
| `keywords` | Array[String] | Palabras clave optimizadas para búsqueda (NUEVO) |
| `media` | Map | Contenedor de multimedia (Reemplaza a `multimedia`) |
| ↳ `cover` | String | URL de la imagen principal |
| ↳ `gallery` | Array[String] | Lista de URLs de imágenes |
| `ubicacion` | Map | Mapa geográfico y textual |
| ↳ `latitud` | **Number** | Coordenada Y (Decimal, *Puede ser String*) |
| ↳ `longitud` | **Number** | Coordenada X (Decimal, *Puede ser String*) |

---

## 2. Colección: `desarrollos` 🏢

*Representa el conjunto habitacional (el contenedor de modelos).*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `id` | String | ID del desarrollo (ej. "2847") |
| `nombre` | String | Nombre comercial del desarrollo |
| `status` | String (Enum) | Estado de venta: `IMMEDIATE` o `PREALE` |
| `precioDesde` | **Number** | Precio más bajo de todos sus modelos |
| `amenidades` | Array[String] | Amenidades generales del coto/fraccionamiento |
| `keywords` | Array[String] | Palabras clave optimizadas para búsqueda (NUEVO) |
| `ubicacion` | Map | Mapa geográfico y textual |
| ↳ `latitud` | **Number** | Coordenada Y (Decimal) |
| ↳ `longitud` | **Number** | Coordenada X (Decimal) |
| `media` | Map | Contenedor de multimedia (Reemplaza a `multimedia`) |
| ↳ `cover` | String | URL de la imagen principal |
| ↳ `gallery` | Array[String] | Lista de URLs de imágenes |
| `info_comercial` | Map | Datos de negocio |
| ↳ `inventario` | **Number** | Unidades disponibles |
| ↳ `unidades_proyectadas`| **Number** | Total de unidades |
| ↳ `unidades_vendidas`| **Number** | Unidades vendidas |
| ↳ `fecha_entrega` | **Timestamp** | Fecha de entrega esperada |

---

## 3. Colección: `users` 👥

*Perfiles de usuario, incluyendo la lógica de Asesores.*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `uid` | String | ID de Firebase Auth |
| `role` | String | Rol del usuario (`asesor` o `cliente`) |
| `scoreGlobal` | Number | Puntuación de calidad (0-100) |
| `telefono` | String | Teléfono de contacto del asesor |
| `onboardingCompleto` | **Boolean** | `true` si el asesor terminó el wizard. |
| `inventario` | Array[Map] | Lista de desarrollos que el asesor tiene asignados |
| ↳ `idDesarrollo` | String | ID del desarrollo |
| ↳ `activo` | **Boolean** | **CORREGIDO:** `true` si está activo, `false` si está pendiente/inactivo. |

---

## 4. Colección: `leads` 🎯

*Oportunidades de venta y embudo CRM.*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `status` | String (Enum) | Etapa del embudo: `NEW`, `CONTACTED`, `WON`, `LOST` (ver `constants.js`) |
| `asesorUid` | String | ID del asesor asignado |
| `fechaCreacion` | **Timestamp** | Fecha en que se originó el lead |
| `fechaUltimaInteraccion`| **Timestamp** | Fecha de la última acción o cambio de estado. |
| `clienteDatos` | Map | Información de contacto |
| `cierre` | Map | Datos de cierre de venta (Solo si `status` es `WON`) |
| ↳ `montoFinal` | Number | Precio final de venta |
| ↳ `modeloFinal` | String | Nombre del modelo vendido |
| ↳ `fechaCierre` | Timestamp | Fecha de la victoria |
| `historial` | Array[Map] | Bitácora de eventos |
| ↳ `fecha` | **Timestamp** | Fecha del evento |