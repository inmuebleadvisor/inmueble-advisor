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
        // NOTE: avoiding orderBy('createdAt') to prevent "Missing Index" error in early dev.
        // We fetch by UID and sort in memory.
        const q = await this.db.collection('leads')
            .where('uid', '==', uid)
            .limit(20)
            .get();
        const leads = q.docs.map(d => (Object.assign({ id: d.id }, d.data())));
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