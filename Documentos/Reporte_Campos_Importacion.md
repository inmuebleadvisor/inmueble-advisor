# Reporte de Campos: Data Manager

Este reporte detalla los campos que se importan directamente desde archivos CSV y aquellos que son calculados o derivados por el sistema `data-manager`.

## 1. Colección: `desarrolladores` (Constructoras)

### Campos Importados (CSV)
Estos campos se mapean directamente desde el CSV a través de `adaptDesarrollador`.
- **`nombre`**: Nombre comercial de la desarrolladora.
- **`status`**: Estado ('activo', 'inactivo', etc.). Se normaliza a minúsculas.
- **`fiscal.razonSocial`**: Razón social para temas legales.
- **`comisiones.porcentajeBase`**: Porcentaje base de comisión.
- **`comisiones.hitos`**: Arrays de porcentajes para hitos de pago (`credito`, `contado`, `directo`).
- **`contacto.principal`**: Objeto con `nombre`, `telefono`, `email` y `puesto`.
- **`contacto.secundario`**: Objeto con `nombre`, `telefono`, `email` y `puesto`.

### Campos Calculados / Derivados
- **`id`**: Se genera un slug determinista basado en el nombre si no se proporciona explícitamente.
- **`updatedAt`**: Marca de tiempo de la última actualización (Firestore Timestamp).
- **`desarrollos`**: Array de IDs de los desarrollos que pertenecen a esta constructora (Calculado post-importación).
- **`ciudades`**: Lista única de ciudades donde la constructora tiene presencia (Calculado post-importación).
- **`stats.ofertaTotal`**: Suma de las unidades totales de todos sus desarrollos (Calculado post-importación).
- **`stats.viviendasxVender`**: Suma de las unidades disponibles/inventario de todos sus desarrollos (Calculado post-importación).

---

## 2. Colección: `desarrollos`

### Campos Importados (CSV)
- **`nombre`**: Nombre del desarrollo.
- **`constructora`**: Nombre de la empresa constructora/desarrolladora.
- **`descripcion`**: Breve reseña del proyecto.
- **`activo`**: Booleano que indica disponibilidad.
- **`ubicacion`**: Campos detallados como `calle`, `colonia`, `localidad`, `cp`, `ciudad`, `estado`, `zona`, `latitud` y `longitud`.
- **`caracteristicas`**: Listas de `amenidades` y `entorno` (separadas por pipes `|`).
- **`financiamiento`**: `aceptaCreditos` (pipes), `apartadoMinimo` y `engancheMinimoPorcentaje`.
- **`media`**: URLs de `cover`, `gallery` (pipes), `brochure` y `video`.
- **`comisiones.overridePct`**: Comisión específica que sobreescribe la base de la desarrolladora.
- **`infoComercial.unidadesTotales`**: Inventario total histórico.
- **`infoComercial.unidadesVendidas`**: Unidades ya colocadas.
- **`infoComercial.unidadesDisponibles`**: Unidades en inventario actual.
- **`infoComercial.cantidadModelos`**: Número de prototipos diferentes.
- **`precios.moneda`**: Divisa (MXN, USD).
- **`legal.regimenPropiedad`**: Régimen legal (Condominio, etc.).
- **`analisisIA`**: `resumen`, `puntosFuertes` y `puntosDebiles` generados o procesados previamente.
- **`promocion`**: `nombre`, `fecha_inicio` y `fecha_fin` (Mapeados y normalizados por zona horaria).

### Campos Calculados / Derivados
- **`id`**: Slug generado a partir de `constructora` + `nombre`.
- **`geografiaId`**: ID estandarizado (ej: `mx-qro-queretaro`) basado en un diccionario geográfico interno.
- **`updatedAt`**: Firestore Timestamp actual.
- **`precios.desde`**: Se actualiza automáticamente buscando el precio más bajo de sus `modelos` activos.
- **`infoComercial.cantidadModelos`**: Recalculado contando modelos activos en la base de datos.
- **`infoComercial.unidadesVendidas`**: Suma recalculada de las ventas reportadas en cada modelo.
- **`infoComercial.unidadesDisponibles`**: Diferencia entre unidades totales y ventas recalculadas.
- **`stats.rangoPrecios`**: Array `[min, max]` de los precios actuales de sus modelos.

---

## 3. Colección: `modelos` (Prototipos)

### Campos Importados (CSV)
- **`idDesarrollo`**: Vinculación al desarrollo padre.
- **`nombreModelo`**: Identificador del prototipo.
- **`descripcion`**: Texto descriptivo.
- **`activo`**: Estado de disponibilidad.
- **`tipoVivienda`**: Categoría (Casa, Departamento, etc.).
- **`status`**: Estado de obra o comercial (Venta, Preventa, etc.).
- **`precios.base`**: Precio de lista actual.
- **`precios.inicial`**: Precio de lanzamiento (para cálculo de plusvalía).
- **`precios.metroCuadrado`**: Precio por m².
- **`precios.mantenimientoMensual`**: Cuota de mantenimiento.
- **`precios.moneda`**: Divisa.
- **`infoComercial`**: `unidadesVendidas`, `fechaInicioVenta`, `tiempoEntrega`.
- **`specs`**: `recamaras`, `banos`, `niveles`, `cajones`, `frente`, `fondo`, `m2` (construcción), `terreno`.
- **`amenidades`**: Lista específica del modelo (pipes).
- **`acabados`**: `cocina` y `pisos`.
- **`media`**: URLs de `cover`, `gallery`, `plantasArquitectonicas`, `recorridoVirtual` y `videoPromocional`.
- **`analisisIA`**: `resumen`, `puntosFuertes` y `puntosDebiles`.
- **`promocion`**: Datos de promoción vigentes.

### Campos Calculados / Derivados
- **`id`**: Slug generado a partir de `idDesarrollo` + `nombreModelo`.
- **`updatedAt`**: Firestore Timestamp actual.
- **`precios.metroCuadrado`**: Calculado dinámicamente como `base / m2` si no viene en el CSV.
- **`infoComercial.plusvaliaEstimada`**: Cálculo anualizado: `((PrecioActual - PrecioInicial) / PrecioInicial) / MesesTranscurridos * 12`.
- **`preciosHistoricos`**: Array que registra cambios de precio detectados durante la importación (compara el CSV con lo que ya existe en DB).
- **`plusvaliaReal`**: Porcentaje de crecimiento total desde el primer precio registrado hasta el actual.
- **`highlights`**: Etiquetas comparativas calculadas post-importación (ej: "Modelo con el precio más bajo de Querétaro" o "Modelo con más terreno de la zona Juriquilla").
