import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SongLibrary } from "@/components/SongLibrary";
import { SongView } from "@/components/SongView";
import { SettingsView } from "@/components/SettingsView";
import { useFavorites } from "@/hooks/useFavorites";
import { Song } from "@/data/songs";

type Tab = "songs" | "favorites" | "settings";

const Index = () => {
  const [tab, setTab] = useState<Tab>("songs");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

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
        <SongLibrary onSongSelect={setSelectedSong} isFavorite={isFavorite} />
      )}
      {tab === "favorites" && (
        <SongLibrary
          onSongSelect={setSelectedSong}
          isFavorite={isFavorite}
          filterFavorites
        />
      )}
      {tab === "settings" && <SettingsView />}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
};

export default Index;
