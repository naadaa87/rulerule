// 가족 게임 그림 설명
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, motion, card, pile, numCard, colorCard, tile, person, hand, point, die, pawn, coin, crown, heart, star, bolt, timer, grid, cells, table, big, sym, octagon } from './kit.mjs';

// ---------- 할리갈리 ----------
function fruit(kind, cx, cy, s = 1) {
  let d;
  if (kind === 'strawberry') d = path('M-11 -5C-12 -11 -4 -12 0 -10C4 -12 12 -11 11 -5C10 4 4 12 0 15C-4 12 -10 4 -11 -5Z', { fill: '#E5484D', stroke: C.ink, sw: 1.8 })
    + [[-5, -1], [4, -3], [0, 4], [-3, 9], [5, 6]].map(([x, y]) => ell(x, y, 1.2, 1.7, { fill: '#FFE08A' })).join('')
    + path('M-8 -9L-3 -9L0 -15L3 -9L8 -9L3 -6L0 -8L-3 -6Z', { fill: C.green, stroke: C.ink, sw: 1.4 });
  else if (kind === 'banana') d = path('M-13 -9C-15 5 -3 14 12 9C14 8 14 6 12 5C1 7 -6 1 -8 -10C-9 -13 -12 -13 -13 -9Z', { fill: '#F6CB45', stroke: C.ink, sw: 1.8 }) + line(-12.5, -10, -11, -13.5, { stroke: C.brown, sw: 3 });
  else if (kind === 'lime') d = circ(0, 0, 12, { fill: '#7CB342', stroke: C.ink, sw: 1.8 }) + circ(0, 0, 8.5, { fill: '#D4ECB0' }) + path('M0 -8V8M-7 -4L7 4M-7 4L7 -4', { stroke: '#7CB342', sw: 1.3 });
  else d = circ(0, 1, 12, { fill: '#7E55BE', stroke: C.ink, sw: 1.8 }) + ell(-4, -3, 3, 4, { fill: '#fff', op: 0.25 }) + path('M0 -11Q2 -15 5 -16', { stroke: C.brown, sw: 2, cap: 'round' }) + path('M2 -13Q8 -18 11 -12Q6 -10 2 -13Z', { fill: C.green, stroke: C.ink, sw: 1.2 });
  return g(d, { x: cx, y: cy, s });
}
const FPOS = { 1: [[0.5, 0.5]], 2: [[0.5, 0.3], [0.5, 0.7]], 3: [[0.5, 0.2], [0.5, 0.5], [0.5, 0.8]], 4: [[0.3, 0.28], [0.7, 0.28], [0.3, 0.72], [0.7, 0.72]], 5: [[0.28, 0.2], [0.72, 0.2], [0.5, 0.5], [0.28, 0.8], [0.72, 0.8]] };
const fruitCard = (x, y, kind, count, o = {}) => {
  const w = o.w || 64, h = o.h || 88;
  return card(x, y, { ...o, w, h, inner: (cx, cy, ww, hh, xx, yy) => FPOS[count].map(([a, b]) => fruit(kind, xx + a * ww, yy + b * hh, (count >= 3 ? 0.62 : 0.8) * ww / 64)).join('') });
};
const bell = (cx, cy, s = 1) => g(rect(-28, 6, 56, 9, { fill: '#9AA1AD', stroke: C.ink, sw: 2, rx: 4.5 }) + path('M-22 7C-22 -15 -11 -23 0 -23C11 -23 22 -15 22 7Z', { fill: C.silver, stroke: C.ink, sw: 2.2 }) + path('M-14 -6C-13 -13 -8 -17 -3 -18', { stroke: '#fff', sw: 3, cap: 'round', op: 0.85 }) + rect(-4, -31, 8, 9, { fill: '#9AA1AD', stroke: C.ink, sw: 2, rx: 3 }), { x: cx, y: cy, s });

const halli = [
  {
    k: '목표', t: '같은 과일이 딱 5개면 종을 쳐요',
    d: '카드를 한 장씩 뒤집다가 같은 과일이 정확히 5개 보이면 누구보다 먼저 종을 쳐요. 마지막까지 카드가 남은 사람이 이겨요.',
    art: fruitCard(46, 52, 'strawberry', 3, { w: 80, h: 112 }) + fruitCard(144, 52, 'strawberry', 2, { w: 80, h: 112 })
      + T(135, 208, '3 + 2 = 5', { size: 30, weight: 800 }) + ok(230, 208, 17)
      + bell(362, 214, 1.5) + hand(362, 120, { rot: 180, s: 1.05 })
      + motion(362, 200, 50, 160, 200, { count: 3 }) + motion(362, 200, 50, -20, 20, { count: 3 }) + T(430, 150, '땡!', { size: 22, weight: 800, fill: C.pt }),
  },
  {
    k: '준비', t: '카드를 똑같이 나눠 뒤집어 쌓아요',
    d: '카드를 섞어 모두에게 똑같이 나누고, 그림이 안 보이게 한 더미로 내 앞에 쌓아요. 종은 모두의 손이 닿는 가운데에 둬요.',
    art: table(100, 46, 280, 208) + person(240, 24, { s: 0.8 }) + person(240, 274, { s: 0.8, fill: C.ptTint }) + person(56, 150, { s: 0.8 }) + person(424, 150, { s: 0.8 })
      + pile(219, 58, { w: 38, h: 52, back: true }) + pile(219, 186, { w: 38, h: 52, back: true }) + pile(118, 124, { w: 38, h: 52, back: true }) + pile(320, 124, { w: 38, h: 52, back: true })
      + bell(240, 156, 0.95) + pill(318, 218, '내 더미', { size: 14, bg: C.pt }),
  },
  {
    k: '내 차례', t: '맨 위 카드를 바깥쪽으로 뒤집어요',
    d: '내 더미 맨 위 카드를 다른 사람 쪽으로 넘겨 더미 앞에 펼쳐요. 나만 먼저 보이게 뒤집으면 반칙이에요.',
    art: person(240, 268, { s: 0.85, fill: C.ptTint }) + person(70, 46, { s: 0.75 }) + person(410, 46, { s: 0.75 })
      + pile(205, 156, { w: 60, h: 84, back: true }) + fruitCard(208, 34, 'banana', 4, { w: 60, h: 84 })
      + arrow(282, 196, 284, 84, { bend: -46 }) + pill(380, 142, '바깥쪽으로 넘겨요', { size: 15, bg: C.pt }),
  },
  {
    k: '예시', t: '보이는 맨 위 카드끼리 더해요',
    d: '사람마다 보이는 카드는 맨 위 한 장뿐이에요. 딸기가 3개와 2개, 모두 5개니까 종을 쳐요.',
    art: table(70, 20, 300, 260) + fruitCard(193, 30, 'strawberry', 3, { w: 54, h: 76 }) + fruitCard(300, 112, 'banana', 4, { w: 54, h: 76 }) + fruitCard(193, 194, 'strawberry', 2, { w: 54, h: 76 }) + fruitCard(86, 112, 'lime', 1, { w: 54, h: 76 })
      + bell(220, 156, 0.8) + box(185, 23, 70, 92) + box(185, 187, 70, 92)
      + T(425, 132, '딸기', { size: 18, fill: C.muted }) + T(425, 164, '3 + 2', { size: 24, weight: 800 }) + T(425, 196, '= 5', { size: 24, weight: 800 }) + ok(425, 240, 17),
  },
  {
    k: '이럴 땐', t: '6개면 치면 안 돼요',
    d: '정확히 5개일 때만 쳐요. 잘못 치면 다른 사람 모두에게 내 카드를 1장씩 줘요.',
    art: fruitCard(30, 40, 'strawberry', 3, { w: 70, h: 98 }) + fruitCard(118, 40, 'strawberry', 3, { w: 70, h: 98 }) + T(110, 180, '3 + 3 = 6', { size: 28, weight: 800 }) + no(110, 230, 18)
      + line(238, 30, 238, 270, { stroke: C.line, sw: 2, dash: '5 6' })
      + pill(360, 28, '잘못 쳤다면', { size: 14 })
      + person(290, 90, { s: 0.7 }) + person(360, 72, { s: 0.7 }) + person(430, 90, { s: 0.7 }) + person(360, 248, { s: 0.8, fill: C.ptTint })
      + arrow(346, 218, 298, 132, { bend: 8 }) + arrow(360, 214, 360, 116, {}) + arrow(374, 218, 422, 132, { bend: -8 })
      + T(278, 175, '1장', { size: 14, fill: C.pt }) + T(380, 168, '1장', { size: 14, fill: C.pt }) + T(442, 175, '1장', { size: 14, fill: C.pt }),
  },
  {
    k: '끝', t: '맞히면 펼친 카드를 모두 가져가요',
    d: '가장 먼저 종을 친 사람이 모든 사람 앞에 펼쳐진 카드를 가져가 내 더미 아래에 넣어요. 카드가 떨어지면 빠지고, 마지막 한 명이 이겨요.',
    art: fruitCard(40, 24, 'strawberry', 3, { w: 54, h: 76 }) + fruitCard(150, 24, 'banana', 4, { w: 54, h: 76 }) + fruitCard(276, 24, 'strawberry', 2, { w: 54, h: 76 }) + fruitCard(386, 24, 'lime', 1, { w: 54, h: 76 })
      + arrow(70, 112, 200, 196, { bend: 20 }) + arrow(178, 112, 222, 186, { bend: 6 }) + arrow(302, 112, 258, 186, { bend: -6 }) + arrow(412, 112, 282, 196, { bend: -20 })
      + pile(212, 186, { w: 56, h: 76, back: true }) + pill(240, 284, '내 더미 아래로', { size: 14, bg: C.pt }),
  },
];

