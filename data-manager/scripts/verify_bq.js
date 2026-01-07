import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import serviceAccount from '../service-account.json' with { type: "json" };

// Init Firebase Admin
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function runVerification() {
    console.log("🚀 Starting BigQuery Data Flow Verification...");

    // 1. LEAD STATUS HISTORY
    console.log("\n1️⃣  Testing Lead Status History...");
    const leadRef = db.collection('leads').doc();
    const leadId = leadRef.id;

    // Create Initial
    await leadRef.set({
        uid: "TEST_USER_BQ",
        status: "NUEVO",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        statusHistory: [{
            status: "NUEVO",
            timestamp: Timestamp.now(),
            note: "Created by Verification Script",
            changedBy: "SYSTEM"
        }]
    });
    console.log(`   ✅ Created Lead: ${leadId} (Status: NUEVO)`);

    // Update (Trigger History)
    await leadRef.update({
        status: "CONTACTADO",
        updatedAt: Timestamp.now(),
        statusHistory: FieldValue.arrayUnion({
            status: "CONTACTADO",
            timestamp: Timestamp.now(),
            note: "Status changed for BigQuery Test",
            changedBy: "TEST_SCRIPT"
        })
    });
    console.log(`   ✅ Updated Lead: ${leadId} (Status: CONTACTADO)`);
    console.log(`   👉 Check BigQuery table for 'leads' updates.`);


    // 2. PRICE HISTORY (Subcollection)
    console.log("\n2️⃣  Testing Price History Subcollection...");
    const modelRef = db.collection('modelos').doc();
    const modelId = modelRef.id;

    // Create Initial Model
    await modelRef.set({
        nombre: "Modelo Test BQ",
        precios: { base: 1500000 },
        disponibilidad: true
    });
    console.log(`   ✅ Created Model: ${modelId} (Price: 1,500,000)`);

    // Simulate Import Update (Price Change)
    const newPrice = 1600000;
    const historyEntry = {
        date: Timestamp.now(),
        price: 1500000, // Old Price
        newPrice: newPrice, // New Price
        available: true
    };

    // Write to Subcollection
    await modelRef.collection('bigquery-price-history').add(historyEntry);

    // Update main doc
    await modelRef.update({
        "precios.base": newPrice
    });

    console.log(`   ✅ Updated Model Price to 1,600,000`);
    console.log(`   ✅ Written to Subcollection: models/${modelId}/bigquery-price-history`);
    console.log(`   👉 Check BigQuery table for 'price_history'.`);

    console.log("\n🎉 Verification Data Generated Successfully.");
}

runVerification().catch(console.error);
