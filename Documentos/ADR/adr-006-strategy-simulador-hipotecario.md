# ADR-006: Patrón Strategy para Abstracción de Productos Bancarios

**Estado:** Aceptado
**Fecha:** 2026-03-05
**Autores:** Equipo Inmueble Advisor + Antigravity

---

## Contexto

El simulador hipotecario necesita calcular mensualidades, tablas de amortización y ahorros por abonos. Diferentes bancos (Banorte, BBVA, Infonavit, etc.) tienen fórmulas específicas: distintos factores de seguro, comisiones diferidas, métodos de cálculo de días y aforos permitidos.

Una implementación monolítica en el servicio central haría que agregar un nuevo banco requiriera modificar el código existente, violando el **Principio Abierto/Cerrado (OCP)** y el **SRP**.

---

## Decisión

Se adopta el **Patrón Strategy** para encapsular los algoritmos de cálculo específicos de cada producto bancario.

### Estructura de Implementación

```
src/services/mortgage/
├── BaseMortgageStrategy.js      → Interfaz abstracta (contrato)
├── HipotecaFuerteStrategy.js    → Implementación Banorte "Hipoteca Fuerte"
└── MortgageSimulatorService.js  → Orchestrador (usa la strategy inyectada)
```

### Composition Root (Inyección)

```javascript
// service.provider.js — único lugar donde se ensambla la strategy
export const mortgageSimulatorService = new MortgageSimulatorService(
    new HipotecaFuerteStrategy(MORTGAGE_PRODUCTS.HIPOTECA_FUERTE_BANORTE)
);
```

### Para agregar un nuevo banco:

1. Crear `BBVAStrategy.js extends BaseMortgageStrategy`
2. Implementar `calculateMensualidad()`, `generateAmortizationTable()`, `validateRequirements()`
3. Registrar en `service.provider.js`
4. **Sin modificar nada existente.**

---

## Alternativas Consideradas

| Alternativa | Razón de Rechazo |
|---|---|
| `if/switch` en el servicio por banco | Viola OCP. Cada banco nuevo exige modificar código probado. |
| Una clase por banco sin interfaz | Sin contrato → imposible garantizar compatibilidad. |
| Función utilitaria global `calcular(banco, ...)` | No escala. Imposible mockear en tests unitarios. |

---

## Consecuencias

**Positivas:**
- Agregar bancos = crear un archivo nuevo, no modificar existentes.
- Cada Strategy es testeable de forma aislada.
- El `MortgageSimulatorService` puede cambiar de banco en runtime (`setStrategy()`).

**Negativas:**
- Mayor cantidad de archivos comparado con una solución monolítica.
- El desarrollador debe conocer el patrón Strategy para contribuir.

---

## Referencias

- `src/services/mortgage/BaseMortgageStrategy.js`
- `src/services/mortgage/HipotecaFuerteStrategy.js`
- `src/config/mortgageProducts.js`
- ADR-003: Patrón Dependency Injection