// ---------- 도블 ----------
const DPOS = [[0, 0, 0.32], [0, -0.6, 0.26], [0.57, -0.19, 0.26], [0.35, 0.49, 0.26], [-0.35, 0.49, 0.26], [-0.57, -0.19, 0.26]];
const dpos = (cx, cy, r, i) => [cx + DPOS[i][0] * r, cy + DPOS[i][1] * r, DPOS[i][2] * r];
const dcard = (cx, cy, r, kinds, o = {}) => circ(cx, cy + 3, r, { fill: C.ink }) + circ(cx, cy, r, { fill: o.back ? C.ink : C.paper, stroke: C.ink, sw: 2.4 })
  + (o.back ? circ(cx, cy, r * 0.78, { stroke: '#fff', sw: 1.4, op: 0.3 }) : kinds.map((kd, i) => { const [x, y, rr] = dpos(cx, cy, r, i); return sym(kd, x, y, rr * (o.sizes ? o.sizes[i] : 1), o.rots ? o.rots[i] : (i * 37) % 60 - 30); }).join(''));
const A6 = ['moon', 'sun', 'drop', 'star', 'leaf', 'flower'];
const B6 = ['heart', 'bolt', 'note', 'fish', 'sun', 'cloud'];
const dobble = [
  {
    k: '목표', t: '두 카드에 같은 그림은 딱 하나예요',
    d: '어떤 두 카드를 골라도 같은 그림이 꼭 하나 있어요. 그 그림을 누구보다 먼저 찾아 이름을 외쳐요.',
    art: dcard(140, 150, 92, A6, { sizes: [1, 1, 1, 1, 1, 1] }) + dcard(340, 150, 92, B6, { sizes: [1, 1, 1, 1, 1.25, 1] })
      + ring(...dpos(140, 150, 92, 1).slice(0, 2), 30) + ring(...dpos(340, 150, 92, 4).slice(0, 2), 34)
      + path(`M${dpos(140, 150, 92, 1)[0] + 30} ${dpos(140, 150, 92, 1)[1]}Q 250 40 ${dpos(340, 150, 92, 4)[0] - 30} ${dpos(340, 150, 92, 4)[1] - 10}`, { stroke: C.pt, sw: 3, dash: '6 5' })
      + pill(240, 274, '해!', { size: 18, bg: C.pt }),
  },
  {
    k: '준비', t: '한 장씩 엎어 주고, 나머지는 가운데',
    d: '한 사람에 한 장씩 그림이 안 보이게 나눠요. 나머지 카드는 그림이 보이게 한 더미로 가운데에 쌓아요. 하나, 둘, 셋에 모두 내 카드를 뒤집어요.',
    art: table(60, 14, 360, 272) + dcard(244, 148, 44, A6) + dcard(240, 142, 44, A6) + dcard(240, 46, 26, [], { back: true }) + dcard(240, 254, 26, [], { back: true }) + dcard(112, 142, 26, [], { back: true }) + dcard(368, 142, 26, [], { back: true })
      + pill(240, 208, '가운데 (앞면)', { size: 13 }) + pill(368, 186, '각자 1장 (뒷면)', { size: 13, bg: C.pt }),
  },
  {
    k: '진행', t: '찾으면 외치고, 가운데 카드를 가져와요',
    d: '내 맨 위 카드와 가운데 카드에서 같은 그림을 찾아 이름을 말해요. 가장 먼저 말한 사람이 가운데 카드를 가져와 내 카드 위에 올려요. 차례 없이 모두 동시에 해요.',
    art: dcard(130, 118, 76, B6) + pill(130, 22, '가운데 카드', { size: 14 }) + dcard(340, 180, 76, ['leaf', 'drop', 'moon', 'fish', 'snail', 'mushroom']) + pill(340, 284, '내 카드', { size: 14, bg: C.pt })
      + ring(...dpos(130, 118, 76, 3).slice(0, 2), 25) + ring(...dpos(340, 180, 76, 3).slice(0, 2), 25)
      + bubble(410, 62, '물고기!', { size: 18, tail: 'bl' }) + arrow(206, 132, 262, 168, { bend: -10, w: 5 }),
  },
  {
    k: '이럴 땐', t: '크기와 방향이 달라도 같은 그림이에요',
    d: '같은 그림이 크게, 작게, 비스듬히 그려질 수 있어요. 모양이 같으면 같은 그림이에요. 이름은 조금 달라도 다들 알아들으면 인정해요.',
    art: dcard(130, 160, 90, ['drop', 'sun', 'star', 'leaf', 'moon', 'note'], { sizes: [1.35, 1, 1, 1, 1, 1], rots: [0, 0, 0, 0, 0, 0] }) + dcard(350, 160, 90, ['bolt', 'heart', 'drop', 'cloud', 'fish', 'flower'], { sizes: [1, 1, 0.8, 1, 1, 1], rots: [0, 0, 40, 0, 0, 0] })
      + ring(130, 160, 38) + ring(...dpos(350, 160, 90, 2).slice(0, 2), 22) + ok(240, 160, 18)
      + bubble(130, 36, '물방울!', { size: 16, tail: 'bl' }) + bubble(350, 36, '눈물!', { size: 16, tail: 'br' }),
  },
  {
    k: '끝', t: '카드를 가장 많이 모으면 이겨요',
    d: '가운데 카드가 다 떨어지면 끝나요. 모은 카드가 가장 많은 사람이 이겨요. 우물 방식은 반대로 내 카드를 먼저 다 내려놓은 사람이 이겨요.',
    art: [[110, 5], [240, 11], [370, 7]].map(([x, k], i) => {
      let s = '';
      for (let j = 0; j < k; j++) s += ell(x, 230 - j * 13, 52, 14, { fill: j === k - 1 ? C.paper : '#F4F5F7', stroke: C.ink, sw: 2 });
      return s + T(x, 268, ['가', '나', '다'][i], { size: 16, fill: C.muted });
    }).join('') + crown(240, 70, 1.5),
  },
];

// ---------- 루미큐브 ----------
const RK = { r: C.red, b: C.blue, k: C.black, y: '#E08A12' };
const rtile = (x, y, v, c, o = {}) => (v === 'J'
  ? card(x, y, { w: o.w || 40, h: o.h || 54, rx: 6, fill: C.cream, ...o, inner: (cx, cy, w, h) => circ(cx, cy - h * 0.06, w * 0.3, { fill: C.red, stroke: C.ink, sw: 1.6 }) + circ(cx - w * 0.1, cy - h * 0.1, 1.8, { fill: C.ink }) + circ(cx + w * 0.1, cy - h * 0.1, 1.8, { fill: C.ink }) + path(`M${cx - w * 0.12} ${cy}Q${cx} ${cy + h * 0.09} ${cx + w * 0.12} ${cy}`, { stroke: C.ink, sw: 1.6, cap: 'round' }) })
  : tile(x, y, v, RK[c], { w: o.w || 40, h: o.h || 54, ...o }));
