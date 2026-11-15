// 룰룰 설명 그림 부품
// 모든 그림은 가로 480, 세로 300 크기의 SVG로 그려요.
// 색은 사이트와 같아요: 글자와 테두리는 진한 남색, 표시는 주사위 빨강, 맞음은 초록.

export const W = 480;
export const H = 300;

export const C = {
  ink: '#1C2230', ink2: '#3A4152', muted: '#5F6675', line: '#C9CDD6', line2: '#E2E5EA',
  mist: '#F3F4F6', table: '#E7EAEE', paper: '#FFFFFF', pt: '#E4572E', ptTint: '#FDECE6',
  ok: '#1F7A52', okTint: '#E5F4EC',
  red: '#D8413F', blue: '#3B6FC0', yellow: '#F2B42E', green: '#3D9A5E', purple: '#7E55BE',
  black: '#2A2F3A', orange: '#EE8A34', brown: '#A8693A', sky: '#79AEE3', pink: '#EF8FA8',
  cream: '#FFF6E6', wood: '#E8C38F', woodDark: '#B98A52', skin: '#FFD8C2', gold: '#F2C14E', silver: '#D5DAE1',
};

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const n = (v) => Math.round(v * 10) / 10;

const ATTR = [['fill', 'fill'], ['stroke', 'stroke'], ['sw', 'stroke-width'], ['rx', 'rx'], ['op', 'opacity'], ['dash', 'stroke-dasharray'], ['cap', 'stroke-linecap'], ['join', 'stroke-linejoin'], ['fop', 'fill-opacity']];
export const at = (o = {}) => ATTR.filter(([k]) => o[k] !== undefined && o[k] !== null && o[k] !== false).map(([k, a]) => `${a}="${o[k]}"`).join(' ');

// ---------- 기본 도형 ----------
export const rect = (x, y, w, h, o = {}) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${at({ fill: 'none', ...o })}/>`;
export const circ = (cx, cy, r, o = {}) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${at({ fill: 'none', ...o })}/>`;
export const ell = (cx, cy, rx, ry, o = {}) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${at({ fill: 'none', ...o })}/>`;
export const line = (x1, y1, x2, y2, o = {}) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${at({ stroke: C.ink, sw: 2, cap: 'round', ...o })}/>`;
export const path = (d, o = {}) => `<path d="${d}" ${at({ fill: 'none', join: 'round', ...o })}/>`;
export const poly = (pts, o = {}) => `<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" ${at({ fill: 'none', join: 'round', ...o })}/>`;
export const g = (inner, o = {}) => {
  const tf = [];
  if (o.x || o.y) tf.push(`translate(${n(o.x || 0)} ${n(o.y || 0)})`);
  if (o.rot) tf.push(`rotate(${o.rot}${o.cx !== undefined ? ` ${n(o.cx)} ${n(o.cy)}` : ''})`);
  if (o.s && o.s !== 1) tf.push(`scale(${o.s})`);
  return `<g${tf.length ? ` transform="${tf.join(' ')}"` : ''}${o.op !== undefined ? ` opacity="${o.op}"` : ''}>${inner}</g>`;
};

// 겹친 도형을 하나의 윤곽으로 보이게: 굵은 테두리를 먼저 깔고 위에 채우기만 다시 그려요.
export const blob = (shapes, fill, sw = 2.4, stroke = C.ink) =>
  shapes.map((f) => f({ fill: stroke, stroke, sw: sw * 2, join: 'round' })).join('') + shapes.map((f) => f({ fill })).join('');

