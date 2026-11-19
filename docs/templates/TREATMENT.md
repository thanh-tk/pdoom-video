# __TITLE__ — treatment & style bible (draft 1, for approval)

Song: "__TITLE__" by __ARTIST__. Genre, length (s), tempo (constant or drifting, from `data/audio.json`), key changes, the sections that matter. What the lyrics are about, in one sentence.

## The idea in one paragraph

**One sentence that names the concept.** Then: the story or the system the video follows, the two or three worlds it alternates between and which sections they map to, and the one recurring motif that ties every scene together and pays off at the end.

## Tone

- Mood and audience (who must enjoy it, who must still understand it).
- How it moves with the music: what lands on beats, snares, downbeats; holds, then snaps.
- What it must never look like (stock imagery, generic templates, effects to avoid).
- Readable: every lyric line on screen and synced per word.

## Look

### Palette (sRGB)

| key | hex | use |
|---|---|---|
| ground | `#......` | backgrounds |
| text | `#......` | primary text |
| accent | `#......` | the motif, hits |
| accentWash | `#......` | light wash behind accent-coloured text (every tone needs one) |

Add the keys to `app/src/engine/palette.ts` and the matching `C_*` constants to `app/src/engine/glsl/common.ts`. Light grounds run with `LIGHT_POST` (no bloom: white must not glow); say where glow is allowed.

### Typography

- Body / UI font, display font for the slams, mono for code or data. Fonts go in `app/public/fonts/` (OFL) and `F` in `app/src/engine/type.ts`.
- Kerned type, typographic punctuation (straight quotes only in code and typed input), no outlined or haloed type.

### Motifs

1. **The motif**: what it is, how it moves, where it pays off.
2. **Punctuation**: the recurring element that stamps the hook words.
3. **Background life**: what moves between lyric moments (follows `f.a` envelopes).

### Karaoke rules

Every line readable and synced per word: a word lights exactly at its start, never ahead of the voice; dim preview of the line ≤0.4 s early; the wipe finishes before the next sub-scene cut (`lyricBlock(..., { win })`). Lyrics live inside the world (typed, stamped, written), not as subtitles. Title-safe margins (≥96 px).

### Assets

- Screenshots / photos / logos: source, how captured, licence or sign-off, what is mock data.
- Rebuilt in the engine (crisp at 4K, animatable on the beat): which moments.

### Internal cut / public cut

What is internal-only (real code, names, logos, numbers) and goes through `CUT` (`?cut=public`, `render.ts --cut public`); what replaces it in the public cut.

## Plates (sections from `data/audio.json`; times approximate, cuts derived from the lyrics in `src/timeline.ts`)

| id | bars | ≈ time | lyric | world |
|---|---|---|---|---|
| `plate1` | 0–8 | 0.0–15.0 | first line… | … |

### `plate1` — "first lyric line"
What the viewer sees, line by line: which word triggers which change, where the camera goes, how it hands over to the next plate.

## Production constraints

- This machine (Intel Core Ultra 7 165H, integrated graphics): 2D / 2.5D plates (Canvas2D layers, ≤2 uploads per scene, textured quads, `LineBatch`), no ray-marching; budget ≤ ~65 ms/frame at one sample (`render.ts perf`). The live preview needs `?scale=0.5`.
- Determinism, beat-synced motion, per-word sync, hard cuts on downbeats: see `docs/ENGINE.md` and `AGENTS.md`.
- Assets and licences: list them.
