// 파티 게임 그림 설명
import { C, rect, circ, ell, line, path, poly, g, blob, T, textW, pill, bubble, badge, ok, no, ring, box, arrow, motion, card, pile, numCard, person, hand, point, die, coin, crown, heart, star, timer, grid, table, big, eye } from './kit.mjs';

// ---------- 공용 ----------
// 힌트 받침대
const stand = (cx, cy, word, o = {}) => {
  const w = Math.max(textW(word, o.size || 17) + 24, 64), h = 38;
  return line(cx - w * 0.3, cy + h / 2, cx - w * 0.38, cy + h / 2 + 16, { sw: 2.4 }) + line(cx + w * 0.3, cy + h / 2, cx + w * 0.38, cy + h / 2 + 16, { sw: 2.4 })
    + rect(cx - w / 2, cy - h / 2 + 3, w, h, { fill: C.ink, rx: 6 }) + rect(cx - w / 2, cy - h / 2, w, h, { fill: C.paper, stroke: C.ink, sw: 2.2, rx: 6 })
    + T(cx, cy, word, { size: o.size || 17, fill: o.out ? C.muted : C.blue, op: o.out ? 0.6 : undefined })
    + (o.out ? line(cx - w / 2 + 6, cy + 10, cx + w / 2 - 6, cy - 10, { stroke: C.pt, sw: 3.5 }) : '');
};
// 낱말 칩
const chip = (cx, cy, word, o = {}) => pill(cx, cy, word, { size: o.size || 16, bg: o.bg || C.paper, fg: o.fg || C.ink, stroke: o.stroke || C.ink, pad: 12 });

// ---------- 저스트 원 ----------
const wordCard = (x, y, words, o = {}) => card(x, y, {
  w: o.w || 150, h: o.h || 176, inner: (cx, cy, w, h, xx, yy) => words.map((wd, i) => badge(xx + 22, yy + 24 + i * (h - 30) / 5, i + 1, { r: 10, bg: o.hot === i ? C.pt : C.ink }) + T(xx + 42, yy + 24 + i * (h - 30) / 5, wd, { size: 16, anchor: 'start', fill: o.hot === i ? C.pt : C.ink })).join(''),
});
const justone = [
  {
    k: '목표', t: '한 단어 힌트로 정답을 맞혀요',
    d: '모두 한 팀이에요. 한 사람이 맞히고, 나머지는 한 단어씩 힌트를 줘요. 카드 13장 가운데 몇 장을 맞히는지가 우리 팀 점수예요.',
    art: person(96, 214, { s: 1.4, fill: C.ptTint }) + bubble(110, 92, '바다?', { size: 22, tail: 'bl' })
      + stand(270, 120, '여름') + stand(390, 120, '해운대') + stand(330, 214, '모래')
      + pill(330, 40, '정답은 맞히는 사람만 몰라요', { size: 13 }),
  },
  {
    k: '준비', t: '13장만 쌓고, 받침대와 마카를 나눠요',
    d: '카드를 섞어 13장만 뒤집어 쌓아 두고 나머지는 상자에 넣어요. 각자 받침대와 마카를 가져가요. 처음 맞힐 사람을 정하고, 그다음부터 시계 방향으로 돌아가요.',
    art: pile(60, 96, { w: 74, h: 100, back: true, count: 5, dx: 2, dy: 3 }) + pill(100, 236, '13장', { size: 16, bg: C.pt })
      + stand(268, 110, '　　') + stand(392, 110, '　　') + stand(268, 210, '　　') + stand(392, 210, '　　')
      + [[318, 100], [442, 100], [318, 200], [442, 200]].map(([x, y]) => g(rect(-4, -18, 8, 30, { fill: C.blue, stroke: C.ink, sw: 1.6, rx: 3 }) + rect(-4, -18, 8, 9, { fill: C.ink, rx: 2 }), { x, y, rot: 20 })).join(''),
  },
  {
    k: '내 차례', t: '맞히는 사람은 번호만 말해요',
    d: '맞히는 사람은 카드를 보지 않고 1~5 중 숫자 하나를 말해요. 나머지는 그 번호의 단어를 보고, 서로 보여 주지 않고 힌트를 한 단어씩 써요.',
    art: person(84, 210, { s: 1.3, fill: C.ptTint, eyes: 'closed' }) + bubble(100, 98, '2번!', { size: 22, tail: 'bl' })
      + wordCard(214, 40, ['사과', '바다', '기차', '우산', '별'], { hot: 1 }) + T(289, 246, '맞히는 사람에게는 안 보여 줘요', { size: 13, fill: C.muted })
      + stand(420, 120, '여름', { size: 15 }),
  },
  {
    k: '비교', t: '같은 힌트는 모두 지워요',
    d: '맞히는 사람이 눈을 감은 동안 힌트를 서로 보여 줘요. 같은 힌트는 두 개 모두 지우고, 규칙에 어긋난 힌트도 지워요. 맞히는 사람은 남은 힌트만 봐요.',
    art: stand(80, 90, '파도', { out: true }) + stand(190, 90, '여름') + stand(300, 90, '파도', { out: true }) + stand(410, 90, '해운대')
      + T(190, 162, '남은 힌트만 보여 줘요', { size: 14, fill: C.muted }) + person(240, 232, { s: 1, fill: C.ptTint, eyes: 'closed' }) + T(330, 236, '눈 감고 기다려요', { size: 14 })
      + path('M80 64Q190 26 300 64', { stroke: C.pt, sw: 2.5, dash: '5 5' }) + T(190, 30, '같아요', { size: 14, fill: C.pt }),
  },
  {
    k: '이럴 땐', t: '이런 힌트는 쓸 수 없어요',
    d: '정답이 ‘바다’라면 바다를 그대로 쓰거나, 바닷가처럼 뿌리가 같은 말, sea처럼 외국어로 바꾼 말은 지워요. 소리만 같은 말도 안 돼요.',
    art: pill(240, 34, '정답: 바다', { size: 16 })
      + stand(90, 116, '바다', { out: true }) + T(90, 168, '정답 그대로', { size: 14 })
      + stand(240, 116, '바닷가', { out: true }) + T(240, 168, '뿌리가 같은 말', { size: 14 })
      + stand(390, 116, 'sea', { out: true }) + T(390, 168, '외국어', { size: 14 })
      + stand(190, 228, '해운대') + ok(250, 228, 14) + stand(330, 228, '파도') + ok(380, 228, 14),
  },
  {
    k: '끝', t: '맞힌 카드 수가 점수예요',
    d: '맞히면 카드를 성공 더미에 놓아요. 틀리면 그 카드와 더미 맨 위 카드까지 버리고, 모르겠다고 넘기면 그 카드만 버려요. 13장을 다 쓰면 성공 더미 카드 수가 점수예요.',
    art: ok(80, 52, 18) + T(80, 90, '맞혔어요', { size: 16 }) + card(54, 116, { w: 52, h: 72 }) + arrow(80, 196, 80, 230, { w: 3, c: C.ok }) + pill(80, 256, '성공 +1', { size: 14, bg: C.ok })
      + no(240, 52, 18) + T(240, 90, '틀렸어요', { size: 16 }) + card(196, 116, { w: 52, h: 72 }) + card(232, 116, { w: 52, h: 72, back: true }) + arrow(240, 196, 240, 230, { w: 3 }) + pill(240, 256, '2장 버려요', { size: 14, bg: C.pt })
      + circ(400, 52, 18, { fill: C.muted }) + T(400, 53, '?', { size: 20, fill: '#fff', weight: 800 }) + T(400, 90, '넘겼어요', { size: 16 }) + card(374, 116, { w: 52, h: 72 }) + arrow(400, 196, 400, 230, { w: 3, c: C.muted }) + pill(400, 256, '1장 버려요', { size: 14, bg: C.muted }),
  },
];

