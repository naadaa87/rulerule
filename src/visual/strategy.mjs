// 전략 게임 그림 설명
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, card, pile, person, hand, point, die, pawn, coin, crown, star, timer, house, city, grid, cells, table, stone } from './kit.mjs';

// ---------- 스플렌더 ----------
const GEM = { g: '#2E9E6B', w: '#FFFFFF', b: C.blue, k: '#2A2F3A', r: C.red, y: C.gold };
const gem = (cx, cy, c, r = 16, o = {}) => circ(cx, cy + 2.5, r, { fill: C.ink }) + circ(cx, cy, r, { fill: GEM[c], stroke: C.ink, sw: 2 })
  + poly([[cx, cy - r * 0.55], [cx + r * 0.5, cy - r * 0.1], [cx, cy + r * 0.55], [cx - r * 0.5, cy - r * 0.1]], { fill: c === 'w' ? '#DCE6F2' : '#fff', fop: c === 'w' ? 1 : 0.35, stroke: c === 'w' ? C.ink : '#fff', sw: 1.2, op: 0.9 })
  + (o.n !== undefined ? T(cx + r * 0.9, cy - r * 0.8, o.n, { size: 13, weight: 800 }) : '');
const scard = (x, y, pts, bonus, cost, o = {}) => card(x, y, {
  w: o.w || 70, h: o.h || 96, back: o.back,
  inner: o.back ? null : (cx, cy, w, h, xx, yy) => rect(xx + 3, yy + 3, w - 6, h * 0.28, { fill: GEM[bonus] === '#FFFFFF' ? '#EEF2F7' : GEM[bonus], op: 0.22, rx: 5 })
    + (pts ? T(xx + 14, yy + 16, pts, { size: 18, weight: 800 }) : '') + gem(xx + w - 15, yy + 15, bonus, 9)
    + cost.map(([c, n], i) => circ(xx + 13, yy + h - 14 - i * 19, 8.5, { fill: GEM[c], stroke: C.ink, sw: 1.5 }) + T(xx + 13, yy + h - 14 - i * 19 + 0.5, n, { size: 11, weight: 800, fill: c === 'w' || c === 'y' ? C.ink : '#fff' })).join(''),
});
const noble = (x, y, req, s = 66) => rect(x, y + 3, s, s, { fill: C.ink, rx: 8 }) + rect(x, y, s, s, { fill: '#F3E6CF', stroke: C.ink, sw: 2, rx: 8 }) + T(x + 14, y + 16, 3, { size: 17, weight: 800 })
  + req.map(([c, n], i) => rect(x + s - 22, y + 8 + i * 20, 16, 17, { fill: GEM[c], stroke: C.ink, sw: 1.4, rx: 3 }) + T(x + s - 14, y + 17 + i * 20, n, { size: 11, weight: 800, fill: c === 'w' ? C.ink : '#fff' })).join('');
const splendor = [
  {
    k: '목표', t: '15점에 먼저 닿으면 그 바퀴를 마쳐요',
    d: '보석을 모아 개발 카드를 사고, 카드에 적힌 점수를 모아요. 누군가 15점에 닿으면 그 바퀴까지만 하고, 점수가 가장 높은 사람이 이겨요.',
    art: scard(40, 60, 3, 'r', [['b', 3], ['k', 3]]) + scard(122, 60, 2, 'g', [['w', 5]]) + scard(204, 60, 1, 'b', [['r', 4]]) + noble(290, 70, [['b', 4], ['g', 4]])
      + star(410, 104, 36) + T(410, 106, '15', { size: 20, weight: 800 }) + T(240, 210, '카드 점수 + 귀족 3점', { size: 17 }) + T(240, 244, '15점이 되면 그 바퀴를 마치고 끝', { size: 14, fill: C.muted }),
  },
  {
    k: '준비', t: '보석과 카드, 귀족을 펼쳐요',
    d: '보석 수는 인원에 맞춰요. 둘은 색마다 4개, 셋은 5개, 넷은 7개이고 황금은 늘 5개예요. 개발 카드는 단계마다 4장씩 펼치고, 귀족은 인원보다 1개 많게 놓아요.',
    art: ['g', 'w', 'b', 'k', 'r', 'y'].map((c, i) => gem(30, 34 + i * 44, c, 15)).join('') + T(30, 290, '보석', { size: 13, fill: C.muted })
      + [0, 1, 2].map((r) => scard(64, 18 + r * 92, 0, 'g', [], { back: true, w: 50, h: 80 }) + [0, 1, 2, 3].map((c) => scard(122 + c * 58, 18 + r * 92, r + (c % 2), ['g', 'b', 'r', 'k'][(r + c) % 4], [['w', 2 + r], ['b', 1 + c % 2]], { w: 52, h: 80 })).join('')).join('')
      + T(402, 30, '귀족', { size: 13, fill: C.muted }) + noble(370, 46, [['r', 4], ['g', 4]], 62) + noble(370, 122, [['b', 3], ['w', 3], ['k', 3]], 62) + noble(370, 198, [['k', 4], ['w', 4]], 62),
  },
  {
    k: '내 차례', t: '보석 가져오기: 다른 색 3개 또는 같은 색 2개',
    d: '서로 다른 색 보석 3개를 1개씩, 또는 같은 색 2개를 가져와요. 같은 색 2개는 그 색이 4개 이상 남아 있을 때만 돼요. 차례가 끝날 때 보석이 10개를 넘으면 돌려놓아요.',
    art: rect(20, 30, 210, 190, { fill: C.paper, stroke: C.ink, sw: 2, rx: 16 }) + T(125, 58, '다른 색 3개', { size: 16 }) + gem(70, 120, 'r') + gem(125, 120, 'b') + gem(180, 120, 'g') + ok(125, 182, 15)
      + rect(250, 30, 210, 190, { fill: C.paper, stroke: C.ink, sw: 2, rx: 16 }) + T(355, 58, '같은 색 2개', { size: 16 }) + gem(325, 120, 'b') + gem(385, 120, 'b') + T(355, 174, '그 색이 4개 이상', { size: 13, fill: C.muted }) + T(355, 194, '남았을 때만', { size: 13, fill: C.muted })
      + pill(240, 262, '가진 보석은 10개까지', { size: 14, bg: C.pt }),
  },
  {
    k: '내 차례', t: '카드를 사거나, 예약해요',
    d: '보석을 내고 펼쳐진 카드나 예약한 카드를 사서 내 앞에 놓아요. 아니면 카드 1장을 손에 예약하고 황금 1개를 받아요. 예약은 3장까지, 황금은 어떤 색으로도 쓸 수 있어요.',
    art: T(120, 30, '사기', { size: 16 }) + gem(40, 92, 'w', 14, { n: 3 }) + gem(40, 136, 'b', 14, { n: 2 }) + arrow(64, 114, 100, 114, { w: 3 }) + scard(110, 66, 1, 'g', [['w', 3], ['b', 2]]) + arrow(190, 114, 218, 114, { w: 3 }) + T(120, 196, '보석을 내고 내 앞에', { size: 13, fill: C.muted })
      + line(240, 40, 240, 260, { stroke: C.line, sw: 2, dash: '5 6' })
      + T(360, 30, '예약하기', { size: 16 }) + scard(266, 66, 2, 'r', [['k', 5]]) + arrow(346, 114, 380, 114, { w: 3 }) + hand(410, 128, { s: 0.8 }) + gem(410, 196, 'y', 15) + T(360, 236, '손에 들고 황금 1개', { size: 13, fill: C.muted }),
  },
  {
    k: '알기', t: '산 카드는 계속 쓰는 할인이에요',
    d: '산 카드 오른쪽 위 보석은 앞으로 계속 할인해 줘요. 루비 2개, 사파이어 1개짜리 카드를 살 때 내 앞에 루비 카드가 1장 있으면 루비 1개, 사파이어 1개만 내면 돼요.',
    art: scard(40, 50, 0, 'r', [['r', 1]], { w: 64, h: 88 }) + T(72, 162, '내 루비 카드', { size: 13, fill: C.muted }) + ring(89, 65, 16)
      + scard(180, 40, 1, 'g', [['r', 2], ['b', 1]], { w: 76, h: 104 }) + T(218, 166, '살 카드', { size: 13, fill: C.muted })
      + T(340, 70, '루비 2 − 1', { size: 18 }) + T(340, 100, '사파이어 1', { size: 18 }) + gem(310, 160, 'r', 16) + gem(360, 160, 'b', 16) + T(338, 206, '이만큼만 내요', { size: 15, fill: C.pt }),
  },
  {
    k: '끝', t: '조건을 채우면 귀족이 저절로 와요',
    d: '귀족 타일에 그려진 색별 카드 수를 모두 채우면 차례가 끝날 때 귀족이 와요. 귀족은 3점이에요. 한 차례에 귀족은 하나만 와요. 동점이면 개발 카드를 적게 산 사람이 이겨요.',
    art: noble(40, 70, [['b', 3], ['g', 3]], 90) + arrow(146, 116, 196, 116, { w: 3.5 })
      + [0, 1, 2].map((i) => scard(212 + i * 12, 40 + i * 14, 0, 'b', [], { w: 54, h: 74 })).join('') + T(260, 190, '사파이어 3', { size: 14 })
      + [0, 1, 2].map((i) => scard(328 + i * 12, 40 + i * 14, 0, 'g', [], { w: 54, h: 74 })).join('') + T(376, 190, '에메랄드 3', { size: 14 })
      + ok(318, 230, 15) + pill(240, 270, '귀족 +3점', { size: 15, bg: C.ok }),
  },
];

