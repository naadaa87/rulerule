// 활동 점수, 등급, 배지, 알림
import { LEVELS, RULES, BADGES, levelOf } from './growth-data.js';
import { kstDay, nowIso, assetJSON } from './util.js';

export const BADGE_BY = Object.fromEntries(BADGES.map((b) => [b.key, b]));
export const levelInfo = (xp) => levelOf(xp || 0, LEVELS);

export async function note(env, uid, kind, text, link) {
  if (!uid) return;
  await env.DB.prepare('INSERT INTO notes (user_id, kind, text, link, created_at) VALUES (?, ?, ?, ?, ?)').bind(uid, kind, String(text).slice(0, 200), String(link || '').slice(0, 200), nowIso()).run();
  if (Math.random() < 0.02) {
    await env.DB.prepare('DELETE FROM notes WHERE created_at < ?').bind(new Date(Date.now() - 90 * 86400e3).toISOString()).run();
  }
}

// 점수 주기. 같은 일(act + ref)로는 한 번만, 하루 한도가 있으면 그만큼만 줘요.
export async function award(env, uid, act, ref) {
  const rule = RULES[act];
  if (!rule || !uid) return null;
  const [pts, cap] = rule;
  const day = kstDay();
  const db = env.DB;
  if (cap) {
    const c = await db.prepare('SELECT COUNT(*) AS n FROM points WHERE user_id = ? AND act = ? AND day = ?').bind(uid, act, day).first();
    if (c && c.n >= cap) return null;
  }
  const r = await db.prepare('INSERT OR IGNORE INTO points (user_id, act, ref, pts, day, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(uid, act, String(ref || ''), pts, day, nowIso()).run();
  if (!r.meta.changes) return null;
  const before = await db.prepare('SELECT xp FROM users WHERE id = ?').bind(uid).first();
  const xp0 = (before && before.xp) || 0;
  await db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').bind(pts, uid).run();
  const a = levelInfo(xp0), b = levelInfo(xp0 + pts);
  if (b.lv > a.lv) await note(env, uid, 'level', `등급이 올랐어요! Lv.${b.lv} ${b.name}`, '/account/');
  return { pts, act, label: rule[2], xp: xp0 + pts, up: b.lv > a.lv ? { lv: b.lv, name: b.name } : null };
}

// 지운 글·댓글·후기의 점수를 되돌려요
export async function revoke(env, uid, act, ref) {
  const db = env.DB;
  const row = await db.prepare('SELECT pts FROM points WHERE user_id = ? AND act = ? AND ref = ?').bind(uid, act, String(ref)).first();
  if (!row) return;
  await db.batch([
    db.prepare('DELETE FROM points WHERE user_id = ? AND act = ? AND ref = ?').bind(uid, act, String(ref)),
    db.prepare('UPDATE users SET xp = MAX(0, xp - ?) WHERE id = ?').bind(row.pts, uid),
  ]);
}

async function tradSlugs(env, request) {
  const d = request ? await assetJSON(env, request, '/data/games.json') : null;
  return d ? { all: d.games.length, trad: d.games.filter((g) => g.k === 'traditional').map((g) => g.s) } : { all: 60, trad: [] };
}

// 배지 조건 확인. 새로 받은 배지 목록을 돌려줘요.
export async function checkBadges(env, request, uid, keys) {
  if (!uid || !keys || !keys.length) return [];
  const db = env.DB;
  const { results } = await db.prepare('SELECT badge FROM user_badges WHERE user_id = ?').bind(uid).all();
  const have = new Set(results.map((r) => r.badge));
  const todo = keys.filter((k) => BADGE_BY[k] && !have.has(k));
  if (!todo.length) return [];
  const u = await db.prepare('SELECT streak, checkins, stars, manner_sum, manner_n FROM users WHERE id = ?').bind(uid).first() || {};
  const count = async (sql, ...args) => ((await db.prepare(sql).bind(...args).first()) || { n: 0 }).n;
  let games = null;
  const got = [];
  for (const k of todo) {
    let ok = false;
    if (k === 'welcome') ok = true;
    else if (k === 'checkin7') ok = (u.streak || 0) >= 7;
    else if (k === 'checkin30') ok = (u.checkins || 0) >= 30;
    else if (k === 'review1' || k === 'review10') ok = (await count('SELECT COUNT(*) AS n FROM reviews WHERE user_id = ?', uid)) >= (k === 'review1' ? 1 : 10);
    else if (k === 'played10' || k === 'played30' || k === 'playedall' || k === 'trad5') {
      games = games || await tradSlugs(env, request);
      if (k === 'trad5') {
        const list = games.trad;
        ok = list.length ? (await count(`SELECT COUNT(*) AS n FROM marks WHERE user_id = ? AND kind = 'played' AND slug IN (${list.map(() => '?').join(',')})`, uid, ...list)) >= 5 : false;
      } else {
        const n = await count("SELECT COUNT(*) AS n FROM marks WHERE user_id = ? AND kind = 'played'", uid);
        ok = n >= (k === 'played10' ? 10 : k === 'played30' ? 30 : games.all);
      }
    } else if (k === 'solver1' || k === 'solver5') ok = (await count("SELECT COUNT(*) AS n FROM points WHERE user_id = ? AND act = 'adopted'", uid)) >= (k === 'solver1' ? 1 : 5);
    else if (k === 'vote1') ok = (await count('SELECT COUNT(*) AS n FROM poll_votes WHERE user_id = ?', uid)) >= 1;
    else if (k === 'post10') ok = (await count('SELECT COUNT(*) AS n FROM posts WHERE user_id = ?', uid)) >= 10;
    else if (k === 'star50') ok = (u.stars || 0) >= 50;
    else if (k === 'host') ok = (await count('SELECT COUNT(*) AS n FROM clubs WHERE owner_id = ?', uid)) >= 1;
    else if (k === 'meet5') ok = (await count('SELECT COUNT(*) AS n FROM event_members WHERE user_id = ?', uid)) >= 5;
    else if (k === 'manner') ok = (u.manner_n || 0) >= 5 && u.manner_sum / u.manner_n >= 4.5;
    if (ok) {
      const r = await db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge, created_at) VALUES (?, ?, ?)').bind(uid, k, nowIso()).run();
      if (r.meta.changes) {
        got.push({ key: k, name: BADGE_BY[k].name });
        await note(env, uid, 'badge', `새 배지를 받았어요: ${BADGE_BY[k].name}`, '/account/#badges');
      }
    }
  }
  return got;
}

