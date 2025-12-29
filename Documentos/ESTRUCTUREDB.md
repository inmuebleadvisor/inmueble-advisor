# 🏗️ ESQUEMA DE DATOS - INMUEBLE ADVISOR WEB

ÚLTIMA MODIFICACION: 11/12/2025

Este documento describe la estructura detallada de las colecciones principales de la base de datos de Inmueble Advisor Web. Está diseñado para ser claro y conciso, facilitando la comprensión de variables, tipos de información y relaciones.

---

## 1. Colección: `DESARROLLOS` (Desarrollos Inmobiliarios)

Representa un complejo habitacional (ej. conjunto de casas, torre de departamentos).

| Campo | Tipo de Dato | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **Clave principal** | Identificador único del desarrollo. |
| **nombre** | `string` | Simple | Nombre comercial del desarrollo. |
| **descripcion** | `string` | Simple | Texto detallado sobre el desarrollo y estilo de vida. |
| **constructora** | `string` | Simple | Nombre de la empresa constructora. |

| **activo** | `boolean` | Simple | Indica si el desarrollo está habilitado (ej. `false`). |
| **analisisIA** | `map` | Objeto anidado | Análisis generado por IA sobre el desarrollo. |
| analisisIA.resumen | `string` | Sub-campo | Resumen ejecutivo del análisis. |
| analisisIA.puntosFuertes | `array<string>` | Sub-campo | Lista de puntos fuertes detectados. |
| analisisIA.puntosDebiles | `array<string>` | Sub-campo | Lista de áreas de oportunidad. |
| **scoreDesarrollo** | `number` | Simple | Puntuación o métrica de calidad/popularidad. |
| **promocion** | `map` | Objeto anidado | Promoción vigente (fechas en Timezone local). |
| promocion.nombre | `string` | Sub-campo | Nombre/Detalle de la promoción. |
| promocion.fecha_inicio | `timestamp` | Sub-campo | Inicio de vigencia. |
| promocion.fecha_fin | `timestamp` | Sub-campo | Fin de vigencia. |
| **keywords** | `array<string>` | Lista | Palabras clave para búsqueda y SEO. |
| **amenidades** | `array<string>` | Lista | Lista de amenidades del *desarrollo* (ej. "Áreas verdes"). |
| **entorno** | `array<string>` | Lista | Lista de puntos de interés o características cercanas. |
| **updatedAt** | `timestamp` | Simple | Fecha de la última modificación de este registro. |
| **ubicacion** | `map` | Objeto anidado | Datos geográficos y de dirección. |
| ubicacion.calle | `string` | Sub-campo | Calle y número. |
| ubicacion.colonia | `string` | Sub-campo | Nombre de la colonia o barrio. |
| ubicacion.localidad | `string` | Sub-campo | Localidad o municipio (entre colonia y ciudad). |
| ubicacion.ciudad | `string` | Sub-campo | Ciudad. |
| ubicacion.estado | `string` | Sub-campo | Estado o provincia. |
| ubicacion.zona | `string` | Sub-campo | Nombre de la zona de la ciudad (ej. "Oriente"). |
| ubicacion.latitud | `number` | Sub-campo | Coordenada latitud. |
| ubicacion.longitud | `number` | Sub-campo | Coordenada longitud. |
| **financiamiento** | `map` | Objeto anidado | Información sobre opciones de compra. |
| financiamiento.aceptaCreditos | `array<string>` | Sub-campo | Tipos de crédito aceptados (ej. "Infonavit"). |
| financiamiento.apartadoMinimo | `number` | Sub-campo | Monto mínimo para el apartado. |
| financiamiento.engancheMinimoPorcentaje | `number` | Sub-campo | Porcentaje mínimo de enganche requerido. |
| **precios** | `map` | Objeto anidado | Detalle de precios. |
| precios.desde | `number` | Sub-campo | Precio base. |
| precios.moneda | `string` | Sub-campo | Código de la moneda (ej. "MXN"). |
| **infoComercial** / **info_comercial** | `map` | Objeto anidado | Datos de ventas y disponibilidad. |
| infoComercial.cantidadModelos | `number` | Sub-campo | Número total de modelos de vivienda en el desarrollo. |
| infoComercial.fechaEntrega / fecha_entrega | `timestamp` | Sub-campo | Fecha de entrega estimada. |
| infoComercial.plusvaliaPromedio | `number` | Sub-campo | Plusvalía promedio estimada. |
| infoComercial.unidadesTotales | `number` | Sub-campo | Número total de unidades a construir. |
| infoComercial.unidadesVendidas / unidades_vendidas | `number` | Sub-campo | Unidades vendidas hasta la fecha. |
| infoComercial.unidadesDisponibles / inventario | `number` | Sub-campo | Unidades restantes para la venta. |
| **legal** | `map` | Objeto anidado | Información legal. |
| legal.regimenPropiedad | `string` | Sub-campo | Tipo de propiedad (ej. "Condominio"). |
| **media** | `map` | Objeto anidado | Archivos multimedia. |
| media.cover | `string` (URL) | Sub-campo | URL de la imagen principal/portada. |
| media.gallery | `array<string>` (URLs) | Sub-campo | URLs para la galería de imágenes. |
| media.brochure | `string` (URL) | Sub-campo | URL del folleto PDF. |
| media.video | `string` (URL) | Sub-campo | URL del video promocional del desarrollo. |