// ---------- 카탄 ----------
const RES = { b: ['#C8643B', '벽돌'], w: ['#2F7D4A', '나무'], s: ['#9ED36A', '양털'], g: ['#F2C14E', '곡물'], o: ['#8C96A8', '광석'], d: ['#E8D7A8', '사막'] };
const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = (-90 + i * 60) * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const hex = (cx, cy, r, k, num) => poly(hexPts(cx, cy, r), { fill: RES[k][0], stroke: '#fff', sw: 3 }) + (num ? circ(cx, cy, r * 0.3, { fill: C.cream, stroke: C.ink, sw: 1.5 }) + T(cx, cy + 0.5, num, { size: r * 0.3, weight: 800, fill: num === 6 || num === 8 ? C.red : C.ink }) : '');
const island = (cx, cy, r, tiles) => {
  const dx = Math.sqrt(3) * r, dy = 1.5 * r;
  const pos = [[0, 0], [-dx, 0], [dx, 0], [-dx / 2, -dy], [dx / 2, -dy], [-dx / 2, dy], [dx / 2, dy]];
  return pos.map(([x, y], i) => hex(cx + x, cy + y, r, tiles[i][0], tiles[i][1])).join('');
};
const vtx = (cx, cy, r, i) => hexPts(cx, cy, r)[i];
const road = (x1, y1, x2, y2, c) => line(x1, y1, x2, y2, { stroke: C.ink, sw: 9 }) + line(x1, y1, x2, y2, { stroke: c, sw: 5.5 });
const rcard = (x, y, k, o = {}) => card(x, y, { w: o.w || 30, h: o.h || 42, fill: RES[k][0], rx: 5, op: o.op, inner: (cx, cy) => (o.label ? T(cx, cy, RES[k][1], { size: 13, fill: k === 'g' || k === 's' ? C.ink : '#fff' }) : '') });
const ISL = [['g', 8], ['w', 11], ['b', 6], ['o', 5], ['s', 9], ['s', 4], ['w', 10]];
const catan = [
  {
    k: '목표', t: '승리 점수 10점을 먼저 채워요',
    d: '섬에 마을과 도시를 지어 점수를 모아요. 마을 1점, 도시 2점이에요. 가장 긴 길과 가장 큰 기사단은 2점을 더 받아요. 내 차례에 10점이 되면 바로 이겨요.',
    art: island(170, 150, 50, ISL) + house(...vtx(170, 150, 50, 0), C.red, 1.2) + city(...vtx(170, 150, 50, 3), C.red, 1.1) + house(...vtx(170 + 86.6, 150, 50, 1), C.blue, 1.2)
      + road(...vtx(170, 150, 50, 0), ...vtx(170, 150, 50, 1), C.red)
      + house(390, 70, C.red, 1.3) + T(430, 72, '1점', { size: 17 }) + city(390, 130, C.red, 1.3) + T(434, 132, '2점', { size: 17 }) + star(390, 202, 18) + T(436, 204, '10점', { size: 17 }),
  },
  {
    k: '준비', t: '마을 2개와 길 2개로 시작해요',
    d: '시작 순서대로 마을 1개와 길 1개를 놓고, 마지막 사람부터 거꾸로 한 번 더 놓아요. 두 번째로 놓은 마을에 붙은 땅의 자원을 1장씩 받아요. 도둑은 사막에 둬요.',
    art: [1, 2, 3, 4].map((n, i) => badge(60 + i * 60, 60, n, { r: 15, bg: [C.red, C.blue, C.orange, '#6B7280'][i] })).join('') + arrow(70, 84, 230, 84, { w: 3, c: C.muted }) + T(150, 112, '첫째 바퀴', { size: 14 })
      + [4, 3, 2, 1].map((n, i) => badge(60 + i * 60, 160, n, { r: 15, bg: [C.red, C.blue, C.orange, '#6B7280'][4 - n] })).join('') + arrow(70, 184, 230, 184, { w: 3, c: C.muted }) + T(150, 212, '둘째 바퀴 (거꾸로)', { size: 14 })
      + hex(370, 130, 52, 'w', 11) + house(...vtx(370, 130, 52, 5), C.red, 1.3) + road(...vtx(370, 130, 52, 5), ...vtx(370, 130, 52, 4), C.red)
      + rcard(336, 212, 'w', { label: true, w: 40, h: 52 }) + T(410, 238, '+1장', { size: 16, fill: C.ok }),
  },
  {
    k: '내 차례', t: '주사위 합의 땅에서 자원이 나와요',
    d: '주사위 2개를 굴려요. 나온 합의 숫자가 적힌 땅에 붙은 마을은 자원 1장, 도시는 2장을 받아요. 내 차례가 아니어도 받아요.',
    art: die(54, 70, 3, { s: 44 }) + die(108, 70, 5, { s: 44 }) + T(82, 124, '= 8', { size: 24, weight: 800 })
      + hex(250, 150, 70, 'g', 8) + house(...vtx(250, 150, 70, 0), C.red, 1.3) + city(...vtx(250, 150, 70, 3), C.blue, 1.2)
      + rcard(374, 36, 'g', { label: true, w: 40, h: 52 }) + T(394, 112, '빨강 1장', { size: 14 })
      + rcard(374, 176, 'g', { w: 40, h: 52 }) + rcard(388, 186, 'g', { label: true, w: 40, h: 52 }) + T(408, 260, '파랑 2장', { size: 14 })
      + arrow(266, 70, 364, 70, { w: 3 }) + arrow(270, 222, 364, 218, { w: 3 }),
  },
  {
    k: '짓기', t: '자원을 내고 길, 마을, 도시를 지어요',
    d: '길은 벽돌과 나무, 마을은 벽돌, 나무, 양털, 곡물이 1장씩 들어요. 도시는 광석 3장과 곡물 2장으로 마을을 바꿔 지어요. 발전 카드는 광석, 양털, 곡물 1장씩이에요.',
    art: [['길', ['b', 'w']], ['마을', ['b', 'w', 's', 'g']], ['도시', ['o', 'o', 'o', 'g', 'g']], ['발전 카드', ['o', 's', 'g']]].map(([nm, list], r) => {
      const y = 22 + r * 68;
      const icon = r === 0 ? road(36, y + 40, 70, y + 26, C.red) : r === 1 ? house(52, y + 34, C.red, 1.3) : r === 2 ? city(52, y + 34, C.red, 1.2) : card(38, y + 14, { w: 28, h: 40, back: true, rx: 5 });
      return icon + T(130, y + 34, nm, { size: 15 }) + list.map((k, i) => rcard(186 + i * 46, y + 10, k, { label: true, w: 40, h: 48 })).join('');
    }).join(''),
  },
  {
    k: '이럴 땐', t: '7이 나오면 도둑이 움직여요',
    d: '7이 나오면 아무도 자원을 받지 않아요. 자원 카드가 8장 이상인 사람은 절반을 버려요. 굴린 사람이 도둑을 옮기고, 그 땅에 붙은 사람 한 명에게서 카드 1장을 가져와요.',
    art: die(44, 52, 3, { s: 40 }) + die(92, 52, 4, { s: 40 }) + T(68, 100, '= 7', { size: 22, weight: 800 })
      + [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => rcard(20 + i * 22, 140, ['b', 'w', 's', 'g', 'o', 'w', 'g', 's', 'b'][i], { op: i > 4 ? 0.35 : undefined })).join('')
      + T(116, 210, '9장이면 4장 버려요', { size: 14, fill: C.pt })
      + hex(360, 150, 64, 'o', 5) + pawn(360, 156, '#6B7280', { s: 1.6 }) + arrow(290, 60, 338, 116, { bend: -20, w: 3 }) + T(300, 40, '도둑 옮기기', { size: 14 })
      + house(...vtx(360, 150, 64, 1), C.blue, 1.2) + arrow(410, 112, 440, 200, { bend: -16, w: 3 }) + rcard(426, 210, 'o') + T(360, 266, '1장 가져와요', { size: 14 }),
  },
  {
    k: '알기', t: '자원은 바꿔서 쓸 수 있어요',
    d: '내 차례에는 다른 사람과 흥정해 자원을 바꿀 수 있어요. 은행과는 같은 자원 4장을 원하는 자원 1장으로 바꿔요. 항구에 마을이 있으면 3:1이나 2:1로 바꿔요.',
    art: [['은행', 4, '4 : 1'], ['일반 항구', 3, '3 : 1'], ['특별 항구', 2, '2 : 1']].map(([nm, k, r], i) => {
      const y = 30 + i * 84;
      return T(60, y + 30, nm, { size: 15 }) + Array.from({ length: k }, (_, j) => rcard(120 + j * 18, y + 8, 'w')).join('') + arrow(220, y + 30, 270, y + 30, { w: 3 }) + rcard(286, y + 8, 'o') + T(380, y + 30, r, { size: 22, weight: 800 });
    }).join(''),
  },
];

