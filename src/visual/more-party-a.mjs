// 파티 게임 그림 설명 (추가 1)
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, motion, card, pile, person, hand, die, pawn, coin, crown, heart, star, table, eye, big } from './kit.mjs';

const dash = (x) => line(x, 24, x, 276, { stroke: C.line, sw: 2, dash: '5 6' });
const faded = (s, op = 0.35) => g(s, { op });

// ---------- 뱅! ----------
const bcard = (x, y, label, o = {}) => card(x, y, { w: o.w || 62, h: o.h || 86, rot: o.rot || 0, fill: o.fill || C.paper, inner: (cx, cy, w, h) => (o.icon ? o.icon(cx, cy - h * 0.14) : '') + T(cx, o.icon ? cy + h * 0.28 : cy, label, { size: o.ls || 16, weight: 800, fill: o.fg || C.ink }) });
const burst = (cx, cy, r = 13) => poly(Array.from({ length: 16 }, (_, i) => { const a = (i * 22.5 - 90) * Math.PI / 180, rr = i % 2 ? r * 0.55 : r; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }), { fill: C.pt, stroke: C.ink, sw: 1.6 });
const cowboy = (cx, cy, o = {}) => person(cx, cy, { hat: o.hat || C.brown, ...o });
const bang = [
  {
    k: '목표', t: '역할마다 이기는 방법이 달라요',
    d: '보안관과 부관은 무법자와 배신자를 모두 쓰러뜨리면 이겨요. 무법자는 보안관을 쓰러뜨리면, 배신자는 마지막에 혼자 남으면 이겨요.',
    art: cowboy(82, 76, { s: 1.1, fill: C.okTint, hat: C.gold }) + star(116, 44, 13) + pill(82, 136, '보안관과 부관', { size: 15.5, bg: C.ok })
      + T(82, 180, '무법자와 배신자를', { size: 15.5 }) + T(82, 206, '모두 쓰러뜨려요', { size: 15.5 })
      + dash(162) + cowboy(240, 76, { s: 1.1, fill: C.ptTint }) + pill(240, 136, '무법자', { size: 15.5, bg: C.pt })
      + T(240, 180, '보안관을', { size: 15.5 }) + T(240, 206, '쓰러뜨려요', { size: 15.5 })
      + dash(318) + cowboy(398, 76, { s: 1.1, fill: '#E6DDF5', hat: '#5A4A7A' }) + pill(398, 136, '배신자', { size: 15.5, bg: '#6B4FA0' })
      + T(398, 180, '마지막에', { size: 15.5 }) + T(398, 206, '혼자 남아요', { size: 15.5 }),
  },
  {
    k: '준비', t: '보안관만 역할을 밝혀요',
    d: '역할 카드를 한 장씩 받아요. 보안관만 카드를 펼치고 나머지는 숨겨요. 인물 카드에 적힌 생명력만큼 카드를 받고 시작해요.',
    art: table(96, 70, 230, 160) + cowboy(211, 44, { s: 0.85, fill: C.okTint, hat: C.gold }) + cowboy(60, 150, { s: 0.85 }) + cowboy(362, 150, { s: 0.85 }) + cowboy(150, 262, { s: 0.85 }) + cowboy(272, 262, { s: 0.85 })
      + card(193, 82, { w: 36, h: 50, inner: (cx, cy) => star(cx, cy, 11) }) + card(106, 126, { w: 34, h: 46, back: true }) + card(282, 126, { w: 34, h: 46, back: true }) + card(140, 174, { w: 34, h: 46, back: true }) + card(250, 174, { w: 34, h: 46, back: true })
      + pill(408, 40, '보안관만 공개', { size: 15.5, bg: C.pt }) + arrow(352, 52, 250, 92, { bend: 10, w: 3, head: 10 })
      + heart(388, 214, 0.85) + heart(416, 214, 0.85) + heart(444, 214, 0.85) + heart(472, 214, 0.85) + T(430, 246, '생명력만큼', { size: 15.5 }) + T(430, 270, '카드 받기', { size: 15.5 }),
  },
  {
    k: '내 차례', t: '2장 뽑고, 쓰고, 넘치면 버려요',
    d: '카드 2장을 뽑아요. 그다음 손에 든 카드를 원하는 만큼 쓰는데, 뱅!은 한 번만 낼 수 있어요. 끝날 때 손패가 생명력보다 많으면 넘는 만큼 버려요.',
    art: badge(30, 40, 1) + T(92, 40, '2장 뽑기', { size: 16 }) + pile(54, 84, { w: 48, h: 66, back: true }) + big(80, 198, '+2장', { fill: C.pt, size: 26 })
      + dash(160) + badge(184, 40, 2) + T(248, 40, '카드 쓰기', { size: 16 }) + bcard(209, 76, '뱅!', { icon: burst }) + T(240, 198, '뱅!은 한 번만', { size: 16, fill: C.pt })
      + dash(320) + badge(338, 40, 3) + T(410, 40, '넘치면 버리기', { size: 15.5 })
      + heart(370, 92, 1.1) + heart(400, 92, 1.1) + heart(430, 92, 1.1) + T(400, 122, '=', { size: 20 })
      + card(358, 138, { w: 24, h: 34, back: true }) + card(388, 138, { w: 24, h: 34, back: true }) + card(418, 138, { w: 24, h: 34, back: true })
      + T(400, 198, '생명력만큼만', { size: 16 }) + T(400, 224, '손에 남겨요', { size: 16 }),
  },
  {
    k: '예시', t: '뱅!을 받으면 빗나감!으로 피해요',
    d: '뱅!을 맞은 사람은 빗나감! 카드를 내서 피할 수 있어요. 빗나감!이 없으면 생명력을 1 잃어요. 생명력이 0이 되면 역할을 밝히고 빠져요.',
    art: cowboy(60, 96, { fill: C.ptTint }) + bcard(104, 46, '뱅!', { icon: burst }) + arrow(184, 90, 300, 90, {}) + cowboy(360, 96, {})
      + line(24, 158, 456, 158, { stroke: C.line, sw: 2, dash: '5 6' })
      + bcard(40, 180, '빗나감!', { w: 66, h: 86, ls: 15.5 }) + ok(134, 222, 14) + T(196, 210, '있으면', { size: 16 }) + T(196, 236, '피해요', { size: 16 })
      + line(250, 172, 250, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + heart(292, 222, 1.7) + no(318, 240, 11) + T(394, 210, '없으면', { size: 16 }) + T(394, 236, '생명력 1 잃어요', { size: 16, fill: C.pt }),
  },
  {
    k: '거리', t: '옆 사람은 거리 1, 한 사람 건너면 2',
    d: '바로 옆 사람까지가 거리 1이에요. 기본 총은 거리 1까지만 쏠 수 있어서, 멀리 있는 사람을 쏘려면 사거리가 긴 무기를 내 앞에 놓아야 해요.',
    art: cowboy(170, 52, { s: 0.95, fill: C.ptTint, label: '나' }) + cowboy(272, 128, { s: 0.85 }) + cowboy(236, 238, { s: 0.85 }) + cowboy(104, 238, { s: 0.85 }) + cowboy(68, 128, { s: 0.85 })
      + arrow(200, 56, 252, 100, { c: C.ok, bend: -10 }) + badge(240, 62, 1, { bg: C.ok })
      + arrow(184, 100, 222, 204, { bend: 16, dash: '7 6' }) + badge(186, 156, 2)
      + line(322, 24, 322, 276, { stroke: C.line, sw: 2, dash: '5 6' })
      + T(402, 84, '기본 총은', { size: 16 }) + T(402, 110, '거리 1까지', { size: 16, fill: C.ok })
      + T(402, 176, '멀리 쏘려면', { size: 16 }) + T(402, 202, '긴 무기 카드', { size: 16, fill: C.pt }),
  },
];

// ---------- 러브레터 ----------
const lcard = (x, y, v, name, o = {}) => card(x, y, { w: o.w || 62, h: o.h || 86, rot: o.rot || 0, op: o.op, inner: (cx, cy, w, h) => T(cx, cy - h * 0.17, v, { size: h * 0.36, weight: 800, fill: C.pt }) + (name ? T(cx, cy + h * 0.28, name, { size: 15.5 }) : '') });
const LL = [[1, '경비병', 5], [2, '사제', 2], [3, '남작', 2], [4, '시녀', 2], [5, '왕자', 2], [6, '왕', 1], [7, '백작부인', 1], [8, '공주', 1]];
const loveletter = [
  {
    k: '목표', t: '끝까지 남거나 큰 숫자를 들면 이겨요',
    d: '한 판에서 혼자 남으면 이겨요. 더미가 떨어질 때까지 여럿이 남았다면 손에 든 숫자가 가장 큰 사람이 이겨요. 이기면 토큰을 1개 받아요.',
    art: faded(person(50, 84, { s: 0.85 })) + no(50, 74, 13) + faded(person(120, 84, { s: 0.85 })) + no(120, 74, 13) + person(190, 84, { s: 0.85, fill: C.okTint })
      + T(120, 150, '혼자 남으면', { size: 16 }) + line(240, 24, 240, 172, { stroke: C.line, sw: 2, dash: '5 6' })
      + lcard(272, 34, 8, '공주', { w: 60, h: 84 }) + T(360, 76, '>', { size: 28, weight: 800 }) + lcard(388, 34, 5, '왕자', { w: 60, h: 84 })
      + T(360, 150, '숫자가 더 크면', { size: 16 })
      + line(24, 186, 456, 186, { stroke: C.line, sw: 2, dash: '5 6' })
      + heart(118, 236, 1.3) + pill(254, 236, '이긴 사람이 토큰 1개', { size: 16, bg: C.pt }) + heart(390, 236, 1.3),
  },
  {
    k: '준비', t: '한 장을 빼 두고 한 장씩 나눠요',
    d: '16장을 섞어 한 장을 보지 않고 빼 둬요. 그다음 한 사람에게 한 장씩 나누고, 나머지는 더미로 놓아요.',
    art: pile(40, 84, { w: 56, h: 78, back: true }) + T(70, 196, '더미', { size: 16 }) + arrow(118, 122, 160, 122, {})
      + card(176, 86, { w: 50, h: 70, back: true, rot: 12 }) + T(202, 196, '보지 않고', { size: 16 }) + T(202, 222, '1장 빼 두기', { size: 16, fill: C.pt })
      + dash(286) + person(336, 66, { s: 0.8 }) + person(436, 66, { s: 0.8 }) + person(386, 196, { s: 0.8, fill: C.ptTint })
      + card(322, 100, { w: 28, h: 38, back: true }) + card(422, 100, { w: 28, h: 38, back: true }) + card(372, 230, { w: 28, h: 38, back: true })
      + pill(386, 150, '1장씩', { size: 16, bg: C.pt }),
  },
  {
    k: '내 차례', t: '한 장 뽑고, 둘 중 한 장을 내요',
    d: '더미에서 한 장을 뽑으면 손에 두 장이 돼요. 그중 한 장을 내 앞에 내려놓고 카드에 적힌 효과를 써요. 손에는 늘 한 장만 남아요.',
    art: badge(34, 34, 1) + T(96, 34, '1장 뽑기', { size: 16 }) + lcard(34, 64, 4, '시녀', { w: 66, h: 92 }) + lcard(112, 64, 1, '경비병', { w: 66, h: 92 }) + box(106, 58, 78, 106)
      + T(145, 186, '방금 뽑은 카드', { size: 15.5, fill: C.muted })
      + arrow(200, 110, 246, 110, {})
      + badge(272, 34, 2) + T(334, 34, '1장 내기', { size: 16 }) + lcard(272, 64, 1, '경비병', { w: 66, h: 92 }) + T(305, 186, '효과를 써요', { size: 15.5, fill: C.pt })
      + lcard(380, 64, 4, '시녀', { w: 66, h: 92, op: 0.5 }) + T(413, 186, '손에 남겨요', { size: 15.5, fill: C.muted })
      + T(240, 248, '손에는 언제나 한 장만 남아요', { size: 16 }),
  },
  {
    k: '예시', t: '경비병으로 상대 카드를 맞혀요',
    d: '경비병을 내고 한 사람을 골라 카드 이름을 말해요. 맞으면 그 사람은 이번 판에서 떨어져요. 경비병이라고는 부를 수 없어요.',
    art: person(56, 206, { fill: C.ptTint, label: '나' }) + bubble(140, 54, '사제죠?', { tail: 'bl', size: 20 }) + lcard(104, 112, 1, '경비병', { w: 58, h: 80 })
      + arrow(184, 152, 262, 152, {}) + lcard(280, 104, 2, '사제', { w: 66, h: 92 }) + no(346, 108, 13) + person(416, 140, { s: 0.85 })
      + T(346, 240, '맞으면 그 사람은 탈락', { size: 16, fill: C.pt }),
  },
  {
    k: '카드', t: '카드는 여덟 가지예요',
    d: '숫자가 클수록 귀하지만 그만큼 지키기 어려워요. 경비병이 5장으로 가장 많아요. 카드마다 쓰는 법은 ‘자세히’ 탭에 정리해 뒀어요.',
    art: T(240, 28, '숫자가 클수록 장수가 적어요', { size: 16, fill: C.muted })
      + LL.map(([v, name, k], i) => { const x = 10 + (i % 4) * 118, y = 56 + Math.floor(i / 4) * 112; return lcard(x, y, v, '', { w: 38, h: 56 }) + T(x + 46, y + 16, name, { size: 15.5, anchor: 'start' }) + T(x + 46, y + 42, `${k}장`, { size: 15.5, anchor: 'start', fill: C.muted }); }).join(''),
  },
];

// ---------- 바퀴벌레 포커 ----------
const roach = (cx, cy, s = 1) => g(path('M-8 -6L-16 -12M-9 2L-18 2M-8 9L-15 16M8 -6L16 -12M9 2L18 2M8 9L15 16', { stroke: C.ink, sw: 2, cap: 'round' }) + path('M-3 -15Q-8 -22 -13 -20M3 -15Q8 -22 13 -20', { stroke: C.ink, sw: 1.6, cap: 'round' })
  + ell(0, 2, 9, 13, { fill: '#8A5A2E', stroke: C.ink, sw: 2 }) + line(0, -8, 0, 13, { stroke: C.ink, sw: 1.4 }) + circ(0, -12, 5, { fill: '#6E4520', stroke: C.ink, sw: 1.8 }), { x: cx, y: cy, s });
const kcard = (x, y, name, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 78, rot: o.rot || 0, back: o.back, op: o.op, fill: name === '바퀴' ? '#FBEFD9' : '#EAF1F8',
  inner: o.back ? null : (cx, cy, w, h) => (name === '바퀴' ? roach(cx, cy + 2, h / 62) : T(cx, cy, name, { size: 18, weight: 800 })) });
