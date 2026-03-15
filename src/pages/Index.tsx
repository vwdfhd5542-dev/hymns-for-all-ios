import { useState, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SongLibrary } from "@/components/SongLibrary";
import { SongView } from "@/components/SongView";
import { SettingsView } from "@/components/SettingsView";
import { AddSongForm } from "@/components/AddSongForm";
import { CollectionsView } from "@/components/CollectionsView";
import { SplashScreen } from "@/components/SplashScreen";
import { useFavorites } from "@/hooks/useFavorites";
import { Song } from "@/data/songs";

type Tab = "songs" | "favorites" | "collections" | "settings";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<Tab>("songs");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showAddSong, setShowAddSong] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return (
      <div className="h-[100dvh] bg-background">
        <SplashScreen onFinish={handleSplashFinish} />
      </div>
    );
  }

  if (showAddSong) {
    return (
      <div className="h-[100dvh] bg-background">
        <AddSongForm onClose={() => setShowAddSong(false)} />
      </div>
    );
  }

  if (selectedSong) {
    return (
      <div className="h-[100dvh] bg-background">
        <SongView
          song={selectedSong}
          onBack={() => setSelectedSong(null)}
          isFavorite={isFavorite(selectedSong.id)}
          onToggleFavorite={() => toggleFavorite(selectedSong.id)}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background">
      {tab === "songs" && (
        <SongLibrary
          onSongSelect={setSelectedSong}
          isFavorite={isFavorite}
          onAddSong={() => setShowAddSong(true)}
        />
      )}
      {tab === "favorites" && (
        <SongLibrary
          onSongSelect={setSelectedSong}
          isFavorite={isFavorite}
          filterFavorites
        />
      )}
      {tab === "collections" && (
        <CollectionsView onSongSelect={setSelectedSong} />
      )}
      {tab === "settings" && <SettingsView />}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
};

export default Index;
