import { useState, useRef, useEffect, useCallback } from "react";
import { Song, transposeLine } from "@/data/songs";
import { useUpdateSong } from "@/hooks/useSongs";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { chordEnrichmentMap } from "@/data/chordDiagrams";
import { ChordDiagramDialog } from "@/components/ChordDiagram";
import { ChevronLeft, Heart, Minus, Plus, Play, Pause, Type, Edit3, Check, X, Guitar, Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SongViewProps {
  song: Song;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function enrichChord(chord: string): string {
  return chordEnrichmentMap[chord] || chord;
}

function parseChordsAbove(line: string, transpose: number, enrich: boolean): { chords: { text: string; pos: number }[]; lyrics: string } | null {
  const transposed = transposeLine(line, transpose);
  const regex = /\[([^\]]+)\]/g;
  let match;
  const chords: { text: string; pos: number }[] = [];
  let lyricLine = "";
  let lastIndex = 0;
  let hasChords = false;

  while ((match = regex.exec(transposed)) !== null) {
    hasChords = true;
    const textBefore = transposed.slice(lastIndex, match.index).replace(/\[[^\]]*\]/g, "");
    lyricLine += textBefore;
    const chordText = enrich ? enrichChord(match[1]) : match[1];
    chords.push({ text: chordText, pos: lyricLine.length });
    lastIndex = regex.lastIndex;
  }

  const remaining = transposed.slice(lastIndex).replace(/\[[^\]]*\]/g, "");
  lyricLine += remaining;

  if (!hasChords) return null;
  return { chords, lyrics: lyricLine };
}

