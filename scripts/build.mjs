// 룰룰 사이트 빌드 스크립트
// content/ 폴더의 원고(JSON)를 읽어 public/ 폴더에 정적 페이지를 만듭니다.
// 실행: npm run build  (Cloudflare Pages 빌드 명령도 같습니다)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISUALS, frameSVG } from '../src/visual/index.mjs';
import { LEVELS as GROW_LEVELS, RULES as GROW_RULES, BADGES as GROW_BADGES, levelOf, glyph, emblemSVG, badgeSVG } from '../server/growth-data.js';

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
const SEO = readJSON('content/seo.json');
const SHOP = readJSON('content/shop.json');
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
for (const g of games) {
  if (!SEO[g.slug] || !Array.isArray(SEO[g.slug].hooks) || !SEO[g.slug].hooks.length) problems.push(`seo.json: ${g.slug}의 hooks(핵심 주제)가 없어요`);
}
for (const [slug, ids] of Object.entries(SHOP.games)) {
  if (!slugs.has(slug)) problems.push(`shop.json: games에 없는 게임이 있어요 (${slug})`);
  for (const id of ids) if (!SHOP.items[id]) problems.push(`shop.json: ${slug}의 상품 ${id}가 items에 없어요`);
}
for (const sh of SHOP.shelves) for (const id of sh.items) if (!SHOP.items[id]) problems.push(`shop.json: 진열대 ${sh.slug}의 상품 ${id}가 items에 없어요`);
for (const [id, it] of Object.entries(SHOP.items)) {
  if (!/^[a-z0-9-]{1,60}$/.test(id)) problems.push(`shop.json: 상품 id는 영문 소문자, 숫자, 하이픈만 써요 (${id})`);
  if (!it.name || !it.q) problems.push(`shop.json: ${id}에 name과 q(쿠팡 검색어)가 필요해요`);
  if (it.url && !/^https:\/\/(link\.coupang\.com|coupa\.ng|www\.coupang\.com)\//.test(it.url)) problems.push(`shop.json: ${id}의 url은 쿠팡 주소여야 해요`);
}
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
const TRAD_ORDER = ['yutnori', 'janggi', 'baduk', 'omok', 'umul-gonu', 'gonggi', 'chilgyo', 'tuho', 'jegichagi', 'ttakji', 'sabangchigi', 'biseokchigi', 'paengichigi', 'ttangttameokgi'];
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
<symbol id="i-cart" viewBox="0 0 24 24"><path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 21c.6-4.2 3.6-7 7.5-7s6.9 2.8 7.5 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.8" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
<symbol id="i-cal" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-bookmark" viewBox="0 0 24 24"><path d="M6.5 3.5h11v17L12 16.5l-5.5 4z" fill="var(--fill, none)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6-4.4-4.1 6-.8z" fill="currentColor"/></symbol>
<symbol id="i-star-o" viewBox="0 0 24 24"><path d="m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6-4.4-4.1 6-.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5zM10 20.5a2.2 2.2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9H14.5v-5.5h-5V20H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-trophy" viewBox="0 0 24 24"><path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0zM7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17m-4 3.5h8M9.5 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></symbol>
<symbol id="i-thumb" viewBox="0 0 24 24"><path d="M7.5 10.5v9H4v-9zM7.5 10.5 11 4c1.6 0 2.5 1 2.2 2.6L12.6 9.5h5.2a2 2 0 0 1 2 2.4l-1.3 6a2 2 0 0 1-2 1.6H7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-dice" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></symbol>
<symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5zM12 6v13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></symbol>
<symbol id="i-poll" viewBox="0 0 24 24"><path d="M5 20V12M10 20V5M15 20v-6M20 20V9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</defs></svg>`;

const icon = (id, cls = '') => `<svg class="ico ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

const PIPS = { 1: [[12, 12]], 2: [[8, 8], [16, 16]], 3: [[7.5, 7.5], [12, 12], [16.5, 16.5]] };
const die = (level, cls = '') => `<svg class="die ${cls}" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>${PIPS[level].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="currentColor"/>`).join('')}</svg>`;

// 로고 옆과 큰 제목 끝에 붙는 짧은 세 줄 (무드보드의 반짝 표시)
const SPARK = '<svg class="spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9.5 2.5 6M11 7V2.5M17 9.5l2.5-3.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';
const BRAND = '';

const tile = (g, cls = '') => `<div class="tile ${cls}" data-g="${g.group}" aria-hidden="true"><span>${esc(firstSyllable(g.name))}</span></div>`;

// ---------- 브랜드 그림 (src/static/img/brand) ----------
const BRAND_IMG = {
  'char-dice': [520, 422], 'char-pawn': [453, 560], 'char-card': [520, 498], 'char-book': [513, 560], 'char-tick': [440, 560], 'char-domi': [520, 534], 'char-fox': [205, 560], 'char-cat': [292, 560],
  'dice-hello': [520, 446], 'dice-explain': [520, 473], 'dice-ok': [495, 560], 'dice-think': [356, 560], 'pawn-map': [285, 560], 'card-recommend': [500, 560], 'book-open': [417, 560], 'book-warn': [432, 560], 'tick-wait': [428, 560], 'domi-order': [332, 560], 'fox-explain': [225, 560], 'fox-search': [214, 560], 'cat-hello': [244, 560],
  'hero-main': [1200, 600], 'hero-search': [1200, 600], 'scene-phone': [1200, 675], 'scene-variety': [960, 720],
  'ico-find': [640, 640], 'ico-players': [640, 640], 'ico-quick': [640, 640], 'ico-first': [640, 640], 'ico-setup': [640, 640], 'ico-turn': [640, 640], 'ico-help': [640, 640], 'ico-joy': [640, 640],
  'hero-pop': [1100, 831], 'cat-cards': [320, 310], 'cat-dominoes': [320, 310], 'cat-pawns': [320, 271], 'cat-tangram': [320, 311], 'cat-blocks': [320, 290], 'cat-rulebook': [320, 237],
  'dice-search': [520, 407], 'pawn-book': [520, 294],
  'scene-friends': [960, 720], 'scene-family': [960, 720], 'scene-two': [960, 720], 'scene-store': [960, 720], 'scene-first-meet': [960, 720], 'scene-strategy': [800, 800], 'scene-coop': [960, 720], 'scene-shelf': [960, 720], 'scene-workshop': [960, 720], 'scene-picnic': [960, 720], 'scene-generations': [960, 720],
};
const pic = (name, alt = '', cls = '', eager = false) => {
  const d = BRAND_IMG[name];
  if (!d) throw new Error(`브랜드 그림이 없어요: ${name}`);
  return `<img${cls ? ` class="${cls}"` : ''} src="/assets/img/brand/${name}.webp" width="${d[0]}" height="${d[1]}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
};
// 룰룰 친구들: [그림, 이름, 맡은 일, 한 줄 소개, 바로 가기]
const CREW = [
  ['char-dice', '다이스', '진행 가이드', '차례와 순서를 챙겨요', '/learn/'],
  ['char-card', '카드', '게임 추천가', '인원과 시간에 맞는 게임을 골라요', '/games/'],
  ['char-book', '북', '규칙 설명가', '헷갈리는 규칙을 찾아 줘요', '/learn/#words'],
  ['char-domi', '도미', '순서 안내가', '준비부터 끝까지 순서대로', '/games/halli-galli/#learn'],
  ['char-tick', '틱', '시간 도우미', '15분이면 되는 게임을 알아요', '/collections/quick/'],
  ['char-pawn', '폰', '전략 파트너', '한 판 제대로 붙을 때', '/collections/strategy-night/'],
  ['char-fox', '폭스', '전략 큐레이터', '둘이서 하기 좋은 게임', '/collections/two-players/'],
  ['char-cat', '캣', '모임 호스트', '여럿이 모인 자리를 띄워요', '/collections/party-room/'],
];
const COL_ART = { 'two-players': 'scene-two', 'first-meeting': 'scene-first-meet', 'with-kids': 'scene-family', holiday: 'scene-generations', 'big-group': 'scene-friends', 'party-room': 'scene-workshop', quick: 'ico-quick', 'strategy-night': 'scene-strategy' };
const guide = (name, who, text) => `<div class="guide">${pic(name, '', 'guide-pic')}<p><b>${who}</b> ${text}</p></div>`;

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
    ? `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="#233552" stroke-width="3"/>`
    : `<circle cx="${x}" cy="${y}" r="7" fill="#233552"/>`).join('');
  return `<svg class="diagram" viewBox="0 0 ${S} ${S + 34}" role="img" aria-label="윷판 그림. 바깥 네모 둘레에 20칸, 두 대각선에 9칸, 모두 29칸입니다. 오른쪽 아래가 출발점이고 반시계 방향으로 돕니다.">
<rect x="${P}" y="${P}" width="${S - 2 * P}" height="${S - 2 * P}" fill="none" stroke="#C9CDD6" stroke-width="3"/>
<path d="M${P} ${P}L${S - P} ${S - P}M${S - P} ${P}L${P} ${S - P}" stroke="#C9CDD6" stroke-width="3"/>
${dots}
<circle cx="${S - P}" cy="${S - P}" r="11" fill="#F05B48" stroke="#233552" stroke-width="3"/>
<path d="M${S - 8} ${S - P - 40}v-50m0 0-7 10m7-10 7 10" fill="none" stroke="#F05B48" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<text x="${S - P}" y="${S + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="#F05B48">출발</text>
<text x="${c}" y="${c - 20}" text-anchor="middle" font-size="14" font-weight="700" fill="#5F6675">방</text>
</svg>`;
}

function umulGonuBoard() {
  return `<svg class="diagram" viewBox="0 0 300 345" role="img" aria-label="우물고누 판 그림. 네모의 네 꼭짓점과 가운데 한 점, 모두 다섯 점이 있고 아래쪽 변은 우물로 막혀 있습니다. 왼쪽 두 점에 검은 말, 오른쪽 두 점에 흰 말을 놓습니다.">
<path d="M40 40H260M40 40V260M260 40V260M40 40L260 260M260 40L40 260" stroke="#C9CDD6" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="150" cy="268" rx="38" ry="16" fill="#E8F0FB" stroke="#7FA3D6" stroke-width="3"/>
<text x="150" y="334" text-anchor="middle" font-size="15" font-weight="700" fill="#4C79B8">우물 (지나갈 수 없어요)</text>
<circle cx="150" cy="150" r="10" fill="#fff" stroke="#233552" stroke-width="3"/>
<circle cx="40" cy="40" r="17" fill="#233552"/><circle cx="40" cy="260" r="17" fill="#233552"/>
<circle cx="260" cy="40" r="17" fill="#fff" stroke="#233552" stroke-width="3"/><circle cx="260" cy="260" r="17" fill="#fff" stroke="#233552" stroke-width="3"/>
<circle cx="40" cy="260" r="25" fill="none" stroke="#F05B48" stroke-width="3" stroke-dasharray="5 5"/>
<text x="14" y="306" font-size="14" font-weight="700" fill="#F05B48">첫 수에 움직이지 않는 말</text>
</svg>`;
}

function chilgyoBoard() {
  const u = 70, o = 10;
  const p = (pts) => pts.map(([x, y]) => `${o + x * u},${o + y * u}`).join(' ');
  const pieces = [
    { pts: [[0, 0], [4, 0], [2, 2]], fill: '#F05B48', name: '큰 삼각형' },
    { pts: [[0, 0], [2, 2], [0, 4]], fill: '#F08A6A', name: '큰 삼각형' },
    { pts: [[2, 4], [4, 2], [4, 4]], fill: '#233552', name: '중간 삼각형' },
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
  ['/rules/', '룰 모음'],
  ['/traditional/', '전통놀이'],
  ['/shop/', '보드게임몰'],
  ['/community/', '커뮤니티'],
  ['/space/', '공간 운영자'],
];

function header(current) {
  return `<header class="site-head">
<div class="wrap head-row">
<a class="brand" href="/" aria-label="${esc(cfg.siteName)} 처음 화면"><span>${esc(cfg.siteName)}</span>${SPARK}${cfg.tagline ? `<small class="brand-tag">${esc(cfg.tagline)}</small>` : ''}</a>
<nav class="nav" id="site-nav" aria-label="주요 메뉴">
${NAV.map(([href, label]) => `<a href="${href}"${current.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`).join('\n')}
</nav>
<a class="icon-btn" href="/games/#search" aria-label="게임 찾기">${icon('i-search')}</a>
<a class="icon-btn head-saved" href="/saved/" aria-label="저장한 게임">${icon('i-bookmark')}</a>
<a class="icon-btn acct-btn" href="/account/" data-acct aria-label="로그인"><span class="acct-ico" data-acct-ico>${icon('i-user')}</span><span class="acct-nick" data-acct-nick></span><span class="dot" data-unread hidden></span></a>
<button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="메뉴 열기">${icon('i-menu')}</button>
</div>
</header>`;
}

// 휴대폰 아래 탭
const TABS = [['/', '홈', 'i-home'], ['/games/', '게임 찾기', 'i-search'], ['/community/', '커뮤니티', 'i-chat'], ['/saved/', '저장', 'i-bookmark'], ['/account/', '내 정보', 'i-user']];
function tabbar(current) {
  const on = (h) => (h === '/' ? current === '/' : current.startsWith(h) || (h === '/games/' && current.startsWith('/collections/')));
  return `<nav class="tabbar" aria-label="아래 메뉴">${TABS.map(([h, l, ic]) => `<a href="${h}"${on(h) ? ' aria-current="page"' : ''}${h === '/account/' ? ' data-tab-acct' : ''}>${icon(ic)}<span>${l}</span>${h === '/account/' ? '<i class="dot" data-unread hidden></i>' : ''}</a>`).join('')}</nav>`;
}

function footer() {
  return `<footer class="site-foot">
<div class="wrap foot-grid">
<div>
<a class="brand brand-foot" href="/"><span>${esc(cfg.siteName)}</span>${SPARK}</a>${cfg.tagline ? `<p class="foot-tag">${esc(cfg.tagline)}</p>` : ''}
<p class="foot-lead">보드게임과 전통놀이, 처음 하는 사람도 3분 안에 시작할 수 있게 설명해요.</p>
</div>
<nav class="foot-nav" aria-label="바닥 메뉴">
<a href="/games/">게임 찾기</a>
<a href="/rules/">보드게임 룰 모음</a>
<a href="/traditional/">전통놀이</a>
<a href="/learn/">처음이라면</a>
<a href="/shop/">보드게임몰</a>
<a href="/community/">커뮤니티</a>
<a href="/space/">공간 운영자</a>
<a href="/about/">${esc(cfg.siteName)} 소개</a>
<a href="/contact/">제휴·문의</a>
<button type="button" class="link-btn" data-report="">틀린 곳 알려 주기</button>
</nav>
<nav class="foot-legal" aria-label="약관과 정책">
<a href="/terms/">이용약관</a>
<a href="/privacy/"><b>개인정보처리방침</b></a>
<a href="/community/rules/">커뮤니티 이용 규칙</a>
</nav>
<p class="foot-note">게임 이름과 상표는 각 권리자의 것이에요. ${esc(cfg.siteName)}의 설명은 규칙을 우리 말로 다시 쓴 것이며, 상자 속 공식 룰북을 대신하지 않아요.</p>
<p class="foot-note">${esc(cfg.siteName)} 보드게임몰과 게임 페이지의 구매 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
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

function layout({ title, description, path: p, body, scripts = [], noindex = false, jsonld = null, bodyClass = '', keywords = [], ogImage = '', ogType = 'website' }) {
  const url = abs(p);
  const ld = jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords.length ? `<meta name="keywords" content="${esc(keywords.join(', '))}">` : ''}
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="ko_KR">
<meta property="og:site_name" content="${esc(cfg.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs(ogImage || '/assets/img/og.png')}">
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
<link rel="alternate" type="application/rss+xml" title="${esc(cfg.siteName)} 보드게임 하는법" href="/rss.xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
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
${tabbar(p)}
${reportDialog()}
<script src="/assets/js/app.js?v=${BUILD}" defer></script>
<script src="/assets/js/growth.js?v=${BUILD}" defer></script>
<script src="/assets/js/social.js?v=${BUILD}" defer></script>
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

// ---------- 검색어와 조사 ----------
// 받침이 있으면 a, 없으면 b (예: 루미큐브 + 은/는 → 루미큐브는)
const josa = (word, a, b) => {
  const ch = String(word).replace(/[^가-힣A-Za-z0-9]+$/, '').slice(-1);
  if (/[가-힣]/.test(ch)) return word + ((ch.charCodeAt(0) - 0xac00) % 28 ? a : b);
  if (/[0-9]/.test(ch)) return word + ('013678'.includes(ch) ? a : b);
  return word + (/[lmnr]$/i.test(ch) ? a : b);
};
const bare = (name) => name.replace(/[!?]+$/, '');
const GENERIC_ALIAS = /게임$|놀이$|^[a-z ]+$/i;
const seoOf = (g) => {
  const s = SEO[g.slug] || { hooks: [], kw: [] };
  const n = bare(g.name);
  const alt = (g.aliases || []).filter((a) => a !== g.name && !a.includes(' 두는 법'));
  const main = g.kind === 'traditional' && !/놀이|치기|차기|먹기/.test(n)
    ? [`${n} 하는법`, `${n} 규칙`, `${n} 두는 법`, `${n} 방법`]
    : [`${n} 하는법`, `${n} 룰`, `${n} 규칙`, `${n} 게임방법`];
  const altKw = alt.filter((a) => !GENERIC_ALIAS.test(a)).slice(0, 2).map((a) => `${a} 하는법`);
  const kw = [...new Set([...main, ...s.kw, ...altKw])];
  return { hooks: s.hooks, kw, alt, n };
};

function gameFaq(g) {
  const n = bare(g.name);
  const list = [
    { q: `${josa(n, '은', '는')} 몇 명이서 하나요?`, a: `${josa(playersText(g.players), '이', '가')} 할 수 있어요.${g.best ? ` 가장 재미있는 인원은 ${josa(g.best, '이에요', '예요')}.` : ''}` },
    { q: `${n} 한 판은 얼마나 걸리나요?`, a: `한 판에 ${minutesText(g.minutes)}쯤 걸려요. 처음 하는 사람이 있으면 설명까지 10분쯤 더 잡아 두세요.` },
    { q: `${josa(n, '은', '는')} 몇 살부터 할 수 있나요?`, a: `${ageText(g.age)}면 할 수 있어요. 난이도는 ${josa(LEVELS[g.level], '이에요', '예요')}.` },
    { q: `${josa(n, '은', '는')} 어떻게 하면 이기나요?`, a: plain(g.summary.goal) },
    { q: `${josa(n, '은', '는')} 언제 끝나나요?`, a: plain(g.summary.end) },
    ...(g.faq || []).map((x) => ({ q: plain(x.q), a: plain(x.a) })),
  ];
  return list;
}

const SHOP_KIND = { game: '본판', edition: '다른 판', expansion: '확장', goods: '용품', set: '세트' };
const goHref = (id, from) => `/go/${id}${from ? `?from=${from}` : ''}`;
const buyLink = (id, from, label = '쿠팡에서 보기', cls = 'btn btn-buy') => `<a class="${cls}" href="${goHref(id, from)}" rel="sponsored nofollow noopener" target="_blank" data-buy="${id}">${label}</a>`;
const shopItemsOf = (g) => {
  const ids = [...(SHOP.games[g.slug] || [])];
  const extra = g.kind === 'traditional' ? SHOP.extras.traditional : g.group === 'family' && g.age <= 6 ? SHOP.extras.kids : g.group === 'party' ? [...SHOP.extras.party, ...SHOP.extras.board] : SHOP.extras.board;
  for (const id of extra || []) if (!ids.includes(id) && ids.length < 4) ids.push(id);
  return ids;
};
function buyBox(g) {
  const ids = shopItemsOf(g);
  if (!ids.length) return '';
  const n = bare(g.name);
  return `<section class="buy" id="buy" aria-labelledby="buy-title">
<p class="ad-note"><span class="ad-tag">광고</span>이 상자의 구매 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
<h2 class="h2" id="buy-title">${esc(n)} 구매하기</h2>
<p class="muted small">판매처의 가격과 구성은 수시로 바뀌어요. 상자 속 구성물이 이 설명과 같은지 상품 페이지에서 한 번 더 확인하세요.</p>
<ul class="buy-list">
${ids.map((id) => { const it = SHOP.items[id]; return `<li class="buy-item"><span class="buy-kind">${SHOP_KIND[it.kind] || '상품'}</span><span class="buy-text"><b>${esc(it.name)}</b><small>${esc(it.note || '')}</small></span>${buyLink(id, g.slug)}</li>`; }).join('\n')}
</ul>
<p class="buy-more"><a href="/shop/">${icon('i-cart')}룰룰 보드게임몰에서 더 보기</a></p>
</section>`;
}

// ---------- 페이지: 게임 ----------
function gamePage(g) {
  const name = g.name;
  const seo = seoOf(g);
  const hasBuy = shopItemsOf(g).length > 0;
  const faqItems = gameFaq(g);
  const statusNote = g.status === 'checked'
    ? `<p class="status status-ok">${icon('i-check')}<span>검수 완료${g.checked && g.checked.date ? ` (${esc(g.checked.date)}${g.checked.by ? `, ${esc(g.checked.by)}` : ''})` : ''}. 그래도 다른 곳이 보이면 알려 주세요.</span></p>`
    : g.status === 'reviewed'
      ? `<p class="status status-rev">${icon('i-check')}<span>자료 대조 완료${g.reviewed && g.reviewed.date ? ` (${esc(g.reviewed.date)})` : ''}. ${g.kind === 'traditional' ? '백과사전에 실린 방법과' : '아래 ‘맞춰 본 자료’와'} 하나씩 견줘 봤어요. 다른 곳이 보이면 알려 주세요.</span><button type="button" class="link-btn" data-report="${g.slug}">틀린 곳 알려 주기</button></p>`
      : `<p class="status status-draft"><span>아직 검수 중인 설명이에요. 상자 속 룰북과 다른 곳이 보이면 알려 주세요.</span><button type="button" class="link-btn" data-report="${g.slug}">틀린 곳 알려 주기</button></p>`;
  const refs = (g.refs || []).length ? `<p><b>맞춰 본 자료</b> ${g.refs.map((r) => (r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener nofollow">${esc(r.title)}</a>` : esc(r.title))).join(', ')}</p>` : '';

  const comps = g.components.length ? `<h3 class="h3">구성물 확인</h3>
<ul class="checklist" data-store="comp-${g.slug}">${g.components.map((c, i) => `<li><label><input type="checkbox" data-i="${i}"><span>${fmt(c)}</span></label></li>`).join('')}</ul>` : '';

  const examples = (g.examples || []).length ? `<h3 class="h3">따라 해 보기</h3>
<div class="examples">${g.examples.map((e) => `<div class="example"><p class="example-t">${fmt(e.title)}</p><p>${fmt(e.text)}</p></div>`).join('')}</div>` : '';

  const scoring = (g.scoring || []).length ? `<h3 class="h3">끝내기와 점수</h3><ul class="list">${g.scoring.map((s) => `<li>${fmt(s)}</li>`).join('')}</ul>` : '';

  const diagram = g.diagram && DIAGRAMS[g.diagram] ? `<figure class="figure">${DIAGRAMS[g.diagram]()}${g.diagramCaption ? `<figcaption>${fmt(g.diagramCaption)}</figcaption>` : ''}</figure>` : '';

  const vis = visualsOf(g);
  const visPanel = vis.length ? `<section class="panel" id="visual" role="tabpanel" aria-labelledby="tab-visual">
<div class="vis" data-vis>
<div class="vis-top"><h2 class="h2">${esc(seo.n)} 하는법 그림 설명</h2><button type="button" class="vis-mode" data-vis-mode aria-pressed="false">모두 펼치기</button></div>
<div class="vis-bar" aria-hidden="true">${vis.map(() => '<i></i>').join('')}</div>
<ol class="vis-steps" aria-label="단계 목록">${vis.map((f, i) => `<li><button type="button" data-vis-go="${i}"><span>${i + 1}</span>${esc(f.k)}</button></li>`).join('')}</ol>
<ol class="vis-track" tabindex="0" aria-label="${esc(name)} 그림 설명 ${vis.length}장" data-vis-track>
${vis.map((f, i) => `<li class="vis-step" id="v-${i + 1}" aria-label="${i + 1} / ${vis.length}">
<figure class="vis-fig"><div class="vis-art">${frameSVG(f.art, `${f.t}. ${f.d}`)}</div>
<figcaption class="vis-cap"><p class="vis-k"><span class="vis-n">${i + 1}</span>${esc(f.k)}</p><h3 class="vis-t">${esc(f.t)}</h3><p class="vis-d">${esc(f.d)}</p></figcaption></figure>
</li>`).join('\n')}
</ol>
<div class="vis-nav"><button type="button" class="vis-btn" data-vis-prev>이전</button><span class="vis-count" aria-live="polite">1 / ${vis.length}</span><button type="button" class="vis-btn vis-next" data-vis-next>다음 단계</button></div>
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

  const related = g.related.length ? `<section class="related wrap">
<h2 class="h2 h2-pic">${pic('card-recommend', '', 'h2-char')}비슷한 게임</h2>
<div class="gcards">${g.related.map((s) => gameCard(bySlug[s])).join('')}</div>
</section>` : '';

  const startHref = vis.length ? '#visual' : '#learn';
  const kindTag = g.status === 'checked' ? '<span class="tag tag-teal">검수 완료</span>' : g.status === 'reviewed' ? '<span class="tag tag-teal">자료 대조 완료</span>' : '';
  const body = `<article class="game" data-slug="${g.slug}">
<section class="game-hero">
<div class="wrap game-hero-grid">
<div class="game-cover">${vis.length ? frameSVG(vis[0].art, `${name} 그림: ${vis[0].t}`) : `<div class="game-cover-tile">${tile(g, 'tile-lg')}</div>`}</div>
<div class="game-hero-copy">
<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">/</span><a href="${g.kind === 'traditional' ? '/traditional/' : '/games/'}">${g.kind === 'traditional' ? '전통놀이' : '게임 찾기'}</a></nav>
<p class="game-kind"><span class="tag tag-navy">${KINDS[g.kind]}</span><span class="tag">${GROUPS[g.group]}</span>${kindTag}</p>
<h1 class="game-name">${esc(name)}<span class="game-h1-sub">하는법·룰</span></h1>
${g.original || seo.alt.length ? `<p class="game-orig">${[g.original, ...seo.alt.filter((a) => a !== g.original && !GENERIC_ALIAS.test(a))].filter(Boolean).slice(0, 3).map(esc).join(' · ')}</p>` : ''}
<p class="game-one">${fmt(g.oneLine)}</p>
<ul class="game-meta" aria-label="기본 정보">
<li>${icon('i-people')}${playersText(g.players)}${g.best ? ` <small>추천 ${esc(g.best)}</small>` : ''}</li>
<li>${icon('i-time')}${minutesText(g.minutes)}</li>
<li>${icon('i-age')}${ageText(g.age)}</li>
<li>${die(g.level)}${LEVELS[g.level]}</li>
</ul>
<p class="game-rate" data-game-rate></p>
<div class="game-actions">
<a class="btn btn-main" href="${startHref}" data-start>규칙 따라하기</a>
<div class="react" data-react="${g.slug}" role="group" aria-label="이 게임 표시하기">
<button type="button" data-k="saved" aria-pressed="false">${icon('i-bookmark')}저장<em></em></button>
<button type="button" data-k="played" aria-pressed="false">${icon('i-check')}해 봤어요<em></em></button>
<button type="button" data-k="want" aria-pressed="false">${icon('i-heart')}하고 싶어요<em></em></button>
</div>
</div>
</div>
</div>
</section>
<div class="wrap game-body">
<div class="game-main">
<nav class="jump" aria-label="이 페이지 바로가기"><a href="#reviews">${icon('i-star')}후기·별점</a><a href="#faq">자주 묻는 질문</a>${hasBuy ? `<a href="#buy">${icon('i-cart')}구매하기</a>` : ''}<a href="/community/board/?game=${g.slug}">${icon('i-chat')}이야기 나누기</a></nav>
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
<h2 class="h2">${esc(seo.n)} 룰 1분 요약</h2>
<p class="muted">먼저 이것만 알아 두세요. 세 가지면 첫 판을 시작할 수 있어요.</p>
<div class="know" style="margin-top:14px">
<div class="know-card"><p class="know-h"><i>1</i>이기는 법</p><p>${fmt(g.summary.goal)}</p></div>
<div class="know-card"><p class="know-h"><i>2</i>내 차례</p><ol class="turn">${g.summary.turn.map((t) => `<li>${fmt(t)}</li>`).join('')}</ol></div>
<div class="know-card"><p class="know-h"><i>3</i>끝나는 때</p><p>${fmt(g.summary.end)}</p></div>
</div>
<p class="flow"><span class="flow-k">한 판 흐름</span><span>준비</span><b aria-hidden="true">›</b><span>내 차례</span><b aria-hidden="true">›</b><span>다음 사람</span><b aria-hidden="true">›</b><span>끝</span></p>
<div class="row-btns">
<button type="button" class="btn btn-sub" data-speak>${icon('i-speaker')}소리 내 읽기</button>
<button type="button" class="btn btn-ghost" data-share>${icon('i-share')}링크 보내기</button>
</div>
</section>

<section class="panel" id="learn" role="tabpanel" aria-labelledby="tab-learn">
<h2 class="h2">${esc(seo.n)} 하는법 따라하기</h2>
${guide('domi-order', '도미', '위에서부터 순서대로 따라 하면 돼요.')}
${comps}
${hasBuy && g.components.length ? `<p class="comp-buy">구성물이 없거나 잃어버렸다면 <a href="#buy">구매하기</a>에서 찾을 수 있어요.</p>` : ''}
${diagram}
<h3 class="h3">준비하기</h3>
<ol class="steps">${g.setup.map((s) => `<li>${fmt(s)}</li>`).join('')}</ol>
${examples}
${scoring}
</section>

<section class="panel" id="detail" role="tabpanel" aria-labelledby="tab-detail">
<h2 class="h2">${esc(seo.n)} 자세한 룰과 규칙</h2>
${guide('book-warn', '북', '하다가 막히면 여기서 찾아보세요.')}
${(g.rules || []).length > 1 ? `<label class="rule-find"><span class="sr">규칙에서 찾기</span>${icon('i-search')}<input type="search" placeholder="규칙에서 찾기 (예: 동점, 2명)" data-rule-find></label>` : ''}
<div class="rules">${rules}</div>
${(g.tricky || []).length ? `<h3 class="h3">헷갈리는 상황</h3>${qaList(g.tricky)}` : ''}
${variants}
${house}
</section>

<section class="faq-sec" id="faq" aria-labelledby="faq-title">
<h2 class="h2" id="faq-title">${esc(seo.n)} 자주 묻는 질문</h2>
<div class="faq-list">${faqItems.map((x, i) => `<details class="faq"${i < 2 ? ' open' : ''}><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</div>
</section>
<section class="reviews" id="reviews" data-reviews="${g.slug}" aria-labelledby="rv-title">
<div class="sec-row"><h2 class="h2" id="rv-title" style="margin:0">${esc(seo.n)} 후기와 별점</h2><a class="more-link" href="/community/levels/">후기를 쓰면 +${GROW_RULES.review[0] + GROW_RULES.rate[0]}점</a></div>
<div data-rv-body><div class="live-skel"></div></div>
</section>
<section class="game-talk" data-talk="${g.slug}" hidden>
<div class="sec-row"><h2 class="h2" style="margin:0">${esc(seo.n)} 이야기</h2><a class="more-link" href="/community/board/?game=${g.slug}">게시판에서 더 보기</a></div>
<ul class="plist" data-talk-list></ul>
</section>
${buyBox(g)}
<aside class="source">
<p><b>설명 기준</b> ${esc(g.edition || (g.kind === 'traditional' ? '널리 쓰이는 공통 규칙' : '한국어판'))}</p>
<p><b>만든 방법</b> ${esc(g.source || '규칙을 우리 말로 다시 썼어요. 문장과 그림은 룰북에서 옮기지 않았어요.')}</p>
${refs}
<p><b>많이 찾는 검색어</b> <span class="kw">${seo.kw.slice(0, 10).map((k) => `<span>${esc(k)}</span>`).join('')}</span></p>
<p><button type="button" class="link-btn" data-report="${g.slug}">${icon('i-flag')}틀린 곳 알려 주기</button> <a href="/community/board/?game=${g.slug}">${icon('i-chat')}커뮤니티에서 ${esc(seo.n)} 이야기 보기</a></p>
</aside>
</div>
<aside class="play-side" aria-label="플레이 중이라면">
<div class="side-card">
<h2>플레이 중이라면</h2>
<div class="side-links">
<button type="button" data-table>${icon('i-table')}테이블 모드로 보기</button>
${(g.tricky || []).length ? `<a href="#detail">${icon('i-book')}헷갈리는 상황 찾기</a>` : `<a href="#detail">${icon('i-search')}자세한 규칙 찾기</a>`}
<a href="#summary">${icon('i-check')}끝나는 때 다시 보기</a>
${(g.houseRules || []).length ? `<a href="#house">${icon('i-people')}우리 집 규칙 정하기</a>` : ''}
<a href="#reviews">${icon('i-star')}해 본 사람들 후기</a>
</div>
</div>
<div class="side-help">${pic('pawn-book', '', '')}<div><b>규칙이 헷갈리나요?</b><p>게시판 ‘규칙 질문’에 올리면 먼저 해 본 사람들이 답해 줘요.</p><a class="more-link" href="/community/write/?t=post&amp;cat=qna&amp;game=${g.slug}">질문 올리기</a></div></div>
</aside>
</div>
${related}
<div class="cta-bar"><div class="wrap-narrow"><button type="button" class="btn btn-main btn-block" data-table>${icon('i-table')}테이블 모드로 시작</button></div></div>
<script type="application/json" id="game-data">${JSON.stringify({ ...g, _file: undefined }).replace(/</g, '\\u003c')}</script>
</article>`;

  const desc = `${seo.n} 하는법과 룰을 그림으로 쉽게 정리했어요. ${seo.hooks.join(', ')}까지 한 번에 확인하세요. ${playersText(g.players)}, ${minutesText(g.minutes)}, ${ageText(g.age)}. ${plain(g.oneLine)}`;
  const howSteps = [...g.setup.map((t) => ({ name: '준비', text: plain(t) })), ...g.summary.turn.map((t) => ({ name: '내 차례', text: plain(t) })), { name: '끝', text: plain(g.summary.end) }];
  return layout({
    title: `${seo.n} 하는법·룰 총정리 | ${seo.hooks.join('·')} - ${cfg.siteName}`,
    description: desc,
    path: `/games/${g.slug}/`,
    body,
    scripts: ['table.js'],
    bodyClass: 'has-cta',
    keywords: seo.kw.slice(0, 14),
    ogImage: fs.existsSync(path.join(STATIC, 'img', 'og', `${g.slug}.png`)) ? `/assets/img/og/${g.slug}.png` : '',
    ogType: 'article',
    jsonld: [
      {
        '@context': 'https://schema.org', '@type': 'HowTo', name: `${seo.n} 하는법`, description: plain(g.oneLine), inLanguage: 'ko',
        totalTime: `PT${g.minutes[1]}M`, supply: g.components.slice(0, 12).map((c) => ({ '@type': 'HowToSupply', name: plain(c) })),
        step: howSteps.map((st, i) => ({ '@type': 'HowToStep', position: i + 1, name: `${st.name} ${i + 1}`, text: st.text, url: abs(`/games/${g.slug}/#${i < g.setup.length ? 'learn' : 'summary'}`) })),
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: faqItems.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
      },
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
// 상황별 카테고리: 무드보드 아이콘 그림 + 모음 페이지
const CATS = [
  ['cat-cards', '/collections/party-room/', '분위기 띄우기', '여럿이 웃고 떠드는 파티 게임', 'cat-coral', 'party-room'],
  ['cat-pawns', '/collections/with-kids/', '아이와 함께', '규칙이 쉬운 가족 게임', 'cat-butter', 'with-kids'],
  ['cat-blocks', '/collections/two-players/', '둘이서', '연인, 친구와 마주 앉아', 'cat-teal', 'two-players'],
  ['cat-dominoes', '/collections/quick/', '15분 한 판', '짧게 여러 판 돌리기', 'cat-butter', 'quick'],
  ['cat-tangram', '/collections/strategy-night/', '제대로 한 판', '머리 쓰는 전략 게임', 'cat-navy', 'strategy-night'],
  ['cat-rulebook', '/rules/', '룰 모음', '헷갈리는 규칙만 빠르게', 'cat-teal', ''],
];
const HOT = ['rummikub', 'davinci-code', 'halli-galli', 'yutnori', 'splendor'];

