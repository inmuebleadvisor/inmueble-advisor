// src/services/favorites.service.js
import { db } from '../firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

/**
 * Servicio para gestionar favoritos en Firestore.
 * Sigue el principio de responsabilidad única del Manual de Arquitectura.
 */

// Agrega un ID al array de favoritos del usuario
export const agregarFavoritoAPI = async (uid, modeloId) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      favoritos: arrayUnion(modeloId) // arrayUnion evita duplicados automáticamente
    });
    return true;
  } catch (error) {
    console.error("Error al agregar favorito:", error);
    return false;
  }
};

// Elimina un ID del array
export const eliminarFavoritoAPI = async (uid, modeloId) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      favoritos: arrayRemove(modeloId)
    });
    return true;
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    return false;
  }
};

// Obtiene la lista actual (útil para la carga inicial)
export const obtenerFavoritosAPI = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data().favoritos || [];
    }
    return [];
  } catch (error) {
    console.error("Error obteniendo favoritos:", error);
    return [];
  }
};