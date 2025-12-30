import { initializeFirebase } from './lib/utils.js';
import colors from 'colors';

const db = initializeFirebase();

const diagnose = async (devName) => {
    console.log(`Diagnosing developments for: '${devName}'`);
    const snapshot = await db.collection('desarrollos')
        .where('constructora', '==', devName)
        .get();

    if (snapshot.empty) {
        console.log(colors.red('No developments found!'));
        return;
    }

    console.log(colors.green(`Found ${snapshot.size} documents.`));
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(colors.yellow(`\nID: ${doc.id}`));
        console.log('Nombre:', data.nombre);
        console.log('Constructora (raw):', `'${data.constructora}'`);
        console.log('InfoComercial:', JSON.stringify(data.infoComercial || {}, null, 2));
        console.log('Unidades Totales (Direct Check):', data.infoComercial?.unidadesTotales);
        console.log('Unidades Disponibles (Direct Check):', data.infoComercial?.unidadesDisponibles);
    });
};

const name = process.argv[2];
if (!name) {
    console.log('Please provide a developer name in quotes.');
} else {
    diagnose(name);
}
