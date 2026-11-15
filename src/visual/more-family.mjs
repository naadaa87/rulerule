// 가족 게임 그림 설명 (추가)
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, motion, card, pile, person, hand, die, pawn, coin, crown, house, table, eye } from './kit.mjs';
import { pc, suit, envelope, bill } from './parts.mjs';

// ---------- 부루마불 ----------
const cityCell = (x, y, w, h, name, col) => rect(x, y + 3, w, h, { fill: C.ink, rx: 10 }) + rect(x, y, w, h, { fill: C.paper, stroke: C.ink, sw: 2.4, rx: 10 })
  + rect(x + 4, y + 4, w - 8, 30, { fill: col, rx: 7 }) + T(x + w / 2, y + 19.5, name, { size: 16, fill: '#fff' });
const palm = (cx, cy) => path(`M${cx} ${cy}C${cx - 2} ${cy - 20} ${cx + 4} ${cy - 34} ${cx + 8} ${cy - 44}`, { stroke: C.brown, sw: 6, cap: 'round' })
  + [[-26, -6], [-18, -20], [2, -24], [22, -14], [26, 2]].map(([a, b]) => path(`M${cx + 8} ${cy - 44}Q${cx + 8 + a * 0.6} ${cy - 44 + b - 6} ${cx + 8 + a} ${cy - 44 + b}`, { stroke: C.green, sw: 6, cap: 'round' })).join('');
const rocket = (cx, cy, s = 1) => g(path('M0 -40C16 -24 16 6 10 22H-10C-16 6 -16 -24 0 -40Z', { fill: C.paper, stroke: C.ink, sw: 2.4 }) + circ(0, -10, 7, { fill: C.sky, stroke: C.ink, sw: 2 })
  + path('M-10 10L-24 28L-10 22ZM10 10L24 28L10 22Z', { fill: C.pt, stroke: C.ink, sw: 2 }) + path('M-6 24L0 42L6 24Z', { fill: C.gold, stroke: C.ink, sw: 2 }), { x: cx, y: cy, s, rot: 30 });
