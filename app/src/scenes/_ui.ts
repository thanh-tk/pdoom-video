// Onboarded product UI kit (Canvas2D, logical px). Product-bright look:
// white cards on mist ground, teal primary, green ticks, crimson restrictions.
// Every export is a pure function of its arguments (no clocks, no RNG).
import { rgba } from '../engine/palette';
import { F, font, glyphX, measure, fitSize } from '../engine/type';
import { Lyrics, type Line, type Word } from '../engine/lyrics';
import { clamp, ease, prog, springStep, frameIdx } from '../engine/util';

type Ctx = CanvasRenderingContext2D;

export const LIGHT_POST = { bloom: 0, halation: 0, ca: 0, grain: 0.02, vignette: 0.12 };

/** Internal vs public cut (?cut=public): real code refs, PR numbers, partner logos are internal-only. */
export const CUT: 'internal' | 'public' =
  (typeof location !== 'undefined' && new URLSearchParams(location.search).get('cut') === 'public') ? 'public' : 'internal';

/**
 * Time by which a word-keyed action must be COMPLETE: runs over [landBy - d, landBy]
 * (lands on the word; may anticipate). Never extends past subEnd - hold so the cut
 * doesn't truncate it and the final state holds >= 0.3 s before the cut.
 */
export const landBy = (w: { start: number }, subEnd: number, lead = 0.2, hold = 0.3) =>
  Math.min(w.start + lead, subEnd - hold);

const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
};

const TONES: Record<string, [string, string]> = { // [tone, wash]
  teal: ['teal', 'tealWash'], green: ['green', 'greenWash'], crimson: ['crimson', 'crimsonWash'],
  amber: ['amber', 'amberWash'], slate: ['slate', 'mist'],
};

/** White rounded card, 1px line border, soft shadow. */
export function card(c: Ctx, x: number, y: number, w: number, h: number,
  o: { r?: number; fill?: string; border?: string; shadow?: number } = {}) {
  const r = o.r ?? 12;
  if (o.shadow) { // fake soft shadow: offset rounded rect (shadowBlur is slow on this GPU)
    c.fillStyle = `rgba(2,9,25,${(0.07 * o.shadow).toFixed(3)})`;
    rr(c, x, y + 9, w, h, r); c.fill();
    c.fillStyle = `rgba(2,9,25,${(0.05 * o.shadow).toFixed(3)})`;
    rr(c, x - 3, y + 14, w + 6, h, r + 3); c.fill();
  }
  c.fillStyle = rgba(o.fill ?? 'paper');
  rr(c, x, y, w, h, r); c.fill();
  c.strokeStyle = rgba(o.border ?? 'line'); c.lineWidth = 1;
  rr(c, x, y, w, h, r); c.stroke();
}

/** The logo's check chevron: short leg then long leg, drawn on to progress p. */
export function tick(c: Ctx, x: number, y: number, size: number, p: number,
  o: { color?: string; width?: number } = {}) {
  if (p <= 0) return;
  p = clamp(p);
  // chevron points: (0,.55) (.38,.9) (1,.15) within size box
  const pts: [number, number][] = [[0, 0.55], [0.38, 0.9], [1, 0.15]];
  const px = (i: number) => x + pts[i]![0] * size, py = (i: number) => y + pts[i]![1] * size;
  const l1 = size * 0.5, l2 = size * 0.95; // approx leg lengths
  c.strokeStyle = rgba(o.color ?? 'teal');
  c.lineWidth = o.width ?? size * 0.18; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(px(0), py(0));
  const seg = Math.hypot(px(1) - px(0), py(1) - py(0)), seg2 = Math.hypot(px(2) - px(1), py(2) - py(1));
  const done = p * (seg + seg2);
  if (done <= seg) {
    c.lineTo(px(0) + (px(1) - px(0)) * done / seg, py(0) + (py(1) - py(0)) * done / seg);
  } else {
    c.lineTo(px(1), py(1));
    const d = done - seg;
    c.lineTo(px(1) + (px(2) - px(1)) * d / seg2, py(1) + (py(2) - py(1)) * d / seg2);
  }
  c.stroke();
}

