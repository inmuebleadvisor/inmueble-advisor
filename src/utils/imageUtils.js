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

// Helper local para convertir imágenes URL en Base64 compatible con jsPDF
// Se utiliza Canvas para sortear limitaciones de Fetch y asegurar compatibilidad de formato.
export const getBase64ImageFromUrl = (imageUrl) => {
    // Timeout de 5 segundos para no bloquear el PDF
    const timeout = new Promise((resolve) => setTimeout(() => {
        console.warn('[PDF] ⏱ Timeout cargando imagen:', imageUrl?.substring(0, 80));
        resolve(null);
    }, 5000));

    const loadImage = new Promise((resolve) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                console.log('[PDF] ✅ Imagen OK:', imageUrl?.substring(0, 80));
                resolve(dataURL);
            } catch (securityErr) {
                console.warn('[PDF] ❌ Canvas tainted (CORS pendiente):', imageUrl?.substring(0, 80), securityErr.message);
                resolve(null);
            }
        };

        img.onerror = (err) => {
            console.warn('[PDF] ❌ Error cargando imagen:', imageUrl?.substring(0, 80), err);
            resolve(null);
        };

        img.src = imageUrl;
    });

    return Promise.race([loadImage, timeout]);
};