// ---------- 글자 ----------
// 휴대폰에서도 읽히도록 한글 글씨는 15.5, 숫자와 영문은 12보다 작게 쓰지 않아요.
export const MIN_KO = 15.5, MIN_NUM = 12;
export const ts = (size, s) => (/[\u1100-\uD7AF]/.test(String(s)) ? Math.max(size, MIN_KO) : Math.max(size, MIN_NUM));
export function textW(s, size) {
  size = ts(size, s);
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    if (c >= 0x1100) w += 1;
    else if (ch === ' ') w += 0.3;
    else if (/[0-9]/.test(ch)) w += 0.6;
    else if (/[A-Z]/.test(ch)) w += 0.68;
    else if (/[+\-=×→←?!.,·:/()]/.test(ch)) w += 0.5;
    else w += 0.56;
  }
  return w * size;
}
export const T = (x, y, s, o = {}) => {
  const { weight = 700, fill = C.ink, anchor = 'middle', op } = o;
  const size = n(ts(o.size || 17, s));
  return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central"${op !== undefined ? ` opacity="${op}"` : ''}>${esc(s)}</text>`;
};

// 동그란 이름표
export function pill(cx, cy, s, o = {}) {
  const { bg = C.ink, fg = '#fff', pad = 10, stroke } = o;
  const size = ts(o.size || 15, s), h = o.h || size + 13;
  const w = textW(s, size) + pad * 2;
  return rect(cx - w / 2, cy - h / 2, w, h, { fill: bg, rx: h / 2, stroke, sw: stroke ? 2 : undefined }) + T(cx, cy + 0.5, s, { size, fill: fg });
}

// 말풍선 (tail: 꼬리 방향 'bl', 'br', 'tl', 'tr', 'l', 'r')
export function bubble(cx, cy, s, o = {}) {
  const { tail = 'bl', bg = C.paper, fg = C.ink, stroke = C.ink } = o;
  const size = ts(o.size || 17, s), h = o.h || size + 18;
  const w = Math.max(textW(s, size) + 26, h + 6);
  const x = cx - w / 2, y = cy - h / 2;
  let t;
  if (tail === 'bl') t = [[x + w * 0.24, y + h - 1], [x + w * 0.14, y + h + 12], [x + w * 0.38, y + h - 1]];
  else if (tail === 'br') t = [[x + w * 0.62, y + h - 1], [x + w * 0.86, y + h + 12], [x + w * 0.76, y + h - 1]];
  else if (tail === 'tl') t = [[x + w * 0.24, y + 1], [x + w * 0.14, y - 12], [x + w * 0.38, y + 1]];
  else if (tail === 'tr') t = [[x + w * 0.62, y + 1], [x + w * 0.86, y - 12], [x + w * 0.76, y + 1]];
  else if (tail === 'l') t = [[x + 1, cy - 7], [x - 12, cy + 4], [x + 1, cy + 5]];
  else t = [[x + w - 1, cy - 7], [x + w + 12, cy + 4], [x + w - 1, cy + 5]];
  return blob([(a) => rect(x, y, w, h, { ...a, rx: 12 }), (a) => poly(t, a)], bg, 1.4, stroke) + T(cx, cy + 0.5, s, { size, fill: fg });
}

// ---------- 표시 ----------
export const badge = (cx, cy, num, o = {}) => {
  const { r = 13, bg = C.pt, fg = '#fff' } = o;
  return circ(cx, cy, r, { fill: bg }) + T(cx, cy + 0.5, num, { size: r * 1.15, fill: fg, weight: 800 });
};
export const ok = (cx, cy, r = 16) => circ(cx, cy, r, { fill: C.ok, stroke: '#fff', sw: 2.5 }) + circ(cx, cy, r * 0.5, { stroke: '#fff', sw: r * 0.24 });
export const no = (cx, cy, r = 16) => {
  const d = r * 0.42;
  return circ(cx, cy, r, { fill: C.pt, stroke: '#fff', sw: 2.5 }) + path(`M${n(cx - d)} ${n(cy - d)}L${n(cx + d)} ${n(cy + d)}M${n(cx + d)} ${n(cy - d)}L${n(cx - d)} ${n(cy + d)}`, { stroke: '#fff', sw: r * 0.24, cap: 'round' });
};
export const ring = (cx, cy, r, o = {}) => circ(cx, cy, r, { stroke: o.c || C.pt, sw: o.sw || 3, dash: o.dash === false ? undefined : (o.dash || '6 5') });
export const box = (x, y, w, h, o = {}) => rect(x, y, w, h, { stroke: o.c || C.pt, sw: o.sw || 3, rx: o.rx ?? 10, dash: o.dash === false ? undefined : (o.dash || '6 5') });

