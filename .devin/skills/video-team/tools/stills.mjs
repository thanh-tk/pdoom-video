// Real-data stills via the app's ?export=1 API (no render.ts / Chrome needed).
// Usage: BASE=http://localhost:5197 [EXTRA_T=t1,t2] node stills.mjs <outdir> <entryIds,comma> [internal|public]
// Writes, per entry, frames at every line's middle, its last word +0.15 s, exactly lineCut-1/60 and the entry end-1/60, plus index.tsv; prints timeline, scene errors, browser log.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../../../../app/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const [out, ids, cut = 'internal'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? 'http://localhost:5192';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome`, headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const log = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(`${m.type()}: ${m.text()}`); });
p.on('pageerror', (e) => log.push(`pageerror: ${e.message}`));
await p.goto(`${base}/?export=1${cut === 'public' ? '&cut=public' : ''}`);
await p.waitForFunction(() => window.__pdoom && (window.__pdoom.ready || window.__pdoom.error), null, { timeout: 120000 });
const boot = await p.evaluate(() => window.__pdoom.error ?? null);
if (boot) { console.log('BOOT ERROR', boot); process.exit(2); }
const tl = await p.evaluate(() => window.__pdoom.timeline);
const ly = await (await fetch(`${base}/data/lyrics.json`)).json();
const au = await (await fetch(`${base}/data/audio.json`)).json();
// lineCut as in engine/lyrics.ts: last beat at/before next's first word, held off while prev's last word is sung
const lineCut = (next, prev) => {
  const s0 = next.words[0].start;
  const c = au.beats.filter((b) => b <= s0 + 0.02 + 1e-9).at(-1) ?? 0;
  const p = prev?.words.at(-1).start;
  return p === undefined ? c : Math.max(c, Math.min(p + 0.12, s0 - 0.02));
};
const want = ids.split(',');
const shots = [];
for (const e of tl.filter((x) => want.includes(x.id))) {
  const lines = ly.lines.filter((l) => l.start >= e.start - 0.5 && l.start < e.end);
  for (const [k, l] of lines.entries()) {
    const nxt = lines[k + 1];
    shots.push([e.id, `L${l.i} mid`, (l.start + l.end) / 2]);
    for (const w of l.words.slice(-1)) shots.push([e.id, `L${l.i} last-word+0.15`, Math.min(w.start + 0.15, e.end - 1 / 60)]);
    if (nxt) shots.push([e.id, `L${l.i} cut-1/60`, lineCut(nxt, l) - 1 / 60]);
  }
  shots.push([e.id, 'entry end-1/60', e.end - 1 / 60]);
}
for (const x of (process.env.EXTRA_T ?? '').split(',').filter(Boolean)) shots.push(['extra', `t=${x}`, +x]);
const idx = [];
let n = 0;
for (const [id, label, t] of shots) {
  await p.evaluate((tt) => window.__pdoom.still(tt), t);
  const png = await p.evaluate(() => window.__pdoom.png());
  const f = `${String(n++).padStart(3, '0')}_${id}_${t.toFixed(3)}.png`;
  writeFileSync(`${out}/${f}`, Buffer.from(png, 'base64'));
  idx.push(`${f}\t${id}\t${label}\t${t.toFixed(3)}`);
}
const errs = await p.evaluate(() => window.__pdoom.errors);
writeFileSync(`${out}/index.tsv`, idx.join('\n') + '\n');
console.log('timeline', JSON.stringify(tl.map((e) => [e.id, +e.start.toFixed(2), +e.end.toFixed(2)])));
console.log('frames', n, 'scene errors', JSON.stringify(errs));
console.log('browser log', JSON.stringify(log.filter((s) => !s.includes('favicon'))));
await b.close();
