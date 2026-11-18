// 운영 관리 (로그인 확인은 server/adminauth.js)
import { json, fail, readBody, kstDay, oneLine, clip, nowIso, systemUserId } from './util.js';
import { adminShop } from './shop.js';
import { deleteClub, deleteEvent, deletePost, deleteUser, hashPassword } from './auth.js';
import { removeComment, removeReview } from './community.js';
import { kpi, coupangResults } from './kpi.js';

const TABLE = { post: 'posts', event: 'events', club: 'clubs', comment: 'comments', review: 'reviews' };

export async function admin(request, env, parts) {
  const url = new URL(request.url);
  const db = env.DB;
  const [section, id, sub] = parts;
  const m = request.method;

  if (section === 'reports' && !id && m === 'GET') {
    const st = url.searchParams.get('status') || 'new';
    const q = st === 'all'
      ? db.prepare('SELECT id, created_at, slug, kind, message, contact, page, status FROM reports ORDER BY id DESC LIMIT 200')
      : db.prepare('SELECT id, created_at, slug, kind, message, contact, page, status FROM reports WHERE status = ? ORDER BY id DESC LIMIT 200').bind(st === 'done' ? 'done' : 'new');
    const { results } = await q.all();
    return json({ ok: true, reports: results });
  }
  if (section === 'reports' && /^\d+$/.test(id || '')) {
    if (m === 'POST') {
      const body = await readBody(request, 200);
      await db.prepare('UPDATE reports SET status = ? WHERE id = ?').bind(body && body.status === 'done' ? 'done' : 'new', Number(id)).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      await db.prepare('DELETE FROM reports WHERE id = ?').bind(Number(id)).run();
      return json({ ok: true });
    }
  }
  if (section === 'stats' && m === 'GET') {
    const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 30, 1), 365);
    const from = kstDay(days - 1);
    const [totals, daily, games, venues, buys] = await db.batch([
      db.prepare('SELECT type, SUM(n) AS n FROM daily_counts WHERE day >= ? GROUP BY type').bind(from),
      db.prepare("SELECT day, SUM(n) AS n FROM daily_counts WHERE day >= ? AND type = 'view' GROUP BY day ORDER BY day").bind(from),
      db.prepare(`SELECT slug,
          SUM(CASE WHEN type = 'view' THEN n ELSE 0 END) AS view,
          SUM(CASE WHEN type = 'table' THEN n ELSE 0 END) AS "table",
          SUM(CASE WHEN type = 'qr' THEN n ELSE 0 END) AS qr
        FROM daily_counts WHERE day >= ? AND slug != '' GROUP BY slug ORDER BY view DESC, "table" DESC LIMIT 30`).bind(from),
      db.prepare("SELECT venue, SUM(n) AS n FROM daily_counts WHERE day >= ? AND venue != '' GROUP BY venue ORDER BY n DESC LIMIT 30").bind(from),
      db.prepare('SELECT SUM(n) AS n FROM shop_clicks WHERE day >= ?').bind(from),
    ]);
    const t = {};
    for (const r of totals.results) t[r.type] = r.n;
    t.buy = (buys.results[0] && buys.results[0].n) || 0;
    return json({ ok: true, days, totals: t, daily: daily.results, games: games.results, venues: venues.results });
  }

  // 문의함
  if (section === 'inquiries' && !id && m === 'GET') {
    const st = url.searchParams.get('status') || 'new';
    const q = st === 'all'
      ? db.prepare('SELECT * FROM inquiries ORDER BY id DESC LIMIT 200')
      : db.prepare('SELECT * FROM inquiries WHERE status = ? ORDER BY id DESC LIMIT 200').bind(st === 'done' ? 'done' : 'new');
    const { results } = await q.all();
    return json({ ok: true, inquiries: results.map((r) => { delete r.ip_hash; return r; }) });
  }
  if (section === 'inquiries' && /^\d+$/.test(id || '')) {
    if (m === 'POST') {
      const b = await readBody(request, 3000) || {};
      await db.prepare('UPDATE inquiries SET status = ?, memo = ? WHERE id = ?').bind(b.status === 'done' ? 'done' : 'new', oneLine(b.memo, 500), Number(id)).run();
      return json({ ok: true });
    }
    if (m === 'DELETE') {
      await db.prepare('DELETE FROM inquiries WHERE id = ?').bind(Number(id)).run();
      return json({ ok: true });
    }
  }

  // 보드게임몰 링크
  if (section === 'shop') return adminShop(request, env, parts.slice(1));

  // 지표(KPI)와 쿠팡 파트너스 실적
  if (section === 'kpi' && m === 'GET') return kpi(request, env, parts.slice(1));
  if (section === 'cp') return coupangResults(request, env, parts.slice(1));

  // 설정 상태
  if (section === 'system' && m === 'GET') {
    const [pv, clk, ev, users, games] = await db.batch([
      db.prepare('SELECT COUNT(*) AS n, MIN(day) AS first FROM pv'),
      db.prepare('SELECT COUNT(*) AS n FROM clk'),
      db.prepare('SELECT COUNT(*) AS n FROM ev'),
      db.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'ok'"),
      db.prepare('SELECT COUNT(*) AS n FROM reviews'),
    ]);
    return json({
      ok: true,
      db: true, admin: true, coupangApi: !!(env.COUPANG_ACCESS_KEY && env.COUPANG_SECRET_KEY), webhook: !!env.INQUIRY_WEBHOOK_URL, pepper: !!env.AUTH_PEPPER,
      rows: { pv: pv.results[0].n, clk: clk.results[0].n, ev: ev.results[0].n, users: users.results[0].n, reviews: games.results[0].n },
      firstDay: pv.results[0].first || '',
    });
  }

  // 커뮤니티 관리
  if (section === 'community') {
    if (id === 'flags' && m === 'GET') {
      const { results } = await db.prepare(`SELECT f.target, f.target_id, COUNT(*) AS n, MAX(f.created_at) AS last_at, GROUP_CONCAT(f.reason, ' / ') AS reasons,
          CASE f.target WHEN 'post' THEN (SELECT title FROM posts WHERE id = f.target_id) WHEN 'event' THEN (SELECT title FROM events WHERE id = f.target_id) WHEN 'club' THEN (SELECT name FROM clubs WHERE id = f.target_id) WHEN 'review' THEN (SELECT slug || ' · ' || substr(body, 1, 70) FROM reviews WHERE id = f.target_id) ELSE (SELECT substr(body, 1, 80) FROM comments WHERE id = f.target_id) END AS label,
          CASE f.target WHEN 'post' THEN (SELECT hidden FROM posts WHERE id = f.target_id) WHEN 'event' THEN (SELECT hidden FROM events WHERE id = f.target_id) WHEN 'club' THEN (SELECT hidden FROM clubs WHERE id = f.target_id) WHEN 'review' THEN (SELECT hidden FROM reviews WHERE id = f.target_id) ELSE (SELECT hidden FROM comments WHERE id = f.target_id) END AS hidden,
          CASE f.target WHEN 'comment' THEN (SELECT target || ':' || target_id FROM comments WHERE id = f.target_id) WHEN 'review' THEN (SELECT 'game:' || slug FROM reviews WHERE id = f.target_id) ELSE '' END AS parent
        FROM flags f WHERE f.status = 'new' GROUP BY f.target, f.target_id ORDER BY n DESC, last_at DESC LIMIT 100`).all();
      return json({ ok: true, flags: results });
    }
    if (id === 'recent' && m === 'GET') {
      const [posts, events, clubs, users, reviews] = await db.batch([
        db.prepare("SELECT p.id, p.title, p.cat, p.created_at, p.hidden, p.pinned, u.nick, u.id AS uid FROM posts p JOIN users u ON u.id = p.user_id ORDER BY p.id DESC LIMIT 30"),
        db.prepare('SELECT e.id, e.title, e.kind, e.starts_at, e.hidden, u.nick, u.id AS uid FROM events e JOIN users u ON u.id = e.user_id ORDER BY e.id DESC LIMIT 30'),
        db.prepare('SELECT c.id, c.name AS title, c.region, c.created_at, c.hidden, u.nick, u.id AS uid FROM clubs c JOIN users u ON u.id = c.owner_id ORDER BY c.id DESC LIMIT 30'),
        db.prepare("SELECT id, login, nick, status, created_at, last_at, xp, stars FROM users WHERE status NOT IN ('deleted', 'system') ORDER BY id DESC LIMIT 50"),
        db.prepare('SELECT r.id, r.slug, r.rating, substr(r.body, 1, 80) AS body, r.hidden, r.created_at, u.nick FROM reviews r JOIN users u ON u.id = r.user_id ORDER BY r.id DESC LIMIT 30'),
      ]);
      const cnt = await db.prepare("SELECT COUNT(*) AS n FROM users WHERE status = 'ok'").first();
      return json({ ok: true, posts: posts.results, events: events.results, clubs: clubs.results, users: users.results, reviews: reviews.results, userCount: cnt.n });
    }
    if (id === 'hide' && m === 'POST') {
      const b = await readBody(request, 500) || {};
      if (!TABLE[b.target] || !/^\d+$/.test(String(b.id))) return fail('대상을 알 수 없어요.');
      await db.prepare(`UPDATE ${TABLE[b.target]} SET hidden = ? WHERE id = ?`).bind(b.hidden ? 1 : 0, Number(b.id)).run();
      await db.prepare("UPDATE flags SET status = 'done' WHERE target = ? AND target_id = ?").bind(b.target, Number(b.id)).run();
      return json({ ok: true });
    }
    if (id === 'dismiss' && m === 'POST') {
      const b = await readBody(request, 500) || {};
      await db.prepare("UPDATE flags SET status = 'done' WHERE target = ? AND target_id = ?").bind(String(b.target), Number(b.id)).run();
      return json({ ok: true });
    }
    if (id === 'remove' && m === 'POST') {
      const b = await readBody(request, 500) || {};
      const n = Number(b.id);
      if (!/^\d+$/.test(String(b.id))) return fail('대상을 알 수 없어요.');
      if (b.target === 'post') await deletePost(env, n);
      else if (b.target === 'event') await deleteEvent(env, n);
      else if (b.target === 'club') await deleteClub(env, n);
      else if (b.target === 'comment') await removeComment(env, n, null, true);
      else if (b.target === 'review') await removeReview(env, n);
      else return fail('대상을 알 수 없어요.');
      await db.prepare("UPDATE flags SET status = 'done' WHERE target = ? AND target_id = ?").bind(b.target, n).run();
      return json({ ok: true });
    }
    // 운영팀 이름으로 공지나 투표 올리기
    if (id === 'post' && m === 'POST') {
      const b = await readBody(request, 20000) || {};
      const cat = b.cat === 'poll' ? 'poll' : 'notice';
      const title = oneLine(b.title, 60), body = clip(b.body, 5000);
      if (title.length < 2) return fail('제목을 적어 주세요.');
      const sid = await systemUserId(db);
      let ends = '';
      const opts = (Array.isArray(b.options) ? b.options : []).map((x) => oneLine(x, 40)).filter(Boolean).slice(0, 6);
      if (cat === 'poll') {
        if (opts.length < 2) return fail('투표 보기를 두 개 이상 적어 주세요.');
        ends = new Date(Date.now() + 9 * 3600e3 + Math.min(Math.max(Number(b.days) || 7, 1), 60) * 86400e3).toISOString().slice(0, 10);
      }
      const r = await db.prepare('INSERT INTO posts (user_id, cat, game, title, body, created_at, updated_at, pinned, poll_ends) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(sid, cat, '', title, body, nowIso(), nowIso(), b.pinned ? 1 : 0, ends).run();
      const pid = r.meta.last_row_id;
      if (opts.length && cat === 'poll') await db.batch(opts.map((o, i) => db.prepare('INSERT INTO poll_options (post_id, idx, label) VALUES (?, ?, ?)').bind(pid, i, o)));
      return json({ ok: true, id: pid });
    }
    if (id === 'pin' && m === 'POST') {
      const b = await readBody(request, 300) || {};
      await db.prepare('UPDATE posts SET pinned = ? WHERE id = ?').bind(b.pinned ? 1 : 0, Number(b.id)).run();
      return json({ ok: true });
    }
    if (id === 'user' && /^\d+$/.test(sub || '') && m === 'POST') {
      const b = await readBody(request, 500) || {};
      const uid = Number(sub);
      if (b.action === 'ban' || b.action === 'unban') {
        await db.prepare('UPDATE users SET status = ? WHERE id = ? AND status != ?').bind(b.action === 'ban' ? 'banned' : 'ok', uid, 'deleted').run();
        if (b.action === 'ban') await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(uid).run();
        return json({ ok: true });
      }
      if (b.action === 'reset') {
        // 비밀번호를 잊은 회원에게 임시 비밀번호를 만들어 줘요 (본인 확인은 운영자가 따로)
        const temp = 'rr' + [...crypto.getRandomValues(new Uint8Array(6))].map((x) => (x % 36).toString(36)).join('') + Math.floor(Math.random() * 90 + 10);
        await db.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(env, temp), uid).run();
        await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(uid).run();
        return json({ ok: true, temp });
      }
      if (b.action === 'delete') {
        await deleteUser(env, uid);
        return json({ ok: true });
      }
    }
  }
  return fail('없는 주소예요.', 404);
}
