import { useMemo, useRef, useEffect } from "react";

interface TablatureDisplayProps {
  tablature: string;
  currentColumn: number;
  isPlaying: boolean;
}

interface TabGroup {
  labels: string[];
  contents: string[];
  headerLine?: string;
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

    if (line && !/^[eBGDAE]\|/.test(line)) {
      pendingHeader = line;
      i++;
      continue;
    }

    const group: { label: string; content: string }[] = [];
    let j = i;

    while (j < lines.length && group.length < 6) {
      const currentLine = lines[j].trim();
      const match = currentLine.match(/^([eBGDAE])\|(.+)/);
      if (match) {
        group.push({ label: match[1], content: match[2] });
        j++;
      } else if (group.length > 0) {
        break;
      } else {
        j++;
        break;
      }
    }

    if (group.length === 6) {
      const maxLen = Math.max(...group.map((g) => g.content.length));
      groups.push({
        labels: group.map((g) => g.label),
        contents: group.map((g) => g.content),
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

  useEffect(() => {
    if (!isPlaying || currentColumn < 0 || !scrollRef.current) return;

    const active = scrollRef.current.querySelector<HTMLElement>(`[data-tab-col="${currentColumn}"]`);
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentColumn, isPlaying]);

  return (
    <div ref={scrollRef} className="overflow-x-auto p-4 scrollbar-none">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-4 min-w-max">
          {group.headerLine && <div className="mb-1 text-xs font-semibold text-primary">{group.headerLine}</div>}

          <div className="font-mono text-[11px] leading-[1.6]">
            {group.contents.map((content, stringIndex) => (
              <div key={stringIndex} className="flex whitespace-pre">
                <span className="w-3 shrink-0 font-bold text-muted-foreground">{group.labels[stringIndex]}</span>
                <span className="text-muted-foreground">|</span>
                {Array.from(content).map((char, index) => {
                  const globalCol = group.globalColStart + index;
                  const isActive = isPlaying && globalCol === currentColumn;
                  const isNear = isPlaying && currentColumn >= 0 && Math.abs(globalCol - currentColumn) <= 1;
                  const isBar = char === "|";

                  let className = "text-foreground";
                  if (isBar) className = "font-bold text-muted-foreground";
                  else if (isActive) className = "rounded-sm bg-primary px-[1px] text-primary-foreground";
                  else if (isNear) className = "text-primary";
                  else if (char === "-") className = "text-muted-foreground/50";
                  else if (/\d/.test(char)) className = "font-semibold text-foreground";
                  else if (/[hpbr\/\\~]/.test(char)) className = "text-accent-foreground";

                  return (
                    <span key={index} data-tab-col={globalCol} className={className}>
                      {char}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

