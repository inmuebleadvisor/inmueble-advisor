import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DetalleDesarrollo from './DetalleDesarrollo';

// --- Mocks Definitions ---
const mockCatalogService = {
  obtenerInformacionDesarrollo: vi.fn(),
};

const mockMetaService = {
  generateEventId: vi.fn(() => 'test-event-id'),
  track: vi.fn(),
  setUserData: vi.fn(),
  trackIntentCAPI: vi.fn(),
  getFbp: vi.fn(),
  getFbc: vi.fn(),
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
};

// --- Mocks Modules ---
vi.mock('../../context/UserContext', () => ({
  useUser: () => mockUseUser,
}));

vi.mock('../../hooks/useService', () => ({
  useService: () => ({
    catalog: mockCatalogService,
    meta: mockMetaService,
  }),
}));

vi.mock('../../context/CatalogContext', () => ({
  useCatalog: () => mockUseCatalog,
}));

// Mock the nested component to keep test shallow
vi.mock('../../components/catalogo/DevelopmentDetailsContent', () => {
  return {
    default: ({ desarrollo }) => <div data-testid="dev-content">{desarrollo.nombre}</div>,
  };
});

describe('DetalleDesarrollo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.selectedCity = null;
    mockUseUser.updateSelectedCity.mockClear();
    mockCatalogService.obtenerInformacionDesarrollo.mockReset();
  });

  const renderComponent = (id = 'dev-1') => {
    return render(
      <MemoryRouter initialEntries={[`/desarrollo/${id}`]}>
        <Routes>
          <Route path="/desarrollo/:id" element={<DetalleDesarrollo />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('debe obtener los datos del desarrollo y guardarlos en selectedCity si difiere', async () => {
    mockCatalogService.obtenerInformacionDesarrollo.mockResolvedValue({
      id: 'dev-1',
      nombre: 'Desarrollo Test',
      ubicacion: { ciudad: 'Mérida' },
      modelos: []
    });

    renderComponent();

    // Verificamos que se renderize el Mock Content
    await waitFor(() => {
      expect(screen.getByTestId('dev-content')).toBeInTheDocument();
    });

    // Verificamos que se actualizó la ciudad global
    expect(mockUseUser.updateSelectedCity).toHaveBeenCalledWith('Mérida');
    expect(mockCatalogService.obtenerInformacionDesarrollo).toHaveBeenCalledWith('dev-1');
  });

  it('no debe llamar a updateSelectedCity si la ciudad es la misma', async () => {
    mockUseUser.selectedCity = 'Mérida'; // Ya está seleccionada
    mockCatalogService.obtenerInformacionDesarrollo.mockResolvedValue({
      id: 'dev-1',
      nombre: 'Desarrollo Test',
      ubicacion: { ciudad: 'Mérida' },
      modelos: []
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('dev-content')).toBeInTheDocument();
    });

    expect(mockUseUser.updateSelectedCity).not.toHaveBeenCalled();
  });
});
