import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DetalleModelo from './DetalleModelo';

// --- Mocks Definitions ---
const mockMetaService = {
  generateEventId: vi.fn(() => 'test-event-id'),
  track: vi.fn(),
  setUserData: vi.fn(),
  trackIntentCAPI: vi.fn(),
  getFbp: vi.fn(),
  getFbc: vi.fn(),
};

const mockCatalogService = {
  obtenerInformacionModelo: vi.fn(),
};

const mockUseUser = {
  user: { uid: '123' },
  userProfile: { email: 'test@example.com' },
  trackBehavior: vi.fn(),
  selectedCity: null,
  updateSelectedCity: vi.fn(),
};

const mockUseCatalog = {
  loadingCatalog: false,
  getModeloById: vi.fn(),
  getDesarrolloById: vi.fn(),
  modelos: [],
};

// --- Mocks Modules ---
vi.mock('../../context/UserContext', () => ({
  useUser: () => mockUseUser,
}));

vi.mock('../../hooks/useService', () => ({
  useService: () => ({
    meta: mockMetaService,
    catalog: mockCatalogService,
  }),
}));

vi.mock('../../context/CatalogContext', () => ({
  useCatalog: () => mockUseCatalog,
}));

vi.mock('../../components/catalogo/ModelDetailsContent', () => {
  return {
    default: ({ modelo }) => <div data-testid="model-content">{modelo.nombre_modelo}</div>,
  };
});

describe('DetalleModelo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.selectedCity = null;
    mockUseUser.updateSelectedCity.mockClear();
    
    // Clear return values
    mockUseCatalog.getModeloById.mockReset();
    mockUseCatalog.getDesarrolloById.mockReset();
    mockCatalogService.obtenerInformacionModelo.mockReset();
  });

  const renderComponent = (id = 'mod-1') => {
    return render(
      <MemoryRouter initialEntries={[`/modelo/${id}`]}>
        <Routes>
          <Route path="/modelo/:id" element={<DetalleModelo />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('debe vincular el Desarrollo Padre y actualizar selectedCity', async () => {
    mockUseCatalog.getModeloById.mockReturnValue({
      id: 'mod-1',
      nombre_modelo: 'Modelo Test',
      idDesarrollo: 'dev-1',
      precioNumerico: 1000
    });

    mockUseCatalog.getDesarrolloById.mockReturnValue({
      id: 'dev-1',
      ubicacion: { ciudad: 'Tulum' }
    });

    renderComponent();

    // Verificamos que se pintó el modelo
    await waitFor(() => {
      expect(screen.getByTestId('model-content')).toBeInTheDocument();
    });

    // Verificamos actualización de la ciudad
    expect(mockUseUser.updateSelectedCity).toHaveBeenCalledWith('Tulum');
  });

  it('no debe llamar a updateSelectedCity si la ciudad es nula o igual a la actual', async () => {
    mockUseUser.selectedCity = 'Tulum';
    mockUseCatalog.getModeloById.mockReturnValue({
      id: 'mod-1',
      nombre_modelo: 'Modelo Test',
      idDesarrollo: 'dev-1',
      precioNumerico: 1000
    });

    mockUseCatalog.getDesarrolloById.mockReturnValue({
      id: 'dev-1',
      ubicacion: { ciudad: 'Tulum' }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('model-content')).toBeInTheDocument();
    });

    expect(mockUseUser.updateSelectedCity).not.toHaveBeenCalled();
  });

  it('debe obtener el modelo desde catalogService si no está en contexto y actualizar selectedCity', async () => {
    // Simular que el modelo no está en el catálogo global
    mockUseCatalog.getModeloById.mockReturnValue(null);

    // Simular que el servicio lo obtiene de la BD
    mockCatalogService.obtenerInformacionModelo.mockResolvedValue({
      id: 'mod-1',
      nombre_modelo: 'Modelo Fallback',
      idDesarrollo: 'dev-1',
      precioNumerico: 2000
    });

    mockUseCatalog.getDesarrolloById.mockReturnValue({
      id: 'dev-1',
      ubicacion: { ciudad: 'Cancún' }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('model-content')).toHaveTextContent('Modelo Fallback');
    });

    expect(mockCatalogService.obtenerInformacionModelo).toHaveBeenCalledWith('mod-1');
    expect(mockUseUser.updateSelectedCity).toHaveBeenCalledWith('Cancún');
  });
});