/** Product pill badge; returns its width. scale about its centre for stamps. */
export function badge(c: Ctx, x: number, y: number, text: string,
  tone: 'teal' | 'green' | 'crimson' | 'amber' | 'slate',
  o: { size?: number; filled?: boolean; scale?: number; alpha?: number; icon?: 'tick' | 'lock' | 'mail' | null } = {}) {
  const size = o.size ?? 22, icon = o.icon === undefined ? null : o.icon;
  c.font = font(F.inter(600), size);
  const iw = icon ? size * 1.15 : 0;
  const tw = measure(text, F.inter(600), size);
  const w = tw + size * 1.6 + iw, h = size * 2.05;
  const [t_, w_] = TONES[tone]!;
  c.save();
  if (o.scale !== undefined && o.scale !== 1) {
    c.translate(x + w / 2, y + h / 2); c.scale(o.scale, o.scale); c.translate(-x - w / 2, -y - h / 2);
  }
  c.globalAlpha *= o.alpha ?? 1;
  c.fillStyle = rgba(o.filled ? t_ : w_);
  rr(c, x, y, w, h, h / 2); c.fill();
  c.strokeStyle = rgba(t_); c.lineWidth = 1.5;
  rr(c, x, y, w, h, h / 2); c.stroke();
  c.fillStyle = rgba(o.filled ? 'paper' : t_);
  c.fillText(text, x + size * 0.8 + iw, y + h / 2 + size * 0.36);
  if (icon === 'tick') tick(c, x + size * 0.72, y + h / 2 - size * 0.42, size * 0.85, 1, { color: o.filled ? 'paper' : t_, width: 2.5 });
  else if (icon === 'lock') {
    c.strokeStyle = rgba(o.filled ? 'paper' : t_); c.lineWidth = 2;
    rr(c, x + size * 0.78, y + h / 2 - size * 0.28, size * 0.75, size * 0.62, 3); c.stroke();
    c.beginPath(); c.arc(x + size * 0.78 + size * 0.375, y + h / 2 - size * 0.28, size * 0.26, Math.PI, 0); c.stroke();
  } else if (icon === 'mail') {
    c.strokeStyle = rgba(o.filled ? 'paper' : t_); c.lineWidth = 2;
    const mx = x + size * 0.72, my = y + h / 2 - size * 0.35;
    c.strokeRect(mx, my, size * 0.95, size * 0.7);
    c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + size * 0.475, my + size * 0.42); c.lineTo(mx + size * 0.95, my); c.stroke();
  }
  c.restore();
  return w;
}

/** Product button. */
export function button(c: Ctx, x: number, y: number, w: number, h: number, label: string,
  o: { variant?: 'primary' | 'outline' | 'ghost' | 'danger'; pressed?: number; disabled?: number } = {}) {
  const v = o.variant ?? 'primary';
  const press = o.pressed ?? 0, dis = o.disabled ?? 0;
  c.save();
  c.translate(0, press * 2);
  c.globalAlpha *= 1 - dis * 0.55;
  if (v === 'primary' || v === 'danger') {
    c.fillStyle = rgba(v === 'primary' ? 'teal' : 'crimson');
    rr(c, x, y, w, h, 10); c.fill();
  } else if (v === 'outline') {
    c.strokeStyle = rgba('teal'); c.lineWidth = 1.5;
    rr(c, x, y, w, h, 10); c.stroke();
  }
  const size = Math.min(h * 0.42, 24);
  c.font = font(F.inter(600), size);
  c.fillStyle = rgba(v === 'primary' || v === 'danger' ? 'paper' : v === 'ghost' ? 'slate' : 'teal');
  c.textAlign = 'center';
  c.fillText(label, x + w / 2, y + h / 2 + size * 0.36);
  c.textAlign = 'left';
  c.restore();
}

