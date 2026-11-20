// 2026-11 추가 게임 그림 설명 (전략·전통놀이)
import { C, rect, circ, ell, line, path, poly, g, T, pill, bubble, badge, ok, no, ring, box, arrow, card, pile, person, hand, pawn, coin, crown, star, timer, table, motion, numCard, point, grid, house, blob } from './kit.mjs';
import { kid } from './parts.mjs';

// ---------- 세븐 원더스 ----------
const SW = { 갈색: '#A8693A', 회색: '#9AA1AD', 파랑: '#3B6FC0', 초록: '#3D9A5E', 빨강: '#D8413F', 노랑: '#E9B949', 보라: '#7E55BE' };
const wcard = (x, y, col, o = {}) => card(x, y, { w: o.w || 44, h: o.h || 62, fill: SW[col], rot: o.rot, back: o.back, backFill: '#6E5A3A', stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2,
  inner: o.back ? null : (cx, cy, w, h) => rect(cx - w * 0.32, cy - h * 0.36, w * 0.64, h * 0.3, { fill: '#fff', op: 0.85, rx: 4 }) + (o.label ? T(cx, cy + h * 0.16, o.label, { size: 15.5, fill: '#fff' }) : '') });
const wonder = (x, y, w = 200, o = {}) => rect(x, y + 4, w, 74, { fill: C.ink, rx: 10 }) + rect(x, y, w, 74, { fill: '#F1DDB0', stroke: C.ink, sw: 2.4, rx: 10 })
  + poly([[x + 24, y + 58], [x + 58, y + 14], [x + 92, y + 58]], { fill: C.wood, stroke: C.ink, sw: 2 })
  + [0, 1, 2].map((i) => rect(x + 104 + i * 30, y + 46, 26, 22, { fill: i < (o.built || 0) ? C.okTint : '#fff', stroke: C.ink2, sw: 1.6, rx: 4 }) + T(x + 117 + i * 30, y + 57, String(i + 1), { size: 12 })).join('');
const SYM = {
  바퀴: (cx, cy, r = 10) => circ(cx, cy, r, { fill: '#fff', stroke: C.ink, sw: 2 }) + line(cx - r, cy, cx + r, cy, { sw: 1.6 }) + line(cx, cy - r, cx, cy + r, { sw: 1.6 }),
  컴퍼스: (cx, cy, r = 10) => path(`M${cx} ${cy - r}L${cx - r * 0.8} ${cy + r}M${cx} ${cy - r}L${cx + r * 0.8} ${cy + r}`, { stroke: C.ink, sw: 2.4, cap: 'round' }) + circ(cx, cy - r, 2.6, { fill: C.ink }),
  석판: (cx, cy, r = 10) => rect(cx - r * 0.75, cy - r, r * 1.5, r * 2, { fill: '#D9CBB0', stroke: C.ink, sw: 2, rx: r * 0.7 }),
};
const sevenWonders = [
  {
    k: '목표', t: '세 시대 동안 카드를 골라 내 문명과 불가사의를 키워요',
    d: '사람마다 불가사의 판 하나를 받아요. 시대 I, II, III을 거치며 건물 카드를 짓고 불가사의를 올려요. 군사, 과학, 건물, 동전 등 점수를 모두 더해 가장 높은 사람이 이겨요.',
    art: wonder(30, 40, 230, { built: 1 }) + T(145, 140, '내 불가사의 판', { size: 16 })
      + ['I', 'II', 'III'].map((a, i) => pill(330 + i * 0, 56 + i * 44, `시대 ${a}`, { size: 15, bg: [C.woodDark, C.ink2, C.purple][i] })).join('')
      + ['갈색', '파랑', '초록', '빨강', '노랑', '보라'].map((c, i) => wcard(30 + i * 52, 176, c)).join('') + T(186, 268, '여러 갈래로 점수를 내요', { size: 16 })
      + T(410, 210, '점수가', { size: 16 }) + T(410, 238, '높으면 승리', { size: 16, fill: C.pt }),
  },
  {
    k: '고르고 넘기기', t: '손에서 한 장을 골라 내려놓고, 남은 카드는 옆 사람에게 넘겨요',
    d: '시대마다 7장씩 받아 모두 동시에 한 장을 골라 엎어 두고 함께 공개해요. 남은 카드는 시대 I·III은 왼쪽, II는 오른쪽으로 넘겨요. 6장을 쓰면 마지막 1장은 버려요.',
    art: ['갈색', '회색', '파랑', '초록', '빨강', '노랑', '파랑'].map((c, i) => wcard(26 + i * 30, 70 + Math.abs(i - 3) * 6, c, { rot: (i - 3) * 6, hi: i === 3 })).join('')
      + arrow(124, 150, 124, 190, { w: 3.2 }) + wcard(102, 198, '초록', { back: true }) + T(236, 230, '한 장 골라 엎어 두기', { size: 15.5 })
      + arrow(320, 120, 420, 120, { w: 3.6 }) + T(370, 88, '남은 카드 넘기기', { size: 16 })
      + T(370, 160, '시대 I·III: 왼쪽', { size: 16, fill: C.ink2 }) + T(370, 192, '시대 II: 오른쪽', { size: 16, fill: C.pt }),
  },
  {
    k: '카드 쓰기', t: '고른 카드로 건물을 짓거나, 불가사의를 올리거나, 버리고 동전 3개를 받아요',
    d: '건물은 필요한 자원을 맞춰야 지어요. 모자란 자원은 바로 옆 사람에게서 동전 2개로 사 써요. 불가사의는 카드를 판 밑에 끼워 한 단계 올려요. 버리면 동전 3개를 받아요.',
    art: wcard(30, 110, '파랑', { w: 56, h: 78 }) + arrow(96, 130, 156, 72, { w: 3 }) + arrow(96, 150, 156, 150, { w: 3 }) + arrow(96, 170, 156, 228, { w: 3 })
      + wcard(170, 36, '파랑') + T(330, 66, '건물 짓기', { size: 16 })
      + wonder(160, 116, 200) + T(420, 150, '불가사의', { size: 16 })
      + coin(186, 238, 13, { label: '3' }) + T(330, 238, '버리고 동전 3개', { size: 16 }),
  },
  {
    k: '점수', t: '군사, 동전, 불가사의, 건물, 과학 점수를 모두 더해요',
    d: '시대가 끝날 때마다 양옆과 군사력을 비교해 이기면 1·3·5점, 지면 −1점이에요. 과학은 같은 기호 수의 제곱에, 서로 다른 기호 세 개 한 묶음마다 7점을 더해요.',
    art: rect(26, 36, 190, 112, { fill: C.ptTint, rx: 14 }) + T(121, 60, '군사', { size: 16 })
      + ['1', '3', '5'].map((v, i) => badge(66 + i * 44, 100, v, { r: 15, bg: C.red })).join('') + badge(66 + 3 * 44 - 4, 100, '-1', { r: 15, bg: C.ink2 })
      + rect(232, 36, 222, 112, { fill: C.okTint, rx: 14 }) + T(343, 60, '과학', { size: 16 })
      + [0, 1, 2].map((i) => SYM.바퀴(256 + i * 26, 102)).join('') + [0, 1].map((i) => SYM.컴퍼스(346 + i * 26, 102)).join('') + SYM.석판(424, 102)
      + T(240, 186, '바퀴 3² + 컴퍼스 2² + 석판 1² + 한 묶음 7', { size: 15.5 })
      + T(240, 222, '= 9 + 4 + 1 + 7 = 21점', { size: 18, weight: 800, fill: C.ok }) + T(240, 262, '동전 3개당 1점도 더해요', { size: 15.5, fill: C.ink2 }),
  },
];

