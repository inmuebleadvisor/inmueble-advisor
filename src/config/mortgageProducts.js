export const MORTGAGE_PRODUCTS = {
    HIPOTECA_FUERTE_BANORTE: {
        id: 'hipoteca-fuerte-banorte',
        banco: 'Banorte',
        nombre: 'Hipoteca Fuerte',
        tasaInteresAnual: 0.1065, // 10.65% anual
        aforoMaximo: 0.90, // Hasta 90% de aforo
        plazosAceptados: [5, 10, 15, 20], // En años
        factorMensualidadXMillar: 10.30, // Aproximado para cálculo rápido. Varía por plazo/edad.
        comisionApertura: 0.01 // 1%
    }
    // BBVA: {},
    // SANTANDER: {}
};
