import { renderHook, act } from '@testing-library/react-hooks';
import { useFavoritesViewModel } from '../useFavoritesViewModel';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';

// Mocks
jest.mock('../context/FavoritesContext');
jest.mock('../context/CatalogContext');

describe('useFavoritesViewModel', () => {
    beforeEach(() => {
        useFavorites.mockReturnValue({
            favoritosIds: [],
            toggleFavorite: jest.fn()
        });
        useCatalog.mockReturnValue({
            modelos: [],
            loadingCatalog: false,
            getDesarrolloById: jest.fn()
        });
    });

    test('should initialize with default values', () => {
        const { result } = renderHook(() => useFavoritesViewModel());

        expect(result.current.favoritesList).toEqual([]);
        expect(result.current.selectedIds).toEqual([]);
        expect(result.current.isComparing).toBe(false);
        expect(result.current.modalState.isOpen).toBe(false);
    });

    // More tests could be added here for detailed logic
});
