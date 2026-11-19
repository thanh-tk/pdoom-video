// new-video.ts — scaffold the repo for a NEW video (new song, lyrics, scenes).
// Usage (from app/):
//   bun scripts/new-video.ts --id <id> --title "<Title>" --audio <path> --lyrics <file.txt>
//     [--artist "<name>"] [--bpm <n>] [--clean] [--force] [--dry-run]
// --clean removes the previous video's scenes/assets/data (safe guards apply).
// --dry-run runs every check and prints the full report, writes/deletes nothing.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, copyFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const flag = (k: string) => argv.includes(`--${k}`);
const ROOT = path.resolve(import.meta.dir, '../..');
const DRY = flag('dry-run'), FORCE = flag('force'), CLEAN = flag('clean');

const id = opt('id'), title = opt('title'), audioArg = opt('audio'), lyricsArg = opt('lyrics');
const artist = opt('artist') ?? 'unknown artist';
const bpm = opt('bpm') ? +opt('bpm')! : null;

const die = (m: string): never => { console.error(`error: ${m}`); process.exit(1); };
if (!id || !/^[a-z][a-z0-9_]*$/.test(id)) die(`--id must match ^[a-z][a-z0-9_]*$ (got '${id}')`);
if (!title) die('--title required');
if (!audioArg) die('--audio required');
if (!lyricsArg) die('--lyrics required');

const ext = path.extname(audioArg!).toLowerCase();
if (!['.mp3', '.wav', '.flac', '.m4a', '.ogg'].includes(ext)) die(`unsupported audio extension '${ext}'`);
const audioAbs = path.resolve(audioArg!);
const lyricsAbs = path.resolve(lyricsArg!);
if (!existsSync(audioAbs)) die(`audio not found: ${audioAbs}`);
if (!existsSync(lyricsAbs)) die(`lyrics not found: ${lyricsAbs}`);

// ---------------------------------------------------------------- safety
const git = (c: string) => execSync(`git ${c}`, { cwd: ROOT, encoding: 'utf-8' }).trim();
const branch = git('rev-parse --abbrev-ref HEAD');
const dirty = git('status --porcelain');
if (CLEAN && !FORCE) {
  if (['main', 'new-video'].includes(branch)) die(`--clean refused on branch '${branch}' (a finished video); branch off it first or use --force`);
  if (dirty) die(`--clean refused: working tree is dirty (deletions must be recoverable from git):\n${dirty}`);
}
const relAudio = `audio/${id}${ext}`;
const relLyr = `lyrics/${id}.src.js`;
const relSong = `analysis/songs/${id}.py`;
for (const rel of [relAudio, relLyr, relSong])
  if (existsSync(path.join(ROOT, rel)) && !FORCE) die(`refusing to overwrite existing ${rel} (use --force)`);

// --clean: confirm _ui.ts and slate.ts don't reference deleted scenes/assets (before any write)
if (CLEAN) {
  const ui = readFileSync(path.join(ROOT, 'app/src/scenes/_ui.ts'), 'utf-8');
  const slate = readFileSync(path.join(ROOT, 'app/src/scenes/slate.ts'), 'utf-8');
  const refs = ['screens/', 'partners/', 'brand/', "loadImage('"];
  const hits = refs.filter(r => ui.includes(r) || slate.includes(r));
  if (hits.length) die(`_ui.ts/slate.ts reference assets that --clean would delete: ${hits.join(', ')} — report to the lead`);
}

const written: string[] = [], deleted: string[] = [];
const write = (rel: string, text: string) => {
  written.push(rel);
  if (DRY) return;
  const p = path.join(ROOT, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, text, 'utf-8');
};
const del = (rel: string) => {
  deleted.push(rel);
  if (DRY) return;
  rmSync(path.join(ROOT, rel), { recursive: true, force: true });
};

// ---------------------------------------------------------------- lyrics parse
const rawLines = readFileSync(lyricsAbs, 'utf-8').replace(/^﻿/, '').replace(/\r\n/g, '\n').split('\n');
const preamble: string[] = [], notes: string[] = [];
type Sec = { name: string; key: string; lines: { n: number; text: string }[] };
const secs: Sec[] = [];
let seenHeader = false;
rawLines.forEach((ln0, i) => {
  const ln = ln0.trim().replace(/\s+/g, ' ');
  if (!ln) return;
  const h = ln.match(/^\[([^\]]+)\]$/);
  if (h) {
    seenHeader = true;
    secs.push({ name: h[1]!.split(':')[0]!.trim(), key: h[1]!.split(':')[0]!.trim().toLowerCase(), lines: [] });
    return;
  }
  if (!seenHeader) { preamble.push(ln); return; }
  if (/^\(.*\)$/.test(ln)) { notes.push(`line ${i + 1}: note skipped '${ln}'`); return; }
  secs[secs.length - 1]!.lines.push({ n: i + 1, text: ln });
});

