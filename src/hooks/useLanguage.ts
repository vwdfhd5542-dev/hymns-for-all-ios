import { useState, useCallback, useEffect } from "react";

export type Language = "ro" | "es" | "en";

export const languageNames: Record<Language, string> = {
  ro: "Română",
  es: "Español",
  en: "English",
};

export const languageFlags: Record<Language, string> = {
  ro: "🇷🇴",
  es: "🇪🇸",
  en: "🇬🇧",
};

const translations = {
  // Bottom Nav
  "nav.songs": { ro: "Cântări", es: "Canciones", en: "Songs" },
  "nav.favorites": { ro: "Favorite", es: "Favoritos", en: "Favorites" },
  "nav.collections": { ro: "Colecții", es: "Colecciones", en: "Collections" },
  "nav.settings": { ro: "Setări", es: "Ajustes", en: "Settings" },

  // Song Library
  "library.title": { ro: "Hymns RO", es: "Hymns RO", en: "Hymns RO" },
  "library.subtitle": { ro: "Cântări Creștine", es: "Cantos Cristianos", en: "Christian Hymns" },
  "library.favorites": { ro: "Favorite", es: "Favoritos", en: "Favorites" },
  "library.search": { ro: "Caută după titlu, artist sau versuri...", es: "Buscar por título, artista o letra...", en: "Search by title, artist or lyrics..." },
  "library.all": { ro: "Toate", es: "Todas", en: "All" },
  "library.noFavorites": { ro: "Nu ai cântări favorite încă.", es: "No tienes canciones favoritas aún.", en: "No favorite songs yet." },
  "library.noResults": { ro: "Nicio cântare găsită.", es: "No se encontraron canciones.", en: "No songs found." },
  "library.chords": { ro: "Acorduri", es: "Acordes", en: "Chords" },
  "library.lyrics": { ro: "Versuri", es: "Letras", en: "Lyrics" },

  // Song View
  "song.back": { ro: "Înapoi", es: "Atrás", en: "Back" },
  "song.transpose": { ro: "Transpune", es: "Transponer", en: "Transpose" },
  "song.fontSize": { ro: "Mărime text", es: "Tamaño texto", en: "Font size" },
  "song.autoScroll": { ro: "Defilare automată", es: "Desplazamiento auto", en: "Auto-scroll" },
  "song.enrichedChords": { ro: "Acorduri înflorite", es: "Acordes enriquecidos", en: "Enriched chords" },
  "song.enrichedActive": { ro: "Acorduri înflorite activate", es: "Acordes enriquecidos activados", en: "Enriched chords enabled" },
  "song.transposed": { ro: "Transpus", es: "Transpuesto", en: "Transposed" },
  "song.semitones": { ro: "semitonuri", es: "semitonos", en: "semitones" },
  "song.minor": { ro: "Minor", es: "Menor", en: "Minor" },
  "song.major": { ro: "Major", es: "Mayor", en: "Major" },
  "song.editHint": { ro: "Editează versurile. Folosește [Acord] pentru acorduri.", es: "Edita las letras. Usa [Acorde] para acordes.", en: "Edit lyrics. Use [Chord] for chords." },
  "song.updated": { ro: "Cântarea a fost actualizată!", es: "¡Canción actualizada!", en: "Song updated!" },
  "song.saveError": { ro: "Eroare la salvare", es: "Error al guardar", en: "Error saving" },
  "song.pitchListening": { ro: "Ascultare live...", es: "Escuchando en vivo...", en: "Listening live..." },
  "song.pitchDetect": { ro: "Detectare ton", es: "Detectar tono", en: "Detect pitch" },
  "song.pitchNote": { ro: "Nota", es: "Nota", en: "Note" },
  "song.pitchSing": { ro: "Cântă sau redă melodia...", es: "Canta o reproduce la melodía...", en: "Sing or play the melody..." },
  "song.pitchTap": { ro: "Apasă pentru a detecta tonul", es: "Pulsa para detectar el tono", en: "Tap to detect pitch" },
  "song.translate": { ro: "Traduce", es: "Traducir", en: "Translate" },
  "song.translating": { ro: "Se traduce...", es: "Traduciendo...", en: "Translating..." },
  "song.translateError": { ro: "Eroare la traducere", es: "Error al traducir", en: "Translation error" },
  "song.original": { ro: "Original", es: "Original", en: "Original" },

  // Pitch Detector (Library)
  "pitch.listening": { ro: "Ascultare live...", es: "Escuchando en vivo...", en: "Listening live..." },
  "pitch.detect": { ro: "Detectare ton", es: "Detectar tono", en: "Detect pitch" },
  "pitch.currentNote": { ro: "Nota curentă", es: "Nota actual", en: "Current note" },
  "pitch.sing": { ro: "Cântă sau redă o melodie...", es: "Canta o reproduce una melodía...", en: "Sing or play a melody..." },
  "pitch.tap": { ro: "Apasă pentru a detecta tonul", es: "Pulsa para detectar el tono", en: "Tap to detect pitch" },

  // Add Song Form
  "addSong.title": { ro: "Cântare nouă", es: "Nueva canción", en: "New song" },
  "addSong.cancel": { ro: "Anulează", es: "Cancelar", en: "Cancel" },
  "addSong.save": { ro: "Salvează", es: "Guardar", en: "Save" },
  "addSong.songTitle": { ro: "Titlu", es: "Título", en: "Title" },
  "addSong.songTitlePlaceholder": { ro: "Numele cântării", es: "Nombre de la canción", en: "Song name" },
  "addSong.artist": { ro: "Artist", es: "Artista", en: "Artist" },
  "addSong.artistPlaceholder": { ro: "Numele artistului", es: "Nombre del artista", en: "Artist name" },
  "addSong.collection": { ro: "Colecția", es: "Colección", en: "Collection" },
  "addSong.lyrics": { ro: "Versuri", es: "Letras", en: "Lyrics" },
  "addSong.lyricsHint": { ro: "Scrie versurile fără acorduri, apoi apasă „Adaugă acorduri AI" sau adaugă manual: [Am]Text [G]versuri", es: "Escribe la letra sin acordes, luego pulsa \"Añadir acordes AI\" o añade manualmente: [Am]Texto [G]letra", en: "Write lyrics without chords, then press \"Add AI chords\" or add manually: [Am]Text [G]lyrics" },
  "addSong.aiChords": { ro: "Adaugă acorduri AI", es: "Añadir acordes AI", en: "Add AI chords" },
  "addSong.generating": { ro: "Generare...", es: "Generando...", en: "Generating..." },
  "addSong.lyricsRequired": { ro: "Scrie mai întâi versurile", es: "Escribe primero la letra", en: "Write the lyrics first" },
  "addSong.titleRequired": { ro: "Titlul și versurile sunt obligatorii", es: "El título y la letra son obligatorios", en: "Title and lyrics are required" },
  "addSong.added": { ro: "Cântarea a fost adăugată!", es: "¡Canción añadida!", en: "Song added!" },
  "addSong.error": { ro: "Eroare la salvare", es: "Error al guardar", en: "Error saving" },
  "addSong.chordsAdded": { ro: "Acordurile au fost adăugate automat!", es: "¡Acordes añadidos automáticamente!", en: "Chords added automatically!" },
  "addSong.chordsError": { ro: "Nu s-au putut genera acordurile", es: "No se pudieron generar los acordes", en: "Could not generate chords" },
  "addSong.unknown": { ro: "Necunoscut", es: "Desconocido", en: "Unknown" },

  // Collections
  "collections.title": { ro: "Colecții", es: "Colecciones", en: "Collections" },
  "collections.songCollections": { ro: "Colecții de cântări", es: "Colecciones de canciones", en: "Song collections" },
  "collections.custom": { ro: "Colecții personalizate", es: "Colecciones personalizadas", en: "Custom collections" },
  "collections.noCustom": { ro: "Nicio colecție personalizată. Creează una!", es: "No hay colecciones personalizadas. ¡Crea una!", en: "No custom collections. Create one!" },
  "collections.noSongs": { ro: "Nicio cântare în colecție.", es: "No hay canciones en la colección.", en: "No songs in collection." },
  "collections.namePlaceholder": { ro: "Numele colecției", es: "Nombre de la colección", en: "Collection name" },
  "collections.create": { ro: "Creează", es: "Crear", en: "Create" },
  "collections.created": { ro: "Colecție creată!", es: "¡Colección creada!", en: "Collection created!" },
  "collections.deleted": { ro: "Șters!", es: "¡Eliminada!", en: "Deleted!" },
  "collections.addSongs": { ro: "Adaugă cântări:", es: "Añadir canciones:", en: "Add songs:" },
  "collections.added": { ro: "Adăugat!", es: "¡Añadida!", en: "Added!" },
  "collections.songs": { ro: "cântări", es: "canciones", en: "songs" },
  "collections.customDesc": { ro: "Colecție personalizată", es: "Colección personalizada", en: "Custom collection" },

  // Settings
  "settings.title": { ro: "Setări", es: "Ajustes", en: "Settings" },
  "settings.version": { ro: "Versiunea", es: "Versión", en: "Version" },
  "settings.description": { ro: "Aplicație pentru cântări creștine românești cu acorduri, transpunere și defilare automată.", es: "Aplicación de canciones cristianas rumanas con acordes, transposición y desplazamiento automático.", en: "App for Romanian Christian hymns with chords, transposition and auto-scroll." },
  "settings.darkMode": { ro: "Mod întunecat", es: "Modo oscuro", en: "Dark mode" },
  "settings.lightMode": { ro: "Mod luminos", es: "Modo claro", en: "Light mode" },
  "settings.tapToChange": { ro: "Apasă pentru a schimba", es: "Pulsa para cambiar", en: "Tap to change" },
  "settings.liquidGlass": { ro: "Liquid Glass", es: "Liquid Glass", en: "Liquid Glass" },
  "settings.liquidGlassDesc": { ro: "Design translucid tip Apple", es: "Diseño translúcido tipo Apple", en: "Apple-style translucent design" },
  "settings.features": { ro: "Funcții disponibile", es: "Funciones disponibles", en: "Available features" },
  "settings.featuresDesc": { ro: "Descoperă ce poate face aplicația", es: "Descubre qué puede hacer la app", en: "Discover what the app can do" },
  "settings.install": { ro: "Instalează aplicația", es: "Instalar la aplicación", en: "Install the app" },
  "settings.installIOS": { ro: "Pe iPhone: apasă butonul Share → Add to Home Screen.", es: "En iPhone: pulsa el botón Compartir → Añadir a pantalla de inicio.", en: "On iPhone: tap Share → Add to Home Screen." },
  "settings.installAndroid": { ro: "Pe Android: apasă meniul browserului → Install app.", es: "En Android: pulsa el menú del navegador → Instalar app.", en: "On Android: tap browser menu → Install app." },
  "settings.about": { ro: "Despre", es: "Acerca de", en: "About" },
  "settings.aboutText": { ro: "Cântări din colecțiile Speranța, Boanerges și alte imnuri creștine tradiționale. Funcționează offline după prima încărcare.", es: "Canciones de las colecciones Speranța, Boanerges y otros himnos cristianos tradicionales. Funciona offline tras la primera carga.", en: "Songs from Speranța, Boanerges collections and other traditional Christian hymns. Works offline after first load." },
  "settings.language": { ro: "Limba interfeței", es: "Idioma de la interfaz", en: "Interface language" },
  "settings.languageDesc": { ro: "Schimbă limba aplicației", es: "Cambiar el idioma de la app", en: "Change app language" },

  // Features
  "feature.pitchDetection": { ro: "Detectare Ton", es: "Detección de Tono", en: "Pitch Detection" },
  "feature.pitchDesc": { ro: "Detectează tonalitatea cântării folosind microfonul.", es: "Detecta la tonalidad usando el micrófono.", en: "Detect the key using the microphone." },
  "feature.aiChords": { ro: "Acorduri AI", es: "Acordes AI", en: "AI Chords" },
  "feature.aiChordsDesc": { ro: "Adaugă automat acorduri la versuri folosind inteligență artificială.", es: "Añade acordes automáticamente usando inteligencia artificial.", en: "Automatically add chords using artificial intelligence." },
  "feature.complexChords": { ro: "Acorduri Complexe", es: "Acordes Complejos", en: "Complex Chords" },
  "feature.complexChordsDesc": { ro: "Vizualizează variante avansate ale acordurilor.", es: "Visualiza variantes avanzadas de los acordes.", en: "View advanced chord variants." },
  "feature.manualEdit": { ro: "Editare Manuală", es: "Edición Manual", en: "Manual Editing" },
  "feature.manualEditDesc": { ro: "Editează versurile și acordurile direct în aplicație.", es: "Edita las letras y los acordes directamente en la app.", en: "Edit lyrics and chords directly in the app." },
  "feature.transpose": { ro: "Transpunere", es: "Transposición", en: "Transposition" },
  "feature.transposeDesc": { ro: "Schimbă tonalitatea cântării cu +/- semitonuri.", es: "Cambia la tonalidad con +/- semitonos.", en: "Change the key by +/- semitones." },
  "feature.autoScroll": { ro: "Defilare Automată", es: "Desplazamiento Automático", en: "Auto-scroll" },
  "feature.autoScrollDesc": { ro: "Activează scroll-ul automat pentru a citi versurile fără mâini.", es: "Activa el desplazamiento automático para leer sin manos.", en: "Enable auto-scroll to read hands-free." },
  "feature.collections": { ro: "Colecții", es: "Colecciones", en: "Collections" },
  "feature.collectionsDesc": { ro: "Creează playlisturi personalizate și organizează cântările.", es: "Crea playlists personalizadas y organiza las canciones.", en: "Create custom playlists and organize songs." },

  // Splash
  "splash.subtitle": { ro: "Cântări Creștine", es: "Cantos Cristianos", en: "Christian Hymns" },
} as const;

type TranslationKey = keyof typeof translations;

let currentLanguage: Language = (localStorage.getItem("app-language") as Language) || "ro";
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach(l => l());
}

export function useLanguage() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key]?.[currentLanguage] || translations[key]?.["ro"] || key;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    currentLanguage = lang;
    localStorage.setItem("app-language", lang);
    notify();
  }, []);

  return { language: currentLanguage, setLanguage, t };
}
