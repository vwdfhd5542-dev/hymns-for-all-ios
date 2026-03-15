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

function SwipeSongCard({ song, songKey, isFavorite, onSelect, t }: {
  song: Song; songKey: string; isFavorite: boolean; onSelect: () => void; t: (key: any) => string;
}) {
  const deleteSong = useDeleteSong();
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(dy) > Math.abs(dx)) { setSwiping(false); return; }
      locked.current = true;
    }
    if (dx < 0) setOffsetX(Math.max(dx, -90));
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (offsetX < -50) setOffsetX(-80);
    else setOffsetX(0);
  };

  const handleDelete = () => {
    deleteSong.mutate(song.id, {
      onSuccess: () => toast.success(t("song.deleted" as any)),
      onError: () => toast.error(t("song.deleteError" as any)),
    });
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Delete button behind */}
        <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-destructive rounded-r-xl">
          <button onClick={() => setShowConfirm(true)} className="flex flex-col items-center gap-1 text-destructive-foreground">
            <Trash2 size={20} />
            <span className="text-[10px] font-medium">{t("song.delete" as any)}</span>
          </button>
        </div>
        {/* Card */}
        <div
          className="relative bg-card border border-border p-4 rounded-xl active:scale-[0.98] transition-transform"
          style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.3s ease' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => { if (offsetX === 0) onSelect(); else setOffsetX(0); }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {song.artist} • {song.collection}
              </p>
              <div className="flex gap-2 mt-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  ♪ {t("library.chords" as any)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  ☰ {t("library.lyrics" as any)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {songKey}
              </div>
              <Heart
                size={20}
                className={isFavorite ? "text-primary" : "text-muted-foreground/40"}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold mb-2">{t("song.deleteTitle" as any)}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t("song.deleteConfirm" as any)}</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setOffsetX(0); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium">
                {t("addSong.cancel" as any)}
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium">
                {t("song.delete" as any)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
