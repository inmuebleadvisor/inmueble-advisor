# Guía de Importación y Exportación (Inmueble Advisor)

Esta herramienta es un programa independiente (CLI) que te permite subir y bajar información de la base de datos de manera segura y controlada.

---

## �️ Paso 1: Abrir la Terminal y Preparar

Para usar esta herramienta, necesitas estar ubicado exactamente en la carpeta `data-manager`.

### Opción A: Desde Visual Studio Code
1.  Abre la terminal integrada: Menú **Terminal** > **New Terminal**.
2.  Escribe el siguiente comando para entrar a la carpeta:
    ```bash
    cd data-manager
    ```
    *(Verás que la ruta en la terminal termina en `.../inmueble-advisor/data-manager`)*.

### Opción B: Instalación (Solo la primera vez) (Ya se instaló)
Si es la primera vez que usas esto en esta computadora, ejecuta:
```bash
npm install
```
Esto descarga las herramientas necesarias.

---

## 🕹️ Paso 2: Operar la Herramienta (Comandos)

Todos los comandos empiezan con `node index.js`. Aquí tienes los más importantes:

### � IMPORTAR (Subir datos)
Para subir un archivo CSV a la base de datos.

**Subir Desarrollos:**
```bash
node index.js import desarrollos "ruta/a/tu/archivo.csv"
```
*Ejemplo:* `node index.js import desarrollos "C:/Documentos/desarrollos_final.csv"`

**Subir Modelos:**
```bash
node index.js import modelos "ruta/a/tu/archivo.csv"
```

**Subir Desarrolladores:**
```bash
node index.js import desarrolladores "ruta/a/tu/archivo.csv"
```

### 📤 EXPORTAR (Bajar datos)
Para descargar lo que hay en la nube a tu computadora. Los archivos se guardan en la carpeta `data-manager/output`.

**Bajar TODO a un JSON (Respaldo):**
```bash
node index.js export desarrollos
node index.js export modelos
```

**Bajar a Excel/CSV:**
```bash
node index.js export desarrollos --format=csv
```

### ✅ Verificar Conexión
Si tienes dudas de si tienes internet o acceso:
```bash
node index.js test-connection
```

---

## 🧠 Paso 3: Entender las Reglas (Automáticas)

El sistema es inteligente. Aquí explicamos qué hace automáticamente para que tú solo te preocupes por el Excel.

### Reglas para DESARROLLOS
1.  **Si subes un archivo con ID (columna `id`)**: El sistema respeta ese número (ej. `2846`). Úsalo para actualizar datos.
2.  **Si NO pones ID**:
    *   Primero busca si ya existe un desarrollo con ese **Nombre**. Si lo encuentra, actualiza ese mismo.
    *   Si es totalmente nuevo, busca el **número más alto** de la base de datos (ej. `2846`) y le asigna el siguiente (`2847`).

### Reglas para MODELOS
1.  **Si NO pones ID**: El sistema lo crea automáticamente usando:
    *   `id_desarrollo` (ej. `2846`) + `nombre_modelo` (ej. `Modelo A`) = ID `2846-modelo-a`.
    *   ⚠️ **OJO**: Es obligatorio que tu Excel de modelos tenga la columna `id_desarrollo` y `nombre_modelo`.

### Flujo de "Dos Archivos"
Si quieres subir primero la info y luego las fotos:
1.  Sube el **Archivo 1** (Info General). El sistema creará/actualizará los registros.
2.  Sube el **Archivo 2** (Links de Fotos). El sistema detectará los mismos desarrollos/modelos (por su ID o por su Nombre) y **SOLO** actualizará las fotos, sin borrar la info que subiste en el paso 1.

---

## � Paso 4: Cerrar / Salir

Cuando termines:
1.  Simplemente cierra la terminal (el ícono de bote de basura en VS Code o la X en la ventana).
2.  O escribe:
    ```bash
    cd ..
    ```
    Para regresar a la carpeta principal del proyecto.

> **NOTA DE SEGURIDAD**: Si alguna vez el programa se queda "trabado" o cargando por mucho tiempo, puedes forzar el cierre presionando las teclas `Ctrl + C` en tu teclado.

## 📄 Estructura de Columnas (CSV)

### DESARROLLOS
- **Eliminado**: `status` (Ahora vive en los modelos).
- **Nuevo**: `promocion_nombre`, `promocion_inicio` (YYYY-MM-DD), `promocion_fin` (YYYY-MM-DD).
  - *Nota*: Las fechas se interpretan en la zona horaria de la ciudad del desarrollo.

### MODELOS
- **Nuevo**: `status`. Puede ser texto ("Pre-Venta") o lista separada por pipes ("Pre-Venta|Entrega Inmediata").
- **Nuevo**: `promocion_nombre`, `promocion_inicio`, `promocion_fin`.
- **Nuevo**: `tiempo_entrega`. Texto libre (ej. "6 meses", "Diciembre 2025").

### DESARROLLADORES
- Usar notación de punto para objetos anidados en los encabezados del CSV:
  - `EsquemaPago.Apartado`, `EsquemaPago.Enganche`
  - `Contacto.Nombre1`, `Contacto.Mail1`
