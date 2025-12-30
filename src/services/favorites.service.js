```javascript
// src/services/favorites.service.js
import { db } from '../firebase/config';
import { UserRepository } from '../repositories/user.repository';

const userRepository = new UserRepository(db);

/**
 * Servicio para gestionar favoritos en Firestore.
 * Sigue el principio de responsabilidad única del Manual de Arquitectura.
 * REFACTORIZADO: Ene 2026 - Uso de UserRepository
 */

// Agrega un ID al array de favoritos del usuario
export const agregarFavoritoAPI = async (uid, modeloId) => {
  try {
    return await userRepository.addFavorite(uid, modeloId);
  } catch (error) {
    console.error("Error al agregar favorito:", error);
    return false;
  }
};

// Elimina un ID del array
export const eliminarFavoritoAPI = async (uid, modeloId) => {
  try {
    return await userRepository.removeFavorite(uid, modeloId);
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    return false;
  }
};

// Obtiene la lista actual (útil para la carga inicial)
export const obtenerFavoritosAPI = async (uid) => {
  try {
    return await userRepository.getFavorites(uid);
  } catch (error) {
    console.error("Error obteniendo favoritos:", error);
    return [];
  }
};
```