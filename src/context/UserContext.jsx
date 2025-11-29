// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
// 1. Importamos los servicios reales de Firebase que configuramos
import { auth, googleProvider, db } from '../firebase/config';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Clave para guardar analytics localmente si no hay red (opcional)
const ANALYTICS_STORAGE_KEY = 'inmueble_analytics_data';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  
  // --- ESTADOS ---
  const [user, setUser] = useState(null); // Usuario autenticado (Objeto Firebase + Datos nuestros)
  const [loading, setLoading] = useState(true); // "Cargando..." mientras verificamos sesión
  const [analytics, setAnalytics] = useState(() => {
    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // --- ANALYTICS (Mantenemos tu lógica existente) ---
  useEffect(() => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
  }, [analytics]);

  const trackBehavior = useCallback((action, detail = {}) => {
    const newEvent = {
      action,
      detail,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      userId: user?.uid || 'anonimo' // Ahora ligamos el evento al ID real
    };
    setAnalytics(prev => [...prev, newEvent]);
    console.log('📊 Analytics:', newEvent);
  }, [user]);

  // --- AUTENTICACIÓN (NUEVA LÓGICA) ---

  // A. Iniciar Sesión con Google
  const loginWithGoogle = useCallback(async (roleSelection = 'cliente') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Aquí (en el Paso 3) verificaremos si ya existe en Firestore para traer su Rol.
      // Por ahora, devolvemos el usuario básico para que el flujo no se rompa.
      return firebaseUser;
    } catch (error) {
      console.error("Error en login Google:", error);
      throw error;
    }
  }, []);

  // B. Cerrar Sesión
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      trackBehavior('logout');
      // Redirigir al inicio o limpiar estados se maneja en la vista, o aquí si usas router.
      window.location.href = '/'; 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [trackBehavior]);

  // C. Escuchador de Cambios de Sesión (El "Vigilante")
  // Este efecto se ejecuta solo una vez al cargar la app y se queda "oyendo" a Firebase.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        // 1. El usuario hizo login en Firebase
        // En el PASO 3, aquí leeremos su documento de la BD 'users' para saber si es Asesor.
        // Por ahora, asumimos que es un usuario autenticado básico.
        
        const userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          nombre: currentUser.displayName,
          foto: currentUser.photoURL,
          // Placeholder para cuando conectemos la BD en el siguiente paso:
          role: 'cliente', 
          presupuesto: 0 
        };
        
        setUser(userData);
      } else {
        // 2. No hay usuario (Logout o primera visita)
        setUser(null);
      }
      
      setLoading(false); // Terminó de cargar la verificación
    });

    return () => unsubscribe(); // Limpieza al desmontar
  }, []);

  // --- VALUE ---
  const value = useMemo(() => ({
    user,
    loading,      // Exportamos loading para mostrar un spinner si es necesario
    loginWithGoogle, // Reemplaza al antiguo 'login'
    logout,
    trackBehavior
  }), [user, loading, loginWithGoogle, logout, trackBehavior]);

  return (
    <UserContext.Provider value={value}>
      {/* Mientras verifica la sesión, no renderizamos la app para evitar "parpadeos" */}
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser debe ser usado dentro de un UserProvider');
  return context;
};