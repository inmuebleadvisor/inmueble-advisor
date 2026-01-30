// src/components/FavoriteBtn.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState } from 'react';
import { useFavorites } from '../../context/FavoritesContext';
import { useUser } from '../../context/UserContext';
import '../../styles/components/FavoriteBtn.css';

// Componente visual del ícono
const HeartIcon = ({ filled }) => (
  <svg
    className={`favorite-btn__icon ${filled ? 'favorite-btn__icon--active' : ''}`}
    width="24" height="24" viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "var(--base-brand-blue)"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

export default function FavoriteBtn({ modeloId, style }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, loginWithGoogle } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const active = isFavorite(modeloId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    if (!user) {
      try {
        setIsLoading(true);
        const usuarioLogueado = await loginWithGoogle();
        if (usuarioLogueado) {
          await toggleFavorite(modeloId);
        }
      } catch (error) {
        console.log("El usuario canceló el login o hubo un error:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    toggleFavorite(modeloId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="favorite-btn"
      style={style} // Keep style prop for positioning overrides only
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={user ? (active ? "Quitar de favoritos" : "Guardar") : "Inicia sesión para guardar"}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
