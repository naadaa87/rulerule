// 파티 게임 그림 설명 (추가 2)
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, motion, card, pile, person, hand, die, coin, crown, table, eye, big } from './kit.mjs';
import { bill } from './parts.mjs';

const dash = (x, y1 = 24, y2 = 276) => line(x, y1, x, y2, { stroke: C.line, sw: 2, dash: '5 6' });

// ---------- 한밤의 늑대인간 ----------
const wolf = (cx, cy, s = 1) => g(blob([(a) => circ(0, 2, 13, a), (a) => poly([[-13, -4], [-11, -20], [-2, -9]], a), (a) => poly([[13, -4], [11, -20], [2, -9]], a)], '#5A6172', 2)
  + ell(0, 8, 6, 5, { fill: '#D6DAE2' }) + circ(-5, -1, 2, { fill: C.gold }) + circ(5, -1, 2, { fill: C.gold }) + circ(0, 6, 1.8, { fill: C.ink }), { x: cx, y: cy, s });
const moonI = (cx, cy, r = 18) => path(`M${cx + r * 0.3} ${cy - r}A${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.45}A${r * 0.78} ${r * 0.78} 0 1 1 ${cx + r * 0.3} ${cy - r}Z`, { fill: C.gold, stroke: C.ink, sw: 2 });
const wcard = (x, y, name, o = {}) => card(x, y, { w: o.w || 80, h: o.h || 106, op: o.op, back: o.back, fill: name === '늑대인간' ? '#3A4152' : C.paper,
  inner: o.back ? null : (cx, cy, w, h) => (name === '늑대인간' ? wolf(cx, cy - h * 0.12, 1.2) : circ(cx, cy - h * 0.2, 9, { fill: C.ink }) + path(`M${cx - 15} ${cy + 4}q0 -13 15 -13q15 0 15 13z`, { fill: C.ink })) + T(cx, cy + h * 0.32, name, { size: 15.5, fill: name === '늑대인간' ? '#fff' : C.ink }) });
