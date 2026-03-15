import { Search, X, Music, Plus, Heart, Trash2 } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Song } from "@/data/songs";
import { PitchDetector } from "./PitchDetector";
import { useSongs, useDeleteSong } from "@/hooks/useSongs";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface SongLibraryProps {
  onSongSelect: (song: Song) => void;
  isFavorite: (id: string) => boolean;
  filterFavorites?: boolean;
  onAddSong?: () => void;
}

const COLLECTIONS = ["Toate", "Speranța", "Boanerges", "Hymns", "Grupul Eldad", "Elim Harmony"];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!?'"„""''«»\-–—()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getSongKey(song: Song): string {
  const match = song.lyrics.match(/\[([A-G][#b]?m?)/);
  return match ? match[1] : "?";
}

export function SongLibrary({ onSongSelect, isFavorite, filterFavorites = false, onAddSong }: SongLibraryProps) {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("Toate");
  const { data: songs = [], isLoading } = useSongs();
  const { t } = useLanguage();

  const filtered = useMemo(() => {
    let list = filterFavorites ? songs.filter((s) => isFavorite(s.id)) : songs;
    if (activeCollection !== "Toate") {
      list = list.filter((s) => s.collection === activeCollection);
    }
    if (query.trim()) {
      const q = normalize(query);
      list = list.filter(
        (s) =>
          normalize(s.title).includes(q) ||
          normalize(s.artist).includes(q) ||
          normalize(s.collection).includes(q) ||
          normalize(s.lyrics).includes(q)
      );
    }
    return list;
  }, [query, filterFavorites, isFavorite, activeCollection, songs]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 safe-top pb-3">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Music size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {filterFavorites ? t("library.favorites") : t("library.title")}
              </h1>
              {!filterFavorites && (
                <p className="text-xs text-primary font-medium">{t("library.subtitle")}</p>
              )}
            </div>
          </div>
          {onAddSong && (
            <button onClick={onAddSong} className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plus size={20} className="text-primary" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t("library.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!filterFavorites && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {COLLECTIONS.map((col, i) => (
            <button
              key={col}
              onClick={() => setActiveCollection(col)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCollection === col
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {i === 0 ? t("library.all") : col}
            </button>
          ))}
        </div>
      )}

      <PitchDetector />

      <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">
              {filterFavorites ? t("library.noFavorites") : t("library.noResults")}
            </p>
          </div>
        )}
        {filtered.map((song) => {
          const songKey = getSongKey(song);
          return (
            <SwipeSongCard
              key={song.id}
              song={song}
              songKey={songKey}
              isFavorite={isFavorite(song.id)}
              onSelect={() => onSongSelect(song)}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
