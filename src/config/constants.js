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

// --- COLORES DE MARCA (Single Source of Truth) ---
export const BRAND_COLORS = {
  // Vibrant Green (#21C063) - Usado en WhatsApp y destacados positivos
  greenVibrant: {
    hex: '#21C063',
    rgb: [33, 192, 99]
  },
  // Azul Corporativo
  primaryBlue: {
    hex: '#00396a',
    rgb: [0, 57, 106]
  },
  // Dorado Premium
  premiumGold: {
    hex: '#dcb23a',
    rgb: [220, 178, 58]
  }
};

// --- OPCIONES DE UI ---
export const UI_OPCIONES = {
  FILTRO_PRECIO_MAX: 10000000,
  FILTRO_PRECIO_STEP: 100000,
  FILTRO_RECAMARAS_MAX: 4,
  // 🔒 SEGURIDAD: Define si las pantallas de detalle requieren login
  // Se cambia a false para permitir una navegación fluida (Soft Login)
  REQUIRE_AUTH_FOR_DETAILS: false
};

// --- META ADS CONFIGURATION ---
export const META_CONFIG = {
  PIXEL_ID: '25721482294159393', // ✅ Added for centralized config
  TEST_EVENT_CODE: '' // ⚠️ Para pruebas. Borrar en producción.
};

// ==========================================
// ✅ CÓDIGOS DE ESTADO (Contrato con la BD) - USAR ESTAS CONSTANTES
// ==========================================
export const STATUS = {
  // Desarrollo
  DEV_IMMEDIATE: 'IMMEDIATE',
  DEV_PREALE: 'PREALE',
  DEV_PREVENTA_STRING: 'Pre-Venta',
  DEV_INMEDIATA_STRING: 'Entrega Inmediata',

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
  LEAD_PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT',

  // 🟢 MODELO AGENCIA - DEVELOPER 🟢
  LEAD_PENDING_DEVELOPER_CONTACT: 'PENDING_DEVELOPER_CONTACT', // Cliente pide info, InmuebleAdvisor debe reportar al Dev
  LEAD_REPORTED: 'REPORTED', // Ya se mandó el WA al Developer
  LEAD_ASSIGNED_EXTERNAL: 'ASSIGNED_EXTERNAL' // El Developer ya asignó a su vendedor interno
};

// --- ETIQUETAS DE UI (Para traducir los códigos) ---
export const STATUS_LABELS = {
  [STATUS.DEV_IMMEDIATE]: 'Entrega Inmediata',
  [STATUS.DEV_PREALE]: 'Pre-Venta',
  [STATUS.LEAD_NEW]: 'Nuevo Lead',
  [STATUS.LEAD_CONTACTED]: 'Contactado',
  [STATUS.LEAD_VISIT_SCHEDULED]: 'Cita Agendada',
  [STATUS.LEAD_VISIT_CONFIRMED]: 'Cita Confirmada',
  [STATUS.LEAD_VISITED]: 'Visita Realizada',
  [STATUS.LEAD_RESERVED]: 'Apartado',
  [STATUS.LEAD_WON]: 'Vendido',
  [STATUS.LEAD_LOST]: 'Perdido',
  [STATUS.LEAD_CLOSED]: 'Escriturado',
  [STATUS.LEAD_PENDING_ADMIN]: 'Pendiente Revisión',
  [STATUS.LEAD_PENDING_ASSIGNMENT]: 'Procesando Asignación',
  [STATUS.LEAD_PENDING_DEVELOPER_CONTACT]: 'Solicitud de Información',
  [STATUS.LEAD_REPORTED]: 'Información Enviada',
  [STATUS.LEAD_ASSIGNED_EXTERNAL]: 'En Seguimiento'
};