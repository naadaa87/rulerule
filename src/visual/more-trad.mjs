// 전통놀이 그림 설명 (추가)
import { C, rect, circ, ell, line, path, poly, g, blob, T, pill, bubble, badge, ok, no, ring, box, arrow, motion, person, hand, point, crown, big } from './kit.mjs';
import { kid, flat } from './parts.mjs';

const dash = (x, y1 = 24, y2 = 276) => line(x, y1, x, y2, { stroke: C.line, sw: 2, dash: '5 6' });
const ground = (y, x1 = 20, x2 = 460) => line(x1, y, x2, y, { stroke: C.line, sw: 3 });
const CH = '#8B95A5'; // 땅에 그은 금

// ---------- 사방치기 ----------
// 집 + 칸 n개 + 하늘 (옆으로 긴 판)
const sboard = (x, y, cw, ch, n, o = {}) => {
  let s = rect(x, y, cw * n, ch, { fill: '#F5EFE2', stroke: CH, sw: 3 });
  for (let i = 1; i < n; i++) s += line(x + i * cw, y, x + i * cw, y + ch, { stroke: CH, sw: 3 });
  for (let i = 0; i < n; i++) s += T(x + i * cw + cw / 2, y + (o.ny ?? ch - 14), i + 1, { size: o.ns || 16, fill: CH, weight: 800 });
  s += path(`M${x + cw * n} ${y}A${ch / 2} ${ch / 2} 0 0 1 ${x + cw * n} ${y + ch}`, { fill: '#E3EEF9', stroke: CH, sw: 3 });
  s += rect(x - (o.hw || 44), y, o.hw || 44, ch, { stroke: CH, sw: 3, dash: '6 5' });
  if (o.labels !== false) s += T(x - (o.hw || 44) / 2, y + ch + 18, '집', { size: 16 }) + T(x + cw * n + ch / 4 + 4, y + ch + 18, '하늘', { size: 16 });
  return s;
};
const sabang = [
  {
    k: '목표', t: '한 발로 돌을 차며 하늘까지 다녀와요',
    d: '땅에 그린 칸을 따라 한 발로 뛰면서 돌을 차 보내요. 끝 칸인 하늘까지 갔다가 돌아오면 한 단계를 마쳐요. 모든 단계를 먼저 마치면 이겨요.',
    art: sboard(70, 176, 54, 64, 6) + kid(150, 122, { s: 0.9, pose: 'hop' }) + flat(216, 196) + arrow(236, 196, 404, 196, { dash: '7 6', w: 3.5 })
      + pill(240, 40, '한 발로만 뛰어요', { size: 16, bg: C.pt }) + motion(150, 100, 30, 200, 250, { count: 3 }),
  },
  {
    k: '준비', t: '땅에 놀이판을 그리고 돌을 하나씩 가져요',
    d: '땅에 네모를 그려 여러 칸으로 나누고 번호를 매겨요. 출발하는 곳은 집, 맨 끝 칸은 하늘이에요. 납작한 돌을 사람마다 하나씩 준비해요.',
    art: sboard(76, 60, 54, 70, 6, { ny: 35, ns: 20 })
      + arrow(54, 190, 54, 158, { w: 3, head: 9 }) + T(84, 206, '출발하는 곳', { size: 15.5, fill: C.muted }) + arrow(420, 190, 420, 158, { w: 3, head: 9 }) + T(404, 206, '끝 칸', { size: 15.5, fill: C.muted })
      + flat(170, 252, 1.3) + T(266, 252, '납작한 돌 하나씩', { size: 16 }),
  },
  {
    k: '하는 법', t: '돌을 던져 놓고, 한 발로 차며 가요',
    d: '집에서 이번 단계의 칸에 돌을 던져 놓아요. 처음은 1번 칸이에요. 그다음 한 발로 뛰어 들어가 돌을 다음 칸으로, 또 다음 칸으로 차 보내요.',
    art: sboard(120, 78, 56, 46, 3, { labels: false, ny: 32 }) + kid(88, 44, { s: 0.8, pose: 'throw' }) + arrow(118, 44, 158, 82, { bend: -16, w: 3.5, head: 10 }) + flat(162, 92, 0.8)
      + badge(394, 86, 1) + T(394, 118, '1번 칸에', { size: 15.5 }) + T(394, 142, '던져 놓기', { size: 15.5 })
      + line(24, 166, 456, 166, { stroke: C.line, sw: 2, dash: '5 6' })
      + sboard(120, 226, 56, 46, 3, { labels: false, ny: 32 }) + kid(148, 190, { s: 0.8, pose: 'hop' }) + flat(180, 258, 0.9) + arrow(194, 252, 236, 252, { w: 3.5, head: 10 })
      + badge(394, 206, 2) + T(394, 238, '한 발로 뛰며', { size: 15.5 }) + T(394, 262, '다음 칸으로 차기', { size: 15.5 }),
  },
  {
    k: '하늘', t: '하늘에서 돌을 차올려 받고 돌아와요',
    d: '끝 칸에 닿으면 돌을 발등에 올려 위로 차올린 뒤 손으로 받아요. 그리고 온 길을 되돌아 나오면 한 단계 끝이에요. 다음에는 2번 칸에 던지고 똑같이 해요.',
    art: kid(120, 120, { s: 1.15, pose: 'kick' }) + flat(148, 180, 0.9, C.pt) + arrow(152, 166, 152, 96, { bend: 20, w: 3.5, head: 10 }) + flat(156, 82, 0.9)
      + badge(60, 60, 1) + T(120, 236, '발등으로 차올려', { size: 16 }) + T(120, 262, '손으로 받아요', { size: 16 })
      + dash(240) + sboard(304, 84, 34, 44, 3, { labels: false, hw: 30, ny: 22, ns: 14 }) + arrow(420, 148, 284, 148, { w: 4 })
      + badge(270, 60, 2) + T(360, 190, '온 길로 되돌아와요', { size: 16 }) + T(360, 236, '다음은 2번 칸부터', { size: 16, fill: C.pt }),
  },
  {
    k: '이럴 땐', t: '금에 닿거나 발을 내리면 차례가 넘어가요',
    d: '돌이나 발이 금에 닿았을 때, 돌이 판 밖으로 나갔을 때, 들고 있던 발이 땅에 닿았을 때 차례가 넘어가요. 다음 차례에는 실패한 단계부터 이어서 해요.',
    art: rect(34, 60, 100, 76, { fill: '#F5EFE2', stroke: CH, sw: 3 }) + line(84, 60, 84, 136, { stroke: CH, sw: 3 }) + flat(84, 100) + no(84, 170, 14) + T(84, 212, '돌이 금에', { size: 16 }) + T(84, 238, '닿았어요', { size: 16 })
      + dash(160) + rect(180, 76, 76, 60, { fill: '#F5EFE2', stroke: CH, sw: 3 }) + flat(280, 60) + arrow(232, 100, 268, 70, { w: 3, head: 9 }) + no(240, 170, 14) + T(240, 212, '돌이 밖으로', { size: 16 }) + T(240, 238, '나갔어요', { size: 16 })
      + dash(320) + kid(398, 62, { s: 0.85 }) + ground(116, 350, 446) + no(398, 170, 14) + T(398, 212, '두 발이 다', { size: 16 }) + T(398, 238, '닿았어요', { size: 16 }),
  },
];

