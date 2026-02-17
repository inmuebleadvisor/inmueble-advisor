import { describe, it, expect, vi } from 'vitest';
import { parseCoord, procesarImagenes } from './dataHelpers';

// Mock constants if necessary, but here they are likely strings
// If constants are complex, we might need a mock file, but let's assume they work for unit tests

describe('dataHelpers.js', () => {
    describe('parseCoord', () => {
        it('should return the same number if a number is provided', () => {
            expect(parseCoord(123.45)).toBe(123.45);
        });

        it('should parse a string to a float', () => {
            expect(parseCoord('123.45')).toBe(123.45);
        });

        it('should return 0 for invalid strings', () => {
            expect(parseCoord('invalid')).toBe(0);
        });

        it('should return 0 for other types', () => {
            expect(parseCoord(null)).toBe(0);
            expect(parseCoord({})).toBe(0);
        });
    });

    describe('procesarImagenes', () => {
        it('should handle data.media.cover and gallery', () => {
            const data = {
                media: {
                    cover: 'cover.jpg',
                    gallery: ['img1.jpg', 'img2.jpg']
                }
            };
            const result = procesarImagenes(data);
            expect(result.imagen).toBe('cover.jpg');
            expect(result.imagenes).toContain('cover.jpg');
            expect(result.imagenes).toContain('img1.jpg');
            expect(result.imagenes.length).toBe(3);
        });

        it('should handle data.multimedia.portada and galeria', () => {
            const data = {
                multimedia: {
                    portada: 'portada.jpg',
                    galeria: ['g1.jpg']
                }
            };
            const result = procesarImagenes(data);
            expect(result.imagen).toBe('portada.jpg');
            expect(result.imagenes).toEqual(['portada.jpg', 'g1.jpg']);
        });

        it('should handle data.imagen', () => {
            const data = { imagen: 'simple.jpg' };
            const result = procesarImagenes(data);
            expect(result.imagen).toBe('simple.jpg');
            expect(result.imagenes).toEqual(['simple.jpg']);
        });

        it('should fallback to plantasArquitectonicas if no other images', () => {
            const data = {
                media: {
                    plantasArquitectonicas: ['plan1.jpg']
                }
            };
            const result = procesarImagenes(data);
            expect(result.imagen).toBe('plan1.jpg');
            expect(result.imagenes).toEqual(['plan1.jpg']);
        });

        it('should filter out invalid or unreliable URLs', () => {
            const data = {
                media: {
                    cover: 'too_short',
                    gallery: ['valid_image_url_long_enough.jpg', 'via.placeholder.com/test', 'static.wixstatic.com/test']
                }
            };
            const result = procesarImagenes(data);
            // 'too_short' is length 9, limit is 10.
            // placeholder and wix are filtered.
            expect(result.imagenes).toEqual(['valid_image_url_long_enough.jpg']);
        });

        it('should return fallback image if no valid images found', () => {
            const data = {};
            const result = procesarImagenes(data);
            expect(result.imagen).toBeDefined(); // Should be FALLBACK_IMG
            expect(result.imagenes.length).toBe(1);
        });
        
        it('should remove duplicates', () => {
             const data = {
                media: {
                    cover: 'duplicate.jpg',
                    gallery: ['duplicate.jpg', 'unique.jpg']
                }
            };
            const result = procesarImagenes(data);
            expect(result.imagenes.length).toBe(2);
            expect(result.imagenes).toEqual(['duplicate.jpg', 'unique.jpg']);
        });
    });
});