const werewolf = [
  {
    k: '목표', t: '늑대인간을 한 명이라도 찾으면 마을이 이겨요',
    d: '밤 한 번, 낮 한 번으로 끝나요. 마을 편은 투표로 늑대인간을 한 명이라도 찾아내면 이기고, 늑대인간 편은 아무도 들키지 않으면 이겨요.',
    art: pill(120, 36, '마을 편', { size: 16, bg: C.ok }) + person(76, 100, { s: 0.95, fill: C.okTint }) + person(164, 100, { s: 0.95, fill: C.okTint })
      + T(120, 176, '늑대인간을 한 명이라도', { size: 15.5 }) + T(120, 202, '찾아내면 이겨요', { size: 15.5 })
      + dash(240, 24, 226) + pill(360, 36, '늑대인간 편', { size: 16 }) + wolf(360, 98, 2)
      + T(360, 176, '아무도 들키지 않으면', { size: 15.5 }) + T(360, 202, '이겨요', { size: 15.5 })
      + T(240, 258, '밤 한 번, 낮 한 번이면 끝나요', { size: 16, fill: C.muted }),
  },
  {
    k: '준비', t: '한 장씩 받고, 세 장은 가운데에 둬요',
    d: '인원보다 3장 많게 역할 카드를 골라 섞어요. 한 장씩 받아 자기 카드만 확인하고, 남은 3장은 가운데에 엎어 놓아요.',
    art: table(110, 70, 260, 160) + person(160, 44, { s: 0.8 }) + person(320, 44, { s: 0.8 }) + person(64, 150, { s: 0.8 }) + person(416, 150, { s: 0.8 }) + person(240, 262, { s: 0.8, fill: C.ptTint })
      + card(146, 78, { w: 28, h: 38, back: true }) + card(306, 78, { w: 28, h: 38, back: true }) + card(118, 132, { w: 28, h: 38, back: true }) + card(334, 132, { w: 28, h: 38, back: true }) + card(226, 186, { w: 28, h: 38, back: true })
      + card(190, 124, { w: 30, h: 42, back: true, backFill: C.pt }) + card(225, 124, { w: 30, h: 42, back: true, backFill: C.pt }) + card(260, 124, { w: 30, h: 42, back: true, backFill: C.pt })
      + pill(414, 40, '가운데 3장', { size: 15.5, bg: C.pt }) + arrow(390, 56, 296, 130, { bend: -10, w: 3, head: 10 }),
  },
  {
    k: '밤', t: '모두 눈을 감고, 불린 역할만 눈을 떠요',
    d: '진행자가 역할을 순서대로 불러요. 불린 사람만 눈을 뜨고 할 일을 해요. 강도는 다른 사람과 카드를 바꾸고 새 카드를 확인해요.',
    art: moonI(44, 46) + bubble(286, 46, '강도는 눈을 뜨세요', { tail: 'bl', size: 16 })
      + person(70, 136, { eyes: 'closed' }) + person(180, 136, { fill: C.ptTint }) + person(300, 136, { eyes: 'closed' }) + person(410, 136, { eyes: 'closed' })
      + card(52, 178, { w: 36, h: 50, back: true }) + card(162, 178, { w: 36, h: 50, back: true }) + card(282, 178, { w: 36, h: 50, back: true }) + card(392, 178, { w: 36, h: 50, back: true })
      + arrow(206, 192, 274, 192, { bend: 12, w: 3.5, head: 11 }) + arrow(274, 216, 206, 216, { bend: 12, w: 3.5, head: 11 })
      + T(240, 266, '카드를 바꾸고 새 카드를 확인해요', { size: 16 }),
  },
  {
    k: '낮', t: '이야기한 뒤 동시에 한 사람을 가리켜요',
    d: '정한 시간 동안 누가 늑대인간일지 이야기해요. 거짓말을 해도 돼요. 시간이 되면 셋을 세고 모두 동시에 한 사람을 가리켜요. 가장 많이 지목된 사람이 처형돼요.',
    art: person(80, 86, {}) + person(240, 56, {}) + person(400, 86, { fill: C.ptTint }) + person(150, 226, {}) + person(330, 226, {})
      + ring(400, 78, 36) + arrow(112, 86, 352, 86, { bend: -12, w: 3.5 }) + arrow(270, 62, 356, 74, { w: 3.5 }) + arrow(180, 214, 368, 112, { bend: -10, w: 3.5 })
      + pill(240, 150, '하나, 둘, 셋!', { size: 17, bg: C.pt }) + T(410, 150, '3표', { size: 18, fill: C.pt }),
  },
  {
    k: '결과', t: '지금 내 앞에 놓인 카드가 내 역할이에요',
    d: '밤사이 누군가 내 카드를 바꿨을 수도 있어요. 처음에 본 역할이 아니라, 끝났을 때 내 앞에 놓인 카드로 이겼는지 졌는지 정해요.',
    art: wcard(60, 46, '마을 주민', { op: 0.45 }) + T(100, 180, '처음 받은 카드', { size: 16, fill: C.muted })
      + arrow(170, 100, 290, 100, { bend: 20 }) + T(230, 60, '밤사이 바뀜', { size: 15.5, fill: C.pt })
      + wcard(320, 46, '늑대인간') + T(360, 180, '지금 내 앞의 카드', { size: 16 })
      + pill(240, 244, '승패는 지금 놓인 카드로 정해요', { size: 16, bg: C.ink }),
  },
];

