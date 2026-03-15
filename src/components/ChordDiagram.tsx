import { useState } from "react";
import { chordDiagrams, ChordDiagramData } from "@/data/chordDiagrams";
import { pianoChords, PianoChordData } from "@/data/pianoChords";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Guitar, Piano, Loader2, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useTablaturePlayer } from "@/hooks/useTablaturePlayer";
import { toast } from "sonner";

interface ChordDiagramProps {
  chord: string | null;
  open: boolean;
  onClose: () => void;
}

function GuitarDiagram({ data }: { data: ChordDiagramData }) {
  const numFrets = 5;
  const numStrings = 6;
  const w = 160;
  const h = 200;
  const padTop = 38;
  const padLeft = 28;
  const padRight = 12;
  const fretH = (h - padTop - 30) / numFrets;
  const strW = (w - padLeft - padRight) / (numStrings - 1);

  const minFret = Math.min(...data.frets.filter(f => f > 0));
  const maxFret = Math.max(...data.frets.filter(f => f > 0));
  const baseFret = data.baseFret || (maxFret <= 5 ? 1 : minFret);
  const isOpenPosition = baseFret === 1;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px] mx-auto" aria-label={`Chord diagram for ${data.name}`}>
      {isOpenPosition ? (
        <rect x={padLeft - 2} y={padTop - 3} width={strW * (numStrings - 1) + 4} height={5}
          rx={2} className="fill-foreground" />
      ) : (
        <text x={padLeft - 14} y={padTop + fretH / 2 + 4}
          className="fill-muted-foreground text-[11px] font-bold" textAnchor="middle">
          {baseFret}
        </text>
      )}

      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line key={`fret-${i}`}
          x1={padLeft} y1={padTop + i * fretH}
          x2={padLeft + strW * (numStrings - 1)} y2={padTop + i * fretH}
          className="stroke-border" strokeWidth={1.5} />
      ))}

      {Array.from({ length: numStrings }).map((_, i) => (
        <line key={`str-${i}`}
          x1={padLeft + i * strW} y1={padTop}
          x2={padLeft + i * strW} y2={padTop + numFrets * fretH}
          className="stroke-muted-foreground/50" strokeWidth={1.2} />
      ))}

      {data.barres?.map((barre, bi) => {
        const fretPos = barre.fret - baseFret + 1;
        if (fretPos < 1 || fretPos > numFrets) return null;
        const y = padTop + (fretPos - 0.5) * fretH;
        const x1 = padLeft + barre.from * strW;
        const x2 = padLeft + barre.to * strW;
        return (
          <g key={`barre-${bi}`}>
            <rect
              x={x1 - 4} y={y - 7} width={x2 - x1 + 8} height={14}
              rx={7} className="fill-primary" opacity={0.9} />
            <text x={(x1 + x2) / 2} y={y + 4}
              className="fill-primary-foreground text-[9px] font-bold" textAnchor="middle">
              {data.fingers[barre.from] || 1}
            </text>
          </g>
        );
      })}

      {data.frets.map((fret, i) => {
        const x = padLeft + i * strW;
        if (fret === -1) {
          return (
            <text key={`m-${i}`} x={x} y={padTop - 10}
              className="fill-muted-foreground text-[12px] font-bold" textAnchor="middle">
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle key={`o-${i}`} cx={x} cy={padTop - 12} r={5}
              className="fill-none stroke-muted-foreground" strokeWidth={1.5} />
          );
        }
        const fretPos = fret - baseFret + 1;
        if (fretPos < 1 || fretPos > numFrets) return null;
        const y = padTop + (fretPos - 0.5) * fretH;
        const hasBarre = data.barres?.some(b =>
          fret === b.fret && i >= b.from && i <= b.to
        );
        if (hasBarre) return null;
        const finger = data.fingers[i];
        return (
          <g key={`d-${i}`}>
            <circle cx={x} cy={y} r={8} className="fill-primary" />
            {finger > 0 && (
              <text x={x} y={y + 3.5}
                className="fill-primary-foreground text-[9px] font-bold" textAnchor="middle">
                {finger}
              </text>
            )}
          </g>
        );
      })}

      {["E", "A", "D", "G", "B", "e"].map((s, i) => (
        <text key={`lbl-${i}`} x={padLeft + i * strW} y={h - 6}
          className="fill-muted-foreground text-[9px]" textAnchor="middle">
          {s}
        </text>
      ))}
    </svg>
  );
}