// ---------- 티켓 투 라이드 ----------
const TC = { r: C.red, b: C.blue, y: C.yellow, g: C.green, k: '#2A2F3A', w: '#FFFFFF', p: C.pink, o: C.orange, x: '#B4BAC5' };
const seg = (x1, y1, x2, y2, n, c, o = {}) => {
  let s = '';
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, sl = (L - 4) / n, a = Math.atan2(uy, ux) * 180 / Math.PI;
  for (let i = 0; i < n; i++) {
    const cx = x1 + ux * (2 + sl * (i + 0.5)), cy = y1 + uy * (2 + sl * (i + 0.5));
    s += g(rect(-sl / 2 + 2, -7, sl - 4, 14, { fill: o.train ? o.train : TC[c], stroke: C.ink, sw: 1.6, rx: 3 }) + (o.train ? rect(-sl / 2 + 5, -3, sl - 10, 6, { fill: '#fff', op: 0.4, rx: 2 }) : ''), { x: cx, y: cy, rot: a });
  }
  return s;
};
const cityDot = (x, y, nm, o = {}) => circ(x, y, 9, { fill: C.paper, stroke: C.ink, sw: 2.4 }) + (nm ? T(x + (o.dx || 0), y + (o.dy ?? -20), nm, { size: 14 }) : '');
const tcard = (x, y, c, o = {}) => card(x, y, { w: o.w || 40, h: o.h || 58, fill: c === 'loco' ? '#F6F0FF' : TC[c], rx: 6, rot: o.rot || 0,
  inner: (cx, cy, w, h) => (c === 'loco'
    ? ['#D8413F', '#F2B42E', '#3D9A5E', '#3B6FC0'].map((cc, i) => rect(cx - w * 0.36 + i * w * 0.18, cy - h * 0.06, w * 0.18, h * 0.12, { fill: cc })).join('') + (w >= 56 ? T(cx, cy + h * 0.26, '기관차', { size: 13, fill: C.purple }) : '')
    : rect(cx - w * 0.3, cy - h * 0.08, w * 0.6, h * 0.16, { fill: '#fff', op: 0.45, rx: 3 })) });
