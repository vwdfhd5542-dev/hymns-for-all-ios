import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Collection {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Collection[];
    },
  });
}

export function useAddCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (col: { name: string; description?: string }) => {
      const { data, error } = await supabase.from("collections").insert(col).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useCollectionSongs(collectionId: string | null) {
  return useQuery({
    queryKey: ["collection-songs", collectionId],
    enabled: !!collectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_songs")
        .select("song_id")
        .eq("collection_id", collectionId!)
        .order("position");
      if (error) throw error;
      return data.map(r => r.song_id);
    },
  });
}

export function useAddSongToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, songId }: { collectionId: string; songId: string }) => {
      const { error } = await supabase.from("collection_songs").insert({ collection_id: collectionId, song_id: songId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection-songs"] }),
  });
}

export function useRemoveSongFromCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ collectionId, songId }: { collectionId: string; songId: string }) => {
      const { error } = await supabase.from("collection_songs").delete().eq("collection_id", collectionId).eq("song_id", songId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection-songs"] }),
  });
}
