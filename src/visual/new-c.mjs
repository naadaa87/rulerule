// 2026-11 추가 게임 그림 설명 (가족·파티)
import { C, rect, circ, ell, line, path, poly, g, T, pill, bubble, badge, ok, no, ring, box, arrow, card, pile, person, hand, die, pawn, coin, crown, star, timer, table, motion, numCard, point } from './kit.mjs';
import { pc } from './parts.mjs';

// ---------- 셋 ----------
const SETC = { r: '#D8413F', g: '#2E9A5A', p: '#7E55BE' };
const geo = (shape, w, h) => {
  if (shape === 'd') return { hw: (t) => (w / 2) * (1 - Math.abs(2 * t - 1)), cx: () => 0 };
  if (shape === 'o') return { hw: (t) => { const dy = Math.abs(t - 0.5) * h, k = h / 2 - w / 2; return dy <= k ? w / 2 : Math.sqrt(Math.max(0, (w / 2) ** 2 - (dy - k) ** 2)); }, cx: () => 0 };
  return { hw: (t) => w * 0.34 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 6)), cx: (t) => w * 0.17 * Math.sin(2 * Math.PI * t) };
};
const setShape = (cx, cy, w, h, shape, shade, col) => {
  const c = SETC[col], G = geo(shape, w, h), top = cy - h / 2;
  const fill = shade === 'f' ? c : '#fff';
  let s;
  if (shape === 'd') s = poly([[cx, top], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]], { fill, stroke: c, sw: 2 });
  else if (shape === 'o') s = rect(cx - w / 2, top, w, h, { fill, stroke: c, sw: 2, rx: w / 2 });
  else {
    const R = [], L = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, y = top + t * h; R.push([cx + G.cx(t) + G.hw(t), y]); L.unshift([cx + G.cx(t) - G.hw(t), y]); }
    s = poly([...R, ...L], { fill, stroke: c, sw: 2 });
  }
  if (shade === 's') for (let k = 1; k < 8; k++) { const t = k / 8, hw = G.hw(t) - 1.4; if (hw > 0.8) s += line(cx + G.cx(t) - hw, top + t * h, cx + G.cx(t) + hw, top + t * h, { stroke: c, sw: 1.3, cap: 'butt' }); }
  return s;
};
// spec: 개수 모양 무늬 색, 예: '2dsg' = 2개 마름모 줄무늬 초록
const setCard = (x, y, spec, o = {}) => {
  const [n, shape, shade, col] = [Number(spec[0]), spec[1], spec[2], spec[3]];
  const w = o.w || 66, h = o.h || 44;
  return card(x, y, { w, h, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3.2 : 2.2, rot: o.rot,
    inner: (cx, cy) => [...Array(n)].map((_, i) => setShape(cx + (i - (n - 1) / 2) * w * 0.25, cy, w * 0.17, h * 0.62, shape, shade, col)).join('') });
};
const setGrid = ['1dfr', '2osg', '3sep', '2dfg', '1sfp', '3osr', '2dsg', '1oep', '3dep', '2sfr', '1ofg', '3ssp'];
const setGame = [
  {
    k: '목표', t: '규칙에 맞는 카드 세 장, ‘셋’을 먼저 찾아 외쳐요',
    d: '펼친 12장 가운데 셋을 찾으면 “셋!” 하고 외치고 세 장을 가리켜요. 맞으면 가져가고 빈자리에 새 카드를 채워요. 카드가 다 떨어졌을 때 셋을 가장 많이 모은 사람이 이겨요.',
    art: setGrid.map((s, i) => setCard(20 + (i % 4) * 74, 32 + Math.floor(i / 4) * 56, s, { hi: [0, 6, 8].includes(i) })).join('')
      + bubble(392, 70, '셋!', { size: 22, tail: 'bl' })
      + T(392, 150, '찾으면 외치고', { size: 16 }) + T(392, 178, '세 장을 가져가요', { size: 16 })
      + T(170, 222, '아무도 못 찾으면 3장 더 펼쳐요', { size: 15.5, fill: C.ink2 }) + pill(392, 248, '많이 모으면 승리', { size: 15 }),
  },
  {
    k: '네 가지', t: '카드마다 개수, 모양, 무늬, 색 네 가지 특징이 있어요',
    d: '개수는 1·2·3개, 모양은 마름모·물결·타원, 무늬는 꽉 참·줄무늬·빈 것, 색은 빨강·초록·보라예요. 네 가지가 세 가지씩이라 카드는 모두 81장이에요.',
    art: [['개수', ['1dfr', '2dfr', '3dfr']], ['모양', ['2dsg', '2ssg', '2osg']], ['무늬', ['1ofp', '1osp', '1oep']], ['색', ['3sfr', '3sfg', '3sfp']]]
      .map(([lab, specs], r) => pill(74, 46 + r * 64, lab, { size: 16 }) + specs.map((s, i) => setCard(148 + i * 96, 24 + r * 64, s, { w: 70, h: 44 })).join('')).join(''),
  },
  {
    k: '맞는 셋', t: '네 가지 모두 ‘셋이 다 같거나’ ‘셋이 다 달라야’ 해요',
    d: '빨강 1개, 초록 2개, 보라 3개 마름모가 꽉 참, 줄무늬, 빈 무늬로 있으면 개수·무늬·색은 모두 다르고 모양은 모두 같아요. 그래서 셋이에요.',
    art: ['1dfr', '2dsg', '3dep'].map((s, i) => setCard(48 + i * 138, 26, s, { w: 108, h: 70 })).join('')
      + [['개수', '모두 달라요'], ['모양', '모두 같아요'], ['무늬', '모두 달라요'], ['색', '모두 달라요']]
        .map(([a, b], i) => { const x = i % 2 ? 330 : 110, y = 140 + Math.floor(i / 2) * 44; return ok(x - 64, y, 13) + T(x - 22, y, a, { size: 16 }) + T(x + 50, y, b, { size: 15.5, fill: C.ink2 }); }).join('')
      + pill(240, 256, '셋이에요!', { size: 17, bg: C.ok }),
  },
  {
    k: '아닌 셋', t: '한 가지라도 ‘둘만 같으면’ 셋이 아니에요',
    d: '빨강, 빨강, 초록처럼 색이 둘은 같고 하나만 다르면 셋이 아니에요. 다른 특징이 다 맞아도 마찬가지예요. 틀리게 외치면 미리 정한 벌칙을 받아요.',
    art: ['1ofr', '2ofr', '3ofg'].map((s, i) => setCard(48 + i * 138, 26, s, { w: 108, h: 70, hi: true })).join('')
      + T(240, 138, '색: 빨강, 빨강, 초록', { size: 17 }) + no(132, 138, 14)
      + T(240, 184, '둘은 같고 하나만 달라요', { size: 16, fill: C.ink2 })
      + pill(240, 240, '셋이 아니에요', { size: 17, bg: C.pt }),
  },
];

