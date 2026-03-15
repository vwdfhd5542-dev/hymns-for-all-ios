import { Moon, Info, Smartphone } from "lucide-react";

export function SettingsView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-14 pb-2">
        <h1 className="text-3xl font-bold tracking-tight">Setări</h1>
      </div>

      <div className="px-4 pb-24 space-y-6 mt-4">
        {/* App info */}
        <div className="bg-card rounded-xl p-4 space-y-4">
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

        {/* Install PWA hint */}
        <div className="bg-card rounded-xl p-4">
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
        <div className="bg-card rounded-xl p-4">
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