const ticket = (x, y, a, b, pts, o = {}) => rect(x, y + 3, 124, 58, { fill: C.ink, rx: 8 }) + rect(x, y, 124, 58, { fill: '#FFF6E0', stroke: C.ink, sw: 2, rx: 8 }) + T(x + 62, y + 20, `${a}–${b}`, { size: 14 }) + T(x + 62, y + 41, `${pts}점`, { size: 15, weight: 800, fill: C.pt });
const ttr = [
  {
    k: '목표', t: '노선을 잇고 목적지 티켓을 완성해요',
    d: '기차 카드를 모아 도시와 도시 사이 노선을 차지해요. 노선 점수와 목적지 티켓 점수를 더해 가장 많으면 이겨요.',
    art: seg(80, 220, 190, 120, 3, 'x', { train: C.red }) + seg(190, 120, 320, 110, 4, 'b') + seg(320, 110, 410, 200, 3, 'y') + seg(80, 220, 250, 240, 4, 'g') + seg(250, 240, 410, 200, 4, 'x', { train: C.red })
      + cityDot(80, 220, '덴버', { dy: 24 }) + cityDot(190, 120, '오마하') + cityDot(320, 110, '시카고') + cityDot(410, 200, '피츠버그', { dy: 26, dx: 10 }) + cityDot(250, 240, '댈러스', { dy: 24 })
      + ticket(20, 24, '덴버', '시카고', 11),
  },
  {
    k: '준비', t: '기차 45개, 카드 4장, 티켓은 3장 중 2장 이상',
    d: '각자 기차 45개를 가져가요. 기차 카드를 4장씩 나누고 5장을 펼쳐 놓아요. 목적지 티켓은 3장씩 받아 그중 2장 이상을 가져요.',
    art: [0, 1, 2, 3, 4].map((i) => g(rect(-18, -7, 36, 14, { fill: C.red, stroke: C.ink, sw: 1.6, rx: 3 }), { x: 60, y: 60 + i * 20 })).join('') + T(60, 176, '기차 45개', { size: 14 })
      + ['r', 'b', 'loco', 'g'].map((c, i) => tcard(130 + i * 46, 54, c)).join('') + T(220, 140, '기차 카드 4장', { size: 14 })
      + ['y', 'k', 'w', 'r', 'p'].map((c, i) => tcard(118 + i * 46, 176, c, { w: 36, h: 52 })).join('') + T(220, 252, '5장 펼치기', { size: 14 })
      + ticket(346, 30, '덴버', '시카고', 11) + ticket(346, 98, '오마하', '댈러스', 8) + ticket(346, 166, '덴버', '피츠버그', 11) + no(466, 194, 12) + T(408, 254, '2장 이상 가져요', { size: 13, fill: C.muted }),
  },
  {
    k: '내 차례', t: '셋 중 하나만 해요',
    d: '기차 카드 2장 받기, 노선 하나 차지하기, 목적지 티켓 받기 가운데 하나만 해요. 펼친 카드 중 기관차를 가져오면 그 차례에는 그 1장만 가져와요.',
    art: [['카드 2장', (cx) => tcard(cx - 34, 92, 'r') + tcard(cx - 2, 100, 'g')], ['노선 차지', (cx) => seg(cx - 50, 130, cx + 50, 110, 3, 'x', { train: C.red })], ['티켓 받기', (cx) => ticket(cx - 62, 98, 'A', 'B', '?')]].map(([nm, f], i) => {
      const cx = 86 + i * 154;
      return rect(cx - 70, 30, 140, 200, { fill: C.paper, stroke: C.ink, sw: 2, rx: 16 }) + T(cx, 58, nm, { size: 16 }) + f(cx);
    }).join('') + pill(240, 266, '하나만 골라요', { size: 15, bg: C.pt }),
  },
  {
    k: '노선', t: '칸 수만큼 같은 색 카드를 내요',
    d: '노선의 칸 수만큼 그 색 카드를 내고 내 기차를 놓아요. 기관차는 어떤 색으로도 쓸 수 있어요. 회색 노선은 아무 색이든 한 가지 색으로만 내요.',
    art: cityDot(60, 70, '오마하') + cityDot(420, 70, '시카고') + seg(60, 70, 420, 70, 4, 'r') + T(240, 106, '빨간 4칸', { size: 14, fill: C.muted })
      + tcard(110, 140, 'r') + tcard(156, 140, 'r') + tcard(202, 140, 'r') + tcard(248, 140, 'loco') + T(350, 160, '= 빨강 4장', { size: 16 }) + T(350, 184, '기관차는 아무 색', { size: 12, fill: C.muted }) + ok(440, 170, 14)
      + arrow(240, 210, 240, 236, { w: 3 }) + seg(140, 256, 340, 256, 4, 'r', { train: C.blue }) + T(400, 256, '내 기차', { size: 13, fill: C.blue }),
  },
  {
    k: '점수', t: '긴 노선일수록 점수가 훨씬 커요',
    d: '노선을 차지하면 바로 점수를 더해요. 1칸 1점, 2칸 2점, 3칸 4점, 4칸 7점, 5칸 10점, 6칸 15점이에요.',
    art: [[1, 1], [2, 2], [3, 4], [4, 7], [5, 10], [6, 15]].map(([n, p], i) => {
      const x = 52 + i * 72, h = p * 12;
      return rect(x - 22, 230 - h, 44, h, { fill: i >= 4 ? C.pt : C.blue, rx: 6 }) + T(x, 216 - h, `${p}점`, { size: 15, weight: 800 }) + T(x, 252, `${n}칸`, { size: 14, fill: C.muted });
    }).join('') + line(24, 231, 460, 231, { stroke: C.ink, sw: 2 }),
  },
  {
    k: '끝', t: '기차가 2개 이하로 남으면 한 바퀴 더',
    d: '누군가 남은 기차가 2개 이하가 되면 그 사람까지 모두 한 번씩 더 하고 끝나요. 완성한 티켓은 더하고 못 이은 티켓은 빼요. 가장 길게 이어진 사람은 10점을 더 받아요.',
    art: [0, 1].map((i) => g(rect(-18, -7, 36, 14, { fill: C.red, stroke: C.ink, sw: 1.6, rx: 3 }), { x: 60 + i * 42, y: 60 })).join('') + T(140, 60, '2개 남음', { size: 15, anchor: 'start' }) + pill(330, 60, '모두 한 번씩 더', { size: 14, bg: C.pt })
      + ticket(30, 120, '덴버', '시카고', 11) + ok(172, 148, 13) + T(222, 148, '+11', { size: 18, weight: 800, fill: C.ok })
      + ticket(30, 196, '오마하', '댈러스', 8) + no(172, 224, 13) + T(218, 224, '−8', { size: 18, weight: 800, fill: C.pt })
      + rect(290, 130, 150, 110, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(365, 162, '가장 긴 길', { size: 15 }) + T(365, 204, '+10', { size: 26, weight: 800, fill: C.ok }),
  },
];

// ---------- 카르카손 ----------
const FIELD = '#A9D18E', CITY = '#D9A066';
function ctile(x, y, S, o = {}) {
  const { city: cs = [], road: rs = [], join = false, mon = false, shield = false, band = false } = o;
  const m = S / 2;
  const mid = { t: [x + m, y], r: [x + S, y + m], b: [x + m, y + S], l: [x, y + m] };
  let s = rect(x, y, S, S, { fill: FIELD, stroke: C.ink, sw: 1.6 });
  // 길
  const rw = S * 0.12;
  const lines = rs.length === 2 ? [`M${mid[rs[0]][0]} ${mid[rs[0]][1]}Q${x + m} ${y + m} ${mid[rs[1]][0]} ${mid[rs[1]][1]}`] : rs.map((e) => `M${mid[e][0]} ${mid[e][1]}L${x + m} ${y + m}`);
  lines.forEach((d) => { s += path(d, { stroke: C.ink, sw: rw + 3, cap: 'butt' }) + path(d, { stroke: '#F4ECD8', sw: rw, cap: 'butt' }); });
  if (rs.length >= 3) s += rect(x + m - S * 0.1, y + m - S * 0.1, S * 0.2, S * 0.2, { fill: C.brown, stroke: C.ink, sw: 1.4 });
  // 성
  if (band) {
    s += path(`M${x} ${y + S * 0.18}Q${x + m} ${y + S * 0.34} ${x + S} ${y + S * 0.18}V${y + S * 0.82}Q${x + m} ${y + S * 0.66} ${x} ${y + S * 0.82}Z`, { fill: CITY, stroke: C.ink, sw: 1.6 });
  } else if (join && cs.length === 2) {
    const [a, b] = cs.sort().join('') === 'lt' ? [[x, y + S], [x + S, y]] : cs.sort().join('') === 'rt' ? [[x, y], [x + S, y + S]] : cs.sort().join('') === 'br' ? [[x + S, y], [x, y + S]] : [[x, y], [x + S, y + S]];
    const corner = cs.includes('t') ? (cs.includes('l') ? [x, y] : [x + S, y]) : (cs.includes('l') ? [x, y + S] : [x + S, y + S]);
    s += path(`M${a[0]} ${a[1]}L${corner[0]} ${corner[1]}L${b[0]} ${b[1]}Q${x + m} ${y + m} ${a[0]} ${a[1]}Z`, { fill: CITY, stroke: C.ink, sw: 1.6 });
  } else {
    cs.forEach((e) => {
      const d = { t: `M${x} ${y}H${x + S}Q${x + m} ${y + S * 0.5} ${x} ${y}Z`, b: `M${x} ${y + S}H${x + S}Q${x + m} ${y + S * 0.5} ${x} ${y + S}Z`, l: `M${x} ${y}V${y + S}Q${x + S * 0.5} ${y + m} ${x} ${y}Z`, r: `M${x + S} ${y}V${y + S}Q${x + S * 0.5} ${y + m} ${x + S} ${y}Z` }[e];
      s += path(d, { fill: CITY, stroke: C.ink, sw: 1.6 });
    });
  }
  if (mon) s += path(`M${x + m - S * 0.16} ${y + m + S * 0.14}V${y + m - S * 0.04}L${x + m} ${y + m - S * 0.18}L${x + m + S * 0.16} ${y + m - S * 0.04}V${y + m + S * 0.14}Z`, { fill: '#E9E2D2', stroke: C.ink, sw: 1.6 }) + line(x + m, y + m - S * 0.18, x + m, y + m - S * 0.3, { sw: 2 }) + line(x + m - S * 0.06, y + m - S * 0.25, x + m + S * 0.06, y + m - S * 0.25, { sw: 2 });
  const SH = { t: [0.5, 0.12], r: [0.84, 0.42], b: [0.5, 0.78], l: [0.16, 0.42] }[cs[0]] || [0.3, 0.12];
  if (shield) s += path(`M${x + S * (SH[0] - 0.08)} ${y + S * SH[1]}h${S * 0.16}v${S * 0.1}q0 ${S * 0.08} -${S * 0.08} ${S * 0.12}q-${S * 0.08} -${S * 0.04} -${S * 0.08} -${S * 0.12}z`, { fill: C.blue, stroke: C.ink, sw: 1.2 });
  return s;
}
const carcassonne = [
  {
    k: '목표', t: '땅 타일을 이어 붙이며 점수를 모아요',
    d: '타일을 한 장씩 이어 붙여 성, 길, 수도원, 들판을 만들어요. 일꾼을 올려 두었다가 완성되면 점수를 받아요. 끝났을 때 점수가 가장 많으면 이겨요.',
    art: ctile(100, 30, 80, { city: ['r'], shield: true }) + ctile(180, 30, 80, { city: ['l', 'b'], join: true }) + ctile(260, 30, 80, { mon: true, road: ['b'] })
      + ctile(100, 110, 80, { road: ['l', 'r'] }) + ctile(180, 110, 80, { city: ['t'], road: ['l', 'r'] }) + ctile(260, 110, 80, { road: ['l', 't', 'b'] })
      + ctile(100, 190, 80, {}) + ctile(180, 190, 80, {}) + ctile(260, 190, 80, { road: ['t', 'r'] })
      + pawn(206, 62, C.red, { s: 1 }) + pawn(150, 154, C.blue, { s: 1 }) + pawn(300, 82, C.red, { s: 1 }),
  },
  {
    k: '내 차례', t: '맞닿는 변이 모두 이어지게 붙여요',
    d: '타일 1장을 뽑아 이미 놓인 타일과 맞게 붙여요. 길은 길끼리, 성은 성끼리, 들판은 들판끼리 이어져야 해요. 타일은 돌려서 놓아도 돼요.',
    art: ctile(40, 100, 90, { city: ['r'], road: [] }) + ctile(130, 100, 90, { city: ['l'], road: ['b', 'r'] }) + ok(175, 80, 14)
      + ctile(280, 100, 90, { road: ['l', 'r'] }) + ctile(370, 100, 90, { city: ['l'] }) + no(415, 80, 14) + line(370, 104, 370, 186, { stroke: C.pt, sw: 5 })
      + T(130, 236, '성과 성이 이어져요', { size: 15 }) + T(370, 236, '길과 성은 안 맞아요', { size: 15 }),
  },
  {
    k: '내 차례', t: '방금 놓은 타일에 일꾼을 올려요',
    d: '원하면 방금 놓은 타일의 성, 길, 수도원, 들판 중 한 곳에 일꾼을 올려요. 이어진 곳에 이미 다른 일꾼이 있으면 올릴 수 없어요.',
    art: ctile(140, 50, 160, { city: ['t'], road: ['l', 'r'] })
      + pawn(220, 94, C.red, { s: 1.2 }) + T(360, 80, '성 위에: 기사', { size: 15, anchor: 'start' })
      + pawn(170, 140, C.red, { s: 1.2, op: 0.45 }) + T(360, 140, '길 위에: 도둑', { size: 15, anchor: 'start' })
      + pawn(250, 196, C.red, { s: 1.2, op: 0.45 }) + T(360, 196, '들판 위에: 농부', { size: 15, anchor: 'start' })
      + pill(220, 262, '셋 중 한 곳에만 올려요', { size: 14, bg: C.pt }) + arrow(310, 80, 236, 90, { w: 2.5, head: 9 }) + arrow(354, 140, 190, 136, { w: 2.5, head: 9 }) + arrow(354, 196, 268, 190, { w: 2.5, head: 9 }),
  },
  {
    k: '점수', t: '완성하면 바로 점수를 받아요',
    d: '길은 타일 1장에 1점, 성은 타일 1장에 2점에 방패 1개마다 2점을 더해요. 수도원은 둘레 8칸이 모두 차면 9점이에요. 점수를 받으면 일꾼을 돌려받아요.',
    art: ctile(30, 50, 60, { city: ['r'], shield: true }) + ctile(90, 50, 60, { band: true }) + ctile(150, 50, 60, { city: ['l'] }) + pawn(120, 84, C.red, { s: 0.8 })
      + T(120, 140, '(3장 + 방패 1) × 2', { size: 15 }) + T(120, 168, '= 8점', { size: 20, weight: 800, fill: C.ok })
      + ctile(270, 50, 60, { road: ['r', 't', 'b'] }) + ctile(330, 50, 60, { road: ['l', 'r'] }) + ctile(390, 50, 60, { road: ['l', 't', 'b'] }) + pawn(360, 84, C.blue, { s: 0.8 })
      + T(360, 140, '길 3장', { size: 15 }) + T(360, 168, '= 3점', { size: 20, weight: 800, fill: C.ok })
      + T(240, 230, '수도원은 둘레 8칸이 다 차면 9점', { size: 15 }) + T(240, 260, '점수를 받으면 일꾼이 돌아와요', { size: 14, fill: C.muted }),
  },
  {
    k: '이럴 땐', t: '이어 붙여 남의 성에 끼어들기',
    d: '이미 남의 일꾼이 있는 성에는 바로 올릴 수 없어요. 떨어진 곳에 내 성을 따로 만들었다가 이어 붙이면 한 성에 일꾼이 둘이 돼요. 일꾼이 더 많은 사람이 점수를 모두 받고, 같으면 둘 다 받아요.',
    art: ctile(80, 80, 80, { city: ['r'] }) + pawn(140, 124, C.blue, { s: 1 }) + ctile(240, 80, 80, { city: ['l'] }) + pawn(262, 124, C.red, { s: 1 })
      + ctile(160, 80, 80, { band: true }) + box(156, 76, 88, 88) + arrow(200, 200, 200, 170, { w: 3 }) + T(200, 220, '마지막 조각으로 연결', { size: 14 })
      + T(240, 262, '파랑 1 : 빨강 1 → 둘 다 점수', { size: 16, fill: C.pt }),
  },
  {
    k: '끝', t: '타일을 다 놓으면 남은 점수를 세요',
    d: '타일을 모두 놓으면 끝나요. 덜 지은 길은 1장에 1점, 성은 1장에 1점에 방패 1점, 수도원은 자신과 둘레 타일 수만큼이에요. 들판은 붙어 있는 완성된 성 하나마다 3점이에요.',
    art: [['덜 지은 길', '1장 1점'], ['덜 지은 성', '1장 1점, 방패 1점'], ['덜 지은 수도원', '자신 + 둘레 타일 수'], ['들판 (농부)', '완성된 성 하나 3점']].map(([a, b], i) => {
      const y = 46 + i * 56;
      return rect(30, y - 22, 420, 44, { fill: i === 3 ? '#E3F0D8' : C.paper, stroke: C.ink, sw: 1.8, rx: 10 }) + T(54, y, a, { size: 15, anchor: 'start' }) + T(250, y, b, { size: 15, anchor: 'start', fill: C.muted });
    }).join('') + T(240, 278, '들판 일꾼은 끝날 때까지 돌아오지 않아요', { size: 13, fill: C.muted }),
  },
];

// ---------- 아줄 ----------
const AZ = { b: C.blue, y: C.yellow, r: C.red, k: '#2A2F3A', t: '#3FA7A0' };
const atile = (x, y, c, s = 24, o = {}) => rect(x, y + 2, s, s, { fill: C.ink, rx: 4 }) + rect(x, y, s, s, { fill: AZ[c], stroke: C.ink, sw: 1.5, rx: 4, op: o.op }) + rect(x + s * 0.3, y + s * 0.3, s * 0.4, s * 0.4, { fill: '#fff', op: 0.3, rx: 2 });
const factory = (cx, cy, tiles, r = 46) => circ(cx, cy + 3, r, { fill: C.ink }) + circ(cx, cy, r, { fill: '#F2EEE6', stroke: C.ink, sw: 2.2 }) + tiles.map((c, i) => atile(cx - 26 + (i % 2) * 28, cy - 26 + Math.floor(i / 2) * 28, c, 24)).join('');
const WALL = ['bytrk', 'kbytr', 'rkbyt', 'trkby', 'ytrkb'];
const board = (x, y, o = {}) => {
  const s = o.s || 24, lines = o.lines || [[], [], [], [], []], wall = o.wall || [];
  let out = rect(x - 8, y - 8, 10 * (s + 2) + 30, s * 5 + 26 + 40, { fill: '#F7F2E8', stroke: C.ink, sw: 2, rx: 12 });
  for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) {
    const cx = x + (4 - k) * (s + 2), cy = y + r * (s + 2), c = lines[r][k];
    out += c ? atile(cx, cy, c, s) : rect(cx, cy, s, s, { fill: '#fff', stroke: C.line, sw: 1.4, rx: 4 });
  }
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const cx = x + 5 * (s + 2) + 14 + c * (s + 2), cy = y + r * (s + 2), col = WALL[r][c];
    out += wall.some(([a, b]) => a === r && b === c) ? atile(cx, cy, col, s) : rect(cx, cy, s, s, { fill: AZ[col], op: 0.18, rx: 4, stroke: C.line, sw: 1 });
  }
  const fy = y + 5 * (s + 2) + 10;
  out += [-1, -1, -2, -2, -2, -3, -3].map((v, i) => rect(x + i * (s + 6), fy, s + 2, s, { fill: '#fff', stroke: C.line, sw: 1.4, rx: 4 }) + T(x + i * (s + 6) + s / 2 + 1, fy + s + 9, v, { size: 10, fill: C.muted })).join('');
  (o.floor || []).forEach((c, i) => { out += atile(x + i * (s + 6) + 1, fy, c, s); });
  return out;
};
const azul = [
  {
    k: '목표', t: '벽에 타일을 붙여 점수를 모아요',
    d: '가운데 공장에서 타일을 가져와 내 판의 줄을 채우고, 꽉 찬 줄의 타일을 오른쪽 벽에 붙여 점수를 받아요. 끝났을 때 점수가 가장 많으면 이겨요.',
    art: factory(80, 80, ['b', 'b', 'r', 'y']) + factory(80, 196, ['t', 'k', 'k', 'y']) + arrow(140, 140, 180, 140, { w: 3.5 })
      + board(204, 60, { s: 22, lines: [['y'], ['b', 'b'], ['r'], [], ['t', 't', 't']], wall: [[0, 0], [1, 1], [1, 2], [2, 3], [3, 0]] }),
  },
  {
    k: '준비', t: '공장마다 타일 4개씩 올려요',
    d: '인원에 맞게 공장을 놓아요. 둘은 5개, 셋은 7개, 넷은 9개예요. 주머니에서 타일을 4개씩 뽑아 공장마다 올리고, 선 플레이어 표시는 가운데 놓아요.',
    art: [[90, 70], [240, 56], [390, 70], [150, 196], [330, 196]].map(([x, y], i) => factory(x, y, [['b', 'y', 'r', 'r'], ['k', 't', 'b', 'b'], ['y', 'y', 'k', 'r'], ['t', 't', 'b', 'y'], ['r', 'k', 'k', 't']][i], 42)).join('')
      + rect(222, 140, 36, 36, { fill: C.paper, stroke: C.ink, sw: 2, rx: 6 }) + T(240, 158, '1', { size: 20, weight: 800 }) + T(240, 280, '2명: 공장 5개', { size: 15 }),
  },
  {
    k: '내 차례', t: '한 공장에서 한 가지 색을 모두 가져와요',
    d: '공장 하나를 골라 한 가지 색 타일을 모두 가져오고, 남은 타일은 가운데로 밀어요. 또는 가운데에서 한 가지 색을 모두 가져와요.',
    art: factory(110, 120, ['b', 'r', 'b', 'y'], 60) + ring(96, 106, 20) + ring(96, 134, 20)
      + arrow(160, 70, 290, 60, { bend: 14 }) + atile(300, 44, 'b', 30) + atile(336, 44, 'b', 30) + T(350, 100, '파랑 2개 모두', { size: 15 })
      + arrow(160, 170, 280, 210, { bend: -14, c: C.muted }) + circ(340, 220, 44, { stroke: C.line, sw: 2, dash: '5 5' }) + atile(314, 206, 'r', 24) + atile(342, 206, 'y', 24) + T(340, 278, '나머지는 가운데로', { size: 14, fill: C.muted }),
  },
  {
    k: '내 차례', t: '한 줄에 놓고, 넘치면 바닥 줄로',
    d: '가져온 타일을 내 판 왼쪽 한 줄에 놓아요. 한 줄에는 한 가지 색만 놓을 수 있어요. 줄에 다 못 놓는 타일은 맨 아래 바닥 줄로 가서 감점이 돼요.',
    art: board(40, 50, { s: 26, lines: [[], [], ['b', 'b', 'b'], [], []], floor: ['b'] }) + atile(380, 50, 'b', 30) + atile(416, 50, 'b', 30) + atile(398, 90, 'b', 30, { op: 0.5 })
      + arrow(380, 110, 150, 112, { bend: 10, w: 3 }) + arrow(410, 130, 60, 214, { bend: -30, w: 3, c: C.pt }) + T(400, 156, '3칸 줄에 3개', { size: 14 }) + T(330, 250, '넘친 1개는 감점', { size: 14, fill: C.pt }),
  },
  {
    k: '라운드 끝', t: '꽉 찬 줄은 벽으로 옮겨요',
    d: '공장과 가운데가 모두 비면 라운드가 끝나요. 꽉 찬 줄의 타일 하나를 오른쪽 벽의 같은 색 칸으로 옮기고, 나머지는 버려요. 이웃한 타일이 있으면 가로와 세로로 이어진 수만큼 점수를 받아요.',
    art: board(40, 50, { s: 26, lines: [[], [], ['b', 'b', 'b'], [], []], wall: [[2, 1], [1, 2]] }) + arrow(150, 120, 252, 120, { bend: 22, w: 3 }) + ring(40 + 5 * 28 + 14 + 2 * 28 + 13, 50 + 2 * 28 + 13, 18)
      + T(400, 70, '가로 2', { size: 16 }) + T(400, 96, '세로 2', { size: 16 }) + T(400, 128, '= 4점', { size: 20, weight: 800, fill: C.ok }) + T(330, 250, '나머지 2개는 버려요', { size: 14, fill: C.muted }),
  },
  {
    k: '끝', t: '벽의 가로 한 줄이 차면 끝나요',
    d: '라운드가 끝날 때 누군가 벽의 가로 한 줄을 채웠으면 끝나요. 가로 한 줄마다 2점, 세로 한 줄마다 7점, 한 색 5개를 모두 붙이면 10점을 더해요.',
    art: [['가로 한 줄', '+2'], ['세로 한 줄', '+7'], ['한 색 5개', '+10']].map(([a, b], i) => {
      const x = 86 + i * 154;
      return rect(x - 66, 40, 132, 200, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(x, 66, a, { size: 15 })
        + (i === 0 ? [0, 1, 2, 3, 4].map((k) => atile(x - 56 + k * 23, 110, WALL[0][k], 20)).join('') : i === 1 ? [0, 1, 2, 3, 4].map((k) => atile(x - 10, 86 + k * 23, WALL[k][0], 20)).join('') : [0, 1, 2, 3, 4].map((k) => atile(x - 56 + k * 23, 110 + (k % 2) * 23, 'b', 20)).join(''))
        + T(x, 214, b, { size: 26, weight: 800, fill: C.ok });
    }).join('') + T(240, 274, '바닥 줄 감점은 −1, −1, −2, −2, −2, −3, −3', { size: 13, fill: C.muted }),
  },
];

// ---------- 쿼리도 ----------
const QW = '#8A5A2E';
const qboard = (x, y, cell, o = {}) => {
  let s = rect(x - 6, y - 6, cell * 9 + 12, cell * 9 + 12, { fill: '#D9B98A', stroke: C.ink, sw: 2, rx: 8 });
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) s += rect(x + c * cell + 2, y + r * cell + 2, cell - 4, cell - 4, { fill: (o.goal && r === o.goal) ? '#FDECE6' : '#F3E3C8', rx: 3 });
  return s;
};
const qwall = (x, y, cell, c, r, dir) => (dir === 'h'
  ? rect(x + c * cell + 1, y + r * cell - 3, cell * 2 - 2, 6, { fill: QW, stroke: C.ink, sw: 1.2, rx: 2 })
  : rect(x + c * cell - 3, y + r * cell + 1, 6, cell * 2 - 2, { fill: QW, stroke: C.ink, sw: 1.2, rx: 2 }));
