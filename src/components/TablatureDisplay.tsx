import { useMemo, useRef, useEffect } from "react";

interface TablatureDisplayProps {
  tablature: string;
  currentColumn: number;
  isPlaying: boolean;
}

interface TabGroup {
  lines: string[];       // raw 6 string lines
  labels: string[];      // string labels (e, B, G, D, A, E)
  contents: string[];    // content after label|
  headerLine?: string;   // section header like [Intro], [Verse]
  globalColStart: number;
}

function parseTabGroups(tab: string): TabGroup[] {
  const lines = tab.split("\n");
  const groups: TabGroup[] = [];
  let i = 0;
  let globalColOffset = 0;
  let pendingHeader: string | undefined;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for section headers like [Intro], [Verse - "..."]
    if (line.match(/^\[.+\]$/) || (line.length > 0 && !line.match(/^[eBGDAE]\|/))) {
      if (!line.match(/^[eBGDAE]\|/)) {
        pendingHeader = line;
        i++;
        continue;
      }
    }

    const group: { label: string; content: string; raw: string }[] = [];
    let j = i;

    while (j < lines.length && group.length < 6) {
      const l = lines[j].trim();
      const m = l.match(/^([eBGDAE])\|(.+)/);
      if (m) {
        group.push({ label: m[1], content: m[2], raw: l });
        j++;
      } else if (group.length > 0) {
        break;
      } else {
        j++;
        break;
      }
    }

    if (group.length === 6) {
      const maxLen = Math.max(...group.map(g => g.content.length));
      groups.push({
        lines: group.map(g => g.raw),
        labels: group.map(g => g.label),
        contents: group.map(g => g.content),
        headerLine: pendingHeader,
        globalColStart: globalColOffset,
      });
      globalColOffset += maxLen;
      pendingHeader = undefined;
      i = j;
    } else {
      i = j > i ? j : i + 1;
    }
  }

  return groups;
}

export function TablatureDisplay({ tablature, currentColumn, isPlaying }: TablatureDisplayProps) {
  const groups = useMemo(() => parseTabGroups(tablature), [tablature]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll to current position during playback
  useEffect(() => {
    if (isPlaying && highlightRef.current && scrollRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentColumn, isPlaying]);

  return (
    <div ref={scrollRef} className="p-4 overflow-x-auto scrollbar-none">
      {groups.map((group, gi) => (
        <div key={gi} className="mb-4">
          {group.headerLine && (
            <div className="text-xs font-semibold text-primary mb-1">{group.headerLine}</div>
          )}
          <div className="font-mono text-[11px] leading-[1.6]">
            {group.contents.map((content, si) => {
              const label = group.labels[si];
              return (
                <div key={si} className="whitespace-pre flex">
                  <span className="text-muted-foreground font-bold w-3 shrink-0">{label}</span>
                  <span className="text-muted-foreground">|</span>
                  {renderStringLine(content, group.globalColStart, currentColumn, isPlaying, si === 0)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderStringLine(
  content: string,
  globalColStart: number,
  currentColumn: number,
  isPlaying: boolean,
  attachRef: boolean
): JSX.Element[] {
  const elements: JSX.Element[] = [];
  
  for (let i = 0; i < content.length; i++) {
    const globalCol = globalColStart + i;
    const ch = content[i];
    
    // Determine if this column is currently playing
    const isActive = isPlaying && currentColumn >= 0 && globalCol === currentColumn;
    // Highlight a small window around current position
    const isNear = isPlaying && currentColumn >= 0 && 
      Math.abs(globalCol - currentColumn) <= 1;

    // Bar lines
    const isBar = ch === "|";
    
    let className = "text-foreground";
    if (isBar) {
      className = "text-muted-foreground font-bold";
    } else if (isActive) {
      className = "text-primary-foreground bg-primary rounded-sm";
    } else if (isNear) {
      className = "text-primary";
    } else if (ch === "-") {
      className = "text-muted-foreground/50";
    } else if (/\d/.test(ch)) {
      className = "text-foreground font-semibold";
    } else if (/[hpbr\/\\~]/.test(ch)) {
      className = "text-accent-foreground";
    }

    elements.push(
      <span
        key={i}
        ref={isActive && attachRef ? (el) => {
          // Store ref for auto-scroll
          if (el) (el as any).__highlightRef = true;
        } : undefined}
        className={className}
      >
        {ch}
      </span>
    );
  }

  return elements;
}
