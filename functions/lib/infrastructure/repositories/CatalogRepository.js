"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogRepository = void 0;
const admin = __importStar(require("firebase-admin"));
class CatalogRepository {
    constructor() {
        this.db = admin.firestore();
    }
    async getDevSnippet(id) {
        const snap = await this.db.collection('devs').doc(id).get();
        if (!snap.exists)
            return null;
        const data = snap.data();
        const title = (data === null || data === void 0 ? void 0 : data.nombre) ? `Desarrollo ${data.nombre}` : 'Desarrollo en Inmueble Advisor';
        const image = (data === null || data === void 0 ? void 0 : data.imagen) || null;
        const description = (data === null || data === void 0 ? void 0 : data.nombre) ? `Descubre ${data.nombre}. Departamentos y casas en venta.` : 'Encuentra tu hogar ideal o excelente oportunidad de inversión.';
        return { title, image, description };
    }
    async getModelSnippet(id) {
        var _a;
        const snap = await this.db.collection('models').doc(id).get();
        if (!snap.exists)
            return null;
        const data = snap.data();
        let parentName = '';
        const parentId = (data === null || data === void 0 ? void 0 : data.idDesarrollo) || (data === null || data === void 0 ? void 0 : data.id_desarrollo);
        if (parentId) {
            const devSnap = await this.db.collection('devs').doc(String(parentId)).get();
            if (devSnap.exists) {
                parentName = ((_a = devSnap.data()) === null || _a === void 0 ? void 0 : _a.nombre) || '';
            }
        }
        const modeloName = (data === null || data === void 0 ? void 0 : data.nombre_modelo) || 'Modelo';
        const title = parentName ? `${modeloName} en ${parentName}` : `${modeloName} en Venta`;
        const image = (data === null || data === void 0 ? void 0 : data.imagenPrincipal) || ((data === null || data === void 0 ? void 0 : data.imagenes) && Array.isArray(data.imagenes) && data.imagenes.length > 0 ? data.imagenes[0] : null);
        const description = `Conoce el modelo ${modeloName}${parentName ? ' del desarrollo ' + parentName : ''}. Características, precio y ubicación.`;
        return { title, image, description };
    }
}
exports.CatalogRepository = CatalogRepository;
//# sourceMappingURL=CatalogRepository.js.map