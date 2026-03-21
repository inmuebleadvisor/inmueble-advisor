/**
 * Utilidades para manejo de imágenes, especialmente para el generador de PDF (jsPDF).
 */

// En desarrollo (localhost), redirige las imágenes de Firebase Storage a través del proxy de Vite
// para evitar bloqueos CORS. En producción, usa la URL directa (CORS del bucket ya configurado).
export const resolveImageUrl = (url) => {
    if (!url) return null;
    if (typeof window === 'undefined') return url; // Para entornos de test/node
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isDev) return url;

    // storage.googleapis.com → /img-proxy/...
    if (url.includes('storage.googleapis.com')) {
        return url.replace('https://storage.googleapis.com', '/img-proxy/storage.googleapis.com');
    }
    // firebasestorage.googleapis.com → /img-proxy-firebase/...
    if (url.includes('firebasestorage.googleapis.com')) {
        return url.replace('https://firebasestorage.googleapis.com', '/img-proxy-firebase/firebasestorage.googleapis.com');
    }
    return url;
};

// Cache en memoria para evitar re-procesar la misma imagen (ej. Logo en cada página)
const _imageCache = new Map();

/**
 * Convierte una imagen URL a base64 compatible con jsPDF.
 * Retorna un objeto con el dataUrl y las dimensiones naturales de la imagen,
 * necesarias para calcular proporciones reales sin estiramientos.
 *
 * Se utiliza Canvas para sortear limitaciones de Fetch y asegurar compatibilidad de formato.
 *
 * @param {string} imageUrl
 * @returns {Promise<{ dataUrl: string|null, width: number, height: number }>}
 */
export const getBase64ImageFromUrl = async (imageUrl) => {
    if (!imageUrl) return { dataUrl: null, width: 0, height: 0 };
    
    // 1. Revisar cache
    if (_imageCache.has(imageUrl)) {
        return _imageCache.get(imageUrl);
    }

    // 2. Timeout de 5 segundos para no bloquear el PDF
    const timeout = new Promise((resolve) => setTimeout(() => {
        console.warn('[PDF] ⏱ Timeout cargando imagen:', imageUrl?.substring(0, 80));
        resolve({ dataUrl: null, width: 0, height: 0 });
    }, 5000));

    const loadImage = new Promise((resolve) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width  = img.naturalWidth  || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                console.log('[PDF] ✅ Imagen OK:', imageUrl?.substring(0, 80), `(${canvas.width}x${canvas.height})`);
                resolve({ dataUrl, width: canvas.width, height: canvas.height });
            } catch (securityErr) {
                console.warn('[PDF] ❌ Canvas tainted (CORS pendiente):', imageUrl?.substring(0, 80), securityErr.message);
                resolve({ dataUrl: null, width: 0, height: 0 });
            }
        };

        img.onerror = (err) => {
            console.warn('[PDF] ❌ Error cargando imagen:', imageUrl?.substring(0, 80), err);
            resolve({ dataUrl: null, width: 0, height: 0 });
        };

        img.src = imageUrl;
    });

    const result = await Promise.race([loadImage, timeout]);
    if (result.dataUrl) {
        _imageCache.set(imageUrl, result);
    }
    return result;
};
