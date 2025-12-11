// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // ✅ Importamos updateDoc

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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

  // 1. ESCUCHA DE SESIÓN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingUser(true);
      if (currentUser) {
        setUser(currentUser);
        await fetchUserProfile(currentUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. OBTENER PERFIL
  const fetchUserProfile = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserProfile(docSnap.data());
      else setUserProfile(null);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // 3. LOGIN UNIVERSAL (Sin forzar rol)
  // Si el usuario no existe, se crea como 'cliente' por defecto (Safety First).
  // Si ya existe, NO tocamos su rol.
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Usuario Nuevo -> Nace como Cliente
        const nuevoUsuario = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nombre: firebaseUser.displayName,
          foto: firebaseUser.photoURL,
          role: 'cliente', // 🔒 Default seguro
          fechaRegistro: new Date().toISOString(),
          onboardingCompleto: false
        };
        await setDoc(docRef, nuevoUsuario);
        setUserProfile(nuevoUsuario);
      } else {
        // Usuario Existente -> Respetamos su rol actual
        setUserProfile(docSnap.data());
      }
      return firebaseUser;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  /**
   * ✅ NUEVA FUNCIÓN: TRANSFORMAR EN ASESOR
   * Solo se llama cuando el usuario da clic en "Finalizar" en el Wizard.
   */
  const convertirEnAsesor = async (datosExtra) => {
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);

      // Actualizamos solo los campos necesarios
      const newRole = userProfile?.role === 'admin' ? 'admin' : 'asesor'; // 🔒 PROTECCIÓN: Si es admin, SE QUEDA ADMIN.

      await updateDoc(docRef, {
        role: newRole,
        onboardingCompleto: true,
        fechaRegistroAsesor: new Date().toISOString(),
        ...datosExtra // Telefono, Inventario, etc.
      });

      // Actualizamos el estado local para que la UI reaccione rápido
      await fetchUserProfile(user.uid);

    } catch (error) {
      console.error("Error convirtiendo asesor:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const trackBehavior = (action, details) => {
    console.log(`[TRACKING] ${action}`, details);
  };

  const value = {
    user,
    userProfile,
    loadingUser,
    loginWithGoogle,
    convertirEnAsesor, // 👈 Exportamos la nueva función
    logout,

    trackBehavior,
    // Contexto de Ciudad
    selectedCity,
    updateSelectedCity
  };

  return (
    <UserContext.Provider value={value}>
      {!loadingUser && children}
    </UserContext.Provider>
  );
};