// ---------- 스컬킹 ----------
const SKC = { y: '#E8A917', g: C.green, p: '#7A4FB5', k: '#2A2F3A' };
const flagI = (cx, cy, c = '#fff') => line(cx - 8, cy - 14, cx - 8, cy + 14, { stroke: C.ink, sw: 2.6 }) + path(`M${cx - 8} ${cy - 13}H${cx + 12}L${cx + 6} ${cy - 5}L${cx + 12} ${cy + 3}H${cx - 8}Z`, { fill: c, stroke: C.ink, sw: 2 });
const skullI = (cx, cy, s = 1) => g(blob([(a) => circ(0, -3, 11, a), (a) => rect(-6, 3, 12, 9, { ...a, rx: 3 })], '#fff', 1.8) + circ(-4, -3, 3, { fill: C.ink }) + circ(4, -3, 3, { fill: C.ink }) + path('M-3 8V11M0 8V11M3 8V11', { stroke: C.ink, sw: 1.4 }), { x: cx, y: cy, s });
const hatI = (cx, cy) => path(`M${cx - 15} ${cy + 6}Q${cx} ${cy - 22} ${cx + 15} ${cy + 6}Z`, { fill: C.ink }) + line(cx - 18, cy + 6, cx + 18, cy + 6, { stroke: C.ink, sw: 4 });
const waveI = (cx, cy) => path(`M${cx - 14} ${cy - 4}q7 -8 14 0t14 0M${cx - 14} ${cy + 6}q7 -8 14 0t14 0`, { stroke: C.sky, sw: 3.4, cap: 'round' });
const skcard = (x, y, kind, v, o = {}) => {
  const w = o.w || 60, h = o.h || 84;
  const sp = { esc: ['탈출', (cx, cy) => flagI(cx, cy), C.paper, C.ink], pir: ['해적', hatI, '#F6D9D0', C.ink], sk: ['스컬킹', (cx, cy) => skullI(cx, cy, 1.1), '#2A2F3A', '#fff'], mer: ['인어', waveI, '#DDEEFB', C.ink] }[kind];
  if (sp) return card(x, y, { w, h, fill: sp[2], op: o.op, inner: (cx, cy) => sp[1](cx, cy - h * 0.14) + T(cx, cy + h * 0.3, sp[0], { size: 15.5, fill: sp[3] }) });
  return card(x, y, { w, h, fill: SKC[kind], op: o.op, inner: (cx, cy) => rect(cx - w * 0.3, cy - h * 0.3, w * 0.6, h * 0.6, { fill: '#fff', rx: 6, op: 0.2 }) + T(cx, cy, v, { size: h * 0.36, weight: 800, fill: '#fff' }) });
};
const skullking = [
  {
    k: '목표', t: '몇 번 이길지 미리 맞혀요',
    d: '라운드마다 “이번에 몇 번 이기겠다”를 먼저 말해요. 많이 이기는 게 아니라, 말한 횟수만큼 정확히 이겨야 점수를 받아요.',
    art: person(70, 150, { fill: C.ptTint, s: 1.1 }) + bubble(128, 62, '2번 이길게요', { tail: 'bl', size: 18 }) + dash(236)
      + T(330, 40, '딱 2번 이기면', { size: 16 }) + pile(264, 64, { w: 36, h: 50, back: true, count: 2 }) + pile(314, 64, { w: 36, h: 50, back: true, count: 2 }) + ok(378, 90, 13) + T(432, 90, '+40', { size: 24, weight: 800, fill: C.ok })
      + line(256, 146, 460, 146, { stroke: C.line, sw: 2, dash: '5 6' })
      + T(330, 172, '3번 이겨 버리면', { size: 16 }) + pile(256, 196, { w: 36, h: 50, back: true, count: 2 }) + pile(300, 196, { w: 36, h: 50, back: true, count: 2 }) + pile(344, 196, { w: 36, h: 50, back: true, count: 2 }) + T(432, 222, '−10', { size: 24, weight: 800, fill: C.pt }),
  },
  {
    k: '준비', t: '라운드 숫자만큼 카드를 받아요',
    d: '1라운드에는 1장, 2라운드에는 2장씩 받아요. 이렇게 한 장씩 늘려 10라운드까지 해요. 카드를 본 뒤 모두 동시에 이길 횟수를 손가락으로 내요.',
    art: T(66, 62, '1라운드', { size: 16 }) + card(140, 36, { w: 36, h: 50, back: true })
      + T(66, 138, '2라운드', { size: 16 }) + card(140, 112, { w: 36, h: 50, back: true }) + card(170, 112, { w: 36, h: 50, back: true })
      + circ(66, 180, 2.4, { fill: C.muted }) + circ(66, 190, 2.4, { fill: C.muted }) + circ(66, 200, 2.4, { fill: C.muted })
      + T(66, 244, '10라운드', { size: 16 }) + Array.from({ length: 10 }, (_, i) => card(140 + i * 30, 218, { w: 36, h: 50, back: true })).join(''),
  },
  {
    k: '내 차례', t: '처음 낸 색을 따라 내요',
    d: '한 사람씩 카드를 한 장 내요. 처음 나온 색이 손에 있으면 그 색을 내야 해요. 해적이나 탈출 같은 특수 카드는 언제든 낼 수 있어요.',
    art: pill(76, 34, '처음 낸 카드', { size: 15.5 }) + skcard(40, 58, 'y', 7, { w: 72, h: 100 })
      + dash(160) + skcard(196, 58, 'y', 3) + skcard(296, 58, 'g', 12) + skcard(396, 58, 'pir')
      + ok(226, 168, 14) + no(326, 168, 14) + ok(426, 168, 14)
      + T(226, 204, '같은 색', { size: 16 }) + T(326, 204, '다른 색', { size: 16 }) + T(426, 204, '특수 카드', { size: 16 })
      + T(320, 252, '노랑이 있으면 노랑을 내야 해요', { size: 16, fill: C.ink2 }),
  },
  {
    k: '세기', t: '어떤 카드가 이길까요',
    d: '탈출은 언제나 지고, 숫자는 클수록 세요. 검은 숫자는 다른 색 숫자를 모두 이기고, 해적은 숫자를 모두 이겨요. 스컬킹은 해적을 이기지만 인어에게는 잡혀요.',
    art: [['esc'], ['y', 9], ['k', 4], ['pir'], ['sk']].map(([k, v], i) => skcard(22 + i * 92, 30, k, v, { w: 60, h: 84 }) + (i < 4 ? T(98 + i * 92, 72, '<', { size: 24, weight: 800, fill: C.pt }) : '')).join('')
      + T(144, 138, '색 숫자', { size: 15.5, fill: C.muted }) + T(236, 138, '검은 숫자', { size: 15.5, fill: C.muted })
      + line(24, 166, 456, 166, { stroke: C.line, sw: 2, dash: '5 6' })
      + skcard(40, 186, 'mer', 0, { w: 60, h: 84 }) + T(286, 214, '인어는 스컬킹을 잡아요', { size: 16 }) + T(286, 242, '해적에게는 져요', { size: 16, fill: C.muted }),
  },
  {
    k: '점수', t: '맞히면 20점씩, 틀리면 10점씩 깎여요',
    d: '예측을 맞히면 이긴 횟수 하나에 20점을 받아요. 틀리면 차이 하나에 10점을 잃어요. 0번이라고 해서 맞히면 그 라운드 숫자에 10을 곱한 점수를 받아요.',
    art: [['2번 예측, 2번 승리', '+40', C.ok], ['2번 예측, 3번 승리', '−10', C.pt], ['0번 예측 성공 (5라운드)', '+50', C.ok]].map(([a, b, c], i) => rect(30, 34 + i * 80, 420, 62, { fill: C.paper, stroke: C.line, sw: 2, rx: 12 })
      + T(52, 65 + i * 80, a, { size: 16, anchor: 'start' }) + T(404, 65 + i * 80, b, { size: 26, weight: 800, fill: c })).join(''),
  },
];

