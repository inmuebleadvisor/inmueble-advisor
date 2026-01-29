# Informe de Auditoría del Módulo Administrador

## 1. Resumen Ejecutivo
El módulo de Administrador es funcional y cumple en gran medida con los estándares de **Clean Architecture** definidos en el manual del proyecto. Se utiliza correctamente la inyección de dependencias (DI) y capas de servicio. Sin embargo, se detectaron funciones incompletas, lógica de UI acoplada que debería abstraerse y una inconsistencia menor en el flujo de promoción de asesores.

## 2. Hallazgos Detallados

### A. Código Incompleto (Funciones Pendientes)
*   **AdminHome.jsx**: La métrica "Promedio Tiempo/Sitio" está fija como `-- min` con la etiqueta "Próximamente".
    *   *Impacto*: Bajo. Es un marcador de posición visual.
    *   *Acción*: Implementar el seguimiento de tiempo en sitio o remover la tarjeta.
*   **AdminDataExport.jsx**: Existe un comentario sobre un vacío en el mapeo del campo `frente`.
    *   *Nota Didáctica*: Los vacíos de datos en las exportaciones suelen deberse a que el modelo de datos (Entity) evoluciona más rápido que las herramientas de auditoría o exportación. Es vital mantener sincronizados ambos.

### B. Acoplamiento Lógico (Violación de Arquitectura)
*   **Mapeo de CSV en el Frontend**: `AdminDataExport.jsx` contiene la lógica detallada de cómo transformar un documento de Firestore a una fila de CSV.
    *   *Violación*: El componente visual no debería saber cómo formatear datos para reportes. Debería delegar esto a un servicio o un "Mapper".
    *   *Nota Didáctica*: Al sacar esta lógica de la UI, permitimos que si el formato del CSV cambia, solo debamos editar un archivo de servicio, no el componente visual.
*   **Estilos en Línea**: `AdminLeads.jsx` tiene colores de estado (Badges) definidos directamente en el código JavaScript (hexadecimales).
    *   *Violación*: No cumple con la metodología **BEM** y dificulta el mantenimiento del "Branding Premium".
    *   *Recomendación*: Mover estos estilos a clases CSS (`.admin-badge--pending`, `.admin-badge--reported`).

### C. Desajustes en Procesos
*   **Promoción de Asesores**:
    *   **Backend**: La función `promoteToAdvisor` es de "autoservicio" (el usuario se promueve a sí mismo).
    *   **Frontend**: El Admin registra asesores manualmente desde la gestión de Leads.
    *   *Brecha*: No existe una forma clara para que un Admin "ascienda" a un usuario existente a rol de asesor desde la interfaz de administración de usuarios.

## 3. Revisión de Cumplimiento Arquitectónico

| Estándar | Estado | Notas |
| :--- | :--- | :--- |
| **Arquitectura Limpia** | ✅ CUMPLE | El backend usa UseCases y Repositorios correctamente. |
| **Inyección de Dependencias** | ✅ CUMPLE | El frontend consume servicios a través del hook `useService()`. |
| **Servicios Stateless** | ✅ CUMPLE | Las funciones del servidor no guardan estado local entre ejecuciones. |
| **Metodología BEM** | ⚠️ PARCIAL | Se detectaron estilos "hardcoded" en algunos componentes de administración. |

## 4. Recomendaciones Finales
1.  **Abstraer Mapeos**: Mover la lógica de exportación de CSV fuera del componente visual hacia un servicio especializado.
2.  **Estandarizar UI**: Eliminar estilos en línea en `AdminLeads` y usar clases CSS basadas en BEM para los indicadores de estado.
3.  **Completar Métricas**: Implementar el cálculo de "Tiempo en Sitio" mediante eventos de sesión o remover el indicador para evitar confusión.
4.  **Flujo Único de Asesores**: Centralizar la creación y promoción de asesores en un solo servicio para evitar duplicidad de lógica.

> 💡 **Nota Didáctica Final**: Una auditoría no solo busca errores, sino oportunidades para mejorar la **Mantenibilidad**. Un código que hoy funciona pero está acoplado, mañana será una barrera para agregar nuevas funcionalidades rápidamente.
