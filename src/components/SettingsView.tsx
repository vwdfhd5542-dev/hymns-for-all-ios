import { useState } from "react";
import { Moon, Sun, Info, Smartphone, Droplets, ChevronDown, ChevronUp, Mic, Music, Guitar, Sparkles, FolderOpen, Scroll, Edit3, Globe } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage, Language, languageNames, languageFlags } from "@/hooks/useLanguage";

export function SettingsView() {
  const { mode, glassEnabled, toggleMode, toggleGlass } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showFeatures, setShowFeatures] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const features = [
    { icon: Mic, name: t("feature.pitchDetection"), desc: t("feature.pitchDesc") },
    { icon: Sparkles, name: t("feature.aiChords"), desc: t("feature.aiChordsDesc") },
    { icon: Guitar, name: t("feature.complexChords"), desc: t("feature.complexChordsDesc") },
    { icon: Edit3, name: t("feature.manualEdit"), desc: t("feature.manualEditDesc") },
    { icon: Music, name: t("feature.transpose"), desc: t("feature.transposeDesc") },
    { icon: Scroll, name: t("feature.autoScroll"), desc: t("feature.autoScrollDesc") },
    { icon: FolderOpen, name: t("feature.collections"), desc: t("feature.collectionsDesc") },
  ];

  const languages: Language[] = ["ro", "es", "en"];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 safe-top pb-2">
        <h1 className="text-3xl font-bold tracking-tight pt-4">{t("settings.title")}</h1>
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
              <p className="text-xs text-muted-foreground">{t("settings.version")} 1.1.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("settings.description")}
          </p>
        </div>

        {/* Language selector */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={() => setShowLanguages(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium">{t("settings.language")}</span>
                <p className="text-[11px] text-muted-foreground">{languageFlags[language]} {languageNames[language]}</p>
              </div>
            </div>
            {showLanguages ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>
          {showLanguages && (
            <div className="border-t border-border">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLanguages(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors ${
                    language === lang ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="text-lg">{languageFlags[lang]}</span>
                  <span className="text-sm font-medium flex-1 text-left">{languageNames[lang]}</span>
                  {language === lang && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={toggleMode} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {mode === "dark" ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
              <div className="text-left">
                <span className="text-sm font-medium">{mode === "dark" ? t("settings.darkMode") : t("settings.lightMode")}</span>
                <p className="text-[11px] text-muted-foreground">{t("settings.tapToChange")}</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center shrink-0 px-1 transition-colors ${mode === "dark" ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${mode === "dark" ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
          <div className="h-px bg-border" />
          <button onClick={toggleGlass} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Droplets size={18} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium">{t("settings.liquidGlass")}</span>
                <p className="text-[11px] text-muted-foreground">{t("settings.liquidGlassDesc")}</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full flex items-center shrink-0 px-1 transition-colors ${glassEnabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${glassEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </button>
        </div>

        {/* Features info */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button onClick={() => setShowFeatures(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5 active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium">{t("settings.features")}</span>
                <p className="text-[11px] text-muted-foreground">{t("settings.featuresDesc")}</p>
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
            <span className="font-medium text-sm">{t("settings.install")}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("settings.installIOS")}<br />
            {t("settings.installAndroid")}
          </p>
        </div>

        {/* About */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Info size={18} className="text-muted-foreground" />
            <span className="font-medium text-sm">{t("settings.about")}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("settings.aboutText")}
          </p>
        </div>
      </div>
    </div>
  );
}
