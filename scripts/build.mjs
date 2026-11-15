// 룰룰 사이트 빌드 스크립트
// content/ 폴더의 원고(JSON)를 읽어 public/ 폴더에 정적 페이지를 만듭니다.
// 실행: npm run build  (Cloudflare Pages 빌드 명령도 같습니다)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISUALS, frameSVG } from '../src/visual/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const STATIC = path.join(ROOT, 'src', 'static');
const BUILD = Date.now().toString(36);

const readJSON = (rel) => {
  const file = path.join(ROOT, rel);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${rel} 파일을 읽지 못했어요. JSON 형식(쉼표, 따옴표)을 확인해 주세요.\n${e.message}`);
  }
};

const cfg = readJSON('site.config.json');
const SITE = cfg.siteUrl.replace(/\/$/, '');
const abs = (p) => SITE + p;

// ---------- 글자 다루기 ----------
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const fmt = (s = '') => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const plain = (s = '') => String(s).replace(/\*\*(.+?)\*\*/g, '$1');
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const cho = (s) => [...String(s)].map((ch) => {
  const c = ch.charCodeAt(0) - 0xac00;
  return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch;
}).join('');
const firstSyllable = (name) => [...name.replace(/^[^가-힣A-Za-z0-9]+/, '')][0] || name[0];

const GROUPS = { family: '가족 게임', party: '파티 게임', strategy: '전략 게임', traditional: '전통놀이' };
const LEVELS = { 1: '쉬움', 2: '보통', 3: '어려움' };
const KINDS = { board: '보드게임', traditional: '전통놀이' };

const playersText = (p) => (p[1] >= 99 ? `${p[0]}명 이상` : p[0] === p[1] ? `${p[0]}명` : `${p[0]}–${p[1]}명`);
const minutesText = (m) => (m[0] === m[1] ? `${m[0]}분` : `${m[0]}–${m[1]}분`);
const ageText = (a) => `${a}세 이상`;

// ---------- 원고 읽기와 점검 ----------
const gamesDir = path.join(ROOT, 'content', 'games');
const problems = [];
const games = fs.readdirSync(gamesDir).filter((f) => f.endsWith('.json')).sort().map((f) => {
  const g = readJSON(path.join('content', 'games', f));
  g._file = f;
  return g;
});

const need = (g, cond, msg) => { if (!cond) problems.push(`${g._file}: ${msg}`); };
const visualsOf = (g) => VISUALS[g.slug] || [];
const slugs = new Set();
const codes = new Set();
for (const g of games) {
  need(g, typeof g.slug === 'string' && /^[a-z0-9-]+$/.test(g.slug), 'slug는 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요');
  need(g, g._file === `${g.slug}.json`, `파일 이름이 slug와 같아야 해요 (${g.slug}.json)`);
  need(g, !slugs.has(g.slug), `slug가 겹쳐요: ${g.slug}`);
  slugs.add(g.slug);
  need(g, typeof g.code === 'string' && /^[a-z0-9]{2,3}$/.test(g.code), 'code는 영문 소문자·숫자 2~3자예요 (QR 주소에 씀)');
  need(g, !codes.has(g.code), `code가 겹쳐요: ${g.code}`);
  codes.add(g.code);
  need(g, g.name, 'name(게임 이름)이 비어 있어요');
  need(g, KINDS[g.kind], 'kind는 board 또는 traditional이에요');
  need(g, GROUPS[g.group], 'group은 family, party, strategy, traditional 가운데 하나예요');
  need(g, Array.isArray(g.players) && g.players.length === 2, 'players는 [최소, 최대] 형식이에요');
  need(g, Array.isArray(g.minutes) && g.minutes.length === 2, 'minutes는 [최소, 최대] 형식이에요');
  need(g, Number.isFinite(g.age), 'age(나이)가 숫자가 아니에요');
  need(g, LEVELS[g.level], 'level은 1(쉬움), 2(보통), 3(어려움)이에요');
  need(g, g.oneLine, 'oneLine(한 줄 소개)이 비어 있어요');
  need(g, g.summary && g.summary.goal && Array.isArray(g.summary.turn) && g.summary.end, 'summary(goal, turn, end)를 모두 채워 주세요');
  need(g, Array.isArray(g.setup) && g.setup.length, 'setup(준비하기)이 비어 있어요');
  need(g, Array.isArray(g.components), 'components(구성물)가 필요해요');
  visualsOf(g).forEach((f, i) => need(g, f.k && f.t && f.d && f.art, `그림 설명 ${i + 1}번째에 k, t, d, art가 모두 있어야 해요`));
  if (!visualsOf(g).length) console.warn(`알림: ${g._file}에는 아직 그림 설명이 없어요 (src/visual)`);
}
for (const g of games) {
  g.related = (g.related || []).filter((s) => {
    if (!slugs.has(s)) { console.warn(`알림: ${g._file}의 related에 없는 게임이 있어요 (${s})`); return false; }
    return true;
  });
}
const content = readJSON('content/collections.json');
const glossary = readJSON('content/glossary.json');
let venues = [];
if (fs.existsSync(path.join(ROOT, 'content', 'venues.json'))) venues = readJSON('content/venues.json');
for (const c of content.collections) {
  for (const s of c.games) if (!slugs.has(s)) problems.push(`collections.json: '${c.title}'에 없는 게임이 있어요 (${s})`);
}
for (const s of content.popular) if (!slugs.has(s)) problems.push(`collections.json: popular에 없는 게임이 있어요 (${s})`);
for (const v of venues) {
  if (!/^[a-z0-9-]+$/.test(v.slug || '')) problems.push(`venues.json: slug가 잘못됐어요 (${v.name})`);
  for (const s of v.games || []) if (!slugs.has(s)) problems.push(`venues.json: '${v.name}'에 없는 게임이 있어요 (${s})`);
}
if (problems.length) {
  console.error('\n원고에서 고칠 곳이 있어요:\n- ' + problems.join('\n- '));
  process.exit(1);
}

const bySlug = Object.fromEntries(games.map((g) => [g.slug, g]));
// 전통놀이는 판 놀이, 손 놀이, 몸 놀이 순서로 보여 줘요
const TRAD_ORDER = ['yutnori', 'janggi', 'baduk', 'omok', 'umul-gonu', 'gonggi', 'chilgyo', 'tuho', 'jegichagi', 'ttakji'];
const tradGames = () => {
  const list = games.filter((g) => g.kind === 'traditional');
  const rank = (g) => (TRAD_ORDER.indexOf(g.slug) < 0 ? 99 : TRAD_ORDER.indexOf(g.slug));
  return list.sort((a, b) => rank(a) - rank(b) || collator.compare(a.name, b.name));
};
const collator = new Intl.Collator('ko');
const sortedGames = [...games].sort((a, b) => collator.compare(a.name, b.name));

// ---------- 아이콘 ----------
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
<symbol id="i-people" viewBox="0 0 24 24"><circle cx="8" cy="7" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 20c.4-3.6 2.2-6 4.5-6s4.1 2.4 4.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="8.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14.6 14.4c.6-.3 1.2-.4 1.9-.4 2.1 0 3.6 2.1 4 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-time" viewBox="0 0 24 24"><path d="M7 3h10M7 21h10M8 3c0 4 3 5.5 4 9-1 3.5-4 5-4 9M16 3c0 4-3 5.5-4 9 1 3.5 4 5 4 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-age" viewBox="0 0 24 24"><path d="M12 3.5c1.2 1.5 1.8 2.6 1.8 3.5a1.8 1.8 0 0 1-3.6 0c0-.9.6-2 1.8-3.5Z" fill="currentColor"/><path d="M12 9.5v3M5 12.5h14v8H5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M5 16c2 1.5 3.5 1.5 5 0s3-1.5 4.5 0 3 1.5 4.5 0" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="i-share" viewBox="0 0 24 24"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-speaker" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-flag" viewBox="0 0 24 24"><path d="M5 21V4m0 0h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-table" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m10 9 4 2-4 2z" fill="currentColor"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-qr" viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM16 16h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="currentColor"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="i-print" viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</defs></svg>`;

const icon = (id, cls = '') => `<svg class="ico ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

const PIPS = { 1: [[12, 12]], 2: [[8, 8], [16, 16]], 3: [[7.5, 7.5], [12, 12], [16.5, 16.5]] };
const die = (level, cls = '') => `<svg class="die ${cls}" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>${PIPS[level].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="currentColor"/>`).join('')}</svg>`;

const BRAND = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="8" fill="#E4572E"/><circle cx="10" cy="10" r="3" fill="#fff"/><circle cx="16" cy="16" r="3" fill="#fff"/><circle cx="22" cy="22" r="3" fill="#fff"/></svg>`;

const tile = (g, cls = '') => `<div class="tile ${cls}" data-g="${g.group}" aria-hidden="true"><span>${esc(firstSyllable(g.name))}</span></div>`;

// ---------- 놀이판 그림 (전통놀이) ----------
function yutBoard() {
  const S = 300, P = 30;
  const pts = [];
  const side = (x1, y1, x2, y2) => { for (let i = 0; i <= 5; i++) pts.push([x1 + ((x2 - x1) * i) / 5, y1 + ((y2 - y1) * i) / 5]); };
  side(P, P, S - P, P); side(S - P, P, S - P, S - P); side(S - P, S - P, P, S - P); side(P, S - P, P, P);
  const c = S / 2;
  const diag = [];
  for (const [x, y] of [[P, P], [S - P, P], [S - P, S - P], [P, S - P]]) {
    for (const t of [1 / 3, 2 / 3]) diag.push([x + (c - x) * t, y + (c - y) * t]);
  }
  const uniq = new Map();
  [...pts, ...diag, [c, c]].forEach(([x, y]) => uniq.set(`${Math.round(x)},${Math.round(y)}`, [x, y]));
  const corners = [[P, P], [S - P, P], [S - P, S - P], [P, S - P], [c, c]];
  const isCorner = (x, y) => corners.some(([a, b]) => Math.abs(a - x) < 1 && Math.abs(b - y) < 1);
  const dots = [...uniq.values()].map(([x, y]) => isCorner(x, y)
    ? `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="#1C2230" stroke-width="3"/>`
    : `<circle cx="${x}" cy="${y}" r="7" fill="#1C2230"/>`).join('');
  return `<svg class="diagram" viewBox="0 0 ${S} ${S + 34}" role="img" aria-label="윷판 그림. 바깥 네모 둘레에 20칸, 두 대각선에 9칸, 모두 29칸입니다. 오른쪽 아래가 출발점이고 반시계 방향으로 돕니다.">
<rect x="${P}" y="${P}" width="${S - 2 * P}" height="${S - 2 * P}" fill="none" stroke="#C9CDD6" stroke-width="3"/>
<path d="M${P} ${P}L${S - P} ${S - P}M${S - P} ${P}L${P} ${S - P}" stroke="#C9CDD6" stroke-width="3"/>
${dots}
<circle cx="${S - P}" cy="${S - P}" r="11" fill="#E4572E" stroke="#1C2230" stroke-width="3"/>
<path d="M${S - 8} ${S - P - 40}v-50m0 0-7 10m7-10 7 10" fill="none" stroke="#E4572E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text x="${S - P}" y="${S + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="#E4572E">출발</text>
<text x="${c}" y="${c - 20}" text-anchor="middle" font-size="14" font-weight="700" fill="#5F6675">방</text>
</svg>`;
}

function umulGonuBoard() {
  return `<svg class="diagram" viewBox="0 0 300 345" role="img" aria-label="우물고누 판 그림. 네모의 네 꼭짓점과 가운데 한 점, 모두 다섯 점이 있고 아래쪽 변은 우물로 막혀 있습니다. 왼쪽 두 점에 검은 말, 오른쪽 두 점에 흰 말을 놓습니다.">
<path d="M40 40H260M40 40V260M260 40V260M40 40L260 260M260 40L40 260" stroke="#C9CDD6" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="150" cy="268" rx="38" ry="16" fill="#E8F0FB" stroke="#7FA3D6" stroke-width="3"/>
<text x="150" y="334" text-anchor="middle" font-size="15" font-weight="700" fill="#4C79B8">우물 (지나갈 수 없어요)</text>
<circle cx="150" cy="150" r="10" fill="#fff" stroke="#1C2230" stroke-width="3"/>
<circle cx="40" cy="40" r="17" fill="#1C2230"/><circle cx="40" cy="260" r="17" fill="#1C2230"/>
<circle cx="260" cy="40" r="17" fill="#fff" stroke="#1C2230" stroke-width="3"/><circle cx="260" cy="260" r="17" fill="#fff" stroke="#1C2230" stroke-width="3"/>
<circle cx="40" cy="260" r="25" fill="none" stroke="#E4572E" stroke-width="3" stroke-dasharray="5 5"/>
<text x="14" y="306" font-size="14" font-weight="700" fill="#E4572E">첫 수에 움직이지 않는 말</text>
</svg>`;
}

function chilgyoBoard() {
  const u = 70, o = 10;
  const p = (pts) => pts.map(([x, y]) => `${o + x * u},${o + y * u}`).join(' ');
  const pieces = [
    { pts: [[0, 0], [4, 0], [2, 2]], fill: '#E4572E', name: '큰 삼각형' },
    { pts: [[0, 0], [2, 2], [0, 4]], fill: '#F08A6A', name: '큰 삼각형' },
    { pts: [[2, 4], [4, 2], [4, 4]], fill: '#1C2230', name: '중간 삼각형' },
    { pts: [[4, 0], [4, 2], [3, 1]], fill: '#7C8494', name: '작은 삼각형' },
    { pts: [[2, 2], [3, 3], [1, 3]], fill: '#AEB4C0', name: '작은 삼각형' },
    { pts: [[2, 2], [3, 1], [4, 2], [3, 3]], fill: '#F6C3B2', name: '정사각형' },
    { pts: [[0, 4], [1, 3], [3, 3], [2, 4]], fill: '#5F6675', name: '평행사변형' },
  ];
  return `<svg class="diagram" viewBox="0 0 300 300" role="img" aria-label="칠교판 그림. 정사각형 하나를 큰 삼각형 2개, 중간 삼각형 1개, 작은 삼각형 2개, 정사각형 1개, 평행사변형 1개로 나눈 모습입니다.">
${pieces.map((pc) => `<polygon points="${p(pc.pts)}" fill="${pc.fill}" stroke="#fff" stroke-width="4" stroke-linejoin="round"><title>${pc.name}</title></polygon>`).join('')}
</svg>`;
}
const DIAGRAMS = { 'yut-board': yutBoard, 'umul-gonu': umulGonuBoard, chilgyo: chilgyoBoard };

// ---------- 공통 틀 ----------
const NAV = [
  ['/games/', '게임 찾기'],
  ['/traditional/', '전통놀이'],
  ['/learn/', '처음이라면'],
  ['/space/', '공간 운영자'],
];

function header(current) {
  return `<header class="site-head">
<div class="wrap head-row">
<a class="brand" href="/" aria-label="${esc(cfg.siteName)} 처음 화면">${BRAND}<span>${esc(cfg.siteName)}</span>${cfg.tagline ? `<small class="brand-tag">${esc(cfg.tagline)}</small>` : ''}</a>
<nav class="nav" id="site-nav" aria-label="주요 메뉴">
${NAV.map(([href, label]) => `<a href="${href}"${current.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('\n')}
</nav>
<a class="icon-btn" href="/games/#search" aria-label="게임 찾기">${icon('i-search')}</a>
<button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="메뉴 열기">${icon('i-menu')}</button>
</div>
</header>`;
}

function footer() {
  return `<footer class="site-foot">
<div class="wrap foot-grid">
<div>
<a class="brand brand-foot" href="/">${BRAND}<span>${esc(cfg.siteName)}</span></a>${cfg.tagline ? `<p class="foot-tag">${esc(cfg.tagline)}</p>` : ''}
<p class="foot-lead">보드게임과 전통놀이, 처음 하는 사람도 3분 안에 시작할 수 있게 설명해요.</p>
</div>
<nav class="foot-nav" aria-label="바닥 메뉴">
<a href="/games/">게임 찾기</a>
<a href="/traditional/">전통놀이</a>
<a href="/learn/">처음이라면</a>
<a href="/space/">공간 운영자</a>
<a href="/about/">${esc(cfg.siteName)} 소개</a>
<button type="button" class="link-btn" data-report="">틀린 곳 알려 주기</button>
</nav>
<p class="foot-note">게임 이름과 상표는 각 권리자의 것이에요. ${esc(cfg.siteName)}의 설명은 직접 해 보고 우리 말로 다시 쓴 것이며, 상자 속 공식 룰북을 대신하지 않아요.</p>
<p class="foot-copy">© ${new Date().getFullYear()} ${esc(cfg.siteName)}</p>
</div>
</footer>`;
}

function reportDialog() {
  const options = sortedGames.map((g) => `<option value="${g.slug}">${esc(g.name)}</option>`).join('');
  return `<dialog class="sheet" id="report-dialog" aria-labelledby="report-title">
<form class="sheet-body" id="report-form" method="dialog">
<div class="sheet-head"><h2 id="report-title">틀린 곳 알려 주기</h2><button type="button" class="icon-btn" data-close aria-label="닫기">${icon('i-close')}</button></div>
<p class="muted">확인한 뒤 설명을 고칠게요. 개인 정보는 적지 않아도 돼요.</p>
<label class="field"><span>어떤 게임인가요?</span>
<select name="slug"><option value="">게임과 상관없는 의견</option>${options}</select></label>
<label class="field"><span>어떤 내용인가요?</span>
<select name="kind">
<option value="wrong">규칙이 틀렸어요</option>
<option value="unclear">설명이 헷갈려요</option>
<option value="typo">오타나 어색한 표현이 있어요</option>
<option value="request">이 게임도 넣어 주세요</option>
<option value="other">그 밖의 의견</option>
</select></label>
<label class="field"><span>자세히 적어 주세요</span>
<textarea name="message" rows="5" maxlength="1000" required placeholder="예: 종을 잘못 쳤을 때 카드를 1장씩 주는 게 맞나요? 우리 상자 룰북에는 2장이라고 나와요."></textarea></label>
<label class="field"><span>답을 받고 싶다면 연락처 (선택)</span>
<input name="contact" maxlength="100" autocomplete="email" placeholder="이메일이나 카카오톡 아이디"></label>
<label class="hp" aria-hidden="true">비워 두세요<input name="website" tabindex="-1" autocomplete="off"></label>
<p class="form-msg" role="status" aria-live="polite"></p>
<div class="sheet-actions"><button type="submit" class="btn btn-main">보내기</button></div>
</form>
</dialog>`;
}

function layout({ title, description, path: p, body, scripts = [], noindex = false, jsonld = null, bodyClass = '' }) {
  const url = abs(p);
  const ld = jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs('/assets/img/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
${cfg.naverSiteVerification ? `<meta name="naver-site-verification" content="${esc(cfg.naverSiteVerification)}">` : ''}
${cfg.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}">` : ''}
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&amp;display=swap">
<link rel="stylesheet" href="/assets/css/app.css?v=${BUILD}">
<script>document.documentElement.classList.add('js')</script>
${ld}
</head>
<body class="${bodyClass}">
${SPRITE}
<a class="skip" href="#main">본문으로 건너뛰기</a>
${header(p)}
<main id="main">
${body}
</main>
${footer()}
${reportDialog()}
<script src="/assets/js/app.js?v=${BUILD}" defer></script>
${scripts.map((s) => `<script src="/assets/js/${s}?v=${BUILD}" defer></script>`).join('\n')}
</body>
</html>`;
}

// ---------- 조각들 ----------
const facts = (g) => `<ul class="facts" aria-label="기본 정보">
<li>${icon('i-people')}<span><b>${playersText(g.players)}</b>${g.best ? `<small>추천 ${esc(g.best)}</small>` : ''}</span></li>
<li>${icon('i-time')}<span><b>${minutesText(g.minutes)}</b><small>한 판</small></span></li>
<li>${icon('i-age')}<span><b>${ageText(g.age)}</b><small>나이</small></span></li>
<li>${die(g.level)}<span><b>${LEVELS[g.level]}</b><small>난이도</small></span></li>
</ul>`;

const cardData = (g) => [
  `data-slug="${g.slug}"`,
  `data-p="${g.players.join(',')}"`,
  `data-m="${g.minutes.join(',')}"`,
  `data-age="${g.age}"`,
  `data-l="${g.level}"`,
  `data-k="${g.kind}"`,
  `data-g="${g.group}"`,
  `data-t="${esc((g.tags || []).join('|'))}"`,
  `data-n="${esc([g.name, g.original || '', ...(g.aliases || [])].join('|'))}"`,
  `data-c="${esc([g.name, ...(g.aliases || [])].map(cho).join('|'))}"`,
].join(' ');

const gameCard = (g, extra = '') => `<a class="gcard" href="/games/${g.slug}/${extra}" ${cardData(g)}>
${tile(g)}
<span class="gcard-body">
<span class="gcard-name">${esc(g.name)}</span>
<span class="gcard-one">${esc(g.oneLine)}</span>
<span class="gcard-meta"><span>${icon('i-people')}${playersText(g.players)}</span><span>${icon('i-time')}${minutesText(g.minutes)}</span><span>${die(g.level)}${LEVELS[g.level]}</span></span>
</span>
</a>`;

const qaList = (items) => `<div class="qa">${items.map((x) => `<div class="qa-item"><p class="qa-q">${fmt(x.q)}</p><p class="qa-a">${fmt(x.a)}</p></div>`).join('')}</div>`;

// ---------- 페이지: 게임 ----------
function gamePage(g) {
  const name = g.name;
  const statusNote = g.status === 'checked'
    ? `<p class="status status-ok">${icon('i-check')}<span>검수 완료${g.checked && g.checked.date ? ` (${esc(g.checked.date)}${g.checked.by ? `, ${esc(g.checked.by)}` : ''})` : ''}. 그래도 다른 곳이 보이면 알려 주세요.</span></p>`
    : `<p class="status status-draft"><span>아직 검수 중인 설명이에요. 상자 속 룰북과 다른 곳이 보이면 알려 주세요.</span><button type="button" class="link-btn" data-report="${g.slug}">틀린 곳 알려 주기</button></p>`;

  const comps = g.components.length ? `<h3 class="h3">구성물 확인</h3>
<ul class="checklist" data-store="comp-${g.slug}">${g.components.map((c, i) => `<li><label><input type="checkbox" data-i="${i}"><span>${fmt(c)}</span></label></li>`).join('')}</ul>` : '';

  const examples = (g.examples || []).length ? `<h3 class="h3">따라 해 보기</h3>
<div class="examples">${g.examples.map((e) => `<div class="example"><p class="example-t">${fmt(e.title)}</p><p>${fmt(e.text)}</p></div>`).join('')}</div>` : '';

  const scoring = (g.scoring || []).length ? `<h3 class="h3">끝내기와 점수</h3><ul class="list">${g.scoring.map((s) => `<li>${fmt(s)}</li>`).join('')}</ul>` : '';

  const diagram = g.diagram && DIAGRAMS[g.diagram] ? `<figure class="figure">${DIAGRAMS[g.diagram]()}${g.diagramCaption ? `<figcaption>${fmt(g.diagramCaption)}</figcaption>` : ''}</figure>` : '';

  const vis = visualsOf(g);
  const visPanel = vis.length ? `<section class="panel" id="visual" role="tabpanel" aria-labelledby="tab-visual">
<div class="vis" data-vis>
<div class="vis-top"><h2 class="h2">그림으로 보는 ${esc(name)} 하는 법</h2><button type="button" class="vis-mode" data-vis-mode aria-pressed="false">모두 펼치기</button></div>
<ol class="vis-steps" aria-label="단계 목록">${vis.map((f, i) => `<li><button type="button" data-vis-go="${i}"><span>${i + 1}</span>${esc(f.k)}</button></li>`).join('')}</ol>
<ol class="vis-track" tabindex="0" aria-label="${esc(name)} 그림 설명 ${vis.length}장" data-vis-track>
${vis.map((f, i) => `<li class="vis-step" id="v-${i + 1}" aria-label="${i + 1} / ${vis.length}">
<figure class="vis-fig"><div class="vis-art">${frameSVG(f.art, `${f.t}. ${f.d}`)}</div>
<figcaption class="vis-cap"><p class="vis-k"><span class="vis-n">${i + 1}</span>${esc(f.k)}</p><h3 class="vis-t">${esc(f.t)}</h3><p class="vis-d">${esc(f.d)}</p></figcaption></figure>
</li>`).join('\n')}
</ol>
<div class="vis-nav"><button type="button" class="vis-btn" data-vis-prev>이전</button><span class="vis-count" aria-live="polite">1 / ${vis.length}</span><button type="button" class="vis-btn vis-next" data-vis-next>다음</button></div>
<p class="vis-after">글로 차근차근 보려면 <a href="#learn">따라하기</a>, 규칙을 찾아보려면 <a href="#detail">자세히</a>를 눌러요.</p>
</div>
</section>` : '';

  const rules = (g.rules || []).map((r, i) => `<section class="rule-sec" id="rule-${i + 1}"><h3 class="h3">${fmt(r.title)}</h3><ul class="list">${r.items.map((it) => `<li>${fmt(it)}</li>`).join('')}</ul></section>`).join('');

  const variants = (g.variants || []).length ? `<h3 class="h3">인원별 규칙과 다른 방법</h3><div class="examples">${g.variants.map((v) => `<div class="example"><p class="example-t">${fmt(v.title)}</p><p>${fmt(v.text)}</p></div>`).join('')}</div>` : '';

  const house = (g.houseRules || []).length ? `<section class="house" id="house" data-slug="${g.slug}">
<h3 class="h3">우리 집 규칙 정하기</h3>
<p class="muted">공식 규칙은 아니지만 많이 쓰는 방법이에요. 시작하기 전에 쓸 규칙을 함께 고르고, 규칙 카드를 단톡방에 보내 두면 중간에 다툴 일이 줄어요.</p>
<ul class="house-list">${g.houseRules.map((h) => `<li><label><input type="checkbox" value="${esc(h.id)}"><span><b>${fmt(h.title)}</b><small>${fmt(h.text)}</small></span></label></li>`).join('')}</ul>
<div class="house-out" hidden><pre class="house-card"></pre><div class="row-btns"><button type="button" class="btn btn-sub" data-house-share>규칙 카드 보내기</button><button type="button" class="btn btn-ghost" data-house-copy>글로 복사</button></div></div>
<button type="button" class="btn btn-sub" data-house-make>규칙 카드 만들기</button>
</section>` : '';

  const related = g.related.length ? `<section class="related wrap-narrow">
<h2 class="h2">비슷한 게임</h2>
<div class="gcards">${g.related.map((s) => gameCard(bySlug[s])).join('')}</div>
</section>` : '';

  const body = `<article class="game" data-slug="${g.slug}">
<div class="wrap-narrow">
<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">/</span><a href="${g.kind === 'traditional' ? '/traditional/' : '/games/'}">${g.kind === 'traditional' ? '전통놀이' : '게임 찾기'}</a></nav>
<header class="game-head">
${tile(g, 'tile-lg')}
<div class="game-title">
<h1 class="game-name">${esc(name)}</h1>
${g.original ? `<p class="game-orig">${esc(g.original)}</p>` : ''}
<p class="game-one">${fmt(g.oneLine)}</p>
</div>
</header>
${facts(g)}
${g.intro ? `<p class="game-intro">${fmt(g.intro)}</p>` : ''}
${g.compare ? `<p class="compare">${fmt(g.compare)}</p>` : ''}
${statusNote}
<div class="tabs" role="tablist" aria-label="설명 단계">
${vis.length ? '<button role="tab" id="tab-visual" aria-controls="visual" aria-selected="true">그림으로</button>' : ''}
<button role="tab" id="tab-summary" aria-controls="summary" aria-selected="${vis.length ? 'false' : 'true'}">1분 요약</button>
<button role="tab" id="tab-learn" aria-controls="learn" aria-selected="false">따라하기</button>
<button role="tab" id="tab-detail" aria-controls="detail" aria-selected="false">자세히</button>
</div>

${visPanel}
<section class="panel" id="summary" role="tabpanel" aria-labelledby="tab-summary">
<h2 class="h2">${esc(name)} 1분 요약</h2>
<div class="rcard">
<div class="rcard-row"><p class="rcard-k">이기는 법</p><p class="rcard-v">${fmt(g.summary.goal)}</p></div>
<div class="rcard-row"><p class="rcard-k">내 차례</p><ol class="rcard-v turn">${g.summary.turn.map((t) => `<li>${fmt(t)}</li>`).join('')}</ol></div>
<div class="rcard-row"><p class="rcard-k">끝나는 때</p><p class="rcard-v">${fmt(g.summary.end)}</p></div>
</div>
<div class="row-btns">
<button type="button" class="btn btn-sub" data-speak>${icon('i-speaker')}소리 내 읽기</button>
<button type="button" class="btn btn-ghost" data-share>${icon('i-share')}링크 보내기</button>
</div>
</section>

<section class="panel" id="learn" role="tabpanel" aria-labelledby="tab-learn">
<h2 class="h2">${esc(name)} 하는 법: 따라하기</h2>
${comps}
${diagram}
<h3 class="h3">준비하기</h3>
<ol class="steps">${g.setup.map((s) => `<li>${fmt(s)}</li>`).join('')}</ol>
${examples}
${scoring}
</section>

<section class="panel" id="detail" role="tabpanel" aria-labelledby="tab-detail">
<h2 class="h2">${esc(name)} 자세한 규칙</h2>
${(g.rules || []).length > 1 ? `<label class="rule-find"><span class="sr">규칙에서 찾기</span>${icon('i-search')}<input type="search" placeholder="규칙에서 찾기 (예: 동점, 2명)" data-rule-find></label>` : ''}
<div class="rules">${rules}</div>
${(g.tricky || []).length ? `<h3 class="h3">헷갈리는 상황</h3>${qaList(g.tricky)}` : ''}
${(g.faq || []).length ? `<h3 class="h3">자주 묻는 질문</h3>${qaList(g.faq)}` : ''}
${variants}
${house}
</section>

<aside class="source">
<p><b>설명 기준</b> ${esc(g.edition || (g.kind === 'traditional' ? '널리 쓰이는 공통 규칙' : '한국어판'))}</p>
<p><b>만든 방법</b> ${esc(g.source || '직접 해 보고 우리 말로 다시 썼어요. 문장과 그림은 룰북에서 옮기지 않았어요.')}</p>
<p><button type="button" class="link-btn" data-report="${g.slug}">${icon('i-flag')}틀린 곳 알려 주기</button></p>
</aside>
</div>
${related}
<div class="cta-bar"><div class="wrap-narrow"><button type="button" class="btn btn-main btn-block" data-table>${icon('i-table')}테이블 모드로 시작</button></div></div>
<script type="application/json" id="game-data">${JSON.stringify({ ...g, _file: undefined }).replace(/</g, '\\u003c')}</script>
</article>`;

  const desc = `${name} 룰과 하는법을 단계별 그림과 1분 요약, 따라하기로 알려 드려요. ${playersText(g.players)}, ${minutesText(g.minutes)}, ${ageText(g.age)}. ${plain(g.oneLine)}`;
  return layout({
    title: `${name} 하는법, 룰 1분 요약 - ${cfg.siteName}`,
    description: desc,
    path: `/games/${g.slug}/`,
    body,
    scripts: ['table.js'],
    bodyClass: 'has-cta',
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'Game', name, alternateName: g.original || undefined,
        description: plain(g.intro || g.oneLine), url: abs(`/games/${g.slug}/`),
        numberOfPlayers: { '@type': 'QuantitativeValue', minValue: g.players[0], maxValue: g.players[1] >= 99 ? undefined : g.players[1] },
        typicalAgeRange: `${g.age}-`, inLanguage: 'ko',
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: abs('/') },
          { '@type': 'ListItem', position: 2, name: g.kind === 'traditional' ? '전통놀이' : '게임 찾기', item: abs(g.kind === 'traditional' ? '/traditional/' : '/games/') },
          { '@type': 'ListItem', position: 3, name, item: abs(`/games/${g.slug}/`) },
        ],
      },
    ],
  });
}

// ---------- 페이지: 홈 ----------
function homePage() {
  const popular = content.popular.map((s) => bySlug[s]);
  const trad = tradGames();
  const body = `<section class="hero">
<div class="wrap">
<div class="hero-grid">
<div class="hero-main">
<h1 class="hero-q">지금 몇 명이에요?</h1>
<p class="hero-lead">인원과 시간만 고르면 바로 할 수 있는 게임을 골라 드려요. 하는 법은 그림 몇 장만 넘겨 보면 감이 와요.</p>
<div class="picker" data-picker>
<div class="tokens" role="radiogroup" aria-label="인원">
${[2, 3, 4, 5, 6].map((n) => `<button type="button" class="token" role="radio" aria-checked="false" data-p="${n}">${n === 6 ? '6+' : n}</button>`).join('')}
</div>
<p class="picker-label" id="time-label">시간은요?</p>
<div class="chips" role="radiogroup" aria-labelledby="time-label">
${[[15, '15분'], [30, '30분'], [60, '1시간'], [0, '상관없어요']].map(([m, l]) => `<button type="button" class="chip" role="radio" aria-checked="${m === 0 ? 'true' : 'false'}" data-m="${m}">${l}</button>`).join('')}
</div>
</div>
<form class="search-box" action="/games/" role="search">
<label class="sr" for="home-q">게임 이름으로 찾기</label>
${icon('i-search')}<input id="home-q" name="q" type="search" placeholder="게임 이름이나 초성으로 찾기" autocomplete="off">
<button class="btn btn-main" type="submit">찾기</button>
</form>
</div>
<div class="hero-side">
<p class="deal-title" aria-live="polite" data-deal-title>요즘 많이 여는 게임</p>
<div class="deal" data-deal>${popular.slice(0, 6).map((g) => gameCard(g)).join('')}</div>
<a class="more-link" href="/games/" data-deal-more>게임 전체 보기</a>
</div>
</div>
</div>
</section>

<section class="band">
<div class="wrap">
<h2 class="sec-title">이런 자리라면</h2>
<div class="col-grid">
${content.collections.map((c) => `<a class="col-card" href="/collections/${c.slug}/">
<span class="col-name">${esc(c.title)}</span>
<span class="col-lead">${esc(c.lead)}</span>
<span class="col-tiles">${c.games.slice(0, 4).map((s) => tile(bySlug[s], 'tile-sm')).join('')}<span class="col-count">${c.games.length}개</span></span>
</a>`).join('')}
</div>
</div>
</section>

<section class="trad-band">
<div class="wrap trad-grid">
<div class="trad-art">${yutBoard()}</div>
<div>
<h2 class="sec-title">명절엔 전통놀이</h2>
<p class="sec-lead">윷놀이 빽도, 넣을까 말까? 집집마다 다른 규칙은 시작 전에 정해 두면 다툴 일이 없어요. 장기, 오목, 공기놀이, 투호까지 전통놀이 ${trad.length}가지를 같은 방식으로 정리했어요.</p>
<div class="trad-links">${trad.map((g) => `<a class="pill" href="/games/${g.slug}/">${esc(g.name)}</a>`).join('')}</div>
<a class="btn btn-main" href="/games/yutnori/#house">우리 집 윷놀이 규칙 정하기</a>
</div>
</div>
</section>

<section class="band band-white">
<div class="wrap">
<h2 class="sec-title">게임 전체</h2>
<p class="sec-lead">보드게임 ${games.filter((g) => g.kind === 'board').length}가지와 전통놀이 ${trad.length}가지가 있어요. 모든 게임을 ‘이기는 법, 내 차례, 끝나는 때’ 순서로 설명해요.</p>
<div class="gcards">${popular.map((g) => gameCard(g)).join('')}</div>
<p class="center"><a class="btn btn-sub" href="/games/">게임 ${games.length}개 모두 보기</a></p>
</div>
</section>

<section class="space-band">
<div class="wrap space-grid">
<div>
<h2 class="sec-title">손님이 게임을 꺼냈다가 그냥 넣어 두나요?</h2>
<p class="sec-lead">보드게임카페, 파티룸, 펜션처럼 게임을 두는 공간이라면 매장 QR을 만들어 보세요. 손님이 QR을 찍으면 우리 매장에 있는 게임과 하는 법이 바로 열려요. 설명해 줄 직원이 없어도 괜찮아요.</p>
<a class="btn btn-main" href="/space/">매장 QR 만들기</a>
</div>
<div class="space-art" aria-hidden="true">
<div class="qr-mock">${icon('i-qr')}</div>
<div class="qr-steps"><span>QR 찍기</span><span>게임 고르기</span><span>그림 보고 시작</span></div>
</div>
</div>
</section>`;
  return layout({
    title: cfg.siteTitle,
    description: cfg.description,
    path: '/',
    body,
    scripts: [],
    jsonld: { '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.siteName, url: abs('/'), inLanguage: 'ko', potentialAction: { '@type': 'SearchAction', target: abs('/games/?q={search_term_string}'), 'query-input': 'required name=search_term_string' } },
  });
}

// ---------- 페이지: 게임 찾기 ----------
function gamesPage() {
  const allTags = [...new Set(games.flatMap((g) => g.tags || []))].sort(collator.compare);
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title" id="search">게임 찾기</h1>
<p class="page-lead">모인 인원과 시간으로 거르거나, 이름으로 찾아보세요. 초성(예: ㄹㅁㅋㅂ)으로도 찾을 수 있어요.</p>
</div>
</section>
<section class="finder wrap" data-finder>
<form class="search-box" role="search" onsubmit="return false">
<label class="sr" for="find-q">게임 이름으로 찾기</label>
${icon('i-search')}<input id="find-q" type="search" name="q" placeholder="게임 이름이나 초성으로 찾기" autocomplete="off" data-q>
</form>
<div class="filters">
<div class="filter"><p class="filter-k" id="f-p">인원</p><div class="chips" role="radiogroup" aria-labelledby="f-p" data-f="p">
<button type="button" class="chip" role="radio" aria-checked="true" data-v="">전체</button>
${[2, 3, 4, 5, 6, 7].map((n) => `<button type="button" class="chip" role="radio" aria-checked="false" data-v="${n}">${n === 7 ? '7명 이상' : `${n}명`}</button>`).join('')}
</div></div>
<div class="filter"><p class="filter-k" id="f-m">시간</p><div class="chips" role="radiogroup" aria-labelledby="f-m" data-f="m">
<button type="button" class="chip" role="radio" aria-checked="true" data-v="">전체</button>
${[[15, '15분 안'], [30, '30분 안'], [60, '1시간 안']].map(([v, l]) => `<button type="button" class="chip" role="radio" aria-checked="false" data-v="${v}">${l}</button>`).join('')}
</div></div>
<div class="filter"><p class="filter-k" id="f-l">난이도</p><div class="chips" role="radiogroup" aria-labelledby="f-l" data-f="l">
<button type="button" class="chip" role="radio" aria-checked="true" data-v="">전체</button>
${[1, 2, 3].map((n) => `<button type="button" class="chip" role="radio" aria-checked="false" data-v="${n}">${die(n)}${LEVELS[n]}</button>`).join('')}
</div></div>
<div class="filter"><p class="filter-k" id="f-k">종류</p><div class="chips" role="radiogroup" aria-labelledby="f-k" data-f="k">
<button type="button" class="chip" role="radio" aria-checked="true" data-v="">전체</button>
<button type="button" class="chip" role="radio" aria-checked="false" data-v="board">보드게임</button>
<button type="button" class="chip" role="radio" aria-checked="false" data-v="traditional">전통놀이</button>
<button type="button" class="chip" role="radio" aria-checked="false" data-v="kids">아이와 함께</button>
</div></div>
<details class="filter-more"><summary>분위기로 고르기</summary>
<div class="chips chips-multi" data-f="t">${allTags.map((t) => `<button type="button" class="chip" aria-pressed="false" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
</details>
</div>
<div class="finder-bar"><p class="finder-count" aria-live="polite" data-count>게임 ${games.length}개</p><button type="button" class="link-btn" data-reset hidden>조건 지우기</button></div>
<div class="gcards" data-list>${sortedGames.map((g) => gameCard(g)).join('')}</div>
<div class="empty" data-empty hidden>
<p>조건에 맞는 게임이 아직 없어요.</p>
<p class="muted">인원이나 시간을 하나 풀어 보세요. 찾는 게임이 없다면 <button type="button" class="link-btn" data-report="">넣어 달라고 알려 주세요</button>.</p>
</div>
</section>`;
  return layout({
    title: `보드게임·전통놀이 찾기 | 인원·시간으로 고르기 - ${cfg.siteName}`,
    description: `인원, 시간, 난이도로 보드게임과 전통놀이를 골라 보세요. ${games.length}가지 게임의 하는 법을 1분 요약으로 알려 드려요.`,
    path: '/games/',
    body,
  });
}

// ---------- 페이지: 상황 묶음 ----------
function collectionPage(c) {
  const list = c.games.map((s) => bySlug[s]);
  const body = `<section class="page-head">
<div class="wrap">
<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">/</span><span>이런 자리라면</span></nav>
<h1 class="page-title">${esc(c.title)}</h1>
<p class="page-lead">${esc(c.lead)}</p>
${c.tip ? `<p class="tip">${fmt(c.tip)}</p>` : ''}
</div>
</section>
<section class="wrap list-sec">
<div class="gcards">${list.map((g) => gameCard(g)).join('')}</div>
<h2 class="h2 other-title">다른 자리라면</h2>
<div class="trad-links">${content.collections.filter((x) => x.slug !== c.slug).map((x) => `<a class="pill" href="/collections/${x.slug}/">${esc(x.title)}</a>`).join('')}</div>
</section>`;
  return layout({
    title: `${c.title} 보드게임 추천 ${list.length}가지 - ${cfg.siteName}`,
    description: `${c.lead} ${list.slice(0, 5).map((g) => g.name).join(', ')} 등 ${list.length}가지 게임의 하는 법을 1분 요약으로 알려 드려요.`,
    path: `/collections/${c.slug}/`,
    body,
  });
}

// ---------- 페이지: 전통놀이 ----------
function traditionalPage() {
  const trad = games.filter((g) => g.kind === 'traditional');
  const groupsT = [
    ['판에서 두는 놀이', ['yutnori', 'janggi', 'baduk', 'omok', 'umul-gonu']],
    ['손으로 하는 놀이', ['gonggi', 'chilgyo']],
    ['몸으로 하는 놀이', ['tuho', 'jegichagi', 'ttakji']],
  ];
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title">전통놀이 하는 법</h1>
<p class="page-lead">설과 추석에 3대가 함께 하기 좋은 전통놀이 ${trad.length}가지예요. 지역과 집안마다 규칙이 조금씩 달라서, 널리 쓰이는 공통 규칙을 먼저 쓰고 다른 방법은 ‘하우스룰’로 따로 표시했어요.</p>
</div>
</section>
<section class="wrap trad-page">
<div class="trad-feature">
<div class="trad-art">${yutBoard()}</div>
<div>
<h2 class="h2">윷놀이, 시작 전에 규칙부터 맞춰요</h2>
<p>빽도를 넣을지, 윷가락이 밖으로 나가면 어떻게 할지, 마지막에 칸 수를 딱 맞춰야 하는지. 명절마다 다툼이 생기는 지점이에요. ‘우리 집 규칙 정하기’에서 쓸 규칙을 고르면 규칙 카드를 만들어 가족 단톡방에 보낼 수 있어요.</p>
<div class="row-btns"><a class="btn btn-main" href="/games/yutnori/#house">우리 집 규칙 정하기</a><a class="btn btn-ghost" href="/games/yutnori/">윷놀이 하는 법</a></div>
</div>
</div>
${groupsT.map(([title, list]) => `<h2 class="h2">${title}</h2><div class="gcards">${list.filter((s) => bySlug[s]).map((s) => gameCard(bySlug[s])).join('')}</div>`).join('')}
<div class="tip-box">
<h2 class="h2">명절에 같이 하려면</h2>
<ul class="list">
<li>어르신과 아이가 같은 편이 되도록 편을 나누면 설명할 사람이 자연스럽게 생겨요.</li>
<li>윷이 없으면 테이블 모드의 ‘윷 던지기’를 쓰세요. 휴대폰이 윷 네 개를 대신 던져 줘요.</li>
<li>투호나 제기차기처럼 몸을 쓰는 놀이는 거리와 횟수를 나이에 맞게 줄여 주세요.</li>
</ul>
</div>
</section>`;
  return layout({
    title: `전통놀이 하는 법 - 윷놀이, 장기, 공기놀이, 투호 | ${cfg.siteName}`,
    description: `윷놀이, 장기, 바둑, 오목, 우물고누, 공기놀이, 칠교놀이, 투호, 제기차기, 딱지치기 하는 법을 쉽게 알려 드려요. 우리 집 윷놀이 규칙 카드도 만들 수 있어요.`,
    path: '/traditional/',
    body,
  });
}

// ---------- 페이지: 처음이라면 ----------
function learnPage() {
  const steps = [
    ['인원과 시간부터 정해요', '게임 이름보다 ‘몇 명이 몇 분 동안’이 먼저예요. 처음에는 15~30분짜리 쉬운 게임이 좋아요.'],
    ['그림 설명을 다 같이 넘겨 봐요', '게임 페이지 첫 화면에 단계별 그림이 있어요. 대여섯 장만 넘겨 보면 무엇을 하는 게임인지 감이 와요.'],
    ['설명하는 사람 한 명만 1분 요약을 읽어요', '모두가 각자 읽으면 오래 걸려요. 한 사람이 ‘이기는 법, 내 차례, 끝나는 때’만 소리 내 읽으면 충분해요.'],
    ['한 바퀴는 연습으로 돌아요', '첫 바퀴는 점수를 세지 말고 손을 맞춰 보세요. 막히는 곳은 그때 ‘헷갈리는 상황’을 열어 보면 돼요.'],
    ['막히면 테이블 모드에서 찾아요', '테이블 모드의 ‘이럴 땐?’ 버튼에 그 게임에서 자주 막히는 장면을 모아 두었어요.'],
    ['우리끼리 정한 규칙은 처음에 말해 둬요', '공식 규칙이 정하지 않은 부분은 시작 전에 합의하세요. 끝나고 따지면 서로 기분이 상해요.'],
  ];
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title">보드게임이 처음이라면</h1>
<p class="page-lead">규칙을 다 외우고 시작하는 사람은 거의 없어요. 하면서 배우면 돼요. 처음 모임을 이끄는 분을 위한 순서와, 설명에 자주 나오는 말을 풀어 두었어요.</p>
</div>
</section>
<section class="wrap-narrow learn">
<h2 class="h2">처음 모임, 이렇게 시작해요</h2>
<ol class="steps steps-big">${steps.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
<h2 class="h2">처음이라면 이 게임부터</h2>
<div class="gcards">${['halli-galli', 'dobble', 'just-one', 'rummikub', 'yutnori', 'the-mind'].filter((s) => bySlug[s]).map((s) => gameCard(bySlug[s])).join('')}</div>
<h2 class="h2" id="words">자주 나오는 말</h2>
<dl class="glossary">${glossary.map((x) => `<div><dt>${esc(x.term)}</dt><dd>${fmt(x.desc)}</dd></div>`).join('')}</dl>
</section>`;
  return layout({
    title: `보드게임이 처음이라면 - 시작하는 순서와 용어 풀이 | ${cfg.siteName}`,
    description: '보드게임 모임을 처음 이끄는 분을 위한 시작 순서와 차례, 라운드, 덱, 트릭, 하우스룰 같은 보드게임 용어를 쉽게 풀어 드려요.',
    path: '/learn/',
    body,
  });
}

// ---------- 페이지: 공간 운영자 ----------
function spacePage() {
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title">매장 QR 만들기</h1>
<p class="page-lead">보드게임카페, 파티룸, 게임파티룸, 펜션, 캠핑장처럼 게임을 두는 공간을 위한 기능이에요. 우리 매장에 있는 게임을 고르면 매장 전용 페이지와 QR이 바로 만들어져요. 가입도 비용도 필요 없어요.</p>
</div>
</section>
<section class="wrap space-page">
<ol class="steps steps-row">
<li><b>매장 정보 쓰기</b><span>이름과 문의 링크</span></li>
<li><b>게임 고르기</b><span>매장에 있는 게임만</span></li>
<li><b>QR 인쇄하기</b><span>테이블, 선반, 상자에</span></li>
</ol>
<div class="maker" data-maker>
<div class="maker-form">
<label class="field"><span>매장 이름</span><input name="n" maxlength="40" placeholder="예: 신촌 플레이션 2호점" required></label>
<label class="field"><span>손님에게 보여 줄 한마디 (선택)</span><input name="m" maxlength="80" placeholder="예: 게임은 선반 위 칸에 있어요. 다 쓰면 제자리에 놓아 주세요."></label>
<label class="field"><span>문의 링크 (선택)</span><input name="k" type="url" maxlength="200" placeholder="예: https://pf.kakao.com/..."></label>
<div class="field"><span>우리 매장에 있는 게임</span>
<div class="maker-search">${icon('i-search')}<input type="search" placeholder="게임 이름으로 찾기" data-maker-q></div>
<div class="maker-games" data-maker-games></div>
<p class="muted" data-maker-count>고른 게임 0개</p>
</div>
</div>
<div class="maker-out">
<div class="qr-card" data-qr-card>
<p class="qr-card-name" data-qr-name>매장 이름</p>
<div class="qr-box" data-qr-box><p class="muted">매장 이름을 쓰고 게임을 고르면 QR이 나와요.</p></div>
<p class="qr-card-hint">QR을 찍으면 우리 매장 게임과 하는 법이 열려요</p>
</div>
<div class="row-btns">
<button type="button" class="btn btn-main" data-act="open" disabled>매장 페이지 열기</button>
<button type="button" class="btn btn-sub" data-act="copy" disabled>${icon('i-copy')}링크 복사</button>
<button type="button" class="btn btn-sub" data-act="png" disabled>${icon('i-down')}QR 이미지 저장</button>
<button type="button" class="btn btn-ghost" data-act="print" disabled>${icon('i-print')}인쇄용 안내문</button>
</div>
<p class="muted small">매장 정보는 이 주소 안에만 담겨요. 서버에 저장하지 않아요. 게임을 바꾸면 QR도 새로 만들어 붙여 주세요.</p>
</div>
</div>
<div class="tip-box">
<h2 class="h2">QR은 이렇게 붙이면 잘 쓰여요</h2>
<ul class="list">
<li>테이블마다 매장 QR을 하나씩 붙이세요. 손님이 자리에 앉아 바로 게임을 고를 수 있어요.</li>
<li>설명이 길어지는 게임은 상자에 ‘게임별 QR’ 스티커를 붙이세요. 인쇄용 안내문 두 번째 장에 있어요.</li>
<li>무인 매장이라면 이용안내 문서에 매장 페이지 링크를 함께 넣어 예약 손님에게 미리 보내 주세요.</li>
</ul>
</div>
</section>`;
  return layout({
    title: `매장 QR 만들기 - 보드게임카페·파티룸용 게임 설명 | ${cfg.siteName}`,
    description: '매장에 있는 보드게임을 고르면 손님용 게임 설명 페이지와 QR을 바로 만들어 드려요. 보드게임카페, 파티룸, 펜션에서 무료로 쓰세요.',
    path: '/space/',
    body,
    scripts: ['vendor/qrcode.js', 'space.js'],
  });
}

function spaceViewPage() {
  const body = `<section class="venue" data-venue>
<div class="wrap">
<div class="venue-head">
<h1 class="page-title" data-v-name>우리 매장 게임</h1>
<p class="page-lead" data-v-msg></p>
<div class="row-btns" data-v-actions></div>
</div>
<div class="chips" role="radiogroup" aria-label="인원" data-v-filter>
<button type="button" class="chip" role="radio" aria-checked="true" data-v="">전체</button>
${[2, 3, 4, 5, 6].map((n) => `<button type="button" class="chip" role="radio" aria-checked="false" data-v="${n}">${n === 6 ? '6명 이상' : `${n}명`}</button>`).join('')}
</div>
<div class="gcards" data-v-list></div>
<p class="muted" data-v-empty hidden>이 매장 주소에 담긴 게임이 없어요. 매장에 문의해 주세요.</p>
</div>
</section>`;
  return layout({
    title: `우리 매장 게임 - ${cfg.siteName}`,
    description: '이 매장에 있는 보드게임과 하는 법을 모아 보여 드려요.',
    path: '/space/view/',
    body,
    noindex: true,
    scripts: ['space.js'],
  });
}

function venuePage(v) {
  const list = (v.games || []).map((s) => bySlug[s]);
  const body = `<section class="venue">
<div class="wrap">
<div class="venue-head">
<h1 class="page-title">${esc(v.name)}</h1>
${v.message ? `<p class="page-lead">${esc(v.message)}</p>` : ''}
${v.contact && /^(https?:|tel:)/.test(v.contact) ? `<div class="row-btns"><a class="btn btn-sub" href="${esc(v.contact)}" rel="noopener">매장에 문의하기</a></div>` : ''}
</div>
<div class="gcards">${list.map((g) => gameCard(g, `?v=${encodeURIComponent(v.slug)}`)).join('')}</div>
</div>
</section>`;
  return layout({ title: `${v.name} 보드게임 - ${cfg.siteName}`, description: `${v.name}에 있는 보드게임 ${list.length}가지의 하는 법`, path: `/space/${v.slug}/`, body, noindex: true });
}

// ---------- 페이지: 소개, 관리자, 404, 오프라인 ----------
function aboutPage() {
  const principles = [
    '설명은 ‘어떻게 이기나’와 ‘내 차례에 뭘 하나’부터 시작해요.',
    '모든 게임을 같은 틀로 써요. 한 게임을 익히면 다른 게임도 같은 자리에서 찾을 수 있어요.',
    '휴대폰을 테이블 위에 두고 보는 화면을 기준으로 만들어요.',
    '룰북 문장을 옮기지 않아요. 직접 해 보고 우리 말로 다시 써요.',
    '규칙 화면에는 광고를 넣지 않아요.',
    '모르는 것은 모른다고 써요. 공식 규칙이 정하지 않은 부분은 ‘하우스룰’로 따로 표시해요.',
  ];
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title">${esc(cfg.siteName)}은 이렇게 만들어요</h1>
<p class="page-lead">${esc(cfg.siteName)}은 처음 하는 사람도 3분 안에 첫 판을 시작하게 돕는 보드게임 설명 서비스예요. 게임을 고르고, 그림과 1분 요약으로 배우고, 하다가 막히면 그 자리에서 찾을 수 있게 만들었어요.</p>
</div>
</section>
<section class="wrap-narrow about">
<h2 class="h2">여섯 가지 원칙</h2>
<ol class="steps">${principles.map((x) => `<li>${x}</li>`).join('')}</ol>
<h2 class="h2">검수 표시 읽는 법</h2>
<ul class="list">
<li><b>검수 완료</b>: 그 게임을 잘 아는 사람이 규칙을 확인했다는 뜻이에요. 확인한 날짜를 함께 적어요.</li>
<li><b>검수 중</b>: 직접 해 보고 쓴 설명이지만 아직 다른 사람의 확인을 거치지 않았어요. 상자 속 룰북과 다르면 룰북을 따르고, 저희에게 알려 주세요.</li>
<li><b>하우스룰</b>: 공식 규칙은 아니지만 많이 쓰는 방법이에요. 시작 전에 쓸지 말지 정하세요.</li>
</ul>
<h2 class="h2">출판사와 제작사께</h2>
<p>${esc(cfg.siteName)}의 설명은 게임을 하는 방법을 우리 말과 우리 구성으로 다시 쓴 것이에요. 룰북 문장, 그림, 상자 이미지는 쓰지 않아요. 공식 설명을 함께 만들거나 고칠 곳이 있다면 알려 주세요. 삭제를 요청하시면 바로 내리고 협의할게요.</p>
<div class="row-btns"><button type="button" class="btn btn-sub" data-report="">의견 보내기</button>${cfg.contactEmail ? `<a class="btn btn-ghost" href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : ''}</div>
</section>`;
  return layout({ title: `${cfg.siteName} 소개 - 설명을 만드는 원칙 | ${cfg.siteName}`, description: `${cfg.siteName}이 보드게임 설명을 만드는 원칙과 검수 표시, 출판사 문의 방법을 알려 드려요.`, path: '/about/', body });
}

function adminPage() {
  const body = `<section class="admin wrap" data-admin data-repo="${esc(cfg.githubRepo || '')}" data-branch="${esc(cfg.githubBranch || 'main')}">
<h1 class="page-title">운영 관리</h1>
<div class="admin-login" data-login>
<p class="muted">Cloudflare에 넣어 둔 관리자 비밀번호(ADMIN_PASSWORD)를 입력하세요.</p>
<form class="admin-form" data-login-form>
<label class="field"><span>관리자 비밀번호</span><input type="password" name="pw" autocomplete="current-password" required></label>
<button class="btn btn-main" type="submit">들어가기</button>
<p class="form-msg" role="status" aria-live="polite"></p>
</form>
</div>
<div class="admin-body" data-body hidden>
<div class="tabs" role="tablist" aria-label="관리 메뉴">
<button role="tab" aria-selected="true" aria-controls="a-reports" id="t-reports">신고함</button>
<button role="tab" aria-selected="false" aria-controls="a-stats" id="t-stats">이용 기록</button>
<button role="tab" aria-selected="false" aria-controls="a-content" id="t-content">원고 관리</button>
</div>
<div class="panel" id="a-reports" role="tabpanel" aria-labelledby="t-reports"></div>
<div class="panel" id="a-stats" role="tabpanel" aria-labelledby="t-stats"></div>
<div class="panel" id="a-content" role="tabpanel" aria-labelledby="t-content"></div>
</div>
</section>`;
  return layout({ title: `운영 관리 - ${cfg.siteName}`, description: '운영 관리 화면', path: '/admin/', body, noindex: true, scripts: ['admin.js'] });
}

function notFoundPage() {
  const body = `<section class="page-head"><div class="wrap">
<h1 class="page-title">찾는 페이지가 없어요</h1>
<p class="page-lead">주소가 바뀌었거나 아직 만들지 않은 게임일 수 있어요. 게임 이름으로 다시 찾아보세요.</p>
<form class="search-box" action="/games/" role="search"><label class="sr" for="nf-q">게임 이름으로 찾기</label>${icon('i-search')}<input id="nf-q" name="q" type="search" placeholder="게임 이름이나 초성으로 찾기"><button class="btn btn-main" type="submit">찾기</button></form>
<p class="center"><a class="btn btn-sub" href="/">처음 화면으로</a></p>
</div></section>`;
  return layout({ title: `페이지를 찾을 수 없어요 - ${cfg.siteName}`, description: '찾는 페이지가 없어요.', path: '/404', body, noindex: true });
}

function offlinePage() {
  const body = `<section class="page-head"><div class="wrap">
<h1 class="page-title">인터넷에 연결되어 있지 않아요</h1>
<p class="page-lead">한 번 열어 본 게임 페이지는 연결이 없어도 볼 수 있어요. 연결되면 다시 시도해 주세요.</p>
<p class="center"><a class="btn btn-sub" href="/">처음 화면으로</a></p>
</div></section>`;
  return layout({ title: `연결 없음 - ${cfg.siteName}`, description: '인터넷 연결이 없어요.', path: '/offline.html', body, noindex: true });
}

// ---------- 쓰기 ----------
function write(rel, data) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

copyDir(path.join(STATIC, 'css'), path.join(OUT, 'assets', 'css'));
copyDir(path.join(STATIC, 'js'), path.join(OUT, 'assets', 'js'));
copyDir(path.join(STATIC, 'img'), path.join(OUT, 'assets', 'img'));

write('index.html', homePage());
write('games/index.html', gamesPage());
for (const g of games) write(`games/${g.slug}/index.html`, gamePage(g));
for (const c of content.collections) write(`collections/${c.slug}/index.html`, collectionPage(c));
write('traditional/index.html', traditionalPage());
write('learn/index.html', learnPage());
write('space/index.html', spacePage());
write('space/view/index.html', spaceViewPage());
for (const v of venues) write(`space/${v.slug}/index.html`, venuePage(v));
write('about/index.html', aboutPage());
write('admin/index.html', adminPage());
write('404.html', notFoundPage());
write('offline.html', offlinePage());

// 화면에서 쓰는 게임 목록
const compact = sortedGames.map((g) => ({
  s: g.slug, c: g.code, n: g.name, o: g.original || '', a: g.aliases || [], k: g.kind, g: g.group,
  p: g.players, m: g.minutes, age: g.age, l: g.level, t: g.tags || [], one: g.oneLine, b: g.best || '',
  st: g.status || 'draft', ck: g.checked || null,
  done: ['components', 'setup', 'examples', 'rules', 'tricky', 'faq'].filter((k) => (g[k] || []).length).length,
}));
write('data/games.json', JSON.stringify({ build: BUILD, games: compact, popular: content.popular }));

write('manifest.webmanifest', JSON.stringify({
  name: cfg.tagline ? `${cfg.siteName} | ${cfg.tagline}` : cfg.siteName,
  short_name: cfg.siteName,
  description: cfg.description,
  lang: 'ko',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#ffffff',
  icons: [
    { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/assets/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

write('sw.js', fs.readFileSync(path.join(STATIC, 'sw.js'), 'utf8').replace(/__BUILD__/g, BUILD));
write('_headers', fs.readFileSync(path.join(STATIC, '_headers'), 'utf8'));

const today = new Date().toISOString().slice(0, 10);
const urls = ['/', '/games/', '/traditional/', '/learn/', '/space/', '/about/',
  ...games.map((g) => `/games/${g.slug}/`),
  ...content.collections.map((c) => `/collections/${c.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${abs(u)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /space/view/

Sitemap: ${abs('/sitemap.xml')}
`);

console.log(`완료: 게임 ${games.length}개, 묶음 ${content.collections.length}개, 페이지 ${urls.length + 6 + venues.length}개를 public/에 만들었어요. (빌드 ${BUILD})`);