// 화살표 (bend: 휘는 정도, 양수면 진행 방향 왼쪽으로 휘어요)
export function arrow(x1, y1, x2, y2, o = {}) {
  const { c = C.pt, w = 4, bend = 0, dash, head = 13, op } = o;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const qx = mx + (dy / L) * bend, qy = my - (dx / L) * bend;
  const tx = x2 - qx, ty = y2 - qy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
  const ex = x2 - ux * head * 0.6, ey = y2 - uy * head * 0.6;
  const bx = x2 - ux * head, by = y2 - uy * head, px = -uy * head * 0.62, py = ux * head * 0.62;
  const body = path(`M${n(x1)} ${n(y1)}Q${n(qx)} ${n(qy)} ${n(ex)} ${n(ey)}`, { stroke: c, sw: w, cap: 'round', dash });
  const tip = poly([[x2, y2], [bx + px, by + py], [bx - px, by - py]], { fill: c, stroke: c, sw: 1.5 });
  return op !== undefined ? g(body + tip, { op }) : body + tip;
}

// 움직임 선 (튀어 오르기, 흔들림)
export const motion = (cx, cy, r, from, to, o = {}) => {
  let s = '';
  for (let a = from; a <= to; a += (to - from) / ((o.count || 3) - 1 || 1)) {
    const rad = (a * Math.PI) / 180;
    s += line(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r, cx + Math.cos(rad) * (r + (o.len || 12)), cy + Math.sin(rad) * (r + (o.len || 12)), { stroke: o.c || C.ink, sw: 3 });
  }
  return s;
};

// ---------- 카드와 타일 ----------
export function card(x, y, o = {}) {
  const { w = 54, h = 76, fill = C.paper, back = false, rot = 0, rx = 8, sw = 2.4, stroke = C.ink, shadow = true, inner = null, op, backFill = C.ink } = o;
  const cx = x + w / 2, cy = y + h / 2;
  let s = '';
  if (shadow) s += rect(x, y + 3, w, h, { fill: stroke, rx });
  s += rect(x, y, w, h, { fill: back ? backFill : fill, stroke, sw, rx });
  if (back) {
    s += rect(x + 5, y + 5, w - 10, h - 10, { stroke: '#fff', sw: 1.4, rx: Math.max(rx - 3, 2), op: 0.3 });
    const d = Math.min(w, h) * 0.17;
    s += circ(cx - d, cy - d, Math.max(2.2, w * 0.05), { fill: '#fff', op: 0.75 }) + circ(cx, cy, Math.max(2.2, w * 0.05), { fill: '#fff', op: 0.75 }) + circ(cx + d, cy + d, Math.max(2.2, w * 0.05), { fill: '#fff', op: 0.75 });
  }
  if (inner) s += typeof inner === 'function' ? inner(cx, cy, w, h, x, y) : inner;
  return g(s, { rot, cx, cy, op });
}
// 뒷면 카드 더미
export const pile = (x, y, o = {}) => {
  const k = o.count || 3;
  let s = '';
  for (let i = k - 1; i >= 0; i--) s += card(x + i * (o.dx ?? 2.5), y - i * (o.dy ?? 3), { ...o, shadow: i === k - 1 });
  return s;
};
// 숫자 카드
export const numCard = (x, y, num, color = C.ink, o = {}) => card(x, y, {
  ...o,
  inner: (cx, cy, w, h) => (o.extra ? o.extra(cx, cy, w, h) : '') + T(cx, o.extra ? cy - h * 0.12 : cy, num, { size: o.ns || Math.min(h * 0.42, w * 0.62), weight: 800, fill: color }),
});
// 색 카드 (바탕이 색, 숫자는 흰색)
export const colorCard = (x, y, label, color, o = {}) => card(x, y, {
  ...o, fill: color,
  inner: (cx, cy, w, h) => rect(cx - w * 0.32, cy - h * 0.34, w * 0.64, h * 0.68, { fill: '#fff', rx: 6, op: 0.22 }) + (label ? T(cx, cy, label, { size: o.ns || Math.min(h * 0.4, w * 0.6), weight: 800, fill: '#fff' }) : ''),
});
// 숫자 타일 (루미큐브)
export const tile = (x, y, num, color, o = {}) => card(x, y, {
  w: 34, h: 46, rx: 6, fill: C.cream, ...o,
  inner: (cx, cy, w, h) => T(cx, cy - h * 0.06, num, { size: o.ns || h * 0.48, weight: 800, fill: color }) + circ(cx, cy + h * 0.32, Math.max(2, w * 0.07), { fill: color, op: 0.85 }),
});