// ---------- 시타델 ----------
const ROLE = [['암살자', '#5F6675'], ['도둑', '#8C7A5B'], ['마술사', '#7E55BE'], ['왕', '#E9B949'], ['주교', '#3B6FC0'], ['상인', '#3D9A5E'], ['건축가', '#EE8A34'], ['장군', '#D8413F']];
const rcard = (x, y, i, o = {}) => card(x, y, { w: o.w || 52, h: o.h || 74, fill: o.back ? undefined : '#fff', back: o.back, backFill: '#3A4D6E', rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2,
  inner: o.back ? null : (cx, cy, w, h) => rect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h * 0.42, { fill: ROLE[i][1], rx: 5 }) + T(cx, cy - h * 0.18, String(i + 1), { size: 18, weight: 800, fill: '#fff' }) + (o.nolabel ? '' : T(cx, cy + h * 0.24, ROLE[i][0], { size: 15.5 })) });
const BLD = [C.yellow, C.blue, C.green, C.red, C.purple];
const city = (x, y, cols, s = 1) => cols.map((c, i) => house(x + i * 34 * s, y, BLD[c], 1.5 * s)).join('');
const citadels = [
  {
    k: '목표', t: '직업 능력으로 금화를 모아 내 도시에 건물을 지어요',
    d: '라운드마다 직업 하나를 몰래 골라 그 능력을 써요. 금화를 내고 건물을 지어 도시를 키워요. 누군가 정해진 수의 건물을 지으면 그 라운드까지 하고, 점수가 높은 사람이 이겨요.',
    art: rect(26, 140, 286, 90, { fill: C.mist, rx: 16 }) + city(52, 196, [0, 1, 2, 3, 4, 1, 2], 1.2) + T(176, 258, '내 도시', { size: 16 })
      + coin(60, 70, 14) + coin(90, 62, 14) + coin(118, 74, 14) + T(196, 70, '금화로 짓기', { size: 16 })
      + rcard(360, 40, 3, { w: 70, h: 98 }) + T(395, 166, '이번 직업', { size: 16 }) + pill(395, 210, '점수가 높으면 승리', { size: 14.5 }),
  },
  {
    k: '고르기', t: '왕관을 가진 사람부터 직업 카드를 한 장씩 몰래 골라 넘겨요',
    d: '왕관을 가진 사람이 직업 카드 묶음에서 한 장을 몰래 고르고 남은 카드를 옆으로 넘겨요. 모두 한 장씩 고를 때까지 이어 가요. 남이 무엇을 가져갔을지 짐작하는 데서 눈치 싸움이 시작돼요.',
    art: person(90, 120, { fill: C.cream, s: 1.3 }) + crown(90, 62, 1.1) + [0, 1, 2, 3].map((i) => rcard(48 + i * 12, 178 + i * 2, i, { back: true, w: 44, h: 62, rot: -8 + i * 6 })).join('')
      + arrow(170, 200, 290, 200, { w: 3.4 }) + person(370, 120, { fill: C.okTint, s: 1.3 }) + rcard(340, 176, 0, { back: true, w: 44, h: 62 }) + rcard(354, 180, 0, { back: true, w: 44, h: 62, rot: 8 })
      + bubble(240, 70, '누가 뭘 골랐을까?', { size: 16, tail: 'bl' }),
  },
  {
    k: '차례', t: '왕이 1번부터 직업을 부르면, 그 직업인 사람이 차례를 해요',
    d: '부른 직업을 고른 사람이 정체를 밝히고 차례를 해요. 금화 2개를 받거나 건물 카드 2장을 보고 1장을 가져요. 그다음 금화를 내고 건물 하나를 짓고, 직업 능력을 써요.',
    art: ROLE.map((_, i) => rcard(14 + i * 57, 30, i, { w: 52, h: 76, nolabel: true })).join('')
      + ROLE.map(([name], i) => T(40 + i * 57, 124, name, { size: 15.5 })).join('')
      + arrow(30, 150, 450, 150, { w: 3 })
      + coin(110, 206, 14, { label: '2' }) + T(110, 246, '금화 2개', { size: 15.5 }) + T(176, 206, '또는', { size: 15.5, fill: C.muted })
      + card(220, 176, { w: 40, h: 56, back: true, backFill: C.woodDark }) + T(240, 252, '카드 1장', { size: 15.5 })
      + arrow(286, 206, 330, 206, { w: 3 }) + house(380, 208, C.blue, 2) + T(380, 252, '건물 짓기', { size: 15.5 }),
  },
  {
    k: '끝과 점수', t: '누군가 건물을 정해진 수만큼 지으면, 그 라운드까지 하고 점수를 세요',
    d: '판에 따라 건물 7개 또는 8개를 지으면 끝나요. 지은 건물 비용을 모두 더하고, 다섯 가지 색을 다 지었으면 3점, 가장 먼저 다 지은 사람은 4점을 더 받아요.',
    art: rect(26, 40, 428, 92, { fill: C.mist, rx: 16 }) + city(62, 100, [0, 1, 2, 3, 4, 0, 1, 2], 1.25)
      + T(240, 162, '건물 비용을 모두 더해요', { size: 16 })
      + pill(130, 212, '다섯 색 모두 +3', { size: 15, bg: C.ok }) + pill(340, 212, '가장 먼저 완성 +4', { size: 15, bg: C.pt })
      + T(240, 258, '같은 이름 건물은 두 번 못 지어요', { size: 15.5, fill: C.ink2 }),
  },
];

// ---------- 더 크루 ----------
const CR = { 분홍: '#E77C9C', 파랑: '#3B6FC0', 초록: '#3D9A5E', 노랑: '#E9B949' };
const crew = (x, y, col, num, o = {}) => (col === '로켓'
  ? card(x, y, { w: o.w || 50, h: o.h || 70, fill: C.ink2, rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2, inner: (cx, cy, w, h) => path(`M${cx} ${cy - h * 0.28}q10 12 6 30h-12q-4 -18 6 -30z`, { fill: '#fff', stroke: C.ink, sw: 1.4 }) + T(cx, cy + h * 0.26, String(num), { size: 16, weight: 800, fill: '#fff' }) })
  : numCard(x, y, String(num), CR[col], { w: o.w || 50, h: o.h || 70, rot: o.rot, stroke: o.hi ? C.pt : C.ink, sw: o.hi ? 3 : 2.2, ns: 28 }));