const row = (x, y, list, o = {}) => list.map(([v, c], i) => rtile(x + i * ((o.w || 40) + (o.gap ?? 6)), y, v, c, o)).join('');
const rack = (x, y, w) => path(`M${x} ${y}H${x + w}L${x + w - 10} ${y + 20}H${x + 10}Z`, { fill: C.wood, stroke: C.ink, sw: 2.2 }) + line(x + 6, y + 7, x + w - 6, y + 7, { stroke: C.woodDark, sw: 2 });
const rummikub = [
  {
    k: '목표', t: '받침대의 타일을 먼저 다 내려놓아요',
    d: '타일을 묶음으로 만들어 바닥에 내려놓아요. 내 받침대를 가장 먼저 비운 사람이 이겨요.',
    art: row(40, 46, [[4, 'r'], [5, 'r'], [6, 'r']]) + row(274, 46, [[7, 'b'], [7, 'k'], [7, 'y']])
      + rack(110, 254, 260) + row(168, 202, [[2, 'b'], [9, 'k'], [12, 'r']]) + arrow(300, 196, 330, 116, { bend: 18 }) + arrow(180, 196, 120, 116, { bend: -18 })
      + pill(240, 150, '받침대가 비면 승리', { size: 15, bg: C.pt }),
  },
  {
    k: '준비', t: '14개씩 가져와 받침대에 세워요',
    d: '타일을 모두 뒤집어 섞고, 각자 14개를 가져와 남이 못 보게 받침대에 세워요. 남은 타일은 뒤집은 채 가운데 둬요.',
    art: [[60, 30], [104, 22], [150, 36], [196, 24], [242, 34], [288, 20], [334, 32], [380, 26], [82, 84], [128, 92], [176, 80], [222, 90], [268, 82], [314, 94], [360, 84]].map(([x, y], i) => card(x, y, { w: 36, h: 46, rx: 6, back: true, backFill: '#CDB892', rot: (i * 23) % 30 - 15 })).join('')
      + pill(240, 160, '뒤집어 섞어요', { size: 14 })
      + rack(28, 262, 424) + row(36, 216, [[1, 'r'], [3, 'b'], [3, 'y'], [4, 'k'], [5, 'r'], [6, 'b'], [7, 'y'], [8, 'r'], [9, 'k'], [10, 'b'], [11, 'y'], [12, 'k'], [13, 'r'], ['J', 'r']], { w: 26, h: 38, gap: 4, ns: 17 })
      + pill(420, 196, '14개', { size: 15, bg: C.pt }),
  },
  {
    k: '알기', t: '묶음은 두 가지예요: 런과 그룹',
    d: '런은 같은 색 숫자를 3개 이상 이어 놓은 것, 그룹은 같은 숫자를 서로 다른 색으로 3~4개 모은 거예요.',
    art: pill(58, 88, '런', { size: 18, bg: C.pt }) + row(100, 56, [[4, 'r'], [5, 'r'], [6, 'r']], { w: 46, h: 62 }) + T(352, 76, '같은 색', { size: 17 }) + T(352, 102, '이어지는 숫자', { size: 17 }) + ok(452, 88, 15)
      + line(30, 150, 450, 150, { stroke: C.line, sw: 2, dash: '5 6' })
      + pill(58, 214, '그룹', { size: 18 }) + row(100, 182, [[7, 'b'], [7, 'k'], [7, 'y']], { w: 46, h: 62 }) + T(352, 202, '같은 숫자', { size: 17 }) + T(352, 228, '다른 색', { size: 17 }) + ok(452, 214, 15),
  },
  {
    k: '처음', t: '처음 내려놓을 때는 합이 30 이상',
    d: '처음에는 내 타일만으로 합이 30 이상이 되게 내려놓아야 해요. 낼 수 없거나 내기 싫으면 타일을 1개 가져오고 차례를 마쳐요.',
    art: row(40, 50, [[10, 'r'], [11, 'r'], [12, 'r']], { w: 46, h: 62 }) + T(250, 80, '= 33', { size: 30, weight: 800 }) + ok(330, 80, 17)
      + row(40, 172, [[3, 'k'], [4, 'k'], [5, 'k']], { w: 46, h: 62 }) + T(250, 202, '= 12', { size: 30, weight: 800 }) + no(330, 202, 17)
      + card(388, 60, { w: 40, h: 54, rx: 6, back: true, backFill: '#CDB892' }) + arrow(408, 128, 408, 176, { w: 3.5 }) + T(408, 202, '모자라면', { size: 14 }) + T(408, 224, '1개 가져와요', { size: 14, fill: C.pt }),
  },
  {
    k: '진행', t: '바닥 묶음을 바꿔 끼워도 돼요',
    d: '처음 내려놓은 다음부터는 바닥 묶음을 나누고 옮길 수 있어요. 차례가 끝날 때 바닥의 묶음이 모두 3개 이상의 올바른 묶음이면 돼요.',
    art: pill(78, 22, '바닥', { size: 14 }) + row(40, 44, [[3, 'b'], [4, 'b'], [5, 'b']], { w: 44, h: 60 }) + rtile(190, 44, 6, 'b', { w: 44, h: 60, op: 0.3 }) + ok(214, 132, 14) + T(110, 132, '3개라 그대로 괜찮아요', { size: 13, fill: C.muted })
      + arrow(216, 112, 272, 200, { bend: 14 })
      + rtile(276, 190, 6, 'b', { w: 44, h: 60 }) + rtile(326, 190, 6, 'k', { w: 44, h: 60 }) + rtile(376, 190, 6, 'y', { w: 44, h: 60 })
      + pill(372, 168, '내 타일', { size: 13, bg: C.pt }) + box(268, 182, 162, 78) + ok(450, 222, 15),
  },
  {
    k: '끝', t: '남은 타일 숫자만큼 점수를 잃어요',
    d: '누군가 타일을 다 내려놓으면 바로 끝나요. 남은 타일 숫자를 더한 만큼 잃고, 조커는 30점이에요. 이긴 사람은 다른 사람들이 잃은 점수를 모두 받아요.',
    art: crown(80, 120, 1.4) + rack(24, 196, 112) + T(80, 252, '+47', { size: 28, weight: 800, fill: C.ok })
      + rack(184, 196, 112) + row(190, 148, [[3, 'r'], [8, 'b'], [1, 'k']], { w: 30, h: 44, gap: 4, ns: 20 }) + T(240, 252, '−12', { size: 28, weight: 800, fill: C.pt })
      + rack(344, 196, 112) + row(366, 148, [['J', 'r'], [5, 'y']], { w: 30, h: 44, gap: 4, ns: 20 }) + T(400, 252, '−35', { size: 28, weight: 800, fill: C.pt }) + T(400, 282, '조커 30 + 5', { size: 13, fill: C.muted }),
  },
];

// ---------- 젠가 ----------
// 탑 앞모습: 짝수 층은 긴 면 하나, 홀수 층은 블록 끝 세 개가 보여요.
function tower(x, yb, layers, o = {}) {
  const w = o.w || 66, lh = w / 5;
  const miss = o.miss || {};
  let s = '';
  for (let i = 0; i < layers; i++) {
    const y = yb - (i + 1) * lh;
    const top = i === layers - 1 && o.topCount;
    if (i % 2 === 0 && !top) s += rect(x, y, w, lh, { fill: C.wood, stroke: C.ink, sw: 1.6, rx: 2 });
    else {
      for (let j = 0; j < 3; j++) {
        if (top && j >= o.topCount) continue;
        const missing = miss[i] === j;
        s += rect(x + (j * w) / 3, y, w / 3, lh, { fill: missing ? '#6B5236' : C.wood, stroke: C.ink, sw: 1.6, rx: 2, op: missing ? 0.35 : undefined });
      }
    }
    if (o.pull === i) s += rect(x + w - 4, y + 1.5, o.pullDx || 44, lh - 3, { fill: '#F0D3A6', stroke: C.ink, sw: 1.6, rx: 2 });
  }
  return s;
}
const jenga = [
  {
    k: '목표', t: '탑을 무너뜨리는 사람이 져요',
    d: '돌아가며 블록을 하나씩 빼서 맨 위에 올려요. 탑이 점점 높고 불안해져요. 무너뜨린 사람이 지고, 나머지는 모두 이겨요.',
    art: tower(170, 286, 17, { w: 70, pull: 8, pullDx: 52 }) + point(298, 286 - 8.5 * 14 + 0, { rot: 180, s: 1.05 }) + arrow(318, 164, 392, 164, { w: 4 })
      + motion(205, 50, 34, 200, 230, { count: 2, len: 10 }) + motion(205, 50, 34, -50, -20, { count: 2, len: 10 }) + T(400, 80, '살살…', { size: 20, fill: C.muted }),
  },
  {
    k: '준비', t: '3개씩 엇갈려 18층으로 쌓아요',
    d: '블록을 3개씩 나란히 놓고, 층마다 방향을 엇갈려 18층으로 쌓아요. 틀이 있으면 틀로 반듯하게 세운 뒤 빼요.',
    art: tower(56, 288, 18, { w: 66 }) + path('M136 50H146V288H136', { stroke: C.pt, sw: 3 }) + T(170, 169, '18층', { size: 18, fill: C.pt })
      + [0, 1, 2].map((i) => rect(226, 66 + i * 30, 96, 26, { fill: C.wood, stroke: C.ink, sw: 2, rx: 3 })).join('') + T(274, 44, '한 층에 3개', { size: 15 })
      + arrow(332, 108, 362, 108, { w: 3.5 })
      + [0, 1, 2].map((i) => rect(370 + i * 30, 60, 26, 96, { fill: C.wood, stroke: C.ink, sw: 2, rx: 3 })).join('') + T(414, 44, '다음 층은 엇갈려', { size: 15 })
      + T(320, 200, '위에서 본 모습', { size: 14, fill: C.muted }),
  },
  {
    k: '내 차례', t: '한 손으로 빼서 맨 위에 올려요',
    d: '맨 윗층을 뺀 아래층에서 블록 하나를 한 손으로 빼요. 뺀 블록은 맨 위에 엇갈리게 올려요. 탑이 잠시 버티면 다음 사람 차례예요.',
    art: tower(170, 288, 14, { w: 70, miss: { 5: 1 } }) + rect(170 + 140 / 3, 288 - 15 * 14 - 8, 70 / 3, 14, { fill: '#F0D3A6', stroke: C.ink, sw: 1.6, rx: 2 })
      + arrow(252, 208, 252, 86, { bend: -34 }) + badge(268, 238, 1) + badge(150, 62, 2)
      + hand(318, 214, { rot: -70, s: 0.85 }) + pill(384, 260, '한 손으로만', { size: 15, bg: C.pt }) + T(108, 62, '맨 위에', { size: 15 }),
  },
  {
    k: '이럴 땐', t: '맨 윗층은 뺄 수 없어요',
    d: '맨 윗층이 3개로 다 차기 전에는 맨 윗층과 그 바로 아래층에서 빼면 안 돼요. 새 층은 맨 윗층이 다 찬 뒤에 시작해요.',
    art: tower(120, 286, 7, { w: 130, topCount: 2 })
      + no(296, 286 - 6.5 * 26, 15) + T(370, 286 - 6.5 * 26, '덜 찬 맨 윗층', { size: 15 })
      + no(296, 286 - 5.5 * 26, 15) + T(366, 286 - 5.5 * 26, '그 바로 아래층', { size: 15 })
      + ok(296, 286 - 3.5 * 26, 15) + T(358, 286 - 3.5 * 26, '여기부터 OK', { size: 15 })
      + path(`M268 ${286 - 7 * 26}V${286 - 5 * 26}`, { stroke: C.pt, sw: 3 }) + path(`M268 ${286 - 5 * 26 + 6}V286`, { stroke: C.ok, sw: 3 }),
  },
  {
    k: '끝', t: '블록이 떨어지면 끝나요',
    d: '탑이 무너지거나, 빼는 블록 말고 다른 블록이 하나라도 떨어지면 끝나요. 그 차례 사람이 져요.',
    art: g(tower(200, 288, 11, { w: 70 }), { rot: 16, cx: 235, cy: 288 })
      + g(rect(0, 0, 70, 14, { fill: C.wood, stroke: C.ink, sw: 1.6, rx: 2 }), { x: 320, y: 70, rot: 35 }) + g(rect(0, 0, 70, 14, { fill: C.wood, stroke: C.ink, sw: 1.6, rx: 2 }), { x: 370, y: 150, rot: -20 }) + g(rect(0, 0, 23, 14, { fill: C.wood, stroke: C.ink, sw: 1.6, rx: 2 }), { x: 340, y: 250, rot: 10 })
      + motion(330, 120, 40, -100, -40, { count: 3 }) + line(40, 289, 440, 289, { stroke: C.line, sw: 3 }) + T(100, 120, '와르르', { size: 22, weight: 800, fill: C.pt }),
  },
];

