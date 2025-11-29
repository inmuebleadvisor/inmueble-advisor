// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// ✅ CORRECCIÓN: Importamos las instancias YA INICIALIZADAS de tu archivo config.js
// No necesitamos 'app' ni 'getAuth' aquí, porque ya los exportas listos.
import { auth, db, googleProvider } from '../firebase/config';

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

import { doc, getDoc, setDoc } from 'firebase/firestore';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  // 'user': Datos técnicos de autenticación (Google)
  const [user, setUser] = useState(null);
  
  // 'userProfile': Datos de negocio en Firestore (Rol, Onboarding, Teléfono, etc.)
  const [userProfile, setUserProfile] = useState(null);
  
  // 'loadingUser': Para saber si aún estamos comprobando la sesión al cargar la página
  const [loadingUser, setLoadingUser] = useState(true);

  /**
   * 1. ESCUCHA DE SESIÓN (PERSISTENCIA)
   * Detecta si el usuario ya estaba logueado al recargar la página.
   */
  useEffect(() => {
    // Usamos 'auth' importado de tu config
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingUser(true);
      
      if (currentUser) {
        setUser(currentUser);
        // Si hay usuario, buscamos sus datos extra en Firestore
        await fetchUserProfile(currentUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * 2. OBTENER PERFIL DE FIRESTORE
   * Busca el documento del usuario en la colección "users"
   */
  const fetchUserProfile = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        // Usuario logueado pero sin registro en DB (Caso raro o usuario nuevo sin terminar proceso)
        console.log("Usuario sin perfil completo en DB.");
        setUserProfile(null); 
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
    }
  };

  /**
   * 3. LOGIN CON GOOGLE
   * Maneja la ventana emergente y crea el registro básico si es nuevo.
   */
  const loginWithGoogle = async (rolInicial = 'cliente') => {
    try {
      // Usamos 'auth' y 'googleProvider' de tu config
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Verificamos si ya existe en Firestore para no borrar datos previos
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // CREACIÓN DE USUARIO NUEVO
        const nuevoUsuario = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nombre: firebaseUser.displayName,
          foto: firebaseUser.photoURL,
          role: rolInicial, // 'cliente' o 'asesor'
          fechaRegistro: new Date().toISOString(),
          onboardingCompleto: false // Bandera clave para saber si redirigir al Wizard
        };
        
        await setDoc(docRef, nuevoUsuario);
        setUserProfile(nuevoUsuario); // Actualizamos estado local
      } else {
        // USUARIO EXISTENTE: Solo cargamos sus datos
        setUserProfile(docSnap.data());
      }

      return firebaseUser;
    } catch (error) {
      console.error("Error en login Google:", error);
      throw error;
    }
  };

  /**
   * 4. LOGOUT
   */
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  /**
   * 5. ACTUALIZAR PERFIL MANUALMENTE
   * Útil para llamar después de que el usuario termine el Onboarding sin recargar la página.
   */
  const syncProfile = async () => {
    if (user) await fetchUserProfile(user.uid);
  };

  /**
   * 6. TRACKING (Placeholder)
   */
  const trackBehavior = (action, details) => {
    console.log(`[TRACKING] ${action}:`, details);
  };

  const value = {
    user,           // Objeto Auth
    userProfile,    // Objeto Firestore
    loadingUser,    // Bool Carga
    loginWithGoogle,
    logout,
    trackBehavior,
    syncProfile
  };

  return (
    <UserContext.Provider value={value}>
      {/* Renderizamos 'children' solo cuando sabemos el estado de la sesión para evitar parpadeos */}
      {!loadingUser && children} 
    </UserContext.Provider>
  );
};