# Auditoría de Conocimiento Global

**Fecha de Generación:** 09 de Febrero de 2026
**Auditor:** Antigravity Agent (Knowledge Archaeologist)
**Estado:** Consolidad (Single Source of Truth)

Este documento unifica la información técnica, visual y de negocio dispersa en el repositorio `inmueble-advisor`. Actúa como el mapa maestro de la verdad del proyecto.

---

## 🏗️ Cubo 1: Arquitectura y Patrones Técnicos
*Fuentes: `README.md`, `src/README.md`, `Documentos/MANUALDEARQUITECTURA.md`, `src/services/README.md`*

### Paradigma Principal
- **Modelo:** Aplicación Híbrida (SPA + Serverless).
- **Backend:** Google Cloud Functions (TypeScript). Actúa como "Driver Seguro" para reglas críticas.
- **Frontend:** React + Vite. Arquitectura Hexagonal/Clean.
- **Persistencia:** Políglota.
    - **Transaccional:** Firestore.
    - **Analítica:** BigQuery (Exportación diaria).
    - **Sesión:** Redis/Memcached (Mencionado conceptualmente, implementación vía Firebase Auth).

### Estructura de Carpetas (Ley Seca)
| Directorio | Responsabilidad Única (SRP) | Prohibiciones |
| :--- | :--- | :--- |
| `src/services` | Lógica de Negocio y Orquestación. Usa Inyección de Dependencias. | No acceder al DOM. No tener estado de UI (React). |
| `src/repositories` | Transformación de Datos (DTOs) y acceso a API. | No contener reglas de negocio. |
| `src/hooks` | ViewModels. Lógica de estado de la vista. | No llamar a APIs directamente (usar Services). |
| `src/screens` | Vistas completas (Páginas). | No ser importadas por `src/components`. |
| `functions/src/core` | Casos de Uso (Backend puro). | No depender de frameworks web (Express/Hyper). |

### Reglas de Implementación
1.  **Inyección de Dependencias:** Obligatoria en Servicios.
2.  **Strict Imports:** 组件 (`components`) nunca importan Pantallas (`screens`).
3.  **Mirror Strategy:** Reglas críticas (precios, roles) deben existir en Backend (`functions/`), no solo en Frontend.

---

## 🎨 Cubo 2: UI/UX y Sistema de Diseño
*Fuentes: `src/styles/README.md`, `src/styles/STYLES_GUIDE.md`*

### Identidad Visual: "Premium Buyer First"
- **Paleta:** Dark Slate (`#0f172a`) + Gold (`#f59e0b`/`#dcb23a`) + Glassmorphism.
- **Modo:** Dark Mode por defecto. Soporte para Light Mode.

### Reglas de Estilo (Inviolables)
1.  **Metodología:** **BEM** Estricto (`bloque__elemento--modificador`).
2.  **Grid:** Sistema de **8px** (márgenes, paddings, gaps).
3.  **Tipografía:** No usar px para tamaños fijos, usar `rem` o tokens.
4.  **Z-Index:** Escala estricta (Nav: 1000, Modales: 1050, Toggles: 1100).
5.  **Animación:** Easing Premium `cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 💼 Cubo 3: Reglas de Negocio y Datos
*Fuentes: `Documentos/BIGQUERY_SETUP.md`, `src/services/META_TRACKING.md`*

### Analítica y Datos
- **BigQuery:** Fuente de verdad para BI (Looker Studio).
    - **Tablas Críticas:** `modelos` (con particionado diario), `leads`, `users`, `analytic_events`.
    - **Historial de Precios:** Subcolección `price_history` sincronizada para análisis de plusvalía.

### Marketing Intelligence (Meta Ads)
- **Modelo:** Híbrido (Pixel + CAPI).
- **Deduplicación:** Obligatoria mediante `eventID` único generado en cliente.
- **Privacidad:** PII (Email/Phone) debe normalizarse (Hash SHA256) antes de envío CAPI.
- **Eventos Clave:**
    - `PageView` (Navegación general).
    - `Schedule` (Conversión principal - Cita agendada).

---

## 🚩 Análisis de Conflictos y Brechas

### 1. Estado de Documentación
- **Consistencia Alta:** Los manuales de arquitectura y guías de estilo están alineados. `src/README.md` refleja fielmente la estructura hexagonal.
- **Redundancia Controlada:** `src/styles/README.md` referencia correctamente a `STYLES_GUIDE.md`.

### 2. Observaciones del Auditor
- **Testing:** Se menciona "Pruebas Automatizadas como Especificación" en `MANUALDEARQUITECTURA.md`, alineado con la regla global de agéntica.
- **BigQuery:** La configuración de `enable_wildcard_column` en `price_history` es marcada como **OBLIGATORIA**, un detalle técnico crítico que no debe olvidarse en IaC.

## ✅ Conclusión
El proyecto tiene una base documental sólida y coherente. El riesgo de "Conocimiento Tribal" es bajo, ya que las decisiones clave (Arquitectura, Estilos, Datos) están explícitamente documentadas en los archivos analizados.
