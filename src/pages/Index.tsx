import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SongLibrary } from "@/components/SongLibrary";
import { SongView } from "@/components/SongView";
import { SettingsView } from "@/components/SettingsView";
import { AddSongForm } from "@/components/AddSongForm";
import { useFavorites } from "@/hooks/useFavorites";
import { Song } from "@/data/songs";

type Tab = "songs" | "favorites" | "settings";

const Index = () => {
  const [tab, setTab] = useState<Tab>("songs");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showAddSong, setShowAddSong] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();

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
      {tab === "settings" && <SettingsView />}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
};

export default Index;
