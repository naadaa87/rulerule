// 참여 기능: 게임 별점·후기, 저장·해 봤어요·하고 싶어요, 출석, 프로필, 랭킹, 알림, 내 성장
import { json, fail, readBody, clip, oneLine, nowIso, kstDay, assetJSON } from './util.js';
import { grow, revoke, addStars, checkin, levelInfo, BADGE_BY, note } from './growth.js';
import { BADGES } from './growth-data.js';

const MARK_KINDS = ['saved', 'played', 'want'];
const BEST = ['2', '3', '4', '5', '6', '7+'];
const PER = 10;

async function gameSet(env, request) {
  const d = await assetJSON(env, request, '/data/games.json');
  return d ? Object.fromEntries(d.games.map((g) => [g.s, g])) : null;
}
export const userCols = "u.nick AS nick, u.xp AS xp, u.badge AS fb, CASE WHEN u.status = 'deleted' THEN 1 ELSE 0 END AS gone, CASE WHEN u.status = 'system' THEN 1 ELSE 0 END AS sys";

// ---------- 모든 게임의 별점 (게임 카드에 보여 줘요) ----------
let statsCache = { at: 0, data: null };
async function gamesStats(env) {
  if (statsCache.data && Date.now() - statsCache.at < 60e3) return statsCache.data;
  const [r, m] = await env.DB.batch([
    env.DB.prepare('SELECT slug, COUNT(*) AS n, ROUND(AVG(rating) * 10) AS a FROM reviews WHERE hidden = 0 GROUP BY slug'),
    env.DB.prepare("SELECT slug, COUNT(*) AS n FROM marks WHERE kind = 'played' GROUP BY slug"),
  ]);
  const out = {};
  for (const x of r.results) out[x.slug] = { r: x.a / 10, n: x.n, p: 0 };
  for (const x of m.results) (out[x.slug] = out[x.slug] || { r: 0, n: 0, p: 0 }).p = x.n;
  statsCache = { at: Date.now(), data: out };
  return out;
}

// ---------- 게임 하나의 참여 정보 ----------
async function gameSocial(env, slug, me, url) {
  const db = env.DB;
  const sort = url.searchParams.get('sort') === 'new' ? 'r.id DESC' : 'r.helpful DESC, r.id DESC';
  const page = Math.min(Math.max(Number(url.searchParams.get('page')) || 1, 1), 200);
  const [dist, all, marks, list, cnt] = await db.batch([
    db.prepare('SELECT rating, COUNT(*) AS n FROM reviews WHERE slug = ? AND hidden = 0 GROUP BY rating').bind(slug),
    db.prepare('SELECT best, diff FROM reviews WHERE slug = ? AND hidden = 0 LIMIT 3000').bind(slug),
    db.prepare('SELECT kind, COUNT(*) AS n FROM marks WHERE slug = ? GROUP BY kind').bind(slug),
    db.prepare(`SELECT r.id, r.rating, r.best, r.diff, r.body, r.helpful, r.created_at, r.updated_at, r.user_id, ${userCols} FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.slug = ? AND r.hidden = 0 ORDER BY ${sort} LIMIT ? OFFSET ?`).bind(slug, PER, (page - 1) * PER),
    db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE slug = ? AND hidden = 0 AND body != ''").bind(slug),
  ]);
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0, n = 0;
  for (const x of dist.results) { d[x.rating] = x.n; sum += x.rating * x.n; n += x.n; }
  const best = Object.fromEntries(BEST.map((b) => [b, 0]));
  const diff = { 1: 0, 2: 0, 3: 0 };
  for (const x of all.results) {
    for (const b of String(x.best || '').split(',')) if (best[b] !== undefined) best[b]++;
    if (diff[x.diff] !== undefined) diff[x.diff]++;
  }
  const counts = { saved: 0, played: 0, want: 0 };
  for (const x of marks.results) counts[x.kind] = x.n;
  let my = null;
  let helped = new Set();
  if (me) {
    const [mm, mr, mh] = await db.batch([
      db.prepare('SELECT kind FROM marks WHERE user_id = ? AND slug = ?').bind(me.id, slug),
      db.prepare('SELECT id, rating, best, diff, body FROM reviews WHERE user_id = ? AND slug = ?').bind(me.id, slug),
      db.prepare('SELECT h.review_id FROM review_helpful h JOIN reviews r ON r.id = h.review_id WHERE h.user_id = ? AND r.slug = ?').bind(me.id, slug),
    ]);
    my = { marks: mm.results.map((x) => x.kind), review: mr.results[0] || null };
    helped = new Set(mh.results.map((x) => x.review_id));
  }
  const reviews = list.results.map((r) => ({ id: r.id, rating: r.rating, best: r.best, diff: r.diff, body: r.body, helpful: r.helpful, created_at: r.created_at, edited: r.updated_at !== r.created_at, nick: r.nick, xp: r.xp, fb: r.fb, gone: r.gone, mine: !!me && me.id === r.user_id, helped: helped.has(r.id) }));
  return json({ ok: true, summary: { n, avg: n ? Math.round((sum / n) * 10) / 10 : 0, dist: d, best, diff, texts: cnt.results[0].n }, counts, my, reviews, page, per: PER });
}

