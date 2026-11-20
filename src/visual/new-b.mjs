// 2026-11 추가 게임 그림 설명 (파티·전략)
import { C, rect, circ, ell, line, path, poly, g, T, pill, bubble, badge, ok, no, ring, box, arrow, card, pile, person, hand, die, coin, crown, star, timer, table } from './kit.mjs';
import { pc } from './parts.mjs';

// ---------- 스시고 ----------
const SC = { 만두: '#F6D58E', 튀김: '#F7B988', 회: '#F5A3A3', 마키: '#9ED3C2', 니기리: '#FBE3A6', 와사비: '#B9DE8C', 푸딩: '#E8C9F0', 젓가락: '#D5DAE1', 오징어: '#FBE3A6' };
const sc = (x, y, label, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, fill: SC[label] || C.cream, rot: o.rot, back: o.back, backFill: '#E46B5A',
  inner: o.back ? null : (cx, cy, w, h) => circ(cx, cy - h * 0.12, w * 0.26, { fill: '#fff', stroke: C.ink, sw: 1.6 }) + circ(cx, cy - h * 0.12, w * 0.12, { fill: SC[label] ? C.ink : C.muted, op: 0.25 }) + T(cx, cy + h * 0.26, label, { size: 15.5 }) });
const sushiGo = [
  {
    k: '목표', t: '세 라운드 동안 초밥을 골라 모아, 점수가 가장 높으면 이겨요',
    d: '카드마다 점수를 얻는 방법이 달라요. 만두는 많이 모을수록, 튀김은 두 장, 회는 세 장을 모아야 점수가 나요. 세 라운드 점수를 더해요.',
    art: ['만두', '튀김', '회', '마키', '푸딩'].map((l, i) => sc(34 + i * 84, 60, l, { rot: (i - 2) * 4 })).join('')
      + pill(240, 196, '세 라운드', { size: 16 }) + T(240, 244, '점수를 더해 가장 높으면 승리', { size: 16 }),
  },
  {
    k: '고르기', t: '손에서 한 장을 몰래 골라 엎어 두고, 모두 동시에 뒤집어요',
    d: '손에 든 카드 가운데 먹고 싶은 초밥 한 장을 골라 내 앞에 엎어 둬요. 모두 골랐으면 “하나, 둘, 셋!” 하고 함께 뒤집어요.',
    art: ['만두', '회', '튀김', '마키', '푸딩'].map((l, i) => sc(24 + i * 34, i === 2 ? 118 : 140, l, { rot: -14 + i * 7, w: 50, h: 70 })).join('') + box(84, 104, 66, 92, { rx: 10 })
      + T(120, 262, '한 장 고르기', { size: 16 })
      + arrow(214, 150, 262, 150, { w: 3.4 }) + sc(276, 100, '', { back: true, w: 56, h: 78 }) + T(304, 210, '엎어 두기', { size: 15.5 })
      + arrow(346, 140, 378, 140, { w: 3.4 }) + sc(390, 100, '튀김') + T(418, 210, '함께 뒤집기', { size: 15.5, fill: C.pt }),
  },
  {
    k: '넘기기', t: '남은 카드는 왼쪽 사람에게 넘기고, 받은 카드에서 또 골라요',
    d: '뒤집은 다음에는 손에 남은 카드를 왼쪽 사람에게 통째로 넘겨요. 오른쪽 사람이 준 카드에서 다시 한 장을 골라요. 카드가 다 떨어지면 라운드가 끝나요.',
    art: table(70, 78, 200, 144, { rx: 72 }) + person(170, 54, { fill: C.ptTint }) + person(312, 150, { fill: C.okTint }) + person(170, 240, { fill: C.cream, label: '나', lsize: 15.5 }) + person(28, 150, { fill: '#DCEBFA' })
      + arrow(132, 236, 46, 190, { bend: -26, w: 3.4 }) + arrow(36, 112, 120, 50, { bend: -26, w: 3.4 }) + arrow(214, 50, 300, 112, { bend: -26, w: 3.4 }) + arrow(300, 188, 212, 236, { bend: -26, w: 3.4 })
      + T(400, 110, '남은 카드는', { size: 16 }) + T(400, 140, '왼쪽 사람에게', { size: 16, fill: C.pt }) + T(400, 196, '받은 카드에서', { size: 15.5, fill: C.ink2 }) + T(400, 224, '또 한 장 골라요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '점수', t: '만두는 많을수록, 튀김은 둘, 회는 셋을 모아야 해요',
    d: '만두는 1장 1점, 2장 3점, 3장 6점처럼 늘어요. 튀김은 2장에 5점, 회는 3장에 10점이고, 모자라면 0점이에요. 와사비 위에 놓은 니기리는 점수가 세 배예요.',
    art: [0, 1, 2].map((i) => sc(20 + i * 48, 24, '만두', { w: 44, h: 64 })).join('') + T(200, 57, '3장 6점', { size: 16, fill: C.ok })
      + [0, 1].map((i) => sc(20 + i * 48, 112, '튀김', { w: 44, h: 64 })).join('') + T(200, 145, '2장 5점', { size: 16, fill: C.ok })
      + [0, 1, 2].map((i) => sc(20 + i * 48, 200, '회', { w: 44, h: 64 })).join('') + T(200, 233, '3장 10점', { size: 16, fill: C.ok })
      + rect(256, 24, 204, 242, { fill: C.mist, rx: 16 }) + sc(276, 44, '와사비', { w: 64, h: 84 }) + sc(352, 64, '오징어', { w: 64, h: 84 }) + T(346, 96, '+', { size: 22, weight: 800 })
      + T(358, 190, '오징어 3점 × 3', { size: 16 }) + T(358, 226, '= 9점', { size: 22, weight: 800, fill: C.pt }),
  },
];

// ---------- 펭귄 파티 ----------
const PG = { g: '#3D9A5E', r: '#D8413F', b: '#3B6FC0', y: '#F2B42E', p: '#7E55BE' };
const peng = (x, y, col, o = {}) => card(x, y, { w: 44, h: 58, fill: PG[col], rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.4,
  inner: (cx, cy) => ell(cx, cy + 5, 11, 15, { fill: '#fff', stroke: C.ink, sw: 1.5 }) + circ(cx - 4, cy - 2, 1.8, { fill: C.ink }) + circ(cx + 4, cy - 2, 1.8, { fill: C.ink }) + poly([[cx - 3, cy + 3], [cx + 3, cy + 3], [cx, cy + 7]], { fill: C.orange, stroke: C.ink, sw: 1 }) });
const pyramid = (x, y, rows) => rows.map((row, r) => row.map((c, i) => (c ? peng(x + r * 24 + i * 48, y - r * 46, c) : rect(x + r * 24 + i * 48, y - r * 46, 44, 58, { stroke: C.pt, sw: 2.4, rx: 8, dash: '5 4' }))).join('')).join('');
const penguinParty = [
  {
    k: '목표', t: '펭귄 카드로 피라미드를 쌓고, 벌점이 가장 적으면 이겨요',
    d: '모두 함께 펭귄 피라미드를 쌓아요. 더 놓을 수 없으면 그 판에서 빠지고, 손에 남은 카드만큼 벌점을 받아요. 여러 판을 해서 벌점이 가장 적은 사람이 이겨요.',
    art: pyramid(30, 196, [['g', 'r', 'b', 'y'], ['r', 'b', 'y'], ['b', 'y'], ['y']])
      + T(360, 90, '다 같이 쌓는', { size: 16 }) + T(360, 120, '펭귄 피라미드', { size: 18, fill: C.pt }) + pill(360, 190, '벌점이 적으면 승리', { size: 15 }),
  },
  {
    k: '맨 아래 줄', t: '맨 아래 줄은 색 상관없이 옆으로 이어 놓아요',
    d: '첫 카드는 가운데에 놓고, 맨 아래 줄은 옆으로 붙여 8장까지 놓을 수 있어요. 이 줄에는 아무 색이나 놓아도 돼요.',
    art: ['p', 'g', 'r', 'r', 'b', 'y'].map((c, i) => peng(40 + i * 50, 120, c)).join('') + rect(340, 120, 44, 58, { stroke: C.pt, sw: 2.4, rx: 8, dash: '5 4' }) + rect(390, 120, 44, 58, { stroke: C.pt, sw: 2.4, rx: 8, dash: '5 4' })
      + T(240, 70, '아무 색이나 옆으로', { size: 16 }) + T(240, 236, '맨 아래 줄은 8장까지', { size: 16, fill: C.pt }),
  },
  {
    k: '위층', t: '위층 카드는 아래 두 장 가운데 한 장과 색이 같아야 해요',
    d: '아래에 빨강과 파랑이 나란히 있으면 그 사이 위에는 빨강이나 파랑만 놓을 수 있어요. 아래 두 장이 다 있어야 위에 놓을 수 있어요.',
    art: peng(70, 176, 'r') + peng(118, 176, 'b') + rect(94, 116, 44, 58, { stroke: C.pt, sw: 2.6, rx: 8, dash: '5 4' }) + T(116, 145, '?', { size: 22, fill: C.pt })
      + peng(268, 90, 'r') + peng(332, 90, 'b') + peng(396, 90, 'g') + ok(290, 186, 16) + ok(354, 186, 16) + no(418, 186, 16)
      + T(300, 252, '빨강이나 파랑만 놓아요', { size: 16 }),
  },
  {
    k: '벌점', t: '낼 수 있는 카드가 없으면 빠지고, 남은 카드만큼 벌점이에요',
    d: '놓을 수 있는 자리가 있으면 꼭 내야 해요. 맞는 색이 하나도 없으면 그 판에서 빠지고, 손에 남은 카드 한 장마다 벌점 1점이에요.',
    art: person(110, 110, { fill: C.mist, eyes: 'closed', s: 1.4 }) + peng(54, 174, 'g', { rot: -10 }) + peng(88, 170, 'p') + peng(122, 174, 'g', { rot: 10 })
      + T(110, 262, '손에 3장 남았어요', { size: 15.5 }) + arrow(200, 150, 268, 150, { w: 4 })
      + circ(316, 140, 18, { fill: C.ink, op: 0.95 }) + circ(356, 140, 18, { fill: C.ink, op: 0.95 }) + circ(396, 140, 18, { fill: C.ink, op: 0.95 })
      + T(356, 196, '벌점 3', { size: 22, weight: 800, fill: C.pt }) + T(356, 236, '1장마다 1점', { size: 15.5, fill: C.ink2 }),
  },
];

// ---------- 정글 스피드 ----------
const JC = { y: '#E9B949', g: '#3D9A5E', r: '#D8413F', b: '#3B6FC0' };
const jsShape = (k, cx, cy, col, s = 1) => {
  let d;
  if (k === 'swirl') d = path('M0 0a3 3 0 0 1 6 0a6 6 0 0 1 -12 0a9 9 0 0 1 18 0a12 12 0 0 1 -24 0', { stroke: col, sw: 4, cap: 'round' });
  else if (k === 'cross') d = path('M-12 -12L12 12M12 -12L-12 12M0 -15V15M-15 0H15', { stroke: col, sw: 4.5, cap: 'round' });
  else d = circ(0, 0, 13, { stroke: col, sw: 4 }) + circ(0, 0, 5, { fill: col });
  return g(d, { x: cx, y: cy, s });
};
const jc = (x, y, k, col, o = {}) => card(x, y, { w: o.w || 58, h: o.h || 80, rot: o.rot, inner: (cx, cy, w) => jsShape(k, cx, cy, JC[col], w / 52) });
const totem = (cx, cy, s = 1) => g(rect(-12, -34, 24, 70, { fill: C.ink, rx: 10 }) + rect(-12, -37, 24, 70, { fill: C.wood, stroke: C.ink, sw: 2.2, rx: 10 }) + line(-12, -10, 12, -10, { stroke: C.woodDark, sw: 2 }) + line(-12, 12, 12, 12, { stroke: C.woodDark, sw: 2 }) + circ(-4, -24, 2.2, { fill: C.ink }) + circ(4, -24, 2.2, { fill: C.ink }), { x: cx, y: cy, s });
const arrowCard = (x, y, kind) => card(x, y, { w: 70, h: 96, inner: (cx, cy) => {
  if (kind === 'in') return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => arrow(cx + a * 26, cy + b * 34, cx + a * 8, cy + b * 10, { w: 3.4, head: 10, c: C.ok })).join('');
  if (kind === 'out') return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => arrow(cx + a * 8, cy + b * 10, cx + a * 26, cy + b * 34, { w: 3.4, head: 10, c: C.purple })).join('');
  return arrow(cx - 22, cy - 20, cx + 22, cy - 20, { w: 4, c: C.red, head: 11 }) + arrow(cx + 22, cy, cx - 22, cy, { w: 4, c: C.blue, head: 11 }) + arrow(cx - 22, cy + 20, cx + 22, cy + 20, { w: 4, c: C.green, head: 11 });
} });
const jungleSpeed = [
  {
    k: '목표', t: '내 카드를 모두 먼저 없애면 이겨요',
    d: '가운데에 나무 토템을 세우고 카드를 똑같이 나눠요. 같은 모양이 보일 때 토템을 먼저 잡으면 내 카드를 남에게 넘길 수 있어요. 카드를 다 털면 이겨요.',
    art: table(110, 50, 260, 200, { rx: 90 }) + totem(240, 154, 1.3)
      + jc(150, 70, 'swirl', 'y', { w: 46, h: 64 }) + jc(286, 70, 'cross', 'r', { w: 46, h: 64 }) + jc(150, 168, 'ring', 'b', { w: 46, h: 64 }) + jc(286, 168, 'swirl', 'g', { w: 46, h: 64 })
      + T(240, 280, '카드를 다 털면 승리', { size: 16, fill: C.pt }) + T(56, 150, '토템', { size: 16 }) + arrow(80, 150, 206, 150, { w: 2.6, dash: '5 5' }),
  },
  {
    k: '뒤집기', t: '맨 위 카드를 다른 사람 쪽으로 넘겨 뒤집어요',
    d: '차례가 되면 내 더미 맨 위 카드를 다른 사람 쪽으로 넘기듯 뒤집어 내 앞에 놓아요. 그래야 나만 먼저 보지 않고 모두 같은 순간에 봐요.',
    art: person(100, 230, { fill: C.cream, label: '나', lsize: 15.5, s: 1.1 }) + pile(70, 104, { w: 58, h: 80, count: 3, back: true, backFill: '#2F6E4F' }) + arrow(132, 134, 220, 90, { bend: -30, w: 3.4 })
      + jc(232, 50, 'swirl', 'y', { rot: 8 }) + person(380, 70, { fill: C.okTint }) + person(420, 160, { fill: C.ptTint }) + eyeLine(352, 96, 300, 96) + eyeLine(392, 170, 300, 110)
      + T(360, 252, '모두 같은 순간에 봐요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '토템 잡기', t: '같은 모양이 보이면 둘이 토템 잡기 싸움이에요',
    d: '내 앞 카드와 다른 사람 앞 카드의 모양이 같으면, 색이 달라도 둘이 토템을 먼저 잡으려고 싸워요. 이긴 사람은 자기 앞 카드를 진 사람에게 넘겨요.',
    art: jc(40, 40, 'swirl', 'y') + jc(380, 40, 'swirl', 'g') + T(240, 54, '모양이 같아요!', { size: 16, fill: C.pt }) + line(110, 80, 370, 80, { stroke: C.pt, sw: 2.4, dash: '5 5' })
      + totem(240, 170, 1.2) + hand(186, 176, { rot: 70, s: 0.95 }) + hand(300, 196, { rot: -70, s: 0.95, fill: '#F2C3A6' })
      + T(120, 262, '먼저 잡으면 내 카드를', { size: 15.5 }) + T(360, 262, '진 사람에게 넘겨요', { size: 15.5, fill: C.ok }),
  },
  {
    k: '특별 카드', t: '화살표 카드가 나오면 모두가 함께 움직여요',
    d: '안쪽 화살표는 모두가 토템을 잡는 카드, 바깥쪽 화살표는 모두 함께 한 장씩 뒤집는 카드예요. 색 화살표가 보이는 동안은 모양 대신 같은 색끼리 싸워요.',
    art: arrowCard(46, 52, 'in') + arrowCard(205, 52, 'out') + arrowCard(364, 52, 'color')
      + T(81, 182, '안쪽', { size: 16 }) + T(81, 212, '모두 토템 잡기', { size: 15.5, fill: C.ok })
      + T(240, 182, '바깥쪽', { size: 16 }) + T(240, 212, '모두 함께 뒤집기', { size: 15.5, fill: C.purple })
      + T(399, 182, '색 화살표', { size: 16 }) + T(399, 212, '같은 색끼리 싸움', { size: 15.5, fill: C.red }),
  },
];
function eyeLine(x1, y1, x2, y2) { return line(x1, y1, x2, y2, { stroke: C.muted, sw: 2, dash: '3 5' }); }

// ---------- 인디언 포커 ----------
const fore = (cx, cy, rank, o = {}) => person(cx, cy, { fill: o.fill || C.cream, label: o.label, lsize: 15.5, s: o.s || 1.15, eyes: o.eyes })
  + (o.hidden ? card(cx - 17, cy - 76, { w: 34, h: 46, back: true }) : pc(cx - 17, cy - 76, rank, o.suit || 's', { w: 34, h: 46 }));
const indianPoker = [
  {
    k: '목표', t: '내 카드는 나만 못 봐요. 다른 사람 숫자를 보고 칩을 걸어요',
    d: '카드 한 장을 보지 않고 이마에 대요. 다른 사람 숫자는 다 보이는데 내 숫자만 몰라요. 칩을 걸고 버티거나 접으며, 칩을 가장 많이 모으면 이겨요.',
    art: fore(90, 150, '9', { fill: C.okTint, suit: 'h' }) + fore(240, 150, '', { hidden: true, label: '나', fill: C.ptTint }) + fore(390, 150, '3', { fill: '#DCEBFA', suit: 'c' })
      + bubble(240, 40, '내 숫자는?', { size: 16, tail: 'bl' }) + coin(420, 250) + coin(444, 256) + coin(432, 276) + T(330, 262, '칩을 모아요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '눈치', t: '다른 사람 표정과 숫자로 내 카드를 짐작해요',
    d: '남들이 높은 숫자를 들고도 머뭇거리면 내 숫자가 더 클지도 몰라요. 반대로 다들 자신 있게 걸면 내 숫자가 작을 수 있어요.',
    art: fore(110, 170, 'K', { fill: C.okTint, suit: 'd', eyes: 'closed', s: 1.3 }) + bubble(110, 50, '음…', { size: 16, tail: 'bl' })
      + T(330, 90, '높은 숫자인데 망설이면', { size: 16 }) + T(330, 122, '내 숫자가 더 클지도?', { size: 16, fill: C.pt })
      + eye(280, 200, 1.4) + eye(330, 200, 1.4) + T(330, 250, '표정을 잘 보세요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '걸기', t: '칩을 올리거나, 따라가거나, 접어요',
    d: '돌아가며 앞사람보다 칩을 더 걸거나(올리기), 같은 만큼 걸거나(따라가기), 포기하고 카드를 내려요(접기). 접으면 이미 건 칩은 돌려받지 못해요.',
    art: rect(26, 50, 132, 180, { fill: C.ptTint, rx: 18 }) + T(92, 84, '올리기', { size: 18 }) + coin(76, 140) + coin(100, 146) + coin(88, 168) + T(92, 210, '더 걸어요', { size: 15.5 })
      + rect(174, 50, 132, 180, { fill: C.okTint, rx: 18 }) + T(240, 84, '따라가기', { size: 18 }) + coin(228, 146) + coin(252, 152) + T(240, 210, '같은 만큼', { size: 15.5 })
      + rect(322, 50, 132, 180, { fill: C.mist, rx: 18 }) + T(388, 84, '접기', { size: 18 }) + card(364, 124, { w: 48, h: 64, back: true, rot: 80 }) + T(388, 210, '건 칩은 잃어요', { size: 15.5, fill: C.pt })
      + T(240, 266, '돌아가며 하나를 골라요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '비교', t: '남은 사람 가운데 숫자가 가장 크면 칩을 다 가져가요',
    d: '모두 정하면 카드를 내려 숫자를 봐요. 접지 않은 사람 가운데 가장 큰 숫자가 가운데 칩을 모두 가져가요. 같으면 나눠 가져요.',
    art: pc(46, 70, '7', 'h', { w: 60, h: 84 }) + pc(150, 70, 'J', 's', { w: 60, h: 84 }) + pc(254, 70, 'K', 'd', { w: 60, h: 84, op: 0.35 }) + crown(180, 44, 1.1)
      + T(76, 186, '7', { size: 18 }) + T(180, 186, '11', { size: 18, fill: C.pt }) + T(284, 186, '접음', { size: 15.5, fill: C.muted })
      + coin(390, 110) + coin(414, 116) + coin(402, 138) + coin(426, 142) + arrow(370, 126, 216, 112, { bend: 18, w: 3.4 }) + T(240, 262, 'J(11)이 칩을 다 가져가요', { size: 16 }),
  },
];
function eye(cx, cy, s) { return g(path('M-15 0Q0 -12 15 0Q0 12 -15 0Z', { fill: '#fff', stroke: C.ink, sw: 2.2 }) + circ(0, 0, 4.5, { fill: C.ink }), { x: cx, y: cy, s }); }

// ---------- 노 땡스 ----------
const ntc = (x, y, num, o = {}) => card(x, y, { w: o.w || 58, h: o.h || 80, fill: o.fill || C.cream, rot: o.rot, op: o.op, inner: (cx, cy, w, h) => T(cx, cy, String(num), { size: h * 0.42, weight: 800, fill: num >= 25 ? C.red : num >= 15 ? C.orange : C.ink }) });
const chip = (cx, cy, r = 10) => circ(cx, cy + 2, r, { fill: C.ink }) + circ(cx, cy, r, { fill: '#E46B5A', stroke: C.ink, sw: 2 }) + circ(cx, cy, r * 0.45, { stroke: '#fff', sw: 1.6, op: 0.6 });
const noThanks = [
  {
    k: '목표', t: '숫자 카드는 벌점이에요. 점수가 가장 낮으면 이겨요',
    d: '3부터 35까지 숫자 카드를 가져가면 그 숫자만큼 벌점이에요. 칩을 내고 피할 수 있고, 남은 칩은 점수를 깎아 줘요. 가장 낮은 점수가 이겨요.',
    art: ntc(40, 60, 3) + ntc(108, 60, 17) + ntc(176, 60, 35) + T(146, 176, '숫자 = 벌점', { size: 17, fill: C.pt })
      + chip(320, 90) + chip(346, 96) + chip(332, 116) + chip(360, 120) + T(370, 176, '칩 1개 = 1점 빼기', { size: 16, fill: C.ok })
      + pill(240, 240, '점수가 낮으면 승리', { size: 16 }),
  },
  {
    k: '내 차례', t: '가운데 카드를 가져가거나, 칩 하나를 내고 넘겨요',
    d: '가운데 카드가 싫으면 칩 1개를 카드 위에 올리고 “노 땡스!”라고 말해 다음 사람에게 넘겨요. 칩이 없으면 가져가야 해요.',
    art: ntc(196, 40, 24, { w: 76, h: 104 }) + chip(214, 160) + chip(240, 164) + chip(266, 160)
      + person(76, 160, { fill: C.cream, s: 1.3 }) + bubble(84, 70, '노 땡스!', { size: 18, tail: 'bl', bg: C.ptTint }) + arrow(110, 170, 196, 162, { w: 3.4 }) + chip(150, 196)
      + rect(330, 70, 130, 140, { fill: C.okTint, rx: 16 }) + T(395, 108, '가져가기', { size: 17 }) + T(395, 150, '싫으면', { size: 15.5, fill: C.ink2 }) + T(395, 176, '칩 1개 내기', { size: 15.5, fill: C.ink2 })
      + T(240, 262, '칩이 없으면 꼭 가져가요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '가져가기', t: '가져가면 카드 위에 쌓인 칩도 함께 가져가요',
    d: '여러 사람이 피하는 사이 칩이 쌓여요. 누군가 가져가면 카드와 쌓인 칩을 모두 가져가고, 더미에서 새 카드를 뒤집어요.',
    art: ntc(60, 50, 31, { w: 70, h: 96 }) + chip(76, 168) + chip(100, 172) + chip(88, 192) + chip(112, 196) + chip(124, 172)
      + T(96, 236, '칩 5개가 쌓였어요', { size: 15.5 }) + arrow(170, 140, 262, 140, { w: 4 })
      + person(330, 130, { fill: C.ptTint, s: 1.2 }) + ntc(380, 84, 31, { w: 50, h: 68 }) + chip(400, 172) + chip(424, 176) + chip(412, 196)
      + T(370, 252, '카드와 칩을 함께', { size: 15.5, fill: C.pt }),
  },
  {
    k: '점수', t: '이어지는 숫자는 가장 작은 수만 세요',
    d: '27, 28, 29처럼 숫자가 이어지면 27만 더해요. 그래서 이어지는 카드는 일부러 가져가기도 해요. 마지막에 가진 칩 수만큼 빼요.',
    art: ntc(20, 40, 27) + ntc(72, 40, 28, { op: 0.45 }) + ntc(124, 40, 29, { op: 0.45 }) + T(110, 168, '27만 세요', { size: 16, fill: C.ok })
      + ntc(224, 40, 15) + T(253, 168, '15', { size: 16 })
      + chip(350, 70) + chip(374, 74) + chip(362, 94) + chip(386, 98) + chip(350, 116) + chip(398, 120) + T(374, 168, '칩 6개', { size: 16 })
      + rect(40, 200, 400, 64, { fill: C.mist, rx: 14 }) + T(240, 232, '27 + 15 − 6 = 36점', { size: 22, weight: 800, fill: C.pt }),
  },
];

// ---------- 스컬 ----------
const coaster = (cx, cy, kind, o = {}) => {
  const r = o.r || 22;
  let s = circ(cx, cy + 3, r, { fill: C.ink }) + circ(cx, cy, r, { fill: kind === 'back' ? '#5A3E2B' : '#FFF8EC', stroke: C.ink, sw: 2.2 });
  if (kind === 'back') s += circ(cx, cy, r * 0.62, { stroke: '#E8C38F', sw: 1.6, dash: '3 3' });
  else if (kind === 'rose') s += [0, 72, 144, 216, 288].map((a) => { const t = (a - 90) * Math.PI / 180; return circ(cx + Math.cos(t) * r * 0.32, cy + Math.sin(t) * r * 0.32, r * 0.26, { fill: C.pink, stroke: C.ink, sw: 1.3 }); }).join('') + circ(cx, cy, r * 0.2, { fill: C.red, stroke: C.ink, sw: 1.3 });
  else s += path(`M${cx - r * 0.5} ${cy + r * 0.1}C${cx - r * 0.5} ${cy - r * 0.62} ${cx + r * 0.5} ${cy - r * 0.62} ${cx + r * 0.5} ${cy + r * 0.1}V${cy + r * 0.48}H${cx - r * 0.5}Z`, { fill: '#fff', stroke: C.ink, sw: 1.6 })
    + circ(cx - r * 0.2, cy - r * 0.05, r * 0.13, { fill: C.ink }) + circ(cx + r * 0.2, cy - r * 0.05, r * 0.13, { fill: C.ink });
  return s;
};
const stack = (cx, cy, n, top = 'back', o = {}) => { let s = ''; for (let i = 0; i < n; i++) s += coaster(cx, cy - i * 7, i === n - 1 ? top : 'back', o); return s; };
const mat = (cx, cy, r = 40, flipped = false) => circ(cx, cy + 3, r, { fill: C.ink }) + circ(cx, cy, r, { fill: flipped ? C.gold : '#7FB6A6', stroke: C.ink, sw: 2.4 }) + (flipped ? star(cx, cy, r * 0.42, '#fff') : '');
const skull = [
  {
    k: '목표', t: '도전에 두 번 성공하거나, 마지막까지 남으면 이겨요',
    d: '사람마다 꽃 받침 3장과 해골 받침 1장을 가져요. 해골을 피해 약속한 수만큼 꽃을 뒤집으면 도전 성공이에요. 처음 성공하면 판을 뒤집고, 두 번째 성공하면 이겨요.',
    art: coaster(60, 70, 'rose') + coaster(110, 70, 'rose') + coaster(160, 70, 'rose') + coaster(220, 70, 'skull') + T(110, 116, '꽃 3장', { size: 15.5 }) + T(220, 116, '해골 1장', { size: 15.5, fill: C.pt })
      + mat(110, 200, 40) + T(110, 264, '첫 성공', { size: 15.5 }) + arrow(166, 200, 230, 200, { w: 3.4 }) + mat(290, 200, 40, true) + T(290, 264, '판 뒤집기', { size: 15.5 })
      + crown(410, 190, 1.5) + T(410, 236, '두 번째면 승리', { size: 15.5, fill: C.pt }),
  },
  {
    k: '쌓기', t: '받침을 엎어 쌓거나, 도전을 시작해요',
    d: '먼저 모두 받침 한 장씩을 엎어 놓아요. 그다음부터 차례마다 받침을 한 장 더 엎어 쌓거나, “꽃 몇 장을 뒤집겠다”며 도전을 시작해요.',
    art: mat(90, 120, 46) + stack(90, 126, 3) + mat(240, 120, 46) + stack(240, 126, 2) + mat(390, 120, 46) + stack(390, 126, 1)
      + pill(140, 230, '한 장 더 쌓기', { size: 15.5, bg: C.ok }) + T(240, 230, '또는', { size: 15.5, fill: C.muted }) + pill(340, 230, '도전 시작', { size: 15.5, bg: C.pt }),
  },
  {
    k: '도전', t: '돌아가며 숫자를 올리고, 가장 크게 부른 사람이 뒤집어요',
    d: '도전이 시작되면 돌아가며 더 큰 숫자를 부르거나 빠져요. 부르는 수는 판 위 받침 수보다 클 수 없어요. 남은 한 사람이 그 수만큼 뒤집어요.',
    art: person(80, 150, { fill: C.cream }) + bubble(80, 80, '꽃 3장!', { size: 16 }) + person(240, 150, { fill: C.okTint }) + bubble(240, 80, '4장!', { size: 16, bg: C.ptTint })
      + person(400, 150, { fill: '#DCEBFA', eyes: 'closed' }) + bubble(400, 80, '빠질게요', { size: 16, bg: C.mist })
      + T(240, 236, '가장 크게 부른 사람이', { size: 16 }) + T(240, 266, '그 수만큼 뒤집어요', { size: 16, fill: C.pt }),
  },
  {
    k: '뒤집기', t: '내 받침부터 모두 뒤집고, 그다음 남의 맨 위를 골라요',
    d: '도전한 사람은 내 받침을 먼저 모두 뒤집어야 해요. 그다음 다른 사람 받침을 맨 위부터 골라 뒤집어요. 해골이 나오면 실패해서 받침 하나를 잃어요.',
    art: mat(90, 130, 46) + coaster(70, 120, 'rose') + coaster(110, 130, 'rose') + badge(90, 70, 1) + T(90, 200, '내 것 먼저', { size: 15.5 })
      + mat(240, 130, 46) + stack(240, 136, 2, 'rose') + badge(240, 70, 2) + T(240, 200, '남의 맨 위', { size: 15.5 })
      + mat(390, 130, 46) + stack(390, 136, 2, 'skull') + badge(390, 70, 3) + no(424, 96, 14) + T(390, 200, '해골이면 실패', { size: 15.5, fill: C.pt })
      + T(240, 256, '실패하면 받침 하나를 잃어요', { size: 15.5, fill: C.ink2 }),
  },
];

// ---------- 세븐 원더스 듀얼 ----------
const AGE = { brown: '#B5763F', grey: '#9AA1AD', blue: '#3B6FC0', green: '#3D9A5E', yellow: '#E9B949', red: '#D8413F', purple: '#7E55BE' };
const wc = (x, y, col, o = {}) => card(x, y, { w: o.w || 40, h: o.h || 54, back: o.back, backFill: '#C9A46B', fill: o.back ? undefined : '#FFF8EC', stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2,
  inner: o.back ? null : (cx, cy, w, h, x0, y0) => rect(x0 + 4, y0 + 4, w - 8, h * 0.28, { fill: AGE[col], rx: 3 }) + (o.label ? T(cx, cy + h * 0.14, o.label, { size: 15.5 }) : '') });
const shield = (cx, cy, s = 1) => g(path('M0 -14L12 -9V2C12 9 6 13 0 15C-6 13 -12 9 -12 2V-9Z', { fill: C.red, stroke: C.ink, sw: 2 }), { x: cx, y: cy, s });
const sci = (cx, cy, k, s = 1) => g(circ(0, 0, 14, { fill: '#DCF1E3', stroke: C.ink, sw: 1.8 }) + (k === 0 ? path('M-6 6L6 -6M-6 -6L6 6', { stroke: C.green, sw: 3, cap: 'round' }) : k === 1 ? circ(0, 0, 5, { stroke: C.green, sw: 3 }) : k === 2 ? poly([[0, -7], [7, 6], [-7, 6]], { stroke: C.green, sw: 2.6 }) : k === 3 ? rect(-6, -6, 12, 12, { stroke: C.green, sw: 2.6 }) : k === 4 ? path('M-7 0H7M0 -7V7', { stroke: C.green, sw: 3, cap: 'round' }) : path('M-6 6Q0 -10 6 6', { stroke: C.green, sw: 3, cap: 'round' })), { x: cx, y: cy, s });
const sevenWondersDuel = [
  {
    k: '목표', t: '군사, 과학, 점수 세 가지 길 가운데 하나로 이겨요',
    d: '군사 말을 상대 수도까지 밀면 바로 이기고, 서로 다른 과학 기호 6개를 모아도 바로 이겨요. 둘 다 아니면 3시대가 끝났을 때 점수가 높은 사람이 이겨요.',
    art: rect(24, 40, 136, 200, { fill: C.ptTint, rx: 18 }) + shield(92, 110, 2.2) + T(92, 178, '군사', { size: 18 }) + T(92, 210, '상대 수도까지', { size: 15.5 })
      + rect(172, 40, 136, 200, { fill: C.okTint, rx: 18 }) + [0, 1, 2, 3, 4, 5].map((k) => sci(206 + (k % 3) * 34, 86 + Math.floor(k / 3) * 36, k, 0.95)).join('') + T(240, 178, '과학', { size: 18 }) + T(240, 210, '다른 기호 6개', { size: 15.5 })
      + rect(320, 40, 136, 200, { fill: C.cream, rx: 18 }) + star(388, 108, 30, C.gold) + T(388, 178, '점수', { size: 18 }) + T(388, 210, '3시대 끝에', { size: 15.5 })
      + T(240, 268, '셋 중 하나만 이루면 돼요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '카드 고르기', t: '위에 다른 카드가 없는 카드만 가져갈 수 있어요',
    d: '가운데 카드는 서로 겹쳐 펼쳐져 있어요. 아래쪽 카드에 덮이지 않은 카드만 가져갈 수 있고, 가져간 뒤 드러난 엎은 카드는 앞면으로 뒤집어요.',
    art: [0, 1].map((i) => wc(186 + i * 46, 40, 'blue', { back: true })).join('')
      + [0, 1, 2].map((i) => wc(163 + i * 46, 74, ['grey', 'green', 'red'][i])).join('')
      + [0, 1, 2, 3].map((i) => wc(140 + i * 46, 108, ['brown', 'yellow', 'brown', 'blue'][i], { hi: true })).join('')
      + ok(118, 140, 15) + T(70, 140, '가져가요', { size: 15.5, fill: C.ok }) + T(410, 82, '덮여 있어서', { size: 15.5 }) + T(410, 108, '아직 못 가져가요', { size: 15.5, fill: C.pt })
      + T(240, 216, '맨 앞줄 카드부터 골라요', { size: 16 }) + T(240, 252, '드러난 엎은 카드는 앞면으로', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '카드 쓰기', t: '가져온 카드는 짓기, 버리기, 불가사의 짓기 가운데 하나로 써요',
    d: '값을 내고 내 도시에 짓거나, 버리고 돈을 받거나, 내 불가사의 밑에 끼워 불가사의를 지어요. 버리는 것도 상대가 그 카드를 못 쓰게 하는 작전이에요.',
    art: wc(214, 30, 'blue', { w: 52, h: 70, hi: true }) + arrow(220, 108, 104, 150, { w: 3.2 }) + arrow(240, 108, 240, 150, { w: 3.2 }) + arrow(260, 108, 376, 150, { w: 3.2 })
      + rect(30, 158, 140, 112, { fill: C.okTint, rx: 16 }) + T(100, 190, '짓기', { size: 17 }) + T(100, 224, '값을 내고', { size: 15.5 }) + T(100, 250, '내 도시에', { size: 15.5 })
      + rect(176, 158, 128, 112, { fill: C.cream, rx: 16 }) + T(240, 190, '버리기', { size: 17 }) + coin(226, 216) + coin(252, 222) + T(240, 256, '돈 받기', { size: 15.5 })
      + rect(310, 158, 150, 112, { fill: C.ptTint, rx: 16 }) + T(385, 190, '불가사의', { size: 17 }) + T(385, 224, '카드를 밑에', { size: 15.5 }) + T(385, 250, '끼워 짓기', { size: 15.5 }),
  },
  {
    k: '군사', t: '빨간 카드의 방패만큼 군사 말을 상대 쪽으로 밀어요',
    d: '빨간 카드를 지으면 방패 수만큼 군사 말이 상대 수도 쪽으로 움직여요. 상대 수도에 닿으면 바로 이겨요. 상대도 빨간 카드로 되밀 수 있어요.',
    art: rect(30, 120, 420, 50, { fill: '#F2E6CF', stroke: C.ink, sw: 2.2, rx: 10 }) + Array.from({ length: 17 }, (_, i) => line(54 + i * 22.5, 124, 54 + i * 22.5, 166, { stroke: C.woodDark, sw: 1.4 })).join('')
      + rect(30, 120, 30, 50, { fill: '#DCEBFA', stroke: C.ink, sw: 2.2, rx: 10 }) + rect(420, 120, 30, 50, { fill: C.ptTint, stroke: C.ink, sw: 2.2, rx: 10 })
      + T(46, 196, '내 수도', { size: 15.5 }) + T(434, 196, '상대 수도', { size: 15.5, anchor: 'end' })
      + circ(285, 145, 13, { fill: C.red, stroke: C.ink, sw: 2.2 }) + arrow(240, 102, 330, 102, { w: 3.6 }) + shield(170, 70, 1.4) + shield(204, 70, 1.4) + T(186, 104, '방패 2', { size: 15.5 })
      + T(240, 252, '상대 수도에 닿으면 바로 승리', { size: 16, fill: C.pt }),
  },
];

// ---------- 윙스팬 ----------
const HAB = { 숲: '#CFE8D9', 초원: '#F4E3B5', 습지: '#C9DCF5' };
const bird = (cx, cy, col, s = 1) => g(ell(0, 4, 13, 9, { fill: col, stroke: C.ink, sw: 1.8 }) + circ(9, -5, 6.5, { fill: col, stroke: C.ink, sw: 1.8 }) + poly([[15, -6], [22, -4], [15, -2]], { fill: C.orange, stroke: C.ink, sw: 1.2 }) + circ(10, -6, 1.4, { fill: C.ink }) + path('M-12 4L-20 0', { stroke: C.ink, sw: 2, cap: 'round' }), { x: cx, y: cy, s });
const bcard = (x, y, col, o = {}) => card(x, y, { w: o.w || 46, h: o.h || 60, fill: '#FFFDF7', inner: (cx, cy) => bird(cx - 3, cy - 4, col, (o.w || 46) / 46) + (o.brown ? rect(x + 5, y + (o.h || 60) - 14, (o.w || 46) - 10, 8, { fill: C.brown, rx: 3 }) : '') });
const egg = (cx, cy) => ell(cx, cy, 6, 8, { fill: '#F3EFE4', stroke: C.ink, sw: 1.6 });
const cube = (cx, cy, col = C.purple) => rect(cx - 8, cy - 6, 16, 16, { fill: C.ink, rx: 3 }) + rect(cx - 8, cy - 8, 16, 16, { fill: col, stroke: C.ink, sw: 1.8, rx: 3 });
const habRow = (x, y, name, n, cols, o = {}) => rect(x, y, 300, 66, { fill: HAB[name], stroke: C.ink, sw: 2, rx: 10 }) + T(x + 30, y + 33, name, { size: 15.5 })
  + Array.from({ length: 5 }, (_, i) => (i < n ? bcard(x + 62 + i * 48, y + 3, cols[i], { w: 44, h: 60, brown: o.brown && o.brown.includes(i) }) : rect(x + 62 + i * 48, y + 5, 44, 56, { stroke: C.ink2, sw: 1.4, rx: 6, dash: '4 4', op: 0.6 }))).join('');
const wingspan = [
  {
    k: '목표', t: '새 카드로 내 보호구역을 꾸리고, 점수가 가장 높으면 이겨요',
    d: '숲, 초원, 습지 세 서식지에 새 카드를 놓아요. 네 라운드가 끝나면 새 점수, 알, 저장한 먹이, 보너스와 라운드 목표 점수를 모두 더해요.',
    art: habRow(20, 34, '숲', 3, [C.red, C.blue, C.gold]) + habRow(20, 116, '초원', 2, [C.orange, C.green]) + habRow(20, 198, '습지', 2, [C.sky, C.purple])
      + egg(110, 124) + egg(124, 124) + egg(158, 124)
      + T(400, 100, '새, 알, 먹이,', { size: 15.5 }) + T(400, 128, '보너스 점수를', { size: 15.5 }) + T(400, 156, '모두 더해요', { size: 15.5, fill: C.pt }) + pill(400, 220, '네 라운드', { size: 15 }),
  },
  {
    k: '행동', t: '차례마다 네 가지 행동 가운데 하나를 해요',
    d: '새 놓기, 먹이 얻기(숲), 알 낳기(초원), 새 카드 뽑기(습지) 가운데 하나를 골라요. 새를 놓으려면 카드에 그려진 먹이를 내야 해요.',
    art: rect(26, 40, 206, 104, { fill: C.cream, rx: 16 }) + T(129, 66, '새 놓기', { size: 17 }) + bcard(106, 82, C.red, { w: 46, h: 56 })
      + rect(248, 40, 206, 104, { fill: HAB.숲, rx: 16 }) + T(351, 66, '먹이 얻기 · 숲', { size: 16 }) + die(316, 112, 0, { s: 34, inner: (cx, cy) => circ(cx, cy, 8, { fill: C.red, stroke: C.ink, sw: 1.6 }) }) + die(360, 112, 0, { s: 34, inner: (cx, cy) => ell(cx, cy, 9, 6, { fill: C.gold, stroke: C.ink, sw: 1.6 }) })
      + rect(26, 158, 206, 104, { fill: HAB.초원, rx: 16 }) + T(129, 184, '알 낳기 · 초원', { size: 16 }) + egg(110, 228) + egg(130, 228) + egg(150, 228)
      + rect(248, 158, 206, 104, { fill: HAB.습지, rx: 16 }) + T(351, 184, '카드 뽑기 · 습지', { size: 16 }) + card(318, 204, { w: 34, h: 46, back: true, backFill: C.blue }) + card(350, 204, { w: 34, h: 46, back: true, backFill: C.blue }),
  },
  {
    k: '엔진', t: '새가 많은 줄일수록 더 많이 얻고, 새 능력이 줄줄이 이어져요',
    d: '행동 큐브를 그 줄의 빈칸 가운데 맨 왼쪽에 놓고 그 칸에 적힌 만큼 얻어요. 그다음 그 줄 새의 갈색 능력을 오른쪽에서 왼쪽으로 차례로 써요.',
    art: habRow(20, 60, '초원', 3, [C.orange, C.green, C.red], { brown: [0, 2] }) + cube(256, 92)
      + arrow(230, 52, 186, 52, { bend: 10, w: 3 }) + arrow(178, 52, 92, 52, { bend: 10, w: 3 }) + badge(224, 34, 1, { r: 11 }) + badge(128, 34, 2, { r: 11 })
      + egg(272, 164) + egg(290, 164) + egg(308, 164) + T(290, 196, '알 3개', { size: 15.5, fill: C.ok })
      + T(400, 100, '새가 늘면', { size: 16 }) + T(400, 128, '얻는 양도 늘어요', { size: 16, fill: C.ok })
      + T(240, 252, '갈색 능력은 오른쪽부터 왼쪽으로', { size: 16, fill: C.pt }),
  },
  {
    k: '라운드', t: '라운드마다 할 수 있는 행동이 하나씩 줄어요',
    d: '라운드가 끝날 때마다 행동 큐브 하나가 라운드 목표에 쓰여요. 그래서 1라운드는 8번, 4라운드는 5번만 행동할 수 있어요.',
    art: [8, 7, 6, 5].map((k, r) => T(56, 60 + r * 52, `${r + 1}라운드`, { size: 15.5 }) + Array.from({ length: k }, (_, i) => cube(124 + i * 34, 60 + r * 52, r === 3 ? C.pt : C.purple)).join('') + T(420, 60 + r * 52, `${k}번`, { size: 16, fill: r === 3 ? C.pt : C.ink })).join('')
      + T(240, 272, '마지막엔 한 번 한 번이 소중해요', { size: 15.5, fill: C.ink2 }),
  },
];

// ---------- 도미니언 ----------
const DC = { 구리: '#E3A26B', 은: '#D5DAE1', 금: '#F2C14E', 사유지: '#9ED3A8', 공작령: '#7FC08D', 속주: '#5DAA70', 저주: '#B99BD6', 마을: '#E9EDF2', 대장장이: '#E9EDF2', 시장: '#E9EDF2' };
const dc = (x, y, label, o = {}) => card(x, y, { w: o.w || 54, h: o.h || 76, rot: o.rot, back: o.back, backFill: '#3A4D6E', fill: '#FFFDF7', stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2,
  inner: o.back ? null : (cx, cy, w, h, x0, y0) => rect(x0 + 4, y0 + 4, w - 8, h - 30, { fill: DC[label] || C.mist, rx: 4 }) + (o.big ? T(cx, y0 + (h - 22) / 2 + 2, o.big, { size: 18, weight: 800 }) : '') + (o.nolabel ? '' : T(cx, y0 + h - 13, label, { size: 15.5 })) });
const dominion = [
  {
    k: '목표', t: '내 덱에 승점 카드를 가장 많이 모으면 이겨요',
    d: '게임이 끝났을 때 내 덱에 있는 승점 카드 점수를 더해요. 사유지 1점, 공작령 3점, 속주 6점이고, 저주는 1점을 깎아요.',
    art: dc(34, 60, '사유지', { big: '1', w: 86, h: 116 }) + dc(140, 60, '공작령', { big: '3', w: 86, h: 116 }) + dc(246, 60, '속주', { big: '6', w: 86, h: 116 }) + dc(352, 60, '저주', { big: '−1', w: 86, h: 116 })
      + T(240, 240, '덱 속 승점을 더해 가장 높으면 승리', { size: 16 }),
  },
  {
    k: '시작', t: '구리 7장, 사유지 3장으로 시작해 5장을 뽑아요',
    d: '모두 똑같은 10장짜리 덱으로 시작해요. 섞어서 5장을 손에 들어요. 가운데에는 이번 판에 쓸 왕국 카드 10종이 더미로 놓여요.',
    art: Array.from({ length: 7 }, (_, i) => dc(24 + i * 14, 60, '구리', { w: 54, h: 76, nolabel: i < 6 })).join('') + T(84, 160, '구리 7장', { size: 15.5 })
      + Array.from({ length: 3 }, (_, i) => dc(196 + i * 14, 60, '사유지', { w: 54, h: 76, nolabel: i < 2 })).join('') + T(236, 160, '사유지 3장', { size: 15.5 })
      + arrow(300, 100, 340, 100, { w: 3.4 }) + pile(356, 70, { w: 54, h: 76, backFill: '#3A4D6E', back: true }) + T(386, 160, '섞어서', { size: 15.5 })
      + [0, 1, 2, 3, 4].map((i) => dc(110 + i * 54, 190, i < 3 ? '구리' : '사유지', { w: 48, h: 66, rot: -8 + i * 4 })).join('') + T(410, 228, '5장', { size: 18, fill: C.pt }),
  },
  {
    k: '내 차례', t: '행동하고, 사고, 정리해요',
    d: '먼저 행동 카드 1장을 써요. 다음으로 손의 동전을 모두 내서 시장에서 카드 1장을 사요. 마지막에 쓴 카드와 남은 손 카드를 모두 버리고 새로 5장을 뽑아요.',
    art: rect(20, 40, 140, 200, { fill: C.okTint, rx: 16 }) + badge(46, 64, 'A', { r: 13 }) + T(100, 64, '행동', { size: 17 }) + dc(63, 92, '마을', { w: 54, h: 76 }) + T(90, 200, '행동 카드 1장', { size: 15.5 })
      + rect(170, 40, 140, 200, { fill: C.cream, rx: 16 }) + badge(196, 64, 'B', { r: 13 }) + T(250, 64, '구매', { size: 17 }) + coin(220, 116, 14, { label: '2' }) + coin(256, 116, 14, { label: '3' }) + arrow(240, 140, 240, 170, { w: 3 }) + pill(240, 196, '5원짜리 1장', { size: 15 })
      + rect(320, 40, 140, 200, { fill: C.mist, rx: 16 }) + badge(346, 64, 'C', { r: 13 }) + T(400, 64, '정리', { size: 17 }) + pile(370, 96, { w: 46, h: 62, back: true, backFill: '#3A4D6E' }) + T(390, 200, '다 버리고 5장', { size: 15.5 })
      + T(240, 270, '쓰지 않은 동전은 넘어가지 않아요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '덱이 자라요', t: '산 카드는 버린 더미로 갔다가, 섞여서 다시 손에 들어와요',
    d: '산 카드는 바로 쓰지 못하고 버린 더미로 가요. 덱이 떨어지면 버린 더미를 섞어 새 덱을 만드니, 좋은 카드를 살수록 손이 점점 강해져요.',
    art: pile(60, 110, { w: 60, h: 82, back: true, backFill: '#3A4D6E' }) + T(92, 216, '덱', { size: 16 })
      + [0, 1, 2].map((i) => dc(176 + i * 46, 60, ['구리', '은', '마을'][i], { w: 42, h: 62, rot: -6 + i * 6 })).join('') + T(242, 150, '손', { size: 16 })
      + pile(350, 110, { w: 60, h: 82 }) + dc(352, 102, '금', { w: 60, h: 82, hi: true }) + T(382, 216, '버린 더미', { size: 16 }) + T(424, 82, '산 카드', { size: 15.5, fill: C.pt })
      + arrow(130, 120, 172, 100, { w: 3.2 }) + arrow(314, 96, 340, 116, { w: 3.2 }) + arrow(360, 240, 110, 240, { bend: -36, w: 3.2 }) + T(236, 276, '섞어서 다시 덱으로', { size: 15.5, fill: C.ok }),
  },
];

// ---------- 로스트 시티 ----------
const LC = { y: '#E9B949', b: '#3B6FC0', w: '#9AA1AD', g: '#3D9A5E', r: '#D8413F' };
const lcc = (x, y, num, col, o = {}) => card(x, y, { w: o.w || 46, h: o.h || 62, fill: '#FFFDF7', stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2, op: o.op,
  inner: (cx, cy, w, h, x0, y0) => rect(x0 + 4, y0 + 4, w - 8, h - 8, { fill: LC[col], rx: 4, op: 0.25 }) + T(cx, y0 + 17, String(num), { size: num === '투자' ? 15.5 : 18, weight: 800, fill: LC[col] }) });
const column = (x, y, col, nums, o = {}) => nums.map((v, i) => lcc(x, y + i * 26, v, col, o)).join('');
const lostCities = [
  {
    k: '목표', t: '다섯 탐험에 카드를 쌓아, 세 판 점수 합이 높으면 이겨요',
    d: '색깔마다 하나의 탐험이에요. 내 쪽에 색깔별로 숫자 카드를 쌓아 탐험을 이어 가요. 세 판을 해서 점수를 더해요.',
    art: column(40, 40, 'y', ['투자', 3, 6, 9]) + column(126, 40, 'b', [2, 5, 7]) + column(212, 40, 'w', [4]) + column(298, 40, 'g', [5, 8, 9, 10]) + column(384, 40, 'r', [])
      + rect(384, 40, 46, 62, { stroke: C.line, sw: 2.2, rx: 8, dash: '5 5' }) + T(407, 124, '시작 안 함', { size: 15.5, fill: C.muted })
      + pill(240, 252, '세 판 점수를 더해요', { size: 15.5 }),
  },
  {
    k: '놓기', t: '한 탐험에는 앞 카드보다 큰 수만 놓을 수 있어요',
    d: '파란 탐험에 3, 5, 8을 놓았다면 다음에는 9나 10만 놓을 수 있어요. 6처럼 작은 수는 그 탐험에 못 놓으니 버리거나 들고 있어야 해요.',
    art: column(70, 50, 'b', [3, 5, 8]) + lcc(70, 128, 9, 'b', { hi: true }) + ok(150, 156, 16) + T(110, 236, '더 큰 수', { size: 16, fill: C.ok })
      + column(290, 50, 'b', [3, 5, 8]) + lcc(290, 128, 6, 'b', { hi: true }) + no(370, 156, 16) + T(330, 236, '작은 수는 안 돼요', { size: 16, fill: C.pt }),
  },
  {
    k: '점수', t: '시작한 탐험은 숫자 합에서 20을 빼요',
    d: '탐험을 시작하면 20점 비용이 들어요. 4, 6, 9를 놓았다면 19 − 20 = −1점이에요. 투자 카드가 한 장 있으면 결과가 두 배라 −2점이 돼요.',
    art: column(36, 28, 'g', [4, 6, 9]) + T(150, 72, '4 + 6 + 9 = 19', { size: 17, anchor: 'start' }) + T(150, 104, '19 − 20 = −1점', { size: 17, anchor: 'start', fill: C.pt })
      + ['투자', 4, 6, 9].map((v, i) => lcc(36, 150 + i * 26, v, 'g')).join('') + T(150, 186, '투자 카드 1장이면', { size: 16, anchor: 'start' }) + T(150, 216, '(−1) × 2 = −2점', { size: 17, anchor: 'start', fill: C.pt })
      + T(276, 270, '8장 이상이면 20점을 더 받아요', { size: 15.5, fill: C.ok }),
  },
  {
    k: '내 차례', t: '한 장을 놓거나 버리고, 한 장을 가져와요',
    d: '손의 카드 한 장을 내 탐험에 놓거나 같은 색 버린 더미에 버려요. 그다음 카드 더미나 버린 더미 맨 위에서 한 장을 가져와 손을 8장으로 맞춰요.',
    art: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => lcc(24 + i * 30, 196, [2, 4, 7, 3, 9, 5, 8, 10][i], ['y', 'b', 'w', 'g', 'r', 'y', 'b', 'g'][i], { w: 42, h: 58 })).join('') + T(150, 280, '손 8장', { size: 15.5 })
      + rect(40, 40, 140, 96, { fill: C.mist, rx: 14 }) + T(110, 64, '놓기 또는 버리기', { size: 15.5 }) + lcc(88, 80, 7, 'w', { w: 44, h: 50 })
      + pile(300, 60, { w: 50, h: 70, back: true, backFill: '#5F6675' }) + T(330, 160, '더미', { size: 15.5 }) + lcc(390, 60, 6, 'r', { w: 50, h: 70 }) + T(415, 160, '버린 카드 맨 위', { size: 15.5 })
      + arrow(320, 180, 290, 200, { w: 3 }) + arrow(410, 180, 290, 214, { w: 3, dash: '5 5' }) + T(392, 236, '둘 중 하나에서', { size: 15.5, fill: C.pt }),
  },
];

// ---------- 백개먼 ----------
const bgBoard = (x, y, w, h) => {
  let s = rect(x, y + 3, w, h, { fill: C.ink, rx: 10 }) + rect(x, y, w, h, { fill: '#7A5236', stroke: C.ink, sw: 2.4, rx: 10 }) + rect(x + 8, y + 8, w - 16, h - 16, { fill: '#EAD7B0', rx: 4 });
  const bar = x + w / 2;
  s += rect(bar - 9, y + 8, 18, h - 16, { fill: '#7A5236' });
  const tw = (w - 16 - 18) / 12;
  for (let i = 0; i < 12; i++) {
    const tx = x + 8 + i * tw + (i >= 6 ? 18 : 0);
    const col = i % 2 ? '#C9A46B' : '#3E8E6E';
    s += poly([[tx, y + 8], [tx + tw, y + 8], [tx + tw / 2, y + h * 0.42]], { fill: col, stroke: C.ink, sw: 1 });
    s += poly([[tx, y + h - 8], [tx + tw, y + h - 8], [tx + tw / 2, y + h * 0.58]], { fill: i % 2 ? '#3E8E6E' : '#C9A46B', stroke: C.ink, sw: 1 });
  }
  return s;
};
const ck = (cx, cy, white, r = 10) => circ(cx, cy + 2, r, { fill: C.ink }) + circ(cx, cy, r, { fill: white ? '#FFF8EC' : '#C0392B', stroke: C.ink, sw: 1.8 });
const ptX = (x, w, i) => { const tw = (w - 34) / 12; return x + 8 + i * tw + (i >= 6 ? 18 : 0) + tw / 2; };
const stackOn = (x, y, w, h, i, top, nCk, white) => { let s = ''; for (let k = 0; k < nCk; k++) s += ck(ptX(x, w, i), top ? y + 20 + k * 18 : y + h - 20 - k * 18, white, 9); return s; };
const backgammon = [
  {
    k: '목표', t: '내 말 15개를 한 바퀴 돌려, 먼저 다 빼내면 이겨요',
    d: '두 사람이 서로 반대 방향으로 말을 옮겨요. 내 말이 모두 내 홈 여섯 칸에 들어오면 그때부터 판 밖으로 빼낼 수 있고, 15개를 먼저 다 빼면 이겨요.',
    art: bgBoard(30, 40, 420, 190) + stackOn(30, 40, 420, 190, 0, true, 5, true) + stackOn(30, 40, 420, 190, 4, true, 3, false) + stackOn(30, 40, 420, 190, 6, true, 5, false) + stackOn(30, 40, 420, 190, 11, true, 2, true)
      + stackOn(30, 40, 420, 190, 0, false, 5, false) + stackOn(30, 40, 420, 190, 4, false, 3, true) + stackOn(30, 40, 420, 190, 6, false, 5, true) + stackOn(30, 40, 420, 190, 11, false, 2, false)
      + T(240, 264, '15개를 먼저 다 빼내면 승리', { size: 16, fill: C.pt }),
  },
  {
    k: '주사위', t: '주사위 두 개의 숫자만큼 옮기고, 같은 숫자면 네 번 옮겨요',
    d: '5와 3이 나오면 한 말을 5칸, 다른 말을 3칸 옮기거나 한 말을 8칸 옮겨요. 같은 숫자(더블)가 나오면 그 숫자로 네 번 옮겨요.',
    art: die(70, 80, 5) + die(120, 80, 3) + T(220, 72, '5칸 + 3칸', { size: 17 }) + T(220, 102, '또는 한 말로 8칸', { size: 15.5, fill: C.ink2 })
      + die(70, 190, 4) + die(120, 190, 4) + T(240, 184, '더블이면', { size: 17 }) + T(240, 214, '4칸씩 네 번!', { size: 17, fill: C.pt })
      + [0, 1, 2, 3].map((i) => badge(352 + i * 30, 200, String(i + 1), { r: 12 })).join(''),
  },
  {
    k: '잡기와 막기', t: '혼자 있는 상대 말은 잡고, 두 개 이상 있는 칸엔 못 가요',
    d: '상대 말이 하나만 있는 칸에 멈추면 그 말을 잡아 가운데 바로 보내요. 상대 말이 두 개 이상 쌓인 칸은 막혀서 멈출 수 없어요.',
    art: rect(30, 50, 190, 170, { fill: '#EAD7B0', stroke: C.ink, sw: 2, rx: 10 }) + poly([[60, 220], [100, 220], [80, 110]], { fill: '#3E8E6E', stroke: C.ink, sw: 1.2 }) + ck(80, 200, false, 11) + ck(120, 100, true, 11) + arrow(126, 112, 90, 186, { bend: 20, w: 3 })
      + rect(160, 70, 40, 120, { fill: '#7A5236', rx: 4 }) + ck(180, 130, false, 11) + arrow(92, 196, 168, 136, { bend: -20, w: 2.6, dash: '4 4', c: C.muted }) + T(125, 248, '잡아서 바로', { size: 15.5, fill: C.ok })
      + rect(260, 50, 190, 170, { fill: '#EAD7B0', stroke: C.ink, sw: 2, rx: 10 }) + poly([[335, 220], [375, 220], [355, 110]], { fill: '#C9A46B', stroke: C.ink, sw: 1.2 }) + ck(355, 200, false, 11) + ck(355, 178, false, 11) + no(400, 150, 16)
      + ck(300, 100, true, 11) + arrow(306, 112, 340, 166, { w: 3, dash: '5 5' }) + T(355, 248, '두 개 이상은 막혀요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '빼내기', t: '15개가 모두 홈에 들어오면 주사위 수로 빼내요',
    d: '내 말이 모두 마지막 여섯 칸(홈)에 들어와야 빼낼 수 있어요. 주사위 숫자에 맞는 칸의 말을 판 밖으로 내보내요. 하나라도 홈 밖에 있으면 아직 못 빼요.',
    art: rect(40, 60, 260, 150, { fill: '#EAD7B0', stroke: C.ink, sw: 2, rx: 10 }) + [0, 1, 2, 3, 4, 5].map((i) => poly([[50 + i * 40, 210], [86 + i * 40, 210], [68 + i * 40, 110]], { fill: i % 2 ? '#C9A46B' : '#3E8E6E', stroke: C.ink, sw: 1.2 }) + T(68 + i * 40, 230, String(6 - i), { size: 13 })).join('')
      + [3, 2, 3, 2, 3, 2].map((k, i) => Array.from({ length: k }, (_, j) => ck(68 + i * 40, 196 - j * 20, true, 10)).join('')).join('')
      + die(360, 90, 4) + arrow(148, 120, 340, 170, { bend: -30, w: 3.4 }) + ck(380, 180, true, 12) + T(380, 230, '판 밖으로', { size: 15.5, fill: C.ok })
      + T(170, 40, '내 홈 여섯 칸', { size: 15.5 }),
  },
];

export default { 'sushi-go': sushiGo, 'penguin-party': penguinParty, 'jungle-speed': jungleSpeed, 'indian-poker': indianPoker, 'no-thanks': noThanks, skull, 'seven-wonders-duel': sevenWondersDuel, wingspan, dominion, 'lost-cities': lostCities, backgammon };
