# ADR 002: Persistencia Políglota (Firestore + BigQuery)

**Fecha:** 2026-01-22
**Estado:** Aceptado

## Contexto
El Dashboard administrativo requiere agregaciones complejas (ej. "Total de comisiones potenciales de leads vivos hoy"). Firestore no es eficiente para consultas de agregación (`COUNT`, `SUM`) ni joins, lo que resultaba en lecturas excesivas y costos altos.

## Decisión
Implementar un esquema de **Persistencia Políglota**:
1.  **Firestore**: Base de datos transaccional (OLTP) para la operación en tiempo real de la app.
2.  **BigQuery**: Base de datos analítica (OLAP) sincronizada via Extensiones de Firebase.

## Consecuencias
*   **Positivas:**
    *   Reportes instantáneos y baratos usando SQL en BigQuery.
    *   Firestore se mantiene rápido y ligero, sin índices complejos de agregación.
*   **Negativas:**
    *   Latencia de sincronización (aprox. 30s - 1 min).
    *   Necesidad de mantener esquemas en dos lugares (aunque BQ es schema-on-read mayormente).

## Implementación
El `BigQueryDashboardRepository` lee de BQ para generar estadísticas, mientras que los repositorios transaccionales escriben en Firestore.
