# Repository Layer (Capa de Repositorios) 🗄️

El directorio `src/repositories` sirve como la capa de acceso a datos de la aplicación. Actúa como un puente entre la base de datos (Firestore) y la lógica de negocio (Servicios).

## Propósito
Mientras que los **Servicios** manejan la lógica de negocio, los **Repositorios** son responsables de:
1.  **Encapsulamiento de Consultas:** Aislar las consultas de Firestore (filtros, colecciones, documentos) de la lógica de negocio.
2.  **Mantenibilidad:** Si cambiamos la estructura de la base de datos o migramos de Firebase, solo necesitamos modificar los repositorios.
3.  **Tipado y Limpieza:** Asegurar que los datos que regresan a la aplicación tengan un formato consistente (ej. incluir el `uid` en el objeto).

## Catálogo de Repositorios Actuales
-   **`CatalogRepository`**: Obtención de modelos de casas, prototipos y desarrollos. Convierte data cruda en objetos `Model`, `Development`.
-   **`ExternalAdvisorRepository`**: Datos sobre asesores externos y agencias.
-   **`LeadRepository`**: Acceso a la colección de prospectos (leads) y sus estados.
-   **`UserRepository`**: CRUD de usuarios, gestión de favoritos y perfiles.

## 🛡️ La "Aduana de Datos" (Data Gatekeeper)
El repositorio actúa como una aduana.
-   **Entrada:** JSON crudo e inconsistente de Firebase/Firestore.
-   **Salida:** Objetos de dominio limpios y validados.
> **Regla de Oro:** Si la lógica de negocio se filtra aquí, violamos el principio de Responsabilidad Única (SRP). El repositorio solo **traduce** datos, no toma decisiones.

## Estructura de un Repositorio
Todos los repositorios deben ser clases que reciban la instancia de la base de datos (`db`) en su constructor para facilitar el testeo.

```javascript
// Ejemplo de Estructura: src/repositories/user.repository.js
export class UserRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'users'; // Definición centralizada de la colección
    }

    async getUserById(uid) {
        const userRef = doc(this.db, this.collectionName, uid);
        const snap = await getDoc(userRef);
        return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
    }
}
```

## Uso Recomendado
Los Repositorios deben ser instanciados en `serviceProvider.js` e inyectados en los Servicios. **Evita usar Repositorios directamente en los componentes/hooks de la UI; usa siempre el Servicio intermedio.**

---
*Nota: Cada repositorio debe tener su archivo de pruebas correspondiente: `test_nombre.repository.js`.*
