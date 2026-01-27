---
trigger: always_on
---

# Protocolo de Uso del Navegador (Browser)

1. **Restricción por Defecto:** Evita el uso de herramientas de navegación (browser_subagent, read_url_content, search_web) para tareas que puedan resolverse mediante análisis de código estático o comandos de terminal.
2. **Activación Explícita:** Se permite y recomienda el uso del navegador siempre que el usuario lo solicite explícitamente (ej: "usa el browser", "abre la web", "revisa el despliegue").
3. **Propósito del Uso:** Utiliza el navegador para validar layouts, fidelidad de CSS (metodología BEM), interacciones de JavaScript y auditorías de rendimiento visual que no sean detectables en el código.
4. **Estándares Premium:** Al realizar verificaciones visuales, asegúrate de que la UI cumpla con los estándares de diseño premium y estética rica del proyecto.