// 점수 주기 + 배지 확인을 한 번에. 화면에 띄울 내용을 돌려줘요.
export async function grow(env, request, uid, act, ref, badgeKeys) {
  const g = act ? await award(env, uid, act, ref) : null;
  const badges = await checkBadges(env, request, uid, badgeKeys || []);
  if (!g && !badges.length) return null;
  return { pts: g ? g.pts : 0, label: g ? g.label : '', up: g ? g.up : null, badges };
}

// 받은 별 (좋아요, 도움돼요, 채택) 늘리고 줄이기
export async function addStars(env, uid, n) {
  if (!uid || !n) return;
  await env.DB.prepare('UPDATE users SET stars = MAX(0, stars + ?) WHERE id = ?').bind(n, uid).run();
}

// 출석 체크
export async function checkin(env, request, uid) {
  const db = env.DB;
  const today = kstDay(), yesterday = kstDay(1);
  const u = await db.prepare('SELECT last_checkin, streak, checkins FROM users WHERE id = ?').bind(uid).first();
  if (!u) return { ok: false };
  if (u.last_checkin === today) return { ok: true, already: true, streak: u.streak, checkins: u.checkins };
  const streak = u.last_checkin === yesterday ? (u.streak || 0) + 1 : 1;
  await db.prepare('UPDATE users SET last_checkin = ?, streak = ?, checkins = checkins + 1 WHERE id = ?').bind(today, streak, uid).run();
  const g1 = await award(env, uid, 'checkin', today);
  const g2 = streak % 7 === 0 ? await award(env, uid, 'streak7', today) : null;
  const badges = await checkBadges(env, request, uid, ['checkin7', 'checkin30']);
  const pts = (g1 ? g1.pts : 0) + (g2 ? g2.pts : 0);
  const up = (g2 && g2.up) || (g1 && g1.up) || null;
  return { ok: true, streak, checkins: (u.checkins || 0) + 1, gain: { pts, label: g2 ? `${streak}일 연속 출석` : '출석 체크', up, badges } };
}
