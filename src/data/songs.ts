export interface Song {
  id: string;
  title: string;
  artist: string;
  collection: string;
  lyrics: string; // lines with [Chord] notation
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function transposeChord(chord: string, semitones: number): string {
  // Handle compound chords like Am/G, C/E
  if (chord.includes("/")) {
    const parts = chord.split("/");
    return parts.map((p) => transposeChord(p, semitones)).join("/");
  }

  // Extract root note (with possible #/b)
  let root = chord[0];
  let rest = chord.slice(1);

  if (rest.startsWith("#")) {
    root += "#";
    rest = rest.slice(1);
  } else if (rest.startsWith("b")) {
    // Convert flat to sharp equivalent
    const flatMap: Record<string, string> = {
      Db: "C#", Eb: "D#", Fb: "E", Gb: "F#", Ab: "G#", Bb: "A#", Cb: "B",
    };
    const key = root + "b";
    if (flatMap[key]) {
      root = flatMap[key];
      rest = rest.slice(1);
    }
  }

  const index = NOTES.indexOf(root);
  if (index === -1) return chord; // unknown note, return as-is

  const newIndex = (index + semitones + 120) % 12; // +120 to handle negatives
  return NOTES[newIndex] + rest;
}

export function transposeLine(line: string, semitones: number): string {
  if (semitones === 0) return line;
  return line.replace(/\[([^\]]+)\]/g, (_, chord) => {
    return `[${transposeChord(chord, semitones)}]`;
  });
}

export function parseLyricsLine(line: string): Array<{ type: "text" | "chord"; value: string }> {
  const parts: Array<{ type: "text" | "chord"; value: string }> = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: line.slice(lastIndex, match.index) });
    }
    parts.push({ type: "chord", value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push({ type: "text", value: line.slice(lastIndex) });
  }

  return parts;
}