// ---------- 라스베가스 ----------
const DC = { r: C.red, b: C.blue, g: C.green };
const cdie = (cx, cy, v, c, s = 26) => die(cx, cy, v, { s, fill: DC[c], pip: '#fff' });
const casino = (x, y, v, o = {}) => rect(x, y + 3, o.w || 64, o.h || 44, { fill: C.ink, rx: 10 }) + rect(x, y, o.w || 64, o.h || 44, { fill: '#FFE9A8', stroke: C.ink, sw: 2.2, rx: 10 }) + die(x + (o.w || 64) / 2, y + (o.h || 44) / 2, v, { s: o.ds || 26 });
const vbill = (cx, y, label, o = {}) => bill(cx - (o.w || 56) / 2, y, { w: o.w || 56, h: o.h || 26, label, ls: 13 });
const lasvegas = [
  {
    k: '목표', t: '주사위를 가장 많이 건 사람이 큰돈을 받아요',
    d: '카지노마다 주사위를 가장 많이 올린 사람이 가장 큰 지폐를, 그다음 사람이 다음 지폐를 가져가요. 4라운드 동안 돈을 가장 많이 모으면 이겨요.',
    art: vbill(196, 40, '9만', { w: 76, h: 38 }) + vbill(288, 40, '4만', { w: 76, h: 38 })
      + casino(150, 150, 3, { w: 180, h: 84, ds: 44 })
      + cdie(60, 176, 3, 'r', 30) + cdie(96, 176, 3, 'r', 30) + cdie(78, 210, 3, 'r', 30) + cdie(384, 190, 3, 'b', 30) + cdie(420, 190, 3, 'b', 30)
      + arrow(84, 150, 160, 84, { bend: -14 }) + arrow(402, 164, 330, 84, { bend: 14, c: C.blue })
      + T(78, 258, '3개, 1등', { size: 16, fill: C.red }) + T(402, 240, '2개, 2등', { size: 16, fill: C.blue }),
  },
  {
    k: '준비', t: '카지노마다 지폐를 5만 달러 넘게 놓아요',
    d: '카지노 판 6개를 번호 순서로 놓아요. 카지노마다 지폐를 한 장씩 뽑아 놓는데, 합이 5만 달러 이상이 될 때까지 뽑아요. 주사위는 한 사람이 8개씩 가져요.',
    art: T(240, 34, '지폐 합이 5만 달러 이상이 될 때까지', { size: 16 })
      + [[['6만']], [['3만'], ['2만']], [['9만']], [['4만'], ['4만']], [['5만']], [['1만'], ['7만']]].map((bs, i) => casino(18 + i * 76, 190, i + 1) + bs.map(([l], j) => vbill(50 + i * 76, 150 - j * 34, l)).join('')).join('')
      + T(240, 266, '주사위는 한 사람이 8개씩', { size: 16, fill: C.muted }),
  },
  {
    k: '내 차례', t: '굴린 뒤 한 숫자를 골라 모두 올려요',
    d: '남은 주사위를 모두 굴려요. 나온 숫자 중 하나를 골라, 그 숫자가 나온 주사위를 하나도 남기지 않고 같은 번호 카지노에 올려요.',
    art: [3, 3, 3, 1, 5, 6].map((v, i) => cdie(52 + i * 44, 60, v, 'r', 34)).join('') + box(28, 36, 136, 48)
      + T(96, 108, '3은 전부', { size: 16, fill: C.pt }) + arrow(96, 126, 96, 168, {})
      + casino(40, 184, 3, { w: 112, h: 60, ds: 34 }) + cdie(182, 204, 3, 'r', 24) + cdie(210, 204, 3, 'r', 24) + cdie(196, 232, 3, 'r', 24)
      + dash(270, 100, 276) + cdie(318, 150, 1, 'r', 30) + cdie(360, 150, 5, 'r', 30) + cdie(402, 150, 6, 'r', 30)
      + T(360, 200, '남은 주사위는', { size: 16 }) + T(360, 226, '다음 차례에 굴려요', { size: 16 }),
  },
  {
    k: '이럴 땐', t: '개수가 같으면 둘 다 빈손이에요',
    d: '라운드가 끝났을 때 한 카지노에 같은 개수를 올린 사람들은 주사위를 모두 치워요. 남은 사람 중 가장 많은 사람부터 지폐를 가져가요.',
    art: vbill(240, 30, '8만', { w: 80, h: 40 }) + rect(50, 122, 380, 100, { fill: '#FFE9A8', stroke: C.ink, sw: 2.2, rx: 14 })
      + T(116, 144, '2개', { size: 16 }) + cdie(100, 184, 4, 'r', 30) + cdie(134, 184, 4, 'r', 30)
      + T(240, 144, '2개', { size: 16 }) + cdie(224, 184, 4, 'b', 30) + cdie(258, 184, 4, 'b', 30)
      + T(364, 144, '1개', { size: 16 }) + cdie(364, 184, 4, 'g', 30)
      + no(116, 254, 14) + no(240, 254, 14) + ok(364, 254, 14) + arrow(364, 112, 290, 56, { bend: 14, c: C.green }),
  },
  {
    k: '끝', t: '4라운드 뒤 돈이 가장 많으면 이겨요',
    d: '네 라운드를 마치면 가진 지폐를 모두 더해요. 금액이 가장 큰 사람이 이겨요. 금액이 같으면 지폐 장수가 많은 사람이 이겨요.',
    art: [1, 2, 3, 4].map((v, i) => badge(180 + i * 40, 40, v, { bg: C.ink })).join('')
      + person(140, 124, { fill: C.okTint, s: 1.1 }) + crown(140, 74, 1.1) + vbill(78, 180, '9만') + vbill(140, 180, '8만') + vbill(202, 180, '7만') + T(140, 246, '모두 31만', { size: 17 })
      + person(340, 124, { s: 1.1 }) + vbill(278, 180, '6만') + vbill(340, 180, '5만') + vbill(402, 180, '4만') + T(340, 246, '모두 24만', { size: 17, fill: C.muted }),
  },
];

