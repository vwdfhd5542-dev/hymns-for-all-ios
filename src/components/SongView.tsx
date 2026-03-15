import { useState, useRef, useEffect, useCallback } from "react";
import { Song, transposeLine } from "@/data/songs";
import { useUpdateSong, useDeleteSong } from "@/hooks/useSongs";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { chordEnrichmentMap } from "@/data/chordDiagrams";
import { ChordDiagramDialog } from "@/components/ChordDiagram";
import { ChevronLeft, Heart, Minus, Plus, Play, Pause, Type, Edit3, Check, X, Mic, MicOff, Sparkles, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage, languageNames, languageFlags, Language } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

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
  const [translatedLyrics, setTranslatedLyrics] = useState<string | null>(null);
  const [translateLang, setTranslateLang] = useState<Language | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const [isGeneratingChords, setIsGeneratingChords] = useState(false);
  const updateSong = useUpdateSong();
  const pitch = usePitchDetection();
  const { t } = useLanguage();

  const activeLyrics = translatedLyrics || song.lyrics;
  const lines = activeLyrics.split("\n");

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
          toast.success(t("song.updated"));
          song.lyrics = editLyrics;
          setIsEditing(false);
        },
        onError: () => toast.error(t("song.saveError")),
      }
    );
  };

  const handleAiChords = async () => {
    setIsGeneratingChords(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-chords", {
        body: { title: song.title, artist: song.artist, lyrics: editLyrics },
      });
      if (error) throw error;
      if (data?.lyrics) {
        setEditLyrics(data.lyrics);
        toast.success(t("addSong.chordsAdded"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("addSong.chordsError"));
    } finally {
      setIsGeneratingChords(false);
    }
  };

  const handleTranslate = async (lang: Language) => {
    setShowTranslateMenu(false);
    if (lang === "ro") {
      setTranslatedLyrics(null);
      setTranslateLang(null);
      return;
    }
    setIsTranslating(true);
    setTranslateLang(lang);
    try {
      const { data, error } = await supabase.functions.invoke("translate-song", {
        body: { lyrics: song.lyrics, targetLanguage: lang },
      });
      if (error) throw error;
      if (data?.lyrics) {
        setTranslatedLyrics(data.lyrics);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("song.translateError"));
      setTranslateLang(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const translateLanguages: Language[] = ["ro", "es", "en"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="glass fixed top-0 left-0 right-0 z-40 border-b border-border safe-top">
        <div className="flex items-center h-12 px-2 max-w-3xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-0.5 text-primary min-w-[44px] min-h-[44px] justify-center">
            <ChevronLeft size={22} />
            <span className="text-sm font-medium -ml-1">{t("song.back")}</span>
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
                {/* Translate button */}
                <div className="relative">
                  <button onClick={() => setShowTranslateMenu(v => !v)}
                    className={`min-w-[40px] min-h-[44px] flex items-center justify-center ${translateLang ? "text-primary" : "text-muted-foreground"}`}>
                    {isTranslating ? <Loader2 size={17} className="animate-spin" /> : <Globe size={17} />}
                  </button>
                  {showTranslateMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-card/100 backdrop-blur-none border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]" style={{ backgroundColor: 'hsl(var(--card))' }}>
                      {translateLanguages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleTranslate(lang)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm active:bg-muted/50 transition-colors ${
                            (lang === "ro" && !translateLang) || translateLang === lang ? "bg-primary/10 font-semibold" : ""
                          }`}
                        >
                          <span>{languageFlags[lang]}</span>
                          <span className="flex-1 text-left">{languageNames[lang]}</span>
                          {((lang === "ro" && !translateLang) || translateLang === lang) && (
                            <span className="text-primary text-xs">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
              <span className="text-xs text-muted-foreground font-medium">{t("song.transpose")}</span>
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
              <span className="text-xs text-muted-foreground font-medium">{t("song.fontSize")}</span>
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
              <span className="text-xs text-muted-foreground font-medium">{t("song.autoScroll")}</span>
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
              <span className="text-xs text-muted-foreground font-medium">{t("song.enrichedChords")}</span>
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
          {/* Song header */}
          <div className="mb-6 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-lg">{songKey}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-tight">{song.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{song.artist}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {song.collection}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {isMinor ? t("song.minor") : t("song.major")}
                  </span>
                  {translateLang && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {languageFlags[translateLang]} {languageNames[translateLang]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {transpose !== 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                {t("song.transposed")}: {transpose > 0 ? "+" : ""}{transpose} {t("song.semitones")}
              </div>
            )}
          </div>

          {/* Pitch Detector */}
          <div className="mb-4">
            <button
              onClick={pitch.isListening ? pitch.stopListening : pitch.startListening}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all border ${
                pitch.isListening ? "bg-primary/10 border-primary/30" : "bg-card border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                pitch.isListening ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
              }`}>
                {pitch.isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">
                  {pitch.isListening ? t("song.pitchListening") : t("song.pitchDetect")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pitch.isListening
                    ? pitch.detectedNote
                      ? `${t("song.pitchNote")}: ${pitch.detectedNote}`
                      : t("song.pitchSing")
                    : t("song.pitchTap")}
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
              {t("song.enrichedActive")}
            </div>
          )}

          {isEditing ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{t("song.editHint")}</p>
                <button onClick={handleAiChords} disabled={isGeneratingChords || !editLyrics.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold disabled:opacity-40 transition-all active:scale-95">
                  {isGeneratingChords ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {isGeneratingChords ? t("addSong.generating") : t("addSong.aiChords")}
                </button>
              </div>
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
                    <div className="text-primary font-bold whitespace-pre overflow-x-auto scrollbar-none" style={{ fontSize: `${Math.max(11, fontSize - 2)}px`, lineHeight: 1.4 }}>
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

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 mx-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold mb-2">{t("song.deleteTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t("song.deleteConfirm")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium">
                {t("addSong.cancel")}
              </button>
              <button onClick={handleDeleteSong}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium">
                {t("song.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
