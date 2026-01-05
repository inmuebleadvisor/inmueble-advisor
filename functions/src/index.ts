
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}

// Export Callables
export { promoteToAdvisor } from './interface/callable/promoteToAdvisor';