const key = (cx, cy, s = 1) => g(circ(-8, 0, 7, { stroke: C.ink, sw: 3.4 }) + path('M-1 0H14M8 0V6M13 0V5', { stroke: C.ink, sw: 3.4, cap: 'round' }), { x: cx, y: cy, s });
const bboard = (x, y, S) => {
  const c = S / 6;
  let s = rect(x, y, S, S, { fill: C.paper, stroke: C.ink, sw: 2.4, rx: 6 }) + rect(x + c, y + c, S - 2 * c, S - 2 * c, { fill: C.table, stroke: C.ink, sw: 2 });
  for (let i = 1; i < 6; i++) s += line(x + i * c, y, x + i * c, y + c, { sw: 1.5 }) + line(x + i * c, y + S - c, x + i * c, y + S, { sw: 1.5 }) + line(x, y + i * c, x + c, y + i * c, { sw: 1.5 }) + line(x + S - c, y + i * c, x + S, y + i * c, { sw: 1.5 });
  [[0, 0], [5, 0], [0, 5]].forEach(([a, b]) => { s += rect(x + a * c + 2, y + b * c + 2, c - 4, c - 4, { fill: C.cream, rx: 3 }); });
  s += rect(x + 5 * c + 2, y + 5 * c + 2, c - 4, c - 4, { fill: C.ptTint, rx: 3 });
  return s;
};
const burumabul = [
  {
    k: '목표', t: '도시를 사고 통행료를 받아요',
    d: '주사위를 굴려 판을 돌며 도시를 사요. 내 도시에 다른 사람이 멈추면 통행료를 받아요. 돈이 떨어지지 않고 끝까지 남으면 이겨요.',
    art: cityCell(36, 44, 160, 200, '서울', C.blue) + house(86, 120, C.ok, 1.7) + house(146, 120, C.ok, 1.7) + pawn(116, 196, C.red, { s: 1.4 })
      + person(292, 76, { fill: C.okTint, label: '도시 주인' }) + person(292, 206, { fill: C.ptTint, label: '멈춘 사람' })
      + arrow(390, 220, 390, 96, {}) + coin(424, 132) + coin(440, 158) + coin(424, 184) + T(428, 226, '통행료', { size: 17, fill: C.pt }),
  },
  {
    k: '준비', t: '말은 출발 칸에, 황금열쇠는 가운데에',
    d: '황금열쇠 카드를 섞어 판 가운데에 엎어 놓고, 말을 모두 출발 칸에 세워요. 돈은 상자 속 설명서에 적힌 만큼 나눠 가져요.',
    art: bboard(28, 34, 234) + pile(118, 112, { w: 50, h: 68, fill: '#F6D873', inner: (cx, cy) => key(cx, cy, 1.2) }) + pawn(232, 240, C.red, { s: 0.85 }) + pawn(250, 252, C.blue, { s: 0.85 })
      + arrow(322, 262, 272, 252, { bend: -6 }) + pill(366, 262, '출발 칸', { size: 15, bg: C.pt })
      + die(318, 70, 3) + die(372, 70, 5) + T(430, 70, '2개', { size: 18 })
      + bill(300, 132) + bill(308, 142, { fill: '#F9D8B0' }) + bill(316, 152, { fill: '#C9DCF5' }) + T(424, 158, '돈 나누기', { size: 16 }),
  },
  {
    k: '내 차례', t: '주사위 2개를 굴려 나온 만큼 가요',
    d: '두 주사위의 수를 더한 만큼 말을 옮겨요. 두 주사위가 같은 수(더블)면 한 번 더 굴려요.',
    art: die(56, 62, 3) + die(110, 62, 4) + T(184, 62, '= 7칸', { size: 26, weight: 800 })
      + die(318, 62, 5, { fill: C.ptTint }) + die(372, 62, 5, { fill: C.ptTint }) + pill(430, 62, '더블', { size: 16, bg: C.pt })
      + Array.from({ length: 8 }, (_, i) => rect(24 + i * 54, 150, 54, 70, { fill: i === 7 ? C.ptTint : C.paper, stroke: C.ink, sw: 2 }) + (i > 0 && i < 7 ? T(51 + i * 54, 204, i, { size: 14, fill: C.muted }) : '')).join('')
      + pawn(51, 186, C.red, { s: 1.1, op: 0.3 }) + pawn(429, 186, C.red, { s: 1.1 }) + arrow(62, 140, 420, 140, { bend: 34 })
      + T(240, 262, '더블이면 옮긴 뒤에 한 번 더 굴려요', { size: 16, fill: C.ink2 }),
  },
  {
    k: '도시', t: '빈 도시는 사고, 남의 도시에선 통행료를 내요',
    d: '주인 없는 도시에 멈추면 은행에 값을 내고 증서를 살 수 있어요. 주인이 있는 도시라면 통행료를 내요. 건물이 있으면 더 비싸요.',
    art: pill(120, 28, '주인 없는 도시', { size: 15 }) + cityCell(66, 52, 108, 124, '파리', C.green) + pawn(120, 138, C.red, { s: 1.15 })
      + coin(56, 228) + arrow(78, 228, 122, 228, {}) + card(134, 204, { w: 76, h: 48, inner: (cx, cy) => T(cx, cy, '증서', { size: 16 }) })
      + line(240, 24, 240, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + pill(360, 28, '남의 도시', { size: 15, bg: C.pt }) + cityCell(306, 52, 108, 124, '도쿄', C.red) + house(338, 118, C.ok, 1.3) + pawn(382, 138, C.blue, { s: 1.15 })
      + coin(286, 228) + coin(308, 228) + arrow(328, 228, 372, 228, {}) + person(416, 216, { s: 0.8, fill: C.okTint, label: '주인' }),
  },
  {
    k: '특별한 칸', t: '무인도에선 쉬고, 우주여행은 원하는 칸으로',
    d: '무인도에 가면 세 차례를 쉬어요. 그사이 더블이 나오면 바로 나와요. 우주여행 칸에 멈추면 다음 차례에 원하는 칸으로 바로 가요.',
    art: rect(24, 24, 204, 252, { fill: C.paper, stroke: C.line, sw: 2, rx: 16 }) + pill(126, 50, '무인도', { size: 16 })
      + path('M60 150Q78 142 96 150T132 150T168 150T196 150', { stroke: C.sky, sw: 4, cap: 'round' }) + ell(126, 146, 52, 14, { fill: '#F2D9A0', stroke: C.ink, sw: 2.2 }) + palm(118, 140)
      + T(126, 200, '세 차례 쉬어요', { size: 17 }) + T(126, 232, '더블이면 바로 탈출', { size: 16, fill: C.pt })
      + rect(252, 24, 204, 252, { fill: C.paper, stroke: C.line, sw: 2, rx: 16 }) + pill(354, 50, '우주여행', { size: 16, bg: C.pt })
      + rocket(346, 122, 1) + motion(318, 150, 6, 110, 160, { count: 3 })
      + T(354, 200, '다음 차례에', { size: 17 }) + T(354, 232, '원하는 칸으로 가요', { size: 16, fill: C.pt }),
  },
];

// ---------- 클루 ----------
const whoI = (cx, cy) => circ(cx, cy - 8, 9, { fill: C.ink }) + path(`M${cx - 15} ${cy + 15}q0 -13 15 -13q15 0 15 13z`, { fill: C.ink });
const ropeI = (cx, cy) => ell(cx, cy - 2, 14, 9, { stroke: C.brown, sw: 4 }) + ell(cx, cy + 4, 14, 9, { stroke: C.brown, sw: 4 }) + path(`M${cx + 12} ${cy + 8}q8 4 6 12`, { stroke: C.brown, sw: 4, cap: 'round' });
const roomI = (cx, cy) => rect(cx - 13, cy - 16, 26, 32, { fill: C.cream, stroke: C.ink, sw: 2.4, rx: 2 }) + circ(cx + 6, cy + 1, 2.2, { fill: C.ink });
const ccard = (x, y, icon, label, o = {}) => card(x, y, { w: o.w || 96, h: o.h || 110, op: o.op, inner: (cx, cy, w, h) => icon(cx, cy - h * 0.14) + (label ? T(cx, cy + h * 0.32, label, { size: o.ls || 16 }) : '') });
const clue = [
  {
    k: '목표', t: '봉투 속 세 장을 먼저 맞혀요',
    d: '사건 봉투에는 범인, 도구, 장소 카드가 한 장씩 들어 있어요. 이 세 장이 무엇인지 가장 먼저 알아내면 이겨요.',
    art: ccard(36, 22, whoI, '누가?') + ccard(192, 22, ropeI, '무엇으로?') + ccard(348, 22, roomI, '어디서?')
      + arrow(84, 142, 186, 206, { bend: 10 }) + arrow(240, 142, 240, 190, {}) + arrow(396, 142, 294, 206, { bend: -10 })
      + envelope(240, 238, 170, 76) + T(240, 256, '사건 봉투', { size: 16 }),
  },
  {
    k: '준비', t: '종류마다 한 장씩 봉투에 넣어요',
    d: '용의자, 도구, 장소 카드를 따로 섞어 한 장씩 뽑아 아무도 보지 않고 봉투에 넣어요. 남은 카드는 모두 섞어 끝까지 나눠 가져요.',
    art: pile(30, 36, { w: 46, h: 64, back: true }) + pile(124, 36, { w: 46, h: 64, back: true }) + pile(218, 36, { w: 46, h: 64, back: true })
      + T(56, 122, '용의자', { size: 16 }) + T(150, 122, '도구', { size: 16 }) + T(244, 122, '장소', { size: 16 })
      + arrow(56, 142, 116, 208, { bend: 8 }) + arrow(150, 142, 150, 196, {}) + arrow(244, 142, 184, 208, { bend: -8 }) + envelope(150, 240, 130, 64) + T(150, 256, '1장씩', { size: 16, fill: C.pt })
      + line(300, 24, 300, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + pile(366, 30, { w: 46, h: 64, back: true }) + T(389, 116, '남은 카드', { size: 16 })
      + arrow(372, 136, 336, 196, {}) + arrow(389, 136, 389, 190, {}) + arrow(406, 136, 442, 196, {})
      + person(330, 232, { s: 0.7 }) + person(389, 232, { s: 0.7, fill: C.ptTint }) + person(448, 232, { s: 0.7 }),
  },
  {
    k: '내 차례', t: '방에 들어가면 추리를 말해요',
    d: '주사위를 굴려 말을 옮겨요. 방에 들어갔다면 그 방을 넣어 “누가, 무엇으로, 이 방에서”라고 말해요. 복도에서는 추리할 수 없어요.',
    art: rect(28, 62, 186, 180, { fill: C.cream, stroke: C.ink, sw: 3, rx: 4 }) + rect(190, 196, 30, 34, { fill: C.cream }) + line(214, 196, 214, 230, { stroke: C.cream, sw: 6 })
      + pill(121, 62, '서재', { size: 16 }) + pawn(96, 160, C.pt, { s: 1.4 }) + pawn(156, 170, C.yellow, { s: 1.1 }) + arrow(262, 236, 208, 214, { bend: -8 })
      + die(270, 258, 4, { s: 34 })
      + bubble(346, 92, '노랑이, 밧줄로, 서재에서!', { tail: 'bl', size: 16 }) + person(296, 168, { fill: C.ptTint, s: 0.95 }),
  },
  {
    k: '확인', t: '가진 사람이 한 장만 몰래 보여 줘요',
    d: '왼쪽 사람부터 차례로, 내가 말한 카드 중 하나를 가지고 있으면 나에게만 한 장 보여 줘요. 본 카드는 정답이 아니니 수첩에서 지워요.',
    art: person(70, 208, { fill: C.ptTint, label: '나' }) + person(250, 208, { label: '왼쪽 사람' })
      + ccard(128, 96, ropeI, '밧줄', { w: 66, h: 88, ls: 15.5 }) + eye(74, 150, 1.1) + arrow(262, 174, 204, 126, { bend: 16, w: 3.5, head: 11 })
      + rect(316, 26, 150, 132, { fill: C.paper, stroke: C.ink, sw: 2.2, rx: 8 }) + T(391, 46, '추리 수첩', { size: 15.5, fill: C.muted })
      + T(334, 76, '노랑', { size: 16, anchor: 'start' }) + T(334, 104, '밧줄', { size: 16, anchor: 'start', fill: C.muted }) + T(334, 132, '서재', { size: 16, anchor: 'start' })
      + line(330, 104, 372, 104, { stroke: C.pt, sw: 3 }) + no(440, 104, 11) + T(440, 76, '?', { size: 18, fill: C.muted }) + T(440, 132, '?', { size: 18, fill: C.muted })
      + T(391, 196, '밧줄은 정답이', { size: 16 }) + T(391, 222, '아니에요', { size: 16 }),
  },
  {
    k: '끝', t: '확신이 서면 봉투를 열어 고발해요',
    d: '내 차례에 세 장을 말하고 봉투를 혼자 확인해요. 모두 맞으면 이겨요. 하나라도 틀리면 그 뒤로는 추리하지 못하고 카드만 보여 줘요.',
    art: ccard(34, 40, whoI, '', { w: 54, h: 74 }) + ccard(98, 40, ropeI, '', { w: 54, h: 74 }) + ccard(162, 40, roomI, '', { w: 54, h: 74 })
      + ok(61, 132, 12) + ok(125, 132, 12) + ok(189, 132, 12) + crown(125, 186, 1.3) + T(125, 232, '세 장 모두 맞으면 승리', { size: 16 })
      + line(240, 24, 240, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + ccard(264, 40, whoI, '', { w: 54, h: 74 }) + ccard(328, 40, ropeI, '', { w: 54, h: 74 }) + ccard(392, 40, roomI, '', { w: 54, h: 74 })
      + ok(291, 132, 12) + ok(355, 132, 12) + no(419, 132, 12) + T(355, 186, '하나라도 틀리면', { size: 16 }) + T(355, 216, '더는 추리할 수 없어요', { size: 16, fill: C.pt }),
  },
];

// ---------- 텀블링 몽키 ----------
const SC = [C.red, C.yellow, C.blue];
const stick = (x1, y1, x2, y2, c, o = {}) => g(line(x1, y1, x2, y2, { stroke: C.ink, sw: 7.5 }) + line(x1, y1, x2, y2, { stroke: c, sw: 4.6 }) + circ(x1, y1, 5.5, { fill: c, stroke: C.ink, sw: 1.8 }), { op: o.op });
const monkey = (cx, cy, s = 1) => g(blob([(a) => circ(0, 0, 9, a), (a) => circ(-9, -3, 4, a), (a) => circ(9, -3, 4, a)], '#9A6A3C', 1.8) + ell(0, 2, 6, 5, { fill: '#F4D9B5' }) + circ(-2.6, 0.5, 1.1, { fill: C.ink }) + circ(2.6, 0.5, 1.1, { fill: C.ink })
  + path('M4 8q8 6 4 13', { stroke: '#9A6A3C', sw: 3, cap: 'round' }), { x: cx, y: cy, s });
const treeTube = (cx, top, h) => rect(cx - 46, top, 92, h, { fill: '#EAF5E1', stroke: C.ink, sw: 2.4, rx: 14 })
  + blob([(a) => circ(cx - 34, top - 6, 22, a), (a) => circ(cx, top - 18, 26, a), (a) => circ(cx + 34, top - 6, 22, a)], C.green, 2.2)
  + rect(cx - 56, top + h - 4, 112, 12, { fill: C.wood, stroke: C.ink, sw: 2.2, rx: 5 });
const sticks = (cx, top, list) => list.map(([y, c, tilt, op]) => stick(cx - 72, top + y - tilt, cx + 72, top + y + tilt, SC[c], { op })).join('');
const ST = [[34, 0, 6], [52, 1, -5], [70, 2, 4], [88, 0, -6], [106, 1, 5], [124, 2, -4]];
const tumbling = [
  {
    k: '목표', t: '원숭이를 가장 적게 떨어뜨려요',
    d: '막대를 하나씩 빼다 보면 걸려 있던 원숭이가 떨어져요. 끝났을 때 떨어뜨린 원숭이가 가장 적은 사람이 이겨요.',
    art: treeTube(130, 58, 168) + sticks(130, 58, ST) + monkey(112, 82) + monkey(146, 100) + monkey(120, 120) + monkey(150, 140) + monkey(114, 156)
      + monkey(92, 262, 1.1) + monkey(168, 262, 1.1) + arrow(130, 244, 130, 276, { w: 3.5, head: 11 })
      + person(310, 110, { fill: C.okTint }) + crown(310, 66, 1) + monkey(294, 164) + monkey(326, 164) + T(310, 196, '2마리', { size: 17 })
      + person(410, 110, {}) + [0, 1, 2, 3, 4, 5].map((i) => monkey(378 + (i % 3) * 32, 164 + Math.floor(i / 3) * 26)).join('') + T(410, 226, '6마리', { size: 17 }),
  },
  {
    k: '준비', t: '막대를 꽂고 위에서 원숭이를 넣어요',
    d: '나무 통의 구멍에 막대를 엇갈리게 모두 꽂아요. 그다음 위에서 원숭이를 넣어 막대에 걸리게 해요.',
    art: treeTube(210, 86, 160) + sticks(210, 86, ST.slice(1)) + stick(40, 112, 150, 118, SC[0]) + arrow(60, 96, 128, 100, { bend: -6 })
      + badge(36, 74, 1) + T(96, 74, '막대 꽂기', { size: 16 })
      + monkey(200, 126) + monkey(224, 146) + monkey(330, 46, 1.2) + monkey(364, 60, 1.2) + arrow(322, 76, 244, 76, { bend: 14 })
      + badge(342, 110, 2) + T(408, 110, '원숭이 넣기', { size: 16 }),
  },
  {
    k: '내 차례', t: '주사위에 나온 색 막대를 하나 빼요',
    d: '색깔 주사위를 굴려요. 나온 색 막대 중 하나를 골라 끝까지 빼요. 원숭이가 덜 걸린 막대를 고르는 게 요령이에요.',
    art: die(70, 110, 0, { s: 56, inner: (cx, cy, s) => circ(cx, cy, s * 0.28, { fill: C.red, stroke: C.ink, sw: 2 }) }) + T(70, 166, '빨강', { size: 18, fill: C.red })
      + arrow(116, 110, 160, 110, {})
      + treeTube(290, 66, 168) + sticks(290, 66, [ST[1], ST[2], [88, 0, -6, 0.25], ST[4], ST[5]]) + stick(388, 148, 470, 142, C.red) + arrow(376, 128, 440, 118, { bend: -8 })
      + monkey(276, 108) + monkey(304, 126) + monkey(280, 166) + monkey(322, 268, 1.1) + arrow(290, 250, 290, 280, { w: 3.5, head: 11 }),
  },
  {
    k: '끝', t: '떨어진 원숭이는 뺀 사람이 가져가요',
    d: '막대를 빼는 동안 떨어진 원숭이는 모두 내 몫이에요. 원숭이가 다 떨어지면 끝나고, 가장 적게 가진 사람이 이겨요.',
    art: person(110, 96, { fill: C.ptTint, label: '막대를 뺀 사람' }) + monkey(74, 196, 1.3) + monkey(110, 204, 1.3) + monkey(146, 196, 1.3) + arrow(110, 248, 110, 226, { head: 10, w: 3 }) + T(110, 268, '모두 내 몫', { size: 16, fill: C.pt })
      + line(230, 24, 230, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + T(354, 40, '다 떨어지면 세어 봐요', { size: 16 })
      + person(296, 120, { fill: C.okTint }) + crown(296, 76, 1) + T(296, 176, '3마리', { size: 18 }) + ok(296, 214, 14)
      + person(412, 120, {}) + T(412, 176, '7마리', { size: 18 }),
  },
];

// ---------- 원카드 ----------
const joker = (x, y, o = {}) => card(x, y, { ...o, inner: (cx, cy, w, h) => circ(cx, cy - h * 0.12, h * 0.16, { fill: C.gold, stroke: C.ink, sw: 2 }) + circ(cx - h * 0.055, cy - h * 0.14, 1.6, { fill: C.ink }) + circ(cx + h * 0.055, cy - h * 0.14, 1.6, { fill: C.ink }) + T(cx, cy + h * 0.28, '조커', { size: 15.5 }) });
const onecard = [
  {
    k: '목표', t: '손에 든 카드를 먼저 다 내요',
    d: '차례마다 카드를 한 장씩 내서 손을 비워요. 가장 먼저 한 장도 남지 않게 된 사람이 이겨요.',
    art: [0, 1, 2, 3, 4].map((i) => pc(12 + i * 33, 92, ['7', '3', 'K', '9', '2'][i], 'hsdch'[i], { w: 38, h: 56 })).join('') + arrow(190, 120, 216, 120, {})
      + [0, 1, 2].map((i) => pc(226 + i * 33, 92, ['3', 'K', '2'][i], 'sdh'[i], { w: 38, h: 56 })).join('') + arrow(340, 120, 368, 120, {})
      + person(420, 118, { fill: C.okTint }) + crown(420, 72, 1.1) + T(420, 176, '0장', { size: 18 })
      + T(97, 176, '5장', { size: 17, fill: C.muted }) + T(278, 176, '3장', { size: 17, fill: C.muted })
      + pill(240, 250, '가장 먼저 다 내면 이겨요', { size: 16, bg: C.pt }),
  },
  {
    k: '준비', t: '카드를 나누고 한 장을 뒤집어요',
    d: '한 사람에게 5~7장씩 나눠요. 남은 카드는 엎어서 가운데 쌓고, 맨 위 한 장을 뒤집어 옆에 놓아요.',
    art: table(100, 50, 280, 200) + person(240, 26, { s: 0.8 }) + person(56, 150, { s: 0.8 }) + person(424, 150, { s: 0.8 }) + person(240, 276, { s: 0.8, fill: C.ptTint })
      + pile(178, 112, { w: 52, h: 72, back: true }) + pc(252, 112, '7', 'h', { w: 52, h: 72 })
      + T(204, 206, '더미', { size: 16 }) + T(278, 206, '바닥', { size: 16 }) + pill(404, 40, '5~7장씩', { size: 16, bg: C.pt }),
  },
  {
    k: '내 차례', t: '무늬나 숫자가 같은 카드를 내요',
    d: '바닥 맨 위 카드와 무늬가 같거나 숫자가 같은 카드를 한 장 내요. 낼 카드가 없으면 더미에서 한 장을 가져와요.',
    art: pill(76, 40, '바닥', { size: 16 }) + pc(40, 66, '7', 'h', { w: 72, h: 100 })
      + pc(182, 44, '3', 'h', { w: 62, h: 86 }) + pc(282, 44, '7', 's', { w: 62, h: 86 }) + pc(382, 44, 'K', 'c', { w: 62, h: 86 })
      + ok(213, 160, 15) + ok(313, 160, 15) + no(413, 160, 15)
      + T(213, 200, '무늬가', { size: 16 }) + T(213, 224, '같아요', { size: 16 }) + T(313, 200, '숫자가', { size: 16 }) + T(313, 224, '같아요', { size: 16 }) + T(413, 200, '둘 다', { size: 16 }) + T(413, 224, '달라요', { size: 16 })
      + T(76, 214, '하트 7', { size: 17, fill: C.muted }),
  },
  {
    k: '공격', t: '공격 카드를 받으면 카드를 더 가져와요',
    d: '2는 2장, A는 3장, 조커는 5장을 다음 사람이 가져와요. 같은 공격 카드로 받아치면 장수가 쌓여 그다음 사람에게 넘어가요.',
    art: pc(48, 40, '2', 's', { w: 76, h: 104 }) + pc(202, 40, 'A', 'd', { w: 76, h: 104 }) + joker(356, 40, { w: 76, h: 104 })
      + pill(86, 178, '2장 더', { size: 17, bg: C.pt }) + pill(240, 178, '3장 더', { size: 17, bg: C.pt }) + pill(394, 178, '5장 더', { size: 17, bg: C.pt })
      + T(240, 232, '받아치면 장수가 쌓여서 넘어가요', { size: 16 }) + T(240, 260, '장수는 집마다 달라요. 먼저 정하고 시작해요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '외치기', t: '한 장 남으면 “원카드!”',
    d: '카드가 한 장 남으면 바로 “원카드”라고 외쳐요. 깜빡했는데 다른 사람이 먼저 외치면 벌칙으로 한 장을 가져와요.',
    art: person(130, 190, { fill: C.ptTint, s: 1.2 }) + pc(176, 150, '9', 'd', { w: 50, h: 70, rot: 10 }) + bubble(150, 76, '원카드!', { tail: 'bl', size: 22 })
      + line(270, 24, 270, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + T(372, 50, '깜빡했다면', { size: 16, fill: C.muted }) + person(330, 132, { s: 0.85 }) + bubble(410, 100, '원카드!', { tail: 'bl', size: 16 })
      + pile(316, 190, { w: 40, h: 56, back: true, count: 2 }) + arrow(370, 218, 404, 218, {}) + person(436, 214, { s: 0.7, fill: C.ptTint }) + T(372, 274, '벌칙으로 1장', { size: 16, fill: C.pt }),
  },
];

export default { burumabul, clue, 'tumbling-monkey': tumbling, 'one-card': onecard };
