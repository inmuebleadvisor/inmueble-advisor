import React from 'react';
import { useFavorites } from '../context/FavoritesContext';

const HeartIcon = ({ filled }) => (
  <svg 
    width="24" height="24" viewBox="0 0 24 24" 
    fill={filled ? "#ef4444" : "none"} 
    stroke={filled ? "#ef4444" : "currentColor"} 
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'all 0.3s ease' }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

export default function FavoriteBtn({ modeloId, style }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(modeloId);

  return (
    <button 
      onClick={(e) => {
        e.preventDefault(); // Evitar que el clic navegue al detalle si está en una card
        e.stopPropagation();
        toggleFavorite(modeloId);
      }}
      style={{
        background: 'rgba(255,255,255,0.8)',
        border: 'none',
        borderRadius: '50%',
        width: '40px', 
        height: '40px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        ...style
      }}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <HeartIcon filled={active} />
    </button>
  );
}