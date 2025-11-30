# 📘 Diccionario de Datos (Schema) - Inmueble Advisor v1.0

Este documento define la estructura de datos final y optimizada de Firestore después de la migración arquitectónica. Todos los campos están en formato CamelCase o SnakeCase_Estándar y los valores numéricos son tipos nativos (Number o Timestamp).

**¡ADVERTENCIA CRÍTICA PARA PROGRAMADORES!**
Los campos anidados como `caracteristicas`, `dimensiones`, `precio`, `precios` y `ubicacion.latitud` (String) **HAN SIDO ELIMINADOS** de la base de datos y movidos a la raíz o a campos optimizados. No intente leer estos campos obsoletos.

---

## 1. Colección: `modelos` 🏠

*Representa una unidad tipo (casa o departamento) disponible.*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `id` | String | ID único del modelo (Generado por concatenación) |
| `nombreModelo` | String | Nombre comercial del modelo (ej. "Águila") |
| `id_desarrollo` | String | ID del desarrollo padre |
| `precioNumerico` | **Number** | Precio de lista base |
| `recamaras` | **Number** | Cantidad de habitaciones (limpio de `caracteristicas`) |
| `banos` | **Number** | Cantidad de baños (limpio de `caracteristicas`) |
| `niveles` | **Number** | Pisos de la propiedad |
| `m2` | **Number** | Metros de construcción (limpio de `dimensiones`) |
| `terreno` | **Number** | Metros de terreno |
| `amenidades` | **Array[String]** | Amenidades específicas del modelo (limpio de `extras.amenidades_modelo`) |
| `tipoVivienda` | String | "Casas", "Departamentos" |
| `esPreventa` | Boolean | `true` si es preventa |
| `constructora` | String | Nombre de la constructora |

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
| `ubicacion` | Map | Mapa geográfico y textual |
| ↳ `latitud` | **Number** | Coordenada Y (decimal) |
| ↳ `longitud` | **Number** | Coordenada X (decimal) |
| `info_comercial` | Map | Datos de negocio |
| ↳ `inventario` | **Number** | Unidades disponibles (limpio de string) |
| ↳ `unidades_proyectadas`| **Number** | Total de unidades |
| ↳ `fecha_entrega` | **Timestamp** | Fecha de entrega esperada (migrado de `dd/mm/yyyy` string) |

---

## 3. Colección: `users` 👥

*Perfiles de usuario, incluyendo la lógica de Asesores.*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `uid` | String | ID de Firebase Auth |
| `role` | String | Rol del usuario (`asesor` o `cliente`) |
| `scoreGlobal` | Number | Puntuación de calidad (0-100) (Calculado por Backend) |
| `telefono` | String | Teléfono de contacto del asesor |
| `inventario` | Array[Map] | Lista de desarrollos que el asesor tiene asignados |
| ↳ `idDesarrollo` | String | ID del desarrollo |
| ↳ `activo` | **Boolean** | **NUEVO:** `true` si está activo, `false` si está pendiente. (Migrado de string `status`). |

---

## 4. Colección: `leads` 🎯

*Oportunidades de venta y embudo CRM.*

| Campo | Tipo Esperado | Descripción |
| :--- | :--- | :--- |
| `status` | String (Enum) | Etapa del embudo: `NEW`, `CONTACTED`, `WON`, `LOST` |
| `asesorUid` | String | ID del asesor asignado (fijado por Cloud Function) |
| `fechaCreacion` | Timestamp | Fecha en que se originó el lead |
| `clienteDatos` | Map | Información de contacto |
| `historial` | Array[Map] | Bitácora de eventos |
| ↳ `fecha` | **Timestamp** | **IMPORTANTE:** Fecha del evento (Migrado de string ISO a Timestamp) |