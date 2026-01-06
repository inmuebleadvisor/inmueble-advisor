import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ComparisonTable from './ComparisonTable';

describe('ComparisonTable Component', () => {
    test('renders comparison items', () => {
        const items = [
            { id: 'a', nombre_modelo: 'Model A', m2: 100, recamaras: 2 }
        ];

        const props = {
            items: items,
            selectedIds: ['a'],
            onSelect: jest.fn(),
            onBack: jest.fn(),
            onOpenModel: jest.fn(),
            onOpenDev: jest.fn(),
            getDesarrolloForModel: jest.fn()
        };

        const { getByText } = render(
            <BrowserRouter>
                <ComparisonTable {...props} />
            </BrowserRouter>
        );

        expect(getByText('Model A')).toBeTruthy();
        expect(getByText('100 m²')).toBeTruthy();
    });
});