function homePage() {
  const popular = content.popular.map((s) => bySlug[s]);
  const trad = tradGames();
  const colBy = Object.fromEntries(content.collections.map((c) => [c.slug, c]));
  const sel = (key, label, opts) => `<label class="sel-pill"><span class="sr">${label}</span><select data-hf="${key}" aria-label="${label}">${opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
  const lvStrip = GROW_LEVELS.map((l) => `<li>${emblemSVG(levelOf(l.min, GROW_LEVELS), 54, glyph)}<b>${esc(l.name)}</b><small>${l.min}점</small></li>`).join('');
  const pts = [['review', '후기 쓰기'], ['rate', '별점 남기기'], ['adopted', '답변 채택'], ['post', '글쓰기'], ['checkin', '출석 체크'], ['join', '정모 참여']].map(([k, l]) => `<span>${l}<b>+${GROW_RULES[k][0]}</b></span>`).join('');
  const body = `<section class="hero-pop">
<div class="wrap hero-pop-grid">
<div class="hero-copy">
<h1 class="hero-title">룰이 궁금한 순간,<br><span class="mark">룰룰</span>${SPARK}</h1>
<p class="hero-sub">보드게임과 전통놀이 ${games.length}가지, 그림 몇 장이면 바로 시작해요.</p>
<form class="search-pop" action="/games/" role="search">
<label class="sr" for="home-q">게임 이름으로 찾기</label>
${icon('i-search')}<input id="home-q" name="q" type="search" placeholder="게임 이름이나 초성으로 찾기 (예: ㄹㅁㅋㅂ)" autocomplete="off">
<button type="submit" aria-label="찾기">${icon('i-search')}</button>
</form>
<div class="hero-filters" data-hero-filters>
${sel('p', '인원', [['', '인원'], ['2', '2명'], ['3', '3명'], ['4', '4명'], ['5', '5명'], ['6', '6명'], ['7', '7명 이상']])}
${sel('m', '시간', [['', '시간'], ['15', '15분 안'], ['30', '30분 안'], ['60', '1시간 안']])}
${sel('l', '난이도', [['', '난이도'], ['1', '쉬움'], ['2', '보통'], ['3', '어려움']])}
</div>
<p class="hero-hot"><b>많이 찾는 룰</b>${HOT.filter((s) => bySlug[s]).map((s) => `<a href="/games/${s}/">${esc(bySlug[s].name)}</a>`).join('')}</p>
</div>
<div class="hero-art">${pic('hero-pop', '주사위, 카드, 말과 보드게임 상자가 놓인 테이블', '', true)}</div>
</div>
</section>

<section class="sec" id="picked">
<div class="wrap">
<div class="sec-row"><h2 class="sec-title">오늘 함께할 게임</h2><a class="more-link" href="/games/" data-deal-more>게임 전체 보기</a></div>
<p class="picked-title" aria-live="polite" data-deal-title>요즘 많이 여는 게임이에요. 위에서 인원과 시간을 고르면 바로 바뀌어요.</p>
<div class="deal" data-deal>${popular.slice(0, 6).map((g) => gameCard(g)).join('')}</div>
</div>
</section>

<section class="sec" data-recent-sec hidden>
<div class="wrap">
<div class="sec-row"><h2 class="sec-title">최근 본 게임</h2><a class="more-link" href="/saved/?tab=recent">모두 보기</a></div>
<div data-resume></div>
<div class="recent-row" data-recent></div>
</div>
</section>

<section class="sec">
<div class="wrap">
<div class="sec-row"><h2 class="sec-title">어떤 자리인가요?</h2><a class="more-link" href="/games/">조건으로 찾기</a></div>
<div class="cats">
${CATS.map(([im, href, t, d, tone, col]) => `<a class="cat ${tone}" href="${href}">${pic(im, '', '')}<span class="cat-t">${t}</span><span class="cat-d">${d}</span><span class="cat-c">${col && colBy[col] ? `게임 ${colBy[col].games.length}개` : `${games.length}개 게임`}</span></a>`).join('\n')}
</div>
<div class="cat-more">${['first-meeting', 'holiday', 'big-group'].filter((c) => colBy[c]).map((c) => `<a class="pill" href="/collections/${c}/">${esc(colBy[c].title)}</a>`).join('')}<a class="pill" href="/traditional/">전통놀이 ${trad.length}가지</a></div>
</div>
</section>

<section class="sec">
<div class="wrap">
<div class="start-band">
${pic('dice-search', '', '')}
<div><b>처음이라면, 여기부터</b><p>보드게임이 처음인 사람도 따라 할 수 있게, 차례와 순서부터 천천히 알려 드려요.</p></div>
<a class="btn btn-main" href="/learn/">처음이라면 보기</a>
</div>
</div>
</section>

<section class="sec">
<div class="wrap">
<div class="sec-row"><h2 class="sec-title">룰룰 사람들은 지금</h2><a class="more-link" href="/community/">커뮤니티로</a></div>
<div class="live-grid" data-live>
<div class="live-card" data-live-poll><h3>${icon('i-poll')}이번 주 투표</h3><div class="live-skel"></div></div>
<div class="live-card" data-live-reviews><h3>${icon('i-star')}새로 올라온 후기</h3><div class="live-skel"></div></div>
<div class="live-card" data-live-top><h3>${icon('i-trophy')}이달의 활동왕</h3><div class="live-skel"></div></div>
</div>
</div>
</section>

<section class="grow-band">
<div class="wrap">
<h2 class="sec-title">하면 할수록, 등급이 올라가요</h2>
<p class="sec-lead">후기를 쓰고, 규칙 질문에 답하고, 정모에 나가면 점수가 쌓여요. ‘첫 판’에서 시작해 ‘룰룰 레전드’까지 열 단계, 배지는 ${GROW_BADGES.length}가지예요.</p>
<ol class="lv-strip">${lvStrip}</ol>
<div class="grow-points">${pts}</div>
<div class="row-btns"><a class="btn btn-main" href="/account/?mode=signup">회원가입하고 시작하기</a><a class="btn btn-sub" href="/community/levels/">등급과 배지 보기</a></div>
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

<section class="sec">
<div class="wrap">
<div class="sec-row"><h2 class="sec-title">게임 전체</h2><a class="more-link" href="/games/">게임 ${games.length}개 모두 보기</a></div>
<p class="sec-lead">보드게임 ${games.filter((g) => g.kind === 'board').length}가지와 전통놀이 ${trad.length}가지. 모든 게임을 ‘이기는 법, 내 차례, 끝나는 때’ 순서로 설명해요.</p>
<div class="gcards" style="margin-top:20px">${popular.map((g) => gameCard(g)).join('')}</div>
</div>
</section>

<section class="shop-band">
<div class="wrap">
<div class="band-head"><h2 class="sec-title">룰룰 보드게임몰</h2><a class="more-link" href="/shop/">전체 보기</a></div>
<p class="sec-lead">하는 법을 읽고 마음에 들었다면 바로 구할 수 있게, 상황별로 골라 두었어요.</p>
<div class="shelf-cards">
${SHOP.shelves.slice(0, 6).map((sh) => `<a class="shelf-card" href="/shop/#${sh.slug}"><span class="shelf-t">${esc(sh.title)}</span><span class="shelf-d">${esc(sh.lead)}</span><span class="col-tiles">${sh.items.map((id) => SHOP.items[id].game).filter((gs, i, a) => gs && bySlug[gs] && a.indexOf(gs) === i).slice(0, 4).map((gs) => tile(bySlug[gs], 'tile-sm')).join('')}<span class="col-count">${sh.items.length}개</span></span></a>`).join('\n')}
</div>
</div>
</section>

<section class="cm-band">
<div class="wrap cm-band-grid">
<div>
<h2 class="sec-title">같이 할 사람, 여기서 찾아요</h2>
<p class="sec-lead">우리 동네 보드게임 모임에 들어가거나, 오늘 저녁 번개를 열어 보세요. 규칙이 헷갈릴 때는 게시판에 물어보면 돼요.</p>
<div class="row-btns"><a class="btn btn-main" href="/community/">커뮤니티 둘러보기</a><a class="btn btn-sub" href="/community/write/?t=event">번개 열기</a></div>
</div>
<ul class="cm-points">
<li>${icon('i-people')}<span><b>모임</b>지역별 보드게임 모임에 가입하고 정모 일정을 받아요.</span></li>
<li>${icon('i-cal')}<span><b>정모·번개</b>날짜, 장소, 인원을 정해 올리면 참여 신청을 받아요.</span></li>
<li>${icon('i-chat')}<span><b>게시판과 투표</b>규칙 질문, 게임 후기, 추천 부탁, 투표를 나눠요.</span></li>
</ul>
</div>
</section>

<section class="space-band">
<div class="wrap space-grid">
<div>
<h2 class="sec-title">손님이 게임을 꺼냈다가 그냥 넣어 두나요?</h2>
<p class="sec-lead">보드게임카페, 파티룸, 펜션처럼 게임을 두는 공간이라면 매장 QR을 만들어 보세요. 손님이 QR을 찍으면 우리 매장에 있는 게임과 하는 법이 바로 열려요. 설명해 줄 직원이 없어도 괜찮아요.</p>
<a class="btn btn-main" href="/space/">매장 QR 만들기</a>
</div>
<div class="space-art">
${pic('scene-store', '매장 테이블에서 휴대폰으로 게임 설명을 보는 손님들', 'space-pic')}
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
    keywords: ['보드게임 하는법', '보드게임 룰', '보드게임 규칙', '보드게임 추천', '루미큐브 하는법', '할리갈리 룰', '다빈치코드 하는법', '윷놀이 규칙', '보드게임 모임'],
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.siteName, alternateName: ['룰룰 보드게임', 'rulerule', '보드게임 룰 하는법 설명서'], url: abs('/'), inLanguage: 'ko', potentialAction: { '@type': 'SearchAction', target: abs('/games/?q={search_term_string}'), 'query-input': 'required name=search_term_string' } },
      { '@context': 'https://schema.org', '@type': 'Organization', name: cfg.siteName, url: abs('/'), logo: abs('/assets/img/icon-512.png') },
    ],
  });
}

// ---------- 페이지: 게임 찾기 ----------
function gamesPage() {
  const allTags = [...new Set(games.flatMap((g) => g.tags || []))].sort(collator.compare);
  const body = `<section class="page-head">
<div class="wrap page-head-grid">
<div>
<h1 class="page-title" id="search">게임 찾기</h1>
<p class="page-lead">모인 인원과 시간으로 거르거나, 이름으로 찾아보세요. 초성(예: ㄹㅁㅋㅂ)으로도 찾을 수 있어요.</p>
</div>
${pic('ico-find', '', 'page-art page-art-sq', true)}
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
${pic('fox-search', '', 'empty-pic')}
<p>조건에 맞는 게임이 아직 없어요.</p>
<p class="muted">인원이나 시간을 하나 풀어 보세요. 찾는 게임이 없다면 <button type="button" class="link-btn" data-report="">넣어 달라고 알려 주세요</button>.</p>
</div>
</section>`;
  return layout({
    title: `보드게임·전통놀이 찾기 | 인원·시간으로 고르기 - ${cfg.siteName}`,
    description: `인원, 시간, 난이도로 보드게임과 전통놀이를 골라 보세요. ${games.length}가지 게임의 하는 법을 1분 요약으로 알려 드려요.`,
    path: '/games/',
    body,
    keywords: ['보드게임 추천', '보드게임 종류', '보드게임 하는법', '인원별 보드게임', '2인 보드게임', '파티 보드게임'],
  });
}

// ---------- 페이지: 상황 묶음 ----------
const COL_SEO = {
  'two-players': '2인 보드게임 추천', 'first-meeting': '처음 만난 사이 보드게임 추천, 아이스브레이킹 게임', 'with-kids': '아이와 하는 보드게임 추천, 유아·초등 보드게임',
  holiday: '명절 가족 보드게임·전통놀이 추천', 'big-group': '여러 명이 하는 보드게임 추천, 6명 이상 단체 게임', 'party-room': '파티룸 보드게임 추천',
  quick: '15분 짧은 보드게임 추천', 'strategy-night': '전략 보드게임 추천',
};
function collectionPage(c) {
  const list = c.games.map((s) => bySlug[s]);
  const body = `<section class="page-head">
<div class="wrap page-head-grid">
<div>
<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">/</span><span>이런 자리라면</span></nav>
<h1 class="page-title">${esc(c.title)}</h1>
<p class="page-lead">${esc(c.lead)}</p>
${c.tip ? `<p class="tip">${fmt(c.tip)}</p>` : ''}
</div>
${COL_ART[c.slug] ? pic(COL_ART[c.slug], '', `page-art${COL_ART[c.slug].startsWith('scene-strategy') || COL_ART[c.slug].startsWith('ico-') ? ' page-art-sq' : ''}`, true) : ''}
</div>
</section>
<section class="wrap list-sec">
<div class="gcards">${list.map((g) => gameCard(g)).join('')}</div>
<h2 class="h2 other-title">다른 자리라면</h2>
<div class="trad-links">${content.collections.filter((x) => x.slug !== c.slug).map((x) => `<a class="pill" href="/collections/${x.slug}/">${esc(x.title)}</a>`).join('')}</div>
</section>`;
  return layout({
    title: `${COL_SEO[c.slug] || `${c.title} 보드게임 추천`} ${list.length}가지 | 하는법까지 - ${cfg.siteName}`,
    description: `${c.lead} ${list.slice(0, 6).map((g) => g.name).join(', ')} 등 ${list.length}가지 게임의 하는법과 룰을 그림과 1분 요약으로 알려 드려요.`,
    keywords: [COL_SEO[c.slug] || c.title, ...list.slice(0, 6).map((g) => `${bare(g.name)} 하는법`)],
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
    ['몸으로 하는 놀이', ['tuho', 'jegichagi', 'ttakji', 'sabangchigi', 'biseokchigi', 'paengichigi', 'ttangttameokgi']],
  ];
  const body = `<section class="page-head">
<div class="wrap page-head-grid">
<div>
<h1 class="page-title">전통놀이 하는 법</h1>
<p class="page-lead">설과 추석에 3대가 함께 하기 좋은 전통놀이 ${trad.length}가지예요. 지역과 집안마다 규칙이 조금씩 달라서, 널리 쓰이는 공통 규칙을 먼저 쓰고 다른 방법은 ‘하우스룰’로 따로 표시했어요.</p>
</div>
${pic('scene-generations', '여러 세대가 한 테이블에서 놀이를 하는 모습', 'page-art', true)}
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
    title: `전통놀이 하는법·규칙 ${trad.length}가지 - 윷놀이 규칙, 장기 두는법, 공기놀이, 사방치기 | ${cfg.siteName}`,
    description: `${trad.map((g) => g.name).join(', ')} 하는법과 규칙을 그림으로 쉽게 알려 드려요. 명절에 쓰는 우리 집 윷놀이 규칙 카드도 만들 수 있어요.`,
    keywords: ['전통놀이 종류', '전통놀이 방법', '민속놀이', '윷놀이 규칙', '장기 두는법', '공기놀이 방법', '사방치기 방법', '비석치기 방법', '제기차기 방법'],
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
<div class="wrap page-head-grid">
<div>
<h1 class="page-title">보드게임이 처음이라면</h1>
<p class="page-lead">규칙을 다 외우고 시작하는 사람은 거의 없어요. 하면서 배우면 돼요. 처음 모임을 이끄는 분을 위한 순서와, 설명에 자주 나오는 말을 풀어 두었어요.</p>
</div>
${pic('ico-first', '', 'page-art page-art-sq', true)}
</div>
</section>
<section class="wrap-narrow learn">
<h2 class="h2">처음 모임, 이렇게 시작해요</h2>
${guide('domi-order', '도미', '순서대로만 하면 돼요. 여섯 가지예요.')}
<ol class="steps steps-big">${steps.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>
<h2 class="h2">처음이라면 이 게임부터</h2>
<div class="gcards">${['halli-galli', 'dobble', 'just-one', 'rummikub', 'yutnori', 'the-mind'].filter((s) => bySlug[s]).map((s) => gameCard(bySlug[s])).join('')}</div>
<h2 class="h2" id="words">자주 나오는 말</h2>
${guide('book-open', '북', '설명에 자주 나오는 말을 쉬운 말로 풀었어요.')}
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
<div class="wrap page-head-grid">
<div>
<h1 class="page-title">매장 QR 만들기</h1>
<p class="page-lead">보드게임카페, 파티룸, 게임파티룸, 펜션, 캠핑장처럼 게임을 두는 공간을 위한 기능이에요. 우리 매장에 있는 게임을 고르면 매장 전용 페이지와 QR이 바로 만들어져요. 가입도 비용도 필요 없어요.</p>
</div>
${pic('scene-store', '매장 테이블에서 휴대폰으로 게임 설명을 보는 손님들', 'page-art', true)}
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


// ---------- 페이지: 보드게임 룰 모음 (가나다순) ----------
const CHO_HEAD = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const MERGE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
const headOf = (name) => {
  const ch = name.replace(/^[^가-힣A-Za-z0-9]+/, '')[0] || '';
  if (/[가-힣]/.test(ch)) { const h = CHO_HEAD[Math.floor((ch.charCodeAt(0) - 0xac00) / 588)]; return MERGE[h] || h; }
  return /[0-9]/.test(ch) ? '0-9' : 'A-Z';
};
function rulesPage() {
  const groups = {};
  for (const g of sortedGames) (groups[headOf(g.name)] = groups[headOf(g.name)] || []).push(g);
  const order = Object.keys(groups).sort((a, b) => (a === '0-9' ? -1 : b === '0-9' ? 1 : collator.compare(a, b)));
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title">보드게임 룰·하는법 모음</h1>
<p class="page-lead">${cfg.siteName}에 정리한 보드게임과 전통놀이 ${games.length}가지의 하는법과 룰을 가나다순으로 모았어요. 이름을 누르면 그림 설명, 1분 요약, 자세한 규칙, 자주 묻는 질문을 볼 수 있어요.</p>
<nav class="cho-nav" aria-label="첫 글자로 이동">${order.map((h) => `<a href="#cho-${encodeURIComponent(h)}">${h}</a>`).join('')}</nav>
</div>
</section>
<section class="wrap rules-index">
${order.map((h) => `<div class="cho-group" id="cho-${encodeURIComponent(h)}"><h2 class="cho-h">${h}</h2><ul class="rule-links">${groups[h].map((g) => { const so = seoOf(g); return `<li><a href="/games/${g.slug}/"><b>${esc(so.n)} 하는법·룰</b><small>${so.hooks.map(esc).join(' · ')}</small></a><span class="rule-sub">${so.kw.slice(4, 7).map((k) => esc(k)).join(', ')}</span></li>`; }).join('')}</ul></div>`).join('\n')}
<div class="tip-box">
<h2 class="h2">찾는 게임이 없나요?</h2>
<p>넣어 줬으면 하는 게임을 알려 주시면 순서대로 정리해 올려요.</p>
<div class="row-btns"><a class="btn btn-sub" href="/contact/?kind=game">게임 추가 요청하기</a><a class="btn btn-ghost" href="/games/">인원·시간으로 찾기</a></div>
</div>
</section>`;
  return layout({
    title: `보드게임 룰·하는법 모음 ${games.length}가지 (가나다순) - ${cfg.siteName}`,
    description: `루미큐브, 할리갈리, 다빈치코드, 우노, 스플렌더, 카탄, 윷놀이까지 보드게임과 전통놀이 ${games.length}가지의 하는법과 룰을 가나다순으로 모았어요.`,
    path: '/rules/',
    body,
    keywords: ['보드게임 룰', '보드게임 하는법', '보드게임 규칙 모음', '보드게임 설명서', '보드게임 룰북'],
    jsonld: { '@context': 'https://schema.org', '@type': 'ItemList', name: '보드게임 룰·하는법 모음', itemListElement: sortedGames.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/games/${g.slug}/`), name: `${bare(g.name)} 하는법` })) },
  });
}

// ---------- 페이지: 보드게임몰 ----------
const GOODS_ICON = `<div class="tile tile-sm tile-goods" aria-hidden="true">${icon('i-cart')}</div>`;
function productCard(id, from) {
  const it = SHOP.items[id];
  const g = it.game && bySlug[it.game] && it.kind !== 'goods' ? bySlug[it.game] : null;
  return `<li class="pcard">
<div class="pcard-top">${g ? tile(g, 'tile-sm') : GOODS_ICON}<span class="buy-kind">${SHOP_KIND[it.kind] || '상품'}</span></div>
<h3 class="pcard-name">${esc(it.name)}</h3>
<p class="pcard-note">${esc(it.note || '')}</p>
${g ? `<p class="pcard-meta">${playersText(g.players)} · ${minutesText(g.minutes)} · ${ageText(g.age)} · ${LEVELS[g.level]}</p>` : ''}
<div class="pcard-btns">${g ? `<a class="btn btn-sub btn-sm" href="/games/${g.slug}/">하는법 보기</a>` : ''}${buyLink(id, from, '쿠팡에서 보기', 'btn btn-buy btn-sm')}</div>
</li>`;
}
function shopPage() {
  const body = `<section class="page-head">
<div class="wrap page-head-grid">
<div>
<h1 class="page-title">룰룰 보드게임몰</h1>
<p class="ad-note ad-note-top"><span class="ad-tag">광고</span>이 페이지의 구매 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
<p class="page-lead">처음 사는 보드게임부터 둘이서, 아이와, 여럿이 모였을 때 하기 좋은 게임과 용품을 골라 두었어요. 모두 ${cfg.siteName}에 하는 법이 정리된 게임이라, 사기 전에 어떤 게임인지 먼저 확인할 수 있어요.</p>
</div>
${pic('scene-shelf', '보드게임이 가득 꽂힌 선반', 'page-art', true)}
</div>
<div class="wrap"><nav class="shelf-nav" aria-label="진열대로 이동">${SHOP.shelves.map((sh) => `<a class="pill" href="#${sh.slug}">${esc(sh.title)}</a>`).join('')}</nav></div>
</section>
<div class="wrap shop">
${SHOP.shelves.map((sh) => `<section class="shelf" id="${sh.slug}" aria-labelledby="sh-${sh.slug}">
<h2 class="h2" id="sh-${sh.slug}">${esc(sh.title)}</h2>
<p class="muted">${esc(sh.lead)}</p>
<ul class="pcards">${sh.items.map((id) => productCard(id, `shop-${sh.slug}`)).join('\n')}</ul>
</section>`).join('\n')}
<div class="tip-box">
<h2 class="h2">사기 전에 알아 두세요</h2>
<ul class="list">
<li>버튼을 누르면 쿠팡 상품 페이지나 검색 결과로 이동해요. 가격과 배송, 교환·환불은 판매처의 안내를 따라요.</li>
<li>같은 이름이라도 판(에디션)에 따라 구성물과 인원이 조금 달라요. 상품 페이지의 구성품을 확인하세요.</li>
<li>${cfg.siteName}은 상품을 직접 팔지 않아요. 링크를 통해 구매하면 ${cfg.siteName}에 수수료가 생기고, 이 수수료는 설명을 만들고 검수하는 데 써요.</li>
</ul>
</div>
</div>`;
  const allIds = [...new Set(SHOP.shelves.flatMap((sh) => sh.items))];
  return layout({
    title: `룰룰 보드게임몰 - 처음 사는 보드게임, 2인 보드게임, 아이 보드게임 추천 | ${cfg.siteName}`,
    description: `처음 사는 보드게임, 둘이서 하기 좋은 게임, 아이와 하는 게임, 파티 게임, 전략 게임, 명절 전통놀이 도구와 보드게임 용품을 골라 두었어요. 하는법을 먼저 확인하고 고르세요.`,
    path: '/shop/',
    body,
    keywords: ['보드게임 추천', '보드게임 선물', '2인 보드게임 추천', '아이 보드게임 추천', '파티 보드게임 추천', '보드게임 구매', '윷놀이 세트'],
    jsonld: { '@context': 'https://schema.org', '@type': 'ItemList', name: '룰룰 보드게임몰', itemListElement: allIds.map((id, i) => ({ '@type': 'ListItem', position: i + 1, name: SHOP.items[id].name })) },
  });
}

// ---------- 페이지: 커뮤니티 ----------
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '온라인'];
const POST_CATS = { free: '자유', qna: '규칙 질문', review: '게임 후기', recommend: '추천해 주세요', poll: '투표', notice: '공지' };
const cmTabs = (cur) => `<nav class="cm-tabs" aria-label="커뮤니티 메뉴">${[['/community/', '홈'], ['/community/board/', '게시판'], ['/community/events/', '정모·번개'], ['/community/clubs/', '모임'], ['/community/rank/', '랭킹'], ['/community/levels/', '등급 안내']].map(([h, l]) => `<a href="${h}"${cur === h ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
const cmData = `<script type="application/json" id="cm-data">${JSON.stringify({ regions: REGIONS, cats: POST_CATS, userCats: ['free', 'qna', 'review', 'recommend', 'poll'] })}</script>`;
const NOJS = '<noscript><p class="notice">커뮤니티는 자바스크립트를 켜야 쓸 수 있어요.</p></noscript>';
function cmPage({ p, title, h1, lead, kind, desc, noindex = false, side = '' }) {
  const body = `<section class="page-head cm-head">
<div class="wrap">
${cmTabs(p)}
<h1 class="page-title">${h1}</h1>
${lead ? `<p class="page-lead">${lead}</p>` : ''}
</div>
</section>
<section class="wrap cm" data-cm="${kind}">
${NOJS}
<div class="cm-body" data-cm-body><p class="muted cm-loading">불러오는 중이에요</p></div>
${side}
</section>
${cmData}`;
  return layout({ title: `${title} - ${cfg.siteName}`, description: desc || lead.replace(/<[^>]+>/g, ''), path: p, body, scripts: ['community.js'], noindex });
}
const SAFETY = `<aside class="tip-box cm-safety">
<h2 class="h2">처음 만나는 모임이라면</h2>
<ul class="list">
<li>보드게임카페처럼 사람이 많은 공개된 장소에서 만나요.</li>
<li>회비나 돈을 먼저 보내 달라는 요청은 조심하세요. 참가비는 만나서 내는 게 안전해요.</li>
<li>전화번호, 주소 같은 개인 정보는 글이나 댓글에 쓰지 마세요.</li>
<li>불편한 글이나 사람은 ‘신고’를 눌러 알려 주세요. 운영자가 확인해요.</li>
</ul>
<p><a href="/community/rules/">커뮤니티 이용 규칙 보기</a></p>
</aside>`;
const communityPages = () => [
  ['community/index.html', cmPage({ p: '/community/', kind: 'hub', title: '보드게임 모임·정모·번개 커뮤니티', h1: '보드게임 커뮤니티', lead: '우리 동네 보드게임 모임을 찾고, 정모와 번개 일정에 참여하고, 규칙 질문과 후기를 나눠요.', desc: '지역별 보드게임 모임, 보드게임 정모와 번개 일정, 자유게시판에서 규칙 질문과 게임 후기를 나누는 룰룰 보드게임 커뮤니티예요.', side: SAFETY })],
  ['community/events/index.html', cmPage({ p: '/community/events/', kind: 'events', title: '보드게임 정모·번개 일정', h1: '정모·번개 일정', lead: '다가오는 보드게임 정모와 번개예요. 지역과 종류로 골라 보고, 마음에 드는 일정에 참여 신청하세요.', desc: '지역별 보드게임 정모와 번개 일정을 찾고 참여 신청할 수 있어요.' })],
  ['community/event/index.html', cmPage({ p: '/community/event/', kind: 'event', title: '일정', h1: '', lead: '', noindex: true, side: SAFETY })],
  ['community/clubs/index.html', cmPage({ p: '/community/clubs/', kind: 'clubs', title: '지역별 보드게임 모임 찾기', h1: '보드게임 모임', lead: '지역별 보드게임 모임이에요. 가입하면 정모 일정과 모임 게시판을 볼 수 있어요.', desc: '서울, 경기, 부산 등 지역별 보드게임 모임을 찾고 가입할 수 있어요.' })],
  ['community/club/index.html', cmPage({ p: '/community/club/', kind: 'club', title: '모임', h1: '', lead: '', noindex: true, side: SAFETY })],
  ['community/board/index.html', cmPage({ p: '/community/board/', kind: 'board', title: '보드게임 자유게시판', h1: '자유게시판', lead: '규칙이 헷갈릴 때 물어보고, 해 본 게임의 후기를 나누고, 모임에 맞는 게임을 추천받아요.', desc: '보드게임 규칙 질문, 게임 후기, 추천 부탁을 나누는 자유게시판이에요.' })],
  ['community/post/index.html', cmPage({ p: '/community/post/', kind: 'post', title: '게시글', h1: '', lead: '', noindex: true })],
  ['community/write/index.html', cmPage({ p: '/community/write/', kind: 'write', title: '글쓰기', h1: '', lead: '', noindex: true })],
  ['account/index.html', cmPage({ p: '/account/', kind: 'account', title: '로그인·회원가입', h1: '', lead: '', noindex: true })],
  ['community/rank/index.html', cmPage({ p: '/community/rank/', kind: 'rank', title: '보드게임 커뮤니티 랭킹', h1: '룰룰 랭킹', lead: '이달에 가장 열심히 활동한 사람, 받은 별이 많은 사람, 후기를 많이 쓴 사람, 규칙 질문을 많이 해결한 사람이에요.', desc: '룰룰 커뮤니티의 이달의 활동왕, 누적 등급 순위, 후기왕, 규칙 해결사 순위를 볼 수 있어요.' })],
  ['community/user/index.html', cmPage({ p: '/community/user/', kind: 'user', title: '회원 프로필', h1: '', lead: '', noindex: true })],
];

// ---------- 페이지: 등급과 배지 안내 ----------
function levelsPage() {
  const rows = GROW_LEVELS.map((l, i) => {
    const info = levelOf(l.min, GROW_LEVELS);
    const next = GROW_LEVELS[i + 1];
    return `<li class="lv-row">${emblemSVG(info, 52, glyph)}<div><b>Lv.${l.lv} ${esc(l.name)}</b><p>${esc(l.line)}</p></div><span>${next ? `${l.min}–${next.min - 1}점` : `${l.min}점 이상`}</span></li>`;
  }).join('');
  const ruleRows = Object.entries(GROW_RULES).filter(([k]) => k !== 'welcome').map(([, [pt, cap, label]]) => { const per = label.includes('게임마다') ? '게임마다 한 번' : ''; return `<tr><td>${esc(label.replace(/ \([^)]*\)/, ''))}</td><td>+${pt}점</td><td>${[per, cap ? `하루 ${cap}번까지` : ''].filter(Boolean).join(', ') || '제한 없음'}</td></tr>`; }).join('');
  const badges = GROW_BADGES.map((b) => `<div class="badge-cell">${badgeSVG(b, 52, false, glyph)}<b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('');
  const body = `<section class="page-head cm-head">
<div class="wrap">
${cmTabs('/community/levels/')}
<h1 class="page-title">등급과 배지${SPARK}</h1>
<p class="page-lead">룰룰에서 활동하면 점수가 쌓이고 등급이 올라가요. 내 글과 후기가 다른 사람에게 도움이 되면 별을 받고, 특별한 일을 해내면 배지를 받아요.</p>
</div>
</section>
<section class="wrap cm levels-page">
<div class="cm-body">
<h2 class="h2" style="margin-top:0">열 단계 등급</h2>
<p class="muted">닉네임 옆에 등급 표시가 붙어요. 가입하면 바로 ${GROW_RULES.welcome[0]}점을 받고 ‘첫 판’부터 시작해요.</p>
<ol class="lv-table" style="margin-top:14px">${rows}</ol>

<h2 class="h2">점수를 얻는 방법</h2>
<p class="muted">같은 게시물로 점수를 여러 번 받을 수는 없어요. 글이나 후기를 지우면 받았던 점수도 함께 빠져요.</p>
<div class="table-wrap" style="margin-top:12px"><table class="rule-table"><thead><tr><th>활동</th><th>점수</th><th>횟수</th></tr></thead><tbody>${ruleRows}</tbody></table></div>

<h2 class="h2">받은 별과 매너 별점</h2>
<div class="know">
<div class="know-card"><p class="know-h"><i>${icon('i-star')}</i>받은 별</p><p>내 글이 좋아요를 받거나 후기가 ‘도움돼요’를 받으면 별이 하나씩 늘어요. 규칙 질문에서 내 댓글이 답변으로 채택되면 별 3개를 받아요.</p></div>
<div class="know-card"><p class="know-h"><i>${icon('i-heart')}</i>매너 별점</p><p>정모와 번개가 끝나면 함께한 사람끼리 1~5점으로 매너를 남겨요. 세 사람 넘게 평가하면 프로필에 평균이 보여요.</p></div>
<div class="know-card"><p class="know-h"><i>${icon('i-trophy')}</i>랭킹</p><p>매달 1일에 이달의 점수가 새로 시작돼요. 누적 등급, 후기왕, 규칙 해결사 순위도 <a href="/community/rank/">랭킹</a>에서 볼 수 있어요.</p></div>
</div>

<h2 class="h2">배지 ${GROW_BADGES.length}가지</h2>
<p class="muted">받은 배지 가운데 하나를 대표 배지로 고르면 닉네임 옆에 함께 보여요. <a href="/account/">내 정보</a>에서 고를 수 있어요.</p>
<div class="badge-grid" style="margin-top:14px">${badges}</div>
<div class="row-btns" style="margin-top:28px"><a class="btn btn-main" href="/account/?mode=signup">회원가입하고 시작하기</a><a class="btn btn-sub" href="/community/rules/">커뮤니티 이용 규칙</a></div>
</div>
</section>`;
  return layout({ title: `등급과 배지 안내 - ${cfg.siteName}`, description: `룰룰 보드게임 커뮤니티의 열 단계 등급, 점수 얻는 방법, 받은 별과 매너 별점, 배지 ${GROW_BADGES.length}가지를 안내해요.`, path: '/community/levels/', body });
}

// ---------- 페이지: 저장한 게임 ----------
function savedPage() {
  const body = `<section class="page-head">
<div class="wrap">
<h1 class="page-title">저장한 게임</h1>
<p class="page-lead">저장한 게임, 최근 본 게임, 해 본 게임을 한곳에서 봐요. 로그인하면 다른 기기에서도 그대로 보여요.</p>
<div class="saved-tabs" role="tablist" aria-label="목록 고르기" data-saved-tabs>
<button type="button" role="tab" aria-selected="true" data-tab="saved">저장</button>
<button type="button" role="tab" aria-selected="false" data-tab="recent">최근 본</button>
<button type="button" role="tab" aria-selected="false" data-tab="played">해 본 게임</button>
<button type="button" role="tab" aria-selected="false" data-tab="want">하고 싶어요</button>
</div>
</div>
</section>
<section class="wrap list-sec" data-saved>
<noscript><p class="notice">저장한 게임은 자바스크립트를 켜야 볼 수 있어요.</p></noscript>
<div data-saved-body><div class="skel-grid"><div class="skel-card"></div><div class="skel-card"></div><div class="skel-card"></div></div></div>
<template data-empty="saved"><div class="state">${pic('dice-search', '', '')}<h2>아직 저장한 게임이 없어요</h2><p>게임 페이지에서 ‘저장’을 누르면 여기에 모여요.</p><a class="btn btn-main" href="/games/">게임 찾으러 가기</a></div></template>
<template data-empty="recent"><div class="state">${pic('dice-search', '', '')}<h2>아직 본 게임이 없어요</h2><p>게임 페이지를 열면 여기에 차례로 쌓여요. 보던 단계부터 이어서 볼 수 있어요.</p><a class="btn btn-main" href="/games/">게임 찾으러 가기</a></div></template>
<template data-empty="played"><div class="state">${pic('pawn-book', '', '')}<h2>해 본 게임을 체크해 보세요</h2><p>게임마다 ‘해 봤어요’를 누르면 나만의 보드게임 도감이 채워지고 배지도 받아요.</p><a class="btn btn-main" href="/account/">로그인하기</a></div></template>
<template data-empty="want"><div class="state">${pic('pawn-book', '', '')}<h2>하고 싶은 게임을 모아 보세요</h2><p>다음 모임에서 해 보고 싶은 게임에 ‘하고 싶어요’를 눌러 두면 여기서 바로 볼 수 있어요.</p><a class="btn btn-main" href="/games/">게임 찾으러 가기</a></div></template>
</section>`;
  return layout({ title: `저장한 게임 - ${cfg.siteName}`, description: '저장한 게임과 최근 본 게임, 해 본 게임을 모아 봐요.', path: '/saved/', body, noindex: true });
}

// ---------- 페이지: 제휴·문의 ----------
const INQUIRY_KINDS = { partner: '제휴·협업 제안', ad: '광고·입점 문의', store: '매장(공간) 등록·QR', game: '게임 설명 추가 요청', bug: '오류·불편 신고', etc: '그 밖의 문의' };
function contactPage() {
  const body = `<section class="page-head">
<div class="wrap page-head-grid">
<div>
<h1 class="page-title">제휴·문의</h1>
<p class="page-lead">출판사와 제작사, 보드게임카페와 파티룸, 교육기관, 브랜드라면 어떤 협업이든 편하게 제안해 주세요. 남겨 주신 이메일로 답을 드려요.</p>
</div>
${pic('fox-explain', '', 'page-art page-art-sq', true)}
</div>
</section>
<section class="wrap-narrow contact">
<ul class="contact-kinds">
<li><b>출판사·제작사</b><span>공식 설명 함께 만들기, 신작 하는 법 등록, 설명 고치기와 삭제 요청</span></li>
<li><b>매장·공간</b><span>보드게임카페, 파티룸, 펜션의 매장 QR과 게임 목록 등록</span></li>
<li><b>광고·입점</b><span>보드게임몰 입점, 기획전, 브랜드 협업</span></li>
<li><b>교육·기관</b><span>학교, 도서관, 돌봄 기관의 놀이 수업 자료</span></li>
</ul>
<form class="contact-form" data-contact novalidate>
<label class="field"><span>문의 종류</span><select name="kind" required><option value="">골라 주세요</option>${Object.entries(INQUIRY_KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
<div class="field-row">
<label class="field"><span>이름 또는 담당자 이름</span><input name="name" maxlength="40" required autocomplete="name"></label>
<label class="field"><span>회사·단체·매장 이름 (선택)</span><input name="org" maxlength="60" autocomplete="organization"></label>
</div>
<div class="field-row">
<label class="field"><span>답을 받을 이메일</span><input name="email" type="email" maxlength="120" required autocomplete="email" inputmode="email"></label>
<label class="field"><span>전화번호 (선택)</span><input name="phone" type="tel" maxlength="30" autocomplete="tel" inputmode="tel"></label>
</div>
<label class="field"><span>제목</span><input name="title" maxlength="80" placeholder="예: 신작 보드게임 하는 법 등록 문의"></label>
<label class="field"><span>내용</span><textarea name="message" rows="8" maxlength="3000" required placeholder="제안하고 싶은 내용, 일정, 참고할 주소 등을 적어 주세요."></textarea></label>
<div class="consent">
<p><b>개인정보 수집·이용 안내</b></p>
<ul class="list small">
<li>수집 항목: 이름, 이메일, 전화번호(선택), 회사·단체 이름(선택), 문의 내용</li>
<li>이용 목적: 문의 확인과 답변, 제휴 검토</li>
<li>보관 기간: 답변을 마친 날부터 1년 뒤 지워요. 제휴 계약으로 이어지면 계약 기간 동안 보관해요.</li>
<li>동의하지 않을 수 있지만, 그러면 문의를 받을 수 없어요. 자세한 내용은 <a href="/privacy/">개인정보처리방침</a>에 있어요.</li>
</ul>
<label class="check"><input type="checkbox" name="agree" required><span>개인정보 수집·이용에 동의해요 (필수)</span></label>
</div>
<label class="hp" aria-hidden="true">비워 두세요<input name="website" tabindex="-1" autocomplete="off"></label>
<p class="form-msg" role="status" aria-live="polite"></p>
<button type="submit" class="btn btn-main btn-block">문의 보내기</button>
</form>
<p class="muted small center">설명이 틀린 곳은 게임 페이지의 ‘틀린 곳 알려 주기’로 보내 주시면 더 빨리 고칠 수 있어요.</p>
</section>`;
  return layout({ title: `제휴·문의 - ${cfg.siteName}`, description: `${cfg.siteName}과 제휴, 협업, 광고, 매장 등록, 게임 추가를 원하시면 남겨 주세요. 이메일로 답을 드려요.`, path: '/contact/', body, scripts: ['community.js'] });
}

// ---------- 페이지: 약관, 개인정보처리방침, 커뮤니티 규칙 ----------
const officer = () => (cfg.privacyOfficer || cfg.privacyEmail
  ? `${cfg.privacyOfficer ? esc(cfg.privacyOfficer) : '운영자'}${cfg.privacyEmail ? ` (<a href="mailto:${esc(cfg.privacyEmail)}">${esc(cfg.privacyEmail)}</a>)` : ''}`
  : '운영자 (<a href="/contact/">제휴·문의</a> 페이지로 연락)');
function legalPage(p, title, desc, sections) {
  const body = `<section class="page-head"><div class="wrap-narrow">
<h1 class="page-title">${title}</h1>
<p class="muted">시행일 ${esc(cfg.policyDate)}</p>
</div></section>
<section class="wrap-narrow legal">
${sections.map(([h, html]) => `<h2 class="h2">${h}</h2>${html}`).join('\n')}
</section>`;
  return layout({ title: `${title} - ${cfg.siteName}`, description: desc, path: p, body });
}
const ul = (items) => `<ul class="list">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
function termsPage() {
  const op = cfg.operatorName ? esc(cfg.operatorName) : `${esc(cfg.siteName)} 운영자`;
  return legalPage('/terms/', '이용약관', `${cfg.siteName} 서비스 이용약관`, [
    ['1. 목적', `<p>이 약관은 ${op}(이하 ‘운영자’)가 제공하는 ${esc(cfg.siteName)}(${esc(SITE.replace(/^https?:\/\//, ''))}, 이하 ‘서비스’)를 이용할 때 운영자와 이용자 사이의 권리와 의무를 정해요.</p>`],
    ['2. 서비스 내용', ul(['보드게임과 전통놀이의 하는 법 설명, 테이블 모드, 매장 QR', '회원 커뮤니티: 모임, 정모·번개 일정, 자유게시판, 댓글', '보드게임몰: 쿠팡 파트너스를 통한 상품 연결(운영자가 직접 판매하지 않아요)', '제휴·문의 받기'])],
    ['3. 회원가입과 계정', ul(['만 14세 이상만 가입할 수 있어요.', '아이디와 비밀번호는 본인이 관리해요. 다른 사람에게 빌려주거나 팔 수 없어요.', '회원은 언제든 내 정보에서 탈퇴할 수 있어요. 탈퇴하면 계정 정보는 바로 지워지고, 이미 쓴 글과 댓글은 ‘탈퇴한 회원’ 이름으로 남아요. 지우고 싶은 글은 탈퇴 전에 직접 지워 주세요.'])],
    ['4. 게시물', ul(['회원이 쓴 글의 권리는 쓴 사람에게 있어요. 운영자는 서비스 안에서 보여 주고 검색에 노출하는 범위에서 쓸 수 있어요.', '다음 게시물은 알리지 않고 가리거나 지울 수 있어요: 욕설과 혐오 표현, 개인 정보 노출, 광고와 도배, 불법 정보, 다른 사람의 권리를 침해하는 글, 성적인 글, 미성년자에게 해로운 글.', '여러 회원이 신고한 글은 운영자가 확인하기 전까지 자동으로 가려질 수 있어요.'])],
    ['5. 모임과 오프라인 만남', ul(['모임과 정모·번개는 회원이 스스로 열고 참여해요. 운영자는 만남을 주최하거나 보증하지 않아요.', '만남에서 생긴 다툼, 사고, 금전 문제는 당사자끼리 해결해야 해요. 운영자는 신고를 받으면 게시물과 계정에 필요한 조치를 해요.', '회비를 받는 모임은 금액과 쓰는 곳을 미리 알려야 해요.'])],
    ['6. 이용 제한', `<p>약관이나 <a href="/community/rules/">커뮤니티 이용 규칙</a>을 어기면 글을 가리거나, 글쓰기를 막거나, 계정 이용을 멈출 수 있어요.</p>`],
    ['7. 구매 링크', `<p>보드게임몰과 게임 페이지의 구매 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 상품의 가격, 배송, 교환·환불은 판매처의 정책을 따라요.</p>`],
    ['8. 책임의 한계', ul(['게임 설명은 규칙을 우리 말로 다시 쓴 것이에요. 판과 지역에 따라 다를 수 있고, 상자 속 공식 룰북을 대신하지 않아요.', '운영자는 천재지변, 서비스 점검, 이용자의 잘못으로 생긴 손해에 책임지지 않아요.'])],
    ['9. 약관 바꾸기', `<p>약관을 바꿀 때는 시행 7일 전에 이 페이지에 알려요. 이용자에게 불리한 변경은 30일 전에 알려요.</p>`],
  ]);
}
function privacyPage() {
  return legalPage('/privacy/', '개인정보처리방침', `${cfg.siteName}이 어떤 개인정보를 왜 모으고 어떻게 지키는지 알려 드려요.`, [
    ['1. 모으는 정보와 목적', `<div class="table-wrap"><table class="ptable"><thead><tr><th>구분</th><th>항목</th><th>목적</th><th>보관 기간</th></tr></thead><tbody>
<tr><td>회원가입</td><td>아이디, 닉네임, 비밀번호(암호화해서 저장), 활동 지역(선택), 한 줄 소개(선택)</td><td>회원 확인, 커뮤니티 이용</td><td>탈퇴할 때까지</td></tr>
<tr><td>커뮤니티 이용</td><td>글, 댓글, 모임 가입과 일정 참여 기록</td><td>커뮤니티 서비스 제공</td><td>탈퇴하면 작성자 정보를 지우고 글은 ‘탈퇴한 회원’으로 남아요</td></tr>
<tr><td>제휴·문의</td><td>이름, 이메일, 전화번호(선택), 회사·단체 이름(선택), 문의 내용</td><td>문의 답변, 제휴 검토</td><td>답변 후 1년</td></tr>
<tr><td>틀린 곳 알려 주기</td><td>연락처(선택), 의견 내용</td><td>설명 고치기, 답변</td><td>처리 후 1년</td></tr>
<tr><td>부정 이용 막기</td><td>접속 IP를 날마다 바뀌는 방식으로 바꾼 값(원래 IP는 저장하지 않아요)</td><td>도배와 자동 가입 막기</td><td>2일</td></tr>
</tbody></table></div>`],
    ['2. 쿠키와 브라우저 저장', ul(['로그인 상태를 유지하려고 쿠키(rr_sid)를 써요. 30일 동안 쓰지 않으면 끝나요.', '글씨 크기, 체크한 구성물 같은 설정은 이용자의 브라우저에만 저장해요.', '이용 숫자는 날짜별 합계로만 세요. 누가 봤는지는 알 수 없어요.', '보드게임몰의 구매 버튼을 누르면 쿠팡으로 이동하고, 이후에는 쿠팡의 개인정보처리방침이 적용돼요.'])],
    ['3. 다른 곳에 주거나 맡기는 일', `<p>법에 따른 요청이 있을 때 말고는 개인정보를 다른 곳에 주지 않아요. 서비스 운영을 위해 아래 업체에 저장과 처리를 맡겨요.</p>
${ul(['Cloudflare, Inc. (미국): 웹사이트 호스팅, 데이터 저장(Cloudflare D1). 위 1번의 항목이 Cloudflare의 데이터센터에 저장되며, 이용자가 정보를 입력할 때 네트워크를 통해 옮겨져요. 보관 기간은 위 1번과 같아요.'])}`],
    ['4. 지우는 방법', `<p>보관 기간이 지나거나 목적을 이룬 정보는 바로 지워요. 데이터베이스의 기록은 복구할 수 없게 지워요.</p>`],
    ['5. 이용자의 권리', ul(['내 정보 페이지에서 닉네임, 지역, 소개를 고치고 탈퇴할 수 있어요.', '내 정보를 보거나 고치거나 지워 달라고 요청할 수 있어요. 아래 책임자에게 알려 주시면 10일 안에 처리해요.', '만 14세 미만은 회원가입을 받지 않아요.'])],
    ['6. 안전하게 지키는 방법', ul(['비밀번호는 되돌릴 수 없는 방식(PBKDF2)으로 바꿔 저장해요.', '모든 연결은 HTTPS로 암호화해요.', '운영 관리 화면은 관리자 비밀번호로만 들어갈 수 있어요.'])],
    ['7. 개인정보 보호책임자', `<p>${officer()}</p><p class="muted small">개인정보 침해 신고와 상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118)에서도 받을 수 있어요.</p>`],
    ['8. 바뀌는 경우', `<p>이 방침을 바꿀 때는 시행 7일 전에 이 페이지에 알려요.</p>`],
  ]);
}
function communityRulesPage() {
  return legalPage('/community/rules/', '커뮤니티 이용 규칙', `${cfg.siteName} 커뮤니티를 함께 쓰는 규칙이에요.`, [
    ['함께 지켜요', ul(['처음 보는 사람에게도 존댓말을 써요.', '게임을 못한다고, 규칙을 모른다고 핀잔 주지 않아요. 모두 처음이 있었어요.', '규칙 질문에는 아는 만큼 친절하게 답해 주세요. 판마다 다른 규칙이면 어떤 판인지 함께 적어 주세요.'])],
    ['이런 글은 가려요', ul(['욕설, 비하, 혐오 표현', '전화번호, 주소, 실명 같은 개인 정보 (내 것도, 남의 것도)', '모임과 상관없는 광고, 홍보, 같은 글 반복', '돈을 먼저 보내 달라는 글, 중고 거래 사기 의심 글', '이성 만남을 목적으로 한 모임 글', '성적인 글, 미성년자에게 해로운 글'])],
    ['모임을 열 때', ul(['날짜, 장소, 인원, 참가비를 분명하게 적어요. 참가비가 있다면 어디에 쓰는지도 적어요.', '공개된 장소에서 만나요. 보드게임카페, 스터디카페, 파티룸처럼 사람이 오가는 곳이 좋아요.', '일정이 바뀌거나 취소되면 바로 고치고 댓글로 알려 주세요.', '미성년자가 참여하는 모임은 보호자와 함께해요.'])],
    ['신고와 조치', ul(['글과 댓글 아래 ‘신고’를 누르면 운영자에게 알려져요.', '여러 회원이 신고한 글은 운영자가 보기 전까지 자동으로 가려져요.', '규칙을 여러 번 어기면 글쓰기를 막거나 계정 이용을 멈춰요.'])],
  ]);
}

// ---------- 페이지: 소개, 관리자, 404, 오프라인 ----------
function aboutPage() {
  const principles = [
    '설명은 ‘어떻게 이기나’와 ‘내 차례에 뭘 하나’부터 시작해요.',
    '모든 게임을 같은 틀로 써요. 한 게임을 익히면 다른 게임도 같은 자리에서 찾을 수 있어요.',
    '휴대폰을 테이블 위에 두고 보는 화면을 기준으로 만들어요.',
    '룰북 문장을 옮기지 않아요. 규칙을 우리 말로 다시 쓰고, 공식 자료와 맞춰 봐요.',
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
${pic('scene-phone', '테이블 위 휴대폰으로 규칙을 확인하는 모습', 'about-pic', true)}
<h2 class="h2">여섯 가지 원칙</h2>
<ol class="steps">${principles.map((x) => `<li>${x}</li>`).join('')}</ol>
<h2 class="h2">검수 표시 읽는 법</h2>
<ul class="list">
<li><b>검수 완료</b>: 그 게임을 잘 아는 사람이 실제로 해 보며 규칙을 확인했다는 뜻이에요. 확인한 날짜를 함께 적어요.</li>
<li><b>자료 대조 완료</b>: 공식 규칙서, 출판사 안내, 백과사전 같은 자료와 맞춰 본 설명이에요. 어떤 자료와 맞춰 봤는지 게임 페이지 아래에 적어요.</li>
<li><b>검수 중</b>: 아직 자료 대조나 다른 사람의 확인을 거치지 않았어요. 상자 속 룰북과 다르면 룰북을 따르고, 저희에게 알려 주세요.</li>
<li><b>하우스룰</b>: 공식 규칙은 아니지만 많이 쓰는 방법이에요. 시작 전에 쓸지 말지 정하세요.</li>
</ul>
<h2 class="h2">출판사와 제작사께</h2>
<p>${esc(cfg.siteName)}의 설명은 게임을 하는 방법을 우리 말과 우리 구성으로 다시 쓴 것이에요. 룰북 문장, 그림, 상자 이미지는 쓰지 않아요. 공식 설명을 함께 만들거나 고칠 곳이 있다면 알려 주세요. 삭제를 요청하시면 바로 내리고 협의할게요.</p>
<h2 class="h2">룰룰 친구들</h2>
<ul class="crew crew-wrap">
${CREW.map(([im, nm, role, line]) => `<li><span class="crew-card">${pic(im, '', 'crew-pic')}<span class="crew-name">${nm}</span><span class="crew-role">${role}</span><span class="crew-line">${line}</span></span></li>`).join('')}
</ul>
<div class="row-btns"><a class="btn btn-main" href="/contact/">제휴·문의하기</a><button type="button" class="btn btn-sub" data-report="">의견 보내기</button>${cfg.contactEmail ? `<a class="btn btn-ghost" href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a>` : ''}</div>
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
<button role="tab" aria-selected="false" aria-controls="a-inq" id="t-inq">문의함</button>
<button role="tab" aria-selected="false" aria-controls="a-shop" id="t-shop">쇼핑 링크</button>
<button role="tab" aria-selected="false" aria-controls="a-cm" id="t-cm">커뮤니티</button>
</div>
<div class="panel" id="a-reports" role="tabpanel" aria-labelledby="t-reports"></div>
<div class="panel" id="a-stats" role="tabpanel" aria-labelledby="t-stats"></div>
<div class="panel" id="a-content" role="tabpanel" aria-labelledby="t-content"></div>
<div class="panel" id="a-inq" role="tabpanel" aria-labelledby="t-inq"></div>
<div class="panel" id="a-shop" role="tabpanel" aria-labelledby="t-shop"></div>
<div class="panel" id="a-cm" role="tabpanel" aria-labelledby="t-cm"></div>
</div>
</section>`;
  return layout({ title: `운영 관리 - ${cfg.siteName}`, description: '운영 관리 화면', path: '/admin/', body, noindex: true, scripts: ['admin.js'] });
}

function notFoundPage() {
  const body = `<section class="page-head"><div class="wrap">
${pic('dice-think', '', 'state-pic', true)}
<h1 class="page-title">찾는 페이지가 없어요</h1>
<p class="page-lead">주소가 바뀌었거나 아직 만들지 않은 게임일 수 있어요. 게임 이름으로 다시 찾아보세요.</p>
<form class="search-box" action="/games/" role="search"><label class="sr" for="nf-q">게임 이름으로 찾기</label>${icon('i-search')}<input id="nf-q" name="q" type="search" placeholder="게임 이름이나 초성으로 찾기"><button class="btn btn-main" type="submit">찾기</button></form>
<p class="center"><a class="btn btn-sub" href="/">처음 화면으로</a></p>
</div></section>`;
  return layout({ title: `페이지를 찾을 수 없어요 - ${cfg.siteName}`, description: '찾는 페이지가 없어요.', path: '/404', body, noindex: true });
}

function offlinePage() {
  const body = `<section class="page-head"><div class="wrap">
${pic('tick-wait', '', 'state-pic', true)}
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

// 등급과 배지 자료: 서버(server/growth-data.js)와 같은 것을 화면에서도 써요
write('assets/js/growth.js', `/* 룰룰 등급·배지 (server/growth-data.js에서 만들어져요. 직접 고치지 마세요) */
(function () {
var LEVELS = ${JSON.stringify(GROW_LEVELS)};
var RULES = ${JSON.stringify(GROW_RULES)};
var BADGES = ${JSON.stringify(GROW_BADGES)};
var levelOf = ${levelOf.toString()};
var glyph = ${glyph.toString()};
var emblemSVG = ${emblemSVG.toString()};
var badgeSVG = ${badgeSVG.toString()};
var BY = {}; BADGES.forEach(function (b) { BY[b.key] = b; });
window.RRG = {
  LEVELS: LEVELS, RULES: RULES, BADGES: BADGES, BY: BY,
  level: function (xp) { return levelOf(xp || 0, LEVELS); },
  emblem: function (info, size) { return emblemSVG(info, size, glyph); },
  badge: function (b, size, locked) { return badgeSVG(b, size, locked, glyph); },
  glyph: glyph
};
})();
`);
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
write('rules/index.html', rulesPage());
write('shop/index.html', shopPage());
for (const [f, html] of communityPages()) write(f, html);
write('contact/index.html', contactPage());
write('community/levels/index.html', levelsPage());
write('saved/index.html', savedPage());
write('terms/index.html', termsPage());
write('privacy/index.html', privacyPage());
write('community/rules/index.html', communityRulesPage());
// 네이버 사이트 소유 확인 파일 (함수가 먼저 답하지만, 정적 파일도 함께 둬요)
write('naver166f723b5ee950517c79af0092638755.html', 'naver-site-verification: naver166f723b5ee950517c79af0092638755.html');
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
// 구매 버튼(/go/)이 읽는 상품 목록: id -> 이름, 쿠팡 검색어, 고정 링크
write('data/shop.json', JSON.stringify({ build: BUILD, items: Object.fromEntries(Object.entries(SHOP.items).map(([id, it]) => [id, { n: it.name, q: it.q, u: it.url || '', g: it.game || '' }])) }));

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

const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const gameDay = (g) => (g.checked && g.checked.date) || (g.reviewed && g.reviewed.date) || today;
const urls = [
  ['/', 'daily', '1.0'], ['/games/', 'weekly', '0.9'], ['/rules/', 'weekly', '0.9'], ['/traditional/', 'weekly', '0.8'], ['/shop/', 'weekly', '0.7'],
  ['/community/', 'daily', '0.6'], ['/community/events/', 'daily', '0.5'], ['/community/clubs/', 'daily', '0.5'], ['/community/board/', 'daily', '0.5'], ['/community/rank/', 'daily', '0.4'], ['/community/levels/', 'monthly', '0.4'],
  ['/learn/', 'monthly', '0.6'], ['/space/', 'monthly', '0.5'], ['/about/', 'monthly', '0.4'], ['/contact/', 'yearly', '0.4'],
  ['/terms/', 'yearly', '0.2'], ['/privacy/', 'yearly', '0.2'], ['/community/rules/', 'yearly', '0.2'],
  ...games.map((g) => [`/games/${g.slug}/`, 'weekly', '0.9', gameDay(g)]),
  ...content.collections.map((c) => [`/collections/${c.slug}/`, 'weekly', '0.7']),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, f, pr, d]) => `<url><loc>${abs(u)}</loc><lastmod>${d || today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /go/
Disallow: /space/view/
Disallow: /account/
Disallow: /community/write/

User-agent: Yeti
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /go/
Disallow: /account/
Disallow: /community/write/

Sitemap: ${abs('/sitemap.xml')}
Sitemap: ${abs('/rss.xml')}
`);
// 네이버 서치어드바이저에 제출하는 RSS (게임 페이지 전체)
const rfc822 = (d) => new Date(`${d}T09:00:00+09:00`).toUTCString();
const xesc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
write('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xesc(cfg.siteTitle)}</title>
<link>${abs('/')}</link>
<description>${xesc(cfg.description)}</description>
<language>ko</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml"/>
${[...games].sort((a, b) => gameDay(b).localeCompare(gameDay(a)) || collator.compare(a.name, b.name)).map((g) => { const so = seoOf(g); return `<item>
<title>${xesc(`${so.n} 하는법·룰 총정리 | ${so.hooks.join('·')}`)}</title>
<link>${abs(`/games/${g.slug}/`)}</link>
<guid isPermaLink="true">${abs(`/games/${g.slug}/`)}</guid>
<category>${xesc(GROUPS[g.group])}</category>
<description>${xesc(`${so.n} 하는법과 룰. ${plain(g.oneLine)} ${playersText(g.players)}, ${minutesText(g.minutes)}. 이기는 법: ${plain(g.summary.goal)}`)}</description>
<pubDate>${rfc822(gameDay(g))}</pubDate>
</item>`; }).join('\n')}
</channel>
</rss>
`);

console.log(`완료: 게임 ${games.length}개, 묶음 ${content.collections.length}개, 상품 ${Object.keys(SHOP.items).length}개, 사이트맵 주소 ${urls.length}개를 public/에 만들었어요. (빌드 ${BUILD})`);
