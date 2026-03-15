import { useState } from "react";
import { ChevronLeft, Loader2, Guitar, Play, Square } from "lucide-react";
import { Song } from "@/data/songs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useTablaturePlayer } from "@/hooks/useTablaturePlayer";

type Level = "basic" | "intermediate" | "advanced";

const levelLabels: Record<Level, Record<string, string>> = {
  basic: { ro: "Básico", es: "Básico", en: "Basic" },
  intermediate: { ro: "Intermedio", es: "Intermedio", en: "Intermediate" },
  advanced: { ro: "Avansat", es: "Avanzado", en: "Advanced" },
};

const levelColors: Record<Level, string> = {
  basic: "bg-green-500/15 text-green-600 border-green-500/30",
  intermediate: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  advanced: "bg-red-500/15 text-red-600 border-red-500/30",
};

interface TablatureViewProps {
  song: Song;
  onBack: () => void;
}

export function TablatureView({ song, onBack }: TablatureViewProps) {
  const { language, t } = useLanguage();
  const [level, setLevel] = useState<Level>("basic");
  const [mode, setMode] = useState<"chord" | "full">("chord");
  const [tablature, setTablature] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bpm, setBpm] = useState(100);
  const player = useTablaturePlayer();

  const currentTab = tablature[mode]?.[level];

  const generate = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tablature", {
        body: { lyrics: song.lyrics, title: song.title, artist: song.artist, level, mode },
      });
      if (error) throw error;
      if (data?.tablature) {
        setTablature(prev => ({
          ...prev,
          [mode]: { ...(prev[mode] || {}), [level]: data.tablature },
        }));
      }
    } catch (err: any) {
      console.error(err);
      if (err?.status === 429) {
        toast.error(t("tab.rateLimited"));
      } else {
        toast.error(t("tab.error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const levels: Level[] = ["basic", "intermediate", "advanced"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="glass fixed top-0 left-0 right-0 z-40 border-b border-border safe-top">
        <div className="flex items-center h-12 px-2 max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-0.5 text-primary min-w-[44px] min-h-[44px] justify-center">
            <ChevronLeft size={22} />
            <span className="text-sm font-medium -ml-1">{t("song.back")}</span>
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold">{t("tab.title")}</span>
          </div>
          <div className="min-w-[44px]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 px-4" style={{ paddingTop: "5rem" }}>
        <div className="max-w-3xl mx-auto">
          {/* Song info */}
          <div className="mb-4 bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Guitar size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight truncate">{song.title}</h2>
                <p className="text-xs text-muted-foreground">{song.artist}</p>
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
            <button
              onClick={() => setMode("chord")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                mode === "chord" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t("tab.chordPatterns")}
            </button>
            <button
              onClick={() => setMode("full")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                mode === "full" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t("tab.fullSong")}
            </button>
          </div>

          {/* Level selector */}
          <div className="flex gap-2 mb-4">
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                  level === l ? levelColors[l] : "bg-card border-border text-muted-foreground"
                }`}
              >
                {levelLabels[l][language] || levelLabels[l].en}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98] mb-4"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("tab.generating")}
              </>
            ) : (
              <>
                <Guitar size={16} />
                {currentTab ? t("tab.regenerate") : t("tab.generate")}
              </>
            )}
          </button>

          {/* Tablature display */}
          {currentTab && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
              {/* Player controls */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button
                  onClick={() => player.isPlaying ? player.stop() : player.play(currentTab, bpm)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    player.isPlaying 
                      ? "bg-destructive text-destructive-foreground" 
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {player.isPlaying ? <Square size={14} /> : <Play size={16} className="ml-0.5" />}
                </button>

                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{ width: `${player.progress * 100}%` }}
                  />
                </div>

                {/* BPM control */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-medium">{t("tab.tempo")}</span>
                  <input
                    type="range"
                    min={40}
                    max={200}
                    step={5}
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-16 accent-primary h-1"
                  />
                  <span className="text-[10px] font-mono text-foreground w-8">{bpm}</span>
                </div>
              </div>

              {/* Tab content */}
              <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-[11px] leading-[1.5] text-foreground whitespace-pre overflow-x-auto scrollbar-none">
                  {currentTab}
                </pre>
              </div>
            </div>
          )}

          {!currentTab && !isLoading && (
            <div className="text-center py-12">
              <Guitar size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{t("tab.empty")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
