import { usePitchDetection } from "@/hooks/usePitchDetection";
import { Mic, MicOff, Music } from "lucide-react";

export function PitchDetector() {
  const { isListening, detectedNote, detectedKey, keyQuality, confidence, startListening, stopListening } = usePitchDetection();

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
          isListening
            ? "bg-primary/20 border border-primary/40"
            : "bg-card border border-border"
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isListening ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
        }`}>
          {isListening ? <Mic size={18} /> : <MicOff size={18} />}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">
            {isListening ? "Ascultare live..." : "Detectare ton"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isListening
              ? detectedNote
                ? `Nota curentă: ${detectedNote}`
                : "Cântă sau redă o melodie..."
              : "Apasă pentru a detecta tonul"}
          </p>
        </div>

        {isListening && detectedKey && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{detectedKey}</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {keyQuality === "minor" ? "m" : "M"} · {confidence}%
              </span>
            </div>
          </div>
        )}

        {!isListening && (
          <Music size={18} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