// ---------- 더 마인드 ----------
const mcard = (x, y, v, o = {}) => card(x, y, { w: o.w || 52, h: o.h || 72, rot: o.rot || 0, inner: (cx, cy, w, h) => T(cx, cy, v, { size: h * 0.38, weight: 800, fill: o.fg || C.ink }) });
const shuriken = (cx, cy, r = 16) => g(poly([[0, -r], [r * 0.28, -r * 0.28], [r, 0], [r * 0.28, r * 0.28], [0, r], [-r * 0.28, r * 0.28], [-r, 0], [-r * 0.28, -r * 0.28]], { fill: '#9AA1AD', stroke: C.ink, sw: 2 }) + circ(0, 0, r * 0.2, { fill: C.paper, stroke: C.ink, sw: 1.5 }), { x: cx, y: cy, rot: 15 });
const mind = [
  {
    k: '목표', t: '말없이, 모두 함께 작은 수부터 내요',
    d: '모두 한 팀이에요. 말이나 신호 없이 각자 손에 든 숫자 카드를 작은 수부터 한 더미에 내요. 정한 단계를 모두 넘기면 함께 이겨요.',
    art: mcard(70, 70, 8, { rot: -8 }) + mcard(140, 66, 23, { rot: -3 }) + mcard(210, 66, 41, { rot: 3 }) + mcard(280, 70, 67, { rot: 8 })
      + arrow(80, 172, 330, 172, { w: 4 }) + T(206, 198, '작은 수에서 큰 수로', { size: 16 })
      + bubble(404, 74, '쉿', { size: 22, tail: 'bl' }) + T(404, 250, '말, 손가락, 신호 금지', { size: 14, fill: C.pt }),
  },
  {
    k: '준비', t: '단계 숫자만큼 카드를 받아요',
    d: '1단계는 1장씩, 2단계는 2장씩 받아요. 생명은 사람 수만큼, 수리검은 1장으로 시작해요. 목표는 2명 12단계, 3명 10단계, 4명 8단계예요.',
    art: pill(56, 66, '1단계', { size: 15 }) + [140, 230, 320].map((x) => person(x, 66, { s: 0.7 }) + card(x + 22, 52, { w: 22, h: 30, back: true })).join('')
      + pill(56, 160, '2단계', { size: 15 }) + [140, 230, 320].map((x) => person(x, 160, { s: 0.7 }) + card(x + 20, 146, { w: 22, h: 30, back: true, rot: -8 }) + card(x + 32, 148, { w: 22, h: 30, back: true, rot: 8 })).join('')
      + heart(76, 248, 1.1) + heart(108, 248, 1.1) + heart(140, 248, 1.1) + T(222, 248, '생명 = 사람 수', { size: 14 }) + shuriken(330, 248) + T(392, 248, '수리검 1장', { size: 14 }),
  },
  {
    k: '진행', t: '차례 없이, 때가 됐다 싶으면 내요',
    d: '차례가 없어요. 내 숫자가 지금 가장 작다고 느껴지면 그때 내요. 서로 눈치를 보며 기다리는 시간이 이 게임의 전부예요.',
    art: pill(130, 30, '바닥', { size: 14 }) + mcard(104, 52, 12, { w: 56, h: 78 })
      + person(320, 230, { s: 1, fill: C.ptTint }) + mcard(352, 160, 19, { w: 44, h: 60 }) + arrow(340, 150, 172, 98, { bend: 20 })
      + person(410, 70, { s: 0.75 }) + card(436, 50, { w: 26, h: 36, back: true }) + person(250, 70, { s: 0.75 }) + card(276, 50, { w: 26, h: 36, back: true })
      + timer(110, 222, 1.3) + T(110, 266, '기다리는 시간', { size: 13, fill: C.muted }),
  },
  {
    k: '이럴 땐', t: '더 작은 카드가 남아 있었다면 멈춰요',
    d: '누군가 45를 냈는데 내게 38이 있었다면 바로 멈춰요. 생명 하나를 잃고, 45보다 작은 카드는 모두 공개해 버린 뒤 이어서 해요.',
    art: mcard(60, 50, 45, { w: 64, h: 88 }) + pill(92, 28, '바닥', { size: 13 }) + mcard(190, 50, 38, { w: 64, h: 88, fg: C.pt }) + pill(222, 28, '내 손', { size: 13, bg: C.pt }) + bubble(330, 74, '멈춰요!', { size: 18, tail: 'bl' })
      + heart(90, 214, 1.6) + no(118, 196, 13) + T(90, 256, '생명 −1', { size: 15, fill: C.pt })
      + mcard(220, 186, 38, { w: 44, h: 60 }) + mcard(272, 186, 41, { w: 44, h: 60 }) + arrow(330, 216, 384, 216, { w: 3.5 }) + T(424, 216, '버려요', { size: 15 }) + T(272, 266, '45보다 작은 카드 모두', { size: 13, fill: C.muted }),
  },
  {
    k: '알기', t: '수리검: 다 같이 가장 작은 카드를 버려요',
    d: '누군가 손을 들어 수리검을 쓰자고 하고 모두 손을 들면, 각자 가장 작은 카드를 하나씩 공개해 버려요. 서로의 숫자를 짐작하는 단서가 돼요.',
    art: shuriken(240, 56, 26)
      + [[100, 7], [240, 22], [380, 30]].map(([x, v]) => hand(x, 142, { s: 0.8 }) + mcard(x - 24, 182, v, { w: 48, h: 66 })).join('')
      + T(240, 274, '각자 가장 작은 카드 1장씩 공개', { size: 15 }),
  },
  {
    k: '끝', t: '단계를 넘길수록 보상이 있어요',
    d: '2, 5, 8단계를 넘기면 수리검을, 3, 6, 9단계를 넘기면 생명을 1장씩 받아요. 생명을 모두 잃으면 실패, 목표 단계까지 넘기면 성공이에요.',
    art: Array.from({ length: 12 }, (_, i) => {
      const x = 34 + i * 38, v = i + 1;
      return circ(x, 140, 15, { fill: v <= 4 ? C.ptTint : C.paper, stroke: C.ink, sw: 2 }) + T(x, 141, v, { size: 14, weight: 800 })
        + ([2, 5, 8].includes(v) ? shuriken(x, 92, 12) : '') + ([3, 6, 9].includes(v) ? heart(x, 92, 0.8) : '');
    }).join('')
      + T(240, 196, '넘긴 단계', { size: 14, fill: C.muted }) + pill(130, 250, '생명 0이면 실패', { size: 14, bg: C.pt }) + pill(350, 250, '목표 단계면 성공', { size: 14, bg: C.ok }),
  },
];

