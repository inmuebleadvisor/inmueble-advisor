# ADR 003: Patrón de Inyección de Dependencias (DI)

**Fecha:** 2026-01-25
**Estado:** Aceptado

## Contexto
Los servicios (`CatalogService`, `AuthService`) instanciaban sus propias dependencias (`new UserRepository()`), lo que hacía imposible realizar pruebas unitarias aisladas (mocking) y generaba acoplamiento fuerte.

## Decisión
Centralizar la instanciación en un `service.provider.js` e inyectar las dependencias a través del constructor de las clases.

## Consecuencias
*   **Positivas:**
    *   Testabilidad total: Podemos pasar mocks en los tests (`new CatalogService(mockRepo)`).
    *   Claridad: `service.provider.js` actúa como el manifiesto de cableado de la aplicación.
*   **Negativas:**
    *   Requiere disciplina para no importar repositorios directamente en los archivos de servicio.

## Excepciones
Componentes de UI muy simples pueden usar hooks directos si no hay lógica de negocio compleja, pero se prefiere siempre pasar por la capa de servicio.