const task = (x, y, col, num, o = {}) => rect(x, y + 2, 40, 54, { fill: C.ink, rx: 6 }) + rect(x, y, 40, 54, { fill: '#F7F2EA', stroke: C.ink, sw: 2, rx: 6 }) + rect(x + 6, y + 6, 28, 28, { fill: CR[col], rx: 4 }) + T(x + 20, y + 20, String(num), { size: 16, weight: 800, fill: '#fff' }) + circ(x + 20, y + 44, 5, { fill: o.mark || C.pt });
const theCrew = [
  {
    k: '목표', t: '모두 한 팀이 되어, 미션의 과제를 하나도 빠짐없이 이뤄요',
    d: '미션마다 과제 카드를 나눠 가져요. 과제 카드에 그려진 카드를 그 과제를 가진 사람이 가져가야 해요. 과제를 모두 이루면 성공, 하나라도 틀리면 다시 도전해요.',
    art: [[70, '파랑', 7, C.pt], [176, '노랑', 3, C.blue], [282, '분홍', 9, C.ok]].map(([x, col, num, m], i) => person(x, 92, { fill: [C.ptTint, '#DCEBFA', C.okTint][i], s: 1.3 }) + task(x - 20, 140, col, num, { mark: m })).join('')
      + T(200, 236, '과제를 모두 이루면 성공', { size: 17 }) + T(410, 96, '말은 거의', { size: 16 }) + T(410, 124, '못 해요', { size: 16, fill: C.pt }) + T(410, 176, '미션 50개', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '카드 내기', t: '먼저 낸 색을 꼭 따라 내고, 가장 높은 카드가 가져가요',
    d: '이긴 사람부터 카드 한 장을 내면, 다른 사람은 같은 색이 있으면 꼭 그 색을 내요. 없으면 아무 카드나 내요. 같은 색에서 가장 높은 카드, 로켓이 나왔으면 가장 높은 로켓이 이겨요.',
    art: crew(30, 50, '파랑', 3) + T(55, 140, '먼저', { size: 15.5 }) + crew(110, 50, '파랑', 7, { hi: true }) + crew(190, 50, '파랑', 5) + crew(270, 50, '초록', 9)
      + T(295, 140, '파랑이 없어요', { size: 15.5, fill: C.muted }) + crown(135, 32, 0.9)
      + crew(392, 50, '로켓', 1) + T(417, 140, '로켓은', { size: 15.5, fill: C.pt }) + T(417, 164, '늘 이겨요', { size: 15.5, fill: C.pt })
      + T(240, 208, '파랑 7이 가장 높아서 가져가요', { size: 16 })
      + T(240, 248, '로켓은 같은 색이 없을 때만 낼 수 있어요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '과제', t: '과제 카드에 그려진 카드는, 그 과제를 가진 사람이 가져가야 해요',
    d: '내 과제가 노랑 7이라면, 노랑 7이 나온 판을 내가 이겨야 해요. 다른 사람이 가져가면 미션 실패예요. 그래서 누가 언제 무엇을 낼지 모두 함께 머리를 맞대요.',
    art: task(40, 50, '노랑', 7) + T(130, 78, '내 과제', { size: 16 })
      + crew(40, 150, '노랑', 7) + crew(100, 150, '노랑', 9, { hi: true }) + person(200, 186, { fill: C.cream, label: '나', lsize: 15.5 }) + ok(240, 150, 15)
      + crew(290, 150, '노랑', 7) + crew(350, 150, '노랑', 8, { hi: true }) + person(440, 186, { fill: C.okTint }) + no(440, 136, 15)
      + T(130, 268, '내가 가져가면 성공', { size: 15.5, fill: C.ok }) + T(360, 268, '남이 가져가면 실패', { size: 15.5, fill: C.pt }),
  },
  {
    k: '통신', t: '미션마다 한 번, 카드 한 장을 펴서 살짝 알려 줄 수 있어요',
    d: '판이 시작되기 전에 내 카드 한 장을 앞에 펴고 통신 토큰을 올려요. 토큰이 위에 있으면 그 색에서 가장 높은 카드, 가운데면 하나뿐인 카드, 아래면 가장 낮은 카드라는 뜻이에요.',
    art: [['위', '가장 높아요', 30], ['가운데', '하나뿐이에요', 60], ['아래', '가장 낮아요', 90]].map(([lab, mean, dy], i) => crew(60 + i * 140, 60, '분홍', [9, 4, 2][i], { w: 64, h: 90 }) + circ(124 + i * 140, 60 + [14, 45, 76][i], 11, { fill: C.ok, stroke: '#fff', sw: 2.4 }) + T(92 + i * 140, 182, `토큰 ${lab}`, { size: 15.5 }) + T(92 + i * 140, 210, mean, { size: 15.5, fill: C.pt })).join('')
      + T(240, 260, '말로는 알려 줄 수 없어요', { size: 16 }),
  },
];

// ---------- 체커 ----------
const CK = 26;
const ckBoard = (x, y, n, pieces = {}, o = {}) => {
  let s = rect(x - 4, y - 4, n * CK + 8, n * CK + 8, { fill: C.woodDark, rx: 6 });
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s += rect(x + c * CK, y + r * CK, CK, CK, { fill: (r + c + (o.par || 0)) % 2 ? '#7A5A3C' : '#F1E3C8' });
  Object.entries(pieces).forEach(([k, v]) => { const [r, c] = k.split(',').map(Number); s += piece(x + c * CK + CK / 2, y + r * CK + CK / 2, v); });
  return s;
};
const piece = (cx, cy, v) => {
  const fill = v[0] === 'r' ? C.red : '#2A2F3A';
  let s = circ(cx, cy + 2.5, 10, { fill: C.ink }) + circ(cx, cy, 10, { fill, stroke: '#fff', sw: 1.6 }) + circ(cx, cy, 6, { stroke: '#fff', sw: 1.2, op: 0.5 });
  if (v[1] === 'k') s += circ(cx, cy - 4.5, 10, { fill, stroke: '#fff', sw: 1.6 }) + crown(cx, cy - 5, 0.45, C.gold);
  return s;
};
const setup = () => { const p = {}; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) { if (r < 3) p[`${r},${c}`] = 'r'; if (r > 4) p[`${r},${c}`] = 'b'; } return p; };
const checkers = [
  {
    k: '준비', t: '어두운 칸에만 말 12개씩을 놓고, 상대 말을 모두 잡으면 이겨요',
    d: '판은 각자 왼쪽 아래 칸이 어두운 칸이 되게 놓아요. 어두운 칸에만, 각자 앞쪽 세 줄에 말 12개를 놓아요. 상대 말을 모두 잡거나 움직이지 못하게 하면 이겨요.',
    art: ckBoard(28, 46, 8, setup()) + T(376, 92, '어두운 칸에만', { size: 16 }) + T(376, 122, '말 12개씩', { size: 16, fill: C.pt })
      + T(376, 196, '다 잡거나', { size: 15.5, fill: C.ink2 }) + T(376, 222, '못 움직이게 하면 승리', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '움직이기', t: '말은 어두운 칸을 따라 대각선 앞으로 한 칸씩 가요',
    d: '내 차례에 말 하나를 대각선 앞으로 한 칸 옮겨요. 보통 말은 뒤로 갈 수 없어요. 어두운 색 말이 먼저 해요.',
    art: ckBoard(40, 46, 5, { '3,1': 'b' }, { par: 1 }) + arrow(40 + 1.5 * CK, 46 + 3.4 * CK, 40 + 0.6 * CK, 46 + 2.6 * CK, { w: 3, head: 10 }) + arrow(40 + 1.5 * CK, 46 + 3.4 * CK, 40 + 2.4 * CK, 46 + 2.6 * CK, { w: 3, head: 10 })
      + ring(40 + 0.5 * CK, 46 + 2.5 * CK, 12) + ring(40 + 2.5 * CK, 46 + 2.5 * CK, 12)
      + T(340, 110, '대각선 앞으로', { size: 17 }) + T(340, 142, '한 칸씩', { size: 17, fill: C.pt }) + no(300, 210, 14) + T(370, 210, '뒤로는 못 가요', { size: 16 }),
  },
  {
    k: '잡기', t: '바로 앞 상대 말을 뛰어넘으면 잡아요. 잡을 수 있으면 꼭 잡아야 해요',
    d: '대각선 바로 앞에 상대 말이 있고 그 뒤 칸이 비어 있으면 뛰어넘어 잡아요. 뛰어넘은 자리에서 또 잡을 수 있으면 이어서 잡아요.',
    art: ckBoard(30, 40, 7, { '6,0': 'b', '5,1': 'r', '3,3': 'r' }, { par: 1 }) + arrow(30 + 0.5 * CK, 40 + 6.3 * CK, 30 + 2.4 * CK, 40 + 4.6 * CK, { w: 3.2, head: 10, bend: 10 }) + arrow(30 + 2.6 * CK, 40 + 4.4 * CK, 30 + 4.4 * CK, 40 + 2.6 * CK, { w: 3.2, head: 10, bend: 10 })
      + no(30 + 1.5 * CK, 40 + 5.5 * CK, 9) + no(30 + 3.5 * CK, 40 + 3.5 * CK, 9)
      + T(356, 92, '뛰어넘어 잡고', { size: 16 }) + T(356, 122, '이어서 또 잡기', { size: 16, fill: C.pt }) + pill(356, 196, '잡을 수 있으면 꼭', { size: 15 }),
  },
  {
    k: '킹', t: '맞은편 끝줄에 닿으면 말을 하나 더 얹어 ‘킹’이 돼요',
    d: '끝줄에 닿은 말은 말을 하나 더 얹어 킹으로 만들어요. 킹은 대각선 뒤로도 한 칸씩 갈 수 있어요. 끝줄에 들어선 차례에는 거기서 멈춰요.',
    art: ckBoard(40, 46, 5, { '0,2': 'bk' }, { par: 1 }) + arrow(40 + 2.5 * CK, 46 + 0.5 * CK, 40 + 1.4 * CK, 46 + 1.6 * CK, { w: 3, head: 10 }) + arrow(40 + 2.5 * CK, 46 + 0.5 * CK, 40 + 3.6 * CK, 46 + 1.6 * CK, { w: 3, head: 10 })
      + T(330, 92, '두 개 겹치면 킹', { size: 17 }) + T(330, 124, '뒤로도 가요', { size: 17, fill: C.pt }) + piece(300, 200, 'rk') + piece(360, 200, 'bk'),
  },
];

// ---------- 무궁화 꽃이 피었습니다 ----------
const wall = (x, y, h = 200) => rect(x, y, 26, h, { fill: '#C9B79C', stroke: C.ink, sw: 2 }) + [0, 1, 2, 3, 4, 5].map((i) => line(x, y + 30 + i * 30, x + 26, y + 30 + i * 30, { stroke: C.woodDark, sw: 1.2 })).join('');
const ground = (y = 262) => rect(0, y, 480, 38, { fill: '#EDE4D3' });
const mugunghwa = [
  {
    k: '목표', t: '술래가 구호를 외치는 동안 다가가고, 돌아보면 멈춰요',
    d: '술래는 벽을 보고 “무궁화 꽃이 피었습니다”를 외쳐요. 나머지는 출발선에서 그동안만 앞으로 다가가요. 들키지 않고 술래 등을 치면 모두 도망칠 수 있어요.',
    art: ground() + wall(436, 60) + kid(410, 196, { fill: C.ptTint }) + bubble(318, 52, '무궁화 꽃이 피었습니다', { size: 15.5, tail: 'br' })
      + line(70, 270, 70, 286, { stroke: C.pt, sw: 3 }) + T(70, 250, '출발선', { size: 15.5, fill: C.pt })
      + kid(150, 196, { fill: C.okTint, pose: 'hop' }) + kid(220, 196, { fill: '#DCEBFA', pose: 'hop' }) + kid(290, 196, { fill: C.cream, pose: 'hop' })
      + arrow(120, 150, 330, 150, { w: 3, dash: '6 6' }),
  },
  {
    k: '멈추기', t: '술래가 돌아보면 그 자리에 멈춰요. 움직이다 들키면 잡혀요',
    d: '구호가 끝나는 순간 술래가 뒤돌아봐요. 움직이는 사람이 보이면 이름을 불러요. 불린 사람은 술래 옆으로 가서 손을 잡고 기다려요.',
    art: ground() + wall(436, 60) + kid(400, 196, { fill: C.ptTint }) + bubble(330, 70, '움직였어!', { size: 16, tail: 'br' })
      + kid(120, 196, { fill: C.okTint }) + ok(120, 150, 13) + kid(190, 196, { fill: '#DCEBFA', pose: 'kick' }) + no(190, 150, 13) + motion(212, 230, 18, -30, 30, { count: 3 })
      + kid(270, 196, { fill: C.cream }) + ok(270, 150, 13) + T(160, 120, '꼼짝 말고 멈추기', { size: 16, fill: C.pt }),
  },
  {
    k: '끊기', t: '술래 가까이 가서 잡힌 손을 끊으면 모두 출발선으로 도망쳐요',
    d: '잡힌 사람들은 술래와 손을 잡고 줄줄이 서 있어요. 누군가 몰래 다가와 손 사이를 “끊어!” 하고 내리치거나 술래 등을 치면, 잡힌 사람도 함께 모두 도망쳐요.',
    art: ground() + wall(436, 60) + kid(410, 196, { fill: C.ptTint }) + kid(350, 196, { fill: '#DCEBFA' }) + line(375, 214, 386, 214, { stroke: C.ink, sw: 4 })
      + kid(270, 196, { fill: C.okTint, pose: 'throw' }) + bubble(250, 90, '끊어!', { size: 17, tail: 'br' }) + motion(318, 196, 14, 160, 220, { count: 3 })
      + arrow(230, 236, 90, 236, { w: 3.4 }) + arrow(330, 246, 150, 252, { w: 3.4, c: C.ok }) + T(100, 200, '모두 도망!', { size: 16, fill: C.pt }),
  },
  {
    k: '멈춰!', t: '술래가 “멈춰!”를 외치면 모두 서고, 정한 걸음만큼 와서 쳐요',
    d: '도망치다 술래가 “멈춰!”라고 외치면 모두 그 자리에 멈춰요. 술래는 미리 정한 걸음 수(보통 세 걸음)만큼 와서 한 사람을 쳐요. 맞은 사람이 다음 술래예요.',
    art: ground() + kid(380, 196, { fill: C.ptTint, pose: 'hop' }) + bubble(400, 70, '멈춰!', { size: 18, tail: 'bl' })
      + [0, 1, 2].map((i) => ell(330 - i * 40, 274, 10, 5, { fill: C.ink2, op: 0.7 }) + T(330 - i * 40, 288, String(i + 1), { size: 12 })).join('')
      + kid(200, 196, { fill: C.okTint }) + point(270, 214, { s: 1, rot: 180 }) + kid(90, 196, { fill: '#DCEBFA' })
      + pill(200, 120, '다음 술래', { size: 15, bg: C.pt }) + T(330, 236, '세 걸음', { size: 15.5 }),
  },
];

// ---------- 수건돌리기 ----------
const ringPeople = (cx, cy, rx, ry, k, o = {}) => [...Array(k)].map((_, i) => { const a = -Math.PI / 2 + (i / k) * Math.PI * 2; const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; return (o.skip === i ? rect(x - 14, y - 12, 28, 30, { stroke: C.pt, sw: 2.4, rx: 8, dash: '5 4' }) : person(x, y, { s: 0.72, fill: o.fills ? o.fills[i % o.fills.length] : C.mist })); }).join('');
const towel = (cx, cy, rot = 0) => g(rect(-14, -9, 28, 18, { fill: '#fff', stroke: C.ink, sw: 1.8, rx: 3 }) + line(-14, -3, 14, -3, { stroke: C.sky, sw: 2 }) + line(-14, 3, 14, 3, { stroke: C.sky, sw: 2 }), { x: cx, y: cy, rot });
const FILL8 = [C.mist, C.okTint, '#DCEBFA', C.cream];
const sugeon = [
  {
    k: '목표', t: '둥글게 앉은 사람들 뒤로 술래가 돌다가 몰래 수건을 놓아요',
    d: '모두 안쪽을 보고 둥글게 앉아요. 술래는 수건을 들고 원 바깥을 빙빙 돌아요. 앉은 사람은 뒤를 돌아보지 않고 술래가 내 뒤에 수건을 놓았는지 눈치를 봐요.',
    art: ellipseGround() + ringPeople(200, 150, 120, 84, 8, { fills: FILL8 }) + person(352, 70, { fill: C.ptTint, s: 0.9 }) + towel(380, 76, 10)
      + arrow(334, 56, 262, 42, { w: 3, bend: 10 }) + T(420, 160, '원 바깥을', { size: 16 }) + T(420, 188, '도는 술래', { size: 16, fill: C.pt }),
  },
  {
    k: '놓기', t: '술래는 한 사람 등 뒤에 수건을 살짝 놓고 계속 달려요',
    d: '술래는 아무도 눈치채지 못하게 한 사람 등 뒤에 수건을 놓고 그대로 달려요. 놓는 척만 하고 지나가도 돼요. 앉은 사람은 손으로 등 뒤를 더듬어 확인하기도 해요.',
    art: person(160, 150, { s: 1.4, fill: '#DCEBFA' }) + towel(160, 214, 0) + T(160, 254, '내 뒤에 수건이?', { size: 16 })
      + person(330, 140, { s: 1.3, fill: C.ptTint }) + arrow(360, 190, 440, 190, { w: 3.4 }) + bubble(330, 54, '쉿…', { size: 16, tail: 'bl' }),
  },
  {
    k: '쫓기', t: '수건을 알아챈 사람은 수건을 들고 술래를 쫓아요',
    d: '수건을 발견하면 바로 들고 일어나 술래를 쫓아요. 술래는 원을 한 바퀴 돌아 그 사람이 비운 자리에 먼저 앉으려고 해요.',
    art: ellipseGround() + ringPeople(200, 150, 120, 84, 8, { fills: FILL8, skip: 2 }) + T(262, 150, '빈자리', { size: 15.5, fill: C.pt })
      + person(360, 228, { fill: C.ptTint, s: 0.85 }) + person(410, 140, { fill: '#DCEBFA', s: 0.85 }) + towel(434, 136, -20)
      + arrow(404, 172, 378, 200, { w: 3 }) + T(434, 264, '쫓아라!', { size: 16, fill: C.pt }),
  },
  {
    k: '앉으면 살아요', t: '술래가 빈자리에 먼저 앉으면, 쫓던 사람이 새 술래가 돼요',
    d: '술래가 비운 자리에 먼저 앉으면 살아요. 쫓던 사람이 새 술래가 되어 수건을 들고 돌아요. 수건을 못 알아채서 술래가 한 바퀴 돌아와 등을 치면 그 사람이 술래가 돼요.',
    art: person(120, 140, { fill: C.ptTint, s: 1.3 }) + ok(160, 96, 15) + T(120, 214, '빈자리에 앉으면', { size: 16 }) + T(120, 242, '술래는 살아요', { size: 16, fill: C.ok })
      + person(340, 140, { fill: '#DCEBFA', s: 1.3 }) + towel(380, 160, 10) + pill(340, 224, '새 술래', { size: 16, bg: C.pt }),
  },
];
function ellipseGround() { return ell(200, 156, 150, 110, { fill: '#E5EDD9' }); }

// ---------- 실뜨기 ----------
const STR = C.pt;
const sline = (pts, o = {}) => path('M' + pts.map((p) => p.join(' ')).join('L'), { stroke: o.c || STR, sw: o.w || 2.6, cap: 'round' });
const hands2 = (lx, rx, y, s = 1) => hand(lx, y, { s, rot: 90 }) + hand(rx, y, { s, rot: -90 });
const FIG = {
  날틀: (cx, cy, w = 120, h = 46) => sline([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2]]) + sline([[cx - w / 2, cy + h / 2], [cx + w / 2, cy + h / 2]]) + sline([[cx - w / 2, cy - h / 2], [cx - w / 6, cy + h / 2]]) + sline([[cx - w / 2, cy + h / 2], [cx - w / 6, cy - h / 2]]) + sline([[cx + w / 2, cy - h / 2], [cx + w / 6, cy + h / 2]]) + sline([[cx + w / 2, cy + h / 2], [cx + w / 6, cy - h / 2]]),
  쟁반: (cx, cy, w = 120, h = 46) => sline([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2]]) + sline([[cx - w / 2, cy], [cx + w / 2, cy]]) + sline([[cx - w / 4, cy - h / 2], [cx - w / 4, cy + h / 2]]) + sline([[cx + w / 4, cy - h / 2], [cx + w / 4, cy + h / 2]]),
  젓가락: (cx, cy, w = 120, h = 46) => sline([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2]]) + sline([[cx - w / 2, cy + h / 2], [cx + w / 2, cy + h / 2]]) + sline([[cx - w / 2, cy - 6], [cx + w / 2, cy + 6]]) + sline([[cx - w / 2, cy + 6], [cx + w / 2, cy - 6]]),
  베틀: (cx, cy, w = 120, h = 46) => sline([[cx - w / 2, cy], [cx - w / 4, cy - h / 2], [cx + w / 4, cy - h / 2], [cx + w / 2, cy]]) + sline([[cx - w / 2, cy], [cx - w / 4, cy + h / 2], [cx + w / 4, cy + h / 2], [cx + w / 2, cy]]) + sline([[cx - w / 4, cy - h / 2], [cx + w / 4, cy + h / 2]]) + sline([[cx - w / 4, cy + h / 2], [cx + w / 4, cy - h / 2]]),
  방석: (cx, cy, w = 120, h = 46) => sline([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2]]) + sline([[cx, cy - h / 2], [cx + w / 4, cy], [cx, cy + h / 2], [cx - w / 4, cy], [cx, cy - h / 2]]),
};
const siltteugi = [
  {
    k: '목표', t: '실 고리 하나를 둘이 번갈아 떠서 모양을 이어 가요',
    d: '1m쯤 되는 실의 양 끝을 묶어 고리를 만들어요. 한 사람이 손에 걸어 첫 모양을 만들면, 다른 사람이 손가락으로 떠서 새 모양으로 받아 가요. 실이 풀리거나 엉키게 한 사람이 져요.',
    art: kid(90, 150, { fill: C.okTint }) + kid(390, 150, { fill: C.ptTint }) + FIG.날틀(240, 160, 140, 40) + hand(166, 160, { s: 0.9, rot: 90 }) + hand(314, 160, { s: 0.9, rot: -90 })
      + ell(240, 60, 60, 22, { stroke: STR, sw: 2.6 }) + T(240, 30, '실 1m, 끝을 묶어 고리로', { size: 15.5 })
      + T(240, 254, '풀리지 않게 오래 이어 가요', { size: 16, fill: C.pt }),
  },
  {
    k: '날틀', t: '첫 사람이 실을 두 손에 감고 가운뎃손가락으로 떠서 ‘날틀’을 만들어요',
    d: '실 고리를 두 손바닥 뒤로 한 번 감아 걸고, 한쪽 가운뎃손가락으로 반대편 손바닥의 줄을 떠요. 다른 손도 똑같이 하면 가운데에 X자 두 개가 생긴 날틀이 돼요.',
    art: hands2(110, 370, 150, 1.3) + FIG.날틀(240, 150, 200, 64) + ring(173, 150, 22) + ring(307, 150, 22)
      + T(240, 64, '날틀', { size: 20, weight: 800 }) + T(240, 246, '가운데 X자 두 개', { size: 16, fill: C.pt }),
  },
  {
    k: '쟁반', t: '다음 사람이 X자를 엄지와 검지로 집어 밖으로 둘러 올려 떠요',
    d: '날틀 양쪽의 가위처럼 벌어진 곳을 엄지와 검지로 집어요. 바깥 줄 아래로 둘러 가운데로 올려 뜨고 손을 벌리면 네모난 쟁반이 돼요.',
    art: FIG.날틀(130, 110, 150, 50) + point(90, 160, { s: 0.9, rot: -60 }) + point(170, 160, { s: 0.9, rot: -120 }) + arrow(220, 130, 270, 130, { w: 3.4 })
      + FIG.쟁반(370, 130, 150, 64) + T(130, 222, '날틀', { size: 16 }) + T(370, 222, '쟁반', { size: 18, fill: C.pt }),
  },
  {
    k: '이어 가기', t: '번갈아 떠서 젓가락, 베틀, 방석처럼 모양을 바꿔 가요',
    d: '많이 알려진 순서는 날틀, 쟁반, 젓가락, 베틀, 쟁반, 방석, 가위줄이에요. 순서는 지역마다 다르고, 익숙해지면 손 가는 대로 새 모양을 만들어도 돼요.',
    art: [['날틀', 60, 70], ['쟁반', 190, 70], ['젓가락', 320, 70], ['베틀', 120, 190], ['방석', 260, 190]].map(([n, x, y]) => rect(x - 52, y - 34, 104, 68, { fill: C.mist, rx: 12 }) + FIG[n](x, y - 6, 80, 30) + T(x, y + 50, n, { size: 15.5 })).join('')
      + arrow(116, 64, 134, 64, { w: 2.6, head: 9 }) + arrow(246, 64, 264, 64, { w: 2.6, head: 9 }) + arrow(288, 128, 180, 168, { w: 2.6, head: 9, bend: -10 }) + arrow(176, 184, 204, 184, { w: 2.6, head: 9 })
      + T(410, 196, '풀리면', { size: 16 }) + T(410, 224, '지는 거예요', { size: 16, fill: C.pt }),
  },
];

