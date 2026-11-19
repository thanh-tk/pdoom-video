// The edit: which scene plays when. Boundaries are anchored to lyric lines and snapped
// to the beat grid, so they follow the aligned data (data/lyrics.json, data/audio.json).
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import { lineCut, type Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  /** Cut before the matching line (see engine/lyrics.ts lineCut): last beat at/before its
   *  first word, held off until the previous line's last word is being sung. */
  const cut = (q: string, nth = 0) => {
    const l = ly.get(q, nth);
    return lineCut(au, l, ly.lines[l.i - 1]);
  };
  /** Nearest downbeat to the end of a line. */
  const after = (q: string, nth = 0) => {
    const e = ly.get(q, nth).end;
    return au.downbeats.reduce((b, d) => (Math.abs(d - e) < Math.abs(b - e) ? d : b), au.downbeats[0] ?? e);
  };
  void after;

  const E = (id: string, file: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, load: scene(file), start, end, ...extra });
  void E;

  // Pattern for real entries (cut() finds the line by content; nth selects the occurrence):
  //   E('intro', 'intro', 0, cut('Good to go!')),
  //   E('verse1', 'verse1', cut('Good to go!'), cut('next line', 0)),
  return [
    E('slate', 'slate', 0, au.duration),
  ];
}
