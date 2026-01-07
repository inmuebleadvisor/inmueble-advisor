# Inmueble Advisor Data Manager

Tool de línea de comandos (CLI) para la gestión, importación y exportación de datos en Firestore para el proyecto Inmueble Advisor.

## 📋 Descripción

Este módulo permite administrar los datos de la aplicación mediante scripts automatizados, facilitando tareas como:
*   Verificación de conexión con Firebase.
*   Exportación de colecciones a formatos JSON o CSV.
*   Importación masiva de datos desde archivos locales.

## 🚀 Requisitos Previos

*   **Node.js**: v16 o superior.
*   **Credenciales de Firebase**: Archivo `service-account.json` en la raíz de `data-manager`.

## 📦 Instalación

1.  Navega al directorio `data-manager`:
    ```bash
    cd data-manager
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```

## 🛠️ Uso

El punto de entrada es `index.js`. Puedes ejecutarlo directamente con `node` o configurar un alias.

### 1. Probar Conexión (`test-connection`)

Verifica que las credenciales sean correctas y lista las colecciones disponibles en Firestore.

```bash
node index.js test-connection
```

### 2. Exportar Datos (`export`)

Exporta una colección completa a un archivo local.

```bash
node index.js export [collection] [options]
```

**Argumentos:**
*   `collection`: Nombre de la colección en Firestore (ej. `users`, `properties`).

**Opciones:**
*   `--format`, `-f`: Formato de salida. Valores: `json` (default), `csv`.

**Ejemplo:**
```bash
node index.js export properties -f csv
```

### 3. Importar Datos (`import`)

Importa datos desde un archivo local hacia una colección de Firestore.

```bash
node index.js import [collection] [file] [options]
```

**Argumentos:**
*   `collection`: Nombre de la colección de destino.
*   `file`: Ruta al archivo de origen (JSON o CSV).

**Opciones:**
*   `--region`, `-r`: (Opcional) Limita la búsqueda de duplicados a una región específica para optimizar memoria.

**Ejemplo:**
```bash
node index.js import properties ./datos_nuevos.json
```

## 📂 Estructura del Proyecto

*   **`index.js`**: Punto de entrada de la CLI. Define los comandos usando `yargs`.
*   **`lib/`**: Lógica principal.
    *   **`services/`**: Lógica de importación (`import.service.js`) y exportación (`export.service.js`).
    *   **`utils.js`**: Utilidades compartidas como inicialización de Firebase.
*   **`scripts/`**: Scripts auxiliares.
*   **`output/`**: Directorio por defecto para archivos exportados.

## ⚠️ Notas Importantes

*   Asegúrate de que el archivo `service-account.json` esté presente y sea válido antes de ejecutar cualquier comando.
*   Las operaciones de importación masiva pueden consumir cuota de lectura/escritura de Firestore.

## 📊 Analytics Features

### Historial de Precios (Price History)
Durante la importación de `modelos`, el sistema detecta cambios en el precio base.
*   **Acción:** Si el precio cambia, se crea un documento en la subcolección `modelos/{id}/price_history`.
*   **Propósito:** Permitir la exportación granular a BigQuery para análisis de tendencias.
*   **Schema:** `{ date: Timestamp, price: Number (old), newPrice: Number, available: Boolean }`.
