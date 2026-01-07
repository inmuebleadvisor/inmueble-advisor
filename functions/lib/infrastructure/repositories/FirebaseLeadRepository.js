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
exports.FirebaseLeadRepository = void 0;
const admin = __importStar(require("firebase-admin"));
class FirebaseLeadRepository {
    constructor() {
        this.db = admin.firestore();
    }
    async getLeadsByUserId(uid) {
        if (!uid)
            return [];
        const leadsMap = new Map();
        const addToMap = (docs) => {
            docs.forEach(d => {
                if (!leadsMap.has(d.id)) {
                    leadsMap.set(d.id, Object.assign({ id: d.id }, d.data()));
                }
            });
        };
        try {
            // Query 1: By uid
            const q1 = await this.db.collection('leads')
                .where('uid', '==', uid)
                .limit(20)
                .get();
            addToMap(q1.docs);
            // Query 2: By clienteUid
            const q2 = await this.db.collection('leads')
                .where('clienteUid', '==', uid)
                .limit(20)
                .get();
            addToMap(q2.docs);
        }
        catch (e) {
            console.error("Error fetching lead history:", e);
        }
        const leads = Array.from(leadsMap.values());
        // In-memory sort: Newest first
        return leads.sort((a, b) => {
            var _a, _b;
            const dateA = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis) ? a.createdAt.toMillis() : 0;
            const dateB = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.toMillis) ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
        });
    }
}
exports.FirebaseLeadRepository = FirebaseLeadRepository;
//# sourceMappingURL=FirebaseLeadRepository.js.map