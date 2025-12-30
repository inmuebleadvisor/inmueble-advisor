#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import colors from 'colors';
import { initializeFirebase } from './lib/utils.js';
// Importaremos comandos especificos luego

console.log(colors.cyan.bold('\n🏗️  INMUEBLE ADVISOR DATA MANAGER v1.0\n'));

yargs(hideBin(process.argv))
    .command('test-connection', 'Prueba la conexión a Firestore', {}, async (argv) => {
        const db = initializeFirebase();
        try {
            const collections = await db.listCollections();
            console.log(`📡 Conexión Exitosa. Colecciones encontradas: ${collections.length}`);
            collections.forEach(col => console.log(`   - ${col.id}`));
        } catch (e) {
            console.error('❌ Falló la prueba de conexión:', e.message);
        }
    })
    .command('export [collection]', 'Exporta una colección a JSON/CSV', (yargs) => {
        return yargs
            .positional('collection', { describe: 'Nombre de la colección', type: 'string' })
            .option('format', { alias: 'f', describe: 'Formato de salida (json, csv)', default: 'json' });
    }, async (argv) => {
        const { exportCollection } = await import('./lib/export.js');
        await exportCollection(argv.collection, argv.format);
    })
    .command('import [collection] [file]', 'Importa datos desde un archivo', (yargs) => {
        return yargs
            .positional('collection', { describe: 'Nombre de la colección destino', type: 'string' })
            .positional('file', { describe: 'Ruta al archivo origen', type: 'string' })
            .option('region', { alias: 'r', describe: 'Limitar búsqueda de duplicados a una ciudad específica (Optimize Memory)', type: 'string' });
    }, async (argv) => {
        const { importCollection } = await import('./lib/import.js');
        await importCollection(argv.collection, argv.file, { region: argv.region });
    })
    .demandCommand(1)
    .help()
    .argv;
