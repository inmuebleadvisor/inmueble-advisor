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
exports.onModelUpdate = exports.onLeadPageViewMETA = exports.onLeadContactMETA = exports.onLeadIntentMETA = exports.onLeadCreatedMETA = exports.onLeadCreated = exports.notifyNewUser = exports.promoteToAdvisor = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}
// Export Callables
var promoteToAdvisor_1 = require("./interface/callable/promoteToAdvisor");
Object.defineProperty(exports, "promoteToAdvisor", { enumerable: true, get: function () { return promoteToAdvisor_1.promoteToAdvisor; } });
var onUserCreated_1 = require("./interface/triggers/onUserCreated");
Object.defineProperty(exports, "notifyNewUser", { enumerable: true, get: function () { return onUserCreated_1.notifyNewUser; } });
var onLeadCreated_1 = require("./interface/triggers/onLeadCreated");
Object.defineProperty(exports, "onLeadCreated", { enumerable: true, get: function () { return onLeadCreated_1.onLeadCreated; } });
var onLeadCreatedMETA_1 = require("./interface/callable/onLeadCreatedMETA");
Object.defineProperty(exports, "onLeadCreatedMETA", { enumerable: true, get: function () { return onLeadCreatedMETA_1.onLeadCreatedMETA; } });
var onLeadIntentMETA_1 = require("./interface/callable/onLeadIntentMETA");
Object.defineProperty(exports, "onLeadIntentMETA", { enumerable: true, get: function () { return onLeadIntentMETA_1.onLeadIntentMETA; } });
var onLeadContactMETA_1 = require("./interface/callable/onLeadContactMETA");
Object.defineProperty(exports, "onLeadContactMETA", { enumerable: true, get: function () { return onLeadContactMETA_1.onLeadContactMETA; } });
var onLeadPageViewMETA_1 = require("./interface/callable/onLeadPageViewMETA");
Object.defineProperty(exports, "onLeadPageViewMETA", { enumerable: true, get: function () { return onLeadPageViewMETA_1.onLeadPageViewMETA; } });
// Triggers - Catalog Persistence
var onModelUpdate_1 = require("./interface/triggers/onModelUpdate");
Object.defineProperty(exports, "onModelUpdate", { enumerable: true, get: function () { return onModelUpdate_1.onModelUpdate; } });
//# sourceMappingURL=index.js.map