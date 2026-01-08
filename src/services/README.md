# Service Layer Architecture (Capa de Servicios) 🚀

Esta carpeta contiene la lógica de negocio central de la aplicación. Aquí es donde se orquestan las llamadas a la API (Firebase), las suscripciones a datos y los flujos de trabajo complejos.

## Principios Clave
1.  **Lógica sin Estado (Stateless):** Los servicios deben contener lógica pura y llamadas a APIs. El estado de la UI debe manejarse en `context` o componentes.
2.  **Patrón Singleton & DI:** Los servicios se instancian una sola vez en `serviceProvider.js`. Usamos **Inyección de Dependencias (DI)** para pasar repositorios u otros servicios.
3.  **Abstracción:** Los componentes no deben conocer los detalles de la infraestructura (Firebase, Firestore, etc.), solo los métodos del servicio.

## Catálogo de Servicios Actuales
-   **`AdminService`**: Funciones administrativas y estadísticas globales.
-   **`AnalyticsService`**: (Frontend) Maneja el ciclo de vida de la sesión (Start/End) y el tracking de visitas (`AnalyticEventsRepository`).
-   **`DashboardService`**: Consume las estadísticas pre-calculadas de la colección `dashboard_stats` para visualizar en el panel de admin.
-   **`AppointmentService`**: Gestión de citas y calendario de visitas.
-   **`AuthService`**: Maneja el login con Google, logout y promoción de roles (Asesores).
-   **`CatalogService`**: Gestiona el catálogo de inmuebles, filtros y búsqueda.
-   **`ClientService`**: Gestión de perfiles de clientes.
-   **`ConfigService`**: Configuración remota (Remote Config) y Feature Flags.
-   **`CrmService`**: Lógica para la gestión de leads y asignaciones.
-   **`ExternalAdvisorService`**: Gestión de asesores externos y convenios.
-   **`FavoritesService`**: Maneja la lista de propiedades favoritas del usuario.
-   **`LeadAssignmentService`**: Algoritmos para asignar interesados a asesores.
-   **`MetaService`**: (Frontend) Maneja la inicialización del Pixel, rastreo de eventos y generación de `event_id` para deduplicación híbrida.
-   **`SeasonService`**: Gestión de temporadas y precios dinámicos.

## Cómo Crear un Nuevo Servicio
1.  Crea la clase en este directorio (ej. `PaymentService.js`).
2.  Define el constructor para recibir sus dependencias (repositorios, auth, etc.).
3.  Registra la instancia en `src/services/serviceProvider.js`.
4.  Expórtalo en el objeto `services` para que sea accesible vía hooks.

## Ejemplo Real: Inyección de Dependencias
Los servicios **nunca** deben instanciar sus dependencias internamente. Deben recibirlas en el constructor.

```javascript
// src/services/auth.service.js
export class AuthService {
    // 💉 Dependencias inyectadas en el constructor
    constructor(auth, googleProvider, userRepository) {
        this.auth = auth;
        this.googleProvider = googleProvider;
        this.userRepository = userRepository; 
    }

    async loginWithGoogle() {
        const result = await signInWithPopup(this.auth, this.googleProvider);
        
        // Uso del repositorio inyectado para lógica de persistencia
        let profile = await this.userRepository.getUserById(result.user.uid);
        
        if (!profile) {
            profile = await this.userRepository.createUserWithId(result.user.uid, { 
                email: result.user.email,
                role: 'client' 
            });
        }
        return profile;
    }
}
```

### Registro en ServiceProvider
```javascript
// src/services/serviceProvider.js
import { AuthService } from './auth.service';
import { UserRepository } from '../repositories/user.repository';

// 1. Instanciar Repositorios (Capa Inferior)
const userRepo = new UserRepository(db);

// 2. Instanciar Servicios inyectando Repositorios (Capa Superior)
export const authService = new AuthService(auth, googleProvider, userRepo);
```

## Consumo en Componentes
Para usar un servicio, se debe utilizar el hook correspondiente (usualmente `useService`) que accede al `ServiceProvider`.

---
*Nota: Todos los nuevos servicios deben incluir pruebas unitarias siguiendo el patrón `test_nombreservicio.service.js`.*
