
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}

// Export Callables
export { promoteToAdvisor } from './interface/callable/promoteToAdvisor';
export { scheduledDashboardStats, triggerDashboardStats } from './interface/triggers/scheduledDashboardStats';
export { notifyNewUser } from './interface/triggers/onUserCreated';
export { onLeadCreated } from './interface/triggers/onLeadCreated';
export { onLeadCreatedMETA } from './interface/callable/onLeadCreatedMETA';
export { onLeadIntentMETA } from './interface/callable/onLeadIntentMETA';
export { onLeadContactMETA } from './interface/callable/onLeadContactMETA';
export { onLeadPageViewMETA } from './interface/callable/onLeadPageViewMETA';

