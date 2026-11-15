// 전략 게임 그림 설명 (추가)
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, motion, card, pile, person, hand, pawn, crown, star, table, big, house } from './kit.mjs';

const dash = (x, y1 = 24, y2 = 276) => line(x, y1, x, y2, { stroke: C.line, sw: 2, dash: '5 6' });

// ---------- 체스 ----------
const LQ = '#FBF3E4', DQ = '#D2B48C';
// dark(c, r): 그 칸이 어두운 칸인지
const cboard = (x, y, cell, cols, rows, dark) => {
  let s = rect(x - 3, y - 3, cols * cell + 6, rows * cell + 6, { fill: C.ink, rx: 5 });
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += rect(x + c * cell, y + r * cell, cell, cell, { fill: dark(c, r) ? DQ : LQ });
  return s;
};
const PIECE = {
  P: (a) => [circ(0, -7, 5.2, a), path('M-7 10C-7 2 -4 -3 0 -3C4 -3 7 2 7 10Z', a), rect(-9, 8, 18, 4.5, { ...a, rx: 2 })].join(''),
  R: (a) => path('M-9 12H9V8H7V-3H9V-11H5V-8H2V-11H-2V-8H-5V-11H-9V-3H-7V8H-9Z', a),
  B: (a) => path('M-8 12H8V8H5C8 2 6 -5 0 -11C-6 -5 -8 2 -5 8H-8Z', a) + circ(0, -13, 2.4, a),
  N: (a) => path('M-8 12H9V8H7C9 0 7 -9 -1 -12L-3 -9C-8 -8 -10 -3 -11 1L-8 4L-3 0C-3 4 -6 6 -6 8H-8Z', a),
  Q: (a) => path('M-9 12H9V8H7L10 -7L5 -1L3 -10L0 -1L-3 -10L-5 -1L-10 -7L-7 8H-9Z', a) + [[10, -8], [3, -11], [-3, -11], [-10, -8]].map(([px, py]) => circ(px, py, 2, a)).join(''),
  K: (a) => path('M-9 12H9V8H7C11 2 9 -4 2 -5V-8H5V-11H2V-14H-2V-11H-5V-8H-2V-5C-9 -4 -11 2 -7 8H-9Z', a),
};
const cp = (k, cx, cy, col = 'w', s = 1.5, o = {}) => g(g(PIECE[k]({ fill: col === 'w' ? '#fff' : '#2B2F38', stroke: C.ink, sw: 1.7, join: 'round' }), { s }), { x: cx, y: cy, op: o.op });
const sq = (x, y, cell, c, r) => [x + c * cell + cell / 2, y + r * cell + cell / 2];
const dotAt = (x, y, cell, list, c = C.pt) => list.map(([cc, rr]) => circ(x + cc * cell + cell / 2, y + rr * cell + cell / 2, cell * 0.17, { fill: c, stroke: '#fff', sw: 1.5 })).join('');
const rays = (x, y, cell, c0, r0, dirs, len = 2) => dirs.map(([dx, dy]) => { const [a, b] = sq(x, y, cell, c0, r0); return arrow(a + dx * cell * 0.5, b + dy * cell * 0.5, a + dx * cell * (len + 0.3), b + dy * cell * (len + 0.3), { w: 3, head: 9 }); }).join('');
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIAG = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
const mini = (x, y, k, extra, name, note) => cboard(x, y, 26, 5, 5, (c, r) => (c + r) % 2 === 1) + extra + cp(k, x + 65, y + 65, 'w', 1.05) + pill(x + 65, y + 158, name, { size: 16 }) + T(x + 65, y + 190, note, { size: 15.5 });
const chess = [
  {
    k: '목표', t: '상대 킹을 꼼짝 못 하게 하면 이겨요',
    d: '킹이 공격받고 있는데 피할 칸도, 막을 방법도 없는 상태를 체크메이트라고 해요. 체크메이트를 만든 사람이 이겨요. 킹을 실제로 잡지는 않아요.',
    art: cboard(40, 46, 52, 4, 4, (c, r) => (c - r) % 2 !== 0) + cp('K', 222, 72, 'b', 1.7) + cp('Q', 170, 124, 'w', 1.7) + cp('K', 118, 176, 'w', 1.7)
      + ring(222, 72, 24) + arrow(184, 110, 206, 88, { w: 3.5, head: 10 })
      + pill(366, 70, '체크메이트', { size: 17, bg: C.pt }) + T(366, 124, '킹이 공격받는데', { size: 16 }) + T(366, 152, '피할 칸이 없어요', { size: 16 })
      + crown(366, 210, 1.3) + T(366, 248, '흰색 승리', { size: 16, fill: C.muted }),
  },
  {
    k: '준비', t: '뒷줄은 룩, 나이트, 비숍, 가운데에 퀸과 킹',
    d: '맨 뒷줄 바깥부터 룩, 나이트, 비숍을 놓고 가운데 두 칸에 퀸과 킹을 놓아요. 퀸은 자기 색 칸에 서요. 둘째 줄에는 폰 8개를 나란히 놓아요.',
    art: cboard(32, 84, 52, 8, 2, (c, r) => (r === 0 ? c % 2 === 1 : c % 2 === 0))
      + Array.from({ length: 8 }, (_, i) => cp('P', 58 + i * 52, 110, 'w', 1.35)).join('') + 'RNBQKBNR'.split('').map((k, i) => cp(k, 58 + i * 52, 162, 'w', 1.45)).join('')
      + ['룩', '나이트', '비숍', '퀸', '킹', '비숍', '나이트', '룩'].map((nm, i) => T(58 + i * 52, 210, nm, { size: 15.5, fill: i === 3 ? C.pt : C.ink })).join('')
      + pill(214, 36, '흰 퀸은 밝은 칸에', { size: 15.5, bg: C.pt }) + arrow(214, 52, 214, 78, { w: 3, head: 9 })
      + T(240, 258, '각자 오른쪽 아래 칸이 밝은 칸이 되게 놓아요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '움직임 1', t: '룩은 곧게, 비숍은 비스듬히, 퀸은 둘 다',
    d: '룩은 가로와 세로로, 비숍은 대각선으로 원하는 만큼 가요. 퀸은 두 가지를 모두 할 수 있어요. 셋 다 다른 기물을 뛰어넘지는 못해요.',
    art: mini(20, 30, 'R', rays(20, 30, 26, 2, 2, ORTH), '룩', '가로와 세로')
      + mini(175, 30, 'B', rays(175, 30, 26, 2, 2, DIAG), '비숍', '대각선')
      + mini(330, 30, 'Q', rays(330, 30, 26, 2, 2, [...ORTH, ...DIAG]), '퀸', '어느 쪽이든'),
  },
  {
    k: '움직임 2', t: '킹은 한 칸, 나이트는 뛰어넘고, 폰은 앞으로',
    d: '킹은 어느 쪽으로든 한 칸만 가요. 나이트는 두 칸 간 뒤 옆으로 한 칸 가고, 다른 기물을 뛰어넘어요. 폰은 앞으로 한 칸 가고, 잡을 때만 대각선 앞으로 가요.',
    art: mini(20, 30, 'K', dotAt(20, 30, 26, [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [1, 3], [2, 3], [3, 3]]), '킹', '어디로든 한 칸')
      + mini(175, 30, 'N', dotAt(175, 30, 26, [[1, 0], [3, 0], [0, 1], [4, 1], [0, 3], [4, 3], [1, 4], [3, 4]]), '나이트', '두 칸 + 옆으로 한 칸')
      + cboard(330, 30, 26, 5, 5, (c, r) => (c + r) % 2 === 1) + dotAt(330, 30, 26, [[2, 2], [2, 1]]) + dotAt(330, 30, 26, [[1, 2], [3, 2]], C.blue) + cp('P', 395, 121, 'w', 1.05)
      + pill(395, 188, '폰', { size: 16 }) + T(395, 220, '앞으로 한 칸', { size: 15.5 }) + T(395, 244, '잡을 땐 대각선', { size: 15.5, fill: C.blue }),
  },
  {
    k: '특별한 수', t: '캐슬링과 폰의 승급',
    d: '킹과 룩이 한 번도 움직이지 않았고 사이가 비어 있으면, 킹을 룩 쪽으로 두 칸 옮기고 룩을 킹 건너편에 놓을 수 있어요. 폰이 맞은편 끝줄에 닿으면 퀸 같은 다른 기물로 바꿔요.',
    art: pill(130, 30, '캐슬링', { size: 16 })
      + cboard(30, 56, 50, 4, 1, (c) => c % 2 === 0) + cp('K', 55, 81, 'w', 1.5) + cp('R', 205, 81, 'w', 1.5) + arrow(72, 122, 148, 122, { bend: -14, w: 3.5, head: 10 }) + arrow(196, 122, 112, 122, { bend: -30, w: 3.5, head: 10, c: C.blue })
      + cboard(30, 166, 50, 4, 1, (c) => c % 2 === 0) + cp('R', 105, 191, 'w', 1.5) + cp('K', 155, 191, 'w', 1.5)
      + T(130, 244, '킹은 두 칸, 룩은 그 건너편', { size: 15.5 })
      + dash(264) + pill(372, 30, '승급', { size: 16, bg: C.pt })
      + cboard(300, 56, 50, 1, 3, (c, r) => r % 2 === 1) + cp('P', 325, 181, 'w', 1.5, { op: 0.35 }) + cp('Q', 325, 81, 'w', 1.6) + arrow(325, 160, 325, 112, { w: 3.5, head: 10 })
      + T(412, 100, '끝줄에', { size: 16 }) + T(412, 126, '닿으면', { size: 16 }) + T(412, 166, '퀸으로', { size: 17, fill: C.pt }) + T(412, 192, '바꿔요', { size: 16 }),
  },
  {
    k: '끝', t: '체크는 벗어나야 하고, 둘 곳이 없으면 비겨요',
    d: '킹이 공격받는 체크 상태가 되면 피하거나, 막거나, 공격한 기물을 잡아야 해요. 체크가 아닌데 둘 수 있는 수가 하나도 없으면 스테일메이트로 비겨요.',
    art: pill(120, 30, '체크', { size: 16 })
      + cboard(22, 60, 40, 5, 1, (c) => c % 2 === 1) + cp('R', 42, 80, 'w', 1.25) + cp('K', 202, 80, 'b', 1.25) + arrow(64, 80, 176, 80, { w: 3.5, head: 10 })
      + T(120, 136, '피하거나, 막거나,', { size: 16 }) + T(120, 162, '잡아야 해요', { size: 16 })
      + T(120, 216, '내 킹이 공격받게 되는', { size: 15.5, fill: C.muted }) + T(120, 240, '수는 둘 수 없어요', { size: 15.5, fill: C.muted })
      + dash(250) + pill(364, 30, '스테일메이트', { size: 16, bg: C.muted })
      + cboard(304, 56, 40, 3, 3, (c, r) => (c - r) % 2 === 0) + cp('K', 404, 76, 'b', 1.25) + cp('Q', 364, 156, 'w', 1.25) + dotAt(304, 56, 40, [[1, 0], [1, 1], [2, 1]], C.muted)
      + T(364, 210, '체크는 아닌데', { size: 16 }) + T(364, 236, '갈 곳이 없으면 무승부', { size: 16 }),
  },
];

// ---------- 티츄 ----------
const TS = { j: '#2E9E6B', s: '#2A2F3A', p: C.blue, r: C.red };
const tc = (x, y, v, c, o = {}) => card(x, y, { w: o.w || 50, h: o.h || 70, rot: o.rot || 0, op: o.op, inner: (cx, cy, w, h) => T(cx, cy - h * 0.12, v, { size: h * 0.38, weight: 800, fill: TS[c] }) + circ(cx, cy + h * 0.28, h * 0.07, { fill: TS[c] }) });
const sp = (x, y, name, fill, o = {}) => card(x, y, { w: o.w || 70, h: o.h || 96, fill, inner: (cx, cy) => T(cx, cy, name, { size: 18, weight: 800, fill: o.fg || C.ink }) });
const tichu = [
  {
    k: '목표', t: '마주 앉은 사람과 한 편이에요',
    d: '넷이서 둘씩 편을 먹어요. 마주 보는 사람이 우리 편이에요. 카드를 먼저 털고 점수 카드를 모아, 우리 편 점수가 먼저 1,000점이 되면 이겨요.',
    art: table(130, 70, 220, 160) + line(240, 82, 240, 218, { stroke: C.pt, sw: 5, dash: '2 9' }) + line(142, 150, 338, 150, { stroke: C.blue, sw: 5, dash: '2 9' })
      + person(240, 44, { s: 0.9, fill: C.ptTint }) + person(240, 262, { s: 0.9, fill: C.ptTint }) + person(84, 150, { s: 0.9, fill: '#DCE8FA' }) + person(396, 150, { s: 0.9, fill: '#DCE8FA' })
      + pill(326, 40, '우리 편', { size: 15.5, bg: C.pt }) + pill(424, 208, '상대 편', { size: 15.5, bg: C.blue })
      + T(80, 262, '먼저 1,000점', { size: 17, fill: C.pt }),
  },
  {
    k: '준비', t: '8장, 6장을 받고 3장을 건네요',
    d: '먼저 8장을 받아요. 자신 있으면 이때 라지 티츄를 외쳐요. 6장을 더 받아 14장이 되면, 다른 세 사람에게 한 장씩 엎어서 건네요.',
    art: badge(30, 36, 1) + T(88, 36, '8장 받기', { size: 16 }) + [0, 1, 2, 3].map((i) => card(34 + i * 22, 70, { w: 40, h: 56, back: true })).join('') + T(80, 152, '8장', { size: 18 })
      + pill(80, 196, '라지 티츄?', { size: 15.5, bg: C.pt }) + T(80, 232, '지금만 외칠 수', { size: 15.5, fill: C.muted }) + T(80, 256, '있어요', { size: 15.5, fill: C.muted })
      + dash(160) + badge(184, 36, 2) + T(248, 36, '6장 더 받기', { size: 16 }) + [0, 1, 2].map((i) => card(196 + i * 22, 70, { w: 40, h: 56, back: true })).join('') + T(240, 152, '모두 14장', { size: 18 })
      + dash(320) + badge(338, 36, 3) + T(408, 36, '1장씩 건네기', { size: 15.5 })
      + person(400, 226, { s: 0.8, fill: C.ptTint }) + person(346, 106, { s: 0.65 }) + person(400, 86, { s: 0.65 }) + person(454, 106, { s: 0.65 })
      + arrow(384, 196, 352, 136, { w: 3, head: 9 }) + arrow(400, 192, 400, 116, { w: 3, head: 9 }) + arrow(416, 196, 448, 136, { w: 3, head: 9 }),
  },
  {
    k: '내 차례', t: '같은 조합으로 더 세게 내요',
    d: '앞사람이 페어를 냈다면 더 높은 페어만 낼 수 있어요. 낼 수 없거나 내기 싫으면 패스해요. 세 사람이 잇달아 패스하면 마지막에 낸 사람이 바닥 카드를 가져가요.',
    art: pill(86, 34, '앞사람이 낸 카드', { size: 15.5 }) + tc(34, 64, 7, 'r', { w: 54, h: 76 }) + tc(84, 64, 7, 'p', { w: 54, h: 76 }) + T(86, 168, '7 페어', { size: 17, fill: C.muted })
      + dash(186) + tc(214, 36, 9, 'j', { w: 46, h: 64 }) + tc(254, 36, 9, 's', { w: 46, h: 64 }) + ok(326, 68, 14) + T(404, 56, '더 높은 페어', { size: 16 }) + T(404, 82, '낼 수 있어요', { size: 15.5, fill: C.ok })
      + line(204, 122, 456, 122, { stroke: C.line, sw: 2, dash: '5 6' })
      + tc(234, 142, 'K', 'r', { w: 46, h: 64 }) + no(326, 174, 14) + T(404, 162, '한 장은', { size: 16 }) + T(404, 188, '낼 수 없어요', { size: 15.5, fill: C.pt })
      + bubble(330, 250, '패스', { tail: 'l', size: 16 }) + T(410, 250, '도 돼요', { size: 16 }),
  },
  {
    k: '특수 카드', t: '특수 카드 네 장을 알아 둬요',
    d: '참새는 숫자 1이고, 가진 사람이 먼저 시작해요. 개는 차례를 우리 편에게 넘겨요. 봉황은 다른 카드 대신 끼워 쓰고, 용은 한 장으로 낼 때 가장 세요.',
    art: [['참새', '#EAF5E1', '숫자 1', '먼저 시작해요'], ['개', '#E8ECF2', '우리 편에게', '차례를 넘겨요'], ['봉황', '#FDE7DF', '어디든 끼워', '쓸 수 있어요'], ['용', '#FFF1C9', '한 장으로', '가장 세요']].map(([nm, f, a, b], i) => sp(31 + i * 116, 34, nm, f) + T(66 + i * 116, 166, a, { size: 15.5 }) + T(66 + i * 116, 192, b, { size: 15.5 })).join('')
      + T(240, 250, '용으로 딴 카드는 상대 편에게 줘야 해요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '점수', t: '점수 카드와 선언으로 점수를 얻어요',
    d: '5는 5점, 10과 K는 10점, 용은 25점이고 봉황은 25점을 깎아요. “1등으로 나가겠다”는 티츄 선언을 지키면 100점을 더 받고, 못 지키면 100점을 잃어요.',
    art: tc(38, 24, 5, 'j', { w: 44, h: 60 }) + T(60, 106, '5점', { size: 17 }) + tc(136, 24, 10, 's', { w: 44, h: 60 }) + tc(176, 24, 'K', 'r', { w: 44, h: 60 }) + T(178, 106, '10점씩', { size: 17 })
      + sp(278, 24, '용', '#FFF1C9', { w: 44, h: 60 }) + T(300, 106, '+25', { size: 18, fill: C.ok }) + sp(384, 24, '봉황', '#FDE7DF', { w: 52, h: 60 }) + T(410, 106, '−25', { size: 18, fill: C.pt })
      + line(24, 136, 456, 136, { stroke: C.line, sw: 2, dash: '5 6' })
      + bubble(84, 180, '티츄!', { tail: 'bl', size: 18 }) + T(250, 168, '1등으로 나가면', { size: 16 }) + T(390, 168, '+100', { size: 22, weight: 800, fill: C.ok })
      + T(250, 202, '못 나가면', { size: 16 }) + T(390, 202, '−100', { size: 22, weight: 800, fill: C.pt })
      + T(240, 256, '우리 편이 1등과 2등을 다 하면 200점', { size: 16, fill: C.ink2 }),
  },
];

// ---------- 렉시오 ----------
const LS = { sun: C.red, moon: '#3FA36B', star: '#E8B21E', cloud: '#5AA7E6' };
const lsym = (k, cx, cy, r = 7) => {
  if (k === 'sun') return circ(cx, cy, r * 0.62, { fill: LS.sun }) + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const t = a * Math.PI / 180; return line(cx + Math.cos(t) * r * 0.85, cy + Math.sin(t) * r * 0.85, cx + Math.cos(t) * r * 1.25, cy + Math.sin(t) * r * 1.25, { stroke: LS.sun, sw: r * 0.26 }); }).join('');
  if (k === 'moon') return path(`M${cx + r * 0.3} ${cy - r}A${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.45}A${r * 0.78} ${r * 0.78} 0 1 1 ${cx + r * 0.3} ${cy - r}Z`, { fill: LS.moon });
  if (k === 'star') return star(cx, cy, r * 1.15, LS.star, { stroke: 'none' });
  return blob([(a) => circ(cx - r * 0.6, cy + r * 0.2, r * 0.6, a), (a) => circ(cx + r * 0.1, cy - r * 0.2, r * 0.75, a), (a) => circ(cx + r * 0.75, cy + r * 0.25, r * 0.55, a)], LS.cloud, 0, LS.cloud);
};
const lt = (x, y, v, k, o = {}) => card(x, y, { w: o.w || 44, h: o.h || 58, rx: 7, fill: '#2B2F38', op: o.op, inner: (cx, cy, w, h) => T(cx, cy - h * 0.14, v, { size: h * 0.4, weight: 800, fill: LS[k] }) + lsym(k, cx, cy + h * 0.27, h * 0.115) });
const lexio = [
  {
    k: '목표', t: '손에 든 타일을 먼저 다 내요',
    d: '차례마다 타일 조합을 내서 손을 비워요. 누군가 타일을 다 내면 한 라운드가 끝나고, 타일이 많이 남은 사람일수록 칩을 많이 잃어요.',
    art: table(150, 60, 180, 120) + lt(196, 90, 9, 'sun') + lt(244, 90, 9, 'star')
      + person(240, 232, { fill: C.okTint }) + crown(240, 186, 1.1) + lt(300, 196, 2, 'moon', { w: 40, h: 52 }) + arrow(318, 190, 286, 150, { bend: 10, w: 3.5, head: 10 }) + T(388, 222, '마지막 타일', { size: 16, fill: C.pt })
      + person(70, 110, { s: 0.85 }) + [0, 1, 2].map((i) => lt(34 + i * 26, 150, '', 'cloud', { w: 22, h: 30 })).join('') + T(70, 204, '3개 남음', { size: 15.5, fill: C.muted })
      + person(410, 90, { s: 0.85 }) + [0, 1, 2, 3, 4].map((i) => lt(348 + i * 26, 130, '', 'cloud', { w: 22, h: 30 })).join('') + T(410, 180, '5개 남음', { size: 15.5, fill: C.muted }),
  },
  {
    k: '준비', t: '인원에 따라 쓰는 숫자가 달라요',
    d: '3명은 1부터 9까지, 4명은 13까지, 5명은 15까지 써요. 타일을 엎어 섞은 뒤 똑같이 나눠요. 첫 라운드는 구름 3을 가진 사람이 먼저 내요.',
    art: [[3, '숫자 1~9', '12개씩'], [4, '숫자 1~13', '13개씩'], [5, '숫자 1~15', '12개씩']].map(([n, a, b], i) => rect(24, 26 + i * 62, 432, 50, { fill: C.paper, stroke: C.line, sw: 2, rx: 12 })
      + T(66, 51 + i * 62, `${n}명`, { size: 18, weight: 800 }) + T(220, 51 + i * 62, a, { size: 17 }) + T(388, 51 + i * 62, b, { size: 16, fill: C.muted })).join('')
      + lt(96, 222, 3, 'cloud', { w: 44, h: 58 }) + T(288, 251, '구름 3을 가진 사람이 먼저 내요', { size: 16 }),
  },
  {
    k: '숫자', t: '3이 가장 약하고 2가 가장 세요',
    d: '숫자는 3부터 차례로 세지고, 15 다음이 1, 그 위가 2예요. 2가 가장 센 숫자라서 끝까지 들고 있기 쉽지만, 2를 들고 지면 벌칙이 커져요.',
    art: [[3, 'cloud'], [4, 'star'], null, [15, 'moon'], [1, 'star'], [2, 'sun']].map((t, i) => (t ? lt(24 + i * 76, 80, t[0], t[1], { w: 52, h: 70 }) : T(50 + i * 76, 115, '…', { size: 26 })) + (i < 5 ? T(88 + i * 76, 115, '<', { size: 22, weight: 800, fill: C.pt }) : '')).join('')
      + T(50, 184, '가장 약해요', { size: 15.5, fill: C.muted }) + T(424, 184, '가장 세요', { size: 15.5, fill: C.pt })
      + arrow(120, 232, 360, 232, { w: 4 }) + T(240, 262, '오른쪽으로 갈수록 세요', { size: 16 }),
  },
  {
    k: '문양', t: '숫자가 같으면 문양으로 겨뤄요',
    d: '같은 숫자끼리는 해, 달, 별, 구름 순서로 세요. 해 7은 달 7을 이기고, 구름 7이 가장 약해요.',
    art: [['sun', '해'], ['moon', '달'], ['star', '별'], ['cloud', '구름']].map(([k, nm], i) => lt(44 + i * 108, 62, 7, k, { w: 64, h: 86 }) + T(76 + i * 108, 178, nm, { size: 18 }) + (i < 3 ? T(130 + i * 108, 105, '>', { size: 24, weight: 800, fill: C.pt }) : '')).join('')
      + T(240, 240, '왼쪽으로 갈수록 세요', { size: 16, fill: C.muted }),
  },
  {
    k: '내 차례', t: '같은 개수로 더 세게 내요',
    d: '선이 1개, 2개, 3개, 5개 가운데 하나로 조합을 내요. 다음 사람은 같은 개수로 더 센 조합을 내거나 패스해요. 모두 패스하면 마지막에 낸 사람이 새로 시작해요.',
    art: pill(86, 34, '앞사람이 낸 타일', { size: 15.5 }) + lt(36, 64, 5, 'sun', { w: 50, h: 66 }) + lt(90, 64, 5, 'star', { w: 50, h: 66 }) + T(88, 162, '5 두 개', { size: 17, fill: C.muted })
      + dash(186) + lt(212, 34, 9, 'moon') + lt(260, 34, 9, 'cloud') + ok(336, 63, 14) + T(408, 63, '9 두 개', { size: 16 })
      + line(204, 110, 456, 110, { stroke: C.line, sw: 2, dash: '5 6' })
      + lt(212, 126, 12, 'sun') + lt(260, 126, 13, 'sun') + lt(308, 126, 1, 'sun') + no(380, 155, 14) + T(430, 155, '3개', { size: 16 })
      + bubble(262, 244, '패스', { tail: 'l', size: 16 }) + T(366, 244, '도 할 수 있어요', { size: 16 }),
  },
  {
    k: '조합', t: '5개 조합은 다섯 가지예요',
    d: '5개짜리 조합은 포커 족보와 같아요. 스트레이트가 가장 약하고, 플러시, 풀하우스, 포카드, 스트레이트 플러시 순서로 세져요.',
    art: [['스트레이트', [[4, 'sun'], [5, 'cloud'], [6, 'star'], [7, 'moon'], [8, 'sun']]], ['플러시', [[3, 'star'], [6, 'star'], [9, 'star'], [11, 'star'], [1, 'star']]], ['풀하우스', [[8, 'sun'], [8, 'moon'], [8, 'cloud'], [5, 'star'], [5, 'sun']]], ['포카드', [[9, 'sun'], [9, 'moon'], [9, 'star'], [9, 'cloud'], [4, 'moon']]], ['스트레이트 플러시', [[5, 'moon'], [6, 'moon'], [7, 'moon'], [8, 'moon'], [9, 'moon']]]]
      .map(([nm, ts], i) => T(28, 39 + i * 52, nm, { size: 15.5, anchor: 'start' }) + ts.map(([v, k], j) => lt(196 + j * 36, 18 + i * 52, v, k, { w: 31, h: 42 })).join('')).join('')
      + arrow(418, 40, 418, 250, { w: 4 }) + T(446, 34, '약', { size: 15.5, fill: C.muted }) + T(446, 258, '강', { size: 15.5, fill: C.pt }),
  },
];