const qpawn = (x, y, cell, c, r, fill) => pawn(x + c * cell + cell / 2, y + r * cell + cell / 2 + 4, fill, { s: cell / 34 });
const quoridor = [
  {
    k: '목표', t: '내 말을 맞은편 끝줄에 먼저 보내요',
    d: '말을 한 칸씩 옮기거나 벽을 세워 상대를 돌아가게 만들어요. 내 말이 맞은편 끝줄 아무 칸에나 먼저 닿으면 이겨요.',
    art: qboard(120, 20, 28, { goal: 0 }) + qpawn(120, 20, 28, 4, 8, C.red) + qpawn(120, 20, 28, 4, 0, C.blue)
      + qwall(120, 20, 28, 3, 4, 'h') + qwall(120, 20, 28, 5, 2, 'v') + T(70, 34, '목표', { size: 15, fill: C.pt }) + arrow(70, 238, 70, 60, { w: 3.5 }) + T(420, 244, '내 말', { size: 14, fill: C.red }),
  },
  {
    k: '준비', t: '가운데 칸에 말, 벽은 인원에 맞게',
    d: '둘이 할 때는 마주 보는 변 가운데 칸에 말을 놓고 벽을 10개씩 가져요. 넷이 할 때는 네 변 가운데 칸에 말을 놓고 벽을 5개씩 가져요.',
    art: qboard(30, 34, 22) + qpawn(30, 34, 22, 4, 8, C.red) + qpawn(30, 34, 22, 4, 0, C.blue) + T(129, 264, '2명: 벽 10개씩', { size: 14 })
      + qboard(256, 34, 22) + qpawn(256, 34, 22, 4, 8, C.red) + qpawn(256, 34, 22, 4, 0, C.blue) + qpawn(256, 34, 22, 0, 4, C.green) + qpawn(256, 34, 22, 8, 4, C.yellow) + T(355, 264, '4명: 벽 5개씩', { size: 14 }),
  },
  {
    k: '내 차례', t: '말 한 칸, 또는 벽 하나',
    d: '말을 앞, 뒤, 왼쪽, 오른쪽으로 한 칸 옮기거나, 벽 하나를 칸 사이 홈에 세워요. 둘 중 하나만 해요. 벽 하나는 칸 두 개를 막고, 대각선으로는 갈 수 없어요.',
    art: qboard(30, 30, 26) + qpawn(30, 30, 26, 4, 5, C.red) + arrow(147, 160, 147, 126, { w: 3 }) + arrow(147, 176, 147, 210, { w: 3 }) + arrow(132, 168, 100, 168, { w: 3 }) + arrow(162, 168, 194, 168, { w: 3 })
      + T(380, 60, '또는', { size: 16, fill: C.muted }) + qboard(310, 90, 16) + qwall(310, 90, 16, 3, 4, 'h') + ring(310 + 4 * 16, 90 + 4 * 16, 22) + T(382, 266, '벽은 칸 두 개 길이', { size: 13 }),
  },
  {
    k: '예시', t: '바로 앞 말은 뛰어넘을 수 있어요',
    d: '내 말과 상대 말이 바로 붙어 있으면 상대 말을 뛰어넘어 한 칸 더 갈 수 있어요. 상대 말 뒤에 벽이 있으면 상대 말 옆 대각선 칸으로 가요.',
    art: qboard(20, 30, 24) + qpawn(20, 30, 24, 4, 6, C.red) + qpawn(20, 30, 24, 4, 5, C.blue) + arrow(140, 184, 140, 140, { bend: -24, w: 3.5 }) + ring(128, 138, 13) + ok(170, 112, 12) + T(128, 268, '뛰어넘기', { size: 14 })
      + qboard(250, 30, 24) + qpawn(250, 30, 24, 4, 6, C.red) + qpawn(250, 30, 24, 4, 5, C.blue) + qwall(250, 30, 24, 3, 5, 'h') + arrow(352, 192, 378, 170, { bend: 12, w: 3.5 }) + ring(382, 162, 13) + ok(410, 136, 12) + T(358, 268, '뒤에 벽이면 대각선', { size: 14 }),
  },
  {
    k: '이럴 땐', t: '길을 완전히 막으면 안 돼요',
    d: '어떤 말이든 끝줄까지 가는 길이 하나는 남아 있어야 해요. 벽은 다른 벽과 겹치거나 가로지를 수 없어요. 벽을 다 쓰면 그 뒤로는 말만 옮겨요.',
    art: qboard(56, 20, 28, { goal: 0 }) + qpawn(56, 20, 28, 4, 8, C.red)
      + qwall(56, 20, 28, 4, 8, 'h') + qwall(56, 20, 28, 4, 7, 'v') + qwall(56, 20, 28, 6, 7, 'v')
      + no(400, 200, 18) + T(400, 240, '갇히면 안 돼요', { size: 14, fill: C.pt }) + T(400, 100, '끝줄까지 가는 길이', { size: 14 }) + T(400, 124, '하나는 남아야 해요', { size: 14 }),
  },
];