// ---------- 사람과 손 ----------
export function person(cx, cy, o = {}) {
  const { s = 1, fill = C.paper, label, lsize = 15, lfill = C.ink, eyes = 'open', hat } = o;
  const k = (v) => n(v * s);
  let out = path(`M${n(cx - 21 * s)} ${n(cy + 25 * s)}V${n(cy + 16 * s)}Q${n(cx - 21 * s)} ${n(cy + 1 * s)} ${n(cx)} ${n(cy + 1 * s)}Q${n(cx + 21 * s)} ${n(cy + 1 * s)} ${n(cx + 21 * s)} ${n(cy + 16 * s)}V${n(cy + 25 * s)}Z`, { fill, stroke: C.ink, sw: 2.2 });
  out += circ(cx, cy - 12 * s, 12 * s, { fill: o.face || C.skin, stroke: C.ink, sw: 2.2 });
  if (eyes === 'open') out += circ(cx - 4.2 * s, cy - 12 * s, 1.7 * s, { fill: C.ink }) + circ(cx + 4.2 * s, cy - 12 * s, 1.7 * s, { fill: C.ink });
  else if (eyes === 'closed') out += path(`M${n(cx - 7 * s)} ${n(cy - 12 * s)}q${k(2.6)} ${k(2.6)} ${k(5.2)} 0M${n(cx + 1.8 * s)} ${n(cy - 12 * s)}q${k(2.6)} ${k(2.6)} ${k(5.2)} 0`, { stroke: C.ink, sw: 1.8, cap: 'round' });
  if (hat) out += path(`M${n(cx - 15 * s)} ${n(cy - 19 * s)}h${k(30)}M${n(cx - 9 * s)} ${n(cy - 19 * s)}v${k(-8)}h${k(18)}v${k(8)}`, { fill: hat, stroke: C.ink, sw: 2 });
  if (label) out += T(cx, cy + 25 * s + lsize * 0.85, label, { size: lsize, fill: lfill });
  return out;
}
// 손바닥 (손가락이 위로 향한 모양, cx/cy는 손바닥 가운데)
export function hand(cx, cy, o = {}) {
  const { s = 1, rot = 0, fill = C.skin } = o;
  const shapes = [
    (a) => rect(-16, -14, 32, 30, { ...a, rx: 11 }),
    (a) => rect(-16, -36, 7.6, 28, { ...a, rx: 3.8 }),
    (a) => rect(-7.8, -41, 7.6, 32, { ...a, rx: 3.8 }),
    (a) => rect(0.4, -40, 7.6, 31, { ...a, rx: 3.8 }),
    (a) => rect(8.6, -34, 7.6, 26, { ...a, rx: 3.8 }),
    (a) => g(rect(-5, -6, 8, 24, { ...a, rx: 4 }), { x: -19, y: 2, rot: -48 }),
  ];
  return g(g(blob(shapes, fill, 2), { s }), { x: cx, y: cy, rot });
}
// 가리키는 손 (검지가 오른쪽을 가리켜요)
export function point(cx, cy, o = {}) {
  const { s = 1, rot = 0, fill = C.skin } = o;
  const shapes = [
    (a) => rect(-18, -12, 28, 26, { ...a, rx: 10 }),
    (a) => rect(2, -12, 30, 8.5, { ...a, rx: 4.2 }),
    (a) => rect(-6, -18, 14, 10, { ...a, rx: 5 }),
  ];
  return g(g(blob(shapes, fill, 2), { s }), { x: cx, y: cy, rot });
}

