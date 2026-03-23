import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProvider, useUser } from './UserContext';

// mock custom service hook since UserProvider calls useService
vi.mock('../hooks/useService', () => ({
  useService: () => ({
    auth: {
      subscribeToAuthChanges: vi.fn((cb) => {
        // Ejecución síncrona para que no se quede cargando inicial
        cb(null, null);
        return () => {};
      }),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      convertToAdvisor: vi.fn(),
    },
    analytics: {
      trackEvent: vi.fn(),
    }
  })
}));

const TestComponent = () => {
  const { selectedCity, updateSelectedCity } = useUser();

  return (
    <div>
      <span data-testid="city">{selectedCity}</span>
      <button onClick={() => updateSelectedCity('Mazatlán')}>Set City</button>
    </div>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('debe inicializar selectedCity como Culiacán por defecto y guardarlo en localStorage', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );
    expect(screen.getByTestId('city')).toHaveTextContent('Culiacán');
    expect(localStorage.getItem('user_selected_city')).toBe('Culiacán');
  });

  it('debe leer la ciudad de localStorage si existe', () => {
    localStorage.setItem('user_selected_city', 'Monterrey');
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );
    expect(screen.getByTestId('city')).toHaveTextContent('Monterrey');
  });

  it('debe permitir actualizar la ciudad seleccionada y el localStorage', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );
    expect(screen.getByTestId('city')).toHaveTextContent('Culiacán');
    
    act(() => {
      screen.getByText('Set City').click();
    });

    expect(screen.getByTestId('city')).toHaveTextContent('Mazatlán');
    expect(localStorage.getItem('user_selected_city')).toBe('Mazatlán');
  });
});