// ---------- 구슬치기 ----------
const MB = ['#5B8DEF', '#F2B42E', '#3D9A5E', '#D8413F', '#7E55BE', '#79AEE3'];
const marble = (cx, cy, i = 0, r = 9) => circ(cx, cy + 1.5, r, { fill: C.ink, op: 0.4 }) + circ(cx, cy, r, { fill: MB[i % MB.length], stroke: C.ink, sw: 1.6, op: 0.95 }) + path(`M${cx - r * 0.5} ${cy + r * 0.2}q${r * 0.5} ${-r * 0.8} ${r} 0`, { stroke: '#fff', sw: 1.6, op: 0.7 }) + circ(cx - r * 0.35, cy - r * 0.4, r * 0.22, { fill: '#fff', op: 0.8 });
const tri = (cx, cy, s = 1) => poly([[cx, cy - 56 * s], [cx + 64 * s, cy + 40 * s], [cx - 64 * s, cy + 40 * s]], { fill: '#F6EAD3', stroke: C.woodDark, sw: 2.6 });
const fist = (cx, cy) => blob([(a) => rect(cx - 46, cy - 26, 92, 62, { ...a, rx: 24 }), ...[0, 1, 2, 3].map((i) => (a) => circ(cx - 31 + i * 21, cy - 24, 12, a)), (a) => ell(cx - 40, cy + 12, 14, 20, a)], C.skin, 2.2) + [0, 1, 2].map((i) => line(cx - 20 + i * 21, cy - 16, cx - 20 + i * 21, cy - 4, { stroke: C.ink, sw: 1.6 })).join('');
const TRIP = [[0, -14], [-14, 10], [14, 10], [0, 22], [-26, 28], [26, 28], [0, 0]];
const guseul = [
  {
    k: '목표', t: '세모 안에 구슬을 모아 두고, 내 구슬로 쳐내면 가져가요',
    d: '땅에 세모를 그리고 사람마다 구슬을 몇 개씩 넣어요. 정한 선에서 내 구슬을 던지거나 굴려 맞히고, 세모 밖으로 나간 구슬은 내 것이 돼요. 구슬을 많이 모으면 이겨요.',
    art: rect(0, 230, 480, 70, { fill: '#EDE4D3' }) + tri(340, 150, 1.2) + TRIP.map(([dx, dy], i) => marble(340 + dx, 150 + dy, i)).join('')
      + kid(90, 160, { fill: C.okTint, pose: 'throw' }) + line(150, 276, 150, 292, { stroke: C.pt, sw: 3 }) + T(150, 258, '던지는 선', { size: 15.5, fill: C.pt })
      + arrow(120, 140, 290, 150, { w: 3, dash: '6 6', bend: 30 }),
  },
  {
    k: '쳐내기', t: '세모 밖으로 나간 구슬은 모두 내 것이에요',
    d: '내 구슬이 세모 안 구슬을 맞혀 밖으로 밀어내면, 나간 구슬을 다 가져가요. 한 번에 여러 개가 나가도 모두 내 것이에요. 내 구슬이 세모 안에 남으면 그 구슬도 내놓기로 하는 곳이 많아요.',
    art: tri(200, 150, 1.3) + TRIP.slice(0, 5).map(([dx, dy], i) => marble(200 + dx, 154 + dy, i)).join('') + marble(118, 230, 1, 11)
      + marble(330, 210, 5) + marble(360, 236, 3) + motion(330, 210, 14, 120, 200, { count: 3 }) + arrow(270, 200, 314, 210, { w: 3 }) + ok(400, 214, 15)
      + T(380, 100, '밖으로 나간 구슬', { size: 16 }) + T(380, 130, '내 것!', { size: 18, fill: C.pt }) + T(118, 262, '내 구슬', { size: 15.5 }),
  },
  {
    k: '홀짝', t: '손에 쥔 구슬이 홀인지 짝인지 맞히면 그만큼 가져와요',
    d: '한 사람이 구슬 몇 개를 손에 몰래 쥐고 내밀면, 상대가 “홀” 또는 “짝”을 외쳐요. 맞히면 쥔 만큼 가져오고, 틀리면 그만큼 줘요.',
    art: fist(120, 140) + T(120, 214, '몇 개를 쥐었을까?', { size: 16 })
      + bubble(260, 72, '홀!', { size: 22, tail: 'bl' }) + arrow(220, 140, 290, 140, { w: 3.4 })
      + [0, 1, 2].map((i) => marble(330 + i * 34, 140, i, 12)).join('') + T(364, 190, '3개, 홀이에요', { size: 16, fill: C.ok }) + T(364, 222, '맞혔으니 3개 가져와요', { size: 15.5, fill: C.ink2 }),
  },
  {
    k: '튕기기', t: '엄지로 내 구슬을 튕겨 상대 구슬을 맞히면 가져와요',
    d: '땅에 구슬을 굴려 놓고 차례로 튕겨 맞혀요. 검지를 구부려 구슬을 올리고 엄지로 튕기는 방법을 많이 써요. 딴 구슬은 끝나면 돌려줄지 미리 정해요.',
    art: rect(0, 230, 480, 70, { fill: '#EDE4D3' }) + hand(110, 196, { s: 1.4, rot: 70 }) + marble(160, 206, 0, 11) + arrow(176, 206, 320, 214, { w: 3.2, dash: '6 6' })
      + marble(340, 216, 3, 11) + motion(340, 216, 15, 160, 200, { count: 2 }) + ok(380, 176, 15)
      + T(260, 90, '엄지로 톡', { size: 17 }) + T(260, 120, '맞히면 가져와요', { size: 16, fill: C.pt }) + pill(260, 266, '끝나면 돌려주기도 해요', { size: 14.5 }),
  },
];

