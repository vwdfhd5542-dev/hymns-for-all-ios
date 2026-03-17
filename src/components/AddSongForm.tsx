import { useState, useMemo } from "react";
import { X, Sparkles, Plus, Loader2 } from "lucide-react";
import { useAddSong, useSongs } from "@/hooks/useSongs";
import { useCollections, useAddCollection } from "@/hooks/useCollections";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface AddSongFormProps {
  onClose: () => void;
}

export function AddSongForm({ onClose }: AddSongFormProps) {
  const { data: songs = [] } = useSongs();
  const { data: dbCollections = [] } = useCollections();
  const addCollection = useAddCollection();

  const collections = useMemo(() => {
    const unique = new Set(songs.map(s => s.collection));
    ["Speranța", "Boanerges", "Hymns", "Eldad", "Elim Harmony"].forEach(c => unique.add(c));
    dbCollections.forEach(c => unique.add(c.name));
    return Array.from(unique).sort();
  }, [songs, dbCollections]);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [collection, setCollection] = useState("Hymns");
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewCol, setShowNewCol] = useState(false);
  const [newColName, setNewColName] = useState("");
  const addSong = useAddSong();
  const { t } = useLanguage();

  const handleAddCollection = () => {
    const name = newColName.trim();
    if (!name) return;
    addCollection.mutate({ name }, {
      onSuccess: () => {
        setCollection(name);
        setNewColName("");
        setShowNewCol(false);
        toast.success(t("collections.created"));
      },
    });
  };

  const handleAutoChords = async () => {
    if (!lyrics.trim()) {
      toast.error(t("addSong.lyricsRequired"));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-chords", {
        body: { title: title.trim() || "Song", artist: artist.trim() || "Unknown", lyrics: lyrics.trim() },
      });
      if (error) throw error;
      if (data?.lyrics && data.lyrics.includes("[")) {
        setLyrics(data.lyrics);
        toast.success(t("addSong.chordsAdded"));
      } else {
        toast.info("No se pudieron generar acordes.");
      }
    } catch (err: any) {
      console.error("Auto-chords error:", err);
      toast.error("Error al generar acordes con IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !lyrics.trim()) {
      toast.error(t("addSong.titleRequired"));
      return;
    }
    addSong.mutate(
      { title: title.trim(), artist: artist.trim() || t("addSong.unknown"), collection, lyrics: lyrics.trim() },
      {
        onSuccess: () => {
          toast.success(t("addSong.added"));
          onClose();
        },
        onError: () => toast.error(t("addSong.error")),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right">
      <div className="glass border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
          <button onClick={onClose} className="text-primary text-sm font-medium min-w-[60px]">{t("addSong.cancel")}</button>
          <h2 className="font-bold text-base">{t("addSong.title")}</h2>
          <button
            onClick={handleSubmit}
            disabled={addSong.isPending}
            className="text-primary text-sm font-bold disabled:opacity-50 min-w-[60px] text-right"
          >
            {addSong.isPending ? "..." : t("addSong.save")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">{t("addSong.songTitle")}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("addSong.songTitlePlaceholder")}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">{t("addSong.artist")}</label>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={t("addSong.artistPlaceholder")}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">{t("addSong.collection")}</label>
          <div className="flex gap-2 flex-wrap">
            {collections.map((col) => (
              <button key={col} onClick={() => setCollection(col)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  collection === col ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                }`}>{col}</button>
            ))}
            <button onClick={() => setShowNewCol(true)}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-card border border-dashed border-border text-muted-foreground flex items-center gap-1">
              <Plus size={14} /> Nueva
            </button>
          </div>
          {showNewCol && (
            <div className="flex gap-2 mt-2">
              <input value={newColName} onChange={e => setNewColName(e.target.value)}
                placeholder={t("collections.namePlaceholder")} autoFocus
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={handleAddCollection} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
                {t("collections.create")}
              </button>
              <button onClick={() => { setShowNewCol(false); setNewColName(""); }} className="px-2 py-2 bg-card border border-border rounded-xl">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground font-medium">{t("addSong.lyrics")}</label>
            <button onClick={handleAutoChords} disabled={!lyrics.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold disabled:opacity-40 transition-all active:scale-95">
              <Sparkles size={13} />
              {t("addSong.aiChords")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mb-2">
            {t("addSong.lyricsHint")}
          </p>
          <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
            placeholder={`Aleluia, slavă Domnului,\nAleluia, slavă Regelui,\nEl domnește peste tot,\nSlavă veșnică doar Lui.`}
            rows={16}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary transition-colors resize-none" />
        </div>
      </div>
    </div>
  );
}
