// 커뮤니티: 자유게시판(투표, 답변 채택), 모임, 정모·번개(매너 평가), 댓글, 신고
import { json, fail, readBody, clip, oneLine, nowIso, kstStamp, kstDay, tooMany, logAction, assetJSON, REGIONS, POST_CATS, USER_CATS } from './util.js';
import { deleteClub, deleteEvent, deletePost } from './auth.js';
import { grow, revoke, addStars, note, checkBadges } from './growth.js';
import { userCols, mergeGains, removeReview } from './social.js';

const PER = 20;
const pageOf = (url) => Math.min(Math.max(Number(url.searchParams.get('page')) || 1, 1), 500);
const idOf = (s) => (/^\d{1,10}$/.test(String(s || '')) ? Number(s) : 0);
const AUTO_HIDE = 5; // 서로 다른 회원 다섯 명이 신고하면 일단 가려요
const OPENCHAT = /^https:\/\/open\.kakao\.com\/[A-Za-z0-9/_\-?=&.]{2,120}$/;
const authorCols = userCols;

async function gameSlugs(env, request) {
  const d = await assetJSON(env, request, '/data/games.json');
  return d ? new Set(d.games.map((g) => g.s)) : null;
}
async function cleanGames(env, request, list, max = 8) {
  const known = await gameSlugs(env, request);
  const arr = (Array.isArray(list) ? list : String(list || '').split(',')).map((s) => String(s).trim()).filter((s) => /^[a-z0-9-]{1,40}$/.test(s) && (!known || known.has(s)));
  return [...new Set(arr)].slice(0, max).join(',');
}

// 일정 시각 확인: YYYY-MM-DDTHH:MM, 지금부터 180일 안
function checkStart(s) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s || '')) return '날짜와 시각을 골라 주세요.';
  const d = new Date(s + ':00+09:00');
  if (isNaN(d)) return '날짜와 시각을 다시 확인해 주세요.';
  if (d.getTime() < Date.now() - 60e3) return '지난 시각으로는 일정을 만들 수 없어요.';
  if (d.getTime() > Date.now() + 180 * 86400e3) return '일정은 180일 안으로만 만들 수 있어요.';
  return '';
}

async function writeLimit(env, me, act, limit, minutes) {
  if (await tooMany(env.DB, 'm:' + me.id, act, limit, minutes)) return fail('짧은 시간에 너무 많이 올렸어요. 잠시 뒤에 다시 해 주세요.', 429);
  await logAction(env.DB, 'm:' + me.id, act);
  return null;
}

// ---------- 투표 ----------
async function pollOf(env, postId, me, ends) {
  const db = env.DB;
  const { results } = await db.prepare('SELECT idx, label, votes FROM poll_options WHERE post_id = ? ORDER BY idx').bind(postId).all();
  if (!results.length) return null;
  const mine = me ? await db.prepare('SELECT idx FROM poll_votes WHERE post_id = ? AND user_id = ?').bind(postId, me.id).first() : null;
  return { options: results, total: results.reduce((a, o) => a + o.votes, 0), mine: mine ? mine.idx : -1, ends: ends || '', closed: !!ends && ends < kstDay() };
}
function cleanOptions(list) {
  const arr = (Array.isArray(list) ? list : []).map((x) => oneLine(x, 40)).filter(Boolean);
  return [...new Set(arr)].slice(0, 6);
}
export async function vote(env, request, id, me) {
  const b = await readBody(request, 200);
  const p = await env.DB.prepare('SELECT id, cat, hidden, poll_ends FROM posts WHERE id = ?').bind(id).first();
  if (!p || p.hidden || p.cat !== 'poll') return fail('없는 투표예요.', 404);
  if (p.poll_ends && p.poll_ends < kstDay()) return fail('마감된 투표예요.');
  const idx = Number(b && b.idx);
  const opt = await env.DB.prepare('SELECT idx FROM poll_options WHERE post_id = ? AND idx = ?').bind(id, idx).first();
  if (!opt) return fail('보기를 골라 주세요.');
  const r = await env.DB.prepare('INSERT OR IGNORE INTO poll_votes (post_id, user_id, idx, created_at) VALUES (?, ?, ?, ?)').bind(id, me.id, idx, nowIso()).run();
  if (!r.meta.changes) return fail('이미 투표했어요. 한 사람이 한 번만 고를 수 있어요.');
  await env.DB.prepare('UPDATE poll_options SET votes = votes + 1 WHERE post_id = ? AND idx = ?').bind(id, idx).run();
  const gain = await grow(env, request, me.id, 'vote', id, ['vote1']);
  return json({ ok: true, poll: await pollOf(env, id, me, p.poll_ends), gain });
}

