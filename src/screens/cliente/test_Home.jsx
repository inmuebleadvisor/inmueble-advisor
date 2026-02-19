import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Home from '../../screens/cliente/Home';

// Mocks
vi.mock('../../components/home/HeroSection', () => ({
    default: () => <div>Hero Section Mock</div>
}));
vi.mock('../../components/home/AffordabilityWidget', () => ({
    default: () => <div>Affordability Widget Mock</div>
}));
vi.mock('../../components/home/FeaturedDevelopers', () => ({
    default: () => <div>Featured Developers Mock</div>
}));
vi.mock('../../components/home/NewLaunches', () => ({
    default: () => <div>New Launches Mock</div>
}));

describe('Home Screen', () => {
    it('renders Hero and Sections without crashing', () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );

        // Check for static text elements
        expect(screen.getByText(/Hero Section Mock/i)).toBeInTheDocument();
        expect(screen.getByText(/Affordability Widget Mock/i)).toBeInTheDocument();
    });
});
