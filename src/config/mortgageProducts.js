export const MORTGAGE_PRODUCTS = {
    HIPOTECA_FUERTE_BANORTE: {
        id: 'hipoteca-fuerte-banorte',
        banco: 'Banorte',
        nombre: 'Hipoteca Fuerte',
        tasaInteresAnual: 0.1015, // 10.15% anual actual
        aforoMaximo: 0.90, // Mínimo 10% enganche
        aforoMinimo: 0.75, // Máximo 25% enganche
        plazosAceptados: [5, 10, 15, 20],
        plazoDefault: 20,
        // Gastos Iniciales
        porcentajeGastosNotariales: 0.051, // 5.10% sobre valor de vivienda
        costoAvaluoBasico: 5800, // Con IVA
        costoAprobacion: 750,
        // Seguros y Comisiones Mensuales
        factorSeguroVida: 0.0006, // Factor mensual
        factorSeguroDanos: 0.000196, // Factor mensual sobre precio de vivienda
        comisionAutorizacionDiferida: 299 // Constante mensual
    }
};