// expand empty sections = repeat of the most recent earlier section with the same key
const expansions: string[] = [];
secs.forEach((s, i) => {
  if (s.lines.length) return;
  const src = [...secs.slice(0, i)].reverse().find(o => o.key === s.key && o.lines.length);
  if (src) { s.lines = src.lines.map(l => ({ ...l })); expansions.push(`'${s.name}' = repeat of '${src.name}' (${src.lines.length} lines)`); }
  else expansions.push(`'${s.name}' is empty and no earlier section with key '${s.key}' exists — WARNING`);
});

// parentheticals: backing echo iff every word already appeared earlier in the same line
const echoes: string[] = [], keptParen: string[] = [];
const allLines = secs.flatMap(s => s.lines.map(l => ({ ...l, sec: s.name })));
const lines = allLines.map((l, li) => {
  let text = l.text;
  text = text.replace(/\(([^)]*)\)/g, (m, inner: string, off: number) => {
    const before = text.slice(0, off).replace(/\([^)]*\)/g, ' ');
    const prior = new Set(before.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9']/g, '')).filter(Boolean));
    const words = inner.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9']/g, '')).filter(Boolean);
    if (words.length && words.every(w => prior.has(w))) { echoes.push(`L${li} (file line ${l.n}): removed echo '(${inner})'`); return ' '; }
    keptParen.push(`L${li} (file line ${l.n}): kept '(${inner})' — check whether the lead sings it`); return m;
  });
  return { ...l, text: text.replace(/\s+/g, ' ').trim() };
});