// ---------- 우노 ----------
const UC = { r: C.red, y: C.yellow, g: C.green, b: C.blue };
function ucard(x, y, type, color, o = {}) {
  const w = o.w || 56, h = o.h || 82;
  if (type === 'wild' || type === '+4') {
    return card(x, y, { ...o, w, h, fill: '#2A2F3A', inner: (cx, cy) => [[C.red, -1, -1], [C.blue, 1, -1], [C.yellow, -1, 1], [C.green, 1, 1]].map(([c, a, b]) => rect(cx + (a < 0 ? -w * 0.28 : 0), cy + (b < 0 ? -h * 0.2 : 0), w * 0.28, h * 0.2, { fill: c })).join('') + (type === '+4' ? T(cx, cy + h * 0.33, '+4', { size: w * 0.3, weight: 800, fill: '#fff' }) : '') });
  }
  const inner = (cx, cy) => {
    const r = w * 0.22;
    if (type === 'skip') return circ(cx, cy, r, { stroke: '#fff', sw: 4 }) + line(cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy - r * 0.7, { stroke: '#fff', sw: 4 });
    if (type === 'rev') return path(`M${cx - r} ${cy + 2}A${r} ${r} 0 0 1 ${cx + r * 0.6} ${cy - r * 0.8}`, { stroke: '#fff', sw: 4, cap: 'round' }) + poly([[cx + r * 0.95, cy - r * 1.1], [cx + r * 0.3, cy - r * 1.3], [cx + r * 0.7, cy - r * 0.35]], { fill: '#fff' })
      + path(`M${cx + r} ${cy - 2}A${r} ${r} 0 0 1 ${cx - r * 0.6} ${cy + r * 0.8}`, { stroke: '#fff', sw: 4, cap: 'round' }) + poly([[cx - r * 0.95, cy + r * 1.1], [cx - r * 0.3, cy + r * 1.3], [cx - r * 0.7, cy + r * 0.35]], { fill: '#fff' });
    return T(cx, cy, type, { size: type.length > 1 ? w * 0.4 : w * 0.58, weight: 800, fill: '#fff' });
  };
  return card(x, y, { ...o, w, h, fill: UC[color], inner: (cx, cy) => rect(cx - w * 0.33, cy - h * 0.36, w * 0.66, h * 0.72, { fill: '#fff', rx: 7, op: 0.2 }) + inner(cx, cy) });
}
const fan = (cx, cy, list, o = {}) => list.map(([t, c], i) => {
  const a = (i - (list.length - 1) / 2) * (o.step || 9);
  return g(ucard(cx - 28, cy - 41, t, c, { back: o.back }), { rot: a, cx, cy: cy + 160 });
}).join('');
const uno = [
  {
    k: '목표', t: '손에 든 카드를 먼저 다 내요',
    d: '7장씩 받아 시작해요. 내 차례마다 한 장씩 내서 손에 든 카드를 가장 먼저 다 내면 이겨요.',
    art: ucard(212, 22, '7', 'r') + fan(240, 210, [['2', 'b'], ['5', 'g'], ['skip', 'y'], ['9', 'r'], ['+2', 'b'], ['wild'], ['4', 'y']])
      + arrow(240, 160, 240, 116, { w: 4 }) + pill(80, 250, '처음엔 7장', { size: 14 }) + crown(400, 74, 1.2) + T(400, 116, '0장이면 승리', { size: 15 }),
  },
  {
    k: '내 차례', t: '색이나 숫자가 같으면 낼 수 있어요',
    d: '버린 더미 맨 위 카드와 색, 숫자, 기호 중 하나가 같으면 내요. 와일드는 언제든 내고 다음 색을 정해요.',
    art: pill(70, 54, '맨 위', { size: 14 }) + ucard(36, 76, '7', 'r', { w: 68, h: 98 })
      + ucard(150, 86, '2', 'r') + ucard(228, 86, '7', 'g') + ucard(306, 86, '3', 'b') + ucard(384, 86, 'wild')
      + ok(178, 200, 15) + ok(256, 200, 15) + no(334, 200, 15) + ok(412, 200, 15)
      + T(178, 234, '같은 색', { size: 14 }) + T(256, 234, '같은 숫자', { size: 14 }) + T(334, 234, '다 달라요', { size: 14 }) + T(412, 234, '언제든', { size: 14 }),
  },
  {
    k: '내 차례', t: '낼 카드가 없으면 1장 가져와요',
    d: '낼 카드가 없으면 더미에서 1장을 가져와요. 가져온 카드를 낼 수 있으면 바로 내도 돼요.',
    art: pill(86, 46, '더미', { size: 14 }) + pile(58, 74, { w: 56, h: 82, back: true, count: 4 })
      + arrow(128, 118, 194, 118, { w: 4 }) + ucard(206, 76, '5', 'b') + pill(234, 190, '1장 가져오기', { size: 14, bg: C.pt })
      + arrow(274, 118, 344, 118, { w: 4, dash: '7 6' }) + ucard(356, 76, '9', 'b') + pill(384, 46, '맨 위', { size: 14 }) + T(384, 190, '같은 파랑이면', { size: 14 }) + T(384, 212, '바로 내요', { size: 14 }),
  },
  {
    k: '알기', t: '기술 카드 세 가지',
    d: '스킵은 다음 사람을 건너뛰고, 리버스는 도는 방향을 바꿔요. 드로우 투를 받은 사람은 2장을 가져오고 차례를 쉬어요.',
    art: ucard(52, 24, 'skip', 'b', { w: 52, h: 76 }) + ucard(214, 24, 'rev', 'g', { w: 52, h: 76 }) + ucard(376, 24, '+2', 'r', { w: 52, h: 76 })
      + pill(78, 124, '스킵', { size: 14 }) + pill(240, 124, '리버스', { size: 14 }) + pill(402, 124, '드로우 투', { size: 14 })
      + person(30, 210, { s: 0.6 }) + person(78, 210, { s: 0.6, fill: C.line }) + person(126, 210, { s: 0.6 }) + arrow(36, 182, 120, 182, { bend: 18, w: 3 }) + no(78, 248, 11)
      + person(192, 210, { s: 0.6 }) + person(240, 210, { s: 0.6, fill: C.ptTint }) + person(288, 210, { s: 0.6 }) + arrow(252, 176, 284, 176, { c: C.line, w: 3, head: 10 }) + arrow(228, 176, 196, 176, { w: 3.5, head: 11 }) + T(240, 262, '방향 바꾸기', { size: 13, fill: C.muted })
      + person(380, 210, { s: 0.6 }) + card(414, 180, { w: 20, h: 28, back: true, rot: -8 }) + card(428, 188, { w: 20, h: 28, back: true, rot: 8 }) + T(402, 262, '2장 받고 쉬어요', { size: 13, fill: C.muted }),
  },
  {
    k: '이럴 땐', t: '1장 남으면 “우노!”',
    d: '끝에서 두 번째 카드를 낼 때 “우노”라고 외쳐요. 외치지 않았는데 다음 사람이 차례를 시작하기 전에 들키면 2장을 가져와요.',
    art: person(110, 200, { s: 1.4, fill: C.ptTint }) + bubble(150, 72, '우노!', { size: 26, tail: 'bl' })
      + ucard(176, 176, '2', 'g', { rot: -10 }) + ucard(212, 168, '4', 'y', { rot: 6 }) + ucard(340, 110, '8', 'y') + arrow(274, 186, 334, 160, { bend: 10 })
      + pill(358, 262, '안 외치고 들키면 +2장', { size: 14, bg: C.pt }),
  },
  {
    k: '끝', t: '이긴 사람이 남은 카드 점수를 받아요',
    d: '한 판이 끝나면 이긴 사람이 다른 사람들 손에 남은 카드 점수를 모두 받아요. 먼저 500점을 넘긴 사람이 최종 우승이에요. 짧게 하려면 한 판으로 끝내도 돼요.',
    art: ucard(46, 40, '7', 'g', { w: 60, h: 88 }) + ucard(186, 40, 'skip', 'r', { w: 60, h: 88 }) + ucard(326, 40, 'wild', '', { w: 60, h: 88 })
      + T(76, 168, '7점', { size: 24, weight: 800 }) + T(216, 168, '20점', { size: 24, weight: 800 }) + T(356, 168, '50점', { size: 24, weight: 800 })
      + T(76, 196, '숫자만큼', { size: 13, fill: C.muted }) + T(216, 196, '스킵, 리버스, +2', { size: 13, fill: C.muted }) + T(356, 196, '와일드 두 종류', { size: 13, fill: C.muted })
      + pill(240, 254, '500점 먼저 넘기면 최종 우승', { size: 15, bg: C.pt }),
  },
];