// ---------- 팬데믹 ----------
const PC = { b: C.blue, y: '#E8B21E', k: '#2A2F3A', r: C.red };
const cube = (cx, cy, c, s = 13, o = {}) => g(rect(cx - s / 2, cy - s / 2 + 2, s, s, { fill: C.ink, rx: 2.5 }) + rect(cx - s / 2, cy - s / 2, s, s, { fill: PC[c], stroke: C.ink, sw: 1.6, rx: 2.5 }), { op: o.op });
const cityN = (cx, cy, c, nm, o = {}) => circ(cx, cy, o.r || 15, { fill: '#fff', stroke: PC[c], sw: 5 }) + (nm ? T(cx, cy + (o.dy ?? 30), nm, { size: 15.5 }) : '');
const link = (x1, y1, x2, y2) => line(x1, y1, x2, y2, { stroke: C.line, sw: 5 });
const station = (cx, cy, s = 1) => house(cx, cy, '#fff', 1.3 * s) + path(`M${cx - 4 * s} ${cy + 2 * s}h${8 * s}M${cx} ${cy - 2 * s}v${8 * s}`, { stroke: C.pt, sw: 2.4 * s });
const vial = (cx, cy, c, s = 1) => g(path('M-6 -18H6M-4 -18V-6L-13 12Q-15 18 -8 18H8Q15 18 13 12L4 -6V-18', { fill: '#fff', stroke: C.ink, sw: 2.2 }) + path('M-9 6L-12 12Q-13 16 -8 16H8Q13 16 12 12L9 6Z', { fill: PC[c] }), { x: cx, y: cy, s });
const ccard = (x, y, c, o = {}) => card(x, y, { w: o.w || 36, h: o.h || 50, fill: '#fff', inner: (cx, cy, w, h) => rect(x + 4, y + 4, w - 8, h * 0.3, { fill: PC[c], rx: 3 }) + circ(cx, cy + h * 0.16, w * 0.16, { stroke: PC[c], sw: 3 }) });
const panel = (x, y, w, h, title) => rect(x, y, w, h, { fill: C.paper, stroke: C.line, sw: 2, rx: 12 }) + T(x + w / 2, y + h - 18, title, { size: 16 });
const pandemic = [
  {
    k: '목표', t: '치료제 네 가지를 모두 만들면 이겨요',
    d: '서로 겨루지 않고 모두 한 편이 돼요. 질병이 번지는 것을 막으면서, 네 가지 색 질병의 치료제를 모두 개발하면 다 함께 이겨요.',
    art: pill(240, 34, '모두 한 편', { size: 16, bg: C.ok })
      + person(120, 92, { s: 0.9, fill: C.okTint }) + person(200, 92, { s: 0.9, fill: C.ptTint }) + person(280, 92, { s: 0.9, fill: '#DCE8FA' }) + person(360, 92, { s: 0.9, fill: '#FFF1C9' })
      + ['b', 'y', 'k', 'r'].map((c, i) => vial(96 + i * 96, 184, c, 1.25) + ok(120 + i * 96, 206, 11)).join('')
      + T(240, 258, '치료제 네 가지를 모두 개발하면 승리', { size: 16 }),
  },
  {
    k: '내 차례', t: '행동 4번, 카드 2장, 그리고 감염',
    d: '내 차례에는 행동을 네 번 해요. 그다음 플레이어 카드 2장을 뽑고, 마지막으로 감염 카드를 펼쳐 나온 도시에 질병 큐브를 놓아요.',
    art: badge(30, 36, 1) + T(92, 36, '행동 4번', { size: 16 }) + [0, 1, 2, 3].map((i) => circ(38 + (i % 2) * 84, 100 + Math.floor(i / 2) * 60, 22, { fill: C.ptTint, stroke: C.pt, sw: 2.5 }) + T(38 + (i % 2) * 84, 100 + Math.floor(i / 2) * 60, i + 1, { size: 18, fill: C.pt })).join('')
      + T(80, 232, '이동, 치료 등', { size: 15.5, fill: C.muted })
      + dash(160) + badge(184, 36, 2) + T(250, 36, '카드 2장', { size: 16 }) + pile(196, 80, { w: 44, h: 60, back: true, backFill: C.blue }) + arrow(250, 112, 268, 112, { w: 3, head: 9 }) + ccard(274, 76, 'y', { w: 32, h: 44 }) + ccard(282, 104, 'r', { w: 32, h: 44 })
      + T(240, 196, '손패는 7장까지', { size: 15.5, fill: C.muted })
      + dash(320) + badge(338, 36, 3) + T(404, 36, '감염시키기', { size: 16 }) + card(340, 78, { w: 44, h: 60, fill: '#DDEFD9', inner: (cx, cy) => circ(cx, cy, 9, { stroke: PC.k, sw: 4 }) })
      + arrow(392, 108, 414, 108, { w: 3, head: 9 }) + cityN(440, 108, 'k', '') + cube(440, 108, 'k', 12)
      + T(400, 180, '나온 도시에', { size: 15.5 }) + T(400, 204, '큐브 1개', { size: 15.5 }),
  },
  {
    k: '행동', t: '이동하고, 치료하고, 카드를 건네요',
    d: '옆 도시로 이동하거나, 지금 있는 도시의 큐브를 하나 없애요. 같은 도시에 있는 사람과는 그 도시의 카드를 주고받을 수 있고, 도시 카드를 내고 연구소를 지을 수도 있어요.',
    art: panel(20, 20, 214, 124, '이동') + link(74, 66, 180, 66) + cityN(74, 66, 'b', '') + cityN(180, 66, 'b', '') + pawn(74, 60, C.pt, { s: 0.9 }) + arrow(96, 46, 160, 46, { bend: -12, w: 3.5, head: 10 })
      + panel(246, 20, 214, 124, '치료') + cityN(330, 66, 'r', '', { r: 18 }) + cube(318, 62, 'r') + cube(342, 62, 'r') + cube(330, 78, 'r', 13, { op: 0.3 }) + arrow(354, 78, 404, 78, { w: 3.5, head: 10 }) + cube(424, 78, 'r')
      + panel(20, 156, 214, 124, '카드 건네기') + pawn(70, 208, C.pt, { s: 0.9 }) + ccard(108, 178, 'y', { w: 32, h: 44 }) + arrow(144, 200, 172, 200, { w: 3.5, head: 10 }) + pawn(196, 208, C.blue, { s: 0.9 })
      + panel(246, 156, 214, 124, '연구소 짓기') + cityN(320, 206, 'y', '', { r: 18 }) + station(378, 196, 1.2),
  },
  {
    k: '치료제', t: '연구소에서 같은 색 카드 5장을 내요',
    d: '연구소가 있는 도시에서 같은 색 도시 카드 5장을 버리면 그 색 치료제가 만들어져요. 그래서 한 사람에게 같은 색 카드를 몰아주는 것이 중요해요.',
    art: station(70, 110, 1.6) + pawn(110, 122, C.pt, { s: 1.1 }) + T(86, 176, '연구소에서', { size: 16 })
      + [0, 1, 2, 3, 4].map((i) => ccard(160 + i * 34, 78, 'b', { w: 40, h: 56 })).join('') + T(248, 176, '파랑 5장', { size: 16 })
      + arrow(350, 106, 392, 106, {}) + vial(430, 104, 'b', 1.5) + ok(456, 132, 12) + T(424, 176, '치료제 완성', { size: 16, fill: C.ok })
      + T(240, 240, '치료제가 있으면 그 색 큐브를 한 번에 모두 없애요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '확산', t: '큐브가 3개인 도시에 또 놓으면 번져요',
    d: '한 도시에는 같은 색 큐브가 3개까지만 놓여요. 네 번째를 놓아야 하면 그 대신 이어진 모든 도시에 한 개씩 번져요. 이것이 확산이에요.',
    art: link(200, 150, 80, 80) + link(200, 150, 90, 230) + link(200, 150, 330, 150)
      + cityN(200, 150, 'r', '', { r: 26 }) + cube(188, 142, 'r') + cube(212, 142, 'r') + cube(200, 160, 'r')
      + cityN(80, 80, 'r', '', { r: 18 }) + cube(80, 80, 'r') + cityN(90, 230, 'r', '', { r: 18 }) + cube(90, 230, 'r') + cityN(330, 150, 'r', '', { r: 18 }) + cube(330, 150, 'r')
      + arrow(176, 132, 106, 92, { w: 3.5, head: 10 }) + arrow(178, 170, 112, 216, { w: 3.5, head: 10 }) + arrow(232, 150, 302, 150, { w: 3.5, head: 10 })
      + cube(236, 92, 'r', 15) + no(250, 80, 10) + T(304, 88, '4번째는', { size: 15.5 }) + T(304, 112, '못 놓아요', { size: 15.5 })
      + pill(410, 60, '확산!', { size: 17, bg: C.pt }) + T(404, 214, '옆 도시에', { size: 16 }) + T(404, 240, '1개씩 번져요', { size: 16 }),
  },
  {
    k: '끝', t: '이 셋 중 하나가 일어나면 모두 져요',
    d: '확산이 여덟 번 일어나거나, 놓아야 할 색의 큐브가 모자라거나, 뽑을 플레이어 카드가 떨어지면 모두 함께 져요.',
    art: panel(20, 40, 140, 210, '확산 8번') + Array.from({ length: 8 }, (_, i) => circ(54 + (i % 3) * 36, 82 + Math.floor(i / 3) * 36, 13, { fill: C.pt, stroke: C.ink, sw: 1.8 }) + T(54 + (i % 3) * 36, 82 + Math.floor(i / 3) * 36, i + 1, { size: 13, fill: '#fff' })).join('')
      + panel(170, 40, 140, 210, '큐브가 모자람') + rect(200, 86, 80, 70, { stroke: C.muted, sw: 2.2, rx: 8, dash: '5 5' }) + cube(240, 121, 'k', 16, { op: 0.25 }) + T(240, 182, '0개', { size: 18, fill: C.pt })
      + panel(320, 40, 140, 210, '카드 더미 끝') + rect(366, 80, 48, 66, { stroke: C.muted, sw: 2.2, rx: 8, dash: '5 5' }) + T(390, 182, '0장', { size: 18, fill: C.pt }),
  },
];

export default { chess, tichu, lexio, pandemic };
