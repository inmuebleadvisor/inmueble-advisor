# 🚀 Guía de Configuración: Firestore a BigQuery

Este documento detalla la configuración necesaria para sincronizar el catálogo y el historial de precios con BigQuery. 

> **🚨 IMPORTANTE:** Se requieren **DOS (2)** instancias separadas de la extensión "Stream Firestore to BigQuery". Una para los documentos principales y otra para la subcolección de historial.

---

## 1. Instancia Principal: Catálogo (`modelos`)
Esta instancia sincroniza el estado actual de cada modelo (precio actual, disponibilidad, etc.).

| Parámetro | Valor Configurado | Notas |
| :--- | :--- | :--- |
| **Collection path** | `modelos` | |
| **Dataset ID** | `firestore_export_modelos` | |
| **Table ID** | `table_modelos` | |
| **Enable Wildcard Column** | `false` | No es necesario en la raíz. |
| **Time Partitioning** | `DAY` | *(Recomendado)* Optimiza costos en BQ. |
| **SQL Clustering** | `ubicacion.ciudad` | *(Opcional)* Acelera consultas por ciudad. |

---

## 2. Instancia Secundaria: Historial (`price_history`)
Esta instancia es **CRÍTICA** para el análisis de plusvalía. Captura cada cambio de precio guardado en la subcolección.

| Parámetro | Valor Requerido | Por qué es importante |
| :--- | :--- | :--- |
| **Collection path** | `modelos/{modelId}/bigquery-price-history` | El `{modelId}` indica a la extensión que busque dentro de todos los modelos. |
| **Dataset ID** | `firestore_export_modelos` | Puedes reusar el dataset para tener todo junto. |
| **Table ID** | `table_precios_historicos` | Nombre único para esta tabla. |
| **Enable Wildcard Column** | **`true`** | **OBLIGATORIO.** Crea una columna con el ID del modelo padre (`modelId`) para saber a qué casa corresponde el precio el histórico. |
| **Time Partitioning** | `DAY` | Muy recomendado para series de tiempo. |

---

## 🛠️ Verificación Post-Instalación

Una vez instaladas ambas extensiones, verifica en la consola de BigQuery:

1.  **Tablas:** Deben aparecer `table_modelos_raw_changelog` y `table_precios_historicos_raw_changelog`.
2.  **Datos:**
    *   Ejecuta `SELECT * FROM dist.table_precios_historicos_raw_latest LIMIT 10`
    *   Verifica que la columna `modelId` (o el nombre que usaste en las llaves) tenga datos válidos.

---

## 3. Instancia: Leads (`leads`)
Sincronización de todos los leads para cálculo de comisiones, embudos y métricas de desarrollos.

| Parámetro | Valor Configurado | Notas |
| :--- | :--- | :--- |
| **Collection path** | `leads` | |
| **Dataset ID** | `firestore_export_leads` | |
| **Table ID** | `leads` | |
| **Time Partitioning** | `DAY` | Importante para filtrar por fecha de creación/actualización sin escanear toda la tabla. |

## 4. Instancia: Usuarios (`users`)
Sincronización de usuarios para métricas de "Usuarios Activos", "Nuevos Registros" y actividad de asesores.

| Parámetro | Valor Configurado | Notas |
| :--- | :--- | :--- |
| **Collection path** | `users` | |
| **Dataset ID** | `firestore_export_users` | *Nota:* Se configuró en un dataset independiente. |
| **Table ID** | `users` | |
| **Time Partitioning** | `DAY` | |

## 5. Instancia: Eventos de Analítica (`analytic_events`)
Sincronización de eventos de sesión, visitas a páginas y conversiones para cálculo de "Tiempo en sitio" y "Retención".

| Parámetro | Valor Configurado | Notas |
| :--- | :--- | :--- |
| **Collection path** | `analytic_events` | |
| **Dataset ID** | `firestore_export_analytics` | *Recomendado:* Usar un dataset separado para eventos de alto volumen. |
| **Table ID** | `events` | |
| **Time Partitioning** | `DAY` | **CRÍTICO:** Esta tabla crecerá muy rápido. El particionado es obligatorio. |