/** Labelled input field; typed 0..1 reveals value; teal focus ring; blinking caret. */
export function field(c: Ctx, x: number, y: number, w: number, label: string, value: string,
  o: { typed?: number; focus?: number; mono?: boolean; caret?: boolean; t?: number } = {}) {
  const ls = 15;
  c.font = font(F.inter(500), ls);
  c.fillStyle = rgba('slate');
  c.fillText(label, x + 2, y + ls);
  const by = y + ls + 8, bh = 52;
  c.fillStyle = rgba('paper');
  rr(c, x, by, w, bh, 10); c.fill();
  c.strokeStyle = rgba('line'); c.lineWidth = 1.5;
  rr(c, x, by, w, bh, 10); c.stroke();
  const foc = o.focus ?? 0;
  if (foc > 0) {
    c.strokeStyle = rgba('teal', foc); c.lineWidth = 2.5;
    rr(c, x - 2, by - 2, w + 4, bh + 4, 12); c.stroke();
  }
  const fam = o.mono ? F.code(500) : F.inter(500), vs = 22;
  const shown = value.slice(0, Math.round(value.length * (o.typed ?? 1)));
  c.font = font(fam, vs);
  c.fillStyle = rgba('text');
  const vx = x + 16, vy = by + bh / 2 + vs * 0.36;
  c.fillText(shown, vx, vy);
  if (o.caret && (o.t === undefined || Math.floor(frameIdx(o.t) / 30) % 2 === 0)) {
    const cw = measure(shown, fam, vs);
    c.fillStyle = rgba('teal');
    c.fillRect(vx + cw + 3, vy - vs * 0.78, 2.5, vs * 0.95);
  }
}

/** Filled disc scaling in (outBack) with a white tick drawing on. */
export function tickDisc(c: Ctx, x: number, y: number, r: number, p: number, color = 'green') {
  if (p <= 0) return;
  const s = ease.outBack(clamp(p));
  c.fillStyle = rgba(color);
  c.beginPath(); c.arc(x, y, r * Math.max(0.001, s), 0, Math.PI * 2); c.fill();
  if (p > 0.35) tick(c, x - r * 0.48, y - r * 0.28, r * 0.95, (p - 0.35) / 0.65, { color: 'paper', width: r * 0.22 });
}

/** Candidate stepper row: number disc → green tick disc as done goes 0→1. */
export function stepRow(c: Ctx, x: number, y: number, w: number, n: number, label: string, done: number, active = 0) {
  const h = 64;
  if (active > 0) {
    c.fillStyle = rgba('tealWash', active);
    rr(c, x, y, w, h, 12); c.fill();
    c.fillStyle = rgba('teal', active);
    rr(c, x, y, 4, h, 2); c.fill();
  }
  const r = 17, cx = x + 30, cy = y + h / 2;
  if (done < 1) {
    c.fillStyle = rgba(done > 0 ? 'green' : 'mist');
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(done > 0 ? 'green' : 'line'); c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    if (done > 0) tickDisc(c, cx, cy, r, done, 'green');
    else {
      c.font = font(F.inter(600), 17); c.fillStyle = rgba('slate'); c.textAlign = 'center';
      c.fillText(String(n), cx, cy + 6); c.textAlign = 'left';
    }
  } else {
    tickDisc(c, cx, cy, r, 1, 'green');
  }
  c.font = font(F.inter(done > 0 ? 600 : 500), 20);
  c.fillStyle = rgba(done > 0 ? 'green' : active > 0 ? 'text' : 'slate');
  c.fillText(label, x + 62, cy + 7);
}

/** Rounded progress bar, teal on tealWash. */
export function progressBar(c: Ctx, x: number, y: number, w: number, h: number, v: number) {
  c.fillStyle = rgba('tealWash');
  rr(c, x, y, w, h, h / 2); c.fill();
  const fw = Math.max(h, w * clamp(v));
  c.fillStyle = rgba('teal');
  rr(c, x, y, fw, h, h / 2); c.fill();
}