// ---------- 비석치기 ----------
const stoneUp = (cx, yb, o = {}) => g(rect(-9, -34, 18, 34, { fill: o.fill || '#AEB5C0', stroke: C.ink, sw: 2, rx: 5 }) + rect(-5, -30, 4, 12, { fill: '#fff', op: 0.45, rx: 2 }), { x: cx, y: yb, rot: o.rot || 0 });
const biseok = [
  {
    k: '목표', t: '세워 둔 돌을 내 돌로 쓰러뜨려요',
    d: '금 위에 상대 편 돌을 세워 두고, 떨어진 곳에서 내 돌을 던지거나 몸에 얹고 가서 쓰러뜨려요. 정해 둔 단계를 먼저 모두 마친 편이 이겨요.',
    art: ground(236) + line(96, 226, 96, 246, { stroke: CH, sw: 4 }) + line(360, 226, 360, 246, { stroke: CH, sw: 4 })
      + kid(70, 150, { pose: 'throw', s: 1.1 }) + flat(180, 96, 1, C.pt) + arrow(112, 132, 322, 190, { bend: 46, dash: '7 6', w: 3.5 })
      + stoneUp(350, 234, { rot: 38 }) + motion(366, 200, 8, -70, -10, { count: 3 }) + stoneUp(396, 234) + stoneUp(432, 234)
      + T(228, 264, '서너 걸음 떨어진 곳에서', { size: 16, fill: C.muted }),
  },
  {
    k: '준비', t: '금 두 줄을 긋고 두 편으로 나눠요',
    d: '서너 걸음쯤 떨어지게 금 두 줄을 나란히 그어요. 진 편이 한쪽 금 위에 돌을 세우고, 이긴 편이 맞은편 금에서 먼저 공격해요.',
    art: ground(220) + line(150, 206, 150, 234, { stroke: CH, sw: 4 }) + line(350, 206, 350, 234, { stroke: CH, sw: 4 })
      + kid(60, 144, { s: 0.85 }) + kid(110, 144, { s: 0.85 }) + pill(84, 76, '공격하는 편', { size: 15.5, bg: C.pt })
      + stoneUp(350, 218) + stoneUp(376, 218) + kid(420, 144, { s: 0.85, fill: '#DCE8FA' }) + pill(392, 76, '돌을 세운 편', { size: 15.5, bg: C.blue })
      + arrow(170, 250, 330, 250, { w: 3, head: 9, c: C.muted }) + arrow(330, 250, 170, 250, { w: 3, head: 9, c: C.muted }) + T(250, 274, '서너 걸음', { size: 15.5, fill: C.muted }),
  },
  {
    k: '단계', t: '단계가 오를수록 돌을 몸 위쪽에 얹어요',
    d: '처음에는 그냥 던지고, 다음부터는 돌을 발등, 무릎, 배, 어깨, 머리에 얹거나 끼우고 가서 떨어뜨려요. 몸 아래에서 위로 올라갈수록 어려워져요.',
    art: kid(150, 104, { s: 1.9 })
      + [[150, 54, '머리', 5], [186, 112, '어깨', 4], [150, 146, '배', 3], [142, 196, '무릎', 2], [166, 222, '발등', 1]].map(([x, y, nm, v], i) => circ(x, y, 7, { fill: C.pt, stroke: '#fff', sw: 2 }) + line(x + 8, y, 286, 54 + i * 44, { stroke: C.pt, sw: 2, dash: '4 4' }) + badge(304, 54 + i * 44, v) + T(332, 54 + i * 44, nm, { size: 17, anchor: 'start' })).join('')
      + arrow(424, 236, 424, 50, { w: 4 }) + T(424, 262, '어려워져요', { size: 15.5, fill: C.pt }),
  },
  {
    k: '예시', t: '머리에 얹고 가서 떨어뜨려요',
    d: '돌을 머리 위에 얹고 떨어지지 않게 걸어가요. 세워 둔 돌 앞에서 고개를 숙여 내 돌을 떨어뜨려 쓰러뜨리면 성공이에요.',
    art: ground(236) + kid(80, 150, { s: 1.1 }) + flat(80, 108, 0.9, C.pt) + arrow(120, 160, 230, 160, {}) + T(176, 132, '조심조심', { size: 16, fill: C.muted })
      + kid(290, 150, { s: 1.1 }) + flat(340, 150, 0.9, C.pt) + arrow(318, 122, 346, 196, { bend: -14, w: 3.5, head: 10 })
      + stoneUp(366, 234, { rot: 42 }) + motion(384, 204, 8, -70, -10, { count: 3 }) + ok(420, 150, 15) + T(420, 186, '성공', { size: 16, fill: C.ok }),
  },
  {
    k: '이럴 땐', t: '못 맞히거나 떨어뜨리면 편이 바뀌어요',
    d: '상대 돌을 쓰러뜨리지 못했을 때, 가는 길에 돌을 떨어뜨렸을 때, 한 발로 가다가 발을 내렸을 때 차례가 넘어가요. 공격하던 편이 돌을 세우는 편이 돼요.',
    art: stoneUp(100, 120) + flat(150, 70, 1, C.pt) + arrow(40, 96, 160, 60, { bend: 10, dash: '7 6', w: 3.5 }) + ground(122, 40, 180) + no(100, 160, 14) + T(100, 200, '빗나갔어요', { size: 16 })
      + dash(214, 24, 216) + kid(290, 60, { s: 0.8 }) + flat(326, 114, 0.9, C.pt) + arrow(312, 60, 326, 100, { bend: -10, w: 3, head: 9 }) + ground(122, 250, 360) + no(318, 160, 14) + T(318, 200, '떨어뜨렸어요', { size: 16 })
      + arrow(236, 248, 312, 248, { bend: -14, w: 3.5, head: 10 }) + arrow(312, 264, 236, 264, { bend: -14, w: 3.5, head: 10, c: C.blue }) + T(394, 256, '편을 바꿔요', { size: 16, fill: C.pt }),
  },
];