// ---------- 다빈치 코드 ----------
function dtile(x, y, col, v, o = {}) {
  const w = o.w || 40, h = o.h || 58;
  const fill = col === 'b' ? '#262A33' : C.paper, fg = col === 'b' ? '#fff' : C.ink;
  if (o.open) {
    const hh = h * 0.6;
    return rect(x, y + h - hh + 3, w, hh, { fill: C.ink, rx: 5 }) + rect(x, y + h - hh, w, hh, { fill, stroke: C.ink, sw: 2.2, rx: 5 }) + T(x + w / 2, y + h - hh / 2, v, { size: hh * 0.55, weight: 800, fill: o.hot ? C.pt : fg });
  }
  return card(x, y, { w, h, rx: 5, fill, inner: (cx, cy) => (v !== '' && v !== undefined ? T(cx, cy, v, { size: h * 0.42, weight: 800, fill: fg }) : '') + (o.mark ? T(cx, cy, '?', { size: h * 0.42, weight: 800, fill: col === 'b' ? '#fff' : C.muted, op: 0.6 }) : '') });
}
const drow = (x, y, list, o = {}) => list.map(([c, v, op], i) => dtile(x + i * ((o.w || 40) + (o.gap ?? 10)), y, c, v, { ...o, open: op === 'open' })).join('');
const davinci = [
  {
    k: '목표', t: '상대가 숨긴 숫자를 맞혀요',
    d: '타일 색은 보이지만 숫자는 숨겨져 있어요. 상대 타일을 가리키며 숫자를 말해 맞혀요. 내 숨긴 타일이 마지막까지 남으면 이겨요.',
    art: pill(52, 92, '상대 줄', { size: 14 }) + drow(110, 52, [['b', ''], ['w', ''], ['b', '6', 'open'], ['w', ''], ['b', '']], { w: 46, h: 68 })
      + ring(110 + 56 + 23, 86, 40) + point(189, 172, { rot: -90, s: 1.1 })
      + person(250, 262, { s: 1, fill: C.ptTint }) + bubble(340, 216, '3!', { size: 24, tail: 'bl' }),
  },
  {
    k: '준비', t: '작은 숫자부터 왼쪽에 세워요',
    d: '2~3명이면 4개, 4명이면 3개씩 가져와 왼쪽부터 작은 숫자 순서로 세워요. 같은 숫자라면 검은색을 왼쪽에 둬요.',
    art: T(240, 32, '내 줄 (나만 숫자가 보여요)', { size: 15, fill: C.muted }) + drow(92, 62, [['b', 1], ['w', 1], ['b', 4], ['w', 7]], { w: 56, h: 82, gap: 18 })
      + arrow(96, 182, 384, 182, { w: 4 }) + T(240, 206, '작은 수에서 큰 수로', { size: 16 })
      + box(84, 54, 146, 104) + pill(170, 262, '같은 숫자면 검은색이 왼쪽', { size: 14, bg: C.pt }),
  },
  {
    k: '내 차례', t: '가져와서, 가리키고, 말해요',
    d: '가운데에서 타일 1개를 가져와 나만 봐요. 그다음 상대 타일 하나를 가리키며 숫자를 말해요. 색은 보이니까 숫자만 말하면 돼요.',
    art: [[24, 34, 'b'], [64, 28, 'w'], [102, 40, 'b'], [44, 84, 'w'], [86, 92, 'w'], [124, 80, 'b']].map(([x, y, c], i) => g(dtile(x, y, c, '', { w: 32, h: 46 }), { rot: (i * 29) % 40 - 20, cx: x + 16, cy: y + 23 })).join('')
      + arrow(90, 150, 90, 192, { w: 3.5 }) + badge(116, 170, 1) + dtile(70, 200, 'w', 9, { w: 40, h: 58 }) + T(150, 230, '나만 봐요', { size: 14, fill: C.muted })
      + drow(250, 30, [['b', ''], ['w', ''], ['b', ''], ['w', '']], { w: 40, h: 58, gap: 10 }) + point(320, 132, { rot: -90 }) + badge(352, 132, 2)
      + bubble(380, 214, '5!', { size: 24, tail: 'bl' }) + badge(430, 186, 3),
  },
  {
    k: '맞혔을 때', t: '맞히면 공개, 더 할지 멈출지 골라요',
    d: '맞히면 그 타일이 눕혀져 숫자가 공개돼요. 계속 맞혀도 되고, 멈추면 가져온 타일을 숨긴 채 내 줄의 맞는 자리에 넣어요.',
    art: drow(120, 20, [['b', ''], ['w', '5', 'open'], ['b', ''], ['w', '']], { w: 46, h: 66 }) + ok(214, 112, 15)
      + rect(30, 144, 196, 130, { fill: C.paper, stroke: C.ink, sw: 2, rx: 16 }) + T(128, 172, '계속 맞히기', { size: 17 }) + arrow(92, 216, 164, 216, { bend: 22, w: 3.5 }) + T(128, 230, '하나 더 말해요', { size: 14 }) + T(128, 256, '틀리면 손해가 커요', { size: 13, fill: C.muted })
      + rect(254, 144, 196, 130, { fill: C.paper, stroke: C.ink, sw: 2, rx: 16 }) + T(352, 172, '멈추기', { size: 17 }) + drow(290, 196, [['b', 2], ['w', 6], ['b', 8]], { w: 28, h: 40, gap: 6, ns: 18 }) + dtile(398, 186, 'w', 9, { w: 28, h: 40 }) + arrow(410, 232, 376, 238, { w: 3, head: 10, bend: -8 }) + T(352, 258, '가져온 타일을 숨겨 넣어요', { size: 12, fill: C.muted }),
  },
  {
    k: '틀렸을 때', t: '틀리면 가져온 타일이 공개돼요',
    d: '틀리면 방금 가져온 타일을 숫자가 보이게 눕혀 내 줄의 맞는 자리에 넣어요. 상대에게 큰 단서가 되니 신중하게 말해요.',
    art: bubble(120, 54, '4!', { size: 24, tail: 'bl' }) + no(178, 54, 16) + drow(260, 30, [['b', ''], ['w', ''], ['b', '']], { w: 40, h: 58 })
      + T(60, 200, '내 줄', { size: 15, fill: C.muted }) + drow(96, 160, [['b', 2], ['w', 5]], { w: 52, h: 76, gap: 14 }) + dtile(230, 160, 'w', 9, { w: 52, h: 76, open: true, hot: true }) + dtile(296, 160, 'b', 10, { w: 52, h: 76 })
      + arrow(256, 108, 256, 176, { w: 3.5, dash: '6 5' }) + pill(370, 268, '숫자가 보이게 눕혀요', { size: 14, bg: C.pt }),
  },
  {
    k: '예시', t: '양옆 숫자로 범위를 좁혀요',
    d: '검은 2와 흰 5 사이에 숨은 흰 타일이 있다면 흰 2, 3, 4 가운데 하나예요. 이미 공개된 숫자를 지우면 범위가 더 좁아져요.',
    art: dtile(110, 40, 'b', 2, { w: 64, h: 92, open: true }) + dtile(208, 40, 'w', '', { w: 64, h: 92, mark: true }) + dtile(306, 40, 'w', 5, { w: 64, h: 92, open: true })
      + box(200, 32, 80, 110) + arrow(240, 150, 240, 186, { w: 3.5 })
      + pill(168, 222, '흰 2', { size: 18, bg: C.paper, fg: C.ink, stroke: C.ink }) + pill(240, 222, '흰 3', { size: 18, bg: C.paper, fg: C.ink, stroke: C.ink }) + pill(312, 222, '흰 4', { size: 18, bg: C.paper, fg: C.ink, stroke: C.ink })
      + T(240, 268, '셋 중 하나', { size: 15, fill: C.muted }),
  },
];

