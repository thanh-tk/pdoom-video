// Debug slate: one Layer2D of timing/alignment readouts — header, beat strip, hit
// meters, the current lyric line with karaoke wipe, word detail, envelopes, song strip.
// Pure function of f.t. Used to QA the timing data before real scenes exist.
import * as THREE from 'three';
import { Scene, type Frame } from '../engine/scene';
import { Layer2D, clearRT } from '../engine/gl';
import { LIN, rgba } from '../engine/palette';
import { F, font, fitSize, glyphX, measure } from '../engine/type';
import { Lyrics } from '../engine/lyrics';
import { frameIdx, clamp } from '../engine/util';

const X0 = 96, X1 = 1824;

export default class Slate extends Scene {
  private layer = new Layer2D();

  render(f: Frame, out: THREE.WebGLRenderTarget) {
    const { renderer, comp, audio, lyrics } = this.ctx;
    clearRT(renderer, out, LIN.ink);
    this.layer.clear();
    const c = this.layer.ctx;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';

    // ------------------------------------------------ header: clock + grid + section
    c.font = font(F.mono(500), 18);
    c.fillStyle = rgba('ash');
    c.fillText(`t ${f.t.toFixed(3)} s · beat ${f.beat.toFixed(2)} · bar ${f.bar.toFixed(2)} · ${audio.section(f.t)?.name ?? '—'}`, X0, 72);
    c.textAlign = 'right';
    c.fillText(`frame ${frameIdx(f.t)}`, X1, 72);
    c.textAlign = 'left';

    // ------------------------------------------------ beat strip: 16 cells around the current beat
    const cellW = (X1 - X0) / 16, gap = 6;
    const b0 = Math.floor(f.beat) - 4, biCur = Math.floor(f.beat);
    const dbs = audio.downbeats;
    const barOf = (bt: number) => { // index of the downbeat within 10 ms, else -1
      let lo = 0, hi = dbs.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (dbs[m]! <= bt) lo = m; else hi = m; }
      const m = Math.abs((dbs[lo] ?? 0) - bt) <= Math.abs((dbs[hi] ?? 0) - bt) ? lo : hi;
      return Math.abs(dbs[m]! - bt) <= 0.010 ? m : -1;
    };
    c.font = font(F.mono(500), 12);
    for (let k = 0; k < 16; k++) {
      const bi = b0 + k, x = X0 + k * cellW, w = cellW - gap;
      const bar = barOf(audio.timeOfBeat(bi));
      const hgt = bar >= 0 ? 40 : 24, y = 150 - hgt;
      if (bi < biCur) { c.fillStyle = rgba('graphite'); c.fillRect(x, y, w, hgt); }
      else if (bi === biCur) { c.fillStyle = rgba('bone', 1 - 0.6 * f.beatPhase); c.fillRect(x, y, w, hgt); }
      else { c.strokeStyle = rgba('ink2'); c.lineWidth = 1.5; c.strokeRect(x, y, w, hgt); }
      if (bar >= 0) { c.fillStyle = rgba('ash'); c.textAlign = 'center'; c.fillText(String(bar), x + w / 2, 104); c.textAlign = 'left'; }
    }
    c.fillStyle = rgba('signal');
    c.fillRect(X0 + ((f.beat - b0) / 16) * (X1 - X0) - 1, 102, 2, 54);

    // ------------------------------------------------ hit meters
    const hits: [string, number][] = [['kick', f.a.kick], ['snare', f.a.snare], ['hat', f.a.hat], ['vocal onset', f.a.vonset]];
    hits.forEach(([name, v], i) => {
      const x = X0 + i * 444;
      c.fillStyle = rgba('ash');
      c.fillText(name, x, 184);
      c.strokeStyle = rgba('graphite');
      c.lineWidth = 1;
      c.strokeRect(x, 190, 300, 12);
      c.fillStyle = rgba('signal');
      c.fillRect(x, 190, 300 * clamp(v), 12);
    });

