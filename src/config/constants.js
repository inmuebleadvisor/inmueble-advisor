// src/config/constants.js

// --- IMÁGENES Y ASSETS ---
export const IMAGES = {
  FALLBACK_PROPERTY: "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png",
  LOGO_URL: "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png"
};

// --- REGLAS FINANCIERAS ---
export const FINANZAS = {
  PORCENTAJE_GASTOS_NOTARIALES: 0.06, 
  PORCENTAJE_ENGANCHE_MINIMO: 0.10,   
  FACTOR_MENSUALIDAD_POR_MILLON: 11000, 
  PRECIO_MAXIMO_DEFAULT: 100000000
};

// --- OPCIONES DE UI ---
export const UI_OPCIONES = {
  FILTRO_PRECIO_MAX: 10000000,
  FILTRO_PRECIO_STEP: 100000,
  FILTRO_RECAMARAS_MAX: 4
};

// ==========================================
// ✅ CÓDIGOS DE ESTADO (Contrato con la BD) - USAR ESTAS CONSTANTES
// ==========================================
export const STATUS = {
    // Desarrollo
    DEV_IMMEDIATE: 'IMMEDIATE',
    DEV_PREALE: 'PREALE',
    
    // Leads (Embudo)
    LEAD_NEW: 'NEW', // Antes 'nuevo'
    LEAD_CONTACTED: 'CONTACTED', // Antes 'contactado'
    LEAD_VISIT_SCHEDULED: 'VISIT_SCHEDULED', // Antes 'visita_agendada'
    LEAD_VISIT_CONFIRMED: 'VISIT_CONFIRMED', // Antes 'visita_confirmada'
    LEAD_VISITED: 'VISITED', // Antes 'visito'
    LEAD_RESERVED: 'RESERVED', // Antes 'apartado'
    LEAD_WON: 'WON', // Antes 'vendido'
    LEAD_LOST: 'LOST', // Antes 'perdido'
    LEAD_CLOSED: 'CLOSED', // Antes 'escriturado'
    LEAD_PENDING_ADMIN: 'PENDING_ADMIN',
    LEAD_PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT'
};

// --- ETIQUETAS DE UI (Para traducir los códigos) ---
export const STATUS_LABELS = {
    [STATUS.DEV_IMMEDIATE]: 'Entrega Inmediata',
    [STATUS.DEV_PREALE]: 'Pre-Venta',
    [STATUS.LEAD_NEW]: 'Nuevo',
    [STATUS.LEAD_CONTACTED]: 'Contactado',
    [STATUS.LEAD_VISIT_SCHEDULED]: 'Visita Agendada',
    [STATUS.LEAD_VISIT_CONFIRMED]: 'Visita Confirmada',
    [STATUS.LEAD_VISITED]: 'Ya Visitó',
    [STATUS.LEAD_RESERVED]: 'Apartado',
    [STATUS.LEAD_WON]: 'Vendido',
    [STATUS.LEAD_LOST]: 'Perdido',
    [STATUS.LEAD_CLOSED]: 'Escriturado',
    [STATUS.LEAD_PENDING_ADMIN]: 'Pendiente Admin',
    [STATUS.LEAD_PENDING_ASSIGNMENT]: 'Asignando (Bot)'
};