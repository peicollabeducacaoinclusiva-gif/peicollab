import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'pei-collab-favorites';

export function useFavorites(userId: string | undefined) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`${FAVORITES_STORAGE_KEY}-${userId}`);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavorites([]);
    }
  }, [userId]);

  const toggleFavorite = useCallback((appId: string) => {
    if (!userId) return;

    setFavorites(prev => {
      const newFavorites = prev.includes(appId)
        ? prev.filter(id => id !== appId)
        : [...prev, appId];
      
      try {
        localStorage.setItem(
          `${FAVORITES_STORAGE_KEY}-${userId}`,
          JSON.stringify(newFavorites)
        );
      } catch (error) {
        console.error('Erro ao salvar favoritos:', error);
      }
      
      return newFavorites;
    });
  }, [userId]);

  const isFavorite = useCallback((appId: string) => {
    return favorites.includes(appId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}