export function SongView({ song, onBack, isFavorite, onToggleFavorite }: SongViewProps) {
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showTools, setShowTools] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLyrics, setEditLyrics] = useState(song.lyrics);
  const [showComplexChords, setShowComplexChords] = useState(false);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const updateSong = useUpdateSong();
  const pitch = usePitchDetection();

  const lines = song.lyrics.split("\n");

  // Extract key with minor detection
  const keyMatch = song.lyrics.match(/\[([A-G][#b]?m?)/);
  const songKey = keyMatch ? keyMatch[1] : "?";
  const isMinor = songKey.endsWith("m");

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let lastTime = performance.now();
    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      if (scrollRef.current) {
        scrollRef.current.scrollTop += (scrollSpeed * delta) / 60;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [autoScroll, scrollSpeed]);

  const handleTranspose = useCallback((dir: number) => {
    setTranspose((prev) => prev + dir);
  }, []);

  const handleSaveEdit = () => {
    updateSong.mutate(
      { id: song.id, lyrics: editLyrics },
      {
        onSuccess: () => {
          toast.success("Cântarea a fost actualizată!");
          song.lyrics = editLyrics;
          setIsEditing(false);
        },
        onError: () => toast.error("Eroare la salvare"),
      }
    );
  };

  const uniqueChords = [...new Set(song.lyrics.match(/\[([^\]]+)\]/g)?.map(c => c.slice(1, -1)) || [])];

  return (
    <div className="flex flex-col h-full">
      {/* Apple-style header */}
      <div className="glass fixed top-0 left-0 right-0 z-40 border-b border-border safe-top">
        <div className="flex items-center h-12 px-2 max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-0.5 text-primary min-w-[44px] min-h-[44px] justify-center">
            <ChevronLeft size={22} />
            <span className="text-sm font-medium -ml-1">Înapoi</span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-0.5">
            {isEditing ? (
              <>
                <button onClick={() => { setIsEditing(false); setEditLyrics(song.lyrics); }}
                  className="min-w-[40px] min-h-[44px] flex items-center justify-center text-muted-foreground">
                  <X size={18} />
                </button>
                <button onClick={handleSaveEdit}
                  className="min-w-[40px] min-h-[44px] flex items-center justify-center text-primary">
                  <Check size={18} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setIsEditing(true); setEditLyrics(song.lyrics); }}
                  className="min-w-[40px] min-h-[44px] flex items-center justify-center text-muted-foreground">
                  <Edit3 size={17} />
                </button>
                <button onClick={() => setShowTools((v) => !v)}
                  className={`min-w-[40px] min-h-[44px] flex items-center justify-center ${showTools ? "text-primary" : "text-muted-foreground"}`}>
                  <Type size={18} />
                </button>
                <button onClick={onToggleFavorite}
                  className="min-w-[40px] min-h-[44px] flex items-center justify-center">
                  <Heart size={18} className={isFavorite ? "text-primary" : "text-muted-foreground"} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        {showTools && !isEditing && (
          <div className="border-t border-border px-4 py-3 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Transpune</span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleTranspose(-1)} className="w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-mono w-10 text-center font-bold">
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>
                <button onClick={() => handleTranspose(1)} className="w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Mărime text</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setFontSize((s) => Math.max(12, s - 2))} className="w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border text-xs font-bold">
                  A-
                </button>
                <span className="text-sm font-mono w-10 text-center">{fontSize}px</span>
                <button onClick={() => setFontSize((s) => Math.min(28, s + 2))} className="w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border text-sm font-bold">
                  A+
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Auto-scroll</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setAutoScroll((v) => !v)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border ${autoScroll ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                  {autoScroll ? <Pause size={14} /> : <Play size={14} />}
                </button>
                {autoScroll && (
                  <input type="range" min={0.3} max={3} step={0.1} value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                    className="w-20 accent-primary" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Acorduri înflorite</span>
              <button onClick={() => setShowComplexChords((v) => !v)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border ${showComplexChords ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                <Sparkles size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-8 px-4"
        style={{ paddingTop: showTools && !isEditing ? "20rem" : "7rem" }}>
        <div className="max-w-3xl mx-auto">
          {/* Song header - Apple style card */}
          <div className="mb-6 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-lg">{songKey}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-tight">{song.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {song.artist}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {song.collection}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {isMinor ? "Minor" : "Major"}
                  </span>
                </div>
              </div>
            </div>

            {transpose !== 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                Transpus: {transpose > 0 ? "+" : ""}{transpose} semitonuri
              </div>
            )}
          </div>

          {/* Inline Pitch Detector */}
          <div className="mb-4">
            <button
              onClick={pitch.isListening ? pitch.stopListening : pitch.startListening}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all border ${
                pitch.isListening
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                pitch.isListening ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
              }`}>
                {pitch.isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">
                  {pitch.isListening ? "Ascultare live..." : "Detectare ton"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pitch.isListening
                    ? pitch.detectedNote
                      ? `Nota: ${pitch.detectedNote}`
                      : "Cântă sau redă melodia..."
                    : "Apasă pentru a detecta tonul"}
                </p>
              </div>
              {pitch.isListening && pitch.detectedKey && (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">
                      {pitch.detectedKey}{pitch.keyQuality === "minor" ? "m" : ""}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {pitch.keyQuality === "minor" ? "minor" : "major"} · {pitch.confidence}%
                  </span>
                </div>
              )}
            </button>
          </div>

          {showComplexChords && (
            <div className="mb-4 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
              <Sparkles size={12} />
              Acorduri înflorite activate
            </div>
          )}

          {isEditing ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Editează versurile. Folosește [Acord] pentru acorduri.
              </p>
              <textarea
                value={editLyrics}
                onChange={(e) => setEditLyrics(e.target.value)}
                rows={25}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-primary transition-colors resize-none"
                style={{ fontSize: `${Math.max(13, fontSize - 2)}px`, lineHeight: 1.8 }}
              />
            </div>
          ) : (
            <div className="font-mono-lyrics bg-card rounded-2xl border border-border p-5 overflow-hidden" style={{ fontSize: `${fontSize}px` }}>
              {lines.map((line, i) => {
                if (line.trim() === "") {
                  return <div key={i} className="h-5" />;
                }

                const result = parseChordsAbove(line, transpose, showComplexChords);

                if (!result) {
                  const transposed = transposeLine(line, transpose);
                  const cleanText = transposed.replace(/\[[^\]]*\]/g, "");
                  return (
                    <div key={i} className="leading-relaxed">
                      <span>{cleanText}</span>
                    </div>
                  );
                }

                // Build chord line with spacing
                const chordElements: React.ReactNode[] = [];
                let lastEnd = 0;
                result.chords.forEach((c, ci) => {
                  const spaces = Math.max(0, c.pos - lastEnd);
                  if (spaces > 0) {
                    chordElements.push(<span key={`sp-${ci}`}>{" ".repeat(spaces)}</span>);
                  }
                  chordElements.push(
                    <span key={`ch-${ci}`}
                      className="cursor-pointer hover:underline active:opacity-70 transition-opacity"
                      onClick={() => setSelectedChord(c.text)}>
                      {c.text}
                    </span>
                  );
                  lastEnd = c.pos + c.text.length;
                });

                return (
                  <div key={i} className="mb-1">
                    <div className="text-primary font-bold whitespace-pre overflow-x-auto" style={{ fontSize: `${Math.max(11, fontSize - 2)}px`, lineHeight: 1.4 }}>
                      {chordElements}
                    </div>
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {result.lyrics}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChordDiagramDialog
        chord={selectedChord}
        open={!!selectedChord}
        onClose={() => setSelectedChord(null)}
      />
    </div>
  );
}
