// 회원: 가입, 로그인, 로그아웃, 내 정보
import { json, fail, readBody, clip, oneLine, nowIso, randomToken, sha256Hex, b64u, unb64u, ipHashOf, tooMany, logAction, REGIONS } from './util.js';
import { grow } from './growth.js';

const COOKIE = 'rr_sid';
const DAYS = 30;
// 무료 요금제의 처리 시간 한도를 넘지 않는 횟수. 유료 요금제라면 PBKDF2_ITER를 높여도 돼요. (로그인할 때 자동으로 다시 저장해요)
const iterOf = (env) => Math.min(Math.max(Number(env.PBKDF2_ITER) || 20000, 10000), 100000);
const RESERVED = /^(룰룰|운영자|관리자|admin|administrator|rulerule|root|system|탈퇴한\s?회원)/i;

async function derive(password, salt, iter, pepper) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password + (pepper || '')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
  return new Uint8Array(bits);
}
export async function hashPassword(env, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iter = iterOf(env);
  const h = await derive(password, salt, iter, env.AUTH_PEPPER);
  return `pbkdf2$${iter}$${b64u(salt)}$${b64u(h)}`;
}
async function checkPassword(env, password, stored) {
  const [alg, iterS, saltS, hashS] = String(stored || '').split('$');
  if (alg !== 'pbkdf2') return false;
  const h = await derive(password, unb64u(saltS), Number(iterS), env.AUTH_PEPPER);
  const want = unb64u(hashS);
  if (h.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < h.length; i++) diff |= h[i] ^ want[i];
  return diff === 0;
}

const readCookie = (request, name) => {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : '';
};
// 실제 사이트(https)에서는 Secure를 붙여요. 내 컴퓨터에서 시험할 때(http://localhost)만 빼요.
let secureFlag = true;
const cookieOf = (token, maxAge) => `${COOKIE}=${token}; Path=/; HttpOnly;${secureFlag ? ' Secure;' : ''} SameSite=Lax; Max-Age=${maxAge}`;

