"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bigquery_1 = require("@google-cloud/bigquery");
async function verifyBigQuery() {
    console.log("🔍 Starting BigQuery Verification...");
    // 1. Initialize Client
    // Reliance on GOOGLE_APPLICATION_CREDENTIALS or default auth
    const bq = new bigquery_1.BigQuery();
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
            console.log("   -> Check if Firebase Extension 'Stream Collections to BigQuery' is installed.");
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
            }
            else {
                console.warn(`   ⚠️ Table '${req}' MISSING.`);
            }
        });
        // 5. Sample Query (Optional Test)
        console.log("👉 Step 3: Running Sample Query (Count)...");
        const query = `SELECT count(*) as count FROM \`${TARGET_DATASET}.leads_raw_latest\``;
        try {
            const [rows] = await bq.query({ query });
            console.log(`   ✅ Query Successful! Total leads in BQ: ${rows[0].count}`);
        }
        catch (queryErr) {
            console.error("   ❌ Query Failed:", queryErr.message);
        }
    }
    catch (error) {
        console.error("❌ BigQuery Connection Failed:", error.message);
        console.log("   -> Check GOOGLE_APPLICATION_CREDENTIALS or gcloud auth.");
    }
}
verifyBigQuery();
//# sourceMappingURL=verifyBigQuery.js.map