// ---------- 게시판 ----------
async function listPosts(env, url) {
  const page = pageOf(url);
  const cat = url.searchParams.get('cat');
  const game = url.searchParams.get('game');
  const q = oneLine(url.searchParams.get('q'), 30);
  const where = ['p.hidden = 0'];
  const args = [];
  if (cat && POST_CATS[cat]) { where.push('p.cat = ?'); args.push(cat); }
  if (game && /^[a-z0-9-]{1,40}$/.test(game)) { where.push('p.game = ?'); args.push(game); }
  if (q) { where.push('(p.title LIKE ? OR p.body LIKE ?)'); args.push(`%${q}%`, `%${q}%`); }
  const w = where.join(' AND ');
  const [rows, cnt] = await env.DB.batch([
    env.DB.prepare(`SELECT p.id, p.cat, p.game, p.title, p.created_at, p.views, p.likes, p.comments, p.pinned, p.adopted, p.poll_ends, ${authorCols} FROM posts p JOIN users u ON u.id = p.user_id WHERE ${w} ORDER BY p.pinned DESC, p.id DESC LIMIT ? OFFSET ?`).bind(...args, PER, (page - 1) * PER),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM posts p WHERE ${w}`).bind(...args),
  ]);
  return json({ ok: true, page, per: PER, total: cnt.results[0].n, posts: rows.results });
}

async function getPost(env, id, me) {
  const p = await env.DB.prepare(`SELECT p.*, ${authorCols} FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`).bind(id).first();
  if (!p || (p.hidden && (!me || me.id !== p.user_id))) return fail('없거나 가려진 글이에요.', 404);
  await env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(id).run();
  const liked = me ? !!(await env.DB.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').bind(id, me.id).first()) : false;
  const comments = await listComments(env, 'post', id, me, p.adopted);
  const poll = p.cat === 'poll' ? await pollOf(env, id, me, p.poll_ends) : null;
  const mine = !!me && me.id === p.user_id;
  delete p.user_id;
  return json({ ok: true, post: { ...p, views: p.views + 1, mine, liked }, poll, comments });
}

async function savePost(env, request, me, id) {
  const b = await readBody(request, 30000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  if (b.website) return json({ ok: true });
  const cat = USER_CATS.includes(b.cat) ? b.cat : '';
  const title = oneLine(b.title, 60);
  const body = clip(b.body, 5000);
  if (!cat) return fail('말머리를 골라 주세요.');
  if (title.length < 2) return fail('제목을 2자 이상 적어 주세요.');
  if (cat !== 'poll' && body.length < 5) return fail('내용을 5자 이상 적어 주세요.');
  if ((body.match(/https?:\/\//g) || []).length > 3) return fail('링크는 세 개까지만 넣을 수 있어요.');
  const game = await cleanGames(env, request, b.game ? [b.game] : [], 1);
  const db = env.DB;
  if (id) {
    const p = await db.prepare('SELECT user_id, cat FROM posts WHERE id = ?').bind(id).first();
    if (!p || p.user_id !== me.id) return fail('내가 쓴 글만 고칠 수 있어요.', 403);
    if ((p.cat === 'poll') !== (cat === 'poll')) return fail('투표 글은 다른 말머리로, 다른 글은 투표로 바꿀 수 없어요.');
    await db.prepare('UPDATE posts SET cat = ?, game = ?, title = ?, body = ?, updated_at = ? WHERE id = ?').bind(cat, game, title, body, nowIso(), id).run();
    return json({ ok: true, id });
  }
  let options = [], ends = '';
  if (cat === 'poll') {
    options = cleanOptions(b.options);
    if (options.length < 2) return fail('투표 보기를 두 개 이상 적어 주세요. (최대 6개)');
    const days = Math.min(Math.max(Math.round(Number(b.days) || 7), 1), 30);
    ends = new Date(Date.now() + 9 * 3600e3 + days * 86400e3).toISOString().slice(0, 10);
  }
  const lim = await writeLimit(env, me, 'post', 5, 10);
  if (lim) return lim;
  const r = await db.prepare('INSERT INTO posts (user_id, cat, game, title, body, created_at, updated_at, poll_ends) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(me.id, cat, game, title, body, nowIso(), nowIso(), ends).run();
  const pid = r.meta.last_row_id;
  if (options.length) await db.batch(options.map((o, i) => db.prepare('INSERT INTO poll_options (post_id, idx, label) VALUES (?, ?, ?)').bind(pid, i, o)));
  const gain = await grow(env, request, me.id, 'post', pid, ['post10']);
  return json({ ok: true, id: pid, gain });
}

async function likePost(env, request, id, me) {
  const p = await env.DB.prepare('SELECT id, user_id FROM posts WHERE id = ? AND hidden = 0').bind(id).first();
  if (!p) return fail('없는 글이에요.', 404);
  if (p.user_id === me.id) return fail('내 글에는 좋아요를 누를 수 없어요.');
  const had = await env.DB.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').bind(id, me.id).first();
  if (had) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').bind(id, me.id),
      env.DB.prepare('UPDATE posts SET likes = likes - 1 WHERE id = ?').bind(id),
    ]);
    await addStars(env, p.user_id, -1);
  } else {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').bind(id, me.id),
      env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(id),
    ]);
    await addStars(env, p.user_id, 1);
    await grow(env, request, p.user_id, 'liked', `${id}:${me.id}`, ['star50']);
  }
  const row = await env.DB.prepare('SELECT likes FROM posts WHERE id = ?').bind(id).first();
  return json({ ok: true, liked: !had, likes: row.likes });
}

// 규칙 질문에서 답변 채택
async function adopt(env, request, id, me) {
  const b = await readBody(request, 200);
  const cid = idOf(b && b.comment);
  const db = env.DB;
  const p = await db.prepare('SELECT id, user_id, cat, adopted, title FROM posts WHERE id = ?').bind(id).first();
  if (!p || p.user_id !== me.id) return fail('질문을 쓴 사람만 채택할 수 있어요.', 403);
  if (p.cat !== 'qna') return fail('규칙 질문 글에서만 채택할 수 있어요.');
  if (p.adopted) return fail('이미 답변을 채택했어요.');
  const c = await db.prepare("SELECT id, user_id, hidden FROM comments WHERE id = ? AND target = 'post' AND target_id = ?").bind(cid, id).first();
  if (!c || c.hidden) return fail('채택할 댓글을 찾지 못했어요.', 404);
  if (c.user_id === me.id) return fail('내 댓글은 채택할 수 없어요.');
  await db.prepare('UPDATE posts SET adopted = ? WHERE id = ?').bind(cid, id).run();
  await addStars(env, c.user_id, 3);
  await grow(env, request, c.user_id, 'adopted', cid, ['solver1', 'solver5', 'star50']);
  await note(env, c.user_id, 'adopt', `내 답변이 채택됐어요: ${p.title}`, `/community/post/?id=${id}`);
  const gain = await grow(env, request, me.id, 'adopt', id, []);
  return json({ ok: true, gain });
}

// ---------- 모임 ----------
async function listClubs(env, url, me) {
  const page = pageOf(url);
  const region = url.searchParams.get('region');
  const q = oneLine(url.searchParams.get('q'), 30);
  const where = ['c.hidden = 0'];
  const args = [];
  if (region && REGIONS.includes(region)) { where.push('c.region = ?'); args.push(region); }
  if (q) { where.push('(c.name LIKE ? OR c.intro LIKE ? OR c.area LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (url.searchParams.get('mine') === '1' && me) { where.push('c.id IN (SELECT club_id FROM club_members WHERE user_id = ?)'); args.push(me.id); }
  const w = where.join(' AND ');
  const now = kstStamp();
  const [rows, cnt] = await env.DB.batch([
    env.DB.prepare(`SELECT c.id, c.name, c.region, c.area, substr(c.intro, 1, 120) AS intro, c.games, c.member_count, c.created_at,
        (SELECT MIN(e.starts_at) FROM events e WHERE e.club_id = c.id AND e.hidden = 0 AND e.canceled = 0 AND e.starts_at >= ?) AS next_at
      FROM clubs c WHERE ${w} ORDER BY (next_at IS NULL), next_at, c.member_count DESC, c.id DESC LIMIT ? OFFSET ?`).bind(now, ...args, PER, (page - 1) * PER),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM clubs c WHERE ${w}`).bind(...args),
  ]);
  return json({ ok: true, page, per: PER, total: cnt.results[0].n, clubs: rows.results });
}

