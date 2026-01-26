import * as admin from 'firebase-admin';
const functionsTest = require('firebase-functions-test');

// Initialize the test SDK
const test = functionsTest();

// Initialize admin app if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

export { test, admin };
