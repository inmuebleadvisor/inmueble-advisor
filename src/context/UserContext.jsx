
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useService } from '../hooks/useService';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const { auth, analytics } = useService(); // Inject AuthService and AnalyticsService

  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // ⭐ NUEVO CONSTEXTO: Ciudad Seleccionada (Global Preference)
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('user_selected_city') || null;
  });

  const updateSelectedCity = (city) => {
    setSelectedCity(city);
    if (city) {
      localStorage.setItem('user_selected_city', city);
    } else {
      localStorage.removeItem('user_selected_city');
    }
  };

  // 1. ESCUCHA DE SESIÓN (Delegated to Service)
  useEffect(() => {
    const unsubscribe = auth.subscribeToAuthChanges((currentUser, currentProfile) => {
      setLoadingUser(true);

      setUser(currentUser);
      setUserProfile(currentProfile);

      setLoadingUser(false);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);



  // 2. OBTENER PERFIL (Handled internally by subscribeToAuthChanges usually, 
  // but if needed explicitly we can expose it via service or just trust the listener)
  // The original code had a fetchUserProfile function used in listener and manually.
  // The listener in AuthService already fetches it.

  // 3. LOGIN UNIVERSAL
  const loginWithGoogle = async () => {
    try {
      const { user: firebaseUser, profile } = await auth.loginWithGoogle();
      // State updates handled by listener usually, but for immediate feedback:
      // Actually listener fires on auth state change.
      return firebaseUser;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  /**
   * ✅ NUEVA FUNCIÓN: TRANSFORMAR EN ASESOR
   */
  const convertirEnAsesor = async (datosExtra) => {
    if (!user) return;

    try {
      const updatedProfile = await auth.convertToAdvisor(user.uid, userProfile?.role, datosExtra);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error convirtiendo asesor:", error);
      throw error;
    }
  };

  const logout = async () => {
    await auth.logout();
    // Listener will handle nullifying state
  };

  const trackBehavior = (action, details) => {
    analytics.trackEvent(action, details);
  };

  const value = {
    user,
    userProfile,
    loadingUser,
    loginWithGoogle,
    convertirEnAsesor,
    logout,

    trackBehavior,
    // Contexto de Ciudad
    selectedCity,
    updateSelectedCity
  };

  return (
    <UserContext.Provider value={value}>
      {!initialLoading && children}
    </UserContext.Provider>
  );
};