// ---------- 치킨차차 ----------
function chicken(cx, cy, o = {}) {
  const { s = 1, body = C.paper, feathers = [] } = o;
  const tail = feathers.map((c, i) => g(ell(0, -12, 4.5, 12, { fill: c, stroke: C.ink, sw: 1.6 }), { x: -13, y: -2, rot: -70 + i * 22 })).join('');
  const shapes = [(a) => ell(0, 0, 15, 12, a), (a) => circ(11, -12, 7.5, a)];
  const comb = path('M7 -19Q8 -25 11 -21Q13 -26 15 -20Q18 -23 18 -17', { fill: C.red, stroke: C.ink, sw: 1.5 });
  const beak = poly([[18, -14], [25, -11], [18, -8]], { fill: C.orange, stroke: C.ink, sw: 1.4 });
  const legs = path('M-3 11V18M4 11V18', { stroke: C.orange, sw: 2.6, cap: 'round' });
  const inner = tail + legs + comb + blob(shapes, body, 2) + beak + circ(13, -13, 1.6, { fill: C.ink }) + path('M-7 -1Q-1 5 6 0', { stroke: C.ink, sw: 1.6, cap: 'round' });
  return g(inner, { x: cx, y: cy, s });
}
const egg = (cx, cy, kind, o = {}) => ell(cx, cy + 3, o.rx || 26, o.ry || 32, { fill: C.ink }) + ell(cx, cy, o.rx || 26, o.ry || 32, { fill: o.fill || '#FFF3D6', stroke: C.ink, sw: 2.2 }) + (kind ? sym(kind, cx, cy, (o.rx || 26) * 0.6) : '');
const chickencha = [
  {
    k: '목표', t: '앞 닭을 따라잡아 깃털을 모아요',
    d: '기억력으로 내 닭을 한 칸씩 앞으로 보내요. 앞 닭을 뛰어넘으면 그 닭의 꼬리 깃털을 가져와요. 깃털 4개를 모두 모으면 이겨요.',
    art: ['star', 'fish', 'leaf', 'flower', 'drop', 'moon'].map((k, i) => egg(50 + i * 76, 220, k, { rx: 28, ry: 34 })).join('')
      + chicken(126, 176, { s: 1.6, body: C.ptTint, feathers: [C.red] }) + chicken(202, 176, { s: 1.6, body: '#E6EEF9', feathers: [C.blue, C.green] })
      + arrow(150, 132, 274, 160, { bend: 50, w: 4 }) + pill(380, 46, '깃털 4개면 승리', { size: 15, bg: C.pt }),
  },
  {
    k: '준비', t: '달걀 길을 두르고, 팔각 타일은 엎어요',
    d: '달걀 타일을 그림이 보이게 둥글게 이어 경주 길을 만들어요. 팔각형 타일 12개는 그림이 안 보이게 섞어 안쪽에 흩어 놓아요. 닭은 같은 간격으로 세워요.',
    art: Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return egg(240 + Math.cos(a) * 196, 150 + Math.sin(a) * 112, ['star', 'fish', 'leaf', 'flower', 'drop', 'moon', 'heart', 'mushroom', 'cloud'][i % 9], { rx: 17, ry: 21 }); }).join('')
      + [[170, 118], [222, 104], [276, 116], [320, 140], [190, 168], [248, 158], [296, 188], [160, 194], [232, 204]].map(([x, y]) => octagon(x, y, 19, { back: true })).join('')
      + chicken(436, 140, { s: 1, body: C.ptTint, feathers: [C.red] }) + chicken(44, 140, { s: 1, body: '#E6EEF9', feathers: [C.blue] }),
  },
  {
    k: '내 차례', t: '바로 앞 칸과 같은 그림을 찾아요',
    d: '가운데 팔각 타일 하나를 뒤집어요. 내 닭 바로 앞 달걀과 그림이 같으면 닭을 한 칸 옮기고, 또 뒤집을 수 있어요.',
    art: egg(80, 110, 'star', { rx: 36, ry: 44 }) + egg(184, 110, 'fish', { rx: 36, ry: 44 }) + egg(288, 110, 'leaf', { rx: 36, ry: 44 }) + egg(392, 110, 'moon', { rx: 36, ry: 44 })
      + chicken(80, 92, { s: 1.6, body: C.ptTint, feathers: [C.red] }) + ring(184, 110, 52)
      + arrow(108, 50, 176, 52, { bend: 22 }) + octagon(184, 236, 34, { sym: 'fish' }) + ok(236, 214, 15) + pill(330, 236, '맞으면 또 뒤집어요', { size: 14, bg: C.pt }),
  },
  {
    k: '이럴 땐', t: '틀리면 차례 끝, 모두 다시 엎어요',
    d: '그림이 다르면 차례가 끝나요. 이번 차례에 뒤집었던 타일은 자리를 바꾸지 말고 모두 다시 엎어 둬요.',
    art: egg(80, 84, 'star', { rx: 30, ry: 36 }) + egg(170, 84, 'fish', { rx: 30, ry: 36 }) + chicken(80, 70, { s: 1.3, body: C.ptTint, feathers: [C.red] }) + ring(170, 84, 44)
      + octagon(170, 214, 34, { sym: 'flower' }) + no(222, 192, 15)
      + octagon(332, 104, 30, { sym: 'leaf' }) + arrow(332, 144, 332, 184, { w: 3.5 }) + octagon(332, 224, 30, { back: true }) + pill(410, 160, '다시 엎기', { size: 14, bg: C.pt }) + T(332, 280, '자리는 그대로', { size: 13, fill: C.muted }),
  },
  {
    k: '예시', t: '앞 닭을 뛰어넘으면 깃털을 빼앗아요',
    d: '바로 앞 칸에 다른 닭이 있으면 그 닭 다음 칸의 그림을 찾아야 해요. 찾으면 뛰어넘고 그 닭의 꼬리 깃털을 모두 가져와요.',
    art: egg(70, 140, 'star', { rx: 32, ry: 40 }) + egg(170, 140, 'fish', { rx: 32, ry: 40 }) + egg(270, 140, 'leaf', { rx: 32, ry: 40 }) + egg(370, 140, 'moon', { rx: 32, ry: 40 })
      + chicken(70, 124, { s: 1.5, body: C.ptTint, feathers: [C.red] }) + chicken(170, 124, { s: 1.5, body: '#E6EEF9', feathers: [C.blue, C.green] }) + ring(270, 140, 48)
      + arrow(92, 80, 262, 92, { bend: 52, w: 4 }) + octagon(270, 252, 28, { sym: 'leaf' }) + ok(314, 236, 14)
      + pill(380, 44, '깃털 모두 가져와요', { size: 13, bg: C.pt }),
  },
  {
    k: '끝', t: '깃털 4개를 모두 모으면 이겨요',
    d: '한 사람이 깃털 4개를 모두 모으면 끝나요. 깃털을 잃은 닭도 끝까지 달리고, 다시 앞지르면 깃털을 되찾을 수 있어요.',
    art: chicken(240, 190, { s: 3, body: C.ptTint, feathers: [C.red, C.blue, C.green, C.yellow] }) + crown(262, 92, 1.4) + T(240, 270, '깃털 4개!', { size: 20, weight: 800, fill: C.pt }),
  },
];

