import { useState, useRef, useEffect, useCallback } from "react";
import { Song, transposeLine, parseLyricsLine } from "@/data/songs";
import { ChevronLeft, Heart, Minus, Plus, Play, Pause, Type } from "lucide-react";

interface SongViewProps {
  song: Song;
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function SongView({ song, onBack, isFavorite, onToggleFavorite }: SongViewProps) {
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [showTools, setShowTools] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();

  const lines = song.lyrics.split("\n");

  // Auto-scroll
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

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [autoScroll, scrollSpeed]);

  const handleTranspose = useCallback((dir: number) => {
    setTranspose((prev) => prev + dir);
  }, []);

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      {/* Top bar */}
      <div className="glass fixed top-0 left-0 right-0 z-40 border-b border-border">
        <div className="flex items-center h-12 px-2 max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-0.5 text-primary min-w-[44px] min-h-[44px] justify-center">
            <ChevronLeft size={22} />
            <span className="text-[15px] font-medium">Înapoi</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setShowTools((v) => !v)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${showTools ? "text-primary" : "text-muted-foreground"}`}
          >
            <Type size={20} />
          </button>
          <button
            onClick={onToggleFavorite}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Heart
              size={20}
              className={isFavorite ? "text-accent" : "text-muted-foreground"}
              fill={isFavorite ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Toolbar */}
        {showTools && (
          <div className="border-t border-border px-4 py-3 space-y-3 animate-fade-in">
            {/* Transpose */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Transpune</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTranspose(-1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-card rounded-lg"
                >
                  <Minus size={18} />
                </button>
                <span className="text-sm font-mono w-8 text-center font-semibold">
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>
                <button
                  onClick={() => handleTranspose(1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-card rounded-lg"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Font size */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Font</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-card rounded-lg text-xs font-semibold"
                >
                  A-
                </button>
                <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
                <button
                  onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-card rounded-lg text-sm font-semibold"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Auto-scroll */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Auto-scroll</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAutoScroll((v) => !v)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg ${
                    autoScroll ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  {autoScroll ? <Pause size={16} /> : <Play size={16} />}
                </button>
                {autoScroll && (
                  <input
                    type="range"
                    min={0.3}
                    max={3}
                    step={0.1}
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                    className="w-24 accent-primary"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lyrics */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-16 pb-8 px-4"
        style={{ paddingTop: showTools ? "12rem" : "4rem" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-1">{song.title}</h2>
          <p className="text-xs text-muted-foreground mb-6">
            {song.artist} · {song.collection}
            {transpose !== 0 && (
              <span className="ml-2 text-primary font-medium">
                ({transpose > 0 ? "+" : ""}{transpose})
              </span>
            )}
          </p>

          <div className="font-mono-lyrics space-y-0.5" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
            {lines.map((line, i) => {
              const transposed = transposeLine(line, transpose);
              const parts = parseLyricsLine(transposed);

              if (transposed.trim() === "") {
                return <div key={i} className="h-4" />;
              }

              return (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {parts.map((part, j) =>
                    part.type === "chord" ? (
                      <span key={j} className="text-chord font-bold">
                        {part.value}
                      </span>
                    ) : (
                      <span key={j}>{part.value}</span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