async function mark(env, request, slug, me) {
  const b = await readBody(request, 300);
  if (!b || !MARK_KINDS.includes(b.kind)) return fail('무엇을 표시할지 알 수 없어요.');
  const db = env.DB;
  let gain = null;
  if (b.on) {
    const r = await db.prepare('INSERT OR IGNORE INTO marks (user_id, slug, kind, created_at) VALUES (?, ?, ?, ?)').bind(me.id, slug, b.kind, nowIso()).run();
    if (r.meta.changes && b.kind === 'played') gain = await grow(env, request, me.id, 'played', slug, ['played10', 'played30', 'playedall', 'trad5']);
    if (b.kind === 'played') await db.prepare("DELETE FROM marks WHERE user_id = ? AND slug = ? AND kind = 'want'").bind(me.id, slug).run();
  } else {
    await db.prepare('DELETE FROM marks WHERE user_id = ? AND slug = ? AND kind = ?').bind(me.id, slug, b.kind).run();
  }
  statsCache.at = 0;
  const { results } = await db.prepare('SELECT kind, COUNT(*) AS n FROM marks WHERE slug = ? GROUP BY kind').bind(slug).all();
  const counts = { saved: 0, played: 0, want: 0 };
  for (const x of results) counts[x.kind] = x.n;
  const mine = (await db.prepare('SELECT kind FROM marks WHERE user_id = ? AND slug = ?').bind(me.id, slug).all()).results.map((x) => x.kind);
  return json({ ok: true, counts, mine, gain });
}

// 로그인할 때 이 기기에 저장해 둔 게임을 계정으로 옮겨요
async function syncSaved(env, request, me, games) {
  const b = await readBody(request, 4000);
  const list = (b && Array.isArray(b.slugs) ? b.slugs : []).filter((s) => games[s]).slice(0, 100);
  if (list.length) {
    await env.DB.batch(list.map((s) => env.DB.prepare("INSERT OR IGNORE INTO marks (user_id, slug, kind, created_at) VALUES (?, ?, 'saved', ?)").bind(me.id, s, nowIso())));
  }
  const { results } = await env.DB.prepare('SELECT slug, kind FROM marks WHERE user_id = ? ORDER BY created_at DESC').bind(me.id).all();
  return json({ ok: true, marks: results });
}