// ---------- 마피아 ----------
const roleCard = (x, y, name, col, icon, o = {}) => card(x, y, { w: o.w || 76, h: o.h || 100, fill: col, inner: (cx, cy, w, h) => icon(cx, cy - h * 0.1) + T(cx, cy + h * 0.3, name, { size: 15, fill: col === C.paper ? C.ink : '#fff' }) });
const hatI = (cx, cy) => path(`M${cx - 22} ${cy + 6}h44M${cx - 13} ${cy + 6}v-16h26v16`, { fill: '#fff', stroke: '#fff', sw: 3 });
const crossI = (cx, cy) => path(`M${cx - 5} ${cy - 16}h10v11h11v10h-11v11h-10v-11h-11v-10h11z`, { fill: '#fff' });
const badgeI = (cx, cy) => star(cx, cy, 16, '#fff', { stroke: 'none' });
const citI = (cx, cy) => circ(cx, cy - 6, 8, { fill: C.ink }) + path(`M${cx - 14} ${cy + 14}q0 -12 14 -12q14 0 14 12z`, { fill: C.ink });
const moon = (cx, cy, r = 20) => path(`M${cx + r * 0.3} ${cy - r}A${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.45}A${r * 0.78} ${r * 0.78} 0 1 1 ${cx + r * 0.3} ${cy - r}Z`, { fill: C.gold, stroke: C.ink, sw: 2 });
const sun = (cx, cy, r = 18) => circ(cx, cy, r, { fill: C.gold, stroke: C.ink, sw: 2 }) + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const t = a * Math.PI / 180; return line(cx + Math.cos(t) * (r + 5), cy + Math.sin(t) * (r + 5), cx + Math.cos(t) * (r + 11), cy + Math.sin(t) * (r + 11), { sw: 2.4 }); }).join('');
const mafia = [
  {
    k: '목표', t: '시민 편과 마피아의 대결이에요',
    d: '시민 편은 마피아를 모두 찾아내면 이기고, 마피아는 남은 시민 편과 수가 같아지면 이겨요. 누가 마피아인지는 마피아끼리만 알아요.',
    art: [70, 120, 170, 220].map((x) => person(x, 132, { s: 0.95 })).join('') + T(145, 196, '시민 편', { size: 17 }) + T(145, 222, '마피아를 모두 찾으면 승리', { size: 13, fill: C.muted })
      + T(285, 132, 'vs', { size: 22, weight: 800, fill: C.muted })
      + [350, 410].map((x) => person(x, 132, { s: 0.95, fill: '#3A4152', hat: C.ink })).join('') + T(380, 196, '마피아', { size: 17 }) + T(380, 222, '수가 같아지면 승리', { size: 13, fill: C.muted }),
  },
  {
    k: '준비', t: '진행자 한 명, 역할은 몰래 나눠요',
    d: '진행자를 한 명 정해요. 나머지에게 마피아, 경찰, 의사, 시민 역할을 몰래 나눠요. 마피아는 7명까지 1명, 8~11명이면 2명, 12명 이상이면 3명이 무난해요.',
    art: roleCard(24, 30, '마피아', '#3A4152', hatI) + roleCard(110, 30, '경찰', C.blue, badgeI) + roleCard(196, 30, '의사', C.green, crossI) + roleCard(282, 30, '시민', C.paper, citI)
      + rect(24, 166, 334, 104, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(44, 190, '역할 받는 사람', { size: 14, anchor: 'start', fill: C.muted }) + T(270, 190, '마피아', { size: 14, fill: C.muted })
      + [['7명까지', '1명'], ['8~11명', '2명'], ['12명 이상', '3명']].map(([a, b], i) => T(44, 216 + i * 22, a, { size: 15, anchor: 'start' }) + T(270, 216 + i * 22, b, { size: 15 })).join('')
      + person(420, 120, { s: 1.1, fill: C.ptTint }) + pill(420, 190, '진행자', { size: 14, bg: C.pt }),
  },
  {
    k: '밤', t: '밤: 모두 눈을 감고, 역할만 움직여요',
    d: '진행자가 밤이라고 말하면 모두 눈을 감아요. 마피아는 눈을 떠 한 사람을 고르고, 의사는 지킬 사람을, 경찰은 조사할 사람을 골라요. 진행자는 경찰에게 고개로만 알려 줘요.',
    art: rect(0, 0, 480, 300, { fill: '#2B3346', rx: 0 }) + moon(424, 50, 22)
      + [60, 140, 220, 300, 380].map((x, i) => person(x, 176, { s: 1, eyes: i === 1 ? 'open' : 'closed', fill: i === 1 ? '#3A4152' : C.paper, hat: i === 1 ? C.ink : undefined })).join('')
      + point(160, 120, { s: 0.9, rot: 0 }) + arrow(196, 116, 280, 140, { bend: 16, w: 3.5 }) + ring(300, 164, 36, { c: C.gold })
      + T(240, 262, '마피아만 눈을 뜨고 한 사람을 골라요', { size: 15, fill: '#fff' }),
  },
  {
    k: '낮', t: '낮: 토론하고, 동시에 가리켜요',
    d: '진행자가 밤에 빠진 사람을 알리면 3~5분쯤 토론해요. 하나, 둘, 셋에 모두 동시에 가리켜 가장 많이 지목된 사람이 빠져요. 동점이면 아무도 빠지지 않거나 한 번 더 투표해요.',
    art: sun(424, 52, 18) + bubble(110, 50, '하나, 둘, 셋!', { size: 17, tail: 'bl' })
      + [[70, 200], [160, 230], [250, 236], [340, 226], [420, 196]].map(([x, y]) => person(x, y, { s: 0.85 })).join('') + person(240, 110, { s: 1, fill: C.ptTint })
      + arrow(82, 168, 210, 116, { w: 3 }) + arrow(166, 196, 222, 136, { w: 3 }) + arrow(340, 192, 262, 136, { w: 3 }) + arrow(410, 164, 274, 116, { w: 3 }) + arrow(250, 202, 300, 150, { w: 3, c: C.line })
      + T(240, 64, '4표', { size: 18, fill: C.pt }),
  },
  {
    k: '예시', t: '의사가 지키면 아무 일도 없어요',
    d: '마피아가 지민을 골랐는데 의사도 지민을 지켰다면, 진행자는 “어젯밤 아무 일도 없었습니다”라고만 말해요. 누가 지켰는지는 알려 주지 않아요.',
    art: person(90, 120, { s: 1, fill: '#3A4152', hat: C.ink }) + T(90, 180, '마피아', { size: 14 }) + arrow(126, 112, 204, 112, { w: 3.5 })
      + person(240, 120, { s: 1.1 }) + T(240, 186, '지민', { size: 15 }) + path('M210 74h60v34q0 22 -30 32q-30 -10 -30 -32z', { fill: C.green, stroke: C.ink, sw: 2.2, op: 0.9 }) + crossI(240, 100)
      + person(390, 120, { s: 1 }) + T(390, 180, '의사', { size: 14 }) + arrow(354, 112, 278, 104, { w: 3.5, c: C.green })
      + bubble(240, 248, '어젯밤 아무 일도 없었습니다', { size: 16, tail: 'tl' }),
  },
  {
    k: '끝', t: '어느 쪽이 먼저 조건을 채우나요',
    d: '마피아가 모두 빠지면 시민 편이 이겨요. 마피아 수가 나머지와 같아지면 마피아가 이겨요. 빠진 사람의 역할을 공개할지는 시작 전에 정해요.',
    art: rect(26, 40, 200, 220, { fill: C.okTint, rx: 18 }) + T(126, 70, '시민 편 승리', { size: 17, fill: C.ok })
      + person(86, 150, { s: 0.85 }) + person(166, 150, { s: 0.85 }) + T(126, 214, '마피아 0명', { size: 16 }) + crown(126, 104, 1)
      + rect(254, 40, 200, 220, { fill: C.ptTint, rx: 18 }) + T(354, 70, '마피아 승리', { size: 17, fill: C.pt })
      + person(314, 150, { s: 0.85, fill: '#3A4152', hat: C.ink }) + T(354, 152, '=', { size: 26, weight: 800 }) + person(394, 150, { s: 0.85 }) + T(354, 214, '1명 = 1명', { size: 16 }),
  },
];

// ---------- 아발론 ----------
const vtoken = (cx, cy, yes, r = 22) => circ(cx, cy + 3, r, { fill: C.ink }) + circ(cx, cy, r, { fill: yes ? '#E9F4EE' : '#FBE7E1', stroke: C.ink, sw: 2.2 }) + T(cx, cy + 1, yes ? '찬성' : '반대', { size: r * 0.62, fill: yes ? C.ok : C.pt });
const qcard = (x, y, yes, o = {}) => card(x, y, { w: o.w || 56, h: o.h || 80, back: o.back, fill: yes ? C.blue : C.red, inner: o.back ? null : (cx, cy) => T(cx, cy, yes ? '성공' : '실패', { size: 16, fill: '#fff' }) });
const qtrack = (x, y, res, sizes) => sizes.map((n, i) => {
  const cx = x + i * 66, r = res[i];
  return circ(cx, y + 3, 24, { fill: C.ink }) + circ(cx, y, 24, { fill: r === 'o' ? C.blue : r === 'x' ? C.red : C.paper, stroke: C.ink, sw: 2.2 }) + T(cx, y + 1, r ? (r === 'o' ? '성공' : '실패') : `${n}명`, { size: r ? 13 : 15, fill: r ? '#fff' : C.ink });
}).join('');
const avalon = [
  {
    k: '목표', t: '원정 3번을 먼저 가져가요',
    d: '선의 편과 악의 편이 다섯 번의 원정을 두고 겨뤄요. 선의 편은 원정 3번 성공에 멀린까지 지키면 이기고, 악의 편은 원정 3번을 실패시키거나 멀린을 찾아내면 이겨요.',
    art: qtrack(108, 74, ['o', 'x', 'o', '', ''], [2, 3, 2, 3, 3]) + T(240, 124, '원정 다섯 번, 먼저 3번', { size: 15, fill: C.muted })
      + rect(30, 160, 196, 110, { fill: '#E6EEF9', rx: 16 }) + T(128, 186, '선의 편', { size: 17, fill: C.blue }) + T(128, 216, '성공 3번', { size: 15 }) + T(128, 240, '+ 멀린 지키기', { size: 15 })
      + rect(254, 160, 196, 110, { fill: '#FBE7E1', rx: 16 }) + T(352, 186, '악의 편', { size: 17, fill: C.red }) + T(352, 216, '실패 3번', { size: 15 }) + T(352, 240, '또는 멀린 찾기', { size: 15 }),
  },
  {
    k: '준비', t: '악의 편은 서로를, 멀린은 악을 알아요',
    d: '역할 카드를 몰래 나눠요. 5~6명은 악 2명, 7~9명은 악 3명, 10명은 악 4명이에요. 밤 대본에 따라 악의 편끼리 서로 확인하고, 멀린은 악의 편이 누구인지 확인해요.',
    art: [[60, '멀린', C.blue], [140, '신하', C.blue], [220, '신하', C.blue], [320, '암살자', C.red], [400, '악의 편', C.red]].map(([x, nm, c]) => person(x, 120, { s: 1, fill: c === C.red ? '#F4C9BF' : '#CFE0F5' }) + T(x, 172, nm, { size: 14, fill: c })).join('')
      + eye(60, 70, 0.9) + arrow(78, 70, 296, 82, { bend: 20, w: 3, c: C.blue }) + T(180, 34, '멀린은 악을 알아요', { size: 14, fill: C.blue })
      + path('M330 94Q360 70 390 94', { stroke: C.red, sw: 3, dash: '5 4' }) + T(360, 62, '서로 알아요', { size: 14, fill: C.red })
      + rect(40, 210, 400, 60, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(130, 240, '5~6명 악 2', { size: 15 }) + T(250, 240, '7~9명 악 3', { size: 15 }) + T(366, 240, '10명 악 4', { size: 15 }),
  },
  {
    k: '진행', t: '대표가 원정대를 뽑아요',
    d: '대표가 이번 원정에 갈 사람을 정해진 인원만큼 뽑아요. 5명이면 첫 원정은 2명이에요. 원정 판에 원정마다 몇 명이 가는지 적혀 있어요.',
    art: [[70, 150], [160, 92], [260, 76], [360, 92], [430, 160]].map(([x, y], i) => person(x, y, { s: 0.9, fill: i === 0 ? C.ptTint : C.paper })).join('') + crown(70, 98, 0.9) + T(70, 210, '대표', { size: 14, fill: C.pt })
      + ring(160, 90, 38) + ring(360, 90, 38) + arrow(98, 140, 140, 118, { w: 3 }) + arrow(100, 158, 330, 116, { w: 3, bend: -30 })
      + qtrack(108, 254, ['', '', '', '', ''], [2, 3, 2, 3, 3]) + ring(108, 254, 30, { c: C.pt }),
  },
  {
    k: '투표', t: '모두 동시에 찬성 또는 반대',
    d: '모두 동시에 찬성이나 반대를 공개해요. 찬성이 과반이면 원정대가 출발하고, 같거나 적으면 부결이에요. 부결되면 대표가 왼쪽 사람에게 넘어가요. 연속 다섯 번 부결되면 악의 편이 이겨요.',
    art: vtoken(80, 72, true) + vtoken(160, 72, true) + vtoken(240, 72, false) + vtoken(320, 72, true) + vtoken(400, 72, false)
      + T(240, 128, '찬성 3 : 반대 2', { size: 18 }) + arrow(240, 146, 240, 178, { w: 3.5 }) + pill(240, 200, '과반 찬성이면 출발', { size: 15, bg: C.ok })
      + [0, 1, 2, 3, 4].map((i) => circ(160 + i * 40, 258, 13, { fill: i < 4 ? C.pt : C.paper, stroke: C.ink, sw: 2 })).join('') + T(240, 286, '다섯 번 부결되면 악의 편 승리', { size: 13, fill: C.muted }),
  },
  {
    k: '원정', t: '원정대는 성공이나 실패를 몰래 내요',
    d: '원정대원만 성공이나 실패 카드를 하나 몰래 내요. 선의 편은 성공만 낼 수 있어요. 섞어서 공개했을 때 실패가 1장이라도 있으면 원정은 실패예요.',
    art: qcard(60, 46, true, { back: true }) + qcard(130, 46, true, { back: true }) + arrow(206, 86, 260, 86, { w: 3.5 }) + T(232, 62, '섞어요', { size: 13 })
      + qcard(280, 46, true) + qcard(350, 46, false) + T(342, 156, '실패가 1장 있으니', { size: 15 }) + pill(342, 190, '원정 실패', { size: 16, bg: C.red })
      + rect(40, 222, 400, 56, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(240, 250, '선의 편은 성공만, 악의 편은 둘 중 골라요', { size: 15 }),
  },
  {
    k: '끝', t: '선이 이겨도 마지막에 멀린 암살',
    d: '선의 편이 원정 3번을 성공하면 악의 편이 의논한 뒤 암살자가 멀린으로 보이는 사람 한 명을 지목해요. 맞히면 악의 편이, 틀리면 선의 편이 이겨요.',
    art: qtrack(108, 50, ['o', 'x', 'o', 'o', ''], [2, 3, 2, 3, 3])
      + person(90, 190, { s: 1.1, fill: '#F4C9BF' }) + T(90, 252, '암살자', { size: 14, fill: C.red }) + point(140, 180, { s: 0.9 }) + arrow(176, 176, 300, 176, { w: 3.5, c: C.red })
      + person(340, 190, { s: 1.1, fill: '#CFE0F5' }) + bubble(400, 120, '멀린?', { size: 17, tail: 'bl' })
      + T(340, 262, '맞히면 악의 편 승리', { size: 14, fill: C.muted }),
  },
];

// ---------- 텔레스트레이션 ----------
const sketch = (x, y, inner, o = {}) => {
  const w = o.w || 110, h = o.h || 84;
  return rect(x, y + 3, w, h, { fill: C.ink, rx: 6 }) + rect(x, y, w, h, { fill: C.paper, stroke: C.ink, sw: 2.2, rx: 6 })
    + Array.from({ length: 6 }, (_, i) => circ(x + 14 + i * ((w - 28) / 5), y, 3, { fill: C.paper, stroke: C.ink, sw: 1.6 })).join('') + inner(x + w / 2, y + h / 2 + 4, w, h);
};
const snowman = (cx, cy, s = 1) => g(circ(0, 12, 14, { stroke: C.blue, sw: 2.5 }) + circ(0, -10, 9, { stroke: C.blue, sw: 2.5 }) + circ(-3, -11, 1.4, { fill: C.blue }) + circ(3, -11, 1.4, { fill: C.blue }) + line(-12, 4, -22, -2, { stroke: C.blue, sw: 2.2 }) + line(12, 4, 22, -2, { stroke: C.blue, sw: 2.2 }), { x: cx, y: cy, s });
const alien = (cx, cy, s = 1) => g(ell(0, 0, 14, 17, { stroke: C.blue, sw: 2.5 }) + ell(-5, -2, 3.5, 5, { fill: C.blue }) + ell(5, -2, 3.5, 5, { fill: C.blue }) + path('M-6 -16L-10 -26M6 -16L10 -26', { stroke: C.blue, sw: 2.2 }) + circ(-10, -27, 2.5, { fill: C.blue }) + circ(10, -27, 2.5, { fill: C.blue }) + path('M-11 17L-14 26M11 17L14 26', { stroke: C.blue, sw: 2.2 }), { x: cx, y: cy, s });
const stick = (cx, cy, s = 1) => g(circ(0, -14, 8, { stroke: C.blue, sw: 2.5 }) + path('M0 -6V12M-13 0H13M0 12L-9 26M0 12L9 26', { stroke: C.blue, sw: 2.5, cap: 'round' }), { x: cx, y: cy, s });
const word = (w) => (cx, cy) => T(cx, cy, w, { size: 18, fill: C.blue });
const telestrations = [
  {
    k: '목표', t: '그림과 단어가 꼬여 가는 걸 함께 웃어요',
    d: '단어를 그림으로, 그림을 단어로 번갈아 옮기며 스케치북이 한 바퀴 돌아요. 처음 단어가 마지막에 어떻게 바뀌었는지 보며 함께 웃는 게 목적이에요.',
    art: sketch(14, 40, word('눈사람'), { w: 84, h: 68 }) + sketch(110, 40, (cx, cy) => snowman(cx, cy, 0.85), { w: 84, h: 68 }) + sketch(206, 40, word('사람'), { w: 84, h: 68 }) + sketch(302, 40, (cx, cy) => alien(cx, cy, 0.85), { w: 84, h: 68 }) + sketch(398, 40, word('외계인'), { w: 72, h: 68 })
      + [98, 194, 290, 386].map((x) => arrow(x + 2, 74, x + 12, 74, { w: 2.5, head: 8 })).join('')
      + T(56, 140, '처음', { size: 14, fill: C.muted }) + T(434, 140, '마지막', { size: 14, fill: C.muted })
      + bubble(240, 220, '어쩌다 외계인이 됐지?', { size: 18, tail: 'tl' }),
  },
  {
    k: '준비', t: '주사위로 단어를 골라 첫 장에 써요',
    d: '각자 단어 카드 1장을 가져가요. 주사위를 굴려 나온 번호의 단어를 내 카드에서 골라 스케치북 첫 장에 써요.',
    art: die(70, 80, 3, { s: 52 }) + arrow(104, 80, 140, 80, { w: 3.5 })
      + card(152, 30, { w: 130, h: 160, inner: (cx, cy, w, h, xx, yy) => ['고양이', '비행기', '눈사람', '수박', '선풍기', '로봇'].map((wd, i) => badge(xx + 20, yy + 20 + i * 24, i + 1, { r: 9, bg: i === 2 ? C.pt : C.ink }) + T(xx + 36, yy + 20 + i * 24, wd, { size: 15, anchor: 'start', fill: i === 2 ? C.pt : C.ink })).join('') })
      + arrow(292, 110, 330, 110, { w: 3.5 }) + sketch(340, 70, word('눈사람'), { w: 120, h: 90 }) + T(400, 190, '첫 장에 쓰기', { size: 14 })
      + pill(240, 254, '짝수 인원이면 다음 장에 내가 먼저 그려요', { size: 13 }),
  },
  {
    k: '진행', t: '옆 사람에게 넘기고, 바로 앞 장만 봐요',
    d: '스케치북을 옆 사람에게 넘겨요. 받은 스케치북은 바로 앞 장만 보고 그 내용을 이어서 그리거나 맞혀요. 그 전 장은 넘겨 보면 안 돼요.',
    art: [[240, 46], [410, 150], [240, 252], [70, 150]].map(([x, y]) => person(x, y - 6, { s: 0.75 }) + rect(x - 22, y + 18, 44, 30, { fill: C.paper, stroke: C.ink, sw: 2, rx: 4 })).join('')
      + arrow(282, 66, 384, 118, { bend: -20 }) + arrow(394, 196, 288, 254, { bend: -20 }) + arrow(196, 256, 92, 196, { bend: -20 }) + arrow(86, 118, 196, 64, { bend: -20 })
      + pill(240, 154, '바로 앞 장만 보기', { size: 15, bg: C.pt }),
  },
  {
    k: '진행', t: '그리기와 맞히기를 번갈아 해요',
    d: '그릴 차례에는 글자, 숫자, 기호 없이 그림으로만 그려요. 맞힐 차례에는 앞 장 그림만 보고 단어를 써요. 모래시계가 다 떨어지면 마카를 내려놓아요.',
    art: pill(120, 30, '그리기', { size: 15 }) + sketch(40, 56, (cx, cy) => snowman(cx, cy, 1.1), { w: 160, h: 120 }) + T(120, 214, '글자, 숫자, 기호 금지', { size: 14, fill: C.pt })
      + pill(360, 30, '맞히기', { size: 15 }) + sketch(280, 56, word('사람'), { w: 160, h: 120 }) + T(360, 214, '모르면 아무거나라도 써요', { size: 14, fill: C.muted })
      + timer(240, 254, 1.2),
  },
  {
    k: '끝', t: '돌아오면 처음부터 한 장씩 펼쳐요',
    d: '내 스케치북이 돌아오면 첫 단어부터 차례로 펼쳐 보여 줘요. 어디서 꼬였는지 다 같이 확인하는 시간이 가장 재미있어요. 점수를 세고 싶다면 상자 설명서를 따라요.',
    art: sketch(30, 50, word('눈사람'), { w: 96, h: 76 }) + sketch(138, 50, (cx, cy) => snowman(cx, cy, 0.9), { w: 96, h: 76 }) + sketch(246, 50, word('사람'), { w: 96, h: 76 }) + sketch(354, 50, (cx, cy) => stick(cx, cy, 0.9), { w: 96, h: 76 })
      + [70, 170, 270, 370].map((x, i) => person(x + 10, 226, { s: 0.8 })).join('') + T(240, 286, '하하하', { size: 18, weight: 800, fill: C.pt }),
  },
];

// ---------- 딕싯 ----------
const ART = {
  moon: (cx, cy, w, h) => rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, { fill: '#2E3A5C', rx: 4 }) + circ(cx + w * 0.12, cy - h * 0.18, w * 0.14, { fill: '#F6E7B0' }) + path(`M${cx - w / 2 + 5} ${cy + h * 0.22}Q${cx} ${cy + h * 0.05} ${cx + w / 2 - 5} ${cy + h * 0.22}V${cy + h / 2 - 5}H${cx - w / 2 + 5}Z`, { fill: '#4C6A8A' }) + rect(cx - 2, cy + h * 0.04, 4, 10, { fill: '#1C2230' }),
  door: (cx, cy, w, h) => rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, { fill: '#BFE3C8', rx: 4 }) + rect(cx - w * 0.16, cy - h * 0.14, w * 0.32, h * 0.4, { fill: '#C9733E', stroke: C.ink, sw: 1.4 }) + circ(cx + w * 0.09, cy + h * 0.08, 2, { fill: C.ink }),
  boat: (cx, cy, w, h) => rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, { fill: '#BFD9F2', rx: 4 }) + path(`M${cx - w * 0.28} ${cy + h * 0.1}H${cx + w * 0.28}L${cx + w * 0.18} ${cy + h * 0.22}H${cx - w * 0.18}Z`, { fill: C.brown, stroke: C.ink, sw: 1.4 }) + poly([[cx, cy - h * 0.3], [cx, cy + h * 0.08], [cx + w * 0.22, cy + h * 0.08]], { fill: '#fff', stroke: C.ink, sw: 1.4 }),
  stairs: (cx, cy, w, h) => rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, { fill: '#F6D9C6', rx: 4 }) + path(`M${cx - w * 0.36} ${cy + h * 0.36}h${w * 0.18}v${-h * 0.15}h${w * 0.18}v${-h * 0.15}h${w * 0.18}v${-h * 0.15}h${w * 0.18}`, { stroke: C.ink, sw: 2 }) + circ(cx + w * 0.26, cy - h * 0.3, w * 0.08, { fill: C.pt }),
  tree: (cx, cy, w, h) => rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, { fill: '#E9E0F5', rx: 4 }) + rect(cx - 3, cy, 6, h * 0.3, { fill: C.brown }) + circ(cx, cy - h * 0.06, w * 0.24, { fill: '#7FC08C', stroke: C.ink, sw: 1.4 }) + circ(cx - w * 0.3, cy - h * 0.32, 3, { fill: C.gold }),
  fish: (cx, cy, w, h) => rect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, { fill: '#D4F0EE', rx: 4 }) + path(`M${cx - w * 0.26} ${cy}C${cx - w * 0.1} ${cy - h * 0.16} ${cx + w * 0.12} ${cy - h * 0.16} ${cx + w * 0.2} ${cy}C${cx + w * 0.12} ${cy + h * 0.16} ${cx - w * 0.1} ${cy + h * 0.16} ${cx - w * 0.26} ${cy}Z`, { fill: C.orange, stroke: C.ink, sw: 1.4 }) + circ(cx + w * 0.08, cy - h * 0.25, 4, { stroke: C.blue, sw: 1.4 }),
};
const dxcard = (x, y, kind, o = {}) => card(x, y, { w: o.w || 70, h: o.h || 100, back: o.back, rot: o.rot || 0, inner: o.back ? null : (cx, cy, w, h) => ART[kind](cx, cy, w, h) });
const dixit = [
  {
    k: '목표', t: '이야기꾼의 한마디로 카드를 찾아요',
    d: '이야기꾼이 카드 한 장을 고르고 한마디를 해요. 다른 사람은 그 말에 어울리는 카드를 내고, 이야기꾼의 카드를 찾아 투표해요. 30점에 먼저 닿으면 이겨요.',
    art: person(80, 200, { s: 1.3, fill: C.ptTint }) + bubble(120, 82, '새벽 세 시', { size: 20, tail: 'bl' }) + T(80, 270, '이야기꾼', { size: 14, fill: C.pt })
      + dxcard(220, 70, 'moon') + dxcard(300, 70, 'door') + dxcard(380, 70, 'boat') + T(330, 206, '어느 카드일까요?', { size: 16 }) + ring(255, 120, 58, { c: C.pt }),
  },
  {
    k: '내 차례', t: '이야기꾼은 한마디하고 카드를 엎어 내요',
    d: '이야기꾼은 손에 든 6장 가운데 하나를 골라 한마디를 해요. 단어, 문장, 소리, 노래 한 소절 무엇이든 돼요. 고른 카드는 그림이 안 보이게 내요.',
    art: [0, 1, 2, 3, 4, 5].map((i) => g(dxcard(166, 150, ['moon', 'door', 'boat', 'stairs', 'tree', 'fish'][i], { w: 56, h: 80 }), { rot: -25 + i * 10, cx: 194, cy: 330 })).join('')
      + bubble(110, 50, '새벽 세 시', { size: 18, tail: 'br' }) + arrow(250, 150, 330, 120, { bend: 14 }) + dxcard(344, 70, 'moon', { back: true, w: 70, h: 100 }) + T(380, 196, '엎어서 내요', { size: 15 }),
  },
  {
    k: '진행', t: '다른 사람도 어울리는 카드를 엎어 내요',
    d: '다른 사람들도 그 말에 어울리는 카드를 손에서 1장씩 골라 엎어 내요. 이야기꾼이 모두 섞어 그림이 보이게 펼치고 번호를 붙여요.',
    art: dxcard(30, 40, '', { back: true, w: 54, h: 76 }) + dxcard(90, 40, '', { back: true, w: 54, h: 76 }) + dxcard(150, 40, '', { back: true, w: 54, h: 76 }) + dxcard(210, 40, '', { back: true, w: 54, h: 76 })
      + T(148, 140, '섞어서', { size: 15 }) + arrow(148, 156, 148, 186, { w: 3 })
      + [['stairs', 1], ['moon', 2], ['fish', 3], ['tree', 4]].map(([k, num], i) => dxcard(30 + i * 60, 196, k, { w: 54, h: 76 }) + badge(57 + i * 60, 196, num, { r: 11 })).join('')
      + pill(380, 150, '그림이 보이게 펼쳐요', { size: 14, bg: C.pt }),
  },
  {
    k: '투표', t: '이야기꾼의 카드를 몰래 투표해요',
    d: '이야기꾼 말고 모두 이야기꾼의 카드라고 생각하는 번호에 몰래 투표해요. 내 카드에는 투표할 수 없어요. 모두 동시에 공개해요.',
    art: [['stairs', 1], ['moon', 2], ['fish', 3], ['tree', 4]].map(([k, num], i) => dxcard(46 + i * 100, 40, k, { w: 74, h: 104 }) + badge(83 + i * 100, 40, num, { r: 13 })).join('')
      + [[183, 186, 2], [205, 202, 2], [283, 186, 3]].map(([x, y, v]) => circ(x, y + 3, 15, { fill: C.ink }) + circ(x, y, 15, { fill: C.gold, stroke: C.ink, sw: 2 }) + T(x, y + 1, v, { size: 15, weight: 800 })).join('')
      + T(240, 262, '이야기꾼은 투표하지 않아요', { size: 15, fill: C.muted }),
  },
  {
    k: '점수', t: '너무 쉬워도, 너무 어려워도 안 돼요',
    d: '모두 맞히거나 아무도 못 맞히면 이야기꾼은 0점, 나머지는 2점씩 받아요. 그 밖에는 이야기꾼과 맞힌 사람이 3점씩 받아요. 내 카드에 표를 받으면 1표마다 1점을 더 받아요.',
    art: rect(20, 30, 140, 170, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(90, 58, '모두 맞힘', { size: 15 }) + T(90, 82, '아무도 못 맞힘', { size: 15 }) + T(90, 126, '이야기꾼 0', { size: 17, fill: C.pt }) + T(90, 156, '나머지 2', { size: 17 })
      + rect(170, 30, 140, 170, { fill: C.okTint, stroke: C.ok, sw: 2, rx: 14 }) + T(240, 70, '일부만 맞힘', { size: 15 }) + T(240, 126, '이야기꾼 3', { size: 17, fill: C.ok }) + T(240, 156, '맞힌 사람 3', { size: 17, fill: C.ok })
      + rect(320, 30, 140, 170, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(390, 70, '내 카드에 표', { size: 15 }) + T(390, 126, '1표마다', { size: 17 }) + T(390, 156, '+1', { size: 22, weight: 800 })
      + T(240, 250, '좋은 한마디는 몇 명만 맞히는 말이에요', { size: 15 }),
  },
  {
    k: '예시', t: '한마디는 느낌을 담아요',
    d: '달 아래 혼자 서 있는 그림이라면 ‘보고 싶다’, ‘새벽 세 시’처럼 말해요. ‘달’은 너무 쉽고, 그림과 상관없는 말은 너무 어려워요.',
    art: dxcard(40, 60, 'moon', { w: 120, h: 170 })
      + chip(300, 70, '달') + no(350, 70, 12) + T(410, 70, '너무 쉬워요', { size: 13, fill: C.muted })
      + chip(300, 130, '보고 싶다') + ok(368, 130, 12) + chip(300, 190, '새벽 세 시') + ok(372, 190, 12)
      + chip(300, 250, '김치찌개') + no(366, 250, 12) + T(426, 250, '너무 어려워요', { size: 13, fill: C.muted }),
  },
];

// ---------- 코드네임 ----------
const CW = ['고래', '기차', '사과', '섬', '의자', '학교', '달', '소금', '우산', '별', '시계', '바람', '거울', '사자', '가방', '다리', '열쇠', '모자', '편지', '나무', '병원', '커피', '공', '파도', '피아노'];
const wcell = (x, y, w, h, wd, o = {}) => rect(x, y + 2.5, w, h, { fill: C.ink, rx: 6 }) + rect(x, y, w, h, { fill: o.cover || C.cream, stroke: C.ink, sw: 1.8, rx: 6 }) + (o.cover ? '' : T(x + w / 2, y + h / 2, wd, { size: o.size || 14, fill: o.fg || C.ink }));
const cgrid = (x, y, w, h, gap, covers = {}, hots = []) => CW.map((wd, i) => {
  const c = i % 5, r = Math.floor(i / 5);
  return wcell(x + c * (w + gap), y + r * (h + gap), w, h, wd, { cover: covers[i], fg: hots.includes(i) ? C.red : undefined });
}).join('');
const keycard = (x, y, s) => {
  const map = 'rbrnbnrrbnbrnaebbrnnrbnrb';
  return rect(x - 4, y - 4, s * 5 + 8, s * 5 + 8, { fill: C.ink, rx: 6 }) + map.split('').map((m, i) => rect(x + (i % 5) * s, y + Math.floor(i / 5) * s, s - 2, s - 2, { fill: m === 'r' ? C.red : m === 'b' ? C.blue : m === 'a' ? '#111' : '#E7DCC4', rx: 2 })).join('');
};
const codenames = [
  {
    k: '목표', t: '우리 팀 요원 단어를 먼저 모두 찾아요',
    d: '빨강 팀과 파랑 팀으로 나눠요. 팀장만 어느 단어가 우리 팀 요원인지 알아요. 팀장의 힌트로 우리 팀 단어를 상대보다 먼저 모두 찾으면 이겨요.',
    art: cgrid(60, 34, 64, 34, 8, { 0: C.red, 3: C.red, 9: C.blue, 14: C.blue, 17: '#E7DCC4', 21: C.red })
      + pill(130, 270, '빨강 팀', { size: 15, bg: C.red }) + pill(350, 270, '파랑 팀', { size: 15, bg: C.blue }) + T(240, 270, 'vs', { size: 16, fill: C.muted }),
  },
  {
    k: '준비', t: '25장을 깔고, 정답 카드는 팀장만 봐요',
    d: '단어 카드 25장을 5×5로 깔아요. 정답 카드 한 장을 두 팀장만 보이게 세워 둬요. 테두리 색 팀이 먼저 하고, 먼저 하는 팀은 요원이 9명, 다른 팀은 8명이에요.',
    art: cgrid(20, 40, 50, 30, 6) + keycard(340, 60, 22) + T(397, 30, '정답 카드', { size: 14 }) + eye(397, 200, 1.1) + T(397, 230, '팀장만 봐요', { size: 14, fill: C.pt })
      + [[C.red, '빨강'], [C.blue, '파랑'], ['#111', '암살자']].map(([c, t], i) => rect(330 + i * 46, 256, 10, 10, { fill: c, rx: 2 }) + T(344 + i * 46, 261, t, { size: 11, anchor: 'start', fill: C.muted })).join(''),
  },
  {
    k: '힌트', t: '팀장은 단어 하나와 숫자 하나만',
    d: '팀장이 “바다, 3”처럼 한 단어와 숫자 하나를 말해요. 숫자는 이 힌트와 이어지는 우리 팀 단어 수예요. 몸짓이나 말투로 더 알려 주면 안 돼요.',
    art: person(70, 206, { s: 1.3, fill: '#F4C9BF' }) + T(70, 272, '빨강 팀장', { size: 14, fill: C.red }) + bubble(110, 90, '바다, 3', { size: 24, tail: 'bl' })
      + cgrid(190, 50, 50, 30, 6, {}, [0, 3, 7])
      + ring(190 + 25, 65, 28) + ring(190 + 3 * 56 + 25, 65, 28) + ring(190 + 2 * 56 + 25, 50 + 36 + 15, 28),
  },
  {
    k: '진행', t: '팀원은 하나씩 짚고, 결과를 확인해요',
    d: '팀원들이 의논해 단어를 하나씩 짚어요. 우리 팀 요원이면 계속 짚고, 민간인이나 상대 팀이면 차례가 끝나요. 암살자를 짚으면 바로 져요. 숫자보다 하나 더 짚을 수 있어요.',
    art: [[C.red, '우리 팀 요원', '덮고 계속 짚어요', 'ok'], ['#E7DCC4', '민간인', '차례가 끝나요', 'stop'], [C.blue, '상대 팀 요원', '상대 카드 덮고 끝', 'stop'], ['#111', '암살자', '바로 져요', 'no']].map(([c, a, b, m], i) => {
      const y = 44 + i * 62;
      return rect(40, y - 20, 70, 40, { fill: c, stroke: C.ink, sw: 2, rx: 6 }) + T(130, y, a, { size: 16, anchor: 'start' }) + T(290, y, b, { size: 15, anchor: 'start', fill: C.muted })
        + (m === 'ok' ? ok(448, y, 13) : m === 'no' ? no(448, y, 13) : circ(448, y, 13, { fill: C.muted }) + rect(442, y - 5, 12, 10, { fill: '#fff', rx: 2 }));
    }).join(''),
  },
  {
    k: '이럴 땐', t: '이런 힌트는 안 돼요',
    d: '힌트는 한 단어여야 하고, 책상 위에 보이는 단어나 그 일부를 쓰면 안 돼요. 상대 팀 단어와 헷갈릴 만한 힌트도 조심해요.',
    art: bubble(130, 60, '고래 소금, 2', { size: 18, tail: 'bl' }) + no(230, 60, 14) + T(330, 60, '두 단어', { size: 15, anchor: 'start' })
      + bubble(130, 140, '섬나라, 2', { size: 18, tail: 'bl' }) + no(230, 140, 14) + T(330, 140, '보이는 단어 ‘섬’', { size: 15, anchor: 'start' })
      + bubble(130, 220, '바다, 3', { size: 18, tail: 'bl' }) + ok(230, 220, 14) + T(330, 220, '좋아요', { size: 15, anchor: 'start' }),
  },
  {
    k: '끝', t: '요원을 모두 찾거나, 암살자를 짚으면 끝',
    d: '한 팀이 우리 요원을 모두 찾으면 그 팀이 이겨요. 누군가 암살자를 짚으면 그 팀이 바로 져요.',
    art: cgrid(30, 50, 40, 26, 5, Object.fromEntries([0, 3, 6, 7, 11, 16, 20, 21, 24].map((i) => [i, C.red]))) + crown(132, 30, 0.9) + T(132, 230, '빨강 9명 모두 찾음', { size: 15, fill: C.red })
      + rect(300, 80, 120, 80, { fill: '#111', stroke: C.ink, sw: 2, rx: 10 }) + T(360, 120, '암살자', { size: 18, fill: '#fff' }) + no(420, 80, 16) + T(360, 200, '짚은 팀이 바로 져요', { size: 15 }),
  },
];

// ---------- 젝스님트 ----------
const cow = (cx, cy, s = 1, fill = '#B57BD6') => g(path('M-7 -3L-12 -8M7 -3L12 -8', { stroke: C.ink, sw: 2, cap: 'round' }) + ell(0, 1, 7, 6, { fill, stroke: C.ink, sw: 1.4 }), { x: cx, y: cy, s });
const ncard = (x, y, v, heads, o = {}) => card(x, y, {
  w: o.w || 44, h: o.h || 62, fill: o.fill,
  inner: (cx, cy, w, h) => { const sp = Math.min(w * 0.2, (w * 0.86) / heads); return T(cx, cy - h * 0.06, v, { size: h * 0.34, weight: 800, fill: o.hot ? C.pt : C.ink }) + Array.from({ length: heads }, (_, i) => cow(cx + (i - (heads - 1) / 2) * sp, cy + h * 0.3, Math.min(w / 64, sp / 20))).join(''); },
});
const HEADS = (v) => (v === 55 ? 7 : v % 11 === 0 ? 5 : v % 10 === 0 ? 3 : v % 5 === 0 ? 2 : 1);
const nrow = (x, y, list, o = {}) => list.map((v, i) => ncard(x + i * ((o.w || 44) + 6), y, v, HEADS(v), o)).join('');
const nimmt = [
  {
    k: '목표', t: '소머리를 가장 적게 모아요',
    d: '카드마다 소머리가 그려져 있어요. 줄을 가져가면 그 카드의 소머리가 벌점이 돼요. 누군가 66점을 넘기면 끝나고, 벌점이 가장 적은 사람이 이겨요.',
    art: ncard(40, 50, 55, 7, { w: 100, h: 140 }) + T(90, 222, '55는 소머리 7개', { size: 14 })
      + ncard(190, 70, 10, 3, { w: 64, h: 90 }) + ncard(270, 70, 11, 5, { w: 64, h: 90 }) + ncard(350, 70, 7, 1, { w: 64, h: 90 })
      + T(320, 196, '소머리 = 벌점', { size: 17, fill: C.pt }) + pill(320, 250, '적게 모을수록 좋아요', { size: 14 }),
  },
  {
    k: '준비', t: '10장씩 나누고, 4장으로 줄을 시작해요',
    d: '카드를 섞어 한 사람에게 10장씩 나눠요. 4장을 펼쳐 세로로 한 장씩 놓으면 네 줄의 첫 장이 돼요.',
    art: [12, 33, 57, 81].map((v, i) => T(40, 46 + i * 66, `${i + 1}줄`, { size: 14, fill: C.muted }) + ncard(70, 16 + i * 66, v, HEADS(v)) + rect(126, 16 + i * 66, 250, 62, { stroke: C.line, sw: 2, dash: '5 6', rx: 8 })).join('')
      + T(250, 47, '여기에 이어 붙여요', { size: 14, fill: C.muted }) + pill(430, 150, '손패 10장', { size: 13 }),
  },
  {
    k: '내 차례', t: '모두 동시에 1장, 작은 수부터 붙여요',
    d: '모두 손에서 카드 1장을 골라 동시에 뒤집어요. 숫자가 작은 카드부터 한 장씩 줄에 붙여요. 붙이는 자리는 정해져 있어 고를 수 없어요.',
    art: [[90, 40], [240, 40], [390, 40]].map(([x, v], i) => person(x, 70, { s: 0.9 }) + ncard(x - 22, 112, [59, 40, 18][i], HEADS([59, 40, 18][i]))).join('')
      + T(240, 26, '하나, 둘, 셋에 동시에', { size: 15 })
      + badge(68, 112, 3) + badge(218, 112, 2) + badge(368, 112, 1) + pill(240, 228, '18 → 40 → 59 순서로 붙여요', { size: 16, bg: C.pt }),
  },
  {
    k: '예시', t: '끝 숫자가 작으면서 가장 가까운 줄',
    d: '줄 끝이 12, 33, 57, 81이고 내 카드가 40이면 33 뒤에 붙어요. 40보다 작은 끝 숫자 중에 33이 가장 가까워요.',
    art: [[12], [33], [57], [81]].map((r, i) => nrow(40, 16 + i * 68, r)).join('') + ncard(300, 110, 40, 3, { w: 56, h: 78, hot: true })
      + arrow(294, 136, 98, 104, { bend: 12, w: 3.5 }) + ok(240, 92, 13) + T(380, 70, '40 − 33 = 7', { size: 18 }) + T(380, 232, '57, 81은 40보다 커서', { size: 13, fill: C.muted }) + T(380, 252, '붙일 수 없어요', { size: 13, fill: C.muted }),
  },
  {
    k: '이럴 땐', t: '여섯 번째가 되면 다섯 장을 가져가요',
    d: '내 카드가 어느 줄의 여섯 번째가 되면 앞의 다섯 장을 가져가요. 가져온 카드는 내 앞에 따로 쌓고, 내 카드가 그 줄의 새 첫 장이 돼요.',
    art: nrow(20, 40, [33, 36, 41, 45, 50], { w: 52, h: 72 }) + ncard(310, 40, 52, 1, { w: 52, h: 72, hot: true }) + badge(336, 36, 6)
      + arrow(150, 132, 150, 186, { w: 3.5 }) + pile(110, 200, { w: 52, h: 72, count: 4 }) + T(218, 236, '벌점으로 가져가요', { size: 15, anchor: 'start' })
      + arrow(336, 132, 360, 196, { w: 3, dash: '5 5' }) + T(410, 222, '새 첫 장', { size: 14, fill: C.pt }),
  },
  {
    k: '이럴 땐', t: '붙일 줄이 없으면 한 줄을 골라 가져가요',
    d: '내 카드가 모든 줄 끝보다 작으면 붙일 곳이 없어요. 네 줄 가운데 하나를 골라 가져가고, 내 카드가 그 자리의 새 첫 장이 돼요. 보통 소머리가 가장 적은 줄을 골라요.',
    art: [[12, 20], [33, 38, 41], [57], [81, 90]].map((r, i) => nrow(40, 16 + i * 68, r)).join('') + ncard(330, 110, 5, HEADS(5), { w: 56, h: 78, hot: true })
      + box(32, 150, 62, 72) + arrow(322, 150, 104, 184, { w: 3 }) + T(380, 230, '소머리가 적은 줄', { size: 14 }) + T(380, 252, '골라 가져가요', { size: 14 }),
  },
];

// ---------- 쿠 ----------
const ROLE = {
  공작: [C.purple, (cx, cy) => crown(cx, cy, 0.9, '#fff')],
  암살자: ['#2A2F3A', (cx, cy) => path(`M${cx} ${cy - 16}L${cx + 5} ${cy + 4}H${cx - 5}Z`, { fill: '#fff' }) + rect(cx - 9, cy + 4, 18, 4, { fill: '#fff' }) + rect(cx - 2.5, cy + 8, 5, 9, { fill: '#fff' })],
  사령관: [C.blue, (cx, cy) => path(`M${cx} ${cy - 14}V${cy + 12}M${cx - 12} ${cy + 2}Q${cx - 10} ${cy + 14} ${cx} ${cy + 14}Q${cx + 10} ${cy + 14} ${cx + 12} ${cy + 2}M${cx - 7} ${cy - 6}H${cx + 7}`, { stroke: '#fff', sw: 3, cap: 'round' }) + circ(cx, cy - 16, 3.5, { stroke: '#fff', sw: 2.5 })],
  대사: [C.green, (cx, cy) => rect(cx - 12, cy - 13, 24, 26, { fill: '#fff', rx: 3 }) + path(`M${cx - 7} ${cy - 5}H${cx + 7}M${cx - 7} ${cy + 1}H${cx + 7}M${cx - 7} ${cy + 7}H${cx + 3}`, { stroke: C.green, sw: 2 })],
  백작부인: [C.red, (cx, cy) => path(`M${cx} ${cy + 14}L${cx - 14} ${cy - 6}Q${cx} ${cy - 18} ${cx + 14} ${cy - 6}Z`, { fill: '#fff' }) + path(`M${cx} ${cy + 14}L${cx - 6} ${cy - 10}M${cx} ${cy + 14}L${cx} ${cy - 12}M${cx} ${cy + 14}L${cx + 6} ${cy - 10}`, { stroke: C.red, sw: 1.4 })],
};
const rcard = (x, y, name, o = {}) => card(x, y, { w: o.w || 60, h: o.h || 84, back: o.back, fill: ROLE[name] ? ROLE[name][0] : C.paper, rot: o.rot || 0, op: o.op,
  inner: o.back ? null : (cx, cy, w, h) => ROLE[name][1](cx, cy - h * 0.1) + T(cx, cy + h * 0.3, name, { size: Math.min(13, w * 0.22), fill: '#fff' }) });
const coup = [
  {
    k: '목표', t: '마지막까지 인물 카드를 지켜요',
    d: '모두 인물 카드 2장을 숨겨 들고 시작해요. 카드를 잃을 때마다 앞면을 공개해요. 다른 사람의 카드를 모두 잃게 만들고 혼자 살아남으면 이겨요.',
    art: person(90, 120, { s: 1, fill: C.ptTint }) + rcard(60, 170, '', { back: true, w: 44, h: 62 }) + rcard(108, 170, '', { back: true, w: 44, h: 62 }) + crown(90, 60, 1)
      + person(240, 120, { s: 1 }) + rcard(212, 170, '공작', { w: 44, h: 62, op: 0.45 }) + rcard(260, 170, '', { back: true, w: 44, h: 62 })
      + person(390, 120, { s: 1 }) + rcard(362, 170, '대사', { w: 44, h: 62, op: 0.45 }) + rcard(410, 170, '사령관', { w: 44, h: 62, op: 0.45 }) + no(410, 100, 14)
      + T(240, 268, '공개된 카드는 잃은 카드예요', { size: 14, fill: C.muted }),
  },
  {
    k: '준비', t: '카드 2장과 동전 2개로 시작해요',
    d: '인물 카드를 섞어 한 사람에게 2장씩 남이 못 보게 나눠요. 각자 동전 2개를 받아요. 남은 카드는 가운데에 뒤집어 두고, 이 더미를 궁정이라고 불러요.',
    art: pile(60, 70, { w: 60, h: 84, back: true, count: 4 }) + T(92, 190, '궁정', { size: 16 })
      + rcard(210, 70, '', { back: true }) + rcard(278, 70, '', { back: true }) + coin(364, 98, 18) + coin(404, 112, 18)
      + T(276, 190, '내 카드 2장 (나만 봐요)', { size: 14 }) + T(384, 190, '동전 2개', { size: 14 }),
  },
  {
    k: '내 차례', t: '행동은 하나만 해요',
    d: '돈 1개 받기, 돈 2개 받기, 돈 7개로 쿠데타, 인물 능력 쓰기 가운데 하나만 해요. 쿠데타는 한 사람의 카드 하나를 잃게 하고, 막을 수 없어요.',
    art: [['소득', '+1', '막을 수 없어요'], ['해외 원조', '+2', '공작이 막아요'], ['쿠데타', '−7', '카드 1장 잃게'], ['인물 능력', '?', '다음 그림에서']].map(([a, b, c], i) => {
      const x = 62 + i * 118;
      return rect(x - 52, 40, 104, 190, { fill: C.paper, stroke: C.ink, sw: 2, rx: 14 }) + T(x, 70, a, { size: 15 }) + coin(x, 128, 24, { label: b }) + T(x, 196, c, { size: 12, fill: C.muted });
    }).join('') + pill(240, 266, '동전 10개 이상이면 반드시 쿠데타', { size: 14, bg: C.pt }),
  },
  {
    k: '알기', t: '인물 다섯 명의 능력',
    d: '공작은 돈 3개를 받고 해외 원조를 막아요. 암살자는 돈 3개를 내고 한 사람의 카드를 잃게 해요. 사령관은 돈 2개를 빼앗고, 대사는 카드를 바꿔요. 백작부인은 암살을 막아요.',
    art: [['공작', '세금 +3', '원조 막기'], ['암살자', '3개 내고 암살', ''], ['사령관', '2개 빼앗기', '빼앗기 막기'], ['대사', '카드 2장 바꾸기', '빼앗기 막기'], ['백작부인', '', '암살 막기']].map(([nm, a, b], i) => {
      const y = 30 + i * 52;
      return rcard(34, y + 2, nm, { w: 34, h: 44 }) + T(90, y + 22, nm, { size: 15, anchor: 'start' }) + T(196, y + 22, a, { size: 14, anchor: 'start' }) + T(350, y + 22, b, { size: 14, anchor: 'start', fill: C.pt });
    }).join(''),
  },
  {
    k: '이럴 땐', t: '없어도 있는 척, 그리고 “의심!”',
    d: '인물 능력은 그 카드가 없어도 있는 척 쓸 수 있어요. 누구든 “의심!”을 외칠 수 있어요. 정말 있으면 의심한 사람이, 없으면 거짓말한 사람이 카드 하나를 잃어요.',
    art: person(90, 110, { s: 1 }) + bubble(110, 30, '공작이에요, 세금!', { size: 15, tail: 'bl' }) + person(390, 110, { s: 1, fill: C.ptTint }) + bubble(386, 30, '의심!', { size: 18, tail: 'br' })
      + rect(20, 170, 210, 110, { fill: C.okTint, rx: 14 }) + T(125, 196, '정말 공작이 있으면', { size: 14 }) + rcard(42, 214, '공작', { w: 36, h: 50 }) + T(150, 240, '의심한 사람이', { size: 14 }) + T(150, 262, '카드 1장 잃어요', { size: 14, fill: C.pt })
      + rect(250, 170, 210, 110, { fill: C.ptTint, rx: 14 }) + T(355, 196, '공작이 없으면', { size: 14 }) + no(290, 240, 16) + T(380, 240, '거짓말한 사람이', { size: 14 }) + T(380, 262, '카드 1장 잃어요', { size: 14, fill: C.pt }),
  },
  {
    k: '끝', t: '카드가 남은 사람이 한 명이면 끝',
    d: '카드를 모두 잃은 사람은 빠져요. 인물 카드가 남은 사람이 한 명뿐이면 그 사람이 이겨요.',
    art: person(240, 140, { s: 1.6, fill: C.ptTint }) + crown(240, 62, 1.4) + rcard(196, 200, '', { back: true, w: 40, h: 56 }) + rcard(244, 200, '백작부인', { w: 40, h: 56, op: 0.45 })
      + person(80, 210, { s: 0.8, fill: C.line }) + person(400, 210, { s: 0.8, fill: C.line }) + T(80, 266, '탈락', { size: 13, fill: C.muted }) + T(400, 266, '탈락', { size: 13, fill: C.muted }),
  },
];

// ---------- 라이어 게임 ----------
const phone = (cx, cy, top, main, o = {}) => rect(cx - 40, cy - 66, 80, 132, { fill: C.ink, rx: 14 }) + rect(cx - 34, cy - 56, 68, 110, { fill: o.fill || C.paper, rx: 6 })
  + T(cx, cy - 34, top, { size: 12, fill: C.muted }) + T(cx, cy + 2, main, { size: o.size || 18, fill: o.fg || C.ink });
const liar = [
  {
    k: '목표', t: '제시어를 모르는 한 사람을 찾아요',
    d: '모두 같은 제시어를 받지만 라이어 한 명만 주제만 받아요. 라이어를 찾아내면 나머지가 이기고, 들키지 않거나 제시어를 맞히면 라이어가 이겨요.',
    art: [60, 150, 240, 330, 420].map((x, i) => person(x, 170, { s: 1, fill: i === 3 ? C.ptTint : C.paper }) + bubble(x, 104, i === 3 ? '?' : '떡볶이', { size: 14, tail: 'bl', bg: i === 3 ? C.ptTint : C.paper })).join('')
      + T(330, 238, '라이어', { size: 15, fill: C.pt }),
  },
  {
    k: '준비', t: '휴대폰을 돌려 각자 제시어를 봐요',
    d: '주제를 고르고 테이블 모드의 ‘제시어 나누기’를 써요. 휴대폰을 돌려 가며 자기 화면만 봐요. 라이어 화면에는 주제만 나와요.',
    art: phone(120, 140, '주제: 음식', '떡볶이') + T(120, 236, '대부분의 화면', { size: 14 })
      + phone(330, 140, '주제: 음식', '라이어', { fill: C.ptTint, fg: C.pt }) + T(330, 236, '라이어 화면', { size: 14, fill: C.pt })
      + arrow(178, 120, 270, 120, { bend: 14, w: 3, c: C.muted }) + T(224, 92, '돌려 가며', { size: 13, fill: C.muted }),
  },
  {
    k: '진행', t: '한 문장씩 설명해요',
    d: '돌아가며 제시어를 한 문장으로 설명해요. 너무 자세하면 라이어에게 정답을 알려 주는 셈이에요. 라이어도 들키지 않게 아는 척 설명해요.',
    art: pill(240, 30, '제시어: 떡볶이', { size: 15 })
      + bubble(170, 96, '학교 끝나고 자주 먹었어요', { size: 16, tail: 'bl' }) + ok(330, 96, 14)
      + bubble(170, 170, '빨갛고 떡이 들어가요', { size: 16, tail: 'bl' }) + no(296, 170, 14) + T(380, 170, '너무 쉬워요', { size: 13, fill: C.muted })
      + bubble(170, 244, '매운 걸 좋아하면 좋아해요', { size: 16, tail: 'bl' }) + T(380, 244, '라이어일 수도?', { size: 13, fill: C.pt }),
  },
  {
    k: '지목', t: '하나, 둘, 셋에 동시에 가리켜요',
    d: '설명이 끝나면 하나, 둘, 셋에 모두 라이어라고 생각하는 사람을 동시에 가리켜요. 동점이면 동점인 사람끼리 한 번 더 설명하고 다시 지목해요.',
    art: [[60, 220], [150, 236], [330, 236], [420, 220]].map(([x, y]) => person(x, y, { s: 0.85 })).join('') + person(240, 104, { s: 1.1, fill: C.ptTint })
      + arrow(76, 186, 212, 126, { w: 3 }) + arrow(156, 204, 226, 146, { w: 3 }) + arrow(324, 204, 254, 146, { w: 3 }) + arrow(404, 186, 268, 126, { w: 3 })
      + bubble(410, 66, '하나, 둘, 셋!', { size: 15, tail: 'bl' }),
  },
  {
    k: '끝', t: '라이어가 지목되면 마지막 기회',
    d: '가장 많이 지목된 사람이 라이어가 아니면 라이어가 이겨요. 라이어가 지목되면 제시어를 한 번 맞혀 볼 수 있어요. 맞히면 라이어가, 틀리면 나머지가 이겨요.',
    art: rect(20, 30, 200, 240, { fill: C.ptTint, rx: 16 }) + T(120, 60, '라이어가 아닌 사람', { size: 15 }) + T(120, 84, '지목', { size: 15 }) + person(120, 150, { s: 1 }) + pill(120, 228, '라이어 승리', { size: 15, bg: C.pt })
      + rect(240, 30, 220, 240, { fill: C.paper, stroke: C.ink, sw: 2, rx: 16 }) + T(350, 60, '라이어 지목', { size: 15 }) + bubble(350, 112, '혹시 떡볶이?', { size: 16, tail: 'bl' })
      + T(350, 176, '맞히면 라이어 승리', { size: 14, fill: C.pt }) + T(350, 206, '틀리면 나머지 승리', { size: 14, fill: C.ok }),
  },
];

// ---------- 달무티 ----------
const dmcard = (x, y, v, o = {}) => card(x, y, { w: o.w || 44, h: o.h || 62, fill: v === '광대' ? '#FFF1C9' : C.paper, rot: o.rot || 0, op: o.op,
  inner: (cx, cy, w, h) => (v === '광대' ? T(cx, cy, '광대', { size: w * 0.3, fill: C.purple }) : T(cx, cy, v, { size: h * 0.42, weight: 800, fill: v <= 3 ? C.pt : C.ink })) });
const set = (x, y, v, k, o = {}) => Array.from({ length: k }, (_, i) => dmcard(x + i * (o.dx || 14), y + i * (o.dy || 0), v, o)).join('');
const dalmuti = [
  {
    k: '목표', t: '손패를 가장 먼저 다 내요',
    d: '같은 숫자 묶음을 내며 손패를 털어요. 먼저 다 낸 순서가 다음 판의 신분이 돼요. 1등은 위대한 달무티, 꼴찌는 위대한 농노예요.',
    art: [['위대한 달무티', 1], ['작은 달무티', 2], ['평민', 3], ['작은 농노', 4], ['위대한 농노', 5]].map(([nm, r], i) => {
      const x = 56 + i * 92, y = 80 + i * 22;
      return person(x, y, { s: 0.9, fill: i === 0 ? '#FFF1C9' : i === 4 ? C.line : C.paper }) + badge(x + 22, y - 26, r, { r: 11, bg: i === 0 ? C.gold : C.ink, fg: i === 0 ? C.ink : '#fff' }) + T(x, y + 46, nm, { size: 12 });
    }).join('') + crown(56, 32, 0.9) + T(240, 274, '먼저 다 낸 순서 = 다음 판 자리', { size: 15, fill: C.pt }),
  },
  {
    k: '알기', t: '숫자가 작을수록 강하고, 장수는 적어요',
    d: '카드는 1부터 12까지 있고, 숫자만큼 장수가 있어요. 1은 1장뿐인 가장 강한 카드, 12는 12장이나 되는 가장 약한 카드예요. 광대 2장도 있어요.',
    art: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((v, i) => {
      const x = 26 + i * 37;
      return dmcard(x, 62, v, { w: 30, h: 40 }) + Array.from({ length: v }, (_, j) => rect(x + 2, 112 + j * 9, 26, 7, { fill: v <= 3 ? C.pt : C.line, rx: 2 })).join('') + T(x + 15, 112 + v * 9 + 10, `${v}`, { size: 11, fill: C.muted });
    }).join('') + T(56, 236, '숫자만큼 장수가 있어요', { size: 13, anchor: 'start', fill: C.muted }) + T(60, 40, '강해요', { size: 16, fill: C.pt }) + T(420, 40, '약해요', { size: 16, fill: C.muted }) + arrow(110, 40, 370, 40, { w: 3, c: C.muted }) + T(240, 272, '광대 2장은 함께 낸 숫자가 돼요', { size: 14 }),
  },
  {
    k: '내 차례', t: '같은 장수로, 더 작은 숫자를 내요',
    d: '앞사람이 낸 것과 같은 장수로, 더 작은 숫자를 내요. 앞사람이 8을 3장 냈다면 7 이하 숫자를 3장 내야 해요. 낼 수 없거나 내기 싫으면 넘겨요.',
    art: pill(76, 34, '앞사람', { size: 14 }) + set(30, 56, 8, 3, { dx: 20 })
      + set(190, 56, 5, 3, { dx: 20 }) + ok(300, 86, 15) + T(240, 150, '5를 3장', { size: 15 })
      + set(340, 56, 4, 2, { dx: 20 }) + no(428, 86, 15) + T(380, 150, '2장뿐', { size: 15 })
      + bubble(380, 230, '넘길게요', { size: 16, tail: 'bl' }) + T(160, 230, '같은 장수, 더 작은 숫자', { size: 16, fill: C.pt }),
  },
  {
    k: '진행', t: '모두 넘기면 마지막에 낸 사람이 새로 시작',
    d: '모두 넘기면 낸 카드를 치우고, 마지막에 낸 사람이 원하는 숫자를 원하는 장수만큼 새로 내요. 한 번 넘긴 사람도 다시 차례가 오면 낼 수 있어요.',
    art: person(80, 120, { s: 0.9 }) + bubble(80, 50, '패스', { size: 14, tail: 'bl' }) + person(200, 120, { s: 0.9 }) + bubble(200, 50, '패스', { size: 14, tail: 'bl' }) + person(320, 120, { s: 0.9 }) + bubble(320, 50, '패스', { size: 14, tail: 'bl' })
      + person(420, 200, { s: 1.1, fill: C.ptTint }) + T(420, 262, '마지막에 낸 사람', { size: 13, fill: C.pt })
      + set(140, 196, 5, 3, { dx: 30, op: 0.45 }) + arrow(250, 226, 360, 226, { w: 3 }) + T(200, 284, '치우고 새로 시작', { size: 14 }),
  },
  {
    k: '알기', t: '광대는 함께 낸 숫자가 돼요',
    d: '광대는 다른 숫자와 함께 내면 그 숫자가 돼요. 5 두 장과 광대 한 장은 5 세 장이에요. 광대만 한 장 내면 13으로, 가장 약한 카드예요.',
    art: set(20, 60, 5, 2, { dx: 40, w: 50, h: 70 }) + dmcard(100, 60, '광대', { w: 50, h: 70 }) + T(184, 96, '=', { size: 30, weight: 800 }) + set(214, 60, 5, 3, { dx: 40, w: 50, h: 70 }) + ok(420, 96, 15)
      + dmcard(60, 180, '광대', { w: 52, h: 72 }) + T(200, 216, '=', { size: 30, weight: 800 }) + T(270, 216, '13', { size: 34, weight: 800, fill: C.muted }) + T(380, 216, '가장 약해요', { size: 15 }),
  },
  {
    k: '준비', t: '판이 바뀌면 세금을 주고받아요',
    d: '위대한 농노는 가장 좋은 카드 2장을 위대한 달무티에게 주고, 위대한 달무티는 아무 카드 2장을 돌려줘요. 작은 농노와 작은 달무티는 1장씩 주고받아요.',
    art: person(90, 150, { s: 1.2, fill: '#FFF1C9' }) + crown(90, 82, 1) + T(90, 220, '위대한 달무티', { size: 14 })
      + person(390, 150, { s: 1.2, fill: C.line }) + T(390, 220, '위대한 농노', { size: 14 })
      + arrow(350, 120, 140, 120, { bend: 24, w: 4, c: C.pt }) + T(245, 70, '가장 좋은 카드 2장', { size: 14, fill: C.pt })
      + arrow(140, 180, 350, 180, { bend: 24, w: 4, c: C.muted }) + T(245, 248, '아무 카드 2장', { size: 14, fill: C.muted }),
  },
];

export default {
  'just-one': justone,
  'the-mind': mind,
  mafia,
  avalon,
  telestrations,
  dixit,
  codenames,
  '6-nimmt': nimmt,
  coup,
  'liar-game': liar,
  dalmuti,
};
