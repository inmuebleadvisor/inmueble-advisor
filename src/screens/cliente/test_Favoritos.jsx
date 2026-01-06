import React from 'react';
import { render } from '@testing-library/react';
import Favoritos from '../Favoritos';
import { useFavoritesViewModel } from '../../hooks/useFavoritesViewModel';

// Mock dependencies
jest.mock('../../hooks/useFavoritesViewModel');
jest.mock('../../components/shared/Modal', () => ({ children, isOpen }) => isOpen ? <div>{children}</div> : null);
jest.mock('../../components/catalogo/ModelDetailsContent', () => () => <div>Model Content</div>);
jest.mock('../../components/catalogo/DevelopmentDetailsContent', () => () => <div>Dev Content</div>);
// Mock Subcomponents
jest.mock('./favoritos/components/FavoritesGrid', () => () => <div>Favorites Grid</div>);
jest.mock('./favoritos/components/ComparisonTable', () => () => <div>Comparison Table</div>);

describe('Favoritos Screen', () => {
    test('renders FavoritesGrid when not comparing', () => {
        useFavoritesViewModel.mockReturnValue({
            isLoading: false,
            favoritesList: [1],
            isComparing: false,
            modalState: { isOpen: false },
            selectedIds: [],
            groupedFavorites: [],
            comparisonList: [],
            // functions
            handleSelect: jest.fn(),
            toggleFavorite: jest.fn(),
            clearSelection: jest.fn(),
            setIsComparing: jest.fn(),
            openModelPopup: jest.fn(),
            openDevelopmentPopup: jest.fn(),
            closeModal: jest.fn(),
            getDesarrolloForModel: jest.fn(),
            modelos: []
        });

        const { getByText } = render(<Favoritos />);
        expect(getByText('Favorites Grid')).toBeTruthy();
        expect(getByText('Mis Favoritos (1)')).toBeTruthy();
    });

    test('renders ComparisonTable when comparing', () => {
        useFavoritesViewModel.mockReturnValue({
            isLoading: false,
            favoritesList: [1, 2],
            isComparing: true,
            modalState: { isOpen: false },
            selectedIds: [1, 2],
            groupedFavorites: [],
            comparisonList: [],
            // functions
            handleSelect: jest.fn(),
            toggleFavorite: jest.fn(),
            clearSelection: jest.fn(),
            setIsComparing: jest.fn(),
            openModelPopup: jest.fn(),
            openDevelopmentPopup: jest.fn(),
            closeModal: jest.fn(),
            getDesarrolloForModel: jest.fn(),
            modelos: []
        });

        const { getByText } = render(<Favoritos />);
        expect(getByText('Comparison Table')).toBeTruthy();
    });
});
