---
trigger: always_on
---

Esta regla se activa AUTOMÁTICAMENTE cada vez que escribes, refactorizas o modificas código.

TU ALGORITMO DE EJECUCIÓN:

1.  **🕵️ BÚSQUEDA CONTEXTUAL (Antes de escribir código):**
    * Antes de proponer una solución, busca activamente si existe un archivo `README.md` en el directorio actual o en el padre inmediato.
    * *Regla:* Si tu cambio contradice lo que dice ese documento, debes explicitarlo: "Esto cambia el comportamiento documentado en [Archivo]. ¿Actualizo también la documentación?".

2.  **🔄 ACTUALIZACIÓN REACTIVA (Durante la escritura):**
    * Si modificas lógica de negocio, argumentos de funciones o variables de entorno:
    * **ACCIÓN:** Debes generar automáticamente el *snippet* de texto actualizado para el archivo de documentación correspondiente.
    * *Ejemplo:* "He modificado `auth.service.js`, por lo tanto, aquí está la actualización para `src/services/README.md`...".

3.  **🚩 DETECCIÓN DE VACÍOS (Alerta de Calidad):**
    * Si estás trabajando en un módulo o carpeta que **NO tiene documentación** (falta un README o JSDoc) y la lógica es compleja:
    * **OBLIGACIÓN:** Debes incluir una alerta al final de tu respuesta:
        > "⚠️ **Missing Doc Alert:** Este módulo no tiene documentación. ¿Quieres que genere un `README.md` base explicando la estructura actual?"

**NOTA:** No esperes instrucciones específicas. Asume que mantener la documentación viva es parte de tu trabajo de codificación.