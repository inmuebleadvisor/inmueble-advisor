# 🧭 Memoria de Trabajo del Proyecto: inmueble-advisor

## 1. Contexto y Estado Actual
*   **Última Actualización:** 2026-02-12
*   **Estado del Sistema:** 🟢 Operativo / En Desarrollo Activo
*   **Seguridad:** 🛡️ **Supervisor Mode Activo** (Write-Lock Protocol)
*   **Arquitectura:** Híbrida (Frontend React + Backend Serverless Hexagonal)

### 🗺️ Mapa del Territorio (Estructura Real)
*   **Frontend (`/src`)**:
    *   **Core Tech**: Vite, React 19, **Vanilla CSS (Metodología BEM)**, Leaflet.
    *   **Patrones**: Inyección de Dependencias (`service.provider.js`), Servicios (`/services`), Repositorios (`/repositories`), Contextos (`/context`).
*   **Backend (`/functions`)**:
    *   Core Tech: Firebase Cloud Functions (Node.js 22, TypeScript).
    *   Arquitectura: **Hexagonal**.
        *   `/core`: Lógica de negocio pura (Use Cases, Entities).
        *   `/interface`: Triggers y APIs (Callable/HTTP).
        *   `/infrastructure`: Adaptadores (Firestore, MetaAds, Telegram, External Services).
*   **Data & Analytics**:
    *   **BigQuery**: Data Warehouse corporativo (conectado vía MCP / Extensions).
    *   **Looker Studio**: BI & Dashboards corporativos.
    *   **PostHog**: Analítica de producto.
    *   **Firestore**: Persistencia persistente y tiempo real.
*   **Infraestructura MCP (Global)**:
    *   **Servidores Activos**: `bigquery`, `google-developer-knowledge`.

## 2. Objetivos de la Sesión
*   [x] **Auditoría de Integridad**: Validar `plan.md` vs Realidad (Cerrado en `PLAN_AUDIT_REPORT.md`).
*   [x] **Sincronización Técnica**: Corregir discrepancias de stack (BEM/DI).
*   [x] **Gobernanza de Datos**: Implementar "Supervisor Mode" y reglas de escritura segura (`db-write-protection.md`).
*   [ ] **Planificación**: Definir próximos pasos de desarrollo (TBD).

## 3. Plan de Implementación (Log)
| ID | Tarea | Estado | Archivos Afectados |
|----|-------|--------|--------------------|
| 01 | Auditoría de plan.md | ✅ DONE | `PLAN_AUDIT_REPORT.md` |
| 02 | Sincronización de Arquitectura | ✅ DONE | `plan.md` |
| 03 | Limpieza de Stack (Recharts Out) | ✅ DONE | `package.json`, `plan.md` |
| 04 | Implementación Supervisor Mode | ✅ DONE | `.agent/rules/`, `GEMINI.md` |

## 4. Reglas de Arquitectura Activas
> Fuente: `Documentos/MANUALDEARQUITECTURA.md` + `user_rules`

1.  **Modularidad Serverless**: Unidad fundamental = Función (FaaS).
2.  **Inyección de Dependencias**: Obligatoria para desacoplar lógica de negocio. Prohibido el uso de clases estáticas para servicios.
3.  **UI Standards**: Metodología **BEM** para CSS, HTML5 Semántico, Estética Premium (Gold/Slate).
4.  **Estructura Adaptativa**:
    *   Backend: `core` (Logic) -> `interface` (Entry) -> `infrastructure` (Exit).
    *   Frontend: `services` (Orquestación) -> `repositories` (Persistencia) -> `components` (UI).
5.  **Calidad**: Tests unitarios obligatorios para cada archivo/método (prefijo `test_`).
6.  **IaC Declarativa**: `firebase.json` es la fuente de verdad.
7.  **Integridad de Datos**: Protocolo de "Write-Lock" para modificaciones de BD (requiere `DATA_OPERATION_PLAN.md`).
