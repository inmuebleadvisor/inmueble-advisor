const { db } = require('./functions/src/utils/firestore');

async function checkUserStructure() {
    console.log('Checking User Structure...');
    const snapshot = await db.collection('users').limit(3).get();

    if (snapshot.empty) {
        console.log('No users found.');
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`User ${doc.id}:`);
        console.log(`- Role: ${data.role}`);
        console.log(`- Inventario: ${JSON.stringify(data.inventario ? data.inventario.slice(0, 2) : 'NONE')}`);
        console.log(`- metricas: ${JSON.stringify(data.metricas || {})}`);
        console.log('-----------------------------------');
    });
}

checkUserStructure().then(() => process.exit(0)).catch(e => console.error(e));