// ---------- 팽이치기 ----------
const top = (cx, cy, s = 1, o = {}) => g(path('M-16 -14H16V-2L0 20L-16 -2Z', { fill: o.fill || '#E9B44C', stroke: C.ink, sw: 2.2 }) + path('M-16 -8H16', { stroke: C.pt, sw: 4 }) + path('M-13 -1H13', { stroke: C.blue, sw: 3 }) + rect(-3, -20, 6, 7, { fill: C.brown, stroke: C.ink, sw: 1.6, rx: 2 }), { x: cx, y: cy, s, rot: o.rot || 0 });
const spin = (cx, cy, r = 26) => path(`M${cx - r} ${cy}A${r} ${r * 0.34} 0 0 0 ${cx + r} ${cy}`, { stroke: C.ink, sw: 2.4, cap: 'round' }) + path(`M${cx + r} ${cy - 8}A${r} ${r * 0.34} 0 0 0 ${cx - r * 0.2} ${cy - 16}`, { stroke: C.ink, sw: 2.4, cap: 'round' });
const whip = (x, y, s = 1, o = {}) => g(line(0, 0, 70, -34, { stroke: C.brown, sw: 5 }) + path(o.curl || 'M70 -34C96 -30 104 -6 92 14C84 26 70 24 66 14', { stroke: C.ink2 || C.ink, sw: 2.4, cap: 'round' }), { x, y, s });
const paengi = [
  {
    k: '목표', t: '채로 쳐서 팽이를 오래 돌려요',
    d: '끈 달린 채로 팽이 옆구리를 쳐서 계속 돌게 해요. 여럿이 겨룰 때는 보통 더 오래 도는 팽이의 주인이 이겨요.',
    art: ground(230, 20, 256) + top(110, 204, 1.6) + spin(110, 176, 40) + whip(152, 160, 0.95) + motion(110, 150, 44, 200, 250, { count: 3 })
      + dash(280) + top(334, 104, 1.05) + spin(334, 86, 28) + crown(334, 44, 1) + T(412, 92, '오래 돌면', { size: 16 }) + T(412, 118, '이겨요', { size: 16, fill: C.ok })
      + line(296, 150, 460, 150, { stroke: C.line, sw: 2, dash: '5 6' })
      + top(334, 214, 1.05, { rot: 78 }) + T(412, 200, '쓰러지면', { size: 16 }) + T(412, 226, '져요', { size: 16, fill: C.muted }),
  },
  {
    k: '준비', t: '팽이와 팽이채를 하나씩 가져요',
    d: '팽이채는 50cm쯤 되는 막대 끝에 끈을 맨 것이에요. 바닥이 고르고 넓은 곳을 고르고, 다른 사람과 충분히 떨어져서 해요.',
    art: top(110, 130, 2) + T(110, 214, '팽이', { size: 17 })
      + whip(232, 170, 1.7, { curl: 'M70 -34C86 -20 78 -4 88 8C96 18 90 30 84 34' }) + T(300, 214, '팽이채', { size: 17 }) + T(300, 242, '막대 50cm쯤 + 끈', { size: 15.5, fill: C.muted })
      + T(110, 242, '사람마다 하나', { size: 15.5, fill: C.muted }),
  },
  {
    k: '돌리기', t: '위가 아니라 옆에서 감아 당기듯 쳐요',
    d: '끈을 팽이에 감았다가 풀며 돌리거나 손으로 비벼 세워요. 도는 팽이는 채 끈으로 옆을 쳐서 살려요. 위에서 내리치면 쓰러져요.',
    art: ground(196, 30, 220) + top(120, 170, 1.5) + spin(120, 146, 36) + arrow(214, 150, 158, 160, { w: 4 }) + ok(120, 232, 15) + T(120, 268, '옆에서 쳐요', { size: 16 })
      + dash(240) + ground(196, 260, 450) + top(356, 172, 1.5, { rot: 24 }) + arrow(356, 60, 356, 124, { w: 4 }) + no(356, 232, 15) + T(356, 268, '위에서 치면 쓰러져요', { size: 16 }),
  },
  {
    k: '겨루기', t: '팽이싸움은 다섯 가지예요',
    d: '오래 돌리기, 멀리 치기, 빨리 돌아오기, 부딪쳐 돌아오기, 찌게 돌리기가 있어요. 시작 전에 어떤 방법으로 겨룰지 정해요.',
    art: [['오래 돌리기', '한 번 부딪친 뒤 더 오래 돌기'], ['멀리 치기', '쳐서 멀리 보내고 오래 돌기'], ['빨리 돌아오기', '정한 곳까지 몰고 갔다 오기'], ['부딪쳐 돌아오기', '장애물에 부딪고 돌아오기'], ['찌게 돌리기', '번갈아 상대 팽이를 치기']]
      .map(([a, b], i) => pill(96, 38 + i * 56, a, { size: 15.5, bg: i === 0 ? C.pt : C.ink }) + T(328, 38 + i * 56, b, { size: 15.5 })).join(''),
  },
  {
    k: '끝', t: '먼저 쓰러진 팽이가 져요',
    d: '어떤 방법으로 겨루든 마지막에는 더 오래 도는 쪽이 이겨요. 한쪽 팽이가 쓰러지면 한 판이 끝나요.',
    art: ground(206) + top(140, 178, 1.7) + spin(140, 148, 42) + crown(140, 86, 1.3) + T(140, 246, '아직 돌아요', { size: 17, fill: C.ok })
      + top(340, 188, 1.7, { rot: 80 }) + T(340, 246, '쓰러졌어요', { size: 17, fill: C.muted }),
  },
];