const cockroach = [
  {
    k: '목표', t: '같은 그림 4장이 모이면 져요',
    d: '이기는 사람을 가리지 않고 지는 사람 한 명만 정해요. 내 앞에 같은 그림 카드 4장이 펼쳐지면 그 사람이 져요.',
    art: person(128, 54, { s: 0.9 }) + [0, 1, 2, 3].map((i) => kcard(22 + i * 54, 104, '바퀴', { w: 48, h: 68 })).join('') + box(14, 96, 226, 86) + T(127, 212, '바퀴벌레 4장', { size: 16 }) + no(127, 250, 15)
      + dash(266) + T(372, 96, '같은 그림 4장이', { size: 16 }) + T(372, 124, '내 앞에 모이면', { size: 16 }) + T(372, 170, '져요', { size: 28, weight: 800, fill: C.pt }),
  },
  {
    k: '준비', t: '카드를 모두 나눠 손에 들어요',
    d: '64장을 섞어 한 장씩 끝까지 나눠요. 받은 카드는 다른 사람이 못 보게 손에 들어요.',
    art: table(120, 76, 240, 150) + person(240, 46, { s: 0.85 }) + person(72, 150, { s: 0.85 }) + person(408, 150, { s: 0.85 }) + person(240, 262, { s: 0.85, fill: C.ptTint })
      + [[220, 90], [132, 128], [314, 128], [220, 170]].map(([x, y]) => [0, 1, 2].map((i) => card(x + i * 10 - 4, y, { w: 26, h: 36, back: true, shadow: i === 0 })).join('')).join('')
      + pill(96, 36, '끝까지 나눠요', { size: 15.5, bg: C.pt }),
  },
  {
    k: '내 차례', t: '엎어서 건네며 그림을 말해요',
    d: '손에서 한 장을 골라 엎은 채 한 사람에게 밀어요. “이건 바퀴벌레야”처럼 그림을 말하는데, 참말이어도 되고 거짓말이어도 돼요.',
    art: person(60, 200, { fill: C.ptTint, label: '나' }) + bubble(148, 76, '이건 바퀴벌레야', { tail: 'bl', size: 18 })
      + kcard(180, 150, '', { back: true, rot: -8 }) + arrow(252, 190, 334, 190, {}) + person(396, 200, {})
      + rect(318, 22, 146, 98, { stroke: C.muted, sw: 2, rx: 10, dash: '5 5' }) + T(354, 70, '사실은', { size: 15.5, fill: C.muted }) + kcard(396, 34, '쥐', { w: 54, h: 74 })
      + T(226, 268, '거짓말을 해도 돼요', { size: 16, fill: C.pt }),
  },
  {
    k: '받으면', t: '맞히거나, 몰래 보고 넘겨요',
    d: '받은 사람은 “맞아” 또는 “아니야”를 말하고 카드를 뒤집어 확인해요. 자신이 없으면 혼자 카드를 본 뒤 다른 사람에게 넘겨도 돼요.',
    art: bubble(80, 62, '맞아!', { tail: 'bl', size: 20 }) + T(80, 134, '참말 같아요', { size: 16 })
      + line(160, 24, 160, 156, { stroke: C.line, sw: 2, dash: '5 6' }) + bubble(240, 62, '아니야!', { tail: 'bl', size: 20 }) + T(240, 134, '거짓말 같아요', { size: 16 })
      + box(22, 172, 276, 56, { c: C.line, dash: false }) + T(160, 200, '카드를 뒤집어 확인해요', { size: 16 })
      + dash(320) + kcard(350, 34, '', { back: true, w: 44, h: 60 }) + eye(430, 64, 1.2) + T(400, 134, '몰래 보고', { size: 16 })
      + arrow(366, 200, 434, 200, {}) + T(400, 240, '다음 사람에게', { size: 16 }),
  },
  {
    k: '결과', t: '맞히면 건넨 사람이, 틀리면 받은 사람이',
    d: '알아맞혔다면 카드를 건넨 사람이, 틀렸다면 받은 사람이 그 카드를 자기 앞에 펼쳐 놓아요. 카드를 가져간 사람이 다음 차례를 시작해요.',
    art: pill(120, 34, '알아맞혔다면', { size: 16, bg: C.ok }) + kcard(36, 76, '쥐', { w: 60, h: 84 }) + arrow(110, 118, 150, 118, {}) + person(190, 112, { fill: C.ptTint, label: '건넨 사람' })
      + T(120, 222, '건넨 사람 앞에 놓아요', { size: 15.5 })
      + dash(240) + pill(360, 34, '틀렸다면', { size: 16, bg: C.pt }) + kcard(276, 76, '쥐', { w: 60, h: 84 }) + arrow(350, 118, 390, 118, {}) + person(430, 112, { label: '받은 사람' })
      + T(360, 222, '받은 사람 앞에 놓아요', { size: 15.5 }),
  },
];