// ---------- 스피드컵 ----------
const CUP = { r: C.red, y: C.yellow, g: C.green, b: C.blue, k: C.black };
const cup = (cx, by, col, s = 1) => {
  const bw = 17 * s, tw = 12 * s, h = 38 * s;
  return poly([[cx - bw, by], [cx + bw, by], [cx + tw, by - h], [cx - tw, by - h]], { fill: CUP[col], stroke: C.ink, sw: 2.2 })
    + rect(cx - bw + 1, by - 7 * s, bw * 2 - 2, 5 * s, { fill: '#fff', op: 0.35 }) + line(cx - tw * 0.4, by - h + 6 * s, cx - bw * 0.5, by - 10 * s, { stroke: '#fff', sw: 2, op: 0.5 });
};
const tower = (cx, by, cols, s = 1) => cols.map((c, i) => cup(cx, by - i * 38 * s, c, s)).join('');
const bell = (cx, cy, s = 1) => g(ell(0, 12, 30, 8, { fill: C.ink }) + ell(0, 9, 30, 8, { fill: C.silver, stroke: C.ink, sw: 2 }) + path('M-24 9Q-24 -20 0 -20Q24 -20 24 9Z', { fill: C.gold, stroke: C.ink, sw: 2.2 }) + rect(-4, -30, 8, 11, { fill: C.ink2, rx: 3 }) + circ(0, -31, 6, { fill: C.ink2 }), { x: cx, y: cy, s });
const dot = (cx, cy, col, r = 11) => rect(cx - r, cy - r, r * 2, r * 2, { fill: CUP[col], stroke: C.ink, sw: 1.8, rx: 6 }) + circ(cx - r * 0.35, cy - r * 0.35, r * 0.25, { fill: '#fff', op: 0.6 });
const speedCups = [
  {
    k: '목표', t: '카드 그림과 똑같이 컵을 맞추고, 먼저 종을 치면 카드를 가져가요',
    d: '사람마다 빨강, 노랑, 초록, 파랑, 검정 컵을 하나씩 가져요. 카드를 뒤집으면 모두 동시에 컵을 맞추고, 가장 먼저 맞게 끝낸 사람이 종을 쳐서 카드를 가져가요. 카드를 많이 모으면 이겨요.',
    art: ['r', 'y', 'g', 'b', 'k'].map((c, i) => cup(48 + i * 42, 210, c)).join('') + T(132, 244, '내 컵 다섯 개', { size: 16 })
      + bell(352, 196, 1.2) + T(352, 244, '종', { size: 16 })
      + card(322, 34, { w: 66, h: 92, fill: C.cream, inner: (cx, cy) => dot(cx, cy - 22, 'g') + dot(cx, cy + 2, 'r') + dot(cx, cy + 26, 'b') })
      + T(132, 70, '그림처럼 맞추고', { size: 17 }) + T(132, 102, '먼저 종을 쳐요', { size: 17, fill: C.pt }),
  },
  {
    k: '늘어놓기', t: '그림 속 물건이 옆으로 있으면, 컵도 그 색 순서대로 늘어놓아요',
    d: '카드에 빨강, 파랑, 노랑, 초록, 검정 물건이 왼쪽부터 나란히 있으면 내 컵도 그 순서로 옆으로 놓아요. 그림 속 물건 색이 곧 컵 색이에요.',
    art: card(30, 70, { w: 190, h: 92, fill: C.cream, inner: (cx, cy) => ['r', 'b', 'y', 'g', 'k'].map((c, i) => dot(cx - 72 + i * 36, cy, c, 13)).join('') })
      + T(125, 196, '카드 그림', { size: 16 })
      + arrow(234, 116, 262, 116, { w: 3.6 })
      + ['r', 'b', 'y', 'g', 'k'].map((c, i) => cup(290 + i * 40, 150, c, 0.95)).join('') + T(370, 196, '내 컵', { size: 16, fill: C.pt })
      + T(240, 252, '왼쪽부터 같은 색 순서로', { size: 16 }),
  },
  {
    k: '쌓기', t: '그림 속 물건이 위아래로 겹쳐 있으면, 컵도 그대로 쌓아요',
    d: '그림에서 초록 위에 빨강, 그 위에 노랑이 올라가 있으면 컵도 초록, 빨강, 노랑 순서로 쌓아요. 옆에 따로 있는 물건은 옆에 놓아요. 위아래 순서를 꼭 맞춰야 해요.',
    art: card(40, 40, { w: 140, h: 200, fill: C.cream, inner: (cx, cy) => dot(cx - 26, cy + 52, 'g', 14) + dot(cx - 26, cy + 22, 'r', 14) + dot(cx - 26, cy - 8, 'y', 14) + dot(cx + 30, cy + 52, 'b', 14) + dot(cx + 30, cy + 22, 'k', 14) })
      + arrow(196, 140, 232, 140, { w: 3.6 })
      + tower(290, 250, ['g', 'r', 'y']) + tower(370, 250, ['b', 'k'])
      + T(410, 70, '아래부터', { size: 16 }) + T(410, 98, '같은 순서', { size: 16, fill: C.pt }),
  },
  {
    k: '종 치기', t: '다 맞췄으면 종을 쳐요. 틀리게 치면 카드를 내놓아요',
    d: '종을 먼저 치고 컵이 맞으면 카드를 가져가요. 틀린 채로 쳤으면 모은 카드 한 장을 내놓아요. 카드가 다 떨어지면 끝나요.',
    art: bell(120, 186, 1.5) + hand(120, 118, { s: 1.3, rot: 180 }) + motion(120, 160, 44, 200, 340, { count: 3 })
      + ok(262, 92, 18) + T(370, 92, '맞으면 카드 가져가기', { size: 16 })
      + no(262, 170, 18) + T(370, 170, '틀리면 한 장 내놓기', { size: 16 })
      + T(345, 244, '카드가 많으면 승리', { size: 16, fill: C.pt }),
  },
];

// ---------- 슬리핑 퀸즈 ----------
const queen = (x, y, label, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, fill: '#FDE9F1', rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.4,
  inner: (cx, cy) => crown(cx, cy - 12, 0.95, C.gold) + T(cx, cy + 20, label, { size: 15.5 }) });
