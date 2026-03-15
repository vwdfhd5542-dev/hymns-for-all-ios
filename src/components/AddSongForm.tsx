import { useState, useMemo } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { useAddSong, useSongs } from "@/hooks/useSongs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

interface AddSongFormProps {
  onClose: () => void;
}

export function AddSongForm({ onClose }: AddSongFormProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [collection, setCollection] = useState("Hymns");
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const addSong = useAddSong();
  const { t } = useLanguage();

  const handleAutoChords = async () => {
    if (!lyrics.trim()) {
      toast.error(t("addSong.lyricsRequired"));
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-chords", {
        body: { title: title.trim(), artist: artist.trim(), lyrics: lyrics.trim() },
      });
      if (error) throw error;
      if (data?.lyrics) {
        setLyrics(data.lyrics);
        toast.success(t("addSong.chordsAdded"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("addSong.chordsError"));
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
            {COLLECTIONS.map((col) => (
              <button key={col} onClick={() => setCollection(col)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  collection === col ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                }`}>{col}</button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground font-medium">{t("addSong.lyrics")}</label>
            <button onClick={handleAutoChords} disabled={isGenerating || !lyrics.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold disabled:opacity-40 transition-all active:scale-95">
              {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {isGenerating ? t("addSong.generating") : t("addSong.aiChords")}
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
