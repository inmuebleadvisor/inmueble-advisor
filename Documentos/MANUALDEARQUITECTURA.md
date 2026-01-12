    📘 Manual de Arquitectura para Inmueble Advisor.

Este manual establece las reglas y directrices esenciales para el diseño de sistemas de gran escala, priorizando la modularidad, la escalabilidad y la colaboración eficiente con herramientas de Agent Coding.

I. Modelo de Estructura Principal: Modularidad y Desacoplamiento
El diseño fundamental del sistema debe rechazar el modelo monolítico en favor de componentes pequeños e independientes.

1. Principio: Arquitectura de Microservicios (o Servicios Bien Definidos)
Descripción: La aplicación debe dividirse en servicios funcionales independientes que puedan desarrollarse, implementarse y escalarse de forma aislada.

Implementación:

Ámbito de Servicio: Cada servicio debe adherirse estrictamente al Principio de Responsabilidad Única (SRP). Un servicio debe resolver una única capacidad de negocio (ej. AuthService, PaymentService, InventoryService).

Despliegue: Cada servicio debe ser autocontenido y desplegable por separado (usando Docker).

Límites de Contexto (DDD): Los límites de los servicios deben coincidir con los Contextos Delimitados del negocio para evitar dependencias innecesarias.

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

4. Estructura y Nomenclatura Consistente
Regla: Se debe aplicar una estructura de carpetas y nomenclatura de archivos idéntica en todos los microservicios.

Estructura Típica Recomendada:

/src: Código fuente.

/src/models: Definiciones de datos (entidades).

/src/repositories: Lógica de acceso a la base de datos.

/src/services: Lógica de negocio principal (la orquestación de la aplicación).

/src/controllers (o handlers): Lógica de entrada/salida de la API.

/tests: Pruebas unitarias y de integración.

Ventaja con Gemini: Al pedirle a Gemini que "agregue la lógica de validación", sabrá automáticamente que debe modificar o crear código en el directorio /src/services.

5. Pruebas Automatizadas como Especificación
Regla: El código debe tener una alta cobertura de pruebas (Unitarias, de Integración y, si es necesario, End-to-End).

Propósito Didáctico: Las pruebas no solo validan el código, sino que también actúan como una especificación ejecutable.

Si le pides a Gemini que refactorice una función, el suite de pruebas le indica a la IA (y al desarrollador) exactamente lo que se espera que haga la función.

Todo el código generado o modificado por el agente de codificación debe pasar todas las pruebas existentes antes de su integración.

6. Configuración de Entorno Declarativa (I.A.C.)
Regla: Se debe utilizar Infraestructura como Código (IaC), como Docker, para definir cómo se empaqueta cada servicio y Kubernetes (o Terraform/CloudFormation) para definir cómo se implementa y escala en la nube.

Facilita a Gemini: Permite al agente de codificación generar configuraciones de deployment (como archivos deployment.yaml o docker-compose.yml) con contexto y precisión, sin tener que asumir detalles del entorno.

IV. Gestión de la Complejidad y Calidad
Estas reglas aseguran que el código sea mantenible a largo plazo, independientemente de quién o qué lo escriba.

7. Principio DRY y Bibliotecas Compartidas
Regla: Las funciones transversales (ej. manejo de errores, logging, utilidades de fecha, validación de JWT) deben abstraerse en bibliotecas internas compartidas.

Mecanismo: Estas bibliotecas deben publicarse y consumirse como dependencias en cada microservicio, evitando la copia de código que dificulta la refactorización a gran escala.

8. Arquitectura de Decisión Registrada (ADR)
Regla: Toda decisión arquitectónica significativa debe documentarse formalmente.

Formato Recomendado: Architecture Decision Record (ADR). Un ADR explica el contexto, la decisión tomada, las alternativas consideradas y las consecuencias.

Propósito: Proporciona un registro histórico y contextual que es vital para la incorporación de nuevos miembros (humanos o IA) y para justificar el diseño del sistema.