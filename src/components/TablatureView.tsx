import { useState } from "react";
import { ChevronLeft, Loader2, Guitar, Play, Square, Plus, Minus } from "lucide-react";
import { Song } from "@/data/songs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useTablaturePlayer, transposeParsedTab } from "@/hooks/useTablaturePlayer";
import { TablatureDisplay } from "@/components/TablatureDisplay";

type Level = "basic" | "intermediate" | "advanced";

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
  const { t } = useLanguage();
  const [level, setLevel] = useState<Level>("basic");
  const [mode, setMode] = useState<"chord" | "full">("chord");
  const [tablature, setTablature] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [transpose, setTranspose] = useState(0);
  const player = useTablaturePlayer();

  const rawTab = tablature[mode]?.[level];
  const currentTab = rawTab ? transposeParsedTab(rawTab, transpose) : undefined;

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
        setTranspose(0);
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
                {t(`tab.level.${l}` as any)}
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

          {/* Generation progress indicator */}
          {isLoading && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 size={18} className="animate-spin text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">{t("tab.generatingHint" as any)}</p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%', animation: 'pulse 2s ease-in-out infinite, progressIndeterminate 3s ease-in-out infinite' }} />
              </div>
            </div>
          )}

          {/* Tablature display with player controls */}
          {currentTab && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
              {/* Player + Transpose controls */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <button
                  onClick={() => player.isPlaying ? player.stop() : player.play(currentTab, bpm)}
                  disabled={player.isLoading}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                    player.isPlaying
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {player.isLoading ? <Loader2 size={14} className="animate-spin" /> : player.isPlaying ? <Square size={14} /> : <Play size={16} className="ml-0.5" />}
                </button>

                {/* Progress bar */}
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{ width: `${player.progress * 100}%` }}
                  />
                </div>

                {/* BPM control */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground font-medium">{t("tab.tempo")}</span>
                  <input
                    type="range"
                    min={40}
                    max={200}
                    step={5}
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-14 accent-primary h-1"
                  />
                  <span className="text-[10px] font-mono text-foreground w-7">{bpm}</span>
                </div>
              </div>

              {/* Transpose controls */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Transpose</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTranspose((prev) => Math.max(-12, prev - 1))}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Minus size={14} className="text-foreground" />
                  </button>
                  <span className={`text-xs font-mono w-8 text-center font-semibold ${
                    transpose === 0 ? "text-muted-foreground" : transpose > 0 ? "text-green-600" : "text-red-500"
                  }`}>
                    {transpose > 0 ? `+${transpose}` : transpose}
                  </span>
                  <button
                    onClick={() => setTranspose((prev) => Math.min(12, prev + 1))}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-all"
                  >
                    <Plus size={14} className="text-foreground" />
                  </button>
                  {transpose !== 0 && (
                    <button
                      onClick={() => setTranspose(0)}
                      className="text-[10px] text-primary font-semibold ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Tab content with highlighting */}
              <TablatureDisplay
                tablature={currentTab}
                currentColumn={player.currentColumn}
                isPlaying={player.isPlaying}
              />
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