// ---------- 자치기 ----------
const chae = (x1, y1, x2, y2) => line(x1, y1, x2, y2, { stroke: C.woodDark, sw: 8 }) + line(x1, y1, x2, y2, { stroke: C.wood, sw: 4.5 });
const al = (cx, cy, rot = 0, s = 1) => g(poly([[-18, 0], [-12, -5], [12, -5], [18, 0], [12, 5], [-12, 5]], { fill: C.wood, stroke: C.ink, sw: 1.8 }), { x: cx, y: cy, rot, s });
const hole = (cx, cy) => ell(cx, cy, 22, 7, { fill: '#6E5A3A', stroke: C.ink, sw: 1.6 });
const jachigi = [
  {
    k: '목표', t: '긴 채로 짧은 알을 쳐서 멀리 보내고, 그 거리를 채로 재어 점수를 내요',
    d: '긴 막대를 채, 짧은 막대를 알이라고 해요. 치는 편(포수)은 알을 멀리 보내고, 막는 편(범)은 날아오는 알을 받으려 해요. 알이 떨어진 곳까지 채 길이로 잰 수가 점수예요.',
    art: rect(0, 230, 480, 70, { fill: '#EDE4D3' }) + hole(70, 238) + kid(60, 164, { fill: C.okTint }) + chae(80, 166, 120, 206) + T(60, 284, '포수', { size: 15.5 })
      + al(300, 100, 30) + motion(300, 100, 22, 150, 210, { count: 3 }) + arrow(130, 150, 280, 104, { w: 3, dash: '6 6', bend: 30 })
      + kid(410, 164, { fill: C.ptTint, pose: 'throw' }) + T(410, 284, '범', { size: 15.5 }) + T(240, 40, '멀리 보낼수록 점수가 커요', { size: 16, fill: C.pt }),
  },
  {
    k: '떠서 날리기', t: '홈 위에 알을 가로로 얹고 채로 떠서 멀리 날려요',
    d: '땅에 판 작은 홈 위에 알을 가로로 얹고 채 끝을 밑에 넣어 힘껏 떠서 날려요. 범이 맨손으로 받으면 편이 바뀌어요. 못 받으면 범이 알을 홈 쪽으로 던지고 포수가 쳐 내요.',
    art: rect(0, 200, 480, 100, { fill: '#EDE4D3' }) + hole(140, 206) + al(140, 198, 0, 1.4) + chae(70, 230, 150, 206) + arrow(150, 180, 230, 100, { w: 3.4 })
      + T(140, 252, '홈 위에 가로로', { size: 16 })
      + kid(380, 126, { fill: C.ptTint, pose: 'throw' }) + bubble(380, 40, '받았다!', { size: 16, tail: 'bl' }) + T(380, 250, '범이 받으면 편 바꾸기', { size: 15.5, fill: C.pt }),
  },
  {
    k: '튀겨 치기', t: '알 끝을 톡 쳐서 튀어 오르면, 떨어지기 전에 다시 힘껏 쳐요',
    d: '알 한쪽 끝을 홈에 비스듬히 걸쳐 두고 그 끝을 채로 톡 치면 알이 빙그르르 떠올라요. 떨어지기 전에 채로 힘껏 쳐서 멀리 보내요. 헛치면 다음 사람에게 넘겨요.',
    art: rect(0, 230, 480, 70, { fill: '#EDE4D3' }) + hole(110, 238) + al(118, 228, -25, 1.3) + chae(40, 210, 100, 228) + T(110, 274, '① 끝을 톡', { size: 15.5 })
      + al(220, 120, 60, 1.3) + motion(220, 120, 22, 0, 360, { count: 6, len: 8 }) + arrow(150, 210, 206, 146, { w: 3 }) + T(220, 74, '② 빙그르르', { size: 15.5 })
      + chae(270, 150, 320, 100) + arrow(330, 110, 440, 70, { w: 3.6 }) + T(380, 170, '③ 힘껏 쳐요', { size: 16, fill: C.pt }),
  },
  {
    k: '점수', t: '홈에서 알이 떨어진 곳까지 채 길이로 몇 번인지 재요',
    d: '채 하나 길이를 1자로 세요. 홈에서 15번 떨어졌으면 15자예요. 포수가 먼저 “20자!”처럼 부르고 범이 받아들이면 재지 않아요. 범이 의심해 쟀는데 짧으면 편이 바뀌어요.',
    art: rect(0, 200, 480, 100, { fill: '#EDE4D3' }) + hole(50, 210) + al(436, 210, 10)
      + [...Array(6)].map((_, i) => chae(70 + i * 60, 236, 124 + i * 60, 236) + T(97 + i * 60, 260, String(i + 1), { size: 12 })).join('')
      + T(240, 90, '채 하나 = 1자', { size: 18 }) + bubble(240, 150, '20자!', { size: 17, tail: 'bl' }) + T(380, 150, '의심되면 재요', { size: 15.5, fill: C.pt }),
  },
];

