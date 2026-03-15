import { useState, useEffect } from "react";
import { Music } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const { t } = useLanguage();

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("hold"), 100);
    const holdTimer = setTimeout(() => setPhase("exit"), 1800);
    const exitTimer = setTimeout(() => onFinish(), 2400);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-700 ease-out ${
          phase === "enter"
            ? "opacity-0 scale-75 translate-y-4"
            : phase === "hold"
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-110 -translate-y-4"
        }`}
      >
        <div className="w-20 h-20 rounded-[22px] bg-primary/20 flex items-center justify-center shadow-lg">
          <Music size={40} className="text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hymns RO
          </h1>
          <p className="text-sm font-medium text-primary mt-1">
            {t("splash.subtitle")}
          </p>
        </div>
        <div className="mt-6 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