/**
 * A phone device. drawScreen is called inside a transform mapping
 * 390x844 logical screen units to the device display (clipped, rounded).
 */
export function phone(c: Ctx, cx: number, cy: number, h: number,
  drawScreen: (c: Ctx) => void, o: { dark?: boolean } = {}) {
  const w = h * (390 / 844), bez = h * 0.028, r = h * 0.075;
  const x = cx - w / 2, y = cy - h / 2;
  c.fillStyle = rgba('text');
  rr(c, x, y, w, h, r); c.fill();
  const sx = x + bez, sy = y + bez, sw = w - bez * 2, sh = h - bez * 2;
  c.save();
  rr(c, sx, sy, sw, sh, r - bez); c.clip();
  c.translate(sx, sy); c.scale(sw / 390, sh / 844);
  c.fillStyle = rgba(o.dark ? 'night' : 'mist');
  c.fillRect(0, 0, 390, 844);
  drawScreen(c);
  c.restore();
  // status bar notch pill
  c.fillStyle = rgba('text');
  rr(c, cx - w * 0.13, y + bez * 1.7, w * 0.26, h * 0.022, 9); c.fill();
}

/** Logo person: round head + rounded body, flat colour; optional white tick. */
export function figure(c: Ctx, x: number, y: number, h: number, color: string,
  o: { tick?: number } = {}) {
  const w = h * 0.52;
  c.fillStyle = rgba(color);
  c.beginPath(); c.arc(x + w / 2, y + h * 0.14, h * 0.14, 0, Math.PI * 2); c.fill();
  c.beginPath();
  c.roundRect(x, y + h * 0.34, w, h * 0.66, [w * 0.5, w * 0.5, 6, 6]);
  c.fill();
  const tp = o.tick ?? 0;
  if (tp > 0) tick(c, x + w * 0.18, y + h * 0.45, w * 0.62, tp, { color: 'paper', width: w * 0.11 });
}

/** Padlock at (x,y), size s. Shackle always visible; closed 0..1 seats it. */
export function padlock(c: Ctx, x: number, y: number, s: number, closed: number) {
  const w = s * 0.82, bh = s * 0.72, lift = (1 - clamp(closed)) * s * 0.35;
  const cy = y + lift; // shackle top point
  c.strokeStyle = rgba('slate'); c.lineWidth = s * 0.12; c.lineCap = 'round';
  c.beginPath();
  if (closed < 0.99) { // open: one leg free
    c.moveTo(x - w * 0.28, y + s * 0.35 + lift);
    c.arc(x - w * 0.02, cy - s * 0.28, w * 0.26, Math.PI, -Math.PI * 0.15);
  } else { // closed: full shackle seated
    c.arc(x, cy - s * 0.28, w * 0.3, Math.PI, 0);
    c.moveTo(x - w * 0.3, cy - s * 0.28); c.lineTo(x - w * 0.3, y + s * 0.35);
    c.moveTo(x + w * 0.3, cy - s * 0.28); c.lineTo(x + w * 0.3, y + s * 0.35);
  }
  c.stroke();
  c.fillStyle = rgba('teal');
  rr(c, x - w / 2, y + s * 0.18, w, bh, s * 0.12); c.fill();
  c.fillStyle = rgba('paper');
  c.beginPath(); c.arc(x, y + s * 0.48, s * 0.07, 0, Math.PI * 2); c.fill();
  c.fillRect(x - s * 0.03, y + s * 0.48, s * 0.06, s * 0.16);
}

