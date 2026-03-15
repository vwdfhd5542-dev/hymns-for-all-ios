import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("song_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r: any) => r.song_id);
    },
  });

  const addFav = useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from("user_favorites")
        .insert({ user_id: user!.id, song_id: songId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", user?.id] }),
  });

  const removeFav = useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user!.id)
        .eq("song_id", songId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", user?.id] }),
  });

  const toggleFavorite = useCallback(
    (songId: string) => {
      if (favorites.includes(songId)) {
        removeFav.mutate(songId);
      } else {
        addFav.mutate(songId);
      }
    },
    [favorites, addFav, removeFav]
  );

  const isFavorite = useCallback(
    (songId: string) => favorites.includes(songId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