    // ------------------------------------------------ lyric block (karaoke wipe via glyphX clips)
    const cur = lyrics.lineAt(f.t);
    const shown = cur ?? lyrics.nextLine(f.t);
    if (shown) {
      const prev = lyrics.lines[shown.i - 1], next = lyrics.lines[shown.i + 1];
      c.font = font(F.archivo(100, 500), 36);
      if (prev) { c.fillStyle = rgba('ash', 0.6); c.fillText(prev.text, X0, 420); }
      if (next) { c.fillStyle = rgba('graphite'); c.fillText(next.text, X0, 690); }
    }
    if (!shown) {
      c.font = font(F.mono(500), 28);
      c.fillStyle = rgba('graphite');
      c.fillText('— end —', X0, 560);
    } else {
      const text = shown.text, family = F.archivo(100, 700);
      const size = fitSize(text, family, 1728, 110), baseY = 560;
      if (!cur) {
        c.font = font(F.mono(500), 14);
        c.fillStyle = rgba('ash');
        c.fillText(`next in ${(shown.start - f.t).toFixed(2)} s`, X0, 472);
      }
      // each word's x-extent inside the whole-line run (all 46 lines join with single spaces;
      // fall back to word-by-word measure if one ever doesn't)
      const contiguous = shown.words.map((w) => w.w).join(' ') === text;
      let ci = 0, prefix = '';
      const spans = shown.words.map((w): [number, number] => {
        const len = Array.from(w.w).length;
        let x0: number, x1: number;
        if (contiguous) {
          x0 = glyphX(text, ci, family, size);
          x1 = glyphX(text, ci + len, family, size);
          ci += len + 1;
        } else {
          x0 = measure(prefix, family, size);
          x1 = x0 + measure(w.w, family, size);
          prefix = prefix ? `${prefix} ${w.w}` : w.w;
        }
        return [x0, x1];
      });
      c.font = font(family, size);
      c.fillStyle = rgba('bone', 0.32);
      c.fillText(text, X0, baseY);
      const top = baseY - size, bot = baseY + size * 0.3;
      shown.words.forEach((w, wi) => {
        const p = Lyrics.wordProgress(w, f.t);
        if (p <= 0) return;
        const [x0, x1] = spans[wi]!;
        c.save();
        c.beginPath();
        c.rect(X0 + x0, top, p * (x1 - x0), bot - top);
        c.clip();
        c.fillStyle = rgba('bone', 1);
        c.fillText(text, X0, baseY);
        c.restore();
      });
      const act = shown.words.find((w) => f.t >= w.start && f.t < w.end);
      if (act) {
        const [x0, x1] = spans[act.index]!;
        c.fillStyle = rgba('signal');
        c.fillRect(X0 + x0, baseY + 18, Math.max(2, x1 - x0), 4);
      }
      c.fillStyle = rgba('signal');
      shown.words.forEach((w, wi) => {
        if ((w.conf ?? 1) < 0.6) {
          c.beginPath();
          c.arc(X0 + spans[wi]![0] + 4, baseY - size * 0.8 - 8, 3, 0, Math.PI * 2);
          c.fill();
        }
      });
    }

    // ------------------------------------------------ word detail
    const wd = lyrics.wordAt(f.t) ?? lyrics.lastWord(f.t);
    if (wd) {
      let s = `“${wd.w}”  ${wd.start.toFixed(3)}–${wd.end.toFixed(3)} s  (${(wd.end - wd.start).toFixed(3)} s)`;
      if (wd.conf !== undefined) s += `  conf ${wd.conf.toFixed(2)}`;
      if (wd.syl !== undefined) s += `  syl ${wd.syl.length}`;
      c.font = font(F.mono(400), 16);
      c.fillStyle = rgba('ash');
      c.fillText(s, X0, 800);
    }

    // ------------------------------------------------ envelopes
    const envs: [string, number][] = [['rms', f.a.rms], ['low', f.a.low], ['mid', f.a.mid], ['high', f.a.high], ['vocal', f.a.vocal], ['drums', f.a.drums], ['bass', f.a.bass], ['other', f.a.other]];
    c.font = font(F.mono(500), 12);
    envs.forEach(([name, v], i) => {
      const x = X0 + i * 56;
      c.fillStyle = rgba('bone');
      c.fillRect(x, 970 - 120 * clamp(v), 40, 120 * clamp(v));
      c.fillStyle = rgba('ash');
      c.fillText(name, x, 990);
    });

    // ------------------------------------------------ song strip: sections + line starts + playhead
    const sy0 = 1010, sy1 = 1040;
    const tx = (t: number) => X0 + (t / audio.duration) * (X1 - X0);
    c.font = font(F.mono(500), 12);
    audio.sections.forEach((s, i) => {
      const x0 = tx(Math.max(0, s.start)), x1 = tx(Math.min(audio.duration, s.end));
      c.fillStyle = rgba(i % 2 ? 'graphite' : 'ink2');
      c.fillRect(x0, sy0, x1 - x0, sy1 - sy0);
      if (x1 - x0 > 60) { c.fillStyle = rgba('ash'); c.fillText(s.name, x0 + 4, sy0 + 18); }
    });
    c.fillStyle = rgba('bone', 0.7);
    for (const l of lyrics.lines) c.fillRect(tx(l.start), sy0, 1, sy1 - sy0);
    c.fillStyle = rgba('signal');
    c.fillRect(tx(f.t) - 1, sy0 - 4, 2, sy1 - sy0 + 8);

    comp.draw(renderer, this.layer.upload(), out);
    return { bloom: 0, halation: 0, grain: 0, ca: 0, vignette: 0 };
  }
}