async function saveReview(env, request, slug, me) {
  const b = await readBody(request, 6000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return fail('별점을 1개에서 5개 사이로 골라 주세요.');
  const best = [...new Set((Array.isArray(b.best) ? b.best : []).map(String).filter((x) => BEST.includes(x)))].join(',');
  const diff = [1, 2, 3].includes(Number(b.diff)) ? Number(b.diff) : 0;
  const body = clip(b.body, 1000);
  if ((body.match(/https?:\/\//g) || []).length > 1) return fail('후기에는 링크를 하나까지만 넣을 수 있어요.');
  const db = env.DB;
  const old = await db.prepare('SELECT id FROM reviews WHERE user_id = ? AND slug = ?').bind(me.id, slug).first();
  if (old) {
    await db.prepare('UPDATE reviews SET rating = ?, best = ?, diff = ?, body = ?, updated_at = ? WHERE id = ?').bind(rating, best, diff, body, nowIso(), old.id).run();
  } else {
    await db.prepare('INSERT INTO reviews (slug, user_id, rating, best, diff, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(slug, me.id, rating, best, diff, body, nowIso(), nowIso()).run();
  }
  // 후기를 남기면 해 본 게임으로 쳐요
  const pm = await db.prepare("INSERT OR IGNORE INTO marks (user_id, slug, kind, created_at) VALUES (?, ?, 'played', ?)").bind(me.id, slug, nowIso()).run();
  await db.prepare("DELETE FROM marks WHERE user_id = ? AND slug = ? AND kind = 'want'").bind(me.id, slug).run();
  const gains = [];
  const g1 = await grow(env, request, me.id, 'rate', slug, []);
  if (g1) gains.push(g1);
  if (body.length >= 20) { const g2 = await grow(env, request, me.id, 'review', slug, []); if (g2) gains.push(g2); }
  if (pm.meta.changes) { const g3 = await grow(env, request, me.id, 'played', slug, []); if (g3) gains.push(g3); }
  const g4 = await grow(env, request, me.id, null, null, ['review1', 'review10', 'played10', 'played30', 'playedall', 'trad5']);
  if (g4) gains.push(g4);
  statsCache.at = 0;
  return json({ ok: true, gain: mergeGains(gains) });
}
export function mergeGains(list) {
  const g = list.filter(Boolean);
  if (!g.length) return null;
  return { pts: g.reduce((a, x) => a + (x.pts || 0), 0), label: g.filter((x) => x.pts).map((x) => x.label).join(', '), up: g.map((x) => x.up).filter(Boolean).pop() || null, badges: g.flatMap((x) => x.badges || []) };
}

async function deleteReview(env, slug, me) {
  const db = env.DB;
  const r = await db.prepare('SELECT id, helpful FROM reviews WHERE user_id = ? AND slug = ?').bind(me.id, slug).first();
  if (!r) return fail('지울 후기가 없어요.', 404);
  await removeReview(env, r.id);
  return json({ ok: true });
}
export async function removeReview(env, id) {
  const db = env.DB;
  const r = await db.prepare('SELECT id, slug, user_id, helpful FROM reviews WHERE id = ?').bind(id).first();
  if (!r) return;
  await db.batch([
    db.prepare('DELETE FROM review_helpful WHERE review_id = ?').bind(id),
    db.prepare('DELETE FROM reviews WHERE id = ?').bind(id),
  ]);
  await addStars(env, r.user_id, -r.helpful);
  await revoke(env, r.user_id, 'rate', r.slug);
  await revoke(env, r.user_id, 'review', r.slug);
  statsCache.at = 0;
}

async function helpful(env, request, id, me) {
  const db = env.DB;
  const r = await db.prepare('SELECT id, user_id, hidden FROM reviews WHERE id = ?').bind(id).first();
  if (!r || r.hidden) return fail('없는 후기예요.', 404);
  if (r.user_id === me.id) return fail('내 후기에는 누를 수 없어요.');
  const had = await db.prepare('SELECT 1 FROM review_helpful WHERE review_id = ? AND user_id = ?').bind(id, me.id).first();
  if (had) {
    await db.batch([db.prepare('DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?').bind(id, me.id), db.prepare('UPDATE reviews SET helpful = helpful - 1 WHERE id = ?').bind(id)]);
    await addStars(env, r.user_id, -1);
  } else {
    await db.batch([db.prepare('INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)').bind(id, me.id), db.prepare('UPDATE reviews SET helpful = helpful + 1 WHERE id = ?').bind(id)]);
    await addStars(env, r.user_id, 1);
    await grow(env, request, r.user_id, 'helpful', `${id}:${me.id}`, ['star50']);
  }
  const row = await db.prepare('SELECT helpful FROM reviews WHERE id = ?').bind(id).first();
  return json({ ok: true, helped: !had, helpful: row.helpful });
}

// ---------- 내 성장 ----------
async function myGrowth(env, me) {
  const db = env.DB;
  const [u, badges, recent, marks, nr, np, nc] = await db.batch([
    db.prepare('SELECT xp, stars, badge, streak, checkins, last_checkin, manner_sum, manner_n, created_at FROM users WHERE id = ?').bind(me.id),
    db.prepare('SELECT badge, created_at FROM user_badges WHERE user_id = ?').bind(me.id),
    db.prepare('SELECT act, pts, created_at FROM points WHERE user_id = ? ORDER BY id DESC LIMIT 12').bind(me.id),
    db.prepare('SELECT slug, kind, created_at FROM marks WHERE user_id = ? ORDER BY created_at DESC').bind(me.id),
    db.prepare('SELECT COUNT(*) AS n FROM reviews WHERE user_id = ?').bind(me.id),
    db.prepare('SELECT COUNT(*) AS n FROM posts WHERE user_id = ?').bind(me.id),
    db.prepare("SELECT COUNT(*) AS n FROM points WHERE user_id = ? AND act = 'adopted'").bind(me.id),
  ]);
  const x = u.results[0];
  return json({
    ok: true,
    xp: x.xp, level: levelInfo(x.xp), stars: x.stars, badge: x.badge, streak: x.streak, checkins: x.checkins,
    checked: x.last_checkin === kstDay(), manner: x.manner_n >= 3 ? { avg: Math.round((x.manner_sum / x.manner_n) * 10) / 10, n: x.manner_n } : null,
    badges: badges.results, recent: recent.results, marks: marks.results,
    counts: { reviews: nr.results[0].n, posts: np.results[0].n, adopted: nc.results[0].n },
  });
}

// ---------- 공개 프로필 ----------
async function profile(env, nick) {
  const db = env.DB;
  const u = await db.prepare("SELECT id, nick, region, bio, xp, stars, badge, manner_sum, manner_n, created_at, status FROM users WHERE nick = ? AND status IN ('ok', 'system')").bind(nick).first();
  if (!u) return fail('없는 회원이에요.', 404);
  const [badges, played, reviews, posts, rank] = await db.batch([
    db.prepare('SELECT badge, created_at FROM user_badges WHERE user_id = ? ORDER BY created_at').bind(u.id),
    db.prepare("SELECT slug FROM marks WHERE user_id = ? AND kind = 'played' ORDER BY created_at DESC").bind(u.id),
    db.prepare('SELECT slug, rating, body, helpful, created_at FROM reviews WHERE user_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 6').bind(u.id),
    db.prepare('SELECT id, cat, title, created_at, comments, likes FROM posts WHERE user_id = ? AND hidden = 0 ORDER BY id DESC LIMIT 6').bind(u.id),
    db.prepare("SELECT COUNT(*) + 1 AS r FROM users WHERE status = 'ok' AND xp > ?").bind(u.xp),
  ]);
  return json({
    ok: true,
    user: { nick: u.nick, region: u.region, bio: u.bio, xp: u.xp, level: levelInfo(u.xp), stars: u.stars, fb: u.badge, created_at: u.created_at, sys: u.status === 'system', rank: u.status === 'ok' ? rank.results[0].r : null, manner: u.manner_n >= 3 ? { avg: Math.round((u.manner_sum / u.manner_n) * 10) / 10, n: u.manner_n } : null },
    badges: badges.results, played: played.results.map((x) => x.slug), reviews: reviews.results, posts: posts.results,
  });
}

// ---------- 랭킹 ----------
async function rank(env, url) {
  const db = env.DB;
  const month = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00+09:00`).toISOString();
  const [m, all, stars, rev, sol] = await db.batch([
    db.prepare(`SELECT u.nick, u.xp, u.badge AS fb, SUM(p.pts) AS s FROM points p JOIN users u ON u.id = p.user_id WHERE p.created_at >= ? AND u.status = 'ok' GROUP BY p.user_id ORDER BY s DESC LIMIT 20`).bind(monthStart),
    db.prepare("SELECT nick, xp, badge AS fb, xp AS s FROM users WHERE status = 'ok' AND xp > 0 ORDER BY xp DESC LIMIT 20"),
    db.prepare("SELECT nick, xp, badge AS fb, stars AS s FROM users WHERE status = 'ok' AND stars > 0 ORDER BY stars DESC LIMIT 10"),
    db.prepare("SELECT u.nick, u.xp, u.badge AS fb, COUNT(*) AS s FROM reviews r JOIN users u ON u.id = r.user_id WHERE u.status = 'ok' AND r.hidden = 0 GROUP BY r.user_id ORDER BY s DESC LIMIT 10"),
    db.prepare("SELECT u.nick, u.xp, u.badge AS fb, COUNT(*) AS s FROM points p JOIN users u ON u.id = p.user_id WHERE p.act = 'adopted' AND u.status = 'ok' GROUP BY p.user_id ORDER BY s DESC LIMIT 10"),
  ]);
  void url;
  return json({ ok: true, month, monthly: m.results, all: all.results, stars: stars.results, reviewers: rev.results, solvers: sol.results });
}

// ---------- 알림 ----------
async function notes(env, me) {
  const { results } = await env.DB.prepare('SELECT id, kind, text, link, created_at, read FROM notes WHERE user_id = ? ORDER BY id DESC LIMIT 40').bind(me.id).all();
  return json({ ok: true, notes: results });
}

export async function social(request, env, route, parts, me) {
  const url = new URL(request.url);
  const m = request.method;
  const needMe = () => (me ? null : fail('로그인이 필요해요.', 401));
  if (route === 'games') {
    if (parts[0] === 'stats' && m === 'GET') return json({ ok: true, stats: await gamesStats(env) }, 200, { 'cache-control': 'public, max-age=60' });
    const slug = parts[0];
    const games = await gameSet(env, request);
    if (!slug || !/^[a-z0-9-]{1,40}$/.test(slug) || (games && !games[slug])) return fail('없는 게임이에요.', 404);
    const sub = parts[1];
    if (!sub && m === 'GET') return gameSocial(env, slug, me, url);
    if (sub === 'mark' && m === 'POST') return needMe() || mark(env, request, slug, me);
    if (sub === 'review' && m === 'POST') return needMe() || saveReview(env, request, slug, me);
    if (sub === 'review' && m === 'DELETE') return needMe() || deleteReview(env, slug, me);
  }
  if (route === 'reviews' && /^\d+$/.test(parts[0] || '') && parts[1] === 'helpful' && m === 'POST') return needMe() || helpful(env, request, Number(parts[0]), me);
  if (route === 'checkin' && m === 'POST') {
    if (!me) return needMe();
    const r = await checkin(env, request, me.id);
    return json(r);
  }
  if (route === 'growth' && m === 'GET') return needMe() || myGrowth(env, me);
  if (route === 'sync' && m === 'POST') return needMe() || syncSaved(env, request, me, await gameSet(env, request) || {});
  if (route === 'users' && parts[0] && m === 'GET') return profile(env, oneLine(decodeURIComponent(parts[0]), 20));
  if (route === 'rank' && m === 'GET') return rank(env, url);
  if (route === 'notes') {
    if (!me) return needMe();
    if (m === 'GET') return notes(env, me);
    if (m === 'POST') {
      await env.DB.prepare('UPDATE notes SET read = 1 WHERE user_id = ? AND read = 0').bind(me.id).run();
      return json({ ok: true });
    }
  }
  return fail('없는 주소예요.', 404);
}

export { BADGES, BADGE_BY, note };
