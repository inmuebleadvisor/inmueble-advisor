
const { BigQuery } = require('@google-cloud/bigquery');

async function verifyBigQuery() {
    console.log("🔍 Starting BigQuery Verification...");

    // 1. Initialize Client
    const bq = new BigQuery();

    try {
        // 2. Test Connection & Project Access
        console.log("👉 Step 1: Testing Connection...");
        const [datasets] = await bq.getDatasets();
        console.log(`✅ Connection Successful! Found ${datasets.length} datasets.`);
        datasets.forEach(d => console.log(`   - ${d.id}`));

        // 3. Verify Specific Dataset (firestore_export_leads)
        const TARGET_DATASET = 'firestore_export_leads';
        const dataset = datasets.find(d => d.id === TARGET_DATASET);

        if (!dataset) {
            console.error(`❌ CRITICAL: Dataset '${TARGET_DATASET}' NOT found.`);
            return;
        }

        console.log(`✅ Dataset '${TARGET_DATASET}' found.`);

        // 4. Verify Tables
        console.log("👉 Step 2: Verifying Tables...");
        const [tables] = await dataset.getTables();
        const tableNames = tables.map(t => t.id);

        console.log("   Found Tables:", tableNames);

        const REQUIRED_TABLES = ['users_raw_latest', 'leads_raw_latest'];
        REQUIRED_TABLES.forEach(req => {
            if (tableNames.includes(req)) {
                console.log(`   ✅ Table '${req}' exists.`);
            } else {
                console.warn(`   ⚠️ Table '${req}' MISSING.`);
            }
        });

    } catch (error) {
        console.error("❌ BigQuery Connection Failed:", error.message);
        console.log("   -> NOTE: This environment might lack GOOGLE_APPLICATION_CREDENTIALS.");
    }
}

verifyBigQuery();