// ---------- 놀이 도구 ----------
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
export function die(cx, cy, v, o = {}) {
  const { s = 40, fill = C.paper, pip = C.ink, rot = 0, inner } = o;
  let out = rect(cx - s / 2, cy - s / 2 + 3, s, s, { fill: C.ink, rx: s * 0.22 }) + rect(cx - s / 2, cy - s / 2, s, s, { fill, stroke: C.ink, sw: 2.4, rx: s * 0.22 });
  if (inner) out += inner(cx, cy, s);
  else (PIPS[v] || []).forEach(([a, b]) => { out += circ(cx + a * s * 0.25, cy + b * s * 0.25, s * 0.085, { fill: pip }); });
  return g(out, { rot, cx, cy });
}
export function stone(cx, cy, r, color = 'b', o = {}) {
  if (color === 'b') return circ(cx, cy, r, { fill: '#23272F', stroke: C.ink, sw: 1.5 }) + circ(cx - r * 0.32, cy - r * 0.36, r * 0.26, { fill: '#fff', op: o.flat ? 0 : 0.2 });
  return circ(cx, cy, r, { fill: '#fff', stroke: C.ink, sw: 2 });
}
export function pawn(cx, cy, fill, o = {}) {
  const { s = 1 } = o;
  const shapes = [
    (a) => circ(0, -15, 7, a),
    (a) => path('M-9 7C-9 -3 -5 -8 0 -8C5 -8 9 -3 9 7Z', a),
    (a) => rect(-11, 5, 22, 6, { ...a, rx: 3 }),
  ];
  return g(g(blob(shapes, fill, 2), { s }), { x: cx, y: cy, op: o.op });
}
export const coin = (cx, cy, r = 12, o = {}) => circ(cx, cy + 2.5, r, { fill: C.ink }) + circ(cx, cy, r, { fill: o.fill || C.gold, stroke: C.ink, sw: 2 }) + circ(cx, cy, r * 0.62, { stroke: C.ink, sw: 1.4, op: 0.35 }) + (o.label ? T(cx, cy + 0.5, o.label, { size: r * 1.05, weight: 800 }) : '');
export const crown = (cx, cy, s = 1, fill = C.gold) => g(path('M-17 9V-6L-8 2L0 -11L8 2L17 -6V9Z', { fill, stroke: C.ink, sw: 2.2 }) + circ(0, -13, 3, { fill, stroke: C.ink, sw: 1.8 }), { x: cx, y: cy, s });
export const heart = (cx, cy, s = 1, fill = C.red) => g(path('M0 10C-11 2 -14 -5 -9 -9C-5 -12 -2 -9 0 -6C2 -9 5 -12 9 -9C14 -5 11 2 0 10Z', { fill, stroke: C.ink, sw: 2 }), { x: cx, y: cy, s });
export const star = (cx, cy, r, fill = C.gold, o = {}) => {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return poly(pts, { fill, stroke: o.stroke ?? C.ink, sw: o.sw ?? 2 });
};
export const bolt = (cx, cy, s = 1, fill = C.yellow) => g(path('M3 -13L-8 2H-1L-4 13L8 -3H1Z', { fill, stroke: C.ink, sw: 2 }), { x: cx, y: cy, s });
export const timer = (cx, cy, s = 1) => g(path('M-10 -15H10M-10 15H10M-8 -15C-8 -4 8 -4 8 0C8 4 -8 4 -8 15M8 -15C8 -4 -8 -4 -8 0C-8 4 8 4 8 15', { stroke: C.ink, sw: 2.2, cap: 'round' }) + path('M-5 12C-3 7 3 7 5 12Z', { fill: C.gold }), { x: cx, y: cy, s });
export const house = (cx, cy, fill, s = 1) => g(path('M-10 10V-2L0 -11L10 -2V10Z', { fill, stroke: C.ink, sw: 2.2 }), { x: cx, y: cy, s });
export const city = (cx, cy, fill, s = 1) => g(path('M-15 10V-3L-8 -10L-1 -3V-6H15V10Z', { fill, stroke: C.ink, sw: 2.2 }), { x: cx, y: cy, s });
export const eye = (cx, cy, s = 1, closed = false) => g(closed
  ? path('M-14 0Q0 10 14 0', { stroke: C.ink, sw: 2.4, cap: 'round' }) + path('M-9 5L-12 9M0 7V11M9 5L12 9', { stroke: C.ink, sw: 2, cap: 'round' })
  : path('M-15 0Q0 -12 15 0Q0 12 -15 0Z', { fill: '#fff', stroke: C.ink, sw: 2.2 }) + circ(0, 0, 4.5, { fill: C.ink }), { x: cx, y: cy, s });