export const songs: Song[] = [
  {
    id: "1",
    title: "Cât de bun e Dumnezeu",
    artist: "Speranța",
    collection: "Speranța",
    lyrics: `[G]Cât de bun e [D]Dumnezeu,
[Em]Cât de minunat e [C]Tatăl meu,
[G]El mă poartă [D]pe a Lui cale,
[C]Și mă ține [D]în a [G]Sa iubire.

[G]Când sunt trist și [D]obosit,
[Em]El mă ia de [C]mână blând,
[G]Mă ridică [D]din cădere,
[C]Și-mi dă [D]pace și pu[G]tere.

[Em]Slavă, [C]slavă,
[G]Doar a [D]Lui e toată [Em]slava,
[C]Slavă, [D]slavă,
[G]Cât de bun e Dumnezeu!`
  },
  {
    id: "2",
    title: "Isus, Tu ești viața mea",
    artist: "Boanerges",
    collection: "Boanerges",
    lyrics: `[Am]Isus, Tu ești [F]viața mea,
[C]Tu ești tot ce [G]am nevoie,
[Am]În brațele [F]Tale stau,
[C]Și nimic nu [G]mă desparte.

[F]Tu ești [C]lumina mea,
[G]Soarele [Am]dimineții,
[F]Tu ești [C]speranța mea,
[G]Stânca veșni[Am]ciei.

[Am]Când valurile [F]vin spre mine,
[C]Tu ești ancora [G]sufletului,
[Am]Te ador cu [F]toată inima,
[C]Isus, Tu ești [G]totul [Am]meu.`
  },
  {
    id: "3",
    title: "Mare ești Doamne",
    artist: "Speranța",
    collection: "Speranța",
    lyrics: `[D]Mare ești [A]Doamne,
[Bm]Mare în [G]slavă,
[D]Mare în [A]putere,
[G]Mare în [A]har.

[D]Cerurile [A]spun slava Ta,
[Bm]Pământul [G]Îți cântă,
[D]Mările [A]strigă,
[G]Mare ești [A]Tu, [D]Doamne!

[Bm]Cine este [G]ca Tine,
[D]Între dum[A]nezei?
[Bm]Nimeni nu [G]este,
[D]Sfânt ca [A]Tine, [D]Doamne.`
  },
  {
    id: "4",
    title: "Harul Tău îmi e de-ajuns",
    artist: "Boanerges",
    collection: "Boanerges",
    lyrics: `[C]Harul Tău îmi [G]e de-ajuns,
[Am]Puterea Ta în [F]slăbiciune,
[C]Se desăvâr[G]șește,
[F]Și mă [G]ține sus.

[Am]Nu mă tem de [F]ce va fi,
[C]Căci Tu ești [G]cu mine,
[Am]Brațul Tău [F]mă apără,
[C]Zi de [G]zi, me[Am]reu.

[F]Har peste [C]har,
[G]Binecuvântare [Am]peste binecuvântare,
[F]Tot ce am [C]e de la Tine,
[G]Slavă Ție, [C]Domn.`
  },
  {
    id: "5",
    title: "Aleluia, slavă Domnului",
    artist: "Speranța",
    collection: "Speranța",
    lyrics: `[E]Aleluia, [B]slavă Domnului,
[C#m]Aleluia, [A]slavă Regelui,
[E]El domneș[B]te peste tot,
[A]Slavă veș[B]nică doar [E]Lui.

[C#m]Îngerii [A]Îi cântă,
[E]Cerurile [B]Îl laudă,
[C#m]Toată firea [A]mărturisește,
[E]Isus e [B]Domn și [E]Rege.

[A]Aleluia, [E]aleluia,
[B]Aleluia, [C#m]slavă Lui,
[A]Aleluia, [E]aleluia,
[B]Isus e [E]Domn!`
  },
  {
    id: "6",
    title: "Eu am un Prieten",
    artist: "Boanerges",
    collection: "Boanerges",
    lyrics: `[G]Eu am un Prie[Em]ten
[C]Care m-a iu[D]bit,
[G]Și viața Lui [Em]toată
[C]Pentru mine [D]a jertfit.

[Em]El e lângă [C]mine,
[G]Oriunde [D]merg,
[Em]El mă înso[C]țește,
[G]El nu m-a [D]uitat.

[C]Isus, Prie[G]tenul meu,
[D]Tu ești to[Em]tul meu,
[C]Isus, Prie[G]tenul meu,
[D]Te iubesc me[G]reu.`
  },
  {
    id: "7",
    title: "Doamne, fă-mă un vas",
    artist: "Speranța",
    collection: "Hymns",
    lyrics: `[Am]Doamne, [Dm]fă-mă un vas
[G]Ales pen[C]tru Tine,
[Am]Umple-mă [Dm]cu Duhul Tău
[E]Sfânt în [Am]mine.

[F]Frânge-mă și [C]modelează-mă,
[Dm]Arde tot ce [Am]nu-Ți place,
[F]Fă din mine [C]un altar,
[E]Viu de-a pu[Am]rurea.

[Dm]Ia-mă [Am]așa cum sunt,
[F]Cu tot ce [C]am,
[Dm]Și fă din [Am]mine,
[E]Vasul [Am]Tău.`
  },
  {
    id: "8",
    title: "Binecuvântat ești Tu",
    artist: "Boanerges",
    collection: "Boanerges",
    lyrics: `[D]Binecuvân[G]tat ești Tu,
[A]Doamne al [D]oștirilor,
[Bm]Plin de [G]slavă,
[A]Plin de [D]har.

[G]Te înăl[D]țăm pe Tine,
[A]Te ado[Bm]răm pe Tine,
[G]Îți cân[D]tăm cu bucurie,
[A]Binecuvântat ești [D]Tu.

[Bm]Sfânt, sfânt, [G]sfânt,
[D]Domn al [A]puterilor,
[Bm]Cerul și [G]pământul,
[D]Sunt pline [A]de slava [D]Ta.`
  },
  {
    id: "9",
    title: "Pas cu pas cu Tine",
    artist: "Speranța",
    collection: "Hymns",
    lyrics: `[C]Pas cu pas cu [F]Tine, Doamne,
[G]Vreau să [C]merg mereu,
[Am]Pe cărarea [F]Ta cea dreaptă,
[G]Lângă Tine, [C]Domn.

[F]Ține-mă de [C]mână, Tată,
[G]Călăuzește-[Am]mă,
[F]Prin furtuni și [C]prin lumină,
[G]Fii cu [C]mine-ntotdeauna.

[Am]Chiar de-aș [F]merge
[C]Prin vale [G]de umbră,
[Am]Nu mă [F]tem,
[C]Tu ești [G]cu [C]mine.`
  },
  {
    id: "10",
    title: "Har nemărginit",
    artist: "Speranța",
    collection: "Hymns",
    lyrics: `[G]Har nemăr[C]ginit,
[G]Ce dulce [D]sunet,
[G]Ce m-a sal[C]vat pe mine,
[G]Un om [D]pier[G]dut.

[G]Am fost or[C]b dar văd,
[G]Am fost pier[D]dut și-s aflat,
[G]Harul m-a [C]căutat,
[G]Și m-a [D]sal[G]vat.

[Em]Prin har am [C]fost salvat,
[G]Prin credin[D]ță primesc,
[Em]Nu prin fap[C]tele mele,
[G]Ci prin [D]harul [G]Său.`
  },
];
