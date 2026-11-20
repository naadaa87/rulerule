// 룰룰 서버 기능 (Cloudflare Pages Functions)
// 실제 처리는 server/ 폴더에 나눠 두었어요.
// - POST /api/report, /api/event, /api/contact
// - 회원: /api/me, /api/auth/(signup|login|logout|profile|password|delete)
// - 커뮤니티: /api/community/home, /api/posts, /api/clubs, /api/events, /api/comments, /api/flag, /api/my
// - 참여·성장: /api/games/:slug (별점·후기·저장), /api/reviews/:id/helpful, /api/checkin, /api/growth, /api/sync, /api/users/:nick, /api/rank, /api/notes
// - 운영 관리: POST /api/admin-login 으로 받은 토큰을 x-admin-token 헤더에 넣어 /api/admin/... 호출
// - 방문 통계: POST /api/event (t=pv, end, search 등)
// - 재미로 알아보기: POST /api/play (취향 테스트, 월드컵, 퀴즈, 모임 게임 짜기, 돌림판), GET /api/fun (모두의 결과), GET /api/chart (룰룰 차트)
//
// Cloudflare 설정 (Pages 프로젝트 > 설정)
// - D1 데이터베이스 바인딩: 변수 이름 DB (필수)
// - 비밀 값: ADMIN_PASSWORD (필수)
// - 선택: COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY (쿠팡 파트너스 링크 자동 만들기)
// - 선택: INQUIRY_WEBHOOK_URL (새 문의 알림), AUTH_PEPPER, PBKDF2_ITER
// 표는 처음 쓸 때 자동으로 만들어져요.

import { json, fail, readBody, clip, kstDay, sha256Hex, sameSecret, sameOrigin, ensureSchema, assetJSON, ipHashOf } from '../../server/util.js';
import { auth, currentUser, publicUser } from '../../server/auth.js';
import { community } from '../../server/community.js';
import { contact } from '../../server/contact.js';
import { admin } from '../../server/admin.js';
import { social } from '../../server/social.js';
import { levelInfo } from '../../server/growth.js';
import { collect, isBot } from '../../server/kpi.js';
import { adminLogin, adminAuthed } from '../../server/adminauth.js';
import { fun } from '../../server/fun.js';

const KINDS = ['wrong', 'unclear', 'typo', 'request', 'other'];
const EVENTS = ['view', 'table', 'qr', 'venue', 'speak', 'share'];

async function postReport(request, env) {
  const body = await readBody(request, 6000);
  if (!body) return fail('보낸 내용을 읽지 못했어요.');
  if (body.website) return json({ ok: true });
  const kind = KINDS.includes(body.kind) ? body.kind : 'other';
  const message = clip(body.message, 1000);
  if (message.length < 5) return fail('조금만 더 자세히 적어 주세요. (5자 이상)');
  let slug = clip(body.slug, 60);
  if (slug && !/^[a-z0-9-]+$/.test(slug)) slug = '';
  const ipHash = await ipHashOf(request);
  if (ipHash) {
    const since = new Date(Date.now() - 10 * 60e3).toISOString();
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since).first();
    if (row && row.n >= 5) return fail('짧은 시간에 너무 많이 보냈어요. 10분 뒤에 다시 보내 주세요.', 429);
  }
  await env.DB.prepare('INSERT INTO reports (created_at, slug, kind, message, contact, page, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(new Date().toISOString(), slug, kind, message, clip(body.contact, 100), clip(body.page, 200), ipHash).run();
  return json({ ok: true });
}

async function postEvent(request, env) {
  const body = await readBody(request, 1500);
  if (!body) return new Response(null, { status: 204 });
  // 방문 통계 (페이지 보기, 머문 시간, 검색과 기능 사용)
  try { await collect(request, env, body); } catch (e) { /* 통계 실패는 화면에 영향 없음 */ }
  if (!EVENTS.includes(body.t) || isBot(request)) return new Response(null, { status: 204 });
  let slug = clip(body.s, 60);
  if (slug) {
    const d = await assetJSON(env, request, '/data/games.json');
    const known = d ? new Set(d.games.map((g) => g.s)) : null;
    if (!/^[a-z0-9-]+$/.test(slug) || (known && !known.has(slug))) slug = '';
  }
  if (body.t !== 'venue' && !slug) return new Response(null, { status: 204 });
  await env.DB.prepare('INSERT INTO daily_counts (day, type, slug, venue, n) VALUES (?, ?, ?, ?, 1) ON CONFLICT (day, type, slug, venue) DO UPDATE SET n = n + 1')
    .bind(kstDay(), body.t, slug, clip(body.v, 40)).run();
  return new Response(null, { status: 204 });
}

const COMMUNITY = new Set(['community', 'posts', 'clubs', 'events', 'comments', 'flag', 'my']);
const SOCIAL = new Set(['games', 'reviews', 'checkin', 'growth', 'sync', 'users', 'rank', 'notes']);

export async function onRequest(context) {
  const { request, env, params } = context;
  const parts = [].concat(params.path || []);
  const route = parts[0] || '';
  const write = request.method !== 'GET' && request.method !== 'HEAD';
  try {
    if (route === 'health') return json({ ok: true, db: !!env.DB, admin: !!env.ADMIN_PASSWORD, coupangApi: !!(env.COUPANG_ACCESS_KEY && env.COUPANG_SECRET_KEY) });
    if (!env.DB) return fail('지금은 쓸 수 없어요. 운영자가 저장 공간(D1)을 아직 연결하지 않았어요.', 503);
    // 다른 사이트에서 몰래 보내는 요청은 받지 않아요 (운영 관리는 비밀번호 헤더로 따로 확인)
    if (write && route !== 'admin' && route !== 'admin-login' && route !== 'event' && !sameOrigin(request)) return fail('이 사이트에서 보낸 요청만 받아요.', 403);
    await ensureSchema(env.DB);

    if (route === 'report' && request.method === 'POST') return await postReport(request, env);
    if (route === 'event' && request.method === 'POST') return await postEvent(request, env);
    if (route === 'contact' && request.method === 'POST') return await contact(request, env);
    if (route === 'admin-login' && request.method === 'POST') return await adminLogin(request, env);
    if (route === 'admin') {
      if (!env.ADMIN_PASSWORD) return fail('Cloudflare에 ADMIN_PASSWORD가 아직 없어요. README의 설정 순서를 확인해 주세요.', 503);
      const who = await adminAuthed(request, env);
      if (!who) return fail('다시 로그인해 주세요.', 401);
      return await admin(request, env, parts.slice(1));
    }
    const me = await currentUser(request, env);
    if (route === 'me') {
      if (!me) return json({ ok: true, user: null });
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM notes WHERE user_id = ? AND read = 0').bind(me.id).first();
      const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
      return json({ ok: true, user: { ...publicUser(me), level: levelInfo(me.xp), unread: n ? n.n : 0, checked: me.last_checkin === today, streak: me.streak } });
    }
    if (route === 'auth') return await auth(request, env, parts.slice(1), me);
    if (COMMUNITY.has(route)) return await community(request, env, route, parts.slice(1), me);
    if (SOCIAL.has(route)) return await social(request, env, route, parts.slice(1), me);
    if (route === 'play' || route === 'fun' || route === 'chart') return await fun(request, env, route, me);
    return fail('없는 주소예요.', 404);
  } catch (e) {
    if (env.DEBUG_ERRORS) return fail(`서버 오류: ${e.message}`, 500);
    return fail('서버에서 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.', 500);
  }
}