const sleepQ = (x, y, o = {}) => card(x, y, { w: o.w || 44, h: o.h || 60, back: true, backFill: '#7E55BE', rot: o.rot, inner: (cx, cy) => T(cx + 6, cy - 12, 'Zz', { size: 13, fill: '#fff' }) });
const ICON = {
  왕: (cx, cy) => crown(cx, cy, 1.1, C.gold),
  기사: (cx, cy) => line(cx, cy - 18, cx, cy + 12, { stroke: C.ink2, sw: 5 }) + line(cx - 10, cy + 6, cx + 10, cy + 6, { stroke: C.woodDark, sw: 4 }) + line(cx, cy + 8, cx, cy + 17, { stroke: C.woodDark, sw: 4 }),
  용: (cx, cy) => path(`M${cx - 15} ${cy + 12}Q${cx - 16} ${cy - 10} ${cx + 2} ${cy - 12}L${cx + 14} ${cy - 18}L${cx + 10} ${cy - 6}Q${cx + 16} ${cy + 6} ${cx + 6} ${cy + 12}Z`, { fill: C.green, stroke: C.ink, sw: 2 }) + circ(cx + 4, cy - 8, 1.8, { fill: C.ink }),
  물약: (cx, cy) => rect(cx - 4, cy - 18, 8, 8, { fill: C.woodDark, stroke: C.ink, sw: 1.6 }) + path(`M${cx - 4} ${cy - 10}L${cx - 13} ${cy + 6}Q${cx - 14} ${cy + 15} ${cx} ${cy + 15}Q${cx + 14} ${cy + 15} ${cx + 13} ${cy + 6}L${cx + 4} ${cy - 10}Z`, { fill: C.purple, stroke: C.ink, sw: 2 }),
  지팡이: (cx, cy) => line(cx - 12, cy + 14, cx + 6, cy - 6, { stroke: C.woodDark, sw: 4 }) + star(cx + 8, cy - 9, 9, C.gold),
};
const power = (x, y, label, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, fill: C.cream, rot: o.rot, inner: (cx, cy) => ICON[label](cx, cy - 10) + T(cx, cy + 24, label, { size: 15.5 }) });
const sleepingQueens = [
  {
    k: '목표', t: '잠든 여왕 카드를 깨워 내 앞에 모아요',
    d: '가운데 여왕 12장이 엎어져 잠들어 있어요. 2~3명이면 여왕 5장이나 50점, 4~5명이면 여왕 4장이나 40점을 먼저 모으면 이겨요.',
    art: [...Array(12)].map((_, i) => sleepQ(24 + (i % 4) * 52, 34 + Math.floor(i / 4) * 70)).join('') + T(124, 254, '잠든 여왕 12장', { size: 16 })
      + queen(266, 46, '장미') + queen(330, 46, '하트') + queen(394, 46, '달') + T(360, 152, '깨운 여왕은 내 앞에', { size: 16 })
      + T(360, 200, '2~3명: 5장 또는 50점', { size: 15.5, fill: C.ink2 }) + T(360, 232, '4~5명: 4장 또는 40점', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '왕', t: '왕 카드를 내면 잠든 여왕 하나를 깨워 데려와요',
    d: '차례마다 손에 5장을 들고 한 가지를 해요. 왕을 내면 잠든 여왕 하나를 뒤집어 내 앞으로 가져와요. 낸 만큼 카드를 다시 뽑아 5장을 맞춰요.',
    art: power(40, 96, '왕', { w: 70, h: 96 }) + arrow(128, 144, 176, 144, { w: 3.6 })
      + sleepQ(196, 104, { w: 58, h: 80 }) + arrow(270, 144, 314, 144, { w: 3.6 }) + queen(332, 92, '케이크', { w: 70, h: 100, hi: true })
      + T(240, 248, '여왕 하나를 깨워 내 앞에', { size: 16 }),
  },
  {
    k: '기사와 물약', t: '기사로 남의 여왕을 빼앗고, 물약으로 다시 재워요',
    d: '기사를 내면 다른 사람의 여왕 하나를 빼앗아 와요. 상대는 용을 내서 막을 수 있어요. 물약을 내면 남의 여왕을 다시 재우고, 상대는 마법 지팡이로 막아요.',
    art: power(24, 40, '기사') + arrow(90, 78, 130, 78, { w: 3.4 }) + queen(140, 40, '달', { hi: true }) + T(232, 64, '빼앗기', { size: 16 }) + power(300, 40, '용') + no(372, 80, 15) + T(420, 80, '막기', { size: 16 })
      + power(24, 170, '물약') + arrow(90, 208, 130, 208, { w: 3.4 }) + sleepQ(146, 178) + T(232, 196, '재우기', { size: 16 }) + power(300, 170, '지팡이') + no(372, 210, 15) + T(420, 210, '막기', { size: 16 }),
  },
  {
    k: '숫자 카드', t: '숫자 카드는 덧셈식을 만들면 한꺼번에 버릴 수 있어요',
    d: '숫자 카드는 한 장, 같은 숫자 두 장, 또는 덧셈식이 되는 세 장 이상을 버릴 수 있어요. 2, 3, 5가 있으면 “2 + 3 = 5”로 세 장을 버리고 새로 3장을 뽑아요.',
    art: numCard(60, 70, '2', C.blue, { w: 64, h: 90 }) + T(150, 115, '+', { size: 28, weight: 800 }) + numCard(176, 70, '3', C.green, { w: 64, h: 90 })
      + T(266, 115, '=', { size: 28, weight: 800 }) + numCard(292, 70, '5', C.red, { w: 64, h: 90 })
      + T(240, 214, '세 장을 한꺼번에 버려요', { size: 16 }) + pill(240, 254, '버린 만큼 새로 뽑기', { size: 15 }),
  },
];

// ---------- 루핑루이 ----------
const chick = (cx, cy, r = 13, o = {}) => circ(cx, cy + 2, r, { fill: C.ink }) + circ(cx, cy, r, { fill: o.lost ? C.line2 : C.cream, stroke: C.ink, sw: 2 })
  + ell(cx, cy + r * 0.12, r * 0.55, r * 0.5, { fill: '#fff', stroke: C.ink, sw: 1.4 }) + circ(cx - r * 0.12, cy - r * 0.5, r * 0.16, { fill: C.red }) + circ(cx + r * 0.12, cy - r * 0.55, r * 0.16, { fill: C.red })
  + poly([[cx + r * 0.42, cy - r * 0.02], [cx + r * 0.7, cy + r * 0.1], [cx + r * 0.42, cy + r * 0.24]], { fill: C.orange, stroke: C.ink, sw: 1 }) + circ(cx + r * 0.15, cy - r * 0.12, r * 0.08, { fill: C.ink });
const planeTop = (cx, cy, rot = 0, s = 1) => g(rect(-30, -6, 60, 12, { fill: C.red, stroke: C.ink, sw: 2, rx: 6 }) + rect(-6, -26, 14, 52, { fill: C.red, stroke: C.ink, sw: 2, rx: 5 }) + rect(-30, -10, 8, 20, { fill: C.red, stroke: C.ink, sw: 1.8, rx: 3 })
  + circ(6, 0, 6, { fill: C.skin, stroke: C.ink, sw: 1.6 }) + line(32, -12, 32, 12, { stroke: C.ink, sw: 3 }), { x: cx, y: cy, rot, s });
const planeSide = (cx, cy, rot = 0, s = 1) => g(ell(0, 0, 32, 10, { fill: C.red, stroke: C.ink, sw: 2 }) + poly([[-30, -2], [-38, -18], [-24, -6]], { fill: C.red, stroke: C.ink, sw: 1.8 })
  + ell(-2, 6, 16, 5, { fill: '#B92F2D', stroke: C.ink, sw: 1.6 }) + circ(2, -12, 7, { fill: C.skin, stroke: C.ink, sw: 1.8 }) + rect(-4, -15, 12, 4, { fill: C.ink2, rx: 2 }) + line(34, -10, 34, 10, { stroke: C.ink, sw: 3 }), { x: cx, y: cy, rot, s });
const lever = (cx, cy, down = 'r', s = 1) => g(poly([[-8, 14], [8, 14], [0, 2]], { fill: C.ink2, stroke: C.ink, sw: 1.6 }) + g(rect(-40, -4, 80, 8, { fill: C.yellow, stroke: C.ink, sw: 2, rx: 4 }) + circ(-34, -6, 7, { fill: C.blue, stroke: C.ink, sw: 1.8 }), { rot: down === 'r' ? 14 : down === 'l' ? -14 : 0 }), { x: cx, y: cy, s });
const coop = (cx, cy, n, rot) => g(rect(-42, -16, 84, 32, { fill: C.wood, stroke: C.ink, sw: 2, rx: 10 }) + [0, 1, 2].map((i) => chick(-26 + i * 26, 0, 10, { lost: i >= n })).join(''), { x: cx, y: cy, rot });
const loopingLouie = [
  {
    k: '목표', t: '빙글빙글 도는 루이에게서 내 닭 세 마리를 지켜요',
    d: '가운데 기둥에 매달린 비행기 루이가 돌며 오르락내리락해요. 사람마다 닭 3마리를 지키는데, 루이가 닭장에 닿으면 닭이 떨어져요. 닭을 마지막까지 지킨 사람이 이겨요.',
    art: circ(200, 150, 112, { fill: C.table }) + circ(200, 150, 74, { stroke: C.line, sw: 2, dash: '6 6' })
      + coop(200, 52, 3, 0) + coop(200, 248, 3, 0) + coop(98, 150, 3, 90) + coop(302, 150, 3, 90)
      + circ(200, 150, 16, { fill: C.ink2, stroke: C.ink, sw: 2 }) + line(200, 150, 252, 98, { stroke: C.ink2, sw: 5 }) + planeTop(258, 92, -45, 0.8)
      + arrow(150, 92, 118, 132, { bend: 18, w: 3.2 })
      + T(404, 110, '닭 3마리씩', { size: 16 }) + T(404, 140, '지키기', { size: 16, fill: C.pt }) + T(404, 196, '차례 없이', { size: 15.5, fill: C.ink2 }) + T(404, 222, '모두 함께', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '튕기기', t: '루이가 내 쪽으로 오면 지렛대를 눌러 루이를 튕겨 올려요',
    d: '스위치를 켜면 루이가 돌기 시작해요. 내 쪽으로 오면 지렛대를 툭 눌러요. 지렛대 끝이 튀어 오르며 루이를 쳐서 높이 날려 보내요. 루이를 손으로 만지면 안 돼요.',
    art: rect(20, 246, 440, 10, { fill: C.table, rx: 5 }) + lever(150, 228, 'r', 1.6) + hand(232, 186, { s: 1.1, rot: 180 })
      + planeSide(118, 120, -12, 1.2) + arrow(118, 170, 118, 136, { w: 3.6 }) + motion(118, 120, 46, 200, 340, { count: 3 })
      + T(360, 110, '지렛대를 툭', { size: 17 }) + T(360, 142, '루이가 위로', { size: 17, fill: C.pt }),
  },
  {
    k: '닭', t: '루이가 닭을 치면 그 닭은 떨어져서 잃어요',
    d: '루이를 막지 못하면 루이가 닭장 칸의 닭 토큰을 쳐서 떨어뜨려요. 떨어진 닭은 상자에 넣어요. 기울었지만 안 떨어졌으면 그대로 둬요.',
    art: rect(20, 236, 440, 10, { fill: C.table, rx: 5 }) + rect(110, 200, 220, 36, { fill: C.wood, stroke: C.ink, sw: 2, rx: 10 })
      + chick(160, 210, 14) + chick(210, 210, 14) + g(chick(0, 0, 14), { x: 286, y: 150, rot: 40 }) + motion(286, 150, 20, -40, 60, { count: 3 })
      + planeSide(330, 196, 10, 1.1) + arrow(380, 200, 300, 214, { w: 3, dash: '5 5', bend: -10 })
      + T(240, 70, '닭을 치면 떨어져요', { size: 17 }) + T(240, 104, '떨어진 닭은 잃어요', { size: 16, fill: C.pt }),
  },
  {
    k: '이기기', t: '닭이 남은 사람이 한 명이 되면 그 사람이 이겨요',
    d: '닭을 다 잃은 사람은 빠지지만 지렛대는 계속 눌러도 돼요. 닭이 남은 사람이 한 명만 남으면 끝나요. 다섯 판을 해서 이긴 횟수로 겨뤄도 좋아요.',
    art: coop(120, 70, 0, 0) + coop(120, 140, 0, 0) + coop(120, 210, 0, 0) + T(222, 140, '0마리', { size: 16, fill: C.muted })
      + coop(352, 140, 1, 0) + crown(352, 96, 1.4) + T(352, 196, '1마리 남음', { size: 16 }) + pill(352, 240, '승리', { size: 17, bg: C.pt }),
  },
];

// ---------- 도둑잡기 ----------
const joker = (x, y, o = {}) => card(x, y, { w: o.w || 54, h: o.h || 76, fill: '#FFF2CC', rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.4, inner: (cx, cy, w, h) => star(cx, cy - h * 0.14, w * 0.24, C.pt) + T(cx, cy + h * 0.26, '조커', { size: 15.5 }) });
const fanBacks = (cx, cy, k, o = {}) => [...Array(k)].map((_, i) => card(cx - 27 + (i - (k - 1) / 2) * 22, cy - 38, { back: true, backFill: o.back || '#3B6FC0', rot: (i - (k - 1) / 2) * 9, w: 54, h: 76 })).join('');
const oldMaid = [
  {
    k: '목표', t: '짝을 버려 카드를 먼저 다 없애고, 조커(도둑)만은 피해요',
    d: '트럼프 52장에 조커 1장을 넣어 모두 나눠요. 같은 숫자 두 장이 생기면 버리고, 카드를 다 버린 사람은 빠져요. 마지막까지 조커를 든 사람이 져요.',
    art: pc(30, 90, '7', 'h', { rot: -16 }) + pc(72, 80, '7', 's', { rot: -6 }) + joker(116, 78, { rot: 4, hi: true }) + pc(160, 86, 'K', 'd', { rot: 14 })
      + T(128, 210, '조커는 짝이 없어요', { size: 16 })
      + T(352, 90, '짝은 버리고', { size: 17 }) + T(352, 124, '조커는 피하기', { size: 17, fill: C.pt }) + pill(352, 200, '조커가 남으면 짐', { size: 15 }),
  },
  {
    k: '짝 버리기', t: '같은 숫자 두 장은 무늬가 달라도 짝이에요. 바로 버려요',
    d: '카드를 받자마자 짝이 되는 카드를 모두 버려요. 7이 세 장이면 두 장만 버리고 한 장은 남겨요. 뽑아 온 카드로 짝이 생겨도 바로 버려요.',
    art: pc(36, 50, '7', 'h') + pc(96, 50, '7', 's') + arrow(162, 88, 214, 88, { w: 3.4 }) + ok(180, 52, 13)
      + pc(36, 160, 'K', 'd') + pc(96, 160, 'K', 'c') + arrow(162, 198, 214, 198, { w: 3.4 }) + ok(180, 162, 13)
      + rect(232, 54, 100, 180, { fill: C.mist, rx: 14 }) + pc(250, 92, '7', 'h', { rot: -8 }) + pc(262, 106, 'K', 'c', { rot: 10 }) + T(282, 214, '버린 카드', { size: 15.5 })
      + T(410, 120, '숫자만', { size: 16 }) + T(410, 148, '같으면 짝', { size: 16, fill: C.pt }),
  },
  {
    k: '뽑기', t: '차례가 오면 왼쪽 사람 카드를 보지 않고 한 장 뽑아요',
    d: '왼쪽 사람은 카드를 부채처럼 펴서 뒷면이 보이게 내밀어요. 나는 그중 한 장을 골라 뽑아요. 조커를 든 사람은 표정을 숨기고, 뽑는 사람은 눈치를 봐요.',
    art: person(110, 70, { fill: C.okTint, s: 1.2 }) + fanBacks(110, 170, 5)
      + point(250, 160, { s: 1.4, rot: 180 }) + arrow(300, 130, 196, 130, { w: 3.4, bend: 16 })
      + person(380, 120, { fill: C.cream, label: '나', lsize: 16, s: 1.2 })
      + bubble(380, 50, '어느 걸 뽑을까?', { size: 15.5, tail: 'bl' }),
  },
  {
    k: '도둑', t: '조커 한 장만 남으면 끝, 그 카드를 든 사람이 도둑이에요',
    d: '카드를 다 버린 사람은 차례로 빠지고 남은 사람끼리 계속해요. 마지막에 조커 한 장을 든 사람이 져요. 작은 벌칙을 정해 두면 더 신나요.',
    art: person(80, 120, { fill: C.okTint, s: 1.2 }) + ok(80, 200, 15) + person(190, 120, { fill: '#DCEBFA', s: 1.2 }) + ok(190, 200, 15)
      + person(340, 110, { fill: C.ptTint, s: 1.3, eyes: 'closed' }) + joker(380, 138, { rot: 12, w: 50, h: 70 }) + bubble(320, 40, '내가 도둑…', { size: 16, tail: 'br' })
      + T(135, 246, '다 버리고 빠져요', { size: 15.5, fill: C.ink2 }) + pill(350, 250, '조커를 든 사람이 짐', { size: 15 }),
  },
];

// ---------- 킹도미노 ----------
const TER = { 밀: '#F2C94C', 숲: '#2F7D4A', 물: '#4A90C8', 풀: '#9BCB5B', 늪: '#9A8466', 광: '#6B6B78', 성: '#E8E2D5' };
const castle = (cx, cy, s = 1) => g(path('M-12 10V-6H-8V-10H-4V-6H4V-10H8V-6H12V10Z', { fill: '#fff', stroke: C.ink, sw: 1.8 }) + rect(-3, 2, 6, 8, { fill: C.ink2 }), { x: cx, y: cy, s });
const tcell = (x, y, s, ter, cr = 0, o = {}) => rect(x, y, s, s, { fill: TER[ter], stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 1.6 })
  + (ter === '성' ? castle(x + s / 2, y + s / 2, s / 34) : '') + [...Array(cr)].map((_, i) => crown(x + s / 2 + (i - (cr - 1) / 2) * s * 0.34, y + s * 0.3, s / 64, C.gold)).join('');
const KD = [['밀', '밀', '숲', '숲', '물'], ['풀', '밀', '숲', '물', '물'], ['풀', '풀', '성', '숲', '물'], ['늪', '풀', '밀', '밀', '광'], ['늪', '늪', '밀', '광', '광']];
const KC = { '0,3': 1, '1,3': 1, '2,4': 2, '3,0': 1, '4,4': 2, '3,4': 1, '4,1': 2 };
const domino = (x, y, s, a, b, o = {}) => (o.v ? tcell(x, y, s, a[0], a[1] || 0) + tcell(x, y + s, s, b[0], b[1] || 0) : tcell(x, y, s, a[0], a[1] || 0) + tcell(x + s, y, s, b[0], b[1] || 0)) + rect(x, y, o.v ? s : s * 2, o.v ? s * 2 : s, { stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.4, rx: 2 });
const kingdomino = [
  {
    k: '목표', t: '땅 타일을 이어 붙여 5×5 왕국을 만들고, 점수가 높으면 이겨요',
    d: '타일마다 밀밭, 숲, 바다, 초원, 늪, 광산 가운데 두 칸이 그려져 있어요. 내 성에서 시작해 타일을 이어 붙여 5×5 왕국을 만들어요. 같은 땅을 넓게, 왕관을 많이 모으면 점수가 커요.',
    art: KD.map((row, r) => row.map((t, c) => tcell(36 + c * 38, 38 + r * 38, 38, t, KC[`${r},${c}`] || 0)).join('')).join('') + rect(36, 38, 190, 190, { stroke: C.ink, sw: 2.6 })
      + T(131, 256, '5칸 × 5칸 왕국', { size: 16 })
      + [['밀', '밀밭'], ['숲', '숲'], ['물', '바다'], ['풀', '초원'], ['늪', '늪'], ['광', '광산']].map(([t, lab], i) => tcell(286 + (i % 2) * 92, 52 + Math.floor(i / 2) * 50, 30, t) + T(346 + (i % 2) * 92, 67 + Math.floor(i / 2) * 50, lab, { size: 15.5, anchor: 'middle' })).join('')
      + crown(312, 218, 0.8) + T(370, 218, '왕관', { size: 15.5 }) + T(360, 256, '넓은 땅 × 왕관 = 점수', { size: 15.5, fill: C.pt }),
  },
  {
    k: '붙이기', t: '한쪽이 같은 땅(또는 성)과 맞닿게 붙여요',
    d: '타일 두 칸 가운데 한 칸 이상이 같은 땅과 변으로 맞닿아야 해요. 성은 어떤 땅과도 이어져요. 왕국은 5×5 안에 들어가야 해요.',
    art: tcell(40, 110, 44, '성') + tcell(84, 110, 44, '숲') + domino(128, 110, 44, ['숲'], ['물'], { hi: true }) + ok(150, 82, 15)
      + T(130, 200, '숲이 숲에 닿았어요', { size: 16 })
      + tcell(276, 110, 44, '성') + tcell(320, 110, 44, '밀') + domino(364, 110, 44, ['물'], ['늪'], { hi: true }) + no(386, 82, 15)
      + T(370, 200, '바다가 밀밭에 닿았어요', { size: 16 })
      + T(240, 256, '대각선은 이어진 게 아니에요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '고르기', t: '좋은 타일을 고르면 다음 차례가 늦어져요',
    d: '펼친 줄의 타일은 번호 순서로 놓여요. 번호가 클수록 땅이 좋고 왕관이 많아요. 왕 말을 놓은 자리가 다음 차례 순서가 되니, 좋은 타일과 빠른 순서 사이에서 골라요.',
    art: [[['풀'], ['풀'], '7'], [['밀'], ['숲'], '18'], [['물', 1], ['물'], '29'], [['광', 2], ['늪'], '45']]
      .map(([a, b, num], i) => badge(52, 52 + i * 56, num, { r: 15 }) + domino(80, 32 + i * 56, 40, a, b) + (i === 1 || i === 3 ? pawn(186, 62 + i * 56, i === 1 ? C.blue : C.pt) : '')).join('')
      + arrow(238, 52, 238, 214, { w: 3.4 }) + T(330, 52, '다음에 먼저 골라요', { size: 16 }) + T(330, 214, '땅이 좋고 왕관 많음', { size: 16, fill: C.pt })
      + T(330, 132, '욕심낼까, 서두를까', { size: 16, fill: C.ink2 }),
  },
  {
    k: '점수', t: '이어진 같은 땅의 칸 수 × 그 땅의 왕관 수를 더해요',
    d: '이어진 숲 4칸에 왕관이 2개 있으면 4 × 2 = 8점이에요. 왕관이 없는 땅은 아무리 넓어도 0점이에요. 성이 가운데에 있거나 빈칸 없이 다 채우면 보너스를 받기도 해요.',
    art: tcell(40, 50, 44, '숲', 1) + tcell(84, 50, 44, '숲') + tcell(40, 94, 44, '숲') + tcell(84, 94, 44, '숲', 1) + rect(40, 50, 88, 88, { stroke: C.pt, sw: 3.4 })
      + T(300, 94, '숲 4칸 × 왕관 2 = 8점', { size: 17, fill: C.ok })
      + tcell(40, 184, 44, '밀') + tcell(84, 184, 44, '밀') + tcell(128, 184, 44, '밀')
      + T(318, 206, '밀밭 3칸 × 왕관 0 = 0점', { size: 17, fill: C.muted }),
  },
];

// ---------- 만칼라 ----------
const SEED = ['#5B8DEF', '#F2B42E', '#3D9A5E', '#D8413F', '#7E55BE'];
const SPOS = [[0, 0], [-8, -6], [8, -6], [-8, 7], [8, 7], [0, -12], [0, 12], [-13, 1], [13, 1]];
const seeds = (cx, cy, k, o = {}) => (k > 9 ? T(cx, cy, String(k), { size: 16, weight: 800 }) : SPOS.slice(0, k).map(([dx, dy], i) => circ(cx + dx, cy + dy, 5.4, { fill: SEED[(i + (o.off || 0)) % 5], stroke: C.ink, sw: 1.2 })).join(''));
const PX = (i) => 98 + i * 57;
const board = (top, bot, sl, sr, o = {}) => {
  let s = rect(20, 74, 440, 150, { fill: C.wood, stroke: C.ink, sw: 2.6, rx: 40 }) + rect(24, 77, 432, 144, { fill: C.wood, rx: 37, stroke: C.woodDark, sw: 1.4 });
  s += ell(50, 149, 20, 56, { fill: C.woodDark, stroke: C.ink, sw: 1.8 }) + ell(430, 149, 20, 56, { fill: C.woodDark, stroke: C.ink, sw: 1.8 });
  s += seeds(50, 149, sl, { off: 2 }) + seeds(430, 149, sr, { off: 3 });
  for (let i = 0; i < 6; i++) {
    s += circ(PX(i), 112, 22, { fill: C.woodDark, stroke: C.ink, sw: 1.8 }) + seeds(PX(i), 112, top[i], { off: i });
    s += circ(PX(i), 186, 22, { fill: C.woodDark, stroke: (o.hi || []).includes(i) ? C.pt : C.ink, sw: (o.hi || []).includes(i) ? 3.4 : 1.8 }) + seeds(PX(i), 186, bot[i], { off: i + 1 });
  }
  return s;
};
const mancala = [
  {
    k: '목표', t: '돌을 옮겨 내 창고에 더 많이 모으면 이겨요',
    d: '판을 가로로 놓고, 내 앞 구덩이 6개와 내 오른쪽 끝 창고가 내 것이에요. 구덩이마다 돌을 4개씩 넣고 시작해요. 끝났을 때 내 창고의 돌이 더 많으면 이겨요.',
    art: board([4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4], 0, 0) + T(240, 42, '상대 구덩이 6개', { size: 16, fill: C.muted })
      + T(240, 252, '내 구덩이 6개', { size: 16 }) + pill(430, 254, '내 창고', { size: 15, bg: C.pt }) + pill(50, 44, '상대 창고', { size: 15, bg: C.ink2 }),
  },
  {
    k: '뿌리기', t: '구덩이 하나의 돌을 모두 집어, 다음 칸부터 하나씩 떨어뜨려요',
    d: '시계 반대 방향, 곧 내 쪽에서는 오른쪽으로 하나씩 떨어뜨려요. 내 창고에는 넣고 상대 창고는 건너뛰어요. 마지막 돌이 내 창고에 들어가면 한 번 더 해요.',
    art: board([4, 4, 4, 4, 4, 4], [4, 4, 0, 5, 5, 5], 0, 1, { hi: [2] })
      + arrow(PX(2) + 12, 214, PX(3) - 6, 212, { bend: -16, w: 3 }) + arrow(PX(3) + 12, 214, PX(4) - 6, 212, { bend: -16, w: 3 }) + arrow(PX(4) + 12, 214, PX(5) - 6, 212, { bend: -16, w: 3 }) + arrow(PX(5) + 14, 210, 420, 196, { bend: -16, w: 3 })
      + T(PX(2), 252, '4개 집기', { size: 15.5 }) + bubble(386, 44, '창고에 쏙, 한 번 더!', { size: 15.5, tail: 'br' }),
  },
  {
    k: '빼앗기', t: '마지막 돌이 내 쪽 빈 구덩이에 들어가면 맞은편 돌까지 가져와요',
    d: '마지막 돌이 내 쪽의 빈 구덩이에 떨어지고 바로 맞은편 상대 구덩이에 돌이 있으면, 그 돌과 맞은편 돌을 모두 내 창고로 옮겨요.',
    art: board([4, 5, 2, 6, 4, 4], [3, 0, 1, 5, 4, 4], 2, 6, { hi: [2] }) + ring(PX(2), 112, 27)
      + arrow(PX(2) + 26, 108, 410, 128, { bend: 26, w: 3.2 }) + arrow(PX(2) + 26, 190, 410, 172, { bend: -20, w: 3.2 })
      + T(PX(2), 252, '빈 칸에 마지막 돌', { size: 15.5 }) + T(PX(2), 44, '맞은편 돌도 함께', { size: 15.5, fill: C.pt }),
  },
  {
    k: '끝', t: '한쪽 구덩이가 모두 비면 끝나요. 창고의 돌이 많은 쪽이 이겨요',
    d: '한쪽 줄 6개가 모두 비면 게임이 끝나요. 다른 쪽에 남은 돌은 그쪽 주인의 창고에 넣어요. 돌은 모두 48개라 25개 이상이면 이겨요.',
    art: board([0, 0, 0, 0, 0, 0], [2, 0, 1, 0, 3, 1], 21, 20) + arrow(PX(4), 214, 420, 206, { bend: -14, w: 3, dash: '5 5' })
      + T(240, 42, '상대 줄이 다 비었어요', { size: 16, fill: C.muted }) + T(240, 252, '남은 돌은 내 창고로 → 27 대 21', { size: 16, fill: C.pt }),
  },
];

// ---------- 스파이폴 ----------
const place = (x, y, label, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, fill: '#E6F2FB', rot: o.rot, inner: (cx, cy) => path(`M${cx - 16} ${cy - 6}q8 -8 16 0t16 0`, { stroke: C.blue, sw: 2.4 }) + circ(cx + 10, cy - 20, 6, { fill: C.yellow, stroke: C.ink, sw: 1.4 }) + T(cx, cy + 20, label, { size: 15.5 }) });
const spy = (x, y, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, fill: C.ink2, rot: o.rot, inner: (cx, cy) => path(`M${cx - 16} ${cy - 12}h32l-6 -10h-20z`, { fill: C.black, stroke: '#fff', sw: 1.4 }) + rect(cx - 13, cy - 10, 26, 6, { fill: '#fff', op: 0.8, rx: 3 }) + T(cx, cy + 20, '스파이', { size: 15.5, fill: '#fff' }) });
const spyfall = [
  {
    k: '목표', t: '모두 같은 장소를 아는데, 스파이 한 사람만 장소를 몰라요',
    d: '장소 하나를 골라 그 장소 카드와 스파이 카드 1장을 섞어 나눠요. 스파이가 아닌 사람은 스파이를 찾아야 하고, 스파이는 들키지 않거나 장소를 맞혀야 이겨요.',
    art: place(30, 70, '해변') + place(100, 70, '해변') + spy(170, 70, { rot: 4 }) + place(240, 70, '해변') + place(310, 70, '해변')
      + T(198, 186, '한 장만 스파이', { size: 16, fill: C.pt }) + timer(420, 108, 1.4) + T(420, 160, '8분', { size: 16 })
      + T(240, 244, '질문을 주고받으며 스파이를 찾아요', { size: 16 }),
  },
  {
    k: '질문', t: '아무에게나 질문하고, 답한 사람이 다음 질문할 사람을 골라요',
    d: '아는 사람만 자연스럽게 답할 질문이 좋아요. 너무 대놓고 물으면 스파이에게 장소를 알려 주고, 너무 흐리게 답하면 내가 의심받아요.',
    art: person(90, 150, { fill: C.okTint, s: 1.3 }) + bubble(160, 66, '여기 올 때 뭐 입고 왔어요?', { size: 15.5, tail: 'bl' })
      + person(390, 150, { fill: '#DCEBFA', s: 1.3 }) + bubble(330, 226, '편한 반바지요', { size: 15.5, tail: 'tr' })
      + arrow(150, 150, 330, 150, { w: 3, dash: '6 6' }) + T(240, 276, '너무 티 나지 않게, 너무 흐리지 않게', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '지목', t: '언제든 한 사람을 스파이로 지목할 수 있어요',
    d: '지목된 사람을 뺀 모두가 찬성하면 그 사람이 카드를 공개해요. 한 명이라도 반대하면 계속해요. 한 판에 한 사람은 한 번만 지목을 꺼낼 수 있어요.',
    art: person(240, 92, { fill: C.ptTint, s: 1.4 }) + T(240, 160, '지목!', { size: 17, fill: C.pt })
      + [[70, 210], [160, 226], [320, 226], [410, 210]].map(([x, y]) => person(x, y, { fill: C.mist }) + ok(x + 26, y - 30, 12)).join('')
      + T(400, 70, '모두 찬성하면', { size: 16 }) + T(400, 98, '카드 공개', { size: 16, fill: C.pt }),
  },
  {
    k: '스파이', t: '스파이는 확신이 서면 언제든 장소를 맞혀 판을 끝내요',
    d: '스파이는 질문을 들으며 장소 목록에서 후보를 지워 가요. 맞히겠다고 나서면 그 자리에서 판이 끝나고, 맞히면 스파이가 이겨요. 8분이 다 되면 차례로 한 번씩 지목해요.',
    art: rect(30, 40, 170, 220, { fill: C.paper, stroke: C.ink, sw: 2, rx: 12 }) + T(115, 64, '장소 목록', { size: 16 })
      + ['병원', '학교', '비행기', '해변', '식당'].map((p, i) => T(115, 102 + i * 34, p, { size: 16, fill: i === 3 ? C.pt : C.muted }) + (i === 3 ? '' : line(80, 102 + i * 34, 150, 102 + i * 34, { stroke: C.muted, sw: 2 }))).join('')
      + ring(115, 204, 34) + spy(250, 104, { w: 64, h: 88 }) + bubble(390, 92, '여기는 해변!', { size: 16, tail: 'bl' }) + T(380, 220, '맞히면 스파이 승리', { size: 16, fill: C.pt }),
  },
];

// ---------- 인사이더 ----------
const role = (x, y, label, fill, icon, o = {}) => card(x, y, { w: o.w || 104, h: o.h || 130, fill, inner: (cx, cy) => icon(cx, cy - 22) + T(cx, cy + 32, label, { size: 16 }) });
const insider = [
  {
    k: '역할', t: '마스터는 정답을 알고, 인사이더는 몰래 알고, 나머지는 몰라요',
    d: '마스터는 정체를 밝히고 정답 단어를 봐요. 모두 눈을 감은 동안 인사이더도 몰래 정답을 봐요. 나머지 일반 사람들은 정답을 몰라요.',
    art: role(30, 40, '마스터', C.cream, (cx, cy) => crown(cx, cy, 1.4)) + T(82, 200, '정답을 알아요', { size: 15.5 })
      + role(188, 40, '인사이더', C.ptTint, (cx, cy) => circ(cx, cy, 18, { fill: '#fff', stroke: C.ink, sw: 2 }) + circ(cx, cy, 7, { fill: C.ink })) + T(240, 200, '몰래 알아요', { size: 15.5, fill: C.pt })
      + role(346, 40, '일반', C.mist, (cx, cy) => T(cx, cy, '?', { size: 34, weight: 800 })) + T(398, 200, '몰라요', { size: 15.5 })
      + T(240, 256, '인사이더는 정체를 숨겨요', { size: 16 }),
  },
  {
    k: '질문', t: '5분 동안 네/아니요 질문으로 정답 단어를 맞혀요',
    d: '모두 마스터에게 질문해요. 마스터는 “네”, “아니요”, “몰라요”로만 답해요. 인사이더는 남들도 할 만한 질문으로 슬쩍 정답 쪽으로 이끌어요.',
    art: person(240, 76, { fill: C.cream, s: 1.3, hat: C.gold }) + bubble(340, 44, '네', { size: 17, tail: 'bl' })
      + person(90, 210, { fill: C.mist }) + bubble(106, 136, '새예요?', { size: 15.5, tail: 'bl' })
      + person(390, 210, { fill: C.mist }) + bubble(384, 136, '추운 곳에 살아요?', { size: 15.5, tail: 'br' })
      + timer(240, 200, 1.4) + T(240, 252, '5분', { size: 16, fill: C.pt }),
  },
  {
    k: '맞히기', t: '정답을 맞히면 남은 시간만큼 이야기해 인사이더를 찾아요',
    d: '정답이 나오면 모래시계를 뒤집어요. 정답을 맞히는 데 3분이 걸렸다면, 이제 3분 동안 누가 너무 잘 알았는지 이야기해요. 5분 안에 못 맞히면 모두 져요.',
    art: bubble(120, 70, '펭귄!', { size: 22, tail: 'bl' }) + person(96, 160, { fill: C.okTint, s: 1.3 })
      + timer(260, 150, 2) + arrow(220, 96, 300, 96, { bend: 30, w: 3.2 }) + T(260, 222, '뒤집기', { size: 16 })
      + T(392, 130, '걸린 시간만큼', { size: 16 }) + T(392, 160, '이야기해요', { size: 16, fill: C.pt }),
  },
  {
    k: '투표', t: '투표로 인사이더를 찾으면 마스터와 일반 모두 이겨요',
    d: '먼저 정답을 맞힌 사람이 인사이더인지 다수결로 정해요. 아니라고 하면 다시 한 사람씩 가리켜 정해요. 인사이더를 찾으면 모두 이기고, 못 찾으면 인사이더가 이겨요.',
    art: person(240, 104, { fill: C.ptTint, s: 1.4 }) + role(296, 52, '인사이더', C.ptTint, (cx, cy) => circ(cx, cy, 14, { fill: '#fff', stroke: C.ink, sw: 2 }) + circ(cx, cy, 6, { fill: C.ink }), { w: 92, h: 110 })
      + [[70, 220], [170, 236], [310, 236], [410, 220]].map(([x, y]) => person(x, y, { fill: C.mist }) + ok(x + 26, y - 30, 12)).join('')
      + T(90, 70, '찾았다!', { size: 18, fill: C.ok }),
  },
];

// ---------- 보난자 ----------
const BEAN = { 커피콩: '#7A4E2D', 파랑콩: '#4A79C2', 빨강콩: '#C8423C', 초록콩: '#58A34E' };
const bean = (x, y, label, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, fill: o.fill || '#FFF6E6', rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.4,
  inner: (cx, cy) => ell(cx, cy - 10, 13, 18, { fill: BEAN[label], stroke: C.ink, sw: 1.8 }) + path(`M${cx - 4} ${cy - 22}q6 12 0 24`, { stroke: '#fff', sw: 1.6, op: 0.6 }) + T(cx, cy + 22, label, { size: 15.5 }) });
const field = (x, y, label, k, o = {}) => rect(x, y, 96, 150, { stroke: o.c || C.woodDark, sw: 2.4, rx: 12, dash: '6 5', fill: '#F3E5C8' }) + [...Array(k)].map((_, i) => bean(x + 20, y + 12 + i * 16, label)).join('');
const bohnanza = [
  {
    k: '목표', t: '콩 카드를 밭에 심고 모아 팔아서 동전을 많이 벌어요',
    d: '사람마다 콩밭이 두 칸 있고, 한 밭에는 한 종류만 심어요. 같은 콩을 많이 모아 팔수록 동전을 많이 받아요. 더미를 세 번 다 쓰면 끝나고 동전이 많으면 이겨요.',
    art: field(36, 50, '커피콩', 4) + field(150, 50, '파랑콩', 2) + T(140, 226, '내 콩밭 두 칸', { size: 16 })
      + coin(330, 100, 18, { label: '1' }) + coin(366, 112, 18, { label: '1' }) + coin(400, 96, 18, { label: '1' }) + T(366, 160, '팔아서 번 동전', { size: 16 })
      + pill(366, 222, '동전이 많으면 승리', { size: 15 }),
  },
  {
    k: '손 순서', t: '손의 카드 순서는 절대 바꾸지 않아요. 맨 앞 카드부터 심어요',
    d: '차례가 오면 손의 맨 앞 카드를 꼭 밭에 심어요. 원하면 다음 카드도 하나 더 심어요. 새로 뽑은 카드는 언제나 손의 맨 뒤로 들어가요.',
    art: ['커피콩', '빨강콩', '파랑콩', '커피콩', '초록콩'].map((l, i) => bean(40 + i * 62, 90, l, { hi: i === 0 })).join('')
      + T(68, 62, '맨 앞', { size: 16, fill: C.pt }) + arrow(68, 182, 68, 230, { w: 3.4 }) + T(150, 250, '꼭 심어요', { size: 16 })
      + arrow(456, 128, 402, 128, { w: 3.4 }) + T(420, 62, '새 카드는', { size: 15.5 }) + T(420, 214, '맨 뒤로', { size: 16, fill: C.pt }),
  },
  {
    k: '거래', t: '더미에서 2장을 펼치고, 다른 사람과 흥정해서 주고받아요',
    d: '심고 나면 더미에서 2장을 앞면으로 펼쳐요. 펼친 카드와 손의 카드를 걸고 다른 사람과 거래해요. 그냥 줘도 돼요. 받은 카드와 남은 펼친 카드는 모두 바로 심어요.',
    art: bean(222, 22, '빨강콩') + bean(296, 22, '초록콩') + T(404, 60, '펼친 2장', { size: 15.5 })
      + person(80, 190, { fill: C.cream, label: '나', lsize: 16, s: 1.2 }) + bubble(132, 120, '빨강콩 줄게요', { size: 15.5, tail: 'bl' })
      + person(400, 190, { fill: C.okTint, s: 1.2 }) + bubble(360, 248, '커피콩이랑 바꿔요', { size: 15.5, tail: 'tr' })
      + arrow(140, 196, 340, 196, { w: 3, bend: 14 }) + arrow(340, 214, 140, 214, { w: 3, bend: 14, c: C.ok }),
  },
  {
    k: '팔기', t: '밭의 콩을 팔면 카드 아래 표만큼 동전을 받아요',
    d: '다른 콩을 심어야 하는데 밭이 꽉 찼으면 한 밭을 팔아요. 예를 들어 파랑콩은 4장이면 동전 1개, 6장이면 2개예요. 받은 동전 수만큼 카드를 뒤집어 동전으로 써요.',
    art: field(40, 60, '파랑콩', 4) + arrow(150, 134, 200, 134, { w: 3.6 }) + coin(234, 134, 20, { label: '1' })
      + rect(290, 60, 160, 150, { fill: C.paper, stroke: C.ink, sw: 2, rx: 12 }) + T(370, 84, '파랑콩 표', { size: 16 })
      + [['4장', '1개'], ['6장', '2개'], ['8장', '3개'], ['10장', '4개']].map(([a, b], i) => T(335, 116 + i * 24, a, { size: 15.5 }) + T(405, 116 + i * 24, b, { size: 15.5, fill: C.ok })).join('')
      + T(240, 252, '팔고 남은 카드는 버려요', { size: 15.5, fill: C.ink2 }),
  },
];

export default {
  set: setGame, 'speed-cups': speedCups, 'sleeping-queens': sleepingQueens, 'looping-louie': loopingLouie, 'old-maid': oldMaid,
  kingdomino, mancala, spyfall, insider, bohnanza,
};
