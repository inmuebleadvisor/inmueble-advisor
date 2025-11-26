import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Definimos claves constantes para evitar errores de dedo "Typos"
const USER_STORAGE_KEY = 'inmueble_user_data';
const ANALYTICS_STORAGE_KEY = 'inmueble_analytics_data';

// 1. Crear el Contexto
const UserContext = createContext();

// 2. Crear el Provider
export const UserProvider = ({ children }) => {
  
  // --- ESTADOS (DATA) ---
  
  // Estado del Usuario: Inicialización perezosa (Lazy Initializer)
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error leyendo usuario del storage", error);
      return null;
    }
  });

  // Estado del Historial de Comportamiento (Analytics)
  const [analytics, setAnalytics] = useState(() => {
    try {
      const storedAnalytics = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      return storedAnalytics ? JSON.parse(storedAnalytics) : [];
    } catch (error) {
      return [];
    }
  });

  // Efecto para sincronizar cambios de analytics con LocalStorage automáticamente
  useEffect(() => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
  }, [analytics]);

  // --- FUNCIONES (LÓGICA) ---
  
  /**
   * 🛡️ useCallback: MEMORIZACIÓN DE FUNCIONES
   * Envolvemos trackBehavior en useCallback. 
   * Esto asegura que la función sea EXACTAMENTE la misma referencia en memoria 
   * entre renderizados. Esto evita que los useEffect en otros componentes 
   * se disparen infinitamente.
   */
  const trackBehavior = useCallback((action, detail = {}) => {
    const newEvent = {
      action,
      detail,
      timestamp: new Date().toISOString(),
      path: window.location.pathname // Rastrear dónde ocurrió
    };

    // Usamos el callback del setter (prev => ...) para no depender de 'analytics' en las dependencias
    setAnalytics(prev => [...prev, newEvent]);
    
    // Log para desarrollo
    console.log('📊 Analytics Tracked:', newEvent);
  }, []); // [] significa: "Esta función nunca cambia, créala una sola vez al inicio".

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    // Podemos llamar a trackBehavior aquí porque es estable gracias al useCallback anterior
    trackBehavior('login', { method: 'form_submit' }); 
  }, [trackBehavior]); // Dependencia: Solo se recrea si trackBehavior cambia (que no pasará).

  const logout = useCallback(() => {
    setUser(null);
    setAnalytics([]); 
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    window.location.href = '/'; 
  }, []);

  // --- VALUE (OBJETO A COMPARTIR) ---

  /**
   * 🧠 useMemo: MEMORIZACIÓN DE VALORES
   * Si no usamos useMemo, este objeto se crea de nuevo cada milisegundo que algo cambia,
   * obligando a TODA la app a renderizarse de nuevo.
   * Con useMemo, solo cambia si 'user' o 'analytics' cambian.
   */
  const value = useMemo(() => ({
    user,
    analytics,
    login,
    logout,
    trackBehavior
  }), [user, analytics, login, logout, trackBehavior]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 3. Hook personalizado para consumir el contexto fácilmente
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};