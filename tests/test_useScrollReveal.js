import { renderHook } from '@testing-library/react';
import { useScrollReveal } from '../src/hooks/useScrollReveal';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ScrollReveal from 'scrollreveal';

// Mock ScrollReveal constructor and methods
const mockReveal = vi.fn();
const mockClean = vi.fn();
// ScrollReveal returns an instance when called
vi.mock('scrollreveal', () => {
    return {
        default: vi.fn(() => ({
            reveal: mockReveal,
            clean: mockClean,
        })),
    };
});

describe('useScrollReveal Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize ScrollReveal and call reveal with selector', () => {
        const selector = '.test-element';
        renderHook(() => useScrollReveal(selector));

        // Verify ScrollReveal was instantiated
        expect(ScrollReveal).toHaveBeenCalled();
        // Verify clean was called (as per implementation)
        expect(mockClean).toHaveBeenCalledWith(selector);
        // Verify reveal was called
        expect(mockReveal).toHaveBeenCalledWith(selector, expect.objectContaining({
            origin: 'bottom',
            distance: '50px'
        }));
    });

    it('should not call reveal if selector is missing', () => {
        renderHook(() => useScrollReveal(null));
        expect(mockReveal).not.toHaveBeenCalled();
    });
});
