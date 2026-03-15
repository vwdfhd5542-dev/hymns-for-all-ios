import { Moon, Sun, Info, Smartphone, Droplets } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function SettingsView() {
  const { mode, glassEnabled, toggleMode, toggleGlass } = useTheme();

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
              <span className="text-primary-foreground font-bold text-lg">H</span>
            </div>
            <div>
              <p className="font-semibold">HymnsRO</p>
              <p className="text-xs text-muted-foreground">Versiunea 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aplicație pentru cântări creștine românești cu acorduri, transpunere și defilare automată.
          </p>
        </div>

        {/* Theme toggle */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors"
          >
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

          {/* Glass design toggle */}
          <button
            onClick={toggleGlass}
            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Droplets size={18} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium">Liquid Glass</span>
                <p className="text-[11px] text-muted-foreground">Diseño estilo Apple translúcido</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${glassEnabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${glassEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
        </div>

        {/* Install PWA hint */}
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

        {/* Info */}
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
