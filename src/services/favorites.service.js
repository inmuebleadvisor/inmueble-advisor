
// src/services/favorites.service.js
// REFACTORIZADO: Ene 2026 - Clase con Inyección de Dependencias

export class FavoritesService {
  /**
   * @param {Object} userRepository - Repositorio de usuarios
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Agrega un ID al array de favoritos del usuario
   * @param {string} uid - ID del usuario
   * @param {string} modeloId - ID del modelo a agregar
   * @returns {Promise<boolean>}
   */
  async addFavorite(uid, modeloId) {
    try {
      return await this.userRepository.addFavorite(uid, modeloId);
    } catch (error) {
      console.error("Error al agregar favorito:", error);
      return false;
    }
  }

  /**
   * Elimina un ID del array de favoritos
   * @param {string} uid - ID del usuario
   * @param {string} modeloId - ID del modelo a eliminar
   * @returns {Promise<boolean>}
   */
  async removeFavorite(uid, modeloId) {
    try {
      return await this.userRepository.removeFavorite(uid, modeloId);
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
      return false;
    }
  }

  /**
   * Obtiene la lista actual de favoritos
   * @param {string} uid - ID del usuario
   * @returns {Promise<Array>}
   */
  async getFavorites(uid) {
    try {
      return await this.userRepository.getFavorites(uid);
    } catch (error) {
      console.error("Error obteniendo favoritos:", error);
      return [];
    }
  }
}