/** Tap ripple: teal ring expanding/fading over 0.35 s; nothing outside. */
export function tap(c: Ctx, x: number, y: number, age: number) {
  if (age < 0 || age > 0.35) return;
  const p = age / 0.35;
  c.strokeStyle = rgba('teal', (1 - p) * 0.9);
  c.lineWidth = 3 * (1 - p) + 1;
  c.beginPath(); c.arc(x, y, 8 + p * 34, 0, Math.PI * 2); c.stroke();
}

/** Small mono event pill; returns width. */
export function pill(c: Ctx, x: number, y: number, text: string,
  o: { color?: string; alpha?: number } = {}) {
  const size = 15;
  c.font = font(F.code(500), size);
  const tw = measure(text, F.code(500), size);
  const w = tw + 22, h = 26;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  const col = o.color ?? 'teal';
  c.fillStyle = rgba(col === 'teal' ? 'tealWash' : 'mist');
  rr(c, x, y, w, h, h / 2); c.fill();
  c.strokeStyle = rgba(col); c.lineWidth = 1;
  rr(c, x, y, w, h, h / 2); c.stroke();
  c.fillStyle = rgba(col);
  c.fillText(text, x + 11, y + h / 2 + 5.5);
  c.restore();
  return w;
}

export interface LyricRows { rows: { text: string; y: number; w: number; words: { w: Word; x0: number; x1: number }[] }[]; bottom: number }

/**
 * Karaoke lyric block: greedy-wrap a line into rows within maxWidth; dim copy shows
 * from line.start - preview; per-word wipe via glyphX clip-rects within each row's
 * string (draws the whole row again so kerning is identical); active word in
 * activeColor. Never highlights ahead of the voice. Returns row layout.
 */
const LB_CACHE = new Map<string, { text: string; w: number; words: { w: Word; x0: number; x1: number }[] }[]>();
function lbRows(c: Ctx, line: Line, fam: string, sz: number, mw: number) {
  const key = `${line.i}|${fam}|${sz}|${mw}`;
  let rows = LB_CACHE.get(key);
  if (rows) return rows;
  // greedy wrap on words (pos = code-point index into line.text)
  const raw: { text: string; ci0: number; words: { w: Word; ci: number }[] }[] = [];
  let cur = '', ci0 = 0, curWords: { w: Word; ci: number }[] = [], pos = 0;
  for (const w of line.words) {
    const cpl = Array.from(w.w).length;
    const cand = cur ? cur + ' ' + w.w : w.w;
    if (cur && measure(cand, fam, sz) > mw) {
      raw.push({ text: cur, ci0, words: curWords });
      cur = w.w; ci0 = pos; curWords = [{ w, ci: 0 }];
    } else {
      curWords.push({ w, ci: pos - ci0 });
      cur = cand;
    }
    pos += cpl + 1;
  }
  if (cur) raw.push({ text: cur, ci0, words: curWords });
  rows = raw.map(r => ({
    text: r.text, w: measure(r.text, fam, sz),
    words: r.words.map(e => ({
      w: e.w,
      x0: glyphX(r.text, e.ci, fam, sz),
      x1: glyphX(r.text, e.ci + Array.from(e.w.w).length, fam, sz),
    })),
  }));
  if (LB_CACHE.size > 80) LB_CACHE.clear();
  LB_CACHE.set(key, rows);
  return rows;
}

