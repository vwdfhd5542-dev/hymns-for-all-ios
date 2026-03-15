import { useState } from "react";
import { X, Plus, Music } from "lucide-react";
import { useAddSong } from "@/hooks/useSongs";
import { toast } from "sonner";

const COLLECTIONS = ["Speranța", "Boanerges", "Hymns"];

interface AddSongFormProps {
  onClose: () => void;
}

export function AddSongForm({ onClose }: AddSongFormProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [collection, setCollection] = useState("Hymns");
  const [lyrics, setLyrics] = useState("");
  const addSong = useAddSong();

  const handleSubmit = () => {
    if (!title.trim() || !lyrics.trim()) {
      toast.error("Titlul și versurile sunt obligatorii");
      return;
    }
    addSong.mutate(
      { title: title.trim(), artist: artist.trim() || "Necunoscut", collection, lyrics: lyrics.trim() },
      {
        onSuccess: () => {
          toast.success("Cântarea a fost adăugată!");
          onClose();
        },
        onError: () => toast.error("Eroare la salvare"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="glass border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
          <button onClick={onClose} className="text-primary text-sm font-medium">Anulează</button>
          <h2 className="font-bold text-base">Cântare nouă</h2>
          <button
            onClick={handleSubmit}
            disabled={addSong.isPending}
            className="text-primary text-sm font-bold disabled:opacity-50"
          >
            {addSong.isPending ? "..." : "Salvează"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
        {/* Title */}
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Titlu</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Numele cântării"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Artist */}
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Artist</label>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Numele artistului"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Collection */}
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Colecția</label>
          <div className="flex gap-2">
            {COLLECTIONS.map((col) => (
              <button
                key={col}
                onClick={() => setCollection(col)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  collection === col
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Lyrics */}
        <div className="flex-1">
          <label className="text-xs text-muted-foreground font-medium mb-1 block">
            Versuri cu acorduri
          </label>
          <p className="text-[11px] text-muted-foreground/70 mb-2">
            Folosește paranteze pătrate pentru acorduri: [Am]Text [G]versuri. 
            Acorduri complexe: [Cmaj7], [Dm7b5], [G7sus4]
          </p>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={`[Am]Isus, Tu ești [F]viața mea,\n[C]Tu ești tot ce [G]am nevoie,`}
            rows={16}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