---

## 2. Colección: `MODELOS` (Modelos de Vivienda)

Representa un tipo específico de unidad dentro de un desarrollo.

| Campo | Tipo de Dato | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **id** | `string` | **Clave principal** | ID único (compuesto por `idDesarrollo-nombreModelo`). |
| **idDesarrollo** | `string` | **Clave foránea** | Referencia al `id` del desarrollo padre. |
| **activo** | `boolean` | Simple | Indica si el modelo está habilitado. Anteriormente `ActivoModelo`. |
| **nombreModelo** | `string` | Simple | Nombre comercial del modelo (ej. "Águila"). |
| **descripcion** | `string` | Simple | Texto promocional o descriptivo del modelo. |
| **highlights** | `array<string>` | Lista | Badges destacados calculados (ej. "Precio más bajo de la Zona"). |
| **tipoVivienda** | `string` | Simple | Categoría (ej. "Casas", "Departamentos"). |
| **m2** | `number` | Simple | Metros cuadrados de construcción. |
| **terreno** | `number` | Simple | Metros cuadrados de terreno. |
| **frente** | `number` | Simple | Medida del frente del terreno (mts). |
| **fondo** | `number` | Simple | Medida del fondo del terreno (mts). |
| **status** | `string`/`array` | Flexible | Estado (ej. "Entrega Inmediata"). Soporta múltiples valores. |
| **promocion** | `map` | Objeto anidado | Promoción vigente (fechas en Timezone local). |
| promocion.nombre | `string` | Sub-campo | Nombre/Detalle de la promoción. |
| promocion.fecha_inicio | `timestamp` | Sub-campo | Inicio de vigencia. |
| promocion.fecha_fin | `timestamp` | Sub-campo | Fin de vigencia. |
| **recamaras** | `number` | Simple | Cantidad de recámaras. |
| **banos** | `number` | Simple | Cantidad de baños completos. |
| **niveles** | `number` | Simple | Número de pisos de la vivienda. |
| **cajones** | `number` | Simple | Cajones de estacionamiento. |
| **amenidades** | `array<string>` | Lista | Amenidades o características del *modelo* (ej. "Cocina Integral"). |
| **updatedAt** | `timestamp` | Simple | Fecha de la última modificación de este registro. |
| **acabados** | `map` | Objeto anidado | Detalle de los acabados. |
| acabados.cocina | `string` | Sub-campo | Descripción de acabados de cocina. |
| acabados.pisos | `string` | Sub-campo | Descripción de acabados de pisos. |
| **precios** | `map` | Objeto anidado | Estructura de precios detallada. |
| precios.base | `number` | Sub-campo | Precio actual base del modelo. |
| precios.inicial | `number` | Sub-campo | Precio de lista original/lanzamiento. |
| precios.metroCuadrado | `number` | Sub-campo | Costo por metro cuadrado (`m2`). |
| precios.mantenimientoMensual | `number` | Sub-campo | Costo mensual de mantenimiento. |
| precios.moneda | `string` | Sub-campo | Código de la moneda. |
| **infoComercial** | `map` | Objeto anidado | Datos comerciales del modelo. |
| infoComercial.fechaInicioVenta | `timestamp` | Sub-campo | Fecha cuando inició la venta del modelo. |
| infoComercial.plusvaliaEstimada | `number` | Sub-campo | Plusvalía estimada del modelo. |
| infoComercial.unidadesVendidas | `number` | Sub-campo | Unidades vendidas de este modelo. |
| infoComercial.tiempoEntrega | `string` | Simple | Tiempo de entrega estimado (ej. "6 meses" o "Mayo 2026"). |
| **analisisIA** | `map` | Objeto anidado | Análisis generado por IA sobre el modelo. |
| analisisIA.resumen | `string` | Sub-campo | Resumen ejecutivo del análisis. |
| **media** | `map` | Objeto anidado | Archivos multimedia del modelo. |
| media.plantasArquitectonicas | `array<string>` (URLs) | Sub-campo | URLs de los planos arquitectónicos. |
| media.gallery | `array<string>` (URLs) | Sub-campo | Galería de imágenes del modelo (renders, fotos). |
| media.recorridoVirtual | `string` (URL) | Sub-campo | URL del recorrido virtual. |
| media.video | `string` (URL) | Sub-campo | URL del video promocional del modelo. |

---

## 3. Colección: `USERS` (Usuarios: Clientes y Asesores)

Almacena la información de los usuarios de la plataforma.

