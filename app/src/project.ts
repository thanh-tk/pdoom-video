// The video being rendered: what is song-specific outside data/ and the scenes.
// Boilerplate placeholder: `bun scripts/new-video.ts --id <id> ...` rewrites this file for a new video.
export const PROJECT = {
  title: 'New video',
  /** Song file, relative to the repo root (served at /audio/... by vite.config.ts). */
  audio: 'audio/song.mp3',
  /** Default file name of `render.ts video` in out/. */
  output: 'video.mp4',
} as const;
