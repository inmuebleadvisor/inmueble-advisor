# Capa de Dominio — `src/types`

Funciones mapper puras que transforman un `DocumentSnapshot` de Firestore en un objeto de dominio con forma y valores por defecto garantizados. **No contienen lógica de negocio.**

## Contrato del Mapper

```
mapModelo(docSnapshot: FirebaseFirestore.DocumentSnapshot) → ModeloObject
mapDesarrollo(docSnapshot: FirebaseFirestore.DocumentSnapshot) → DesarrolloObject
```

---

## `Modelo.js` — Función `mapModelo`

Transforma un documento de la colección `modelos` de Firestore.

### Campos de salida garantizados

| Campo | Tipo | Fuente Firestore | Default |
|---|---|---|---|
| `id` | `string` | `docSnapshot.id` | — |
| `isUniqueContent` | `boolean` | `data.isUniqueContent` | `true` ¹ |
| `idDesarrollo` | `string` | `idDesarrollo \| id_desarrollo \| desarrollo_id` | `''` |
| `nombre_modelo` | `string` | `nombreModelo \| nombre_modelo` | `'Modelo'` |
| `precioNumerico` | `number` | `precios.base \| precioNumerico` | `0` |
| `imagenPrincipal` | `string` | procesada por `procesarImagenes` | `''` |
| `imagenes` | `string[]` | procesada por `procesarImagenes` | `[]` |
| `recamaras/banos/m2/cajones/terreno` | `number` | Firestore | `0` |
| `esPreventa` | `boolean` | `true \| 'true' \| 1` → `true` | `false` |
| `amenidades` | `string[]` | Firestore | `[]` |
| `activo` | `boolean` | `activo \| ActivoModelo` | `true` |
| `plantas` | `object[]` | `media.plantasArquitectonicas` | `[]` |

> ¹ `isUniqueContent ?? true`: si el campo no existe en Firestore el modelo **permanece indexable** por Googlebot. Solo `false` explícito activa `noindex`. Ver `DetalleModelo.jsx`.

---

## `Desarrollo.js` — Función `mapDesarrollo`

Transforma un documento de la colección `desarrollos` de Firestore.

### Campos de salida garantizados

| Campo | Tipo | Fuente Firestore | Default |
|---|---|---|---|
| `id` | `string` | `docSnapshot.id` | — |
| `isUniqueContent` | `boolean` | `data.isUniqueContent` | `true` ¹ |
| `nombre` | `string` | `data.nombre` | `'Desarrollo'` |
| `multimedia.galeria` | `string[]` | `procesarImagenes` | `[]` |
| `multimedia.portada` | `string` | `procesarImagenes` | `''` |
| `ubicacion` | `object` | Firestore | `{}` |
| `precioDesde` | `number` | `precios.desde \| precioDesde` | `0` |
| `activo` | `boolean` | `data.activo !== false` | `true` |
| `updatedAt` | `Timestamp\|null` | Firestore | `null` |

> ¹ Mismo contrato que `Modelo.js`. Ver `DetalleDesarrollo.jsx`.

---

## Reglas de Agente

- **No agregar lógica de negocio** aquí. Si necesitas calcular algo a partir de los datos, hazlo en `src/services/`.
- Para agregar un campo nuevo: primero verifica si existe en Firestore, luego agrega en el `return` con su default explícito.
- Para una entidad nueva (ej. `Pago`), crea `Pago.js` con el mismo patrón de función `mapPago`.
