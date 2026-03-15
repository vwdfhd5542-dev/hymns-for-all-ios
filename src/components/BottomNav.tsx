import { List, Heart, Settings, FolderOpen } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type Tab = "songs" | "favorites" | "collections" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage();

  const tabs: { id: Tab; labelKey: "nav.songs" | "nav.favorites" | "nav.collections" | "nav.settings"; icon: typeof List }[] = [
    { id: "songs", labelKey: "nav.songs", icon: List },
    { id: "favorites", labelKey: "nav.favorites", icon: Heart },
    { id: "collections", labelKey: "nav.collections", icon: FolderOpen },
    { id: "settings", labelKey: "nav.settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-bottom border-t border-border">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              activeTab === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={22} fill={id === "favorites" && activeTab === id ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">{t(labelKey)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