async function getClub(env, id, me) {
  const c = await env.DB.prepare(`SELECT c.*, u.nick AS owner_nick, u.xp AS owner_xp FROM clubs c JOIN users u ON u.id = c.owner_id WHERE c.id = ?`).bind(id).first();
  if (!c || (c.hidden && (!me || me.id !== c.owner_id))) return fail('없거나 가려진 모임이에요.', 404);
  const now = kstStamp();
  const [members, upcoming, past] = await env.DB.batch([
    env.DB.prepare('SELECT u.nick, u.xp, u.badge AS fb, m.role FROM club_members m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? ORDER BY m.role DESC, m.created_at LIMIT 200').bind(id),
    env.DB.prepare('SELECT id, kind, title, region, place, starts_at, max_people, attendee_count, canceled FROM events WHERE club_id = ? AND hidden = 0 AND starts_at >= ? ORDER BY starts_at LIMIT 20').bind(id, now),
    env.DB.prepare('SELECT id, kind, title, starts_at, attendee_count, canceled FROM events WHERE club_id = ? AND hidden = 0 AND starts_at < ? ORDER BY starts_at DESC LIMIT 10').bind(id, now),
  ]);
  const role = me ? await env.DB.prepare('SELECT role FROM club_members WHERE club_id = ? AND user_id = ?').bind(id, me.id).first() : null;
  const comments = await listComments(env, 'club', id, me, 0);
  const mine = !!me && me.id === c.owner_id;
  const joined = !!role;
  const club = { ...c, mine, joined };
  delete club.owner_id;
  if (!joined && !mine) club.openchat = club.openchat ? 'members' : ''; // 오픈채팅 주소는 회원에게만
  return json({ ok: true, club, members: members.results, upcoming: upcoming.results, past: past.results, comments });
}

