// 2026-11 추가 게임 그림 설명 (가족·전통)
import { C, rect, circ, ell, line, path, poly, g, T, pill, bubble, badge, ok, no, ring, box, arrow, card, pile, person, hand, die, pawn, coin, crown, house, star, timer, grid, cells, table } from './kit.mjs';
import { bill } from './parts.mjs';

// ---------- 야추 ----------
const sheet = (x, y, rows, o = {}) => {
  const w = o.w || 170, rh = o.rh || 30;
  let s = rect(x, y + 3, w, rows.length * rh + 8, { fill: C.ink, rx: 10 }) + rect(x, y, w, rows.length * rh + 8, { fill: C.paper, stroke: C.ink, sw: 2.4, rx: 10 });
  rows.forEach(([a, b, hi], i) => {
    const yy = y + 4 + i * rh;
    if (hi) s += rect(x + 4, yy + 1, w - 8, rh - 2, { fill: hi, rx: 6 });
    if (i) s += line(x + 8, yy, x + w - 8, yy, { stroke: C.line2, sw: 1.4 });
    s += T(x + 14, yy + rh / 2, a, { size: 15.5, anchor: 'start' }) + T(x + w - 14, yy + rh / 2, b, { size: 16, anchor: 'end', fill: b === '' ? C.muted : C.ink });
  });
  return s;
};
const dice = (x, y, vals, o = {}) => vals.map((v, i) => die(x + i * (o.gap || 46), y, v, { s: o.s || 38, fill: (o.keep || []).includes(i) ? C.okTint : C.paper })).join('');
const yacht = [
  {
    k: '목표', t: '점수표 12칸을 다 채워 합계로 겨뤄요',
    d: '차례마다 주사위를 굴려 점수표의 빈칸 하나에 점수를 적어요. 12번 차례가 지나 모든 칸이 차면 합계가 가장 높은 사람이 이겨요.',
    art: sheet(26, 26, [['4', '12'], ['초이스', '23'], ['포카드', ''], ['풀하우스', '19', C.okTint], ['큰 스트레이트', ''], ['야추', '50', C.ptTint], ['합계', '104']], { w: 196, rh: 34 })
      + dice(262, 92, [5, 5, 5, 5, 5], { s: 34, gap: 42 }) + T(346, 134, '다섯 개가 같으면 야추!', { size: 16, fill: C.pt })
      + pill(346, 200, '12칸 채우면 끝', { size: 15 }) + T(346, 240, '합계가 높은 사람이 이겨요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '내 차례', t: '세 번까지 굴리고, 남길 주사위는 골라 둬요',
    d: '주사위 다섯 개를 굴린 뒤 마음에 드는 주사위는 남겨 두고 나머지만 다시 굴려요. 이렇게 세 번까지 굴릴 수 있어요.',
    art: pill(40, 46, '1번', { size: 15 }) + dice(92, 46, [3, 3, 1, 3, 6], { keep: [0, 1, 3] }) + T(318, 46, '3 세 개를 남겨요', { size: 15.5, anchor: 'start', fill: C.ok })
      + pill(40, 134, '2번', { size: 15 }) + dice(92, 134, [3, 3, 5, 3, 5], { keep: [0, 1, 3] }) + arrow(184, 70, 184, 112, { w: 3, head: 10 }) + arrow(276, 70, 276, 112, { w: 3, head: 10 })
      + pill(320 + 64, 134, '풀하우스!', { size: 15, bg: C.pt })
      + T(240, 214, '남긴 주사위도 다음에 다시 굴릴 수 있어요', { size: 15.5, fill: C.ink2 }) + T(240, 252, '세 번 안에 멈추고 적어도 돼요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '점수 적기', t: '같은 주사위라도 어느 칸에 적을지는 내가 골라요',
    d: '6이 네 개, 2가 하나라면 ‘6’ 칸에 24점을 적을 수도, ‘포카드’ 칸에 주사위 합 26점을 적을 수도 있어요. 맞는 칸이 없으면 한 칸을 골라 0점을 적어요.',
    art: dice(64, 56, [6, 6, 6, 6, 2], { s: 40, gap: 50 })
      + rect(30, 108, 196, 74, { fill: C.okTint, rx: 14 }) + T(128, 132, '‘6’ 칸', { size: 17 }) + T(128, 160, '6 × 4 = 24점', { size: 16, fill: C.ok })
      + rect(254, 108, 196, 74, { fill: C.okTint, rx: 14 }) + T(352, 132, '포카드 칸', { size: 17 }) + T(352, 160, '모두 더해 26점', { size: 16, fill: C.ok })
      + T(240, 224, '둘 중 하나를 골라 적어요', { size: 16 }) + T(240, 258, '맞는 칸이 없으면 한 칸에 0점', { size: 15.5, fill: C.pt }),
  },
  {
    k: '보너스', t: '위쪽 여섯 칸 합이 63점을 넘으면 35점 보너스',
    d: '1부터 6까지 여섯 칸의 합이 63점 이상이면 35점을 더 받아요. 숫자마다 세 개씩 모으면 딱 63점이에요.',
    art: sheet(30, 26, [['1', '3'], ['2', '6'], ['3', '9'], ['4', '12'], ['5', '15'], ['6', '18'], ['위쪽 합', '63', C.okTint]], { w: 170, rh: 33 })
      + arrow(214, 238, 286, 238, { w: 4 }) + rect(296, 196, 160, 84, { fill: C.ptTint, rx: 16 }) + T(376, 224, '보너스', { size: 17 }) + T(376, 256, '+35점', { size: 26, weight: 800, fill: C.pt })
      + T(370, 70, '숫자마다 세 개씩이면', { size: 15.5, fill: C.ink2 }) + T(370, 100, '딱 63점!', { size: 18, fill: C.ok }) + dice(296, 146, [6, 6, 6], { s: 30, gap: 38 }),
  },
];

// ---------- 인생게임 ----------
const car = (cx, cy, fill, s = 1) => g(rect(-24, -8, 48, 22, { fill: C.ink, rx: 8 }) + rect(-24, -11, 48, 22, { fill, stroke: C.ink, sw: 2.2, rx: 8 }) + circ(-12, 12, 6, { fill: C.ink }) + circ(12, 12, 6, { fill: C.ink })
  + circ(-8, -11, 5, { fill: C.skin, stroke: C.ink, sw: 1.6 }) + circ(6, -11, 5, { fill: '#9BC7F0', stroke: C.ink, sw: 1.6 }), { x: cx, y: cy, s });
const spinner = (cx, cy, r, hi) => {
  let s = circ(cx, cy + 3, r, { fill: C.ink });
  const cols = [C.ptTint, C.okTint, C.cream, '#DCEBFA', '#F4E3B5'];
  for (let i = 0; i < 10; i++) {
    const a1 = (i * 36 - 90) * Math.PI / 180, a2 = ((i + 1) * 36 - 90) * Math.PI / 180;
    s += path(`M${cx} ${cy}L${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}A${r} ${r} 0 0 1 ${cx + Math.cos(a2) * r} ${cy + Math.sin(a2) * r}Z`, { fill: i + 1 === hi ? C.gold : cols[i % 5], stroke: C.ink, sw: 1.6 });
    const am = ((i + 0.5) * 36 - 90) * Math.PI / 180;
    s += T(cx + Math.cos(am) * r * 0.72, cy + Math.sin(am) * r * 0.72, String(i + 1), { size: 13, weight: 800 });
  }
  return s + circ(cx, cy, r, { stroke: C.ink, sw: 2.4 }) + circ(cx, cy, 6, { fill: C.ink });
};
const road = (pts, o = {}) => path('M' + pts.map((p) => p.join(' ')).join('L'), { stroke: o.c || C.line, sw: o.w || 22, cap: 'round', join: 'round' }) + path('M' + pts.map((p) => p.join(' ')).join('L'), { stroke: '#fff', sw: 2, dash: '7 8' });
const lifeGame = [
  {
    k: '목표', t: '인생 길을 끝까지 가서 은퇴할 때 가장 부자면 이겨요',
    d: '자동차 말을 타고 학교, 직업, 결혼, 집을 지나 은퇴 칸까지 가요. 은퇴할 때 가진 돈과 집, 카드 값을 더해 가장 많은 사람이 이겨요.',
    art: road([[40, 250], [140, 250], [180, 170], [300, 170], [340, 90], [440, 90]]) + car(110, 246, C.pt, 0.9)
      + pill(160, 210, '직업', { size: 15, bg: C.ok }) + pill(240, 140, '결혼', { size: 15, bg: C.pt }) + house(320, 136, C.gold, 1.6)
      + pill(430, 54, '은퇴', { size: 16 }) + bill(368, 196) + bill(380, 208, { fill: '#F9D8B0' }) + T(370, 262, '가장 많이 가지면 승리', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '내 차례', t: '돌림판을 돌려 나온 수만큼 가요',
    d: '돌림판을 시원하게 돌려 바늘이 가리키는 수(1~10)만큼 자동차를 길 따라 옮겨요. 멈춘 칸에 적힌 대로 돈을 받거나 내요.',
    art: spinner(110, 150, 92, 7) + arrow(110, 150, 52, 192, { w: 5, head: 14 }) + circ(110, 150, 7, { fill: C.pt })
      + T(110, 270, '7이 나왔어요', { size: 16, fill: C.pt })
      + Array.from({ length: 8 }, (_, i) => rect(238 + (i % 4) * 56, 70 + Math.floor(i / 4) * 80, 50, 56, { fill: i === 7 ? C.ptTint : C.paper, stroke: C.ink, sw: 2, rx: 8 })).join('')
      + car(263, 98, C.blue, 0.75) + T(431, 168, '7칸', { size: 15, fill: C.pt }) + arrow(270, 132, 420, 196, { bend: -20, w: 3 }),
  },
  {
    k: '갈림길', t: '처음엔 대학 길과 취업 길 가운데 골라요',
    d: '대학 길은 처음에 돈이 들고 길지만 월급 많은 직업을 고를 기회가 있어요. 취업 길은 바로 일을 시작해 일찍부터 월급을 받아요.',
    art: road([[60, 150], [170, 150]]) + road([[170, 150], [300, 70], [440, 70]], { c: '#C9DCF5' }) + road([[170, 150], [300, 230], [440, 230]], { c: '#CFE8D9' })
      + car(92, 146, C.pt, 0.85) + pill(330, 36, '대학 길', { size: 15, bg: C.blue }) + T(380, 104, '돈이 들지만 좋은 직업', { size: 15.5, fill: C.ink2 })
      + pill(330, 196, '취업 길', { size: 15, bg: C.ok }) + T(380, 264, '바로 월급을 받아요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '칸', t: '월급날은 지나가기만 해도 받고, 빨간 칸에선 꼭 멈춰요',
    d: '월급날 칸을 지나가면 내 월급을 받아요. 결혼, 직업 고르기, 집 사기 같은 빨간 멈춤 칸은 숫자가 남아도 그 칸에서 멈춰요.',
    art: rect(26, 40, 200, 220, { fill: C.okTint, rx: 18 }) + T(126, 70, '월급날', { size: 18 }) + bill(96, 104, { fill: '#F9D8B0' }) + bill(84, 92, { label: '월급' })
      + car(126, 172, C.pt, 0.85) + arrow(60, 204, 196, 204, { c: C.ok, w: 3 }) + T(126, 236, '지나가도 받아요', { size: 15.5, fill: C.ok })
      + rect(254, 40, 200, 220, { fill: C.ptTint, rx: 18 }) + circ(354, 112, 40, { fill: C.pt, stroke: C.ink, sw: 2.4 }) + T(354, 112, '멈춤', { size: 18, fill: '#fff' })
      + T(354, 186, '결혼 · 직업 · 집', { size: 15.5 }) + T(354, 222, '숫자가 남아도 멈춰요', { size: 15.5, fill: C.pt }),
  },
];

// ---------- 다이아몬드 게임 ----------
const HX = (cx, cy, q, r, s) => [cx + s * (q + r / 2), cy + s * r * 0.866];
const starHoles = () => {
  const out = [];
  for (let r = -8; r <= 8; r++) for (let q = -8; q <= 8; q++) {
    const s3 = -q - r;
    const inA = q >= -4 && q <= 4 && r >= -4 && r <= 4 && s3 >= -4 && s3 <= 4;
    const tri = (q >= -4 && r >= -4 && s3 >= -4 && Math.max(q, r, s3) <= 8 && [q, r, s3].filter((v) => v > 4).length === 1) && [q, r, s3].every((v) => v >= -4);
    if (inA || tri) out.push([q, r]);
  }
  return out;
};
const HOLES = starHoles();
const ccBoard = (cx, cy, s, colorOf) => {
  let out = poly([[0, -1], [0.866, 0.5], [-0.866, 0.5]].map(([a, b]) => [cx + a * s * 9.6, cy + b * s * 9.6]), { fill: '#F4E3B5', stroke: C.ink, sw: 2 })
    + poly([[0, 1], [0.866, -0.5], [-0.866, -0.5]].map(([a, b]) => [cx + a * s * 9.6, cy + b * s * 9.6]), { fill: '#F4E3B5', stroke: C.ink, sw: 2 });
  for (const [q, r] of HOLES) {
    const [x, y] = HX(cx, cy, q, r, s);
    const col = colorOf ? colorOf(q, r) : null;
    out += col ? circ(x, y, s * 0.36, { fill: col, stroke: C.ink, sw: 1.3 }) : circ(x, y, s * 0.16, { fill: C.ink2, op: 0.35 });
  }
  return out;
};
const ccHex = (cx, cy, s, list) => list.map(([q, r, col, o]) => {
  const [x, y] = HX(cx, cy, q, r, s);
  return col ? (o === undefined ? circ(x, y + 2, s * 0.34, { fill: C.ink }) : '') + circ(x, y, s * 0.34, { fill: col, stroke: C.ink, sw: 2, op: o }) : circ(x, y, s * 0.13, { fill: C.ink2, op: 0.3 });
}).join('');
const nb = [];
for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) if (Math.abs(q + r) <= 3) nb.push([q, r]);
const chineseCheckers = [
  {
    k: '목표', t: '내 말을 맞은편 꼭짓점으로 모두 옮겨요',
    d: '별 모양 판의 내 꼭짓점에 말을 채워 두고, 맞은편 꼭짓점 삼각형에 먼저 다 넣으면 이겨요.',
    art: ccBoard(170, 150, 13.4, (q, r) => (r > 4 ? C.red : r < -4 ? null : null)) + arrow(170, 244, 170, 62, { bend: 0, w: 4 })
      + ring(170, 46, 30) + T(370, 92, '빨간 말은', { size: 16 }) + T(370, 122, '맞은편 꼭짓점으로', { size: 16, fill: C.pt }) + pill(370, 186, '먼저 다 넣으면 승리', { size: 15 }),
  },
  {
    k: '한 칸', t: '옆 칸이 비어 있으면 한 칸 옮겨요',
    d: '말 하나를 골라 바로 옆 빈칸으로 한 칸 옮겨요. 한 칸 옮기면 그 차례는 끝나요.',
    art: ccHex(140, 150, 36, nb.map(([q, r]) => [q, r, q === 0 && r === 0 ? C.blue : null]))
      + [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]].map(([q, r]) => { const [x, y] = HX(140, 150, q, r, 36); return ring(x, y, 12, { c: C.ok, sw: 2.6 }); }).join('')
      + T(360, 110, '여섯 방향 가운데', { size: 16 }) + T(360, 140, '빈칸으로 한 칸', { size: 16, fill: C.ok }) + T(360, 200, '옮기면 차례 끝', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '뛰어넘기', t: '옆 말을 뛰어넘고, 이어서 또 뛸 수 있어요',
    d: '바로 옆에 말이 있고 그 뒤가 비어 있으면 뛰어넘어요. 도착한 곳에서 또 넘을 말이 있으면 계속 뛰어요. 남의 말도 넘을 수 있고, 넘은 말은 잡지 않아요.',
    art: (() => {
      const S = 46, X = 60, Y = 250, bg = [];
      for (let q = 0; q <= 5; q++) for (let r = -4; r <= 0; r++) { const [x] = HX(X, Y, q, r, S); if (x > 30 && x < 290) bg.push([q, r, null]); }
      const P = (q, r) => HX(X, Y, q, r, S);
      const [a0, a1] = [P(0, 0), P(2, 0)], [b1, c1] = [P(2, -2), P(4, -4)];
      return ccHex(X, Y, S, bg) + ccHex(X, Y, S, [[0, 0, C.blue, 0.35], [1, 0, C.red], [2, -1, C.gold], [3, -3, C.green], [4, -4, C.blue]])
        + arrow(a0[0], a0[1] - 18, a1[0] - 6, a1[1] - 18, { bend: 22, w: 3.4 }) + arrow(a1[0] + 8, a1[1] - 14, b1[0] + 14, b1[1] + 4, { bend: 22, w: 3.4 }) + arrow(b1[0] + 10, b1[1] - 14, c1[0] - 4, c1[1] + 18, { bend: -22, w: 3.4 })
        + badge(a1[0] + 26, a1[1] + 4, 1) + badge(b1[0] - 26, b1[1], 2) + badge(c1[0] + 28, c1[1], 3);
    })()
      + T(380, 90, '한 번에 세 번 점프!', { size: 16, fill: C.pt }) + T(380, 140, '남의 말도 넘을 수 있고', { size: 15.5 }) + T(380, 168, '넘은 말은 잡지 않아요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '작전', t: '말을 한 칸씩 띄워 두면 징검다리가 돼요',
    d: '내 말 몇 개를 한 칸씩 띄워 놓으면 뒤에 오는 말이 그 위를 연달아 뛰어 멀리 갈 수 있어요. 상대도 그 길을 쓸 수 있으니 조심해요.',
    art: ccHex(46, 150, 34, [[0, 0, C.blue], [1, 0, C.blue], [2, 0, null], [3, 0, C.blue], [4, 0, null], [5, 0, C.blue], [6, 0, null], [7, 0, null], [8, 0, null], [9, 0, null], [10, 0, null]])
      + (() => { let s = ''; for (let i = 0; i < 3; i++) { const [a] = HX(46, 150, i * 2, 0, 34); const [b] = HX(46, 150, i * 2 + 2, 0, 34); s += arrow(a, 128, b, 128, { bend: 20, w: 3 }); } return s; })()
      + T(240, 220, '띄워 놓은 내 말이 징검다리', { size: 16 }) + T(240, 252, '상대도 쓸 수 있어요', { size: 15.5, fill: C.pt }),
  },
];

// ---------- 우봉고 ----------
const PCOL = [C.blue, C.gold, C.green, C.red, C.purple];
const piece = (x, y, cellsList, col, sz = 26) => cellsList.map(([c, r]) => rect(x + c * sz, y + r * sz, sz, sz, { fill: col, stroke: C.ink, sw: 2, rx: 3 })).join('');
const puzzle = (x, y, shape, sz = 30, fill = '#fff') => {
  let s = rect(x - 12, y - 12 + 3, 5 * sz + 24, 4 * sz + 24, { fill: C.ink, rx: 12 }) + rect(x - 12, y - 12, 5 * sz + 24, 4 * sz + 24, { fill: C.cream, stroke: C.ink, sw: 2.4, rx: 12 });
  shape.forEach(([c, r]) => { s += rect(x + c * sz, y + r * sz, sz, sz, { fill, stroke: C.ink2, sw: 1.4 }); });
  return s;
};
const UB = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [4, 2]];
const ubongo = [
  {
    k: '목표', t: '조각으로 퍼즐 칸을 빈틈없이 채우면 “우봉고!”',
    d: '모두 같은 순간 퍼즐 카드의 빈칸을 조각으로 채워요. 먼저 채운 사람이 “우봉고!”를 외치고 보석을 먼저 가져가요.',
    art: puzzle(36, 70, UB) + piece(36, 70, [[0, 0], [1, 0], [0, 1], [1, 1]], C.blue, 30) + piece(36, 70, [[2, 0], [3, 0], [2, 1], [3, 1]].map(([a, b]) => [a, b]), C.gold, 30)
      + piece(36, 70, [[1, 2], [2, 2], [3, 2], [4, 2]], C.green, 30) + person(330, 130, { fill: C.ptTint, s: 1.3 }) + bubble(330, 52, '우봉고!', { size: 22, tail: 'bl', bg: C.gold })
      + circ(410, 200, 12, { fill: '#6FC3F0', stroke: C.ink, sw: 2 }) + circ(436, 214, 12, { fill: C.red, stroke: C.ink, sw: 2 }) + T(330, 256, '보석을 먼저 가져가요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '조각 고르기', t: '주사위 그림이 가리킨 줄의 조각만 써요',
    d: '한 사람이 주사위를 굴리면, 퍼즐 카드에서 그 그림이 그려진 줄에 있는 조각 서너 개만 써서 채워요. 바로 모래시계를 뒤집어요.',
    art: die(64, 82, 0, { s: 58, inner: (cx, cy) => circ(cx, cy, 13, { fill: C.pt, stroke: C.ink, sw: 2 }) }) + arrow(102, 82, 150, 82, { w: 3.4 })
      + rect(160, 50, 292, 64, { fill: C.ptTint, rx: 14 }) + circ(186, 82, 11, { fill: C.pt, stroke: C.ink, sw: 2 }) + piece(214, 68, [[0, 0], [1, 0], [0, 1]], C.blue, 20) + piece(274, 68, [[0, 0], [1, 0], [2, 0]], C.gold, 20) + piece(350, 68, [[0, 0], [1, 0], [1, 1], [2, 1]], C.green, 20)
      + rect(160, 130, 292, 64, { fill: C.mist, rx: 14 }) + T(186, 162, '▲', { size: 16, fill: C.muted }) + piece(214, 150, [[0, 0], [0, 1], [1, 1]], C.purple, 20) + piece(274, 150, [[0, 0], [1, 0], [0, 1], [1, 1]], C.red, 20)
      + timer(80, 210, 1.6) + T(80, 262, '바로 뒤집어요', { size: 15.5 }) + T(306, 226, '빨간 동그라미 줄의 조각 3개!', { size: 16, fill: C.pt }),
  },
  {
    k: '채우기', t: '돌리고 뒤집어도 되지만 빈칸이나 튀어나옴은 안 돼요',
    d: '조각은 돌려도 되고 뒤집어도 돼요. 퍼즐 칸이 한 칸이라도 비거나 조각이 칸 밖으로 나오면 아직 끝난 게 아니에요.',
    art: puzzle(28, 58, [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2], [2, 2]], 30) + piece(28, 58, [[0, 0], [1, 0], [0, 1]], C.blue, 30) + piece(28, 58, [[2, 0], [1, 1], [2, 1]], C.gold, 30) + piece(28, 58, [[1, 2], [2, 2]], C.green, 30)
      + ok(120, 230, 20) + T(120, 268, '꽉 찼어요', { size: 16, fill: C.ok })
      + puzzle(272, 58, [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2], [2, 2]], 30) + piece(272, 58, [[0, 0], [1, 0], [0, 1]], C.blue, 30) + piece(272, 58, [[2, 0], [2, 1], [3, 1]], C.gold, 30) + ring(347, 133, 17)
      + no(364, 230, 20) + T(364, 268, '비고 튀어나왔어요', { size: 16, fill: C.pt }),
  },
  {
    k: '보석', t: '모래시계가 끝나기 전에 채운 순서대로 보석을 받아요',
    d: '먼저 끝낸 사람부터 보석을 가져가요. 늦어도 모래시계가 다 떨어지기 전에만 채우면 받을 수 있어요. 정해진 판이 끝나면 보석으로 승부를 가려요.',
    art: timer(70, 120, 3) + T(70, 214, '다 떨어지면 끝', { size: 15.5, fill: C.pt })
      + person(194, 120, { fill: C.okTint, label: '1등' }) + person(290, 120, { fill: C.cream, label: '2등' }) + person(386, 120, { fill: C.mist, label: '늦음', eyes: 'closed' })
      + circ(180, 60, 10, { fill: '#6FC3F0', stroke: C.ink, sw: 2 }) + circ(204, 60, 10, { fill: C.red, stroke: C.ink, sw: 2 }) + circ(290, 60, 10, { fill: C.gold, stroke: C.ink, sw: 2 })
      + no(386, 60, 14) + T(290, 236, '보석이 가장 많으면 승리', { size: 16 }),
  },
];

// ---------- 쿼클 ----------
const QC = { r: C.red, o: C.orange, y: C.gold, g: C.green, b: C.blue, p: C.purple };
const qShape = (k, cx, cy, col, r = 10) => {
  if (k === 'circle') return circ(cx, cy, r, { fill: col, stroke: C.ink, sw: 1.6 });
  if (k === 'square') return rect(cx - r, cy - r, r * 2, r * 2, { fill: col, stroke: C.ink, sw: 1.6, rx: 2 });
  if (k === 'diamond') return poly([[cx, cy - r * 1.2], [cx + r * 1.1, cy], [cx, cy + r * 1.2], [cx - r * 1.1, cy]], { fill: col, stroke: C.ink, sw: 1.6 });
  if (k === 'star') return star(cx, cy, r * 1.25, col, { sw: 1.6 });
  if (k === 'clover') return circ(cx, cy - r * 0.55, r * 0.58, { fill: col, stroke: C.ink, sw: 1.5 }) + circ(cx - r * 0.6, cy + r * 0.3, r * 0.58, { fill: col, stroke: C.ink, sw: 1.5 }) + circ(cx + r * 0.6, cy + r * 0.3, r * 0.58, { fill: col, stroke: C.ink, sw: 1.5 });
  return path(`M${cx - r * 0.35} ${cy - r}h${r * 0.7}v${r * 0.65}h${r * 0.65}v${r * 0.7}h${-r * 0.65}v${r * 0.65}h${-r * 0.7}v${-r * 0.65}h${-r * 0.65}v${-r * 0.7}h${r * 0.65}z`, { fill: col, stroke: C.ink, sw: 1.5 });
};
const qt = (x, y, sh, c, o = {}) => rect(x, y + 3, 40, 40, { fill: C.ink, rx: 7 }) + rect(x, y, 40, 40, { fill: '#2F3440', stroke: C.ink, sw: 2, rx: 7 }) + qShape(sh, x + 20, y + 20, QC[c], 11) + (o.hi ? rect(x - 3, y - 3, 46, 46, { stroke: C.pt, sw: 3, rx: 9, dash: '5 4' }) : '');
const SH = ['circle', 'square', 'diamond', 'star', 'clover', 'cross'];
const qwirkle = [
  {
    k: '목표', t: '같은 색 또는 같은 모양끼리 줄을 이어 점수를 모아요',
    d: '타일 한 줄은 색이 모두 같거나 모양이 모두 같아야 해요. 내가 만든 줄의 타일 수만큼 점수를 받고, 판이 끝나면 점수가 높은 사람이 이겨요.',
    art: T(240, 34, '같은 색 줄', { size: 16 }) + ['circle', 'square', 'star', 'clover'].map((s, i) => qt(140 + i * 50, 56, s, 'b')).join('')
      + T(240, 136, '같은 모양 줄', { size: 16 }) + ['r', 'y', 'g', 'p'].map((c, i) => qt(140 + i * 50, 158, 'diamond', c)).join('')
      + T(240, 252, '줄의 타일 수 = 점수', { size: 16, fill: C.pt }),
  },
  {
    k: '줄 규칙', t: '한 줄에 똑같은 타일은 두 번 못 들어가요',
    d: '파란 줄에는 파란 원이 한 번만 들어가요. 색이 같으면서 모양이 다르거나, 모양이 같으면서 색이 달라야 해요.',
    art: ['circle', 'square', 'star'].map((s, i) => qt(40 + i * 50, 70, s, 'g')).join('') + qt(190, 70, 'clover', 'g', { hi: true }) + ok(260, 90, 18)
      + ['circle', 'square', 'star'].map((s, i) => qt(40 + i * 50, 170, s, 'g')).join('') + qt(190, 170, 'square', 'g', { hi: true }) + no(260, 190, 18)
      + T(372, 90, '새 모양이면 좋아요', { size: 15.5, fill: C.ok }) + T(372, 190, '같은 타일은 안 돼요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '점수', t: '타일 하나로 두 줄이 생기면 두 줄 다 점수예요',
    d: '놓은 타일이 가로 줄과 세로 줄을 동시에 만들면 두 줄의 타일 수를 모두 더해요. 아래 예는 가로 3 + 세로 3 = 6점이에요.',
    art: qt(100, 120, 'circle', 'r') + qt(150, 120, 'square', 'r') + qt(200, 120, 'star', 'r', { hi: true }) + qt(200, 70, 'star', 'b') + qt(200, 170, 'star', 'y')
      + T(360, 100, '가로 3점', { size: 17 }) + T(360, 140, '세로 3점', { size: 17 }) + line(300, 166, 420, 166, { stroke: C.ink, sw: 2 }) + T(360, 192, '= 6점', { size: 22, weight: 800, fill: C.pt }),
  },
  {
    k: '쿼클', t: '여섯 개를 다 채우면 12점, ‘쿼클!’',
    d: '한 줄에 여섯 가지 모양(또는 여섯 가지 색)이 다 들어가면 6점에 6점을 더 받아요. 그 줄은 더 늘릴 수 없어요.',
    art: SH.map((s, i) => qt(60 + i * 62, 94, s, 'o')).join('') + bubble(240, 44, '쿼클!', { size: 20, bg: C.gold })
      + T(240, 182, '6점 + 보너스 6점', { size: 18 }) + T(240, 222, '= 12점', { size: 28, weight: 800, fill: C.pt }) + T(240, 264, '이 줄은 끝이에요', { size: 15.5, fill: C.ink2 }),
  },
];

// ---------- 마라케시 ----------
const RUG = { r: '#E46B5A', b: '#5C8FD6', y: '#E9B949', p: '#9B7AD0' };
const mBoard = (x, y, cs, rugs, o = {}) => {
  let s = rect(x - 6, y - 6 + 3, cs * 7 + 12, cs * 7 + 12, { fill: C.ink, rx: 10 }) + rect(x - 6, y - 6, cs * 7 + 12, cs * 7 + 12, { fill: '#F2D9A0', stroke: C.ink, sw: 2.4, rx: 10 });
  s += grid(x, y, 7, 7, cs, { stroke: '#C89B55', sw: 1.2 });
  (rugs || []).forEach(([c, r, col, hi]) => { s += rect(x + c * cs + 2, y + r * cs + 2, cs - 4, cs - 4, { fill: RUG[col], stroke: hi ? C.pt : C.ink, sw: hi ? 3 : 1.4, rx: 3 }); });
  return s;
};
const assam = (cx, cy, dir = 0, s = 1) => g(poly([[0, -16], [9, 4], [-9, 4]], { fill: C.pt, stroke: C.ink, sw: 1.8 }) + circ(0, 6, 9, { fill: '#B5763F', stroke: C.ink, sw: 2 }) + circ(0, -1, 5, { fill: C.skin, stroke: C.ink, sw: 1.4 }), { x: cx, y: cy, rot: dir, s });
const marrakech = [
  {
    k: '목표', t: '양탄자를 깔고, 끝날 때 돈과 보이는 양탄자가 많으면 이겨요',
    d: '상인 아쌈을 움직여 그 옆에 내 양탄자를 깔아요. 양탄자를 다 깔고 나면 가진 돈과 판 위에 보이는 내 양탄자 칸 수를 더해 가장 많은 사람이 이겨요.',
    art: mBoard(30, 30, 34, [[1, 1, 'r'], [2, 1, 'r'], [3, 3, 'b'], [3, 4, 'b'], [4, 4, 'b'], [5, 2, 'y'], [5, 3, 'y'], [1, 5, 'p'], [2, 5, 'p']]) + assam(30 + 3.5 * 34, 30 + 2.5 * 34, 90, 1.2)
      + coin(330, 90, 16) + coin(360, 96, 16) + coin(345, 120, 16) + T(300, 152, '돈 1개 = 1점', { size: 15.5, anchor: 'start' })
      + rect(300, 184, 26, 26, { fill: RUG.b, stroke: C.ink, sw: 1.6, rx: 3 }) + T(334, 197, '보이는 칸 = 1점', { size: 15.5, anchor: 'start' }),
  },
  {
    k: '방향', t: '아쌈은 그대로 가거나 왼쪽·오른쪽으로만 돌아요',
    d: '차례마다 먼저 아쌈의 방향을 정해요. 그대로 두거나 90도 왼쪽, 오른쪽으로 돌릴 수 있지만 뒤로 돌릴 수는 없어요. 그다음 주사위를 굴려 그 수만큼 앞으로 가요.',
    art: assam(150, 160, 0, 2.4) + arrow(150, 112, 150, 44, { c: C.ok, w: 4 }) + arrow(118, 160, 50, 160, { c: C.ok, w: 4 }) + arrow(182, 160, 250, 160, { c: C.ok, w: 4 }) + arrow(150, 200, 150, 262, { c: C.pt, w: 4, dash: '6 6' })
      + no(186, 250, 15) + T(360, 80, '그대로, 왼쪽, 오른쪽', { size: 16, fill: C.ok }) + T(360, 112, '뒤로는 못 돌아요', { size: 16, fill: C.pt })
      + die(320, 200, 2) + die(376, 200, 3) + T(420, 250, '주사위는 1·2·2·3·3·4', { size: 15.5, anchor: 'end', fill: C.ink2 }),
  },
  {
    k: '통행료', t: '남의 양탄자에 멈추면 이어진 칸 수만큼 돈을 줘요',
    d: '아쌈이 파란 양탄자에 멈췄고 그 파란 칸과 이어진 파란 칸이 모두 5칸이면, 파란 주인에게 5만큼 줘요. 대각선은 이어진 것으로 보지 않아요.',
    art: mBoard(30, 30, 34, [[2, 2, 'b', 1], [3, 2, 'b', 1], [3, 3, 'b', 1], [4, 3, 'b', 1], [4, 4, 'b', 1], [5, 5, 'b'], [1, 1, 'r'], [2, 1, 'r']]) + assam(30 + 3.5 * 34, 30 + 3.5 * 34, 0, 1.1)
      + T(30 + 5.5 * 34, 289, '대각선은 따로예요', { size: 15.5, fill: C.pt })
      + person(350, 70, { fill: C.ptTint, label: '나' }) + person(350, 196, { fill: '#DCEBFA', label: '파란 주인' }) + arrow(392, 104, 392, 176, { w: 3.4 }) + coin(426, 130) + T(430, 162, '5', { size: 18, fill: C.pt }),
  },
  {
    k: '깔기', t: '아쌈 바로 옆에 두 칸짜리 양탄자를 깔아요',
    d: '양탄자 한 칸 이상이 아쌈과 맞닿아야 해요. 남의 양탄자를 덮어도 되지만, 한 양탄자 두 칸을 그대로 덮을 수는 없어요.',
    art: mBoard(30, 40, 26, [[2, 2, 'y'], [3, 2, 'y'], [3, 3, 'r', 1], [3, 4, 'r', 1]]) + assam(30 + 2.5 * 26, 40 + 3.5 * 26, 90, 0.9)
      + mBoard(266, 40, 26, [[2, 2, 'y'], [3, 2, 'y'], [2, 2, 'r', 1], [3, 2, 'r', 1]]) + assam(266 + 2.5 * 26, 40 + 3.5 * 26, 0, 0.9)
      + ok(52, 262, 15) + T(80, 262, '옆에 붙여 깔기', { size: 15.5, anchor: 'start', fill: C.ok })
      + no(288, 262, 15) + T(316, 262, '두 칸 통째로 덮기', { size: 15.5, anchor: 'start', fill: C.pt }),
  },
];

// ---------- 모노폴리 ----------
const deed = (x, y, name, col, o = {}) => rect(x, y + 3, 78, 104, { fill: C.ink, rx: 8 }) + rect(x, y, 78, 104, { fill: C.paper, stroke: C.ink, sw: 2.2, rx: 8 }) + rect(x + 5, y + 5, 68, 28, { fill: col, rx: 5 })
  + T(x + 39, y + 19, name, { size: 15.5, fill: '#fff' }) + line(x + 12, y + 50, x + 66, y + 50, { stroke: C.line, sw: 2 }) + line(x + 12, y + 66, x + 66, y + 66, { stroke: C.line, sw: 2 }) + line(x + 12, y + 82, x + 52, y + 82, { stroke: C.line, sw: 2 }) + (o.mark ? o.mark : '');
const jail = (x, y, w, h) => rect(x, y, w, h, { fill: C.mist, stroke: C.ink, sw: 2.4, rx: 8 }) + Array.from({ length: 5 }, (_, i) => line(x + (i + 1) * w / 6, y + 4, x + (i + 1) * w / 6, y + h - 4, { stroke: C.ink2, sw: 4 })).join('');
const monopoly = [
  {
    k: '목표', t: '땅을 사고 임대료를 받아, 다른 사람이 모두 파산하면 이겨요',
    d: '판을 돌며 땅을 사요. 남이 내 땅에 멈추면 임대료를 받고, 돈이 떨어진 사람은 파산해서 빠져요. 끝까지 혼자 남으면 이겨요.',
    art: deed(32, 40, '보라', C.purple) + deed(124, 40, '보라', C.purple) + house(70, 176, C.ok, 1.8) + house(160, 176, C.ok, 1.8) + rect(108, 160, 28, 34, { fill: C.pt, stroke: C.ink, sw: 2.2, rx: 3 })
      + T(116, 230, '같은 색을 모으면 건물을 지어요', { size: 15.5 })
      + person(330, 86, { fill: C.okTint, label: '나' }) + person(420, 86, { fill: C.mist, label: '파산', eyes: 'closed' }) + coin(300, 190) + coin(324, 196) + coin(312, 216) + bill(350, 186) + T(366, 256, '혼자 남으면 승리', { size: 16, fill: C.pt }),
  },
  {
    k: '건물', t: '같은 색 땅을 모두 가져야 집을 지을 수 있어요',
    d: '같은 색 땅을 다 모으면 임대료가 두 배가 되고 집을 지을 수 있어요. 집은 같은 색 땅에 고르게 하나씩, 네 채를 지은 다음엔 호텔로 바꿔요.',
    art: deed(30, 60, '하늘', C.sky) + deed(116, 60, '하늘', C.sky) + rect(202, 60, 78, 104, { stroke: C.line, sw: 2.4, rx: 8, dash: '6 5' }) + T(241, 112, '?', { size: 30, fill: C.muted })
      + no(155, 200, 16) + T(155, 236, '한 장 모자라요', { size: 15.5, fill: C.pt })
      + ok(380, 70, 16) + T(380, 104, '다 모으면', { size: 16 }) + house(340, 160, C.ok, 1.6) + house(380, 160, C.ok, 1.6) + house(420, 160, C.ok, 1.6)
      + arrow(380, 188, 380, 222, { w: 3 }) + rect(360, 230, 40, 34, { fill: C.pt, stroke: C.ink, sw: 2.2, rx: 4 }) + T(436, 248, '호텔', { size: 15.5 }),
  },
  {
    k: '임대료', t: '남의 땅에 멈추면 땅 문서에 적힌 임대료를 내요',
    d: '임대료는 건물이 많을수록 비싸져요. 돈이 모자라면 건물을 팔거나 땅을 저당 잡혀 마련하고, 그래도 모자라면 파산이에요.',
    art: rect(40, 60, 150, 170, { fill: C.paper, stroke: C.ink, sw: 2.4, rx: 10 }) + rect(46, 66, 138, 40, { fill: C.red, rx: 6 }) + house(80, 150, C.ok, 1.5) + house(115, 150, C.ok, 1.5) + house(150, 150, C.ok, 1.5)
      + pawn(115, 206, C.blue, { s: 1.2 }) + arrow(206, 150, 286, 150, { w: 4 }) + coin(318, 130) + coin(342, 136) + coin(330, 158) + bill(366, 128)
      + person(410, 66, { fill: C.ptTint, label: '땅 주인' }) + T(352, 222, '건물이 많을수록 비싸요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '감옥', t: '감옥에서는 더블, 벌금, 탈출 카드로 나와요',
    d: '감옥에 가면 다음 차례에 더블을 굴리거나, 벌금을 내거나, 감옥 탈출 카드를 써서 나와요. 세 번 안에 더블이 안 나오면 벌금을 내고 나와요.',
    art: jail(30, 60, 150, 150) + pawn(105, 150, C.red, { s: 1.4 }) + T(105, 240, '감옥', { size: 17 })
      + die(250, 78, 4) + die(296, 78, 4) + T(380, 78, '더블', { size: 16, fill: C.ok })
      + coin(262, 150) + coin(286, 156) + T(380, 152, '벌금 내기', { size: 16, fill: C.ok })
      + card(246, 196, { w: 70, h: 44, fill: C.cream, inner: (cx, cy) => T(cx, cy, '탈출', { size: 15.5 }) }) + T(380, 218, '탈출 카드', { size: 16, fill: C.ok }),
  },
];

// ---------- 고스톱 ----------
const MONTH_COL = ['#E46B5A', '#E98AA6', '#F2A8BC', '#9B7AD0', '#5C8FD6', '#E46B5A', '#C2873E', '#3E8E6E', '#E9B949', '#D9773F', '#8A6A4A', '#5F6675'];
const hwa = (x, y, m, o = {}) => {
  const w = o.w || 40, h = o.h || 60;
  if (o.back) return rect(x, y + 3, w, h, { fill: C.ink, rx: 5 }) + rect(x, y, w, h, { fill: '#B4342E', stroke: C.ink, sw: 2, rx: 5 }) + rect(x + 5, y + 5, w - 10, h - 10, { stroke: '#fff', sw: 1.2, rx: 3, op: 0.35 });
  let s = rect(x, y + 3, w, h, { fill: C.ink, rx: 5 }) + rect(x, y, w, h, { fill: '#FFF8EC', stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2, rx: 5 }) + rect(x + 4, y + 4, w - 8, h - 8, { fill: MONTH_COL[m - 1], rx: 3, op: 0.2 });
  s += T(x + w / 2, y + 16, String(m), { size: 14, weight: 800, fill: MONTH_COL[m - 1] });
  if (o.kind === '광') s += circ(x + w / 2, y + h * 0.62, w * 0.24, { fill: C.gold, stroke: C.ink, sw: 1.5 }) + T(x + w / 2, y + h * 0.62, '광', { size: 12, weight: 800 });
  else if (o.kind === '띠') s += rect(x + w * 0.2, y + h * 0.48, w * 0.6, h * 0.3, { fill: o.tc || C.red, stroke: C.ink, sw: 1.4, rx: 2 });
  else if (o.kind === '열') s += path(`M${x + w * 0.25} ${y + h * 0.7}Q${x + w / 2} ${y + h * 0.4} ${x + w * 0.75} ${y + h * 0.7}`, { stroke: C.ink, sw: 2.4, cap: 'round' }) + circ(x + w * 0.35, y + h * 0.58, 3, { fill: C.ink });
  else s += circ(x + w / 2, y + h * 0.64, w * 0.16, { fill: MONTH_COL[m - 1], stroke: C.ink, sw: 1.3 });
  return s;
};
const goStop = [
  {
    k: '목표', t: '같은 달끼리 짝을 맞춰 가져오고 점수를 먼저 내요',
    d: '화투는 1월부터 12월까지 달마다 4장, 모두 48장이에요. 같은 달 패를 맞춰 가져와 광, 열끗, 띠, 피로 점수를 모아요. 3명이면 3점이 나면 고나 스톱을 정해요.',
    art: [1, 3, 8, 11].map((m, i) => hwa(36 + i * 50, 40, m, { kind: '광' })).join('') + T(130, 120, '광', { size: 16 })
      + [2, 4, 8].map((m, i) => hwa(270 + i * 50, 40, m, { kind: '열' })).join('') + T(320, 120, '열끗', { size: 16 })
      + [1, 2, 3].map((m, i) => hwa(36 + i * 50, 150, m, { kind: '띠', tc: C.red })).join('') + T(110, 230, '띠', { size: 16 })
      + [5, 6, 9, 10].map((m, i) => hwa(252 + i * 50, 150, m)).join('') + T(350, 230, '피', { size: 16 })
      + T(240, 270, '3명이면 3점부터 고·스톱', { size: 15.5, fill: C.pt }),
  },
  {
    k: '내 차례', t: '손패를 내 짝을 맞추고, 더미를 뒤집어 한 번 더 맞춰요',
    d: '손의 패 한 장을 내서 바닥의 같은 달 패와 짝을 맞춰요. 그다음 더미 맨 위 패를 뒤집어 또 짝을 맞춰요. 짝이 맞은 패는 모두 내가 가져와요.',
    art: rect(20, 26, 300, 150, { fill: '#DCEFE0', rx: 16 }) + T(48, 46, '바닥', { size: 15.5, anchor: 'start', fill: C.ok })
      + hwa(60, 70, 3, { hi: true }) + hwa(120, 70, 7) + hwa(180, 70, 9) + hwa(240, 70, 12)
      + hwa(40, 206, 3, { kind: '광', hi: true }) + T(60, 286, '손에서 3월', { size: 15.5 }) + arrow(66, 200, 80, 140, { w: 3.4, bend: -10 }) + badge(30, 180, 1)
      + pile(380, 70, { w: 40, h: 60, backFill: '#B4342E', back: true }) + T(400, 152, '더미', { size: 15.5 }) + arrow(376, 100, 280, 100, { w: 3.4, bend: 10 }) + badge(330, 70, 2)
      + hwa(380, 206, 12) + T(400, 286, '뒤집어 12월', { size: 15.5 }) + ok(260, 160, 14) + ok(80, 160, 14),
  },
  {
    k: '점수', t: '광 3장 3점, 띠·열끗 5장 1점, 피 10장 1점',
    d: '광은 3장이면 3점(비광이 섞이면 2점), 열끗과 띠는 5장부터 1점, 피는 10장부터 1점이에요. 고도리(2·4·8월 새 열끗)는 5점, 홍단·청단·초단은 각 3점이에요.',
    art: [1, 3, 8].map((m, i) => hwa(30 + i * 44, 40, m, { kind: '광', w: 38, h: 56 })).join('') + T(220, 68, '3점', { size: 20, weight: 800, fill: C.pt })
      + [2, 4, 8].map((m, i) => hwa(30 + i * 44, 116, m, { kind: '열', w: 38, h: 56 })).join('') + T(220, 144, '고도리 5점', { size: 17, fill: C.pt })
      + [1, 2, 3].map((m, i) => hwa(30 + i * 44, 192, m, { kind: '띠', tc: C.red, w: 38, h: 56 })).join('') + T(220, 220, '홍단 3점', { size: 17, fill: C.pt })
      + rect(290, 40, 170, 214, { fill: C.mist, rx: 16 }) + T(375, 76, '띠 5장 → 1점', { size: 15.5 }) + T(375, 116, '열끗 5장 → 1점', { size: 15.5 }) + T(375, 156, '피 10장 → 1점', { size: 15.5 }) + T(375, 196, '한 장 더할 때마다', { size: 15.5, fill: C.ink2 }) + T(375, 224, '1점씩 더해요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '고·스톱', t: '점수가 나면 “고”로 더 가거나 “스톱”으로 멈춰요',
    d: '고를 부르면 계속하고 점수가 더 올라가요. 하지만 그사이 다른 사람이 먼저 나면 고를 부른 사람이 크게 잃어요. 스톱하면 그 판을 이기고 점수를 받아요.',
    art: person(240, 110, { fill: C.cream, s: 1.5 }) + T(240, 182, '3점 났다!', { size: 16 })
      + rect(36, 60, 130, 120, { fill: C.ptTint, rx: 18 }) + T(101, 104, '고!', { size: 30, weight: 800, fill: C.pt }) + T(101, 146, '더 간다', { size: 16 })
      + rect(314, 60, 130, 120, { fill: C.okTint, rx: 18 }) + T(379, 104, '스톱!', { size: 28, weight: 800, fill: C.ok }) + T(379, 146, '여기서 끝', { size: 16 })
      + T(101, 220, '점수는 오르지만', { size: 15.5 }) + T(101, 248, '남이 나면 크게 잃어요', { size: 15.5, fill: C.pt })
      + T(379, 220, '그 판을 이기고', { size: 15.5 }) + T(379, 248, '점수를 받아요', { size: 15.5, fill: C.ok }),
  },
];

// ---------- 승경도놀이 ----------
const yunmok = (cx, cy, s = 1, v = 3) => g(poly([[-46, -12], [46, -12], [52, 0], [46, 12], [-46, 12], [-52, 0]], { fill: C.wood, stroke: C.ink, sw: 2.2 }) + line(-46, 0, 46, 0, { stroke: C.woodDark, sw: 1.4 })
  + Array.from({ length: v }, (_, i) => line(-14 + i * 10, -8, -14 + i * 10, 8, { stroke: C.ink, sw: 3 })).join(''), { x: cx, y: cy, s });
const office = (x, y, w, h, name, o = {}) => rect(x, y + 2, w, h, { fill: C.ink, rx: 4 }) + rect(x, y, w, h, { fill: o.fill || '#FFF8EC', stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 1.6, rx: 4 }) + T(x + w / 2, y + h / 2, name, { size: o.size || 15.5, fill: o.fc || C.ink });
const seunggyeongdo = [
  {
    k: '목표', t: '윤목을 굴려 벼슬을 올리고, 가장 높은 자리에서 물러나면 이겨요',
    d: '판에는 낮은 벼슬부터 높은 벼슬까지 칸이 가득해요. 윤목을 굴려 칸에 적힌 대로 벼슬을 옮겨 가다가, 정해진 가장 높은 자리에 오른 뒤 물러나는 칸까지 가면 이겨요.',
    art: rect(24, 20, 260, 260, { fill: '#F6ECD6', stroke: C.ink, sw: 2.4, rx: 10 })
      + office(118, 34, 72, 34, '영의정', { hi: true, fill: C.cream })
      + [[40, 84, '판서'], [118, 84, '참판'], [196, 84, '대사헌']].map(([x, y, nm]) => office(x, y, 72, 32, nm)).join('')
      + [[40, 132, '정랑'], [118, 132, '좌랑'], [196, 132, '교리']].map(([x, y, nm]) => office(x, y, 72, 32, nm)).join('')
      + [[40, 180, '주부'], [118, 180, '직장'], [196, 180, '봉사']].map(([x, y, nm]) => office(x, y, 72, 32, nm)).join('')
      + office(118, 232, 72, 34, '출발', { fill: C.okTint }) + arrow(300, 250, 300, 52, { w: 3.4 }) + T(316, 150, '위로', { size: 15.5, anchor: 'start', fill: C.pt })
      + yunmok(380, 90, 1, 3) + T(380, 130, '윤목', { size: 16 }) + crown(380, 200, 1.6) + T(380, 246, '물러나면 승리', { size: 16, fill: C.pt }),
  },
  {
    k: '윤목', t: '다섯 모 막대 윤목을 굴려 눈금을 봐요',
    d: '윤목은 다섯 모서리에 한 줄부터 다섯 줄까지 눈금을 새긴 나무 막대예요. 굴려서 위로 올라온 면의 눈금 수(1~5)가 나온 수예요.',
    art: yunmok(150, 90, 1.5, 1) + yunmok(150, 170, 1.5, 3) + yunmok(150, 250, 1.5, 5)
      + T(300, 90, '1', { size: 22, weight: 800 }) + T(300, 170, '3', { size: 22, weight: 800, fill: C.pt }) + T(300, 250, '5', { size: 22, weight: 800 })
      + T(400, 140, '위로 올라온', { size: 15.5 }) + T(400, 168, '눈금 수만큼', { size: 15.5, fill: C.pt }),
  },
  {
    k: '칸 읽기', t: '지금 칸에 적힌 대로, 나온 수에 맞는 다음 벼슬로 가요',
    d: '내 말이 있는 칸에는 ‘1이면 어디, 2면 어디…’처럼 다음 칸이 적혀 있어요. 윤목이 3이면 3에 적힌 벼슬로 옮겨요. 판마다 길이 달라요.',
    art: rect(30, 50, 200, 200, { fill: '#FFF8EC', stroke: C.ink, sw: 2.4, rx: 8 }) + T(130, 82, '지금 칸 (예시)', { size: 15.5, fill: C.muted }) + T(130, 114, '봉사', { size: 22, weight: 800 })
      + line(50, 136, 210, 136, { stroke: C.line, sw: 2 }) + [['1', '그대로'], ['2', '직장'], ['3', '주부'], ['4', '좌랑'], ['5', '파직']].map(([a, b], i) => T(70, 156 + i * 20, a, { size: 13, weight: 800, fill: i === 2 ? C.pt : C.ink }) + T(150, 156 + i * 20, b, { size: 15.5, fill: i === 2 ? C.pt : C.ink })).join('')
      + yunmok(330, 80, 1, 3) + arrow(330, 104, 330, 150, { w: 3.4 }) + office(290, 160, 80, 40, '주부', { hi: true }) + T(330, 236, '3에 적힌 칸으로', { size: 15.5, fill: C.pt }),
  },
  {
    k: '귀양', t: '귀양 칸에 가면 적힌 대로 쉬거나 풀려나길 기다려요',
    d: '벼슬길에는 승진만 있는 게 아니에요. 파직이나 귀양 칸에 가면 판에 적힌 대로 몇 차례 쉬거나 정해진 눈금이 나와야 돌아와요.',
    art: path('M40 220Q120 196 200 220T360 220T440 220', { stroke: C.sky, sw: 5, cap: 'round' }) + ell(150, 190, 70, 22, { fill: '#F2D9A0', stroke: C.ink, sw: 2.2 })
      + person(150, 150, { fill: C.mist, eyes: 'closed', s: 1.1 }) + T(150, 252, '귀양', { size: 17 })
      + rect(276, 60, 170, 120, { fill: C.mist, rx: 16 }) + T(361, 94, '판에 적힌 대로', { size: 15.5 }) + T(361, 124, '몇 차례 쉬기', { size: 16, fill: C.pt }) + T(361, 154, '또는 눈금 기다리기', { size: 15.5 }),
  },
];

export default { yacht, 'game-of-life': lifeGame, 'chinese-checkers': chineseCheckers, ubongo, qwirkle, marrakech, monopoly, 'go-stop': goStop, seunggyeongdo };
