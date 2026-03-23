"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveDynamicSocialMeta = void 0;
const functions = __importStar(require("firebase-functions"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CatalogRepository_1 = require("../../infrastructure/repositories/CatalogRepository");
const catalogRepo = new CatalogRepository_1.CatalogRepository();
exports.serveDynamicSocialMeta = functions.https.onRequest(async (req, res) => {
    try {
        const urlPath = req.path; // e.g., /catalogo/desarrollo/123
        const segments = urlPath.split('/').filter(Boolean);
        let snippet = null;
        if (segments.length >= 3 && segments[0] === 'catalogo') {
            const type = segments[1];
            const id = segments[2];
            if (type === 'desarrollo') {
                snippet = await catalogRepo.getDevSnippet(id);
            }
            else if (type === 'modelo') {
                snippet = await catalogRepo.getModelSnippet(id);
            }
        }
        let htmlString = '';
        try {
            // The file is copied to 'functions/lib/index.html' during postbuild
            // This script runs from 'functions/lib/interface/http/serveDynamicSocialMeta.js'
            htmlString = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
        }
        catch (e) {
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
                htmlString = htmlString.replace(/<meta property="og:title" content=".*?"\s*\/?>/, `<meta property="og:title" content="${snippet.title}" />`);
            }
            else {
                htmlString = htmlString.replace('</head>', `<meta property="og:title" content="${snippet.title}" />\n</head>`);
            }
            // Reemplazar og:description
            if (htmlString.includes('<meta property="og:description"')) {
                htmlString = htmlString.replace(/<meta property="og:description" content=".*?"\s*\/?>/, `<meta property="og:description" content="${snippet.description}" />`);
            }
            else {
                htmlString = htmlString.replace('</head>', `<meta property="og:description" content="${snippet.description}" />\n</head>`);
            }
            // Reemplazar og:image
            if (snippet.image) {
                if (htmlString.includes('<meta property="og:image"')) {
                    htmlString = htmlString.replace(/<meta property="og:image" content=".*?"\s*\/?>/, `<meta property="og:image" content="${snippet.image}" />`);
                }
                else {
                    htmlString = htmlString.replace('</head>', `<meta property="og:image" content="${snippet.image}" />\n</head>`);
                }
            }
        }
        // Set caching headers so that bots and CDN cache this properly
        // This is safe because catalog items rarely change completely and Firebase handles invalidations on deploy
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(htmlString);
    }
    catch (error) {
        console.error('Error in serveDynamicSocialMeta:', error);
        // Fallback to normal loading if something fails
        const fallbackPath = path.join(__dirname, '../../index.html');
        if (fs.existsSync(fallbackPath)) {
            res.status(200).sendFile(fallbackPath);
        }
        else {
            res.status(500).send('Internal Server Error');
        }
    }
});
//# sourceMappingURL=serveDynamicSocialMeta.js.map