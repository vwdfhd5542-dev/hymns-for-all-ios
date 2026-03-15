import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Song, songs } from "@/data/songs";
import { Heart } from "lucide-react";

interface SongLibraryProps {
  onSongSelect: (song: Song) => void;
  isFavorite: (id: string) => boolean;
  filterFavorites?: boolean;
}

export function SongLibrary({ onSongSelect, isFavorite, filterFavorites = false }: SongLibraryProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = filterFavorites ? songs.filter((s) => isFavorite(s.id)) : songs;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.collection.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, filterFavorites, isFavorite]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-14 pb-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {filterFavorites ? "Favorite" : "Cântări"}
        </h1>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-card rounded-lg px-3 py-2.5">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Caută o cântare..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm w-full outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto pb-24">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">
              {filterFavorites ? "Nu ai cântări favorite încă." : "Nicio cântare găsită."}
            </p>
          </div>
        )}
        {filtered.map((song) => (
          <button
            key={song.id}
            onClick={() => onSongSelect(song)}
            className="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-card transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {song.artist} · {song.collection}
              </p>
            </div>
            {isFavorite(song.id) && (
              <Heart size={14} className="text-accent shrink-0" fill="currentColor" />
            )}
            <span className="text-muted-foreground text-lg">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
