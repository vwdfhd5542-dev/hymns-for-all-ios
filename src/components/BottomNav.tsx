import { List, Heart, Settings, FolderOpen } from "lucide-react";

type Tab = "songs" | "favorites" | "collections" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof List }[] = [
  { id: "songs", label: "Cântări", icon: List },
  { id: "favorites", label: "Favorite", icon: Heart },
  { id: "collections", label: "Colecții", icon: FolderOpen },
  { id: "settings", label: "Setări", icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom border-t border-border">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon
              size={22}
              fill={id === "favorites" && activeTab === id ? "currentColor" : "none"}
            />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