// ---------- 패치워크 ----------
const pbtn = (cx, cy, r = 5) => circ(cx, cy, r, { fill: C.blue, stroke: C.ink, sw: 1.2 }) + circ(cx - r * 0.3, cy, 0.9, { fill: '#fff' }) + circ(cx + r * 0.3, cy, 0.9, { fill: '#fff' });
const patch = (x, y, cell, list, fill, o = {}) => cells(x, y, cell, list, fill, { inset: 0, sw: 1.6, rx: 2 }) + (o.btn || []).map(([c, r]) => pbtn(x + c * cell + cell / 2, y + r * cell + cell / 2, cell * 0.22)).join('');
const quilt = (x, y, cell) => rect(x - 4, y - 4, cell * 9 + 8, cell * 9 + 8, { fill: '#F2E8D8', stroke: C.ink, sw: 2, rx: 6 }) + grid(x, y, 9, 9, cell, { stroke: '#D9CBB2', sw: 1 });
const ptag = (cx, cy, cost, time) => pill(cx, cy, `단추 ${cost} · 시간 ${time}`, { size: 12, bg: C.paper, fg: C.ink, stroke: C.ink, pad: 8 });
const patchwork = [
  {
    k: '목표', t: '단추는 많이, 빈칸은 적게',
    d: '천 조각을 사서 내 판을 채워 가요. 끝났을 때 단추가 가장 많으면 이겨요. 판에 남은 빈칸 1칸마다 단추 2개를 잃어요.',
    art: quilt(40, 30, 26) + patch(40, 30, 26, [[0, 0], [1, 0], [2, 0], [0, 1]], '#F4A6A0', { btn: [[1, 0]] }) + patch(40, 30, 26, [[3, 0], [3, 1], [4, 1], [4, 2]], '#9CC8E8') + patch(40, 30, 26, [[0, 2], [1, 2], [1, 1], [2, 1], [2, 2]], '#B7DB9C', { btn: [[1, 2], [2, 1]] }) + patch(40, 30, 26, [[5, 0], [6, 0], [7, 0], [8, 0]], '#F6D57E') + patch(40, 30, 26, [[0, 3], [0, 4], [1, 4], [1, 3]], '#C9B3E6', { btn: [[0, 4]] })
      + [0, 1, 2, 3].map((i) => pbtn(330 + i * 26, 92, 11)).join('') + T(370, 130, '단추가 점수', { size: 16 }) + rect(330, 180, 24, 24, { fill: '#fff', stroke: C.line, sw: 2, rx: 3 }) + T(400, 192, '빈칸 −2', { size: 16, fill: C.pt }),
  },
  {
    k: '준비', t: '천 조각을 둥글게 늘어놓아요',
    d: '각자 개인 판과 단추 5개를 받아요. 천 조각을 시간 판 둘레에 아무렇게나 둥글게 늘어놓고, 가장 작은 2칸짜리 조각 바로 다음 자리에 중립 말을 놓아요.',
    art: rect(190, 110, 100, 80, { fill: '#F2E8D8', stroke: C.ink, sw: 2, rx: 10 }) + T(240, 150, '시간 판', { size: 14 })
      + Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2, x = 240 + Math.cos(a) * 190, y = 150 + Math.sin(a) * 112; return patch(x - 14, y - 14, 10, [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]].slice(0, 2 + (i % 4)), ['#F4A6A0', '#9CC8E8', '#B7DB9C', '#F6D57E', '#C9B3E6'][i % 5]); }).join('')
      + pawn(240 + Math.cos(-Math.PI / 2 + Math.PI / 6) * 160, 150 + Math.sin(-Math.PI / 2 + Math.PI / 6) * 90, C.ink, { s: 1 }) + pill(326, 94, '중립 말', { size: 13 }),
  },
  {
    k: '내 차례', t: '시간이 뒤처진 사람이 해요',
    d: '차례가 번갈아 오지 않아요. 시간 판에서 뒤에 있는 사람이 해요. 그래서 한 사람이 몇 번 연속으로 할 수도 있어요.',
    art: Array.from({ length: 12 }, (_, i) => rect(30 + i * 36, 120, 34, 34, { fill: i % 4 === 3 ? '#E6EEF9' : C.paper, stroke: C.ink, sw: 1.6, rx: 4 }) + (i % 4 === 3 ? pbtn(47 + i * 36, 137, 8) : '')).join('')
      + pawn(119, 104, C.red, { s: 1.2 }) + pawn(299, 104, C.blue, { s: 1.2 }) + arrow(119, 60, 119, 80, { w: 3 }) + T(119, 40, '이 사람 차례', { size: 15, fill: C.red })
      + T(240, 200, '뒤에 있는 사람이 계속해요', { size: 16 }) + T(240, 226, '단추 칸을 지날 때 수입을 받아요', { size: 14, fill: C.muted }),
  },
  {
    k: '사기', t: '천 조각을 사서 내 판에 놓아요',
    d: '중립 말 바로 앞 3개 중 하나를 사요. 단추를 내고 조각에 적힌 시간만큼 내 말을 옮겨요. 조각은 돌리거나 뒤집어도 되고, 겹치면 안 돼요.',
    art: pawn(40, 92, C.ink) + patch(76, 56, 16, [[0, 0], [1, 0], [2, 0], [1, 1]], '#9CC8E8', { btn: [[1, 1]] }) + T(100, 116, '단추 3', { size: 12 }) + T(100, 134, '시간 4', { size: 12, fill: C.muted })
      + patch(170, 56, 16, [[0, 0], [0, 1], [1, 1], [1, 2]], '#F4A6A0') + T(186, 116, '단추 2', { size: 12 }) + T(186, 134, '시간 2', { size: 12, fill: C.muted }) + patch(256, 56, 16, [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1]], '#B7DB9C', { btn: [[1, 0], [3, 0]] }) + T(288, 116, '단추 5', { size: 12 }) + T(288, 134, '시간 3', { size: 12, fill: C.muted })
      + box(64, 46, 72, 98) + T(186, 164, '중립 말 앞 3개 중에서', { size: 13, fill: C.muted })
      + arrow(110, 176, 300, 212, { bend: -20, w: 3 }) + quilt(320, 168, 14) + patch(320, 168, 14, [[0, 0], [1, 0], [2, 0], [1, 1]], '#9CC8E8', { btn: [[1, 1]] }),
  },
  {
    k: '앞으로 가기', t: '사지 않고 앞으로 가서 단추 받기',
    d: '사고 싶은 조각이 없으면 상대 말 바로 앞 칸까지 가요. 간 칸 수만큼 단추를 받아요.',
    art: Array.from({ length: 10 }, (_, i) => rect(40 + i * 40, 120, 38, 38, { fill: C.paper, stroke: C.ink, sw: 1.6, rx: 4 })).join('')
      + pawn(79, 104, C.red, { s: 1.2 }) + pawn(239, 104, C.blue, { s: 1.2 }) + arrow(84, 168, 276, 168, { bend: -24, w: 3.5 }) + T(180, 210, '4칸', { size: 16 })
      + [0, 1, 2, 3].map((i) => pbtn(300 + i * 30, 230, 12)).join('') + T(360, 266, '단추 4개', { size: 15, fill: C.ok }),
  },
  {
    k: '끝', t: '단추에서 빈칸을 빼요',
    d: '두 사람 모두 시간 판 끝에 닿으면 끝나요. 가진 단추를 세고, 판의 빈칸 1칸마다 2점씩 빼요. 7×7칸을 먼저 빈틈없이 채운 사람은 7점을 더 받아요.',
    art: T(100, 70, '단추', { size: 16 }) + T(100, 110, '23', { size: 32, weight: 800 }) + T(180, 110, '−', { size: 30, weight: 800 }) + T(270, 70, '빈칸 6 × 2', { size: 16 }) + T(270, 110, '12', { size: 32, weight: 800, fill: C.pt })
      + T(340, 110, '+', { size: 30, weight: 800 }) + T(400, 70, '7×7 보너스', { size: 16 }) + T(400, 110, '7', { size: 32, weight: 800, fill: C.ok })
      + T(240, 190, '= 18점', { size: 34, weight: 800 }) + T(240, 250, '7×7은 먼저 채운 한 사람만 받아요', { size: 14, fill: C.muted }),
  },
];

