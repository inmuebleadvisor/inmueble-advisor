# ADR 001: Uso de Arquitectura Hexagonal en Backend (Cloud Functions)

**Fecha:** 2026-01-20
**Estado:** Aceptado

## Contexto
El backend de la aplicación creció de ser simples scripts a contener lógica de negocio compleja (asignación de leads, promociones de usuario). Necesitábamos una forma de desacoplar esta lógica de la infraestructura específica de Firebase.

## Decisión
Implementar **Arquitectura Hexagonal (Ports & Adapters)** en el directorio `functions/src`.

## Consecuencias
*   **Positivas:**
    *   La lógica de negocio (`src/core`) es pura y testeable sin necesidad de emuladores de Firebase.
    *   Podemos cambiar la base de datos (de Firestore a PostgreSQL) solo cambiando los Repositorios (`src/infrastructure`).
*   **Negativas:**
    *   Mayor boilerplate (archivos extra para interfaces y repositorios).
    *   Curva de aprendizaje inicial para desarrolladores frontend.

## Estructura Resultante
*   `core/`: UseCases y Entidades.
*   `infrastructure/`: Implementación de Repositorios.
*   `interface/`: Triggers y Callables de Firebase.
