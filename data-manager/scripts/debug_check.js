
import { initializeFirebase } from '../lib/utils.js';

// This is a script, not a test.
const checkModel = async () => {
    const db = initializeFirebase();
    const modelId = '2846-guila';

    console.log(`Checking model ${modelId}...`);
    const doc = await db.collection('modelos').doc(modelId).get();

    if (!doc.exists) {
        console.log('Model not found');
    } else {
        console.log('Model Data:', JSON.stringify(doc.data(), null, 2));
    }
};

checkModel();