// ---------- 해적 룰렛 ----------
const barrel = (cx, cy, s = 1, o = {}) => {
  const holes = [[-30, -24], [-10, -26], [10, -26], [30, -24], [-34, 0], [-12, 0], [12, 0], [34, 0], [-30, 24], [-10, 26], [10, 26], [30, 24]];
  const filled = o.filled || [];
  const sw = (x, y, c) => rect(x - 3, y - 12, 6, 12, { fill: c, stroke: C.ink, sw: 1.4, rx: 2 }) + rect(x - 6, y - 1, 12, 4, { fill: '#9AA1AD', stroke: C.ink, sw: 1.2, rx: 1.5 });
  return g(path('M-48 -50Q-62 0 -48 50H48Q62 0 48 -50Z', { fill: '#C98A4E', stroke: C.ink, sw: 2.4 }) + path('M-55 -34Q0 -28 55 -34M-55 34Q0 40 55 34', { stroke: '#8A5A2E', sw: 4 })
    + ell(0, -50, 48, 9, { fill: '#8A5A2E', stroke: C.ink, sw: 2.2 })
    + holes.map(([x, y], i) => (filled[i] ? '' : rect(x - 5, y - 2.5, 10, 5, { fill: C.ink, rx: 2 }))).join('')
    + holes.map(([x, y], i) => (filled[i] ? sw(x, y, filled[i]) : '')).join(''), { x: cx, y: cy, s });
};
const pirate = (cx, cy, s = 1) => g(circ(0, 0, 16, { fill: C.skin, stroke: C.ink, sw: 2.2 }) + path('M-16 -3C-16 -16 16 -16 16 -3Z', { fill: C.red, stroke: C.ink, sw: 2 }) + circ(-5, 2, 1.8, { fill: C.ink }) + rect(1, -1, 8, 6, { fill: C.ink, rx: 2 }) + line(-14, -3, 15, 3, { stroke: C.ink, sw: 1.4 }) + path('M-7 9Q0 6 7 9', { stroke: C.ink, sw: 2.2, cap: 'round' }), { x: cx, y: cy, s });
const sword = (x, y, c, rot = 0, s = 1) => g(rect(-3, -40, 6, 34, { fill: C.silver, stroke: C.ink, sw: 1.5, rx: 2 }) + rect(-8, -7, 16, 5, { fill: '#9AA1AD', stroke: C.ink, sw: 1.4, rx: 2 }) + rect(-3.5, -2, 7, 16, { fill: c, stroke: C.ink, sw: 1.5, rx: 2.5 }), { x, y, rot, s });
const popup = [
  {
    k: '목표', t: '해적을 튀어 오르게 하면 져요',
    d: '돌아가며 통에 칼을 하나씩 꽂아요. 해적을 튀어 오르게 한 사람이 져요. 반대로 이긴 걸로 하는 집도 있으니 시작 전에 정해요.',
    art: barrel(240, 210, 1.6, { filled: [C.red, '', C.blue, '', C.green, C.yellow, '', '', '', C.red, '', C.blue] }) + pirate(240, 64, 1.7)
      + motion(240, 64, 36, 150, 210, { count: 3 }) + motion(240, 64, 36, -30, 30, { count: 3 }) + path('M228 112V96M252 112V96', { stroke: C.ink, sw: 3, cap: 'round', dash: '4 5' })
      + pill(400, 236, '튀어 오르면 끝', { size: 15, bg: C.pt }),
  },
  {
    k: '준비', t: '해적을 끼우고 칼을 나눠 가져요',
    d: '칼을 모두 빼고 해적을 통 위 구멍에 끼워 눌러요. 딸깍 걸리면 준비 끝이에요. 칼은 사람 수에 맞게 똑같이 나눠 가져요.',
    art: barrel(130, 196, 1.3) + pirate(130, 110, 1.2) + arrow(130, 34, 130, 82, { w: 4 }) + T(184, 60, '딸깍', { size: 18, fill: C.pt })
      + [[300, C.red], [370, C.blue], [440, C.green]].map(([x, c]) => sword(x - 12, 150, c, -8, 0.9) + sword(x, 152, c, 0, 0.9) + sword(x + 12, 150, c, 8, 0.9) + person(x, 222, { s: 0.75 })).join('')
      + T(370, 290, '똑같이 나눠요', { size: 14, fill: C.muted }),
  },
  {
    k: '내 차례', t: '빈 구멍에 칼을 하나 꽂아요',
    d: '내 차례에 빈 구멍 아무 데나 칼 하나를 끝까지 꽂아요. 이미 칼이 꽂힌 구멍에는 꽂을 수 없어요.',
    art: barrel(196, 168, 2.1, { filled: ['', C.red, '', '', C.blue, '', '', '', '', C.green, '', ''] })
      + sword(420, 168, C.yellow, -90, 1.5) + arrow(352, 168, 280, 168, { w: 4 }) + ok(300, 136, 14)
      + no(196 - 10 * 2.1 + 16, 168 - 26 * 2.1 - 14, 14) + T(400, 222, '끝까지 밀어 넣어요', { size: 14, fill: C.muted }),
  },
  {
    k: '진행', t: '해적이 그대로면 다음 사람 차례',
    d: '칼을 꽂아도 해적이 그대로면 다음 사람에게 차례가 넘어가요. 해적이 튀어 오르는 순간 그 자리에서 끝나요.',
    art: barrel(240, 170, 1.2, { filled: [C.red, '', C.blue, '', '', C.yellow, '', '', '', '', '', ''] }) + pirate(240, 98, 1)
      + person(240, 34, { s: 0.75 }) + person(380, 220, { s: 0.75 }) + person(100, 220, { s: 0.75, fill: C.ptTint })
      + arrow(112, 186, 210, 40, { bend: -40 }) + arrow(270, 40, 370, 186, { bend: -40 }) + pill(240, 272, '다음 사람 차례', { size: 14, bg: C.pt }),
  },
];

// ---------- 블로커스 ----------
const BC = { b: C.blue, y: C.yellow, r: C.red, g: C.green };
const bpiece = (x, y, cell, list, col) => cells(x, y, cell, list, BC[col], { inset: 0.8, sw: 1.4, rx: 2 });
// 모서리에서 꼭짓점으로만 이어지게 놓은 조각 네 개
const START = [[[0, 0], [1, 0], [1, 1]], [[2, 2], [3, 2], [3, 3], [3, 4]], [[4, 5], [5, 5], [5, 6], [6, 6]], [[2, 5], [2, 6], [1, 6], [1, 7]]];
const blokus = [
  {
    k: '목표', t: '내 조각을 가장 많이 놓아요',
    d: '네 사람이 각자 판의 모서리에서 출발해 조각을 넓혀 가요. 끝났을 때 조각을 가장 많이 놓은 사람이 이겨요.',
    art: grid(120, 30, 20, 20, 12, { fill: C.paper, stroke: C.line2, sw: 1 })
      + [['b', (c, r) => [c, r]], ['y', (c, r) => [19 - c, r]], ['r', (c, r) => [19 - c, 19 - r]], ['g', (c, r) => [c, 19 - r]]].map(([col, f]) => START.map((pc) => bpiece(120, 30, 12, pc.map(([c, r]) => f(c, r)), col)).join('')).join(''),
  },
  {
    k: '준비', t: '첫 조각은 내 모서리 칸을 덮어요',
    d: '각자 색을 하나 고르고 조각 21개를 가져가요. 파랑, 노랑, 빨강, 초록 순서로 해요. 첫 조각은 판의 내 쪽 모서리 칸을 덮게 놓아요.',
    art: grid(150, 40, 20, 20, 11, { fill: C.paper, stroke: C.line2, sw: 1 })
      + bpiece(150, 40, 11, [[0, 0], [0, 1], [1, 1]], 'b') + bpiece(150, 40, 11, [[19, 0], [18, 0], [17, 0]], 'y') + bpiece(150, 40, 11, [[19, 19], [18, 19], [19, 18], [18, 18]], 'r') + bpiece(150, 40, 11, [[0, 19], [0, 18], [1, 19]], 'g')
      + ring(156, 46, 16) + ring(364, 46, 16) + ring(364, 254, 16) + ring(156, 254, 16)
      + bpiece(24, 60, 14, [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], 'b') + bpiece(24, 90, 14, [[0, 0], [1, 0], [1, 1], [2, 1]], 'b') + bpiece(24, 128, 14, [[0, 0], [1, 0], [0, 1], [1, 1]], 'b') + bpiece(24, 166, 14, [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], 'b') + bpiece(24, 214, 14, [[0, 0]], 'b')
      + T(66, 262, '21개', { size: 16, fill: C.blue }),
  },
  {
    k: '놓기', t: '내 조각과 꼭짓점끼리 닿아야 해요',
    d: '새 조각은 이미 놓인 내 조각과 꼭짓점이 하나 이상 닿아야 해요. 조각은 돌리거나 뒤집어 놓아도 돼요.',
    art: grid(70, 34, 10, 7, 34, { fill: C.paper, stroke: C.line2, sw: 1 })
      + bpiece(70, 34, 34, [[1, 1], [2, 1], [3, 1], [3, 2]], 'b') + bpiece(70, 34, 34, [[4, 3], [5, 3], [5, 4], [6, 4]], 'b')
      + ring(70 + 4 * 34, 34 + 3 * 34, 15) + ok(70 + 4 * 34 + 26, 34 + 3 * 34 - 26, 14) + T(240, 284, '꼭짓점만 맞닿게', { size: 15, fill: C.pt }),
  },
  {
    k: '이럴 땐', t: '내 조각끼리 변이 닿으면 안 돼요',
    d: '같은 색 조각끼리는 변이 한 칸이라도 닿으면 안 돼요. 꼭짓점으로만 이어 나가요.',
    art: grid(70, 34, 10, 7, 34, { fill: C.paper, stroke: C.line2, sw: 1 })
      + bpiece(70, 34, 34, [[1, 1], [2, 1], [3, 1], [3, 2]], 'b') + bpiece(70, 34, 34, [[4, 2], [4, 3], [5, 3], [6, 3]], 'b')
      + line(70 + 4 * 34, 34 + 2 * 34 + 2, 70 + 4 * 34, 34 + 3 * 34 - 2, { stroke: C.pt, sw: 6 }) + no(70 + 4 * 34 + 30, 34 + 2 * 34 - 16, 14) + T(240, 284, '변이 맞닿았어요', { size: 15, fill: C.pt }),
  },
  {
    k: '알기', t: '다른 색과는 닿아도 괜찮아요',
    d: '다른 색 조각과는 변이 닿아도 돼요. 상대가 뻗어 나갈 길목을 내 조각으로 막는 게 작전이에요.',
    art: grid(70, 34, 10, 7, 34, { fill: C.paper, stroke: C.line2, sw: 1 })
      + bpiece(70, 34, 34, [[1, 1], [2, 1], [3, 1], [3, 2]], 'b') + bpiece(70, 34, 34, [[4, 2], [5, 2], [6, 2], [6, 3], [6, 4]], 'y') + bpiece(70, 34, 34, [[1, 3], [2, 3], [2, 4], [2, 5]], 'y')
      + ok(70 + 4 * 34 + 2, 34 + 1 * 34 + 4, 14) + pill(380, 270, '길목 막기', { size: 14, bg: C.pt }),
  },
  {
    k: '끝', t: '남은 칸만큼 점수를 잃어요',
    d: '모두 더 놓을 수 없으면 끝나요. 남은 조각의 칸 수만큼 1점씩 잃어요. 조각을 다 놓으면 15점, 마지막이 1칸짜리면 5점을 더 받아요.',
    art: bpiece(40, 70, 16, [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], 'g') + bpiece(40, 100, 16, [[0, 0], [1, 0], [1, 1]], 'g') + bpiece(110, 100, 16, [[0, 0]], 'g') + T(90, 190, '−9', { size: 32, weight: 800, fill: C.pt }) + T(90, 222, '남은 9칸', { size: 14, fill: C.muted })
      + line(190, 50, 190, 250, { stroke: C.line, sw: 2, dash: '5 6' })
      + T(330, 76, '조각을 다 놓았어요', { size: 16 }) + T(330, 130, '+15', { size: 34, weight: 800, fill: C.ok }) + bpiece(270, 168, 22, [[0, 0]], 'b') + T(360, 180, '마지막이 1칸이면', { size: 14 }) + T(330, 222, '+5 더', { size: 26, weight: 800, fill: C.ok }),
  },
];

