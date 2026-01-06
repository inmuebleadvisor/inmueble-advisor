# Types & Models (Capa de Dominio) 🏷️

El directorio `src/types` contiene las definiciones de datos centrales de la aplicación. Aquí definimos la "forma" de nuestras entidades de negocio.

## Reglas de Oro
1.  **Sin Lógica**: Este directorio NO debe contener lógica de negocio ni implementaciones de funciones complejas.
2.  **Solo Definiciones**: Se usa para Clases o definiciones de JSDoc que describan los datos.
3.  **Constructores**: Las clases pueden tener constructores para inicializar valores por defecto, pero no deben realizar efectos secundarios (como llamadas a APIs).

## Catálogo de Modelos
-   **`Modelo.js`**: Representa un prototipo de casa o departamento.
-   **`Desarrollo.js`**: Representa un proyecto inmobiliario completo.

## Ejemplo de Uso
```javascript
// src/types/Modelo.js
export class Modelo {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nombre = data.nombre || '';
    this.precio = data.precio || 0;
    this.caracteristicas = data.caracteristicas || [];
  }
}
```

## Por qué es importante?
Al usar estas clases en los **Repositorios**, garantizamos que el resto de la aplicación (UI y Servicios) reciba objetos predecibles, evitando errores de "undefined" al intentar acceder a propiedades de documentos de Firestore.

---
*Nota: Si necesitas agregar una entidad como "Pagos", crea su clase aquí primero.*