// ---------------------------------------------------------------- flagged tokens (default pron rule = analysis/pron.py)
const pron = (tok: string) => {
  let w = tok.toLowerCase().replace(/’/g, "'");
  w = w.replace(/[^a-z' ]/g, ' ').replace(/^[' ]+|[' ]+$/g, '');
  return w.split(' ').map(p => p.replace(/^'+|'+$/g, '')).filter(Boolean);
};
const flagged: string[] = [];
for (const l of lines)
  for (const tok of l.text.split(' ')) {
    if (!tok) continue;
    const odd = /\d/.test(tok) || (tok.match(/[A-Z]/g) ?? []).length >= 2 || /[a-z][A-Z]/.test(tok) || tok.includes('_');
    if ((odd || pron(tok).length === 0) && !flagged.includes(tok)) flagged.push(tok);
  }

// ---------------------------------------------------------------- write lyrics src
const cleanTitle = title!.replace(/\[/g, '(').replace(/\]/g, ')');
const srcBody = lines.map((l, i) =>
  `  [0.00, 0.00, ${JSON.stringify(l.text)}]${i === lines.length - 1 ? '' : ','}`).join('\n');
const secRanges: string[] = [];
{ let gi = 0; for (const s of secs) { secRanges.push(`${s.name.replace(/\[/g, '(').replace(/\]/g, ')')} = lines ${gi}-${gi + s.lines.length - 1}`); gi += s.lines.length; } }
const lyrSrc = `// ${cleanTitle} — lyric lines for the CTC aligner.
// Times below are PLACEHOLDERS: align.py reads only the text. Before the align step, edit
// every line to what is actually sung (see analysis/work/${id}/whisper_turbo.json):
// repeats written out, dropped lines removed, sung tags added. Backing echoes and ad-libs
// stay OUT of the text (the aligner's 'star' token absorbs them); list them in EXTRA_DESC.
const LY = [
${srcBody}
];
// Sections: ${secRanges.join('; ')}
`;
write(relLyr, lyrSrc);

// ---------------------------------------------------------------- audio + song config
written.push(relAudio);
if (!DRY) { mkdirSync(path.dirname(path.join(ROOT, relAudio)), { recursive: true }); copyFileSync(audioAbs, path.join(ROOT, relAudio)); }

const pyStr = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
let song = readFileSync(path.join(ROOT, 'analysis/songs/_template.py'), 'utf-8')
  .replaceAll('__AUDIO__', pyStr(relAudio.split(path.sep).join('/')))
  .replaceAll('__ID__', pyStr(id!))
  .replaceAll('__TITLE__', pyStr(title!))
  .replaceAll('__ARTIST__', pyStr(artist));
if (bpm !== null)
  song = song.replace('BPM_RANGE = (90.0, 160.0)  # TODO',
    `BPM_RANGE = (${bpm - 8}.0, ${bpm + 8}.0)  # from --bpm ${bpm}; TODO confirm`);
const eol = song.includes('\r\n') ? '\r\n' : '\n';
const pronLines = flagged.length
  ? flagged.map(tk => `    # "${tk.replace(/"/g, '\\"')}": "",  # TODO spell as sung`).join(eol)
  : '    # (no unusual tokens found)';
song = song.replace(/[^\n]*# @PRON_STUB@[^\n]*\n/, pronLines + eol);
const echoLines = echoes.length
  ? echoes.map(e => {
      const m = e.match(/L(\d+) \(file line \d+\): removed echo '\((.*)\)'/)!;
      return `    # (t0, t1, "backing echo '${m[2]!.replace(/"/g, '\\"')}' in line ${m[1]}"),  # TODO times from the Whisper passes`;
    }).join(eol)
  : '    # (none found)';
song = song.replace(/[^\n]*# @ECHOES@[^\n]*\n/, echoLines + eol);
if (song.includes('@PRON_STUB@') || song.includes('@ECHOES@')) die('template placeholders @PRON_STUB@/@ECHOES@ not replaced');
if (flagged.length)
  song = song.replace(`WHISPER_PROMPT = "Song lyrics: ${pyStr(title!)}."`,
    `WHISPER_PROMPT = "Song lyrics: ${pyStr(title!)}. ${[...new Set(flagged.map(tk => tk.replace(/[.,;:!?"'()]+$/, '')))].join(', ')}."`);
write(relSong, song);

// ---------------------------------------------------------------- project.ts + timeline.ts
write('app/src/project.ts', `// The video being rendered: what is song-specific outside data/ and the scenes.
export const PROJECT = {
  title: '${title!.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',
  /** Song file, relative to the repo root (served at /audio/... by vite.config.ts). */
  audio: '${relAudio}',
  /** Default file name of \`render.ts video\` in out/. */
  output: '${id}.mp4',
} as const;
`);

const firstWords = lines[0]?.text.split(' ').slice(0, 3).join(' ') ?? '';
write('app/src/timeline.ts', `// The edit: which scene plays when. Boundaries are anchored to lyric lines and snapped
// to the beat grid, so they follow the aligned data (data/lyrics.json, data/audio.json).
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import { lineCut, type Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[\`./scenes/\${name}.ts\`];
  return m ? m() : Promise.reject(new Error(\`scene module not found: scenes/\${name}.ts\`));
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
  //   E('intro', 'intro', 0, cut('${firstWords.replace(/'/g, "\\'")}')),
  //   E('verse1', 'verse1', cut('${firstWords.replace(/'/g, "\\'")}'), cut('next line', 0)),
  return [
    E('slate', 'slate', 0, au.duration),
  ];
}
`);

// ---------------------------------------------------------------- --clean
if (CLEAN) {
  const scenesDir = path.join(ROOT, 'app/src/scenes');
  for (const f of readdirSync(scenesDir))
    if (f.endsWith('.ts') && !['slate.ts', '_ui.ts'].includes(f)) del(`app/src/scenes/${f}`);
  for (const d of ['app/public/screens', 'app/public/partners', 'app/public/brand']) del(d);
  del('data/lyrics.json'); del('data/audio.json');
  const tpl = readFileSync(path.join(ROOT, 'docs/templates/TREATMENT.md'), 'utf-8')
    .replaceAll('__TITLE__', title!).replaceAll('__ARTIST__', artist);
  write('docs/TREATMENT.md', tpl);
}

// ---------------------------------------------------------------- report
console.log(`=== new-video: ${id} "${title}" (${artist})${DRY ? '  [dry-run]' : ''} ===`);
console.log(`branch: ${branch}${CLEAN ? '  --clean' : ''}${FORCE ? '  --force' : ''}`);
if (preamble.length) console.log(`preamble skipped (${preamble.length}): ${preamble.map(p => `'${p.slice(0, 60)}'`).join(', ')}`);
for (const n of notes) console.log(`note: ${n}`);
console.log(`sections (${secs.length}):`);
{ let gi = 0; for (const s of secs) { console.log(`  ${s.name}: lines ${gi}-${gi + s.lines.length - 1} (${s.lines.length})`); gi += s.lines.length; } }
for (const e of expansions) console.log(`expansion: ${e}`);
for (const e of echoes) console.log(`echo: ${e}`);
for (const k of keptParen) console.log(`kept: ${k}`);
const nw = lines.reduce((a, l) => a + l.text.split(' ').filter(Boolean).length, 0);
console.log(`lines: ${lines.length}  words: ${nw}`);
console.log(`flagged tokens (${flagged.length}): ${flagged.join(', ') || '(none)'}`);
console.log(`files ${DRY ? 'to write' : 'written'}: ${written.filter(Boolean).join(', ')}`);
if (deleted.length) console.log(`files ${DRY ? 'to delete' : 'deleted'}: ${deleted.join(', ')}`);
console.log(`\nNext steps:
0) add every product / proper name of the lyrics to WHISPER_PROMPT in analysis/songs/${id}.py
   (the whisper step reads it; changing it later means re-running whisper)
1) cd ../analysis && SONG=${id} uv run python pipeline.py --until analyze   # everything except align; ~1 h on CPU
2) compare lyrics/${id}.src.js with analysis/work/${id}/whisper_turbo.json, edit to as-sung,
   fill PRON, check with SONG=${id} uv run python pron.py
3) set GRID / DOWNBEAT_PHASE / SECTION_BARS in analysis/songs/${id}.py from analyze's printout
   and bar_phase.py, then SONG=${id} uv run python pipeline.py --from analyze --force
4) preview the slate at http://localhost:5173/?scale=0.5 with sound
5) continue with docs/NEW_VIDEO.md`);