async function saveClub(env, request, me, id) {
  const b = await readBody(request, 12000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  if (b.website) return json({ ok: true });
  const name = oneLine(b.name, 30);
  const region = REGIONS.includes(b.region) ? b.region : '';
  const area = oneLine(b.area, 30);
  const intro = clip(b.intro, 2000);
  const openchat = oneLine(b.openchat, 140);
  if (name.length < 2) return fail('모임 이름을 2자 이상 적어 주세요.');
  if (!region) return fail('지역을 골라 주세요.');
  if (intro.length < 10) return fail('모임 소개를 10자 이상 적어 주세요.');
  if (openchat && !OPENCHAT.test(openchat)) return fail('오픈채팅 주소는 https://open.kakao.com/ 로 시작해야 해요.');
  const games = await cleanGames(env, request, b.games);
  if (id) {
    const c = await env.DB.prepare('SELECT owner_id FROM clubs WHERE id = ?').bind(id).first();
    if (!c || c.owner_id !== me.id) return fail('모임장만 고칠 수 있어요.', 403);
    await env.DB.prepare('UPDATE clubs SET name = ?, region = ?, area = ?, intro = ?, games = ?, openchat = ?, updated_at = ? WHERE id = ?')
      .bind(name, region, area, intro, games, openchat, nowIso(), id).run();
    return json({ ok: true, id });
  }
  const own = await env.DB.prepare('SELECT COUNT(*) AS n FROM clubs WHERE owner_id = ?').bind(me.id).first();
  if (own.n >= 3) return fail('모임은 한 사람이 세 개까지 만들 수 있어요.');
  const lim = await writeLimit(env, me, 'club', 2, 60);
  if (lim) return lim;
  const r = await env.DB.prepare('INSERT INTO clubs (owner_id, name, region, area, intro, games, openchat, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(me.id, name, region, area, intro, games, openchat, nowIso(), nowIso()).run();
  const cid = r.meta.last_row_id;
  await env.DB.prepare("INSERT INTO club_members (club_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").bind(cid, me.id, nowIso()).run();
  const gain = await grow(env, request, me.id, 'club', cid, ['host']);
  return json({ ok: true, id: cid, gain });
}

async function joinClub(env, id, me, join) {
  const c = await env.DB.prepare('SELECT owner_id, hidden, name FROM clubs WHERE id = ?').bind(id).first();
  if (!c || c.hidden) return fail('없는 모임이에요.', 404);
  const had = await env.DB.prepare('SELECT role FROM club_members WHERE club_id = ? AND user_id = ?').bind(id, me.id).first();
  if (join && !had) {
    const many = await env.DB.prepare('SELECT COUNT(*) AS n FROM club_members WHERE user_id = ?').bind(me.id).first();
    if (many.n >= 30) return fail('모임은 서른 개까지 가입할 수 있어요.');
    await env.DB.batch([
      env.DB.prepare("INSERT INTO club_members (club_id, user_id, role, created_at) VALUES (?, ?, 'member', ?)").bind(id, me.id, nowIso()),
      env.DB.prepare('UPDATE clubs SET member_count = member_count + 1 WHERE id = ?').bind(id),
    ]);
    await note(env, c.owner_id, 'club', `${me.nick}님이 ‘${c.name}’ 모임에 가입했어요.`, `/community/club/?id=${id}`);
  }
  if (!join && had) {
    if (had.role === 'owner') return fail('모임장은 나갈 수 없어요. 모임을 닫으려면 모임 고치기에서 지워 주세요.');
    await env.DB.batch([
      env.DB.prepare('DELETE FROM club_members WHERE club_id = ? AND user_id = ?').bind(id, me.id),
      env.DB.prepare('UPDATE clubs SET member_count = member_count - 1 WHERE id = ?').bind(id),
    ]);
  }
  return json({ ok: true, joined: join });
}

// ---------- 정모·번개 일정 ----------
async function listEvents(env, url, me) {
  const page = pageOf(url);
  const region = url.searchParams.get('region');
  const kind = url.searchParams.get('kind');
  const club = idOf(url.searchParams.get('club'));
  const where = ['e.hidden = 0', 'e.canceled = 0', 'e.starts_at >= ?'];
  const args = [kstStamp()];
  if (region && REGIONS.includes(region)) { where.push('e.region = ?'); args.push(region); }
  if (kind === 'regular' || kind === 'flash') { where.push('e.kind = ?'); args.push(kind); }
  if (club) { where.push('e.club_id = ?'); args.push(club); }
  if (url.searchParams.get('mine') === '1' && me) { where.push('e.id IN (SELECT event_id FROM event_members WHERE user_id = ?)'); args.push(me.id); }
  const w = where.join(' AND ');
  const [rows, cnt] = await env.DB.batch([
    env.DB.prepare(`SELECT e.id, e.club_id, e.kind, e.title, e.region, e.place, e.starts_at, e.max_people, e.attendee_count, e.games, c.name AS club_name, ${authorCols}
      FROM events e JOIN users u ON u.id = e.user_id LEFT JOIN clubs c ON c.id = e.club_id WHERE ${w} ORDER BY e.starts_at LIMIT ? OFFSET ?`).bind(...args, PER, (page - 1) * PER),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM events e WHERE ${w}`).bind(...args),
  ]);
  return json({ ok: true, page, per: PER, total: cnt.results[0].n, events: rows.results });
}

const MANNER_DAYS = 14;
async function getEvent(env, id, me) {
  const e = await env.DB.prepare(`SELECT e.*, c.name AS club_name, ${authorCols} FROM events e JOIN users u ON u.id = e.user_id LEFT JOIN clubs c ON c.id = e.club_id WHERE e.id = ?`).bind(id).first();
  if (!e || (e.hidden && (!me || me.id !== e.user_id))) return fail('없거나 가려진 일정이에요.', 404);
  const { results: people } = await env.DB.prepare('SELECT u.id, u.nick, u.xp, u.badge AS fb FROM event_members m JOIN users u ON u.id = m.user_id WHERE m.event_id = ? ORDER BY m.created_at LIMIT 100').bind(id).all();
  const joined = !!me && people.some((p) => p.id === me.id);
  const comments = await listComments(env, 'event', id, me, 0);
  const mine = !!me && me.id === e.user_id;
  const past = e.starts_at < kstStamp();
  // 일정이 시작된 뒤 14일 안에, 함께한 사람끼리 매너 평가
  let manner = null;
  const startMs = new Date(e.starts_at + ':00+09:00').getTime();
  if (me && joined && past && !e.canceled && Date.now() - startMs < MANNER_DAYS * 86400e3) {
    const { results: done } = await env.DB.prepare('SELECT to_id, score FROM manner WHERE event_id = ? AND from_id = ?').bind(id, me.id).all();
    const doneMap = Object.fromEntries(done.map((x) => [x.to_id, x.score]));
    manner = { people: people.filter((p) => p.id !== me.id).map((p) => ({ nick: p.nick, score: doneMap[p.id] || 0 })) };
  }
  const ev = { ...e, mine, joined, past };
  delete ev.user_id;
  return json({ ok: true, event: ev, people: people.map((p) => ({ nick: p.nick, xp: p.xp, fb: p.fb })), comments, manner });
}

async function rateManner(env, request, id, me) {
  const b = await readBody(request, 3000);
  const scores = b && typeof b.scores === 'object' ? b.scores : {};
  const e = await env.DB.prepare('SELECT starts_at, canceled FROM events WHERE id = ?').bind(id).first();
  if (!e || e.canceled) return fail('없는 일정이에요.', 404);
  const startMs = new Date(e.starts_at + ':00+09:00').getTime();
  if (Date.now() < startMs) return fail('일정이 시작된 뒤에 평가할 수 있어요.');
  if (Date.now() - startMs > MANNER_DAYS * 86400e3) return fail(`매너 평가는 일정이 끝나고 ${MANNER_DAYS}일 안에만 할 수 있어요.`);
  const { results: people } = await env.DB.prepare('SELECT u.id, u.nick FROM event_members m JOIN users u ON u.id = m.user_id WHERE m.event_id = ?').bind(id).all();
  if (!people.some((p) => p.id === me.id)) return fail('함께 참여한 사람만 평가할 수 있어요.', 403);
  const gains = [];
  let n = 0;
  for (const p of people) {
    if (p.id === me.id) continue;
    const sc = Math.round(Number(scores[p.nick]));
    if (!(sc >= 1 && sc <= 5)) continue;
    const r = await env.DB.prepare('INSERT OR IGNORE INTO manner (event_id, from_id, to_id, score, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, me.id, p.id, sc, nowIso()).run();
    if (!r.meta.changes) continue;
    n++;
    await env.DB.prepare('UPDATE users SET manner_sum = manner_sum + ?, manner_n = manner_n + 1 WHERE id = ?').bind(sc, p.id).run();
    await checkBadges(env, request, p.id, ['manner']);
    gains.push(await grow(env, request, me.id, 'manner', `${id}:${p.id}`, []));
  }
  if (!n) return fail('새로 평가한 사람이 없어요.');
  return json({ ok: true, rated: n, gain: mergeGains(gains) });
}

async function saveEvent(env, request, me, id) {
  const b = await readBody(request, 12000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  if (b.website) return json({ ok: true });
  let clubId = idOf(b.club);
  if (id) {
    const cur = await env.DB.prepare('SELECT club_id FROM events WHERE id = ?').bind(id).first();
    clubId = cur ? cur.club_id : 0;
  }
  const kind = b.kind === 'regular' ? 'regular' : 'flash';
  const title = oneLine(b.title, 40);
  const region = REGIONS.includes(b.region) ? b.region : '';
  const place = oneLine(b.place, 60);
  const startsAt = String(b.starts_at || '');
  const maxPeople = Math.round(Number(b.max_people));
  const body = clip(b.body, 2000);
  const fee = oneLine(b.fee, 30);
  if (title.length < 2) return fail('일정 제목을 2자 이상 적어 주세요.');
  if (!region) return fail('지역을 골라 주세요.');
  if (place.length < 2) return fail('만날 곳을 적어 주세요. (예: 강남역 보드게임카페)');
  const startErr = checkStart(startsAt);
  if (startErr) return fail(startErr);
  if (!(maxPeople >= 2 && maxPeople <= 50)) return fail('인원은 2명부터 50명까지 정할 수 있어요.');
  if (kind === 'regular' && !clubId) return fail('정모는 모임 안에서 만들 수 있어요. 번개로 바꾸거나 모임에서 만들어 주세요.');
  if (clubId) {
    const m = await env.DB.prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?').bind(clubId, me.id).first();
    if (!m) return fail('모임에 가입한 사람만 그 모임의 일정을 만들 수 있어요.', 403);
  }
  const games = await cleanGames(env, request, b.games);
  if (id) {
    const e = await env.DB.prepare('SELECT user_id, attendee_count FROM events WHERE id = ?').bind(id).first();
    if (!e || e.user_id !== me.id) return fail('일정을 만든 사람만 고칠 수 있어요.', 403);
    if (maxPeople < e.attendee_count) return fail(`이미 ${e.attendee_count}명이 참여했어요. 인원을 그보다 적게 줄일 수 없어요.`);
    await env.DB.prepare('UPDATE events SET kind = ?, title = ?, region = ?, place = ?, starts_at = ?, max_people = ?, games = ?, body = ?, fee = ?, updated_at = ? WHERE id = ?')
      .bind(kind, title, region, place, startsAt, maxPeople, games, body, fee, nowIso(), id).run();
    return json({ ok: true, id });
  }
  const lim = await writeLimit(env, me, 'event', 5, 60);
  if (lim) return lim;
  const r = await env.DB.prepare('INSERT INTO events (club_id, user_id, kind, title, region, place, starts_at, max_people, games, body, fee, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(clubId, me.id, kind, title, region, place, startsAt, maxPeople, games, body, fee, nowIso(), nowIso()).run();
  const eid = r.meta.last_row_id;
  await env.DB.prepare('INSERT INTO event_members (event_id, user_id, created_at) VALUES (?, ?, ?)').bind(eid, me.id, nowIso()).run();
  const gain = await grow(env, request, me.id, 'event', eid, ['meet5']);
  return json({ ok: true, id: eid, gain });
}

async function joinEvent(env, request, id, me, join) {
  const e = await env.DB.prepare('SELECT user_id, club_id, max_people, attendee_count, starts_at, hidden, canceled, title FROM events WHERE id = ?').bind(id).first();
  if (!e || e.hidden) return fail('없는 일정이에요.', 404);
  if (e.canceled) return fail('취소된 일정이에요.');
  if (e.starts_at < kstStamp()) return fail('이미 지난 일정이에요.');
  const had = await env.DB.prepare('SELECT 1 FROM event_members WHERE event_id = ? AND user_id = ?').bind(id, me.id).first();
  let gain = null;
  if (join && !had) {
    if (e.club_id) {
      const m = await env.DB.prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?').bind(e.club_id, me.id).first();
      if (!m) return fail('이 정모는 모임에 가입한 뒤 참여할 수 있어요.', 403);
    }
    // 정원이 찼는지 확인하면서 한 번에 넣어요
    const r = await env.DB.prepare('UPDATE events SET attendee_count = attendee_count + 1 WHERE id = ? AND attendee_count < max_people').bind(id).run();
    if (!r.meta.changes) return fail('정원이 다 찼어요.');
    await env.DB.prepare('INSERT INTO event_members (event_id, user_id, created_at) VALUES (?, ?, ?)').bind(id, me.id, nowIso()).run();
    gain = await grow(env, request, me.id, 'join', id, ['meet5']);
    await note(env, e.user_id, 'event', `${me.nick}님이 ‘${e.title}’에 참여 신청했어요.`, `/community/event/?id=${id}`);
  }
  if (!join && had) {
    if (e.user_id === me.id) return fail('일정을 만든 사람은 빠질 수 없어요. 일정을 취소하려면 고치기에서 지워 주세요.');
    await env.DB.batch([
      env.DB.prepare('DELETE FROM event_members WHERE event_id = ? AND user_id = ?').bind(id, me.id),
      env.DB.prepare('UPDATE events SET attendee_count = attendee_count - 1 WHERE id = ?').bind(id),
    ]);
    await revoke(env, me.id, 'join', id);
  }
  return json({ ok: true, joined: join, gain });
}

// ---------- 댓글 ----------
async function listComments(env, target, id, me, adopted) {
  const { results } = await env.DB.prepare(`SELECT c.id, c.body, c.created_at, c.hidden, c.user_id, ${authorCols} FROM comments c JOIN users u ON u.id = c.user_id WHERE c.target = ? AND c.target_id = ? ORDER BY c.id LIMIT 300`).bind(target, id).all();
  return results.map((c) => ({ id: c.id, nick: c.nick, xp: c.xp, fb: c.fb, gone: c.gone, sys: c.sys, created_at: c.created_at, mine: !!me && me.id === c.user_id, hidden: !!c.hidden, adopted: !!adopted && c.id === adopted, body: c.hidden ? '' : c.body }));
}
const TARGETS = { post: 'posts', event: 'events', club: 'clubs' };
const OWNER_COL = { posts: 'user_id', events: 'user_id', clubs: 'owner_id' };
const TITLE_COL = { posts: 'title', events: 'title', clubs: 'name' };
async function addComment(env, request, me) {
  const b = await readBody(request, 4000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  const target = TARGETS[b.target] ? b.target : '';
  const id = idOf(b.id);
  const body = clip(b.body, 1000);
  if (!target || !id) return fail('어디에 다는 댓글인지 알 수 없어요.');
  if (body.length < 1) return fail('댓글을 적어 주세요.');
  const tb = TARGETS[target];
  const t = await env.DB.prepare(`SELECT id, hidden, ${OWNER_COL[tb]} AS owner, ${TITLE_COL[tb]} AS title FROM ${tb} WHERE id = ?`).bind(id).first();
  if (!t || t.hidden) return fail('없거나 가려진 글이에요.', 404);
  if (target === 'club') {
    const m = await env.DB.prepare('SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?').bind(id, me.id).first();
    if (!m) return fail('모임 게시판은 가입한 사람만 쓸 수 있어요.', 403);
  }
  const lim = await writeLimit(env, me, 'comment', 15, 10);
  if (lim) return lim;
  const r = await env.DB.prepare('INSERT INTO comments (target, target_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)').bind(target, id, me.id, body, nowIso()).run();
  if (target === 'post') await env.DB.prepare('UPDATE posts SET comments = comments + 1 WHERE id = ?').bind(id).run();
  if (t.owner !== me.id) {
    const where = target === 'post' ? 'post' : target === 'event' ? 'event' : 'club';
    await note(env, t.owner, 'comment', `${me.nick}님이 ‘${t.title}’에 댓글을 남겼어요: ${body.slice(0, 40)}`, `/community/${where}/?id=${id}`);
  }
  const gain = await grow(env, request, me.id, 'comment', r.meta.last_row_id, []);
  return json({ ok: true, id: r.meta.last_row_id, gain });
}
async function removeComment(env, id, me, isAdmin) {
  const c = await env.DB.prepare('SELECT target, target_id, user_id FROM comments WHERE id = ?').bind(id).first();
  if (!c) return fail('없는 댓글이에요.', 404);
  if (!isAdmin && (!me || c.user_id !== me.id)) return fail('내가 쓴 댓글만 지울 수 있어요.', 403);
  if (!isAdmin && c.target === 'post') {
    const p = await env.DB.prepare('SELECT adopted FROM posts WHERE id = ?').bind(c.target_id).first();
    if (p && p.adopted === id) return fail('채택된 답변은 지울 수 없어요.');
  }
  await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
  if (c.target === 'post') await env.DB.prepare('UPDATE posts SET comments = comments - 1 WHERE id = ?').bind(c.target_id).run();
  await revoke(env, c.user_id, 'comment', id);
  return json({ ok: true });
}

// ---------- 신고 ----------
const FLAG_TABLE = { post: 'posts', event: 'events', club: 'clubs', comment: 'comments', review: 'reviews' };
async function addFlag(env, request, me) {
  const b = await readBody(request, 2000);
  if (!b) return fail('보낸 내용을 읽지 못했어요.');
  const target = FLAG_TABLE[b.target] ? b.target : '';
  const id = idOf(b.id);
  const reason = oneLine(b.reason, 200);
  if (!target || !id) return fail('무엇을 신고하는지 알 수 없어요.');
  const lim = await writeLimit(env, me, 'flag', 10, 60);
  if (lim) return lim;
  await env.DB.prepare('INSERT OR IGNORE INTO flags (target, target_id, user_id, reason, created_at) VALUES (?, ?, ?, ?, ?)').bind(target, id, me.id, reason, nowIso()).run();
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM flags WHERE target = ? AND target_id = ? AND status = 'new'").bind(target, id).first();
  if (n.n >= AUTO_HIDE) await env.DB.prepare(`UPDATE ${FLAG_TABLE[target]} SET hidden = 1 WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

// ---------- 첫 화면 요약, 내 활동 ----------
async function home(env, me) {
  const now = kstStamp();
  const month = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00+09:00`).toISOString();
  const db = env.DB;
  const [events, clubs, posts, counts, polls, reviews, top] = await db.batch([
    db.prepare(`SELECT e.id, e.club_id, e.kind, e.title, e.region, e.place, e.starts_at, e.max_people, e.attendee_count, c.name AS club_name FROM events e LEFT JOIN clubs c ON c.id = e.club_id WHERE e.hidden = 0 AND e.canceled = 0 AND e.starts_at >= ? ORDER BY e.starts_at LIMIT 6`).bind(now),
    db.prepare('SELECT id, name, region, area, substr(intro, 1, 90) AS intro, member_count, games FROM clubs WHERE hidden = 0 ORDER BY member_count DESC, id DESC LIMIT 6'),
    db.prepare(`SELECT p.id, p.cat, p.title, p.created_at, p.comments, p.likes, p.pinned, p.adopted, ${authorCols} FROM posts p JOIN users u ON u.id = p.user_id WHERE p.hidden = 0 ORDER BY p.pinned DESC, p.id DESC LIMIT 8`),
    db.prepare(`SELECT (SELECT COUNT(*) FROM users WHERE status = 'ok') AS users, (SELECT COUNT(*) FROM clubs WHERE hidden = 0) AS clubs, (SELECT COUNT(*) FROM events WHERE hidden = 0 AND canceled = 0 AND starts_at >= ?) AS events, (SELECT COUNT(*) FROM posts WHERE hidden = 0) AS posts, (SELECT COUNT(*) FROM reviews WHERE hidden = 0) AS reviews`).bind(now),
    db.prepare("SELECT p.id, p.title, p.poll_ends, p.pinned, (SELECT SUM(votes) FROM poll_options o WHERE o.post_id = p.id) AS total FROM posts p WHERE p.hidden = 0 AND p.cat = 'poll' AND (p.poll_ends = '' OR p.poll_ends >= ?) ORDER BY p.pinned DESC, p.id DESC LIMIT 3").bind(kstDay()),
    db.prepare(`SELECT r.id, r.slug, r.rating, substr(r.body, 1, 120) AS body, r.created_at, ${authorCols} FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.hidden = 0 AND r.body != '' ORDER BY r.id DESC LIMIT 6`),
    db.prepare("SELECT u.nick, u.xp, u.badge AS fb, SUM(p.pts) AS s FROM points p JOIN users u ON u.id = p.user_id WHERE p.created_at >= ? AND u.status = 'ok' GROUP BY p.user_id ORDER BY s DESC LIMIT 5").bind(monthStart),
  ]);
  // 맨 위 투표 하나는 보기까지 함께 보내요 (처음 화면에서 바로 투표할 수 있게)
  const first = polls.results[0];
  const poll = first ? { id: first.id, title: first.title, ...(await pollOf(env, first.id, me, first.poll_ends)) } : null;
  return json({ ok: true, events: events.results, clubs: clubs.results, posts: posts.results, counts: counts.results[0], polls: polls.results, poll, reviews: reviews.results, top: top.results });
}
async function mine(env, me) {
  const now = kstStamp();
  const [posts, clubs, events] = await env.DB.batch([
    env.DB.prepare('SELECT id, cat, title, created_at, comments, likes, hidden FROM posts WHERE user_id = ? ORDER BY id DESC LIMIT 50').bind(me.id),
    env.DB.prepare('SELECT c.id, c.name, c.region, c.member_count, m.role FROM club_members m JOIN clubs c ON c.id = m.club_id WHERE m.user_id = ? ORDER BY m.created_at DESC').bind(me.id),
    env.DB.prepare('SELECT e.id, e.kind, e.title, e.starts_at, e.region, e.attendee_count, e.max_people FROM event_members m JOIN events e ON e.id = m.event_id WHERE m.user_id = ? AND e.starts_at >= ? ORDER BY e.starts_at LIMIT 30').bind(me.id, now),
  ]);
  return json({ ok: true, posts: posts.results, clubs: clubs.results, events: events.results });
}

// ---------- 주소 나누기 ----------
export async function community(request, env, route, parts, me) {
  const url = new URL(request.url);
  const m = request.method;
  const [a, b] = parts;
  const id = idOf(a);
  const needMe = () => (me ? null : fail('로그인이 필요해요.', 401));

  if (route === 'community' && a === 'home') return home(env, me);
  if (route === 'my') return needMe() || mine(env, me);

  if (route === 'posts') {
    if (!a && m === 'GET') return listPosts(env, url);
    if (!a && m === 'POST') return needMe() || savePost(env, request, me, 0);
    if (id && !b && m === 'GET') return getPost(env, id, me);
    if (id && !b && m === 'POST') return needMe() || savePost(env, request, me, id);
    if (id && b === 'like' && m === 'POST') return needMe() || likePost(env, request, id, me);
    if (id && b === 'vote' && m === 'POST') return needMe() || vote(env, request, id, me);
    if (id && b === 'adopt' && m === 'POST') return needMe() || adopt(env, request, id, me);
    if (id && !b && m === 'DELETE') {
      if (!me) return needMe();
      const p = await env.DB.prepare('SELECT user_id FROM posts WHERE id = ?').bind(id).first();
      if (!p || p.user_id !== me.id) return fail('내가 쓴 글만 지울 수 있어요.', 403);
      await deletePost(env, id);
      await revoke(env, me.id, 'post', id);
      return json({ ok: true });
    }
  }
  if (route === 'clubs') {
    if (!a && m === 'GET') return listClubs(env, url, me);
    if (!a && m === 'POST') return needMe() || saveClub(env, request, me, 0);
    if (id && !b && m === 'GET') return getClub(env, id, me);
    if (id && !b && m === 'POST') return needMe() || saveClub(env, request, me, id);
    if (id && (b === 'join' || b === 'leave') && m === 'POST') return needMe() || joinClub(env, id, me, b === 'join');
    if (id && !b && m === 'DELETE') {
      if (!me) return needMe();
      const c = await env.DB.prepare('SELECT owner_id FROM clubs WHERE id = ?').bind(id).first();
      if (!c || c.owner_id !== me.id) return fail('모임장만 모임을 지울 수 있어요.', 403);
      await deleteClub(env, id);
      return json({ ok: true });
    }
  }
  if (route === 'events') {
    if (!a && m === 'GET') return listEvents(env, url, me);
    if (!a && m === 'POST') return needMe() || saveEvent(env, request, me, 0);
    if (id && !b && m === 'GET') return getEvent(env, id, me);
    if (id && !b && m === 'POST') return needMe() || saveEvent(env, request, me, id);
    if (id && (b === 'join' || b === 'leave') && m === 'POST') return needMe() || joinEvent(env, request, id, me, b === 'join');
    if (id && b === 'manner' && m === 'POST') return needMe() || rateManner(env, request, id, me);
    if (id && !b && m === 'DELETE') {
      if (!me) return needMe();
      const e = await env.DB.prepare('SELECT user_id FROM events WHERE id = ?').bind(id).first();
      if (!e || e.user_id !== me.id) return fail('일정을 만든 사람만 지울 수 있어요.', 403);
      await deleteEvent(env, id);
      return json({ ok: true });
    }
  }
  if (route === 'comments') {
    if (!a && m === 'POST') return needMe() || addComment(env, request, me);
    if (id && m === 'DELETE') return removeComment(env, id, me, false);
  }
  if (route === 'flag' && m === 'POST') return needMe() || addFlag(env, request, me);
  return fail('없는 주소예요.', 404);
}

export { removeComment, removeReview };
