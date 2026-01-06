import React from 'react';
import { render } from '@testing-library/react';
import FavoritesGrid from './FavoritesGrid';

describe('FavoritesGrid Component', () => {
    test('renders grouped favorites', () => {
        const groups = [
            { id: '1', name: 'Dev 1', items: [{ id: 'a', nombre_modelo: 'Model A', m2: 100 }] }
        ];

        // Mock props
        const props = {
            groupedFavorites: groups,
            selectedIds: [],
            onSelect: jest.fn(),
            onRemove: jest.fn(),
            onOpenModel: jest.fn(),
            onOpenDev: jest.fn(),
            getDesarrolloForModel: jest.fn()
        };

        const { getByText } = render(<FavoritesGrid {...props} />);

        expect(getByText('Dev 1')).toBeTruthy();
        expect(getByText('Model A')).toBeTruthy();
    });
});
