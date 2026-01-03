# 📟 GUÍA DE OPERACIÓN - DATA MANAGER CLI Y ADMIN DASHBOARD

**Versión:** 1.1
**Fuente de Verdad:** 
1. `data-manager/index.js` (Catálogo)
2. `src/screens/admin/AdminLeads.jsx` (CRM/Leads)

---

## 🛠️ PARTE A: GESTIÓN DE CATÁLOGO (CLI)

> ⚠️ **IMPORTANTE:** El CLI SOLO gestiona `Desarrollos`, `Modelos` y `Desarrolladores`. Para Leads, ver **PARTE B**.

Ejecutar desde la carpeta: `/data-manager`

### 1. Comandos Básicos (Ingesta)
```bash
# Importar Desarrollos
node index.js import desarrollos "C:/datos/master.csv"

# Importar Modelos
node index.js import modelos "C:/datos/inventario.csv"

# Exportar Backup
node index.js export desarrollos --format=json
```

---

## 👥 PARTE B: GESTIÓN DE LEADS (ADMIN UI)

La gestión de Leads, Citas y Asignaciones se realiza **exclusivamente** desde la interfaz web administrativa.

**URL:** `/admin/leads`

### 1. Flujo de Atención de Leads
El sistema clasifica los leads en 3 estados principales para su gestión:

#### A. Leads Por Reportar (`PENDING_DEVELOPER_CONTACT`)
Son leads nuevos generados desde la web. Requieren acción manual inmediata.

*   **Acción Requerida:** Notificar al desarrollador.
*   **Procedimiento:**
    1.  Ubicar el lead en la tabla (Color Rojo).
    2.  Clic en botón **"Reportar"**.
    3.  El sistema abrirá **WhatsApp Web** con un mensaje pre-formateado dirigido al contacto del Desarrollador.
    4.  Confirmar la alerta en pantalla ("¿Se envió el reporte?").
    5.  El lead cambia de estado a `REPORTED` (Color Ámbar).

#### B. Leads Reportados (`REPORTED`)
Leads que el desarrollador ya conoce, pero aún no tienen un vendedor específico asignado.

*   **Acción Requerida:** Asignar un Asesor Externo.
*   **Procedimiento:**
    1.  Cuando el desarrollador responda el WhatsApp indicando quién atenderá al cliente.
    2.  Clic en botón **"Asignar"**.
    3.  **Opción 1 (Existente):** Seleccionar un asesor de la lista (filtrada por desarrollador).
    4.  **Opción 2 (Nuevo):** Clic en "Registrar Nuevo Asesor".
        *   Ingresar Nombre, WhatsApp (solo números) y Email.
    5.  Al guardar, el lead cambia a `ASSIGNED_EXTERNAL` (Color Azul).

#### C. En Seguimiento (`ASSIGNED_EXTERNAL`)
Leads que ya están en manos de un vendedor.
*   **Acciones:**
    *   **Reasignar:** Si el vendedor no responde, se puede cambiar el asesor usando el mismo botón.

---

## 📋 Diccionario de Columnas CSV (Catálogo - CLI)

### DESARROLLOS (`desarrollos`)
| Columna CSV | Campo DB |
| :--- | :--- |
| `nombre` | `nombre` |
| `constructora` | `constructora` |
| `ciudad` | `ubicacion.ciudad` |
| `latitud`/`longitud` | `ubicacion.latitud`/`longitud` |

### MODELOS (`modelos`)
| Columna CSV | Campo DB |
| :--- | :--- |
| `id_desarrollo` | `idDesarrollo` |
| `nombre` | `nombreModelo` |
| `precio` | `precios.base` |
| `m2` | `m2` |