// ---------- 사보타지 ----------
const PW = '#7A5230';
const pcard = (x, y, dirs, o = {}) => {
  const w = o.w || 44, h = o.h || 62;
  return card(x, y, { w, h, rx: 6, op: o.op, fill: '#E9DCC3', inner: (cx, cy) => {
    let s = '';
    if (dirs.includes('u')) s += line(cx, cy, cx, y + 1.5, { stroke: PW, sw: w * 0.24, cap: 'butt' });
    if (dirs.includes('d')) s += line(cx, cy, cx, y + h - 1.5, { stroke: PW, sw: w * 0.24, cap: 'butt' });
    if (dirs.includes('l')) s += line(cx, cy, x + 1.5, cy, { stroke: PW, sw: w * 0.24, cap: 'butt' });
    if (dirs.includes('r')) s += line(cx, cy, x + w - 1.5, cy, { stroke: PW, sw: w * 0.24, cap: 'butt' });
    return s + circ(cx, cy, w * 0.12, { fill: PW }) + (o.extra ? o.extra(cx, cy) : '');
  } });
};
const nugget = (cx, cy, s = 1) => g(poly([[-10, 4], [-6, -7], [4, -9], [11, -1], [7, 8], [-4, 9]], { fill: C.gold, stroke: C.ink, sw: 2 }) + line(-3, -3, 2, -4, { stroke: '#fff', sw: 2 }), { x: cx, y: cy, s });
const slot = (x, y, w = 44, h = 62) => rect(x, y, w, h, { stroke: C.line2 || C.line, sw: 2, rx: 6, dash: '5 5' });
const pick = (cx, cy, s = 1, c = C.silver) => g(line(-11, 13, 9, -9, { stroke: C.brown, sw: 4.5 }) + path('M-6 -15Q10 -18 17 -1', { stroke: C.ink, sw: 7, cap: 'round' }) + path('M-6 -15Q10 -18 17 -1', { stroke: c, sw: 4, cap: 'round' }), { x: cx, y: cy, s });
const role = (x, y, name, fill, o = {}) => card(x, y, { w: o.w || 70, h: o.h || 96, fill, back: o.back, inner: o.back ? null : (cx, cy) => pick(cx, cy - 14, 1.1, '#fff') + T(cx, cy + 28, name, { size: 16, fill: '#fff' }) });
const saboteur = [
  {
    k: '목표', t: '금까지 길을 이으면 광부가 이겨요',
    d: '광부는 출발 카드에서 금이 숨은 도착 카드까지 길을 이으면 이겨요. 방해꾼은 카드가 다 떨어질 때까지 길이 닿지 못하게 막으면 이겨요.',
    art: pill(190, 36, '광부는 금까지 길 잇기', { size: 15.5, bg: C.ok })
      + pcard(20, 119, 'udlr') + T(42, 204, '출발', { size: 16 }) + pcard(70, 119, 'lr') + pcard(120, 119, 'ldr') + pcard(170, 119, 'lr') + pcard(220, 119, 'ulr')
      + slot(270, 119) + slot(320, 119) + slot(370, 119) + arrow(276, 150, 406, 150, { dash: '7 6', w: 3.5 })
      + card(420, 40, { w: 44, h: 62, back: true }) + card(420, 119, { w: 44, h: 62, fill: '#E9DCC3', inner: (cx, cy) => nugget(cx, cy, 1.2) }) + card(420, 198, { w: 44, h: 62, back: true })
      + pill(190, 262, '방해꾼은 끝까지 막기', { size: 15.5, bg: C.pt }),
  },
  {
    k: '준비', t: '역할 카드를 몰래 한 장씩 받아요',
    d: '역할 카드를 섞어 한 장씩 받아 혼자만 확인해요. 한 장은 일부러 남겨서, 방해꾼이 몇 명인지 아무도 정확히 알 수 없어요.',
    art: role(30, 56, '광부', C.ok) + role(114, 56, '방해꾼', C.pt) + T(107, 184, '역할은 두 가지', { size: 16 })
      + dash(214) + person(270, 70, { s: 0.8 }) + person(350, 70, { s: 0.8 }) + person(430, 70, { s: 0.8 })
      + card(256, 104, { w: 28, h: 38, back: true }) + card(336, 104, { w: 28, h: 38, back: true }) + card(416, 104, { w: 28, h: 38, back: true })
      + card(300, 186, { w: 40, h: 54, back: true, rot: 8 }) + T(396, 200, '1장은 남겨요', { size: 16, fill: C.pt }) + T(396, 226, '아무도 안 봐요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '내 차례', t: '셋 중 하나를 하고 한 장을 뽑아요',
    d: '길 카드를 놓거나, 행동 카드를 쓰거나, 카드 한 장을 버려요. 그다음 더미에서 한 장을 뽑아요. 더미가 떨어지면 뽑지 않고 계속해요.',
    art: pcard(34, 70, 'ulr', { w: 56, h: 78 }) + T(62, 180, '길 놓기', { size: 16 }) + T(116, 110, '또는', { size: 15.5, fill: C.muted })
      + card(142, 70, { w: 56, h: 78, inner: (cx, cy) => pick(cx, cy, 1.3) }) + T(170, 180, '행동 카드', { size: 16 }) + T(224, 110, '또는', { size: 15.5, fill: C.muted })
      + card(250, 70, { w: 56, h: 78, back: true, rot: 10 }) + T(278, 180, '1장 버리기', { size: 16 })
      + arrow(326, 110, 366, 110, {}) + pile(384, 74, { w: 52, h: 72, back: true }) + T(410, 180, '1장 뽑기', { size: 16, fill: C.pt })
      + T(240, 244, '할 수 있는 게 없으면 한 장을 버려요', { size: 16, fill: C.ink2 }),
  },
  {
    k: '길 잇기', t: '맞닿는 길이 모두 이어져야 해요',
    d: '새 카드는 출발 카드에서 이어진 길에 붙여 놓아요. 옆 카드와 맞닿는 변의 길이 서로 맞아야 하고, 카드를 가로로 눕혀 놓을 수는 없어요.',
    art: pcard(46, 66, 'lr', { w: 70, h: 98 }) + pcard(120, 66, 'ldr', { w: 70, h: 98 }) + ok(118, 204, 15) + T(118, 244, '길이 이어져요', { size: 16 })
      + dash(240) + pcard(286, 66, 'lr', { w: 70, h: 98 }) + pcard(360, 66, 'ud', { w: 70, h: 98 }) + no(358, 204, 15) + T(358, 244, '길이 막혀요', { size: 16 }),
  },
  {
    k: '방해', t: '도구가 망가지면 길을 놓을 수 없어요',
    d: '망가진 도구 카드가 내 앞에 놓이면 길 카드를 놓지 못해요. 같은 도구의 수리 카드를 받으면 다시 놓을 수 있어요. 다른 사람이 고쳐 줘도 돼요.',
    art: person(86, 60, { s: 0.85 }) + card(56, 104, { w: 60, h: 84, fill: C.ptTint, inner: (cx, cy) => pick(cx, cy, 1.4) + line(cx - 20, cy - 26, cx + 20, cy + 26, { stroke: C.pt, sw: 4 }) })
      + T(86, 222, '망가진 곡괭이', { size: 16 })
      + arrow(136, 146, 176, 146, {}) + pcard(196, 104, 'lr', { w: 60, h: 84, op: 0.5 }) + no(226, 146, 16) + T(226, 222, '길을 못 놓아요', { size: 16, fill: C.pt })
      + dash(308) + card(364, 104, { w: 60, h: 84, fill: C.okTint, inner: (cx, cy) => pick(cx, cy, 1.4) }) + ok(424, 104, 13)
      + T(394, 222, '수리 카드로', { size: 16 }) + T(394, 248, '풀어요', { size: 16 }),
  },
];

export default { bang, 'love-letter': loveletter, 'cockroach-poker': cockroach, saboteur };
