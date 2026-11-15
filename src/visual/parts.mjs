// 여러 게임이 함께 쓰는 그림 조각
import { C, path, poly, circ, rect, ell, line, g, T, card, blob } from './kit.mjs';

export const SUIT = { h: C.red, d: C.red, s: C.ink, c: C.ink };
export function suit(k, cx, cy, s = 1) {
  const f = SUIT[k];
  let d;
  if (k === 'h') d = path('M0 9C-10 2 -12 -4 -8 -8C-4 -11 -1 -8 0 -5C1 -8 4 -11 8 -8C12 -4 10 2 0 9Z', { fill: f });
  else if (k === 'd') d = poly([[0, -11], [8, 0], [0, 11], [-8, 0]], { fill: f });
  else if (k === 's') d = path('M0 -11C10 -3 12 3 8 7C5 9 2 8 1 5L3 11H-3L-1 5C-2 8 -5 9 -8 7C-12 3 -10 -3 0 -11Z', { fill: f });
  else d = circ(0, -5, 4.6, { fill: f }) + circ(-5.2, 2.5, 4.6, { fill: f }) + circ(5.2, 2.5, 4.6, { fill: f }) + path('M-1 2L-3 11H3L1 2Z', { fill: f });
  return g(d, { x: cx, y: cy, s });
}
// 트럼프 카드
export const pc = (x, y, rank, k, o = {}) => card(x, y, { ...o, inner: (cx, cy, w, h) => T(cx, cy - h * 0.17, rank, { size: h * 0.34, weight: 800, fill: SUIT[k] }) + suit(k, cx, cy + h * 0.22, h / 78) });
// 봉투
export const envelope = (cx, cy, w = 150, h = 80, o = {}) => rect(cx - w / 2, cy - h / 2 + 3, w, h, { fill: C.ink, rx: 8 }) + rect(cx - w / 2, cy - h / 2, w, h, { fill: o.fill || '#F4E3B5', stroke: C.ink, sw: 2.4, rx: 8 })
  + path(`M${cx - w / 2 + 3} ${cy - h / 2 + 4}L${cx} ${cy + h * 0.12}L${cx + w / 2 - 3} ${cy - h / 2 + 4}`, { stroke: C.ink, sw: 2.2 });
// 지폐
export const bill = (x, y, o = {}) => {
  const w = o.w || 58, h = o.h || 30;
  return rect(x, y + 2.5, w, h, { fill: C.ink, rx: 5 }) + rect(x, y, w, h, { fill: o.fill || '#BFE3C6', stroke: C.ink, sw: 2, rx: 5 }) + (o.label ? T(x + w / 2, y + h / 2 + 0.5, o.label, { size: o.ls || 13, weight: 800 }) : circ(x + w / 2, y + h / 2, h * 0.27, { stroke: C.ink, sw: 1.6, op: 0.5 }));
};
// 온몸이 보이는 아이 (한 발로 서기, 걷기)
export function kid(cx, cy, o = {}) {
  const { s = 1, fill = C.ptTint, pose = 'stand', flip = false, carry } = o;
  const legs = pose === 'hop'
    ? path('M-4 34V60M4 34L14 46L6 56', { stroke: C.ink, sw: 5.5, cap: 'round' })
    : pose === 'kick'
      ? path('M-4 34V60M4 34L22 50', { stroke: C.ink, sw: 5.5, cap: 'round' })
      : path('M-5 34V60M5 34V60', { stroke: C.ink, sw: 5.5, cap: 'round' });
  const arms = pose === 'throw'
    ? path('M-12 8L-24 22M12 8L28 -6', { stroke: C.ink, sw: 5, cap: 'round' })
    : path('M-12 8L-24 22M12 8L24 22', { stroke: C.ink, sw: 5, cap: 'round' });
  let d = legs + arms
    + path('M-13 36V14Q-13 0 0 0Q13 0 13 14V36Z', { fill, stroke: C.ink, sw: 2.2 })
    + circ(0, -13, 12, { fill: C.skin, stroke: C.ink, sw: 2.2 }) + circ(-4, -13, 1.6, { fill: C.ink }) + circ(4, -13, 1.6, { fill: C.ink });
  if (carry) d += carry;
  return g(g(d, { s: flip ? undefined : s }), { x: cx, y: cy });
}
// 납작한 돌
export const flat = (cx, cy, s = 1, fill = '#9AA1AD') => ell(cx, cy + 2.5 * s, 13 * s, 7 * s, { fill: C.ink }) + ell(cx, cy, 13 * s, 7 * s, { fill, stroke: C.ink, sw: 2 }) + ell(cx - 4 * s, cy - 2 * s, 4 * s, 1.8 * s, { fill: '#fff', op: 0.45 });