// ---------- 판 ----------
export function grid(x, y, cols, rows, cell, o = {}) {
  const { stroke = C.line, sw = 1.5, fill } = o;
  let s = fill ? rect(x, y, cols * cell, rows * cell, { fill }) : '';
  let d = '';
  for (let i = 0; i <= cols; i++) d += `M${n(x + i * cell)} ${n(y)}V${n(y + rows * cell)}`;
  for (let j = 0; j <= rows; j++) d += `M${n(x)} ${n(y + j * cell)}H${n(x + cols * cell)}`;
  return s + path(d, { stroke, sw });
}
// 칸 채우기: cells = [[c, r], ...]
export const cells = (x, y, cell, list, fill, o = {}) => list.map(([c, r]) => rect(x + c * cell + (o.inset ?? 1.5), y + r * cell + (o.inset ?? 1.5), cell - 2 * (o.inset ?? 1.5), cell - 2 * (o.inset ?? 1.5), { fill, stroke: o.stroke ?? C.ink, sw: o.sw ?? 1.6, rx: o.rx ?? 3 })).join('');
export const table = (x, y, w, h, o = {}) => rect(x, y, w, h, { fill: o.fill || C.table, rx: o.rx ?? 28, stroke: o.stroke, sw: o.stroke ? 2 : undefined });

// 등호, 더하기 같은 큰 기호
export const big = (x, y, s, o = {}) => T(x, y, s, { size: o.size || 30, weight: 800, fill: o.fill || C.ink });

// 그림 하나를 SVG로 감싸요
export const frameSVG = (art, label) => `<svg class="vis-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${art}</svg>`;