// ---------- 땅따먹기 ----------
const R = 112;
const field = (cx, cy, o = {}) => circ(cx, cy, R, { fill: '#F5EFE2', stroke: CH, sw: 3.5 });
const homeAt = (cx, cy, fill, stroke) => { const yb = cy + R - 5.4; return path(`M${cx - 34} ${yb}A34 34 0 0 1 ${cx + 34} ${yb}A${R} ${R} 0 0 1 ${cx - 34} ${yb}Z`, { fill, stroke, sw: 3 }); };
const homeTop = (cx, cy, fill, stroke) => { const yb = cy - R + 5.4; return path(`M${cx + 34} ${yb}A34 34 0 0 1 ${cx - 34} ${yb}A${R} ${R} 0 0 1 ${cx + 34} ${yb}Z`, { fill, stroke, sw: 3 }); };
const mal = (cx, cy, c = C.ink) => circ(cx, cy + 1.5, 6, { fill: C.ink }) + circ(cx, cy, 6, { fill: c, stroke: C.ink, sw: 1.6 });
const ttang = [
  {
    k: '목표', t: '놀이판에서 가장 넓은 땅을 차지해요',
    d: '큰 원 안에서 각자 집을 조금씩 넓혀 가요. 빈 땅이 없어졌을 때 땅이 가장 넓은 사람이 이겨요.',
    art: field(150, 150) + path('M116 256.6A34 34 0 0 1 184 256.6A112 112 0 0 1 116 256.6Z', { fill: C.ptTint, stroke: C.pt, sw: 3 })
      + poly([[124, 240], [70, 170], [110, 96], [190, 120], [176, 240]], { fill: C.ptTint, stroke: C.pt, sw: 3 }) + poly([[176, 60], [124, 62], [150, 110], [214, 104]], { fill: '#DCE8FA', stroke: C.blue, sw: 3 })
      + T(132, 180, '내 땅', { size: 17, fill: C.pt })
      + person(350, 84, { fill: C.ptTint }) + crown(350, 40, 1) + T(350, 136, '땅이 더 넓어요', { size: 16 }) + person(350, 208, { fill: '#DCE8FA' }) + T(350, 260, '땅이 좁아요', { size: 16, fill: C.muted }),
  },
  {
    k: '준비', t: '큰 원을 그리고 뼘으로 집을 그려요',
    d: '땅에 지름 1~2m쯤 되는 원이나 네모를 그려요. 각자 가장자리에 손을 한 뼘 벌려 반원을 그리면 그곳이 내 집이에요. 작고 납작한 돌을 말로 써요.',
    art: field(150, 150) + homeAt(150, 150, C.ptTint, C.pt) + homeTop(150, 150, '#DCE8FA', C.blue) + T(150, 204, '내 집', { size: 16, fill: C.pt }) + T(150, 96, '친구 집', { size: 16, fill: C.blue })
      + arrow(116, 284, 184, 284, { w: 3, head: 9 }) + arrow(184, 284, 116, 284, { w: 3, head: 9 })
      + T(370, 70, '한 뼘으로', { size: 16 }) + T(370, 96, '반원을 그려요', { size: 16 }) + hand(370, 172, { s: 1.1 })
      + mal(330, 244, C.pt) + T(398, 244, '작은 돌 ‘말’', { size: 16 }),
  },
  {
    k: '내 차례', t: '말을 세 번 튕겨 집으로 돌아와요',
    d: '집 안에 말을 놓고 엄지손가락으로 튕겨요. 세 번 안에 내 집으로 돌아와야 해요. 말이 멈춘 자리마다 금을 이어 그려요.',
    art: field(150, 150) + homeAt(150, 150, C.ptTint, C.pt)
      + line(150, 240, 84, 150, { stroke: C.pt, sw: 3.5 }) + line(84, 150, 196, 110, { stroke: C.pt, sw: 3.5 }) + arrow(196, 110, 160, 232, { w: 3.5, head: 11 })
      + badge(100, 204, 1) + badge(136, 112, 2) + badge(200, 176, 3) + mal(84, 150, C.pt) + mal(196, 110, C.pt) + mal(150, 244, C.pt)
      + point(340, 96, { s: 1.2 }) + mal(398, 92, C.pt) + motion(410, 92, 6, -30, 30, { count: 3 }) + T(370, 150, '엄지로 튕겨요', { size: 16 })
      + pill(370, 216, '세 번 안에 집으로', { size: 15.5, bg: C.pt }),
  },
  {
    k: '성공', t: '지나온 금 안쪽이 내 땅이 돼요',
    d: '세 번째에 말이 집 안으로 돌아오면 성공이에요. 말이 지나간 금과 내 집 사이의 땅이 모두 내 땅이 돼요.',
    art: field(150, 150) + poly([[150, 240], [84, 150], [196, 110]], { fill: C.ptTint, stroke: C.pt, sw: 3.5 }) + homeAt(150, 150, C.ptTint, C.pt)
      + T(144, 170, '내 땅', { size: 18, fill: C.pt, weight: 800 }) + ok(214, 214, 15)
      + T(370, 110, '집으로 돌아오면', { size: 16 }) + T(370, 140, '금 안쪽이 내 땅', { size: 17, fill: C.pt }) + T(370, 200, '다음에는 넓어진 땅', { size: 15.5, fill: C.muted }) + T(370, 224, '어디서든 시작해요', { size: 15.5, fill: C.muted }),
  },
  {
    k: '이럴 땐', t: '못 돌아오거나 밖으로 나가면 차례가 넘어가요',
    d: '세 번을 다 튕겼는데 말이 집에 들어오지 못했거나, 말이 놀이판 밖으로 나가면 실패예요. 그린 금을 지우고 다음 사람에게 차례를 넘겨요.',
    art: circ(120, 140, 86, { fill: '#F5EFE2', stroke: CH, sw: 3.5 }) + path('M92 221.4A30 30 0 0 1 148 221.4A86 86 0 0 1 92 221.4Z', { fill: C.ptTint, stroke: C.pt, sw: 3 })
      + path('M120 210L70 140L150 96L170 170', { stroke: C.pt, sw: 3, dash: '6 5' }) + mal(170, 170, C.pt) + no(196, 190, 13) + T(120, 258, '집에 못 들어왔어요', { size: 16 })
      + dash(240) + circ(360, 140, 86, { fill: '#F5EFE2', stroke: CH, sw: 3.5 }) + path('M332 221.4A30 30 0 0 1 388 221.4A86 86 0 0 1 332 221.4Z', { fill: C.ptTint, stroke: C.pt, sw: 3 })
      + path('M360 210L400 120L452 70', { stroke: C.pt, sw: 3, dash: '6 5' }) + mal(452, 70, C.pt) + no(440, 104, 13) + T(360, 258, '밖으로 나갔어요', { size: 16 }),
  },
];

export default { sabangchigi: sabang, biseokchigi: biseok, paengichigi: paengi, ttangttameokgi: ttang };
