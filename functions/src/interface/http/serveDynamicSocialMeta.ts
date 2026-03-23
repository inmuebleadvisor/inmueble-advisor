import * as functions from 'firebase-functions';
import * as fs from 'fs';
import * as path from 'path';
import { CatalogRepository } from '../../infrastructure/repositories/CatalogRepository';

const catalogRepo = new CatalogRepository();

export const serveDynamicSocialMeta = functions.https.onRequest(async (req, res) => {
    try {
        const urlPath = req.path; // e.g., /catalogo/desarrollo/123
        const segments = urlPath.split('/').filter(Boolean);

        let snippet = null;

        if (segments.length >= 3 && segments[0] === 'catalogo') {
            const type = segments[1];
            const id = segments[2];

            if (type === 'desarrollo') {
                snippet = await catalogRepo.getDevSnippet(id);
            } else if (type === 'modelo') {
                snippet = await catalogRepo.getModelSnippet(id);
            }
        }


        let htmlString = '';
        try {
            // The file is copied to 'functions/lib/index.html' during postbuild
            // This script runs from 'functions/lib/interface/http/serveDynamicSocialMeta.js'
            htmlString = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
        } catch (e) {
            console.error('Failed to read index.html', e);
            res.status(500).send('Server Error: Missing index.html in functions directory');
            return;
        }

        if (snippet) {
            // Reemplazar etiquetas
            // Buscar y reemplazar <title>
            htmlString = htmlString.replace(/<title>.*?<\/title>/, `<title>${snippet.title}</title>`);
            
            // Reemplazar og:title
            if (htmlString.includes('<meta property="og:title"')) {
                htmlString = htmlString.replace(
                    /<meta property="og:title" content=".*?"\s*\/?>/,
                    `<meta property="og:title" content="${snippet.title}" />`
                );
            } else {
                htmlString = htmlString.replace('</head>', `<meta property="og:title" content="${snippet.title}" />\n</head>`);
            }

            // Reemplazar og:description
            if (htmlString.includes('<meta property="og:description"')) {
                htmlString = htmlString.replace(
                    /<meta property="og:description" content=".*?"\s*\/?>/,
                    `<meta property="og:description" content="${snippet.description}" />`
                );
            } else {
                htmlString = htmlString.replace('</head>', `<meta property="og:description" content="${snippet.description}" />\n</head>`);
            }


            // Reemplazar og:image
            if (snippet.image) {
                if (htmlString.includes('<meta property="og:image"')) {
                    htmlString = htmlString.replace(
                        /<meta property="og:image" content=".*?"\s*\/?>/,
                        `<meta property="og:image" content="${snippet.image}" />`
                    );
                } else {
                    htmlString = htmlString.replace(
                        '</head>',
                        `<meta property="og:image" content="${snippet.image}" />\n</head>`
                    );
                }
            }
        }

        // Set caching headers so that bots and CDN cache this properly
        // This is safe because catalog items rarely change completely and Firebase handles invalidations on deploy
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(htmlString);

    } catch (error) {
        console.error('Error in serveDynamicSocialMeta:', error);
        // Fallback to normal loading if something fails
        const fallbackPath = path.join(__dirname, '../../index.html');
        if (fs.existsSync(fallbackPath)) {
            res.status(200).sendFile(fallbackPath);
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
});