// ---------- 얼음땡 ----------
const ICE = '#CFE8FA';
const frozen = (cx, cy) => kid(cx, cy, { fill: ICE }) + line(cx - 12, cy + 4, cx + 12, cy + 24, { stroke: C.blue, sw: 4 }) + line(cx + 12, cy + 4, cx - 12, cy + 24, { stroke: C.blue, sw: 4 }) + star(cx + 22, cy - 26, 6, '#fff', { stroke: C.sky });
const eoreum = [
  {
    k: '목표', t: '술래를 피해 도망쳐요. 잡힐 것 같으면 “얼음!” 하고 멈춰요',
    d: '술래가 열을 세는 동안 흩어지고, 술래가 쫓아와 쳐요. 얼음인 사람은 술래가 칠 수 없지만 스스로는 못 움직여요. 술래는 모두를 얼리거나 잡으면 이겨요.',
    art: rect(0, 252, 480, 48, { fill: '#E5EDD9' }) + kid(380, 180, { fill: C.ptTint, pose: 'hop' }) + T(380, 92, '술래', { size: 16, fill: C.pt })
      + kid(250, 180, { fill: C.okTint, pose: 'hop' }) + kid(110, 180, { fill: C.cream, pose: 'hop' }) + arrow(340, 170, 290, 170, { w: 3.4 }) + arrow(210, 170, 160, 170, { w: 3.4, c: C.ok })
      + T(180, 70, '잡히지 않게 도망!', { size: 17 }),
  },
  {
    k: '얼음', t: '“얼음!”을 외치고 멈추면 술래가 칠 수 없어요',
    d: '술래 손이 닿기 전에 “얼음!”을 외치고 그 자리에 멈춰요. 두 팔을 가슴 앞에서 X자로 엇갈려 얼음인 걸 보여 줘요. 얼음인 동안은 움직이면 안 돼요.',
    art: rect(0, 252, 480, 48, { fill: '#E5EDD9' }) + frozen(160, 180) + bubble(160, 76, '얼음!', { size: 20, tail: 'bl' })
      + kid(330, 180, { fill: C.ptTint }) + point(272, 198, { s: 1, rot: 180 }) + no(290, 150, 15) + T(380, 92, '칠 수 없어요', { size: 16, fill: C.pt }),
  },
  {
    k: '땡', t: '친구가 쳐 주며 “땡!”을 외치면 다시 움직일 수 있어요',
    d: '얼음인 친구에게 몰래 달려가 어깨를 치며 “땡!”을 외쳐요. 그러면 친구가 다시 뛸 수 있어요. 구하러 가다 술래가 오면 나도 얼음을 외쳐야 해요.',
    art: rect(0, 252, 480, 48, { fill: '#E5EDD9' }) + frozen(150, 180) + kid(240, 180, { fill: C.okTint, pose: 'throw' }) + bubble(250, 76, '땡!', { size: 20, tail: 'bl' })
      + arrow(320, 170, 420, 170, { w: 3.4, c: C.ok }) + T(380, 120, '다시 달려요', { size: 16, fill: C.ok }),
  },
  {
    k: '새 술래', t: '얼음 아닌 채로 술래에게 잡히면 그 사람이 새 술래예요',
    d: '얼음을 외치기 전에 술래 손이 먼저 닿으면 잡힌 거예요. 그 사람이 새 술래가 돼요. 모두 얼음이 되면 술래가 이기고, 미리 정한 사람이 다음 술래를 해요.',
    art: rect(0, 252, 480, 48, { fill: '#E5EDD9' }) + kid(170, 180, { fill: C.ptTint, pose: 'throw' }) + kid(270, 180, { fill: C.cream, pose: 'kick' }) + motion(270, 150, 26, -60, 0, { count: 3 })
      + pill(270, 76, '새 술래', { size: 16, bg: C.pt }) + T(400, 150, '얼음 전에', { size: 16 }) + T(400, 178, '잡히면', { size: 16, fill: C.pt }),
  },
];

export default {
  'seven-wonders': sevenWonders, citadels, 'the-crew': theCrew, checkers,
  mugunghwa, sugeondolligi: sugeon, siltteugi, guseulchigi: guseul, jachigi, eoreumttaeng: eoreum,
};