function PianoDiagram({ data }: { data: PianoChordData }) {
  const whiteW = 28;
  const whiteH = 90;
  const blackW = 18;
  const blackH = 56;
  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys: Record<string, number> = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };
  const totalW = whiteW * 7;
  const padTop = 10;

  const noteSet = new Set(data.notes);

  return (
    <svg viewBox={`0 0 ${totalW + 4} ${whiteH + padTop + 20}`} className="w-full max-w-[220px] mx-auto">
      {whiteKeys.map((key, i) => {
        const x = 2 + i * whiteW;
        const isActive = noteSet.has(key);
        return (
          <g key={`w-${key}`}>
            <rect x={x} y={padTop} width={whiteW - 2} height={whiteH}
              rx={3}
              className={isActive ? "fill-primary stroke-primary" : "fill-background stroke-border"}
              strokeWidth={1} />
            {isActive && (
              <text x={x + (whiteW - 2) / 2} y={padTop + whiteH - 10}
                className="fill-primary-foreground text-[10px] font-bold" textAnchor="middle">
                {key}
              </text>
            )}
          </g>
        );
      })}

      {Object.entries(blackKeys).map(([key, idx]) => {
        const x = 2 + (idx + 1) * whiteW - blackW / 2;
        const isActive = noteSet.has(key);
        return (
          <g key={`b-${key}`}>
            <rect x={x} y={padTop} width={blackW} height={blackH}
              rx={2}
              className={isActive ? "fill-primary" : "fill-foreground"}
              strokeWidth={0} />
            {isActive && (
              <text x={x + blackW / 2} y={padTop + blackH - 8}
                className="fill-primary-foreground text-[8px] font-bold" textAnchor="middle">
                {key}
              </text>
            )}
          </g>
        );
      })}

      <text x={totalW / 2 + 2} y={whiteH + padTop + 14}
        className="fill-muted-foreground text-[10px]" textAnchor="middle">
        {data.notes.join(" – ")}
      </text>
    </svg>
  );
}

type ChordLevel = "basic" | "intermediate" | "advanced";

function FingerpickingTab({ chord }: { chord: string }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Record<ChordLevel, string>>({} as any);
  const [level, setLevel] = useState<ChordLevel>("basic");
  const [loading, setLoading] = useState(false);
  const player = useTablaturePlayer();

  const currentTab = tab[level];

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tablature", {
        body: { lyrics: `[${chord}]`, title: "", artist: "", level, mode: "chord" },
      });
      if (error) throw error;
      if (data?.tablature) {
        setTab(prev => ({ ...prev, [level]: data.tablature }));
      }
    } catch {
      toast.error(t("tab.error"));
    } finally {
      setLoading(false);
    }
  };

  const levels: ChordLevel[] = ["basic", "intermediate", "advanced"];
  const levelEmojis: Record<ChordLevel, string> = { basic: "🟢", intermediate: "🟡", advanced: "🔴" };

  return (
    <div className="space-y-3">
      {/* Level pills */}
      <div className="flex gap-1 justify-center">
        {levels.map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all ${
              level === l ? "bg-primary/15 text-primary border-primary/30" : "bg-muted border-border text-muted-foreground"
            }`}
          >
            {levelEmojis[l]} {t(`tab.level.${l}` as any)}
          </button>
        ))}
      </div>

      {currentTab ? (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-lg bg-muted/50 p-3">
            <pre className="font-mono text-[10px] leading-[1.5] text-foreground whitespace-pre">
              {currentTab}
            </pre>
          </div>
          <button
            onClick={() => player.isPlaying ? player.stop() : player.play(currentTab, 100)}
            disabled={player.isLoading}
            className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 ${
              player.isPlaying 
                ? "bg-destructive/15 text-destructive" 
                : "bg-primary/10 text-primary"
            }`}
          >
            {player.isLoading ? <><Loader2 size={12} className="animate-spin" /> Loading...</> : player.isPlaying ? <><Square size={12} /> {t("tab.stop")}</> : <><Play size={12} /> {t("tab.play")}</>}
          </button>
          {player.isPlaying && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${player.progress * 100}%` }} />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> {t("tab.generating")}</>
          ) : (
            <><Guitar size={14} /> {t("tab.generateForChord")}</>
          )}
        </button>
      )}
    </div>
  );
}

export function ChordDiagramDialog({ chord, open, onClose }: ChordDiagramProps) {
  const [view, setView] = useState<"guitar" | "piano" | "fingerpicking">("guitar");
  const { t } = useLanguage();

  if (!chord) return null;

  const guitarData = chordDiagrams[chord];
  const pianoData = pianoChords[chord];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[320px] rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">
            {chord}
          </DialogTitle>
        </DialogHeader>

        {/* Toggle guitar/piano/fingerpicking */}
        <div className="flex justify-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView("guitar")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              view === "guitar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Guitar size={13} />
            Chitară
          </button>
          <button
            onClick={() => setView("piano")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              view === "piano" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Piano size={13} />
            Pian
          </button>
          <button
            onClick={() => setView("fingerpicking")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              view === "fingerpicking" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            🎵
            <span className="hidden min-[300px]:inline">{t("tab.fingerpicking")}</span>
            <span className="min-[300px]:hidden">Tab</span>
          </button>
        </div>

        {view === "guitar" ? (
          guitarData ? (
            <GuitarDiagram data={guitarData} />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Diagrama nu este disponibilă pentru acest acord.
              </p>
            </div>
          )
        ) : view === "piano" ? (
          pianoData ? (
            <PianoDiagram data={pianoData} />
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Diagrama de pian nu este disponibilă.
              </p>
            </div>
          )
        ) : (
          <FingerpickingTab chord={chord} />
        )}
      </DialogContent>
    </Dialog>
  );
}