// ---------- 작은 그림 기호 (도블, 치킨차차 같은 그림 맞히기용) ----------
export function sym(kind, cx, cy, r = 14, rot = 0) {
  const k = r / 14;
  let d = '';
  switch (kind) {
    case 'sun': d = circ(0, 0, 7, { fill: C.gold, stroke: C.ink, sw: 1.8 }) + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const t = a * Math.PI / 180; return line(Math.cos(t) * 10, Math.sin(t) * 10, Math.cos(t) * 14, Math.sin(t) * 14, { stroke: C.ink, sw: 2 }); }).join(''); break;
    case 'drop': d = path('M0 -14C5 -6 10 -1 10 5C10 11 5 14 0 14C-5 14 -10 11 -10 5C-10 -1 -5 -6 0 -14Z', { fill: C.sky, stroke: C.ink, sw: 1.8 }); break;
    case 'star': d = star(0, 0, 14, C.orange, { sw: 1.8 }); break;
    case 'heart': d = path('M0 12C-12 3 -15 -5 -10 -10C-6 -13 -2 -10 0 -7C2 -10 6 -13 10 -10C15 -5 12 3 0 12Z', { fill: C.red, stroke: C.ink, sw: 1.8 }); break;
    case 'moon': d = path('M5 -13A13 13 0 1 0 12 7A10 10 0 1 1 5 -13Z', { fill: C.purple, stroke: C.ink, sw: 1.8 }); break;
    case 'leaf': d = path('M-12 12C-12 -6 0 -13 12 -12C13 0 6 12 -12 12Z', { fill: C.green, stroke: C.ink, sw: 1.8 }) + path('M-12 12L5 -5', { stroke: C.ink, sw: 1.5 }); break;
    case 'bolt': d = path('M3 -14L-9 2H-1L-4 14L9 -3H1Z', { fill: C.yellow, stroke: C.ink, sw: 1.8 }); break;
    case 'flower': d = [0, 72, 144, 216, 288].map((a) => { const t = (a - 90) * Math.PI / 180; return circ(Math.cos(t) * 7, Math.sin(t) * 7, 5.5, { fill: C.pink, stroke: C.ink, sw: 1.5 }); }).join('') + circ(0, 0, 4.5, { fill: C.gold, stroke: C.ink, sw: 1.5 }); break;
    case 'note': d = path('M-4 8V-11L10 -14V5', { stroke: C.ink, sw: 2.6, cap: 'round' }) + ell(-8, 8, 5, 4, { fill: C.ink }) + ell(6, 5, 5, 4, { fill: C.ink }); break;
    case 'fish': d = path('M-12 0C-6 -9 6 -9 10 0C6 9 -6 9 -12 0ZM10 0L15 -6V6Z', { fill: '#3FA7A0', stroke: C.ink, sw: 1.8 }) + circ(-5, -2, 1.6, { fill: C.ink }); break;
    case 'cloud': d = path('M-12 7C-16 7 -16 0 -11 -1C-11 -8 -2 -10 1 -5C4 -10 13 -8 12 -1C17 0 16 7 12 7Z', { fill: '#DCEBFA', stroke: C.ink, sw: 1.8 }); break;
    case 'snail': d = circ(2, -2, 9, { fill: C.orange, stroke: C.ink, sw: 1.8 }) + path('M2 -2m-4 0a4 4 0 1 0 4 -4', { stroke: C.ink, sw: 1.5 }) + path('M-13 9H12M-13 9C-15 4 -12 0 -9 1', { stroke: C.ink, sw: 2, cap: 'round' }); break;
    case 'mushroom': d = path('M-12 0C-12 -9 -6 -13 0 -13C6 -13 12 -9 12 0Z', { fill: C.red, stroke: C.ink, sw: 1.8 }) + rect(-5, 0, 10, 12, { fill: C.cream, stroke: C.ink, sw: 1.8, rx: 3 }) + circ(-5, -6, 2, { fill: '#fff' }) + circ(4, -8, 2, { fill: '#fff' }); break;
    default: d = circ(0, 0, 10, { fill: C.line, stroke: C.ink, sw: 1.8 });
  }
  return g(g(d, { s: k, rot }), { x: cx, y: cy });
}

// 팔각형 타일
export function octagon(cx, cy, r, o = {}) {
  const pts = [];
  for (let i = 0; i < 8; i++) { const a = (22.5 + i * 45) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  const sh = pts.map(([x, y]) => [x, y + 3]);
  return poly(sh, { fill: C.ink }) + poly(pts, { fill: o.back ? (o.backFill || '#C99A63') : C.paper, stroke: C.ink, sw: 2.2 }) + (o.back ? poly(pts.map(([x, y]) => [cx + (x - cx) * 0.72, cy + (y - cy) * 0.72]), { stroke: '#fff', sw: 1.4, op: 0.35 }) : '') + (o.sym ? sym(o.sym, cx, cy, r * 0.62) : '');
}