// ---------- 잉카의 황금 ----------
const gem = (cx, cy, s = 1, fill = '#35B6A7') => g(poly([[0, -9], [8, -2], [0, 10], [-8, -2]], { fill, stroke: C.ink, sw: 1.8 }) + path('M-8 -2H8', { stroke: C.ink, sw: 1.2, op: 0.5 }), { x: cx, y: cy, s });
const tent = (cx, cy, s = 1, fill = C.pt) => g(path('M-26 20L0 -22L26 20Z', { fill, stroke: C.ink, sw: 2.4 }) + path('M-7 20L0 2L7 20Z', { fill: C.ink }), { x: cx, y: cy, s });
const temple = (x, y) => path(`M${x} ${y + 150}V${y + 60}L${x + 30} ${y + 60}V${y + 30}L${x + 60} ${y + 30}V${y}H${x + 110}V${y + 30}H${x + 140}V${y + 60}H${x + 170}V${y + 150}Z`, { fill: '#D9C7A3', stroke: C.ink, sw: 2.4 })
  + path(`M${x + 66} ${y + 150}V${y + 96}Q${x + 85} ${y + 76} ${x + 104} ${y + 96}V${y + 150}Z`, { fill: C.ink });
const icard = (x, y, type, v, o = {}) => {
  const w = o.w || 64, h = o.h || 88;
  if (type === 't') return card(x, y, { w, h, fill: '#FFF1C9', op: o.op, inner: (cx, cy) => gem(cx, cy - h * 0.2, w / 50) + T(cx, cy + h * 0.2, v, { size: h * 0.3, weight: 800 }) });
  if (type === 'a') return card(x, y, { w, h, fill: '#F6D873', op: o.op, inner: (cx, cy) => path(`M${cx - 10} ${cy - 16}H${cx + 10}L${cx + 6} ${cy - 8}Q${cx + 18} ${cy + 6} ${cx + 8} ${cy + 18}H${cx - 8}Q${cx - 18} ${cy + 6} ${cx - 6} ${cy - 8}Z`, { fill: '#C98A2B', stroke: C.ink, sw: 2 }) + T(cx, cy + h * 0.36, '유물', { size: 15.5 }) });
  return card(x, y, { w, h, fill: C.ptTint, op: o.op, inner: (cx, cy) => poly([[cx, cy - h * 0.34], [cx + 16, cy - h * 0.04], [cx - 16, cy - h * 0.04]], { fill: C.pt, stroke: C.ink, sw: 2 }) + T(cx, cy - h * 0.14, '!', { size: 15, fill: '#fff', weight: 800 }) + T(cx, cy + h * 0.24, v, { size: 16, weight: 800 }) });
};
const incangold = [
  {
    k: '목표', t: '보석을 텐트에 가장 많이 넣어요',
    d: '신전 안으로 들어가며 보석을 모아요. 텐트로 돌아와 넣은 보석만 내 것이 돼요. 탐험을 다섯 번 해서 보석이 가장 많은 사람이 이겨요.',
    art: temple(30, 60) + T(115, 240, '신전', { size: 16 }) + arrow(300, 150, 214, 150, { dash: '7 6', w: 3.5 }) + arrow(214, 190, 300, 190, { w: 3.5 }) + gem(256, 214, 1.1) + gem(280, 214, 1.1)
      + tent(376, 150, 1.7) + gem(346, 206, 1.1) + gem(376, 206, 1.1) + gem(406, 206, 1.1)
      + T(376, 244, '텐트에 넣은', { size: 16 }) + T(376, 270, '보석만 내 것', { size: 16, fill: C.pt }),
  },
  {
    k: '내 차례', t: '보물은 남은 사람끼리 똑같이 나눠요',
    d: '탐험 카드를 한 장 펼쳐요. 보물 카드라면 적힌 수만큼 보석을 신전에 남아 있는 사람끼리 똑같이 나눠요. 나누고 남는 보석은 카드 위에 둬요.',
    art: icard(34, 60, 't', 9, { w: 78, h: 108 }) + gem(73, 190, 1.2) + T(73, 224, '남은 1개는', { size: 15.5 }) + T(73, 248, '카드 위에', { size: 15.5 })
      + arrow(128, 112, 178, 112, {})
      + [0, 1, 2, 3].map((i) => person(222 + i * 68, 84, { s: 0.8 }) + gem(210 + i * 68, 134) + gem(234 + i * 68, 134)).join('')
      + T(324, 186, '9 ÷ 4 = 2개씩', { size: 20, weight: 800 }) + T(324, 222, '네 명이 남아 있다면', { size: 15.5, fill: C.muted }),
  },
  {
    k: '선택', t: '계속 갈지, 돌아갈지 동시에 골라요',
    d: '카드를 한 장 펼칠 때마다 모두 동시에 선택 카드를 내요. 돌아가면 지금까지 모은 보석을 텐트에 넣어 지키고, 그 탐험이 끝날 때까지 쉬어요.',
    art: card(54, 44, { w: 120, h: 150, fill: C.okTint, inner: (cx, cy) => arrow(cx, cy + 10, cx, cy - 50, { c: C.ok, w: 7, head: 20 }) + T(cx, cy + 44, '계속', { size: 20, weight: 800 }) })
      + T(240, 120, '또는', { size: 16, fill: C.muted })
      + card(306, 44, { w: 120, h: 150, fill: C.ptTint, inner: (cx, cy) => tent(cx, cy - 22, 1.1) + T(cx, cy + 44, '돌아가기', { size: 20, weight: 800 }) })
      + T(114, 228, '더 깊이 들어가요', { size: 16 }) + T(366, 228, '보석을 지켜요', { size: 16 })
      + pill(240, 268, '모두 동시에 공개해요', { size: 15.5, bg: C.pt }),
  },
  {
    k: '위험', t: '같은 위험이 두 번 나오면 빈손이에요',
    d: '위험 카드가 처음 나올 때는 아무 일도 없어요. 같은 종류가 한 번 더 나오면 그때 신전에 남아 있던 사람은 이번 탐험에서 모은 보석을 모두 잃어요.',
    art: icard(22, 44, 't', 5) + icard(94, 44, 'h', '뱀') + icard(166, 44, 't', 7) + icard(238, 44, 'h', '뱀')
      + pill(126, 156, '첫 번째', { size: 15.5, bg: C.muted }) + pill(270, 156, '두 번째', { size: 15.5, bg: C.pt })
      + T(126, 192, '아직 괜찮아요', { size: 15.5, fill: C.muted }) + arrow(270, 178, 270, 206, { w: 3.5, head: 11 }) + T(270, 232, '탐험 끝', { size: 17, fill: C.pt })
      + dash(326) + person(402, 76, {}) + gem(378, 136, 1.2) + gem(402, 136, 1.2) + gem(426, 136, 1.2) + no(402, 136, 15)
      + T(402, 190, '남아 있던 사람은', { size: 15.5 }) + T(402, 216, '보석을 잃어요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '유물', t: '유물은 혼자 돌아갈 때만 가져가요',
    d: '길에 유물 카드가 있을 때 딱 한 사람만 돌아가면 그 사람이 유물을 가져가요. 둘 이상이 함께 돌아가면 아무도 가져가지 못하고 그대로 남아요.',
    art: icard(30, 96, 'a', 0, { w: 76, h: 104 })
      + dash(134) + person(190, 70, { s: 0.85, fill: C.okTint }) + arrow(226, 74, 270, 74, {}) + tent(306, 74, 0.9) + ok(370, 74, 14) + T(300, 124, '혼자 돌아가면 내 것', { size: 16 })
      + line(150, 152, 456, 152, { stroke: C.line, sw: 2, dash: '5 6' })
      + person(172, 200, { s: 0.85 }) + person(212, 200, { s: 0.85 }) + arrow(246, 204, 280, 204, {}) + tent(314, 204, 0.9) + no(378, 204, 14) + T(300, 256, '여럿이면 그대로 남아요', { size: 16 }),
  },
];

export default { 'one-night-werewolf': werewolf, 'skull-king': skullking, 'las-vegas': lasvegas, 'incan-gold': incangold };
