// check.ts -- repo hygiene check: typecheck both configs + scan for mojibake / CR CR LF.
// Usage (from app/): bun scripts/check.ts [--no-tsc] [files...]
// Lines containing the marker `check:ok` are skipped (docs that quote mojibake on purpose
// should be marked e.g. `<!-- check:ok -->`).
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2).filter(a => a !== '--no-tsc');
const NO_TSC = process.argv.includes('--no-tsc');
const APP = path.resolve(import.meta.dir, '..');
const ROOT = path.resolve(APP, '..');
let failed = false;

if (!NO_TSC) {
  for (const cfg of ['tsconfig.json', 'tsconfig.scripts.json']) {
    try {
      execSync(`"${process.execPath}" x tsc --noEmit -p ${cfg}`, { cwd: APP, stdio: 'pipe', encoding: 'utf-8' });
      console.log(`tsc -p ${cfg}: OK`);
    } catch (e: any) {
      failed = true;
      console.log(`tsc -p ${cfg}: FAILED\n${e.stdout ?? ''}${e.stderr ?? ''}`);
    }
  }
}

// mojibake signatures, built from escapes so this file stays pure ASCII:
// U+00E2 U+20AC, U+00E2 U+2020, U+00C3<U+0080-BF>, U+00C2<U+0080-BF>, U+FFFD
const MOJI = /\u00e2\u20ac|\u00e2\u2020|\u00c3[\u0080-\u00bf]|\u00c2[\u0080-\u00bf]|\ufffd/;
const files = argv.length ? argv.map(f => path.resolve(f))
  : execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf-8' }).split('\n')
    .filter(f => /\.(ts|js|mjs|py|md|json|html|txt)$/.test(f))
    .filter(f => f !== 'package-lock.json' && !f.startsWith('app/public/fonts/'))
    .map(f => path.join(ROOT, f));
for (const f of files) {
  if (!existsSync(f)) continue;
  let text: string;
  try { text = readFileSync(f, 'utf-8'); } catch { continue; }
  text.split('\n').forEach((ln, i) => {
    if (ln.includes('check:ok')) return;
    const m = ln.match(MOJI);
    if (m) { failed = true; console.log(`${f}:${i + 1}: mojibake '${m[0]}': ${ln.trim().slice(0, 80)}`); }
    if (ln.includes('\r\r')) { failed = true; console.log(`${f}:${i + 1}: CR CR LF: ${ln.slice(0, 60)}`); }
  });
}
if (failed) process.exit(1);
console.log('check: OK');
