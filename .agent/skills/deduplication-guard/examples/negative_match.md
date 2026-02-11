# Example: Negative Match (New Feature)

## Scenario
The user asks to "Create a new service for calculating property taxes based on local legislation".

## Execution
1. Agent runs `audit_existence.py --search "PropertyTax" --type "class"`.
2. Output:
```json
{
  "exists": false,
  "matches": []
}
```

## Agent Response
> "Tras auditar el codebase, he confirmado que no existe lógica previa para el cálculo de impuestos prediales. Procederé con la implementación siguiendo la **Arquitectura Hexagonal** (creando el Use Case en `src/core` y el adaptador en `src/infrastructure`)."
