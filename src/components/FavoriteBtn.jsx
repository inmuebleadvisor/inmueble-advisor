// src/components/FavoriteBtn.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useUser } from '../context/UserContext'; // ✅ Importamos para acceder a la sesión

// Componente visual del ícono (Sin cambios lógicos, solo visuales)
const HeartIcon = ({ filled }) => (
  <svg
    width="24" height="24" viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "var(--base-brand-blue)"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'all 0.3s ease', transform: filled ? 'scale(1.1)' : 'scale(0.8)' }}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

export default function FavoriteBtn({ modeloId, style }) {
  // 1. Hooks: Necesitamos herramientas de ambos mundos (Datos y Usuario)
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, loginWithGoogle } = useUser();

  // 2. Estado Local: Para feedback inmediato (loading spinner o deshabilitado)
  const [isLoading, setIsLoading] = useState(false);

  const active = isFavorite(modeloId);

  // 3. Lógica Inteligente del Click
  const handleClick = async (e) => {
    // Importante: Detenemos la propagación para que no se abra la ficha de la propiedad al dar clic al corazón
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return; // Evitamos doble clic accidental

    // --- ESCENARIO A: USUARIO ANÓNIMO ---
    if (!user) {
      try {
        setIsLoading(true); // Bloqueamos botón
        // Lanzamos el Popup de Google
        const usuarioLogueado = await loginWithGoogle();

        // Si el usuario completó el proceso (no cerró la ventana)
        if (usuarioLogueado) {
          // ✨ Magia de UX: Ejecutamos la acción original automáticamente
          await toggleFavorite(modeloId);
        }
      } catch (error) {
        console.log("El usuario canceló el login o hubo un error:", error);
        // No hacemos nada, el usuario decidió no continuar
      } finally {
        setIsLoading(false); // Liberamos el botón
      }
      return;
    }

    // --- ESCENARIO B: USUARIO REGISTRADO ---
    // Simplemente ejecutamos la acción. 
    // Opcional: setIsLoading(true) si queremos esperar a que Firebase confirme la escritura (más seguro pero más lento).
    // Por ahora usamos Optimistic UI desde el Context, así que no bloqueamos.
    toggleFavorite(modeloId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      style={{
        background: 'rgba(255,255,255,0.95)', // Fondo blanco casi sólido para resaltar sobre fotos
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isLoading ? 'wait' : 'pointer', // Cursor de espera si está logueando
        boxShadow: '0 3px 8px rgba(0,0,0,0.15)', // Sombra suave para elevación
        opacity: isLoading ? 0.7 : 1, // Feedback visual de estado
        transition: 'all 0.2s ease',
        ...style // Permite sobrescribir estilos desde el padre (ej. posición absoluta)
      }}
      // Accesibilidad y Tooltip nativo
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={user ? (active ? "Quitar de favoritos" : "Guardar") : "Inicia sesión para guardar"}
    >
      <HeartIcon filled={active} />
    </button>
  );
}