# Walkthrough: Refactorización Data-Manager

**Fecha:** 30 de Diciembre, 2025
**Objetivo:** Eliminar deuda técnica, violaciones DRY y endurecer esquemas.

## Cambios Realizados

### 1. Librerías Compartidas (DRY)
Se creó la carpeta `/lib/shared/` para centralizar lógica repetida:
- `normalization.js`: Limpieza de strings, emails, teléfonos y generación de geo-slugs.
- `transformers.js`: Parseo de pipes (`|`) y arrays numéricos.
- `zod-utils.js`: Preprocesadores comunes para Zod (booleanos, números, fechas).

### 2. Timezones Robustos (Luxon)
Se reemplazó la lógica iterativa manual de `timezones.js` por `Luxon`. Ahora el parseo de fechas es preciso y maneja correctamente los offsets de ciudades como Tijuana o Cancún.

### 3. Hardening de Esquemas
Todos los esquemas en `schemas.js` ahora utilizan `.strict()`. Esto previene que campos basura del CSV contaminen la base de datos.
- Se corrigió el campo faltante `precios.moneda` en el esquema de Desarrollo.

### 4. Limpieza de Adaptadores
`adapters.js` fue refactorizado para importar las nuevas utilidades compartidas, reduciendo el tamaño del archivo y eliminando código muerto.

## Verificación

Se ejecutó el test de regresión `test_desarrollos_v2.js`:
```bash
node test_desarrollos_v2.js
```

**Resultados:**
- ✅ Generación de IDs deterministas.
- ✅ Geo-Tagging correcto.
- ✅ Validación de Esquemas (incluyendo los nuevos campos estrictos).
- ✅ Parseo de nuevas estructuras anidadas.

El sistema está listo para importar datos con mayor fiabilidad.