// ---------- 하나비 ----------
const HC = { r: C.red, y: C.yellow, g: C.green, b: C.blue, w: '#FFFFFF' };
const hcard = (x, y, c, v, o = {}) => card(x, y, { w: o.w || 44, h: o.h || 62, fill: HC[c], back: o.back, rot: o.rot || 0, backFill: '#3A4152',
  inner: o.back ? null : (cx, cy, w, h) => [0, 60, 120, 180, 240, 300].map((a) => { const t = a * Math.PI / 180; return line(cx + Math.cos(t) * w * 0.12, cy - h * 0.12 + Math.sin(t) * w * 0.12, cx + Math.cos(t) * w * 0.26, cy - h * 0.12 + Math.sin(t) * w * 0.26, { stroke: c === 'w' || c === 'y' ? C.ink : '#fff', sw: 2, op: 0.8 }); }).join('') + T(cx, cy + h * 0.24, v, { size: h * 0.32, weight: 800, fill: c === 'w' || c === 'y' ? C.ink : '#fff' }) });
const htoken = (cx, cy, used = false) => circ(cx, cy, 11, { fill: used ? C.line : C.blue, stroke: C.ink, sw: 1.6 });
const hanabi = [
  {
    k: '목표', t: '다섯 색 불꽃을 1부터 5까지 쌓아요',
    d: '모두 한 팀이에요. 색마다 1부터 5까지 순서대로 카드를 내 불꽃을 완성해요. 다섯 색을 모두 완성하면 25점, 만점이에요.',
    art: [['r', 5], ['y', 3], ['g', 4], ['b', 2], ['w', 5]].map(([c, top], i) => Array.from({ length: top }, (_, k) => hcard(40 + i * 86, 190 - k * 28, c, k + 1, { w: 56, h: 78 })).join('') + T(68 + i * 86, 290, `${top}`, { size: 16, weight: 800 })).join('')
      + T(240, 26, '5 + 3 + 4 + 2 + 5 = 19점', { size: 17 }),
  },
  {
    k: '준비', t: '내 카드는 나만 못 봐요',
    d: '받은 카드는 앞면이 남에게 보이게 거꾸로 들어요. 다른 사람 카드는 다 보이지만 내 카드는 볼 수 없어요. 힌트 토큰 8개와 실수 토큰 3개를 가운데 둬요.',
    art: person(240, 220, { s: 1.2, fill: C.ptTint }) + [0, 1, 2, 3].map((i) => hcard(150 + i * 50, 118, 'r', '', { back: true, w: 40, h: 56 })).join('') + T(240, 286, '내 카드: 뒷면만 보여요', { size: 13, fill: C.pt })
      + person(70, 70, { s: 0.9 }) + [['b', 2], ['r', 1], ['y', 4]].map(([c, v], i) => hcard(110 + i * 34, 40, c, v, { w: 32, h: 46 })).join('')
      + person(340, 70, { s: 0.9 }) + [['g', 1], ['w', 3], ['r', 5]].map(([c, v], i) => hcard(374 + i * 34, 40, c, v, { w: 32, h: 46 })).join('') + T(240, 30, '남의 카드는 다 보여요', { size: 13, fill: C.muted }),
  },
  {
    k: '내 차례', t: '힌트 주기: 색 하나 또는 숫자 하나',
    d: '힌트 토큰 1개를 쓰고, 한 사람에게 색 하나나 숫자 하나를 알려 줘요. 그 색이나 숫자인 카드는 빠짐없이 모두 짚어 줘요.',
    art: [['r', 1], ['b', 3], ['r', 4], ['g', 1]].map(([c, v], i) => hcard(110 + i * 70, 60, c, v, { w: 56, h: 78 })).join('') + ring(138, 99, 46) + ring(278, 99, 46)
      + bubble(240, 190, '이 두 장이 빨강이야', { size: 18, tail: 'tl' }) + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => htoken(130 + i * 30, 260, i === 0)).join('') + T(390, 260, '−1', { size: 15, fill: C.pt, anchor: 'start' }),
  },
  {
    k: '내 차례', t: '내기: 이어지면 성공, 아니면 실수',
    d: '내 카드 1장을 내요. 그 색의 다음 숫자면 성공이에요. 이어질 수 없는 카드면 실수 토큰을 하나 쓰고 그 카드는 버려요. 카드를 내거나 버리면 1장을 새로 가져와요.',
    art: hcard(40, 50, 'r', 2, { w: 56, h: 78 }) + hcard(110, 50, 'r', 3, { w: 56, h: 78 }) + ok(170, 40, 14) + T(110, 160, '빨강 2 다음 3', { size: 15 })
      + line(240, 40, 240, 230, { stroke: C.line, sw: 2, dash: '5 6' })
      + hcard(280, 50, 'b', 2, { w: 56, h: 78 }) + hcard(350, 50, 'b', 4, { w: 56, h: 78 }) + no(410, 40, 14) + T(350, 160, '파랑 3이 먼저예요', { size: 15 })
      + circ(330, 220, 14, { fill: C.pt, stroke: C.ink, sw: 1.6 }) + circ(364, 220, 14, { fill: C.paper, stroke: C.ink, sw: 1.6 }) + circ(398, 220, 14, { fill: C.paper, stroke: C.ink, sw: 1.6 }) + T(364, 262, '실수 3번이면 끝', { size: 13, fill: C.muted }),
  },
  {
    k: '내 차례', t: '버리기: 힌트 토큰을 되찾아요',
    d: '내 카드 1장을 버리고 힌트 토큰 1개를 되찾아요. 힌트 토큰이 8개 모두 있으면 버릴 수 없어요. 버린 카드는 모두 볼 수 있게 펼쳐 둬요.',
    art: hcard(90, 60, 'g', 2, { w: 64, h: 90 }) + arrow(170, 104, 250, 104, { w: 3.5 }) + rect(262, 54, 180, 110, { fill: C.paper, stroke: C.line, sw: 2, dash: '5 6', rx: 12 }) + T(352, 76, '버린 카드', { size: 13, fill: C.muted })
      + hcard(280, 92, 'g', 2, { w: 40, h: 56 }) + hcard(326, 92, 'y', 1, { w: 40, h: 56 }) + hcard(372, 92, 'b', 3, { w: 40, h: 56 })
      + htoken(200, 230) + T(250, 230, '+1', { size: 20, weight: 800, fill: C.ok }),
  },
  {
    k: '끝', t: '실수 3번, 모두 완성, 또는 더미가 바닥나면',
    d: '실수가 3번 나오거나 다섯 색을 모두 완성하면 끝나요. 더미가 떨어지면 한 바퀴를 더 돌고 끝나요. 색마다 쌓은 가장 높은 숫자를 더해 점수를 내요.',
    art: [['실수 3번', () => [0, 1, 2].map((i) => circ(62 + i * 30, 120, 12, { fill: C.pt, stroke: C.ink, sw: 1.6 })).join('')], ['다섯 색 완성', () => ['r', 'y', 'g', 'b', 'w'].map((c, i) => hcard(184 + i * 22, 100, c, 5, { w: 30, h: 42 })).join('')], ['더미가 떨어지면', () => pile(374, 86, { w: 36, h: 50, back: true, count: 1, backFill: '#3A4152' }) + T(394, 164, '한 바퀴 더', { size: 13 })]]
      .map(([nm, f], i) => rect(20 + i * 152, 40, 140, 150, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(90 + i * 152, 68, nm, { size: 14 }) + f()).join('')
      + T(240, 250, '점수 = 색마다 가장 높은 숫자의 합', { size: 16 }),
  },
];

