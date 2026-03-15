import { useState } from "react";
import { Moon, Sun, Info, Smartphone, Droplets, ChevronDown, ChevronUp, Mic, Music, Guitar, Sparkles, FolderOpen, Scroll, Edit3 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function SettingsView() {
  const { mode, glassEnabled, toggleMode, toggleGlass } = useTheme();
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    { icon: Mic, name: "Detectare Ton", desc: "Detectează tonalitatea cântării folosind microfonul. Folosește algoritmul Krumhansl-Kessler pentru a identifica dacă e major sau minor." },
    { icon: Sparkles, name: "Acorduri AI", desc: "Adaugă automat acorduri la versuri folosind inteligență artificială. Scrie doar versurile și AI-ul pune acordurile corecte." },
    { icon: Guitar, name: "Acorduri Complexe", desc: "Vizualizează variante avansate ale acordurilor (maj7, sus4, add9, etc.) pentru fiecare acord din cântare." },
    { icon: Edit3, name: "Editare Manuală", desc: "Editează versurile și acordurile direct în aplicație. Folosește formatul [Acord] pentru a marca acordurile." },
    { icon: Music, name: "Transpunere", desc: "Schimbă tonalitatea cântării cu +/- semitonuri. Toate acordurile se actualizează automat." },
    { icon: Scroll, name: "Defilare Automată", desc: "Activează scroll-ul automat pentru a citi versurile fără mâini. Viteza este ajustabilă." },
    { icon: FolderOpen, name: "Colecții", desc: "Creează playlisturi personalizate și organizează cântările în colecții." },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 safe-top pb-2">
        <h1 className="text-3xl font-bold tracking-tight pt-4">Setări</h1>
      </div>

      <div className="px-4 pb-24 space-y-4 mt-4 overflow-y-auto">
        {/* App info */}
        <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Music size={22} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">HymnsRO</p>
              <p className="text-xs text-muted-foreground">Versiunea 1.1.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aplicație pentru cântări creștine românești cu acorduri, transpunere și defilare automată.
          </p>
        </div>

        {/* Theme toggle */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={toggleMode} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {mode === "dark" ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
              <div className="text-left">
                <span className="text-sm font-medium">Mod {mode === "dark" ? "întunecat" : "luminos"}</span>
                <p className="text-[11px] text-muted-foreground">Apasă pentru a schimba</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${mode === "dark" ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${mode === "dark" ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
          <div className="h-px bg-border" />
          <button onClick={toggleGlass} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Droplets size={18} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium">Liquid Glass</span>
                <p className="text-[11px] text-muted-foreground">Design translucid tip Apple</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${glassEnabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${glassEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
        </div>

        {/* Features info */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={() => setShowFeatures(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium">Funcții disponibile</span>
                <p className="text-[11px] text-muted-foreground">Descoperă ce poate face aplicația</p>
              </div>
            </div>
            {showFeatures ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>
          {showFeatures && (
            <div className="border-t border-border">
              {features.map((feat, i) => (
                <div key={feat.name}>
                  {i > 0 && <div className="h-px bg-border mx-4" />}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2.5 mb-1">
                      <feat.icon size={15} className="text-primary shrink-0" />
                      <span className="text-sm font-semibold">{feat.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-[26px]">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Install PWA */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone size={18} className="text-primary" />
            <span className="font-medium text-sm">Instalează aplicația</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pe iPhone: apasă butonul <strong>Share</strong> → <strong>Add to Home Screen</strong>.
            Pe Android: apasă meniul browserului → <strong>Install app</strong>.
          </p>
        </div>

        {/* About */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Info size={18} className="text-muted-foreground" />
            <span className="font-medium text-sm">Despre</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cântări din colecțiile Speranța, Boanerges și alte imnuri creștine tradiționale.
            Funcționează offline după prima încărcare.
          </p>
        </div>
      </div>
    </div>
  );
}