| Campo | Tipo de Dato | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **uid** | `string` | **Clave principal** | ID único de autenticación del usuario. |
| **email** | `string` | Simple | Correo electrónico. |
| **nombre** | `string` | Simple | Nombre completo. |
| **role** | `string` | Simple | Rol del usuario ("cliente", "asesor"). |
| **foto** | `string` (URL) | Simple | URL de la foto de perfil. |
| **fechaRegistro** | `string` (ISO 8601) | Simple | Fecha y hora de registro. |
| **ultimoAcceso** | `string` (ISO 8601) | Simple | Fecha y hora del último acceso. |
| **onboardingCompleto** | `boolean` | Simple | Indica si el proceso de bienvenida está finalizado. |
| **scoreGlobal** | `number` | Simple | Puntuación total del Score Card del asesor. |
| **metricas** | `map` | Objeto anidado | Métricas detalladas del desempeño y Score Card. |
| metricas.tasaCierre | `number` | Sub-campo | Porcentaje de leads ganados vs finalizados. |
| metricas.puntosCierre | `number` | Sub-campo | Puntos otorgados por la tasa de cierre (1.5 pts por %). |
| metricas.puntosEncuestas | `number` | Sub-campo | (Manual) Puntos por calificación promedio de encuestas. |
| metricas.puntosActualizacion | `number` | Sub-campo | (Manual) Puntos por mantener info actualizada. |
| metricas.puntosComunicacion | `number` | Sub-campo | (Manual) Puntos por nivel de comunicación. |
| **favoritos** | `array<string>` | Lista | Lista de IDs de modelos o desarrollos favoritos. |
| **perfilFinanciero** | `map` | Objeto anidado | Datos del perfil de compra del cliente. |
| perfilFinanciero.capitalInicial | `number` | Sub-campo | Monto de ahorro o enganche disponible. |
| perfilFinanciero.mensualidadMaxima | `number` | Sub-campo | Máximo a pagar mensualmente. |
| perfilFinanciero.presupuestoCalculado | `number` | Sub-campo | Presupuesto total estimado. |
| perfilFinanciero.recamarasDeseadas | `number` | Sub-campo | Cantidad de recámaras buscadas. |

---

## 4. Colección: `LEADS` (Clientes Potenciales y Citas)

Registra cada solicitud de contacto o cita, conectando al cliente con el asesor y el desarrollo.

| Campo | Tipo de Dato | Estructura | Descripción |
| :--- | :--- | :--- | :--- |
| **desarrolloId** | `string` | **Clave foránea** | Referencia al `id` del desarrollo de interés. |
| **asesorUid** | `string` | **Clave foránea** | Referencia al `uid` del asesor asignado. |
| **asesorNombre** | `string` | Simple | Nombre del asesor asignado. |
| **nombreDesarrollo** | `string` | Simple | Nombre del desarrollo (para referencia rápida). |
| **modeloInteres** | `string` | Simple | Nombre del modelo de vivienda específico. |
| **status** | `string` | Simple | Estado actual del lead (ej. "VISITED", "NEW"). |
| **origen** | `string` | Simple | Fuente de donde se generó el lead. |
| **motivoAsignacion** | `string` | Simple | Razón de la asignación del asesor. |
| **fechaCreacion** | `timestamp` | Simple | Fecha de creación del lead. |
| **fechaAsignacion** | `timestamp` | Simple | Fecha de asignación del asesor. |
| **fechaUltimaInteraccion** | `timestamp` | Simple | Fecha de la última actividad registrada. |
| **clienteDatos** | `map` | Objeto anidado | Información de contacto del cliente. |
| clienteDatos.nombre | `string` | Sub-campo | Nombre del cliente. |
| clienteDatos.email | `string` | Sub-campo | Correo electrónico del cliente. |
| clienteDatos.telefono | `string` | Sub-campo | Número de teléfono del cliente. |
| **historial** | `array<map>` | Lista de objetos | Registro de eventos y cambios de estado. |
| historial[].fecha | `timestamp` | Sub-campo | Fecha y hora del evento. |
| historial[].accion | `string` | Sub-campo | Tipo de acción registrada (ej. "asignacion_automatica"). |
| historial[].detalle | `string` | Sub-campo | Descripción del evento. |

---

## 🔗 RELACIONES CLAVE

| Colecciones | Relación | Campo Clave Foránea | Descripción |
| :--- | :--- | :--- | :--- |
| `MODELOS` $\rightarrow$ `DESARROLLOS` | 1:N | `idDesarrollo` | Cada modelo pertenece a un desarrollo. |
| `LEADS` $\rightarrow$ `DESARROLLOS` | N:1 | `desarrolloId` | Múltiples leads pueden estar interesados en el mismo desarrollo. |
| `LEADS` $\rightarrow$ `USERS` | N:1 | `asesorUid` | Múltiples leads pueden ser asignados al mismo asesor. |