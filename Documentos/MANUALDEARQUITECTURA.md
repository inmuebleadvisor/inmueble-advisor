    📘 Manual de Arquitectura para Inmueble Advisor.

Este manual establece las reglas y directrices esenciales para el diseño de sistemas de gran escala, priorizando la modularidad, la escalabilidad y la colaboración eficiente con herramientas de Agent Coding.

I. Modelo de Estructura Principal: Modularidad y Desacoplamiento
El diseño fundamental del sistema debe rechazar el modelo monolítico en favor de componentes pequeños e independientes.

1. Principio: Arquitectura Serverless (Function-as-a-Service)
Descripción: La aplicación adopta un modelo Serverless utilizando Google Cloud Functions (Firebase).

Implementación:

Unidad de Despliegue: La unidad fundamental no es un contenedor, sino una Función (Cloud Function).
Escalabilidad: El escalado es gestionado automáticamente por la plataforma (Google Cloud), permitiendo reducir costos a cero cuando no hay tráfico y escalar infinitamente bajo demanda.
Stateless: Las funciones son efímeras y sin estado. Toda persistencia debe delegarse a la Base de Datos o Almacenamiento externo.

2. Contratos de Comunicación (APIs)
Regla: La comunicación entre servicios debe realizarse a través de interfaces (APIs) bien definidas y versionadas.

Tipos de Comunicación:

Sincrónico (Consultas/Comandos): Utilizar REST o, preferiblemente, gRPC para la alta eficiencia y la generación automática de stubs (esquemas de datos).

Asincrónico (Eventos/Notificaciones): Utilizar una Cola de Mensajes (Kafka, RabbitMQ, SQS) para la comunicación de eventos y tareas de fondo. Esto garantiza que los servicios no se bloqueen entre sí.

Documentación: Todas las APIs deben ser documentadas formalmente (utilizando OpenAPI/Swagger para REST o archivos .proto para gRPC). Esto es crucial para la IA (Gemini) para entender cómo interactuar con el servicio.

II. Capa de Datos y Persistencia
Para una aplicación sofisticada, la dependencia de una única base de datos es una limitación inaceptable.

3. Persistencia Políglota (Polyglot Persistence)
Regla: Cada servicio es dueño de sus propios datos y tiene la libertad de elegir el tipo de base de datos que mejor se adapte a sus requisitos.

Ejemplos de Uso:

SQL (PostgreSQL, MySQL): Para datos transaccionales críticos que requieren ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad).

NoSQL (MongoDB, Cassandra): Para datos con esquemas flexibles, alto volumen de escritura o baja latencia.

Key-Value (Redis, Memcached): Para caching rápido, almacenamiento de sesiones y colas de trabajo.

Aislamiento: Un servicio nunca debe acceder directamente a la base de datos de otro servicio. Debe interactuar únicamente a través de su API.

III. Directrices para la Colaboración con Agentes de Codificación
Estas reglas están diseñadas para maximizar la eficiencia, la calidad y la comprensión de un agente de codificación como Gemini.

4. Estructura y Nomenclatura Adaptativa
Regla: La estructura de carpetas debe reflejar la naturaleza tecnológica del componente (Frontend vs Backend Serverless).

A. Backend (Cloud Functions) - Clean Architecture:

/src/core: Lógica de negocio pura (Use Cases, Entities). Agnóstica al framework.

/src/interface: Adaptadores de entrada (Triggers, Callable Functions). Capa de Presentación.

/src/infrastructure: Adaptadores de salida (Repositories, External APIs). Detalles de implementación.

/tests: Pruebas unitarias centralizadas.

B. Frontend (React/Vite) - Capas de Servicio:

/src/config: Constantes globales y configuración centralizada (Single Source of Truth).

/src/types: Definiciones de tipos (JSDoc/TypeScript) para contratos de datos robustos.

/src/repositories: Capa de Acceso a Datos (Firebase/API). Sigue el patrón Repository para aislar la persistencia de la lógica de negocio (Análogo a `/infrastructure` en Backend).

/src/services: Lógica de negocio y orquestación. Interactúan con Repositories.
    *   NOTA: La Inyección de Dependencias se realiza en `service.provider.js` (Composition Root) antes de exponerse.

/src/layouts: Estructuras visuales globales (Wrappers, Navbars, Sidebars).

/src/screens: Vistas/Páginas completas. Representan las rutas principales de navegación.

/src/components: Elementos de UI reutilizables y agnósticos (BEM, Semántico).

/src/hooks: Lógica de estado reactiva (ViewModels) y utilidades de UI.

/src/context: Mecanismo de transporte para disponibilizar los Servicios a los Componentes (no contiene lógica compleja, solo exposición).

Ventaja con Gemini: Al trabajar en Backend, Gemini buscará Use Cases en `/core`. Al trabajar en Frontend, buscará Servicios en `/services`.

5. Pruebas Automatizadas como Especificación
Regla: El código debe tener una alta cobertura de pruebas (Unitarias, de Integración y, si es necesario, End-to-End).

Propósito Didáctico: Las pruebas no solo validan el código, sino que también actúan como una especificación ejecutable.

Si le pides a Gemini que refactorice una función, el suite de pruebas le indica a la IA (y al desarrollador) exactamente lo que se espera que haga la función.

Todo el código generado o modificado por el agente de codificación debe pasar todas las pruebas existentes antes de su integración.

6. Configuración de Entorno Declarativa (I.A.C.)
Regla: Se utiliza Infraestructura como Código (IaC) centrada en el ecosistema Firebase.

Facilita a Gemini:
Archivo Maestro: `firebase.json` es la fuente de verdad para la definición de funciones, reglas de seguridad y hosting.
Variables de Entorno: La configuración dinámica se gestiona mediante Firebase Config (`.env` o `functions:config`).
No se requiere gestión manual de Dockerfiles ni Kubernetes.

IV. Gestión de la Complejidad y Calidad
Estas reglas aseguran que el código sea mantenible a largo plazo, independientemente de quién o qué lo escriba.

7. Principio DRY y Bibliotecas Compartidas
Regla: Las funciones transversales (ej. manejo de errores, logging, utilidades de fecha, validación de JWT) deben abstraerse en bibliotecas internas compartidas.

Mecanismo: Estas bibliotecas deben publicarse y consumirse como dependencias en cada microservicio, evitando la copia de código que dificulta la refactorización a gran escala.

8. Arquitectura de Decisión Registrada (ADR)
Regla: Toda decisión arquitectónica significativa debe documentarse formalmente.

Formato Recomendado: Architecture Decision Record (ADR). Un ADR explica el contexto, la decisión tomada, las alternativas consideradas y las consecuencias.

Propósito: Proporciona un registro histórico y contextual que es vital para la incorporación de nuevos miembros (humanos o IA) y para justificar el diseño del sistema.