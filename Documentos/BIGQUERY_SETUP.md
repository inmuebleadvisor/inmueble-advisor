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
