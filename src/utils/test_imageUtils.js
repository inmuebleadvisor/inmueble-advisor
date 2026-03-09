import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveImageUrl, getBase64ImageFromUrl } from './imageUtils';

describe('imageUtils', () => {

    describe('resolveImageUrl', () => {
        const originalWindow = global.window;

        beforeEach(() => {
            // Mock window object for development check
            global.window = {
                location: { hostname: 'localhost' }
            };
        });

        afterEach(() => {
            global.window = originalWindow;
        });

        it('should return null if url is not provided', () => {
            expect(resolveImageUrl(null)).toBeNull();
            expect(resolveImageUrl('')).toBe('');
        });

        it('should rewrite storage.googleapis.com to /img-proxy if on localhost', () => {
            const url = 'https://storage.googleapis.com/my-bucket/image.png';
            const result = resolveImageUrl(url);
            expect(result).toBe('/img-proxy/storage.googleapis.com/my-bucket/image.png');
        });

        it('should rewrite firebasestorage.googleapis.com to /img-proxy-firebase if on localhost', () => {
            const url = 'https://firebasestorage.googleapis.com/v0/b/my-bucket/image.png';
            const result = resolveImageUrl(url);
            expect(result).toBe('/img-proxy-firebase/firebasestorage.googleapis.com/v0/b/my-bucket/image.png');
        });

        it('should NOT rewrite if not on localhost', () => {
            global.window.location.hostname = 'inmuebleadvisor.com';
            const url = 'https://storage.googleapis.com/my-bucket/image.png';
            const result = resolveImageUrl(url);
            expect(result).toBe(url);
        });
    });

    describe('getBase64ImageFromUrl', () => {
        // Mocking Image and Canvas for unit testing
        beforeEach(() => {
            global.Image = class {
                constructor() {
                    setTimeout(() => {
                        this.onload && this.onload();
                    }, 10);
                }
                setAttribute() { }
            };

            global.document = {
                createElement: (tag) => {
                    if (tag === 'canvas') {
                        return {
                            getContext: () => ({
                                drawImage: vi.fn(),
                            }),
                            toDataURL: () => 'data:image/png;base64,mockedbase64'
                        };
                    }
                }
            };
        });

        afterEach(() => {
            delete global.Image;
            delete global.document;
            vi.restoreAllMocks();
        });

        it('should resolve with base64 data successfully', async () => {
            const result = await getBase64ImageFromUrl('http://example.com/image.png');
            expect(result).toBe('data:image/png;base64,mockedbase64');
        });

        it('should handle image loading errors gracefully', async () => {
            // override Image mock to trigger onerror
            global.Image = class {
                constructor() {
                    setTimeout(() => {
                        this.onerror && this.onerror(new Error('Load failed'));
                    }, 10);
                }
                setAttribute() { }
            };

            const result = await getBase64ImageFromUrl('http://example.com/bad-image.png');
            expect(result).toBeNull();
        });
    });
});
