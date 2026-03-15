import { chordDiagrams, ChordDiagramData } from "@/data/chordDiagrams";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChordDiagramProps {
  chord: string | null;
  open: boolean;
  onClose: () => void;
}

function GuitarDiagram({ data }: { data: ChordDiagramData }) {
  const numFrets = 5;
  const numStrings = 6;
  const w = 160;
  const h = 180;
  const padTop = 36;
  const padLeft = 28;
  const padRight = 12;
  const fretH = (h - padTop - 20) / numFrets;
  const strW = (w - padLeft - padRight) / (numStrings - 1);

  const minFret = Math.min(...data.frets.filter(f => f > 0));
  const maxFret = Math.max(...data.frets.filter(f => f > 0));
  const baseFret = data.baseFret || (maxFret <= 5 ? 1 : minFret);
  const isOpenPosition = baseFret === 1;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[200px] mx-auto" aria-label={`Chord diagram for ${data.name}`}>
      {/* Nut or fret number */}
      {isOpenPosition ? (
        <rect x={padLeft - 2} y={padTop - 3} width={strW * (numStrings - 1) + 4} height={5}
          rx={2} className="fill-foreground" />
      ) : (
        <text x={padLeft - 14} y={padTop + fretH / 2 + 4}
          className="fill-muted-foreground text-[11px] font-bold" textAnchor="middle">
          {baseFret}
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line key={`fret-${i}`}
          x1={padLeft} y1={padTop + i * fretH}
          x2={padLeft + strW * (numStrings - 1)} y2={padTop + i * fretH}
          className="stroke-border" strokeWidth={1.5} />
      ))}

      {/* String lines */}
      {Array.from({ length: numStrings }).map((_, i) => (
        <line key={`str-${i}`}
          x1={padLeft + i * strW} y1={padTop}
          x2={padLeft + i * strW} y2={padTop + numFrets * fretH}
          className="stroke-muted-foreground/50" strokeWidth={1.2} />
      ))}

      {/* Barres */}
      {data.barres?.map((barre, bi) => {
        const fretPos = barre.fret - baseFret + 1;
        if (fretPos < 1 || fretPos > numFrets) return null;
        const y = padTop + (fretPos - 0.5) * fretH;
        const x1 = padLeft + barre.from * strW;
        const x2 = padLeft + barre.to * strW;
        return (
          <rect key={`barre-${bi}`}
            x={x1 - 4} y={y - 6} width={x2 - x1 + 8} height={12}
            rx={6} className="fill-primary" opacity={0.9} />
        );
      })}

      {/* Finger dots and mute/open markers */}
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
        return (
          <circle key={`d-${i}`} cx={x} cy={y} r={7}
            className="fill-primary" />
        );
      })}

      {/* String labels */}
      {["E", "A", "D", "G", "B", "e"].map((s, i) => (
        <text key={`lbl-${i}`} x={padLeft + i * strW} y={h - 2}
          className="fill-muted-foreground text-[9px]" textAnchor="middle">
          {s}
        </text>
      ))}
    </svg>
  );
}

export function ChordDiagramDialog({ chord, open, onClose }: ChordDiagramProps) {
  if (!chord) return null;

  const data = chordDiagrams[chord];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[260px] rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">
            {chord}
          </DialogTitle>
        </DialogHeader>
        {data ? (
          <GuitarDiagram data={data} />
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Diagrama nu este disponibilă pentru acest acord.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
