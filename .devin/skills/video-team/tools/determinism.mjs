// Seek-order determinism + entry-start coverage: render every entry start, start-1/60 and mid-entry,
// forward then reverse then forward again; compare PNG hashes per time. Usage: node determinism.mjs <out.json>
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const require = createRequire(new URL('../../../../app/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const base = process.env.BASE ?? 'http://localhost:5197';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1246/chrome-linux64/chrome`, headless: true });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`${base}/?export=1`);
await p.waitForFunction(() => window.__pdoom && (window.__pdoom.ready || window.__pdoom.error), null, { timeout: 120000 });
const tl = await p.evaluate(() => window.__pdoom.timeline);
const ts = [];
for (const e of tl) { ts.push(e.start, Math.max(0, e.start - 1 / 60), (e.start + e.end) / 2); }
const shot = async (t) => { await p.evaluate((x) => window.__pdoom.still(x), t); return createHash('sha256').update(await p.evaluate(() => window.__pdoom.png())).digest('hex'); };
const runs = [];
for (const order of [ts, [...ts].reverse(), ts]) { const m = {}; for (const t of order) m[t.toFixed(4)] = await shot(t); runs.push(m); }
const keys = Object.keys(runs[0]);
const diff = keys.filter((k) => runs[0][k] !== runs[1][k] || runs[0][k] !== runs[2][k]);
const errs = await p.evaluate(() => window.__pdoom.errors);
writeFileSync(process.argv[2], JSON.stringify({ times: keys.length, mismatches: diff.map((k) => [k, runs[0][k].slice(0, 10), runs[1][k].slice(0, 10), runs[2][k].slice(0, 10)]), errors: errs }, null, 2));
console.log(`times ${keys.length} x3 orders, mismatches ${diff.length} ${JSON.stringify(diff)}, scene errors ${JSON.stringify(errs)}`);
await b.close();