// ---------- 오델로 ----------
const oboard = (x, y, cell, stones, o = {}) => {
  let s = rect(x - 4, y - 4, cell * 8 + 8, cell * 8 + 8, { fill: '#2F7D52', stroke: C.ink, sw: 2, rx: 6 }) + grid(x, y, 8, 8, cell, { stroke: '#1E5A3A', sw: 1.4 });
  stones.forEach(([c, r, col, hot]) => { s += stone(x + c * cell + cell / 2, y + r * cell + cell / 2, cell * 0.38, col); if (hot) s += circ(x + c * cell + cell / 2, y + r * cell + cell / 2, cell * 0.46, { stroke: C.gold, sw: 3 }); });
  return s;
};
const othello = [
  {
    k: '목표', t: '끝났을 때 내 색 돌이 많으면 이겨요',
    d: '상대 돌을 내 돌 사이에 끼워 뒤집어 내 색으로 만들어요. 둘 다 놓을 곳이 없으면 끝나고, 돌이 더 많은 쪽이 이겨요.',
    art: oboard(40, 30, 30, [[2, 2, 'b'], [3, 2, 'b'], [4, 2, 'w'], [2, 3, 'w'], [3, 3, 'b'], [4, 3, 'b'], [5, 3, 'b'], [3, 4, 'w'], [4, 4, 'b'], [2, 5, 'b'], [3, 5, 'b'], [4, 5, 'w'], [5, 5, 'w'], [1, 1, 'w']])
      + stone(340, 100, 22, 'b') + T(400, 100, '8개', { size: 22, weight: 800 }) + stone(340, 170, 22, 'w') + T(400, 170, '6개', { size: 22, weight: 800 }) + crown(340, 50, 1),
  },
  {
    k: '준비', t: '가운데 4칸에 엇갈려 놓아요',
    d: '왼쪽 위와 오른쪽 아래는 흰 돌, 오른쪽 위와 왼쪽 아래는 검은 돌이에요. 돌을 반씩 나눠 갖고, 검은 돌이 먼저 둬요.',
    art: oboard(80, 30, 30, [[3, 3, 'w'], [4, 4, 'w'], [4, 3, 'b'], [3, 4, 'b']]) + box(76 + 3 * 30, 26 + 3 * 30, 68, 68) + stone(400, 120, 18, 'b') + T(400, 160, '검은 돌 먼저', { size: 15 }),
  },
  {
    k: '내 차례', t: '상대 돌을 끼우면 뒤집어요',
    d: '내 돌을 놓아 상대 돌을 내 돌 사이에 끼워요. 가로, 세로, 대각선 모두 돼요. 끼운 상대 돌은 모두 뒤집어 내 색으로 만들어요.',
    art: oboard(20, 30, 28, [[2, 4, 'b', true], [3, 4, 'w'], [4, 4, 'w'], [5, 4, 'b']]) + arrow(90, 186, 156, 186, { w: 3, c: C.gold })
      + arrow(262, 150, 292, 150, { w: 3.5 }) + oboard(306, 74, 18, [[2, 4, 'b'], [3, 4, 'b'], [4, 4, 'b'], [5, 4, 'b']]) + T(378, 250, '모두 검은색으로', { size: 14 }),
  },
  {
    k: '예시', t: '여러 방향을 한꺼번에 뒤집어요',
    d: '돌 하나를 놓아 가로와 대각선 두 방향을 동시에 끼우면 두 방향 돌을 모두 뒤집어요. 골라서 일부만 뒤집을 수는 없어요.',
    art: oboard(120, 30, 30, [[1, 6, 'b', true], [2, 6, 'w'], [3, 6, 'w'], [4, 6, 'b'], [2, 5, 'w'], [3, 4, 'w'], [4, 3, 'b']])
      + arrow(170, 225, 240, 225, { w: 3, c: C.gold }) + arrow(168, 210, 240, 140, { w: 3, c: C.gold }) + T(420, 150, '가로 2개', { size: 14 }) + T(420, 176, '대각선 2개', { size: 14 }) + T(420, 206, '모두 뒤집어요', { size: 14, fill: C.pt }),
  },
  {
    k: '이럴 땐', t: '하나도 못 뒤집는 자리엔 못 놓아요',
    d: '하나도 뒤집을 수 없는 자리에는 놓을 수 없어요. 놓을 곳이 없을 때만 넘겨요. 모서리에 놓은 돌은 다시 뒤집힐 일이 없어 유리해요.',
    art: oboard(40, 30, 28, [[3, 3, 'w'], [4, 4, 'w'], [4, 3, 'b'], [3, 4, 'b'], [6, 1, 'b']]) + no(40 + 6 * 28 + 14, 30 + 1 * 28 + 14, 12)
      + T(370, 70, '뒤집을 돌이 없으면', { size: 14 }) + T(370, 94, '놓을 수 없어요', { size: 14, fill: C.pt })
      + oboard(310, 150, 14, [[0, 0, 'b']]) + ring(317, 157, 14, { c: C.gold }) + T(370, 284, '모서리는 안전해요', { size: 13 }),
  },
];

export default {
  splendor,
  catan,
  'ticket-to-ride': ttr,
  carcassonne,
  azul,
  quoridor,
  patchwork,
  hanabi,
  othello,
};