export async function currentUser(request, env) {
  const token = readCookie(request, COOKIE);
  if (!token || token.length > 80) return null;
  const th = await sha256Hex(token);
  const row = await env.DB.prepare(`SELECT u.id, u.login, u.nick, u.region, u.bio, u.status, u.xp, u.stars, u.badge, u.last_checkin, u.streak, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).bind(th).first();
  if (!row || row.status !== 'ok' || row.expires_at < nowIso()) return null;
  // 15일 안에 끝나면 30일로 늘려요
  if (new Date(row.expires_at) - Date.now() < 15 * 86400e3) {
    await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').bind(new Date(Date.now() + DAYS * 86400e3).toISOString(), th).run();
  }
  return { id: row.id, login: row.login, nick: row.nick, region: row.region, bio: row.bio, xp: row.xp || 0, stars: row.stars || 0, badge: row.badge || '', last_checkin: row.last_checkin || '', streak: row.streak || 0 };
}

async function startSession(env, userId) {
  const token = randomToken(32);
  const th = await sha256Hex(token);
  await env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(th, userId, nowIso(), new Date(Date.now() + DAYS * 86400e3).toISOString()).run();
  await env.DB.prepare('UPDATE users SET last_at = ? WHERE id = ?').bind(nowIso(), userId).run();
  if (Math.random() < 0.05) await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(nowIso()).run();
  return cookieOf(token, DAYS * 86400);
}

export const checkLogin = (s) => /^[a-z0-9_]{4,20}$/.test(s);
export const checkNick = (s) => /^[가-힣a-zA-Z0-9_]{2,12}$/.test(s) && !RESERVED.test(s);
const checkPw = (s) => typeof s === 'string' && s.length >= 8 && s.length <= 64 && /[A-Za-z]/.test(s) && /[0-9]/.test(s);

export const publicUser = (u) => (u ? { id: u.id, login: u.login, nick: u.nick, region: u.region, bio: u.bio, xp: u.xp || 0, stars: u.stars || 0, badge: u.badge || '' } : null);

export async function auth(request, env, parts, me) {
  const action = parts[0];
  secureFlag = new URL(request.url).protocol === 'https:';
  const ipk = await ipHashOf(request);

  if (action === 'signup' && request.method === 'POST') {
    const b = await readBody(request, 3000);
    if (!b) return fail('보낸 내용을 읽지 못했어요.');
    if (b.website) return json({ ok: true });
    const login = clip(b.login, 20).toLowerCase();
    const nick = clip(b.nick, 12);
    if (!checkLogin(login)) return fail('아이디는 영문 소문자, 숫자, 밑줄(_)로 4~20자예요.');
    if (!checkNick(nick)) return fail('닉네임은 한글, 영문, 숫자로 2~12자예요. 운영자로 오해할 수 있는 이름은 쓸 수 없어요.');
    if (!checkPw(b.password)) return fail('비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요.');
    if (b.password.toLowerCase().includes(login)) return fail('비밀번호에 아이디를 넣을 수 없어요.');
    if (!b.age14 || !b.terms || !b.privacy) return fail('만 14세 이상 확인과 약관, 개인정보 수집에 모두 동의해 주세요.');
    if (await tooMany(env.DB, ipk, 'signup', 10, 60)) return fail('짧은 시간에 가입을 너무 많이 했어요. 한 시간 뒤에 다시 해 주세요.', 429);
    const dup = await env.DB.prepare('SELECT login, nick FROM users WHERE login = ? OR nick = ?').bind(login, nick).first();
    if (dup) return fail(dup.login === login ? '이미 쓰고 있는 아이디예요.' : '이미 쓰고 있는 닉네임이에요.', 409);
    const region = REGIONS.includes(b.region) ? b.region : '';
    const pw = await hashPassword(env, b.password);
    const r = await env.DB.prepare('INSERT INTO users (login, nick, pw, region, created_at, last_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(login, nick, pw, region, nowIso(), nowIso()).run();
    await logAction(env.DB, ipk, 'signup');
    const id = r.meta.last_row_id;
    const cookie = await startSession(env, id);
    const gain = await grow(env, request, id, 'welcome', 'welcome', ['welcome']);
    return json({ ok: true, user: { id, login, nick, region, bio: '', xp: gain ? gain.pts : 0, stars: 0, badge: '' }, gain }, 200, { 'set-cookie': cookie });
  }

  if (action === 'login' && request.method === 'POST') {
    const b = await readBody(request, 1000);
    if (!b) return fail('보낸 내용을 읽지 못했어요.');
    const login = clip(b.login, 20).toLowerCase();
    if (await tooMany(env.DB, ipk, 'login-fail', 10, 15) || await tooMany(env.DB, 'u:' + login, 'login-fail', 8, 15)) {
      return fail('로그인에 여러 번 실패했어요. 15분 뒤에 다시 해 주세요.', 429);
    }
    const u = checkLogin(login) ? await env.DB.prepare('SELECT id, login, nick, region, bio, pw, status FROM users WHERE login = ?').bind(login).first() : null;
    const okPw = u ? await checkPassword(env, String(b.password || ''), u.pw) : false;
    if (!u || !okPw) {
      await logAction(env.DB, ipk, 'login-fail');
      await logAction(env.DB, 'u:' + login, 'login-fail');
      return fail('아이디나 비밀번호가 맞지 않아요.', 401);
    }
    if (u.status !== 'ok') return fail('이용이 제한된 계정이에요. 제휴·문의 페이지로 연락해 주세요.', 403);
    // 저장된 반복 횟수가 지금 설정보다 낮으면 새로 저장
    if (Number(u.pw.split('$')[1]) < iterOf(env)) {
      await env.DB.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(env, String(b.password)), u.id).run();
    }
    const cookie = await startSession(env, u.id);
    return json({ ok: true, user: publicUser(u) }, 200, { 'set-cookie': cookie });
  }

  if (action === 'logout' && request.method === 'POST') {
    const token = readCookie(request, COOKIE);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(await sha256Hex(token)).run();
    return json({ ok: true }, 200, { 'set-cookie': cookieOf('', 0) });
  }

  if (!me) return fail('로그인이 필요해요.', 401);

  if (action === 'profile' && request.method === 'POST') {
    const b = await readBody(request, 2000);
    if (!b) return fail('보낸 내용을 읽지 못했어요.');
    const nick = clip(b.nick, 12);
    if (!checkNick(nick)) return fail('닉네임은 한글, 영문, 숫자로 2~12자예요.');
    if (nick !== me.nick) {
      const dup = await env.DB.prepare('SELECT id FROM users WHERE nick = ? AND id != ?').bind(nick, me.id).first();
      if (dup) return fail('이미 쓰고 있는 닉네임이에요.', 409);
    }
    const region = REGIONS.includes(b.region) ? b.region : '';
    const bio = oneLine(b.bio, 80);
    let badge = String(b.badge || '');
    if (badge) {
      const has = await env.DB.prepare('SELECT 1 FROM user_badges WHERE user_id = ? AND badge = ?').bind(me.id, badge).first();
      if (!has) return fail('받은 배지만 달 수 있어요.');
    }
    await env.DB.prepare('UPDATE users SET nick = ?, region = ?, bio = ?, badge = ? WHERE id = ?').bind(nick, region, bio, badge, me.id).run();
    return json({ ok: true, user: publicUser({ ...me, nick, region, bio, badge }) });
  }

  if (action === 'password' && request.method === 'POST') {
    const b = await readBody(request, 1000);
    if (!b) return fail('보낸 내용을 읽지 못했어요.');
    const u = await env.DB.prepare('SELECT pw FROM users WHERE id = ?').bind(me.id).first();
    if (!u || !(await checkPassword(env, String(b.current || ''), u.pw))) return fail('지금 비밀번호가 맞지 않아요.', 401);
    if (!checkPw(b.next)) return fail('새 비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요.');
    await env.DB.prepare('UPDATE users SET pw = ? WHERE id = ?').bind(await hashPassword(env, b.next), me.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(me.id).run();
    const cookie = await startSession(env, me.id);
    return json({ ok: true }, 200, { 'set-cookie': cookie });
  }

  if (action === 'delete' && request.method === 'POST') {
    const b = await readBody(request, 1000);
    const u = await env.DB.prepare('SELECT pw FROM users WHERE id = ?').bind(me.id).first();
    if (!b || !u || !(await checkPassword(env, String(b.password || ''), u.pw))) return fail('비밀번호가 맞지 않아요.', 401);
    await deleteUser(env, me.id);
    return json({ ok: true }, 200, { 'set-cookie': cookieOf('', 0) });
  }

  return fail('없는 주소예요.', 404);
}

// 탈퇴: 개인 정보를 지우고, 남긴 글은 ‘탈퇴한 회원’으로 남겨요. 직접 만든 모임과 일정은 지워요.
export async function deleteUser(env, id) {
  const db = env.DB;
  const { results: clubs } = await db.prepare('SELECT id FROM clubs WHERE owner_id = ?').bind(id).all();
  for (const c of clubs) await deleteClub(env, c.id);
  const { results: evs } = await db.prepare('SELECT id FROM events WHERE user_id = ?').bind(id).all();
  for (const e of evs) await deleteEvent(env, e.id);
  await db.batch([
    db.prepare('UPDATE clubs SET member_count = member_count - 1 WHERE id IN (SELECT club_id FROM club_members WHERE user_id = ?)').bind(id),
    db.prepare('DELETE FROM club_members WHERE user_id = ?').bind(id),
    db.prepare('UPDATE events SET attendee_count = attendee_count - 1 WHERE id IN (SELECT event_id FROM event_members WHERE user_id = ?)').bind(id),
    db.prepare('DELETE FROM event_members WHERE user_id = ?').bind(id),
    db.prepare('UPDATE posts SET likes = likes - 1 WHERE id IN (SELECT post_id FROM post_likes WHERE user_id = ?)').bind(id),
    db.prepare('DELETE FROM post_likes WHERE user_id = ?').bind(id),
    db.prepare('UPDATE reviews SET helpful = helpful - 1 WHERE id IN (SELECT review_id FROM review_helpful WHERE user_id = ?)').bind(id),
    db.prepare('DELETE FROM review_helpful WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM marks WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM notes WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM user_badges WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM points WHERE user_id = ?').bind(id),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    db.prepare(`UPDATE users SET login = ?, nick = ?, pw = '', region = '', bio = '', status = 'deleted', xp = 0, stars = 0, badge = '', streak = 0, last_checkin = '' WHERE id = ?`).bind(`deleted_${id}`, `탈퇴한회원${id}`, id),
  ]);
}

export async function deleteClub(env, clubId) {
  const db = env.DB;
  const { results: evs } = await db.prepare('SELECT id FROM events WHERE club_id = ?').bind(clubId).all();
  for (const e of evs) await deleteEvent(env, e.id);
  await db.batch([
    db.prepare("DELETE FROM comments WHERE target = 'club' AND target_id = ?").bind(clubId),
    db.prepare('DELETE FROM club_members WHERE club_id = ?').bind(clubId),
    db.prepare('DELETE FROM clubs WHERE id = ?').bind(clubId),
  ]);
}
export async function deleteEvent(env, eventId) {
  const db = env.DB;
  await db.batch([
    db.prepare("DELETE FROM comments WHERE target = 'event' AND target_id = ?").bind(eventId),
    db.prepare('DELETE FROM event_members WHERE event_id = ?').bind(eventId),
    db.prepare('DELETE FROM events WHERE id = ?').bind(eventId),
  ]);
}
export async function deletePost(env, postId) {
  const db = env.DB;
  await db.batch([
    db.prepare("DELETE FROM comments WHERE target = 'post' AND target_id = ?").bind(postId),
    db.prepare('DELETE FROM post_likes WHERE post_id = ?').bind(postId),
    db.prepare('DELETE FROM poll_options WHERE post_id = ?').bind(postId),
    db.prepare('DELETE FROM poll_votes WHERE post_id = ?').bind(postId),
    db.prepare('DELETE FROM posts WHERE id = ?').bind(postId),
  ]);
}