// ---------- 킹 오브 도쿄 ----------
const kface = (cx, cy, v, s = 38) => die(cx, cy, 0, {
  s, fill: v === 'claw' || v === 'heart' || v === 'bolt' ? C.paper : C.paper,
  inner: (x, y, ss) => {
    if (v === 'claw') return path(`M${x - ss * 0.22} ${y + ss * 0.22}L${x - ss * 0.02} ${y - ss * 0.24}M${x} ${y + ss * 0.24}L${x + ss * 0.2} ${y - ss * 0.22}M${x + ss * 0.2} ${y + ss * 0.22}L${x + ss * 0.36} ${y - ss * 0.14}`, { stroke: C.red, sw: ss * 0.1, cap: 'round' });
    if (v === 'heart') return heart(x, y + 1, ss / 30, C.red);
    if (v === 'bolt') return bolt(x, y, ss / 32, C.yellow);
    return T(x, y + 1, v, { size: ss * 0.6, weight: 800 });
  },
});
const monster = (cx, cy, fill, s = 1) => g(blob([(a) => path('M-26 24C-30 0 -24 -22 0 -24C24 -22 30 0 26 24Z', a), (a) => path('M-16 -18L-22 -36L-6 -22Z', a), (a) => path('M16 -18L22 -36L6 -22Z', a)], fill, 2.2)
  + circ(-9, -6, 6, { fill: '#fff', stroke: C.ink, sw: 1.8 }) + circ(9, -6, 6, { fill: '#fff', stroke: C.ink, sw: 1.8 }) + circ(-8, -5, 2.6, { fill: C.ink }) + circ(10, -5, 2.6, { fill: C.ink })
  + path('M-11 8H11L7 14L4 9L0 14L-4 9L-7 14Z', { fill: '#fff', stroke: C.ink, sw: 1.6 }), { x: cx, y: cy, s });
const tokyo = (cx, cy, s = 1) => g(rect(-44, -20, 22, 46, { fill: '#C9D3E3', stroke: C.ink, sw: 2 }) + rect(-20, -40, 24, 66, { fill: '#B6C2D6', stroke: C.ink, sw: 2 }) + path('M14 26V-24L22 -52L30 -24V26Z', { fill: C.pt, stroke: C.ink, sw: 2 }) + rect(32, -6, 18, 32, { fill: '#C9D3E3', stroke: C.ink, sw: 2 }) + line(-56, 26, 60, 26, { stroke: C.ink, sw: 2.4 }), { x: cx, y: cy, s });
const kot = [
  {
    k: '목표', t: '20점을 먼저 모으거나, 끝까지 살아남아요',
    d: '괴수가 되어 도쿄를 차지하려고 싸워요. 승리 점수 20점을 먼저 모으거나, 다른 괴수가 모두 쓰러지고 혼자 남으면 이겨요.',
    art: monster(240, 156, '#9ED07F', 2.2) + star(86, 110, 34) + T(86, 112, '20', { size: 22, weight: 800 }) + T(86, 170, '점수 20점', { size: 16 })
      + heart(394, 112, 2.4) + T(394, 170, '혼자 살아남기', { size: 16 }) + T(240, 270, '둘 중 하나만 하면 이겨요', { size: 15, fill: C.muted }),
  },
  {
    k: '준비', t: '생명력 10, 점수 0에서 시작해요',
    d: '각자 괴수를 골라 생명력 10, 점수 0으로 맞춰요. 능력 카드를 섞어 3장을 펼치고, 에너지 큐브는 가운데 쌓아 둬요.',
    art: rect(30, 40, 170, 200, { fill: C.paper, stroke: C.ink, sw: 2.4, rx: 18 }) + monster(115, 104, '#F2A0B6', 1.1) + heart(70, 180, 1.4) + T(110, 180, '10', { size: 26, weight: 800 }) + star(150, 180, 15) + T(180, 180, '0', { size: 26, weight: 800 }) + T(115, 220, '내 괴수 판', { size: 14, fill: C.muted })
      + [0, 1, 2].map((i) => card(240 + i * 74, 46, { w: 62, h: 88, inner: (cx, cy) => bolt(cx, cy - 18, 0.9) + T(cx, cy + 14, '능력', { size: 14 }) })).join('') + T(350, 160, '능력 카드 3장', { size: 14, fill: C.muted })
      + [[300, 214], [324, 210], [348, 216], [312, 236], [338, 238], [362, 232]].map(([x, y]) => rect(x - 10, y - 10, 20, 20, { fill: '#5BC489', stroke: C.ink, sw: 1.8, rx: 4 })).join('') + T(330, 274, '에너지 큐브', { size: 14, fill: C.muted }),
  },
  {
    k: '내 차례', t: '굴리고, 골라서 두 번 더 굴려요',
    d: '주사위 6개를 굴린 뒤 원하는 것만 남기고 나머지를 다시 굴려요. 다시 굴리기는 두 번까지예요. 마지막에 나온 결과를 모두 적용해요.',
    art: pill(48, 60, '1번', { size: 14 }) + ['3', 'claw', '3', 'heart', '1', '3'].map((v, i) => kface(110 + i * 58, 60, v)).join('')
      + ring(110, 60, 26) + ring(226, 60, 26) + ring(400, 60, 26)
      + arrow(168, 88, 168, 150, { w: 3 }) + arrow(284, 88, 284, 150, { w: 3 }) + arrow(342, 88, 342, 150, { w: 3 })
      + pill(48, 176, '2번', { size: 14 }) + kface(168, 176, 'bolt') + kface(284, 176, '3') + kface(342, 176, 'claw') + ring(284, 176, 26)
      + pill(240, 254, '다시 굴리기는 두 번까지', { size: 15, bg: C.pt }),
  },
  {
    k: '알기', t: '주사위 결과 읽는 법',
    d: '같은 숫자가 3개면 그 숫자만큼 점수를 얻고, 넷째부터 하나에 1점씩 더해요. 발톱은 공격, 하트는 회복, 번개는 에너지예요.',
    art: kface(58, 50, '2', 34) + kface(98, 50, '2', 34) + kface(138, 50, '2', 34) + T(180, 50, '→ 2점', { size: 20, anchor: 'start' }) + T(290, 50, '(넷이면 3점)', { size: 14, fill: C.muted, anchor: 'start' })
      + kface(98, 110, 'claw', 34) + T(180, 110, '→ 공격, 생명 −1', { size: 18, anchor: 'start' })
      + kface(98, 170, 'heart', 34) + T(180, 170, '→ 회복, 생명 +1', { size: 18, anchor: 'start' })
      + kface(98, 230, 'bolt', 34) + T(180, 230, '→ 에너지 큐브 +1', { size: 18, anchor: 'start' }),
  },
  {
    k: '진행', t: '도쿄 안과 밖이 서로 공격해요',
    d: '도쿄가 비어 있으면 들어가야 해요. 도쿄 안 괴수는 밖의 괴수 모두를, 밖의 괴수는 도쿄 안 괴수를 공격해요. 들어가면 1점, 도쿄에서 차례를 시작하면 2점이에요.',
    art: tokyo(240, 132, 1.3) + monster(240, 150, '#9ED07F', 0.8)
      + monster(70, 220, '#F2A0B6', 0.75) + monster(410, 220, '#A8C6F0', 0.75) + monster(240, 262, '#F7D07A', 0.62)
      + arrow(206, 160, 104, 204, { bend: -10, w: 3.5 }) + arrow(274, 160, 376, 204, { bend: 10, w: 3.5 }) + arrow(240, 236, 240, 200, { w: 3, dash: '5 5' })
      + pill(80, 40, '들어가면 +1점', { size: 13, bg: C.ok }) + pill(400, 40, '안에서 시작 +2점', { size: 13, bg: C.ok }),
  },
  {
    k: '이럴 땐', t: '공격받으면 남을지 떠날지 정해요',
    d: '도쿄 안 괴수는 피해를 받은 뒤 도쿄를 떠날지 정해요. 떠나면 공격한 괴수가 대신 들어가요. 도쿄 안에서는 하트로 회복할 수 없어요.',
    art: tokyo(150, 140, 1.2) + monster(150, 158, '#9ED07F', 0.8) + T(206, 92, '−2', { size: 22, weight: 800, fill: C.pt }) + bubble(150, 46, '떠날래요', { size: 16, tail: 'br' })
      + monster(390, 168, '#F2A0B6', 0.9) + arrow(354, 196, 212, 196, { bend: -20, w: 4 }) + T(300, 238, '공격한 괴수가 들어가요', { size: 14 })
      + heart(50, 262, 1) + no(72, 254, 10) + T(92, 262, '도쿄 안에서는 회복 안 돼요', { size: 13, fill: C.muted, anchor: 'start' }),
  },
];

export default {
  'halli-galli': halli,
  dobble,
  rummikub,
  jenga,
  uno,
  'davinci-code': davinci,
  'chicken-chacha': chickencha,
  'pop-up-pirate': popup,
  blokus,
  'king-of-tokyo': kot,
};
