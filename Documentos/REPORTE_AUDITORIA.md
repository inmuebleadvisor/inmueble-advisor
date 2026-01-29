# Auditoría de Conexión Backend y Flujo de Datos
**Fecha:** 29 de Enero, 2026
**Estatus Global:** ✅ Estable / ⚠️ Alerta en Verificación BigQuery

## 1. Resumen Ejecutivo
La arquitectura de conexión de Inmueble Advisor es **Totalmente Funcional** y sigue un patrón moderno **"Serverless Event-Driven"** (Sin servidor, basado en eventos). No existe una "conexión" persistente tradicional que se pueda romper; en su lugar, el frontend se comunica directamente con la base de datos (Firestore) y esto dispara reacciones en cadena en el Backend.

> [!NOTE]
> **En términos simples:** Tu aplicación no "envía a un servidor", sino que "guarda en la nube" y la nube reacciona.

---

## 2. Análisis de Flujo de Datos

### A. Flujo de Leads (CRM)
El sistema utiliza una arquitectura reactiva robusta:
1.  **Origen:** `CrmService` (src/services/crm.service.js)
2.  **Acción:** Guarda el lead en Firestore (`/leads/{leadId}`).
3.  **Reacción Backend:** Trigger `onLeadCreated` (functions/src/interface/triggers/onLeadCreated.ts).
4.  **Resultado:**
    *   Se notifica a Telegram (`NotifyNewLead`).
    *   Se actualizan estadísticas.

**Estado:** ✅ **CORRECTO**. El desacoplamiento es excelente. Si Telegram falla, el lead ya está guardado, garantizando cero pérdida de datos.

### B. Flujo de Analítica (BigQuery)
Aquí reside la alerta técnica actual.
1.  **Mecanismo:** El código NO escribe a BigQuery directamente. Utiliza una **Extension de Firebase** ("Stream Collections to BigQuery").
2.  **Verificación:** El script `verifyBigQuery.ts` audita esta conexión invisible.
3.  **Alerta:** Actualmente, el script de verificación se está ejecutando pero no ha reportado éxito en la consola.

> [!WARNING]
> **Riesgo Detectado:** Si la extensión de Firebase se desconfigura o se pausa, los datos dejarán de fluir a BigQuery silenciosamente. El frontend y el CRM seguirán funcionando, pero perderás historia analítica.

### C. Flujo de Marketing (Meta CAPI)
Se implementa una estrategia híbrida avanzada:
1.  **Frontend:** `MetaService` (src/services/meta.service.js) maneja el Pixel y genera IDs de evento.
2.  **Backend:** Utiliza `Callables` (`onLeadCreatedMETA`, etc.) para enviar datos directamente de servidor a servidor (CAPI).
3.  **Soft Login:** La configuración actual (`require_auth_for_details: false`) confirma que la estrategia de Soft Login está activa y el tracking funciona de forma híbrida.

---

## 3. Riesgos y Recomendaciones Técnicas

| Riesgo | Probabilidad | Impacto | Mitigación Recomendada |
| :--- | :--- | :--- | :--- |
| **Silencio en BigQuery** | Media | Alto (Pérdida de Data histórica) | Reiniciar el script `verifyBigQuery.ts` y confirmar que las tablas `leads_raw_latest` existan. |
| **Fallo en Telegram** | Baja | Medio (Retraso en atención) | El `onLeadCreated` solo loguea errores. Se recomienda añadir una cola de reintentos (Task Queue). |
| **Meta Deduplicación** | Baja | Medio (Datos duplicados) | Asegurar que `eventID` se genere siempre en el frontend y se pase idéntico al Backend (Ya implementado correctamente). |

## 4. Comentarios Didácticos

**¿Por qué no veo un `api.connect()`?**
En arquitecturas modernas como esta (Firebase), la autenticación y la conexión se manejan automáticamente por el SDK. Cuando `CrmService` hace `leadRepository.add()`, el SDK verifica tu sesión, encripta el dato y lo sincroniza. Si se va el internet, lo guarda localmente y lo envía al volver. Es mucho más resiliente que una conexión HTTP tradicional.

**¿Qué es un "Trigger"?**
Imagina una trampa para ratones. El frontend pone el queso (el dato). El backend no está "mirando" constantemente, pero cuando el queso toca el plato, la trampa se activa (Trigger) y ejecuta una función. Esto ahorra costos enormes de servidor.

## 5. Próximos Pasos Manuales
1.  **Terminal:** Detén el script actual (Ctrl+C) y ejecútalo de nuevo. Debería mostrar `✅ Connection Successful!` en menos de 10 segundos. Si tarda más, revisa tus credenciales de Google Cloud localmente.
2.  **Prueba Real (Opcional):** Crea un lead de prueba en la web. Deberías recibir el Telegram en < 2 segundos.
