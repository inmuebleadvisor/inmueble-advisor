import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Endpoint HTTP (Serverless) para generar el sitemap.xml dinámicamente.
 * Consulta las colecciones de Firestore para listar desarrollos y modelos.
 * Utiliza un caché de 12 horas en el CDN de Firebase Hosting para mitigar costos de facturación (Risk Management).
 */
export const generateSitemap = functions.https.onRequest(async (req, res) => {
    try {
        // 1. Configurar Caché Estricto (12 Horas) en el Edge Network
        res.set('Cache-Control', 'public, max-age=43200, s-maxage=43200');
        res.set('Content-Type', 'application/xml');

        const db = admin.firestore();
        
        // Host tracking: Se prefiere el host origen forwardeado si existe, o el default.
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.hostname || 'inmuebleadvisor.com';
        const baseUrl = `${protocol}://${host}`;

        // 2. Base del XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        
        // Rutas estáticas principales
        xml += `
    <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/catalogo</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>`;

        // 3. Consultar Desarrollos Activos
        const desarrollosSnapshot = await db.collection('desarrollos').get();
        desarrollosSnapshot.forEach(doc => {
            const data = doc.data();
            // Evitamos indexar inactivos si hubiera el flag
            if (data.activo === false) return; 
            
            xml += `
    <url>
        <loc>${baseUrl}/desarrollo/${doc.id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        // 4. Consultar Modelos
        const modelosSnapshot = await db.collection('modelos').get();
        modelosSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.activo === false) return;

            xml += `
    <url>
        <loc>${baseUrl}/modelo/${doc.id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        });

        // 5. Cerrar XML
        xml += `\n</urlset>`;

        // Enviar respuesta
        res.status(200).send(xml);

    } catch (error) {
        console.error("[generateSitemap] Error generador SEO:", error);
        res.status(500).send('Error generating sitemap');
    }
});