export function lyricBlock(c: Ctx, line: Line | null, t: number, x: number, y: number,
  o: { family: string; size: number; maxWidth: number; lineHeight?: number; color?: string; activeColor?: string; dim?: number; preview?: number; win?: [number, number] }): LyricRows {
  const empty: LyricRows = { rows: [], bottom: y };
  if (!line) return empty;
  const lh = o.lineHeight ?? o.size * 1.18;
  const fam = o.family, sz = o.size;
  const base = o.color ?? 'text', active = o.activeColor ?? 'teal', dim = o.dim ?? 0.35;
  const win = o.win;
  c.font = font(fam, sz);
  const rows = lbRows(c, line, fam, sz, o.maxWidth);
  // layout is always computed (bottom must not jump); drawing waits for visibility
  const res0: LyricRows = { rows: [], bottom: y + (rows.length - 1) * lh };
  rows.forEach((row, ri) => {
    res0.rows.push({ text: row.text, y: y + ri * lh, w: row.w, words: row.words });
  });
  if (t < (win ? win[0] : line.start - (o.preview ?? 0.4))) return res0;

  const res: LyricRows = { rows: [], bottom: y };
  rows.forEach((row, ri) => {
    const ry = y + ri * lh;
    // dim base
    c.fillStyle = rgba(base, dim);
    c.fillText(row.text, x, ry);
    // karaoke wipe: re-draw the row clipped to the sung span
    let maxX = 0;
    for (const e of row.words) {
      // sung-progress end clamped to the sub-scene window: the wipe completes before
      // the cut even though the singer holds the last word right up to it
      const we = win ? Math.max(e.w.start + 0.08, Math.min(e.w.end, win[1] - 0.05)) : e.w.end;
      const p = clamp((t - e.w.start) / Math.max(0.001, we - e.w.start));
      if (p <= 0) continue;
      maxX = Math.max(maxX, x + e.x0 + p * (e.x1 - e.x0));
    }
    if (maxX > x) {
      c.save();
      c.beginPath(); c.rect(x - 2, ry - sz * 1.15, maxX - x + 4, lh * 1.12); c.clip();
      c.fillStyle = rgba(base);
      c.fillText(row.text, x, ry);
      c.restore();
    }
    // active word accent
    const aw = row.words.find(e => e.w.start <= t && t < (win ? Math.max(e.w.start + 0.08, Math.min(e.w.end, win[1] - 0.05)) : e.w.end));
    if (aw) {
      const x0 = x + aw.x0;
      const x1 = x + aw.x1;
      const p = win ? clamp((t - aw.w.start) / Math.max(0.001, Math.max(aw.w.start + 0.08, Math.min(aw.w.end, win[1] - 0.05)) - aw.w.start)) : Lyrics.wordProgress(aw.w, t);
      c.save();
      c.beginPath(); c.rect(x0 - 1, ry - sz * 1.15, (x1 - x0) * p + 2, lh * 1.12); c.clip();
      c.fillStyle = rgba(active);
      c.fillText(row.text, x, ry);
      c.restore();
    }
    res.rows.push({ text: row.text, y: ry, w: row.w, words: row.words });
    res.bottom = ry;
  });
  return res;
}

/** Async image load for init(). */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`loadImage: ${url}`));
    im.src = url;
  });
}

export { prog, springStep };

// ---- Dashboard screenshot overlay kit (d_applicants.png) --------------------

export type ShotMap = { im: HTMLImageElement; rect: { x: number; y: number; w: number; h: number };
  sx: (fx: number) => number; sy: (fy: number) => number; dw: number; dh: number };

const shotCv = new WeakMap<HTMLImageElement, CanvasRenderingContext2D>();
const shotCol = new WeakMap<HTMLImageElement, Map<string, string>>();
export function shotPx(im: HTMLImageElement, fx: number, fy: number): string {
  let cols = shotCol.get(im);
  if (!cols) { cols = new Map(); shotCol.set(im, cols); }
  const key = fx.toFixed(4) + ',' + fy.toFixed(4);
  const hit = cols.get(key);
  if (hit) return hit;
  let g = shotCv.get(im);
  if (!g) {
    const cv = document.createElement('canvas');
    cv.width = im.width; cv.height = im.height;
    g = cv.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(im, 0, 0);
    shotCv.set(im, g);
  }
  const d = g.getImageData(Math.round(fx * im.width), Math.round(fy * im.height), 1, 1).data;
  const col = `rgb(${d[0]},${d[1]},${d[2]})`;
  cols.set(key, col);
  return col;
}

