import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/data/songs";

export type DbSong = {
  id: string;
  title: string;
  artist: string;
  collection: string;
  lyrics: string;
  created_at: string;
  updated_at: string;
};

function dbToSong(db: DbSong): Song {
  return { id: db.id, title: db.title, artist: db.artist, collection: db.collection, lyrics: db.lyrics };
}

export function useSongs() {
  return useQuery({
    queryKey: ["songs"],
    queryFn: async (): Promise<Song[]> => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .order("title");
      if (error) throw error;
      return (data as DbSong[]).map(dbToSong);
    },
  });
}

export function useAddSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (song: { title: string; artist: string; collection: string; lyrics: string }) => {
      const { data, error } = await supabase.from("songs").insert(song).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });
}

export function useUpdateSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; artist?: string; collection?: string; lyrics?: string }) => {
      const { data, error } = await supabase.from("songs").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });
}

export function useDeleteSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("songs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["songs"] }),
  });
}
