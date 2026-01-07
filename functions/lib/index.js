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
exports.notifyNewUser = exports.triggerDashboardStats = exports.scheduledDashboardStats = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}
// Export Callables
// export { promoteToAdvisor } from './interface/callable/promoteToAdvisor';
var scheduledDashboardStats_1 = require("./interface/triggers/scheduledDashboardStats");
Object.defineProperty(exports, "scheduledDashboardStats", { enumerable: true, get: function () { return scheduledDashboardStats_1.scheduledDashboardStats; } });
Object.defineProperty(exports, "triggerDashboardStats", { enumerable: true, get: function () { return scheduledDashboardStats_1.triggerDashboardStats; } });
var onUserCreated_1 = require("./interface/triggers/onUserCreated");
Object.defineProperty(exports, "notifyNewUser", { enumerable: true, get: function () { return onUserCreated_1.notifyNewUser; } });
//# sourceMappingURL=index.js.map