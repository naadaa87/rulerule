// 방문 통계와 운영 지표(KPI)
// - 모으는 것: 무작위 방문자 번호(브라우저에 저장), 방문 번호, 본 페이지, 머문 시간, 스크롤 정도,
//   들어온 경로(이전 사이트 주소와 검색어), 기기 종류, 접속 국가. 이름·IP·로그인 정보는 모으지 않아요.
// - 원본 기록은 400일 지나면 지워요.
import { json, fail, readBody, clip, oneLine, nowIso } from './util.js';

const KEEP_DAYS = 400;
const MAX_DUR = 1800; // 한 페이지 체류 시간은 30분까지만 셈

export const BOT_UA = /bot|crawl|spider|slurp|yeti|daumoa|bingpreview|headless|lighthouse|pagespeed|gtmetrix|python|curl|wget|httpclient|okhttp|axios|node-fetch|go-http|java\/|facebookexternalhit|kakaotalk-scrap|twitterbot|slackbot|discordbot|telegrambot|whatsapp|preview|monitor|uptime|pingdom|semrush|ahrefs|mj12/i;
export const isBot = (request) => {
  const ua = request.headers.get('user-agent') || '';
  return !ua || BOT_UA.test(ua);
};

// 한국 시간
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3);
const dayOf = (d) => kst(d).toISOString().slice(0, 10);
const hourOf = (d) => kst(d).getUTCHours();
const addDays = (day, n) => new Date(Date.parse(day + 'T00:00:00Z') + n * 86400e3).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400e3) + 1;
// 한국 날짜의 시작 시각을 UTC ISO로 (회원·글 표의 created_at은 UTC)
const kstStartIso = (day) => new Date(Date.parse(day + 'T00:00:00Z') - 9 * 3600e3).toISOString();

const ID = /^[a-z0-9]{6,24}$/;
const cleanId = (s) => (ID.test(String(s || '')) ? String(s) : '');

// 페이지 종류
export function pageKind(path) {
  let m;
  if (path === '/') return ['home', ''];
  if ((m = path.match(/^\/games\/([a-z0-9-]+)\/$/))) return ['game', m[1]];
  if (path === '/games/') return ['games', ''];
  if ((m = path.match(/^\/collections\/([a-z0-9-]+)\/$/))) return ['collection', m[1]];
  if (path.startsWith('/shop/')) return ['shop', ''];
  if (path.startsWith('/community/')) return ['community', ''];
  if (path.startsWith('/rules/')) return ['rules', ''];
  if (path.startsWith('/traditional/')) return ['traditional', ''];
  if (path.startsWith('/learn/')) return ['learn', ''];
  if (path.startsWith('/space/')) return ['space', ''];
  if (path.startsWith('/saved/')) return ['saved', ''];
  if (path.startsWith('/account/')) return ['account', ''];
  if (/^\/(about|privacy|terms|contact)\//.test(path)) return ['info', ''];
  return ['other', ''];
}

// 들어온 경로 나누기
export function channelOf(refHost, utmSource, ua, qr, ownHost) {
  const h = String(refHost || '').toLowerCase();
  if (qr) return 'qr';
  if (utmSource) return 'campaign';
  if (h && ownHost && (h === ownHost || h.endsWith('.' + ownHost.replace(/^www\./, '')) || h === ownHost.replace(/^www\./, ''))) return 'internal';
  if (/(^|\.)naver\.com$|naver\.me$/.test(h)) return /blog|cafe|post|in\.naver/.test(h) ? 'naver-community' : 'naver';
  if (/(^|\.)google\./.test(h)) return 'google';
  if (/(^|\.)(daum\.net|kakao\.com)$/.test(h)) return 'daum';
  if (/(^|\.)(bing\.com|zum\.com|yahoo\.|duckduckgo\.com|ecosia\.org)/.test(h)) return 'search-other';
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(h)) return 'youtube';
  if (/(^|\.)(instagram\.com|facebook\.com|threads\.net|threads\.com|x\.com|t\.co|twitter\.com|tiktok\.com|band\.us)$/.test(h)) return 'social';
  if (h) return 'referral';
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk';
  if (/Instagram|FBAN|FBAV|Threads/i.test(ua)) return 'social';
  if (/NAVER\(inapp|NAVER\//.test(ua)) return 'naver';
  return 'direct';
}

// ---------- 모으기 ----------
export async function collect(request, env, body) {
  if (isBot(request)) return;
  const db = env.DB;
  const now = new Date();
  const day = dayOf(now);
  const vid = cleanId(body.vid), sid = cleanId(body.sid);
  if (body.t === 'pv') {
    const id = cleanId(body.id);
    let path = clip(body.p, 200);
    if (!id || !vid || !sid || !path.startsWith('/') || path.startsWith('/admin')) return;
    path = path.replace(/\/index\.html$/, '/');
    const [kind, slug] = pageKind(path);
    const ua = request.headers.get('user-agent') || '';
    const refHost = oneLine(body.r, 80).toLowerCase().replace(/[^a-z0-9.-]/g, '');
    const utm = oneLine(body.u, 120);
    const en = body.en ? 1 : 0;
    const ownHost = new URL(request.url).host;
    const ch = en ? channelOf(refHost, utm.split('/')[0], ua, !!body.qr, ownHost) : '';
    const dev = ['m', 't', 'd'].includes(body.d) ? body.d : 'd';
    const cc = String((request.cf && request.cf.country) || '').slice(0, 2);
    await db.prepare(`INSERT OR IGNORE INTO pv (id, ts, day, hr, vid, sid, path, kind, slug, en, nv, ch, ref, kw, utm, dev, cc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, now.toISOString(), day, hourOf(now), vid, sid, path, kind, slug, en, body.nv ? 1 : 0, ch, en ? refHost : '', en ? oneLine(body.q, 60) : '', en ? utm : '', dev, cc).run();
    if (Math.random() < 0.005) await purge(db, day);
    return;
  }
  if (body.t === 'end') {
    const id = cleanId(body.id);
    if (!id || !vid) return;
    const dur = Math.min(Math.max(Math.round(Number(body.dur) || 0), 0), MAX_DUR);
    const dep = Math.min(Math.max(Math.round(Number(body.dep) || 0), 0), 100);
    await db.prepare('UPDATE pv SET dur = MAX(dur, ?), dep = MAX(dep, ?) WHERE id = ? AND vid = ?').bind(dur, dep, id, vid).run();
    return;
  }
  // 그 밖의 행동 (검색, 테이블 모드, 소리 내 읽기, 링크 보내기 등)
  const t = String(body.t || '');
  if (!/^[a-z-]{2,20}$/.test(t) || t === 'view') return; // 게임 페이지 열람은 pv로 세요
  const k = t === 'search' ? oneLine(body.k, 40).toLowerCase() : oneLine(body.s || body.k, 60);
  if (t === 'search' && !k) return;
  await db.prepare('INSERT INTO ev (ts, day, vid, sid, t, k, n) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(now.toISOString(), day, vid, sid, t, k, Math.max(0, Math.min(9999, Math.round(Number(body.n) || 0)))).run();
}

// /go 구매 버튼 눌림 기록
export async function logClick(request, env, item, src) {
  if (isBot(request)) return;
  const u = new URL(request.url);
  const now = new Date();
  let path = clip(u.searchParams.get('pg'), 200);
  if (!path.startsWith('/')) path = '';
  const [kind, slug] = path ? pageKind(path) : ['', ''];
  await env.DB.prepare('INSERT INTO clk (ts, day, hr, vid, sid, item, src, path, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(now.toISOString(), dayOf(now), hourOf(now), cleanId(u.searchParams.get('vi')), cleanId(u.searchParams.get('si')), item, src, path, kind === 'game' ? slug : '').run();
}

async function purge(db, day) {
  const cut = addDays(day, -KEEP_DAYS);
  await db.batch([
    db.prepare('DELETE FROM pv WHERE day < ?').bind(cut),
    db.prepare('DELETE FROM clk WHERE day < ?').bind(cut),
    db.prepare('DELETE FROM ev WHERE day < ?').bind(cut),
  ]);
}

// ---------- 지표 ----------
function range(url) {
  const today = dayOf(new Date());
  const ok = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  let to = ok(url.searchParams.get('to')) ? url.searchParams.get('to') : today;
  let from = ok(url.searchParams.get('from')) ? url.searchParams.get('from') : addDays(to, -6);
  if (from > to) [from, to] = [to, from];
  if (daysBetween(from, to) > 400) from = addDays(to, -399);
  const n = daysBetween(from, to);
  return { from, to, n, pfrom: addDays(from, -n), pto: addDays(from, -1), today };
}

// 기간 하나의 핵심 숫자
async function totals(db, from, to) {
  const [a, b, c, d, e, f, g] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv, COUNT(DISTINCT sid) AS ses,
        COUNT(DISTINCT CASE WHEN nv = 1 THEN vid END) AS nuv,
        AVG(CASE WHEN dur > 0 THEN dur END) AS dur,
        COUNT(CASE WHEN kind = 'game' THEN 1 END) AS gpv,
        COUNT(DISTINCT CASE WHEN kind = 'game' THEN sid END) AS gses
      FROM pv WHERE day BETWEEN ? AND ?`).bind(from, to),
    db.prepare(`SELECT COUNT(*) AS n, AVG(t) AS t FROM (SELECT sid, COUNT(*) AS c, SUM(dur) AS t FROM pv WHERE day BETWEEN ? AND ? GROUP BY sid)`).bind(from, to),
    db.prepare(`SELECT COUNT(*) AS n FROM (SELECT p.sid FROM pv p WHERE p.day BETWEEN ? AND ? GROUP BY p.sid HAVING COUNT(*) = 1)
      WHERE sid NOT IN (SELECT sid FROM clk WHERE day BETWEEN ? AND ? AND sid != '')`).bind(from, to, from, to),
    db.prepare(`SELECT COUNT(*) AS n, COUNT(CASE WHEN sid != '' THEN 1 END) AS js, COUNT(DISTINCT CASE WHEN sid != '' THEN sid END) AS ses, COUNT(DISTINCT CASE WHEN vid != '' THEN vid END) AS uv,
        COUNT(CASE WHEN slug != '' THEN 1 END) AS game FROM clk WHERE day BETWEEN ? AND ?`).bind(from, to),
    db.prepare('SELECT COUNT(*) AS days, SUM(clicks) AS clicks, SUM(orders) AS orders, SUM(gmv) AS gmv, SUM(commission) AS commission, SUM(cancels) AS cancels FROM cp_daily WHERE day BETWEEN ? AND ?').bind(from, to),
    db.prepare("SELECT COUNT(*) AS n FROM users WHERE status NOT IN ('system') AND created_at >= ? AND created_at < ?").bind(kstStartIso(from), kstStartIso(addDays(to, 1))),
    db.prepare(`SELECT
        (SELECT COUNT(*) FROM reviews WHERE created_at >= ?1 AND created_at < ?2) AS reviews,
        (SELECT COUNT(*) FROM posts WHERE created_at >= ?1 AND created_at < ?2 AND cat != 'notice' AND user_id NOT IN (SELECT id FROM users WHERE status = 'system')) AS posts,
        (SELECT COUNT(*) FROM comments WHERE created_at >= ?1 AND created_at < ?2) AS comments`).bind(kstStartIso(from), kstStartIso(addDays(to, 1))),
  ]);
  const p = a.results[0] || {}, s = b.results[0] || {}, k = d.results[0] || {}, cp = e.results[0] || {}, cm = g.results[0] || {};
  const ses = p.ses || 0;
  return {
    pv: p.pv || 0, uv: p.uv || 0, ses, newUv: p.nuv || 0,
    dur: Math.round(p.dur || 0), sesDur: Math.round(s.t || 0),
    pps: ses ? +(p.pv / ses).toFixed(2) : 0,
    bounce: ses ? +((c.results[0].n || 0) / ses * 100).toFixed(1) : 0,
    gamePv: p.gpv || 0, gameSes: p.gses || 0,
    clicks: k.n || 0, clicksJs: k.js || 0, clickSes: k.ses || 0, clickUv: k.uv || 0, gameClicks: k.game || 0,
    ctr: ses ? +((k.ses || 0) / ses * 100).toFixed(2) : 0,
    cpDays: cp.days || 0, cpClicks: cp.clicks || 0, orders: cp.orders || 0, gmv: cp.gmv || 0, commission: cp.commission || 0, cancels: cp.cancels || 0,
    cvr: (cp.days && k.n) ? +((cp.orders || 0) / k.n * 100).toFixed(2) : null,
    signups: (f.results[0] && f.results[0].n) || 0,
    reviews: cm.reviews || 0, posts: cm.posts || 0, comments: cm.comments || 0,
  };
}

async function daily(db, from, to) {
  const [a, b, c] = await db.batch([
    db.prepare('SELECT day, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv, COUNT(DISTINCT sid) AS ses FROM pv WHERE day BETWEEN ? AND ? GROUP BY day').bind(from, to),
    db.prepare('SELECT day, COUNT(*) AS clicks FROM clk WHERE day BETWEEN ? AND ? GROUP BY day').bind(from, to),
    db.prepare('SELECT day, orders, gmv, commission, clicks AS cpClicks FROM cp_daily WHERE day BETWEEN ? AND ?').bind(from, to),
  ]);
  const map = {};
  for (let d = from; d <= to; d = addDays(d, 1)) map[d] = { day: d, pv: 0, uv: 0, ses: 0, clicks: 0, orders: null, gmv: null, commission: null, cpClicks: null };
  for (const r of a.results) Object.assign(map[r.day] || {}, r);
  for (const r of b.results) if (map[r.day]) map[r.day].clicks = r.clicks;
  for (const r of c.results) if (map[r.day]) Object.assign(map[r.day], r);
  return Object.values(map);
}

const top = (db, sql, ...args) => db.prepare(sql).bind(...args);

export async function kpi(request, env, parts) {
  const db = env.DB;
  const url = new URL(request.url);
  const [part] = parts;
  const r = range(url);

  if (part === 'summary') {
    const [cur, prev, days] = await Promise.all([totals(db, r.from, r.to), totals(db, r.pfrom, r.pto), daily(db, r.from, r.to)]);
    const [games, pages, chans] = await db.batch([
      top(db, `SELECT slug, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv FROM pv WHERE day BETWEEN ? AND ? AND kind = 'game' GROUP BY slug ORDER BY pv DESC LIMIT 5`, r.from, r.to),
      top(db, 'SELECT path, COUNT(*) AS pv FROM pv WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY pv DESC LIMIT 5', r.from, r.to),
      top(db, "SELECT ch, COUNT(*) AS ses FROM pv WHERE day BETWEEN ? AND ? AND en = 1 GROUP BY ch ORDER BY ses DESC LIMIT 6", r.from, r.to),
    ]);
    return json({ ok: true, range: r, cur, prev, days, games: games.results, pages: pages.results, channels: chans.results });
  }

  if (part === 'content') {
    const [pages, games, gclk, gev, rev, land] = await db.batch([
      top(db, `SELECT path, kind, slug, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv, AVG(CASE WHEN dur > 0 THEN dur END) AS dur, AVG(CASE WHEN dep > 0 THEN dep END) AS dep, SUM(en) AS entries
        FROM pv WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY pv DESC LIMIT 100`, r.from, r.to),
      top(db, `SELECT slug, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv, COUNT(DISTINCT sid) AS ses, AVG(CASE WHEN dur > 0 THEN dur END) AS dur,
          COUNT(CASE WHEN dep >= 90 THEN 1 END) * 100.0 / COUNT(*) AS done
        FROM pv WHERE day BETWEEN ? AND ? AND kind = 'game' GROUP BY slug ORDER BY pv DESC`, r.from, r.to),
      top(db, `SELECT slug, COUNT(*) AS clicks, COUNT(DISTINCT sid) AS ses FROM clk WHERE day BETWEEN ? AND ? AND slug != '' GROUP BY slug`, r.from, r.to),
      top(db, `SELECT k AS slug, t, COUNT(*) AS n FROM ev WHERE day BETWEEN ? AND ? AND t IN ('table', 'speak', 'share', 'qr') GROUP BY k, t`, r.from, r.to),
      top(db, 'SELECT slug, COUNT(*) AS n, AVG(rating) AS rating FROM reviews WHERE hidden = 0 GROUP BY slug'),
      top(db, `SELECT l.path, COUNT(*) AS entries, SUM(CASE WHEN s.c = 1 THEN 1 ELSE 0 END) AS single
        FROM pv l JOIN (SELECT sid, COUNT(*) AS c FROM pv WHERE day BETWEEN ? AND ? GROUP BY sid) s ON s.sid = l.sid
        WHERE l.day BETWEEN ? AND ? AND l.en = 1 GROUP BY l.path ORDER BY entries DESC LIMIT 30`, r.from, r.to, r.from, r.to),
    ]);
    return json({ ok: true, range: r, pages: pages.results, games: games.results, gameClicks: gclk.results, gameEvents: gev.results, reviews: rev.results, landing: land.results });
  }

  if (part === 'traffic') {
    const [ch, refs, kws, utm, dev, hours, cc, nv] = await db.batch([
      top(db, `SELECT e.ch, COUNT(*) AS ses, COUNT(DISTINCT e.vid) AS uv, SUM(CASE WHEN s.c = 1 THEN 1 ELSE 0 END) AS single, SUM(CASE WHEN k.sid IS NOT NULL THEN 1 ELSE 0 END) AS buyers
        FROM pv e JOIN (SELECT sid, COUNT(*) AS c FROM pv WHERE day BETWEEN ? AND ? GROUP BY sid) s ON s.sid = e.sid
        LEFT JOIN (SELECT DISTINCT sid FROM clk WHERE day BETWEEN ? AND ? AND sid != '') k ON k.sid = e.sid
        WHERE e.day BETWEEN ? AND ? AND e.en = 1 GROUP BY e.ch ORDER BY ses DESC`, r.from, r.to, r.from, r.to, r.from, r.to),
      top(db, "SELECT ref, COUNT(*) AS ses FROM pv WHERE day BETWEEN ? AND ? AND en = 1 AND ref != '' AND ch != 'internal' GROUP BY ref ORDER BY ses DESC LIMIT 30", r.from, r.to),
      top(db, "SELECT kw, ch, COUNT(*) AS ses FROM pv WHERE day BETWEEN ? AND ? AND en = 1 AND kw != '' GROUP BY kw, ch ORDER BY ses DESC LIMIT 30", r.from, r.to),
      top(db, "SELECT utm, COUNT(*) AS ses FROM pv WHERE day BETWEEN ? AND ? AND en = 1 AND utm != '' GROUP BY utm ORDER BY ses DESC LIMIT 30", r.from, r.to),
      top(db, 'SELECT dev, COUNT(DISTINCT sid) AS ses, COUNT(*) AS pv FROM pv WHERE day BETWEEN ? AND ? GROUP BY dev', r.from, r.to),
      top(db, 'SELECT hr, COUNT(*) AS pv, COUNT(DISTINCT sid) AS ses FROM pv WHERE day BETWEEN ? AND ? GROUP BY hr', r.from, r.to),
      top(db, "SELECT cc, COUNT(DISTINCT sid) AS ses FROM pv WHERE day BETWEEN ? AND ? GROUP BY cc ORDER BY ses DESC LIMIT 12", r.from, r.to),
      top(db, 'SELECT SUM(nv) AS nv, COUNT(*) AS n FROM (SELECT vid, MAX(nv) AS nv FROM pv WHERE day BETWEEN ? AND ? GROUP BY vid)', r.from, r.to),
    ]);
    return json({ ok: true, range: r, channels: ch.results, refs: refs.results, keywords: kws.results, utm: utm.results, devices: dev.results, hours: hours.results, countries: cc.results, visitors: nv.results[0] || {} });
  }

  if (part === 'shop') {
    const [items, src, cp, shopPage, shopClicks, lastCp] = await db.batch([
      top(db, "SELECT item, COUNT(*) AS clicks, COUNT(DISTINCT CASE WHEN vid != '' THEN vid END) AS uv FROM clk WHERE day BETWEEN ? AND ? GROUP BY item ORDER BY clicks DESC", r.from, r.to),
      top(db, "SELECT CASE WHEN slug != '' THEN 'game' WHEN src = '' THEN 'unknown' ELSE src END AS src, COUNT(*) AS clicks FROM clk WHERE day BETWEEN ? AND ? GROUP BY 1 ORDER BY clicks DESC", r.from, r.to),
      top(db, 'SELECT * FROM cp_daily WHERE day BETWEEN ? AND ? ORDER BY day DESC', r.from, r.to),
      top(db, "SELECT COUNT(*) AS pv, COUNT(DISTINCT sid) AS ses FROM pv WHERE day BETWEEN ? AND ? AND kind = 'shop'", r.from, r.to),
      top(db, "SELECT COUNT(*) AS n, COUNT(DISTINCT sid) AS ses FROM clk WHERE day BETWEEN ? AND ? AND path LIKE '/shop/%'", r.from, r.to),
      db.prepare('SELECT MAX(day) AS day FROM cp_daily'),
    ]);
    const t = await totals(db, r.from, r.to);
    return json({ ok: true, range: r, items: items.results, sources: src.results, cp: cp.results, totals: t, shopPage: shopPage.results[0], shopClicks: shopClicks.results[0], lastCp: lastCp.results[0].day || '', api: !!(env.COUPANG_ACCESS_KEY && env.COUPANG_SECRET_KEY) });
  }

  if (part === 'engage') {
    const [search, zero, feats, mk, cmt] = await db.batch([
      top(db, "SELECT k, COUNT(*) AS n, MIN(n) AS minRes FROM ev WHERE day BETWEEN ? AND ? AND t = 'search' GROUP BY k ORDER BY n DESC LIMIT 40", r.from, r.to),
      top(db, "SELECT k, COUNT(*) AS n FROM ev WHERE day BETWEEN ? AND ? AND t = 'search' AND n = 0 GROUP BY k ORDER BY n DESC LIMIT 40", r.from, r.to),
      top(db, "SELECT t, COUNT(*) AS n, COUNT(DISTINCT CASE WHEN vid != '' THEN vid END) AS uv FROM ev WHERE day BETWEEN ? AND ? AND t != 'search' GROUP BY t ORDER BY n DESC", r.from, r.to),
      top(db, 'SELECT kind, COUNT(*) AS n FROM marks WHERE created_at >= ? AND created_at < ? GROUP BY kind', kstStartIso(r.from), kstStartIso(addDays(r.to, 1))),
      top(db, `SELECT
          (SELECT COUNT(*) FROM users WHERE status NOT IN ('system') AND created_at >= ?1 AND created_at < ?2) AS signups,
          (SELECT COUNT(DISTINCT user_id) FROM points WHERE created_at >= ?1 AND created_at < ?2) AS active,
          (SELECT COUNT(*) FROM reviews WHERE created_at >= ?1 AND created_at < ?2) AS reviews,
          (SELECT COUNT(*) FROM posts WHERE created_at >= ?1 AND created_at < ?2 AND cat != 'notice' AND user_id NOT IN (SELECT id FROM users WHERE status = 'system')) AS posts,
          (SELECT COUNT(*) FROM comments WHERE created_at >= ?1 AND created_at < ?2) AS comments,
          (SELECT COUNT(*) FROM poll_votes WHERE created_at >= ?1 AND created_at < ?2) AS votes,
          (SELECT COUNT(*) FROM event_members WHERE created_at >= ?1 AND created_at < ?2) AS joins,
          (SELECT COUNT(*) FROM users WHERE status = 'ok') AS members`, kstStartIso(r.from), kstStartIso(addDays(r.to, 1))),
    ]);
    return json({ ok: true, range: r, search: search.results, zero: zero.results, features: feats.results, marks: mk.results, community: cmt.results[0] || {} });
  }

  if (part === 'live') {
    const since5 = new Date(Date.now() - 5 * 60e3).toISOString(), since30 = new Date(Date.now() - 30 * 60e3).toISOString();
    const [a, b, c, d] = await db.batch([
      top(db, 'SELECT COUNT(DISTINCT vid) AS v5 FROM pv WHERE ts > ?', since5),
      top(db, 'SELECT COUNT(DISTINCT vid) AS v30, COUNT(*) AS pv30 FROM pv WHERE ts > ?', since30),
      top(db, 'SELECT path, COUNT(DISTINCT vid) AS uv FROM pv WHERE ts > ? GROUP BY path ORDER BY uv DESC LIMIT 15', since30),
      top(db, 'SELECT ts, item, src, path FROM clk WHERE ts > ? ORDER BY ts DESC LIMIT 20', new Date(Date.now() - 24 * 3600e3).toISOString()),
    ]);
    const recent = await db.prepare('SELECT ts, path, ch, dev, en FROM pv ORDER BY ts DESC LIMIT 20').all();
    return json({ ok: true, now: nowIso(), v5: a.results[0].v5 || 0, v30: b.results[0].v30 || 0, pv30: b.results[0].pv30 || 0, pages: c.results, clicks: d.results, recent: recent.results });
  }

  if (part === 'dash') {
    const today = r.today, yday = addDays(today, -1);
    const [t, y, days] = await Promise.all([totals(db, today, today), totals(db, yday, yday), daily(db, addDays(today, -13), today)]);
    const [rep, inq, flg, cpLast, games] = await db.batch([
      db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'new'"),
      db.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE status = 'new'"),
      db.prepare("SELECT COUNT(DISTINCT target || ':' || target_id) AS n FROM flags WHERE status = 'new'"),
      db.prepare('SELECT MAX(day) AS day FROM cp_daily'),
      top(db, "SELECT slug, COUNT(*) AS pv FROM pv WHERE day >= ? AND kind = 'game' GROUP BY slug ORDER BY pv DESC LIMIT 5", addDays(today, -6)),
    ]);
    const live = await db.prepare('SELECT COUNT(DISTINCT vid) AS n FROM pv WHERE ts > ?').bind(new Date(Date.now() - 5 * 60e3).toISOString()).first();
    const firstPv = await db.prepare('SELECT MIN(day) AS day FROM pv').first();
    return json({
      ok: true, today, t, y, days, live: (live && live.n) || 0, games: games.results,
      todo: { reports: rep.results[0].n, inquiries: inq.results[0].n, flags: flg.results[0].n },
      cpLast: cpLast.results[0].day || '', since: (firstPv && firstPv.day) || '',
    });
  }

  // CSV 내려받기
  if (part === 'csv') {
    const kind = url.searchParams.get('kind') || 'daily';
    let rows = [];
    if (kind === 'daily') {
      rows = [['날짜', '방문자', '방문', '페이지뷰', '구매 버튼 클릭', '쿠팡 클릭', '쿠팡 주문', '구매액', '수익']].concat(
        (await daily(db, r.from, r.to)).map((d) => [d.day, d.uv, d.ses, d.pv, d.clicks, d.cpClicks ?? '', d.orders ?? '', d.gmv ?? '', d.commission ?? '']));
    } else if (kind === 'pages') {
      const { results } = await db.prepare('SELECT path, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv, ROUND(AVG(CASE WHEN dur > 0 THEN dur END)) AS dur, ROUND(AVG(CASE WHEN dep > 0 THEN dep END)) AS dep, SUM(en) AS entries FROM pv WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY pv DESC').bind(r.from, r.to).all();
      rows = [['페이지', '페이지뷰', '방문자', '평균 체류(초)', '평균 스크롤(%)', '들어온 수']].concat(results.map((x) => [x.path, x.pv, x.uv, x.dur ?? '', x.dep ?? '', x.entries]));
    } else if (kind === 'items') {
      const { results } = await db.prepare("SELECT item, COUNT(*) AS clicks, COUNT(DISTINCT CASE WHEN vid != '' THEN vid END) AS uv FROM clk WHERE day BETWEEN ? AND ? GROUP BY item ORDER BY clicks DESC").bind(r.from, r.to).all();
      rows = [['상품', '클릭', '클릭한 방문자']].concat(results.map((x) => [x.item, x.clicks, x.uv]));
    } else if (kind === 'search') {
      const { results } = await db.prepare("SELECT k, COUNT(*) AS n, MIN(n) AS res FROM ev WHERE day BETWEEN ? AND ? AND t = 'search' GROUP BY k ORDER BY n DESC").bind(r.from, r.to).all();
      rows = [['검색어', '검색 수', '최소 결과 수']].concat(results.map((x) => [x.k, x.n, x.res]));
    } else return fail('없는 표예요.');
    const csv = '﻿' + rows.map((row) => row.map((v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\r\n');
    return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="rulerule-${kind}-${r.from}_${r.to}.csv"`, 'cache-control': 'no-store' } });
  }

  return fail('없는 주소예요.', 404);
}

// ---------- 쿠팡 파트너스 실적 (리포트 숫자를 옮겨 적기) ----------
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[,₩원\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};
export async function coupangResults(request, env, parts) {
  const db = env.DB;
  const [action] = parts;
  if (!action && request.method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM cp_daily ORDER BY day DESC LIMIT 400').all();
    return json({ ok: true, rows: results });
  }
  if (action === 'save' && request.method === 'POST') {
    const b = await readBody(request, 60000) || {};
    const rows = Array.isArray(b.rows) ? b.rows.slice(0, 400) : [];
    const ok = rows.filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.day || ''));
    if (!ok.length) return fail('저장할 날짜가 없어요. 날짜는 2026-11-18처럼 적어 주세요.');
    const now = nowIso();
    await db.batch(ok.map((x) => db.prepare(`INSERT INTO cp_daily (day, clicks, orders, gmv, commission, cancels, memo, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (day) DO UPDATE SET clicks = excluded.clicks, orders = excluded.orders, gmv = excluded.gmv, commission = excluded.commission, cancels = excluded.cancels, memo = excluded.memo, updated_at = excluded.updated_at`)
      .bind(x.day, num(x.clicks), num(x.orders), num(x.gmv), num(x.commission), num(x.cancels), oneLine(x.memo, 100), now)));
    return json({ ok: true, saved: ok.length });
  }
  if (action === 'delete' && request.method === 'POST') {
    const b = await readBody(request, 300) || {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.day || '')) return fail('날짜를 알 수 없어요.');
    await db.prepare('DELETE FROM cp_daily WHERE day = ?').bind(b.day).run();
    return json({ ok: true });
  }
  return fail('없는 주소예요.', 404);
}
