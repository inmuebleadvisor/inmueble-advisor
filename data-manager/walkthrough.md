# Walkthrough: Refactorización Data-Manager

Este documento detalla los cambios realizados durante la auditoría técnica y limpieza de `data-manager`.

## 1. Shared Normalization
Se extrajo la lógica de limpieza de cadenas y generación de slugs a un módulo compartido para cumplir con DRY.

`lib/shared/normalization.js`:
```javascript
export const slugify = (str) => {
    if (!str) return null;
    return String(str)
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
```

## 2. Timezone Configuration
Se eliminó la lógica condicional frágil (heurística) en favor de un archivo de configuración explícito y búsqueda exacta.

`lib/config/timezones.json` (Nuevo):
```json
{
    "tijuana": "America/Tijuana",
    "cancun": "America/Cancun",
    "cdmx": "America/Mexico_City",
    ...
}
```

## 3. Import Determinism
El script de importación ahora es conservador por defecto. La fusión de registros "fuzzy" está deshabilitada a menos que se use una opción explícita (simulada en código, preparada para flag CLI).

## 4. Schema Hardening
Se mejoró la seguridad de tipos en Zod, eliminando `z.any()` y agregando validaciones de rango de fechas.

## Verificación
Los tests unitarios se ejecutaron exitosamente:
- `node data-manager/test_adapters.js` ✅
- `node data-manager/test_desarrolladores.js` ✅
