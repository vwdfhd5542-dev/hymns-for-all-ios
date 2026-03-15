import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "hymnsro-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((songId: string) => {
    setFavorites((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  }, []);

  const isFavorite = useCallback(
    (songId: string) => favorites.includes(songId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