/** Draw the region of interest (image fractions) of the dashboard screenshot
 *  contain-fitted inside `view` (centred horizontally, top-aligned). The rounded
 *  clip + border hug the drawn ROI rect — no empty margins, no partial cropping.
 *  Returns the image-fraction → screen mapping for registered overlays. */
export function drawShot(c: Ctx, im: HTMLImageElement, view: { x: number; y: number; w: number; h: number },
  roi: [number, number, number, number]): ShotMap {
  const [fx0, fy0, fx1, fy1] = roi;
  const rw0 = (fx1 - fx0) * im.width, rh0 = (fy1 - fy0) * im.height;
  const sc = Math.min(view.w / rw0, view.h / rh0);
  const dw = im.width * sc, dh = im.height * sc;
  const rw = rw0 * sc, rh = rh0 * sc;
  const rx = view.x + (view.w - rw) / 2, ry = view.y;
  const dx = rx - fx0 * dw, dy = ry - fy0 * dh;
  const rect = { x: rx, y: ry, w: rw, h: rh };
  c.save();
  rr(c, rx, ry, rw, rh, 12); c.clip();
  c.drawImage(im, dx, dy, dw, dh);
  c.restore();
  c.strokeStyle = rgba('line'); c.lineWidth = 1;
  rr(c, rx, ry, rw, rh, 12); c.stroke();
  return { im, rect, sx: (fx) => dx + fx * dw, sy: (fy) => dy + fy * dh, dw, dh };
}

// measured on d_applicants.png: status badge centre x .850, row y .433 + r*.0456, size .052 x .019
const BROW = (r: number) => ({ cx: 0.850, cy: 0.433 + r * 0.0456, w: 0.052, h: 0.019 });

/** Overlay for one row's Status cell. flip<=0: draw nothing (the screenshot's real badge
 *  shows). flip>0: cover it and draw a "Completed" pill of the same size/style. */
export function statusPill(c: Ctx, m: ShotMap, row: number, flip: number) {
  if (flip <= 0) return;
  const b = BROW(row);
  const x = m.sx(b.cx - b.w / 2), y = m.sy(b.cy - b.h / 2), w = b.w * m.dw, h = b.h * m.dh;
  const a = ease.outCubic(clamp(flip));
  c.save(); c.globalAlpha = a;
  c.beginPath(); c.rect(m.rect.x, m.rect.y, m.rect.w, m.rect.h); c.clip();
  c.fillStyle = shotPx(m.im, b.cx, b.cy);
  c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = rgba('greenWash'); c.strokeStyle = rgba('green'); c.lineWidth = Math.max(1, h * 0.05);
  rr(c, x, y, w, h, h / 2); c.fill(); c.stroke();
  c.fillStyle = rgba('green');
  c.font = font(F.inter(600), fitSize('Completed', F.inter(600), w * 0.86, h * 0.62));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('Completed', x + w / 2, y + h / 2 + h * 0.04);
  c.restore();
}

// "Completed" stat number glyph box (image fractions), measured on d_applicants.png
const CNUM = { cx: 0.651, cy: 0.186, hw: 0.008, hh: 0.013 };

/** Patch the "Completed" stat number in the screenshot's own style: dark Inter text,
 *  patch exactly the glyph box, number at the original glyph's left edge/baseline. */
export function completedCount(c: Ctx, m: ShotMap, value: number) {
  const x = m.sx(CNUM.cx - CNUM.hw), y = m.sy(CNUM.cy - CNUM.hh);
  const w = CNUM.hw * 2 * m.dw, h = CNUM.hh * 2 * m.dh;
  c.save();
  c.beginPath(); c.rect(m.rect.x, m.rect.y, m.rect.w, m.rect.h); c.clip();
  c.fillStyle = shotPx(m.im, CNUM.cx, CNUM.cy - CNUM.hh - 0.004);
  c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.fillStyle = rgba('text');
  c.font = font(F.inter(700), h * 0.92);
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(String(value), x, y + h * 0.55);
  c.restore();
}
