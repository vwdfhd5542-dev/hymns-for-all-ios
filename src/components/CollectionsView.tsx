import { useState } from "react";
import { Plus, Trash2, ChevronRight, FolderOpen, X } from "lucide-react";
import { useCollections, useAddCollection, useDeleteCollection, useCollectionSongs, useAddSongToCollection, useRemoveSongFromCollection } from "@/hooks/useCollections";
import { useSongs } from "@/hooks/useSongs";
import { Song } from "@/data/songs";
import { toast } from "sonner";

interface CollectionsViewProps {
  onSongSelect: (song: Song) => void;
}

export function CollectionsView({ onSongSelect }: CollectionsViewProps) {
  const { data: collections = [], isLoading } = useCollections();
  const { data: songs = [] } = useSongs();
  const addCollection = useAddCollection();
  const deleteCollection = useDeleteCollection();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedCol, setSelectedCol] = useState<string | null>(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const { data: songIds = [] } = useCollectionSongs(selectedCol);
  const addSongToCol = useAddSongToCollection();
  const removeSongFromCol = useRemoveSongFromCollection();

  const handleCreate = () => {
    if (!newName.trim()) return;
    addCollection.mutate({ name: newName.trim() }, {
      onSuccess: () => { setNewName(""); setShowCreate(false); toast.success("Colecție creată!"); },
    });
  };

  const selectedCollection = collections.find(c => c.id === selectedCol);
  const collectionSongs = songs.filter(s => songIds.includes(s.id));

  if (selectedCol && selectedCollection) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 safe-top pb-3">
          <div className="flex items-center gap-3 pt-4">
            <button onClick={() => { setSelectedCol(null); setShowAddSongs(false); }} className="text-primary">
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight flex-1">{selectedCollection.name}</h1>
            <button
              onClick={() => setShowAddSongs(v => !v)}
              className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"
            >
              <Plus size={18} className="text-primary" />
            </button>
          </div>
        </div>

        {showAddSongs && (
          <div className="px-4 pb-3 max-h-60 overflow-y-auto border-b border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Adaugă cântări:</p>
            {songs.filter(s => !songIds.includes(s.id)).map(song => (
              <button
                key={song.id}
                onClick={() => addSongToCol.mutate({ collectionId: selectedCol!, songId: song.id }, {
                  onSuccess: () => toast.success("Adăugat!"),
                })}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 active:bg-muted text-sm flex items-center gap-2"
              >
                <Plus size={14} className="text-primary shrink-0" />
                <span className="truncate">{song.title}</span>
                <span className="text-[11px] text-muted-foreground ml-auto">{song.artist}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-2 pt-2">
          {collectionSongs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">Nicio cântare în colecție.</p>
          )}
          {collectionSongs.map(song => (
            <div key={song.id} className="flex items-center gap-2">
              <button
                onClick={() => onSongSelect(song)}
                className="flex-1 text-left rounded-xl bg-card border border-border p-3 active:scale-[0.98] transition-all"
              >
                <p className="font-semibold text-sm truncate">{song.title}</p>
                <p className="text-[11px] text-muted-foreground">{song.artist}</p>
              </button>
              <button
                onClick={() => removeSongFromCol.mutate({ collectionId: selectedCol!, songId: song.id })}
                className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0"
              >
                <X size={14} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 safe-top pb-3">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FolderOpen size={20} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Colecții</h1>
          </div>
          <button onClick={() => setShowCreate(true)} className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plus size={20} className="text-primary" />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Numele colecției"
              className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
              autoFocus
            />
            <button onClick={handleCreate} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
              Creează
            </button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-2.5 bg-card border border-border rounded-xl">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && collections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-20">Nicio colecție încă. Creează una!</p>
        )}
        {collections.map(col => (
          <div key={col.id} className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCol(col.id)}
              className="flex-1 text-left rounded-xl bg-card border border-border p-4 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <FolderOpen size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{col.name}</p>
                  <p className="text-[11px] text-muted-foreground">{col.description || "Colecție personalizată"}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground ml-auto" />
              </div>
            </button>
            <button
              onClick={() => deleteCollection.mutate(col.id, { onSuccess: () => toast.success("Șters!") })}
              className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
