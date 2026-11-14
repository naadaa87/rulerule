// 룰룰 서버 기능 (Cloudflare Pages Functions)
// - POST /api/report  : 틀린 곳 알려 주기 저장
// - POST /api/event   : 날짜별 이용 숫자 세기 (개인 정보 없음)
// - GET  /api/health  : 설정 확인
// - /api/admin/...    : 운영 관리 (x-admin-key 헤더에 ADMIN_PASSWORD)
//
// 필요한 설정 (Cloudflare 대시보드 > Pages 프로젝트 > 설정)
// - D1 데이터베이스 바인딩: 변수 이름 DB
// - 환경 변수(비밀): ADMIN_PASSWORD
// 표는 처음 쓸 때 자동으로 만들어져요. SQL을 따로 실행하지 않아도 돼요.

const KINDS = ['wrong', 'unclear', 'typo', 'request', 'other'];
const EVENTS = ['view', 'table', 'qr', 'venue', 'speak', 'share'];

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// 한국 날짜 (YYYY-MM-DD)
const kstDay = (offsetDays = 0) => new Date(Date.now() + 9 * 3600e3 - offsetDays * 86400e3).toISOString().slice(0, 10);

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      slug TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      message TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT '',
      ip_hash TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new'
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_reports_ip ON reports (ip_hash, created_at)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS daily_counts (
      day TEXT NOT NULL,
      type TEXT NOT NULL,
      slug TEXT NOT NULL DEFAULT '',
      venue TEXT NOT NULL DEFAULT '',
      n INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, type, slug, venue)
    )`),
  ]);
  schemaReady = true;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 길이가 달라도 같은 시간이 걸리도록 해시끼리 비교
async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256Hex(String(a || '')), sha256Hex(String(b || ''))]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0 && !!a;
}

// 게임 목록 (빌드 결과물에서 읽어 와 잠시 기억)
let knownSlugs = null;
async function slugSet(env, request) {
  if (knownSlugs) return knownSlugs;
  try {
    const r = await env.ASSETS.fetch(new URL('/data/games.json', request.url));
    const d = await r.json();
    knownSlugs = new Set(d.games.map((g) => g.s));
  } catch (e) {
    knownSlugs = null;
  }
  return knownSlugs;
}

async function readJSON(request, maxBytes) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

// ---------- 틀린 곳 알려 주기 ----------
async function postReport(request, env) {
  const body = await readJSON(request, 6000);
  if (!body) return json({ ok: false, message: '보낸 내용을 읽지 못했어요.' }, 400);
  if (body.website) return json({ ok: true }); // 자동 입력 방지 칸이 채워졌으면 조용히 무시
  const kind = KINDS.includes(body.kind) ? body.kind : 'other';
  const message = clip(body.message, 1000);
  if (message.length < 5) return json({ ok: false, message: '조금만 더 자세히 적어 주세요. (5자 이상)' }, 400);
  let slug = clip(body.slug, 60);
  if (slug && !/^[a-z0-9-]+$/.test(slug)) slug = '';
  if (!env.DB) return json({ ok: false, message: '지금은 보낼 수 없어요. 운영자가 저장 공간을 아직 연결하지 않았어요.' }, 503);
  await ensureSchema(env.DB);

  const ip = request.headers.get('cf-connecting-ip') || '';
  const ipHash = ip ? (await sha256Hex(`rulerule:${ip}:${kstDay()}`)).slice(0, 16) : '';
  if (ipHash) {
    const since = new Date(Date.now() - 10 * 60e3).toISOString();
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE ip_hash = ? AND created_at > ?').bind(ipHash, since).first();
    if (row && row.n >= 5) return json({ ok: false, message: '짧은 시간에 너무 많이 보냈어요. 10분 뒤에 다시 보내 주세요.' }, 429);
  }
  await env.DB.prepare('INSERT INTO reports (created_at, slug, kind, message, contact, page, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(new Date().toISOString(), slug, kind, message, clip(body.contact, 100), clip(body.page, 200), ipHash).run();
  return json({ ok: true });
}

// ---------- 이용 숫자 세기 ----------
async function postEvent(request, env) {
  const body = await readJSON(request, 600);
  if (!body || !EVENTS.includes(body.t) || !env.DB) return new Response(null, { status: 204 });
  let slug = clip(body.s, 60);
  if (slug) {
    const known = await slugSet(env, request);
    if (!/^[a-z0-9-]+$/.test(slug) || (known && !known.has(slug))) slug = '';
  }
  if (body.t !== 'venue' && !slug) return new Response(null, { status: 204 });
  const venue = clip(body.v, 40);
  await ensureSchema(env.DB);
  await env.DB.prepare('INSERT INTO daily_counts (day, type, slug, venue, n) VALUES (?, ?, ?, ?, 1) ON CONFLICT (day, type, slug, venue) DO UPDATE SET n = n + 1')
    .bind(kstDay(), body.t, slug, venue).run();
  return new Response(null, { status: 204 });
}

// ---------- 운영 관리 ----------
async function admin(request, env, parts) {
  if (!env.ADMIN_PASSWORD) return json({ ok: false, message: 'Cloudflare에 ADMIN_PASSWORD가 아직 없어요. README의 설정 순서를 확인해 주세요.' }, 503);
  if (!(await sameSecret(request.headers.get('x-admin-key'), env.ADMIN_PASSWORD))) return json({ ok: false, message: '비밀번호가 맞지 않아요.' }, 401);
  if (!env.DB) return json({ ok: false, message: 'D1 데이터베이스(DB)가 아직 연결되지 않았어요. README의 설정 순서를 확인해 주세요.' }, 503);
  await ensureSchema(env.DB);
  const url = new URL(request.url);
  const [section, id] = parts;

  if (section === 'reports' && !id && request.method === 'GET') {
    const st = url.searchParams.get('status') || 'new';
    const q = st === 'all'
      ? env.DB.prepare('SELECT id, created_at, slug, kind, message, contact, page, status FROM reports ORDER BY id DESC LIMIT 200')
      : env.DB.prepare('SELECT id, created_at, slug, kind, message, contact, page, status FROM reports WHERE status = ? ORDER BY id DESC LIMIT 200').bind(st === 'done' ? 'done' : 'new');
    const { results } = await q.all();
    return json({ ok: true, reports: results });
  }
  if (section === 'reports' && id && /^\d+$/.test(id)) {
    if (request.method === 'POST') {
      const body = await readJSON(request, 200);
      const st = body && body.status === 'done' ? 'done' : 'new';
      await env.DB.prepare('UPDATE reports SET status = ? WHERE id = ?').bind(st, Number(id)).run();
      return json({ ok: true });
    }
    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM reports WHERE id = ?').bind(Number(id)).run();
      return json({ ok: true });
    }
  }
  if (section === 'stats' && request.method === 'GET') {
    const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 30, 1), 365);
    const from = kstDay(days - 1);
    const [totals, daily, games, venues] = await env.DB.batch([
      env.DB.prepare('SELECT type, SUM(n) AS n FROM daily_counts WHERE day >= ? GROUP BY type').bind(from),
      env.DB.prepare("SELECT day, SUM(n) AS n FROM daily_counts WHERE day >= ? AND type = 'view' GROUP BY day ORDER BY day").bind(from),
      env.DB.prepare(`SELECT slug,
          SUM(CASE WHEN type = 'view' THEN n ELSE 0 END) AS view,
          SUM(CASE WHEN type = 'table' THEN n ELSE 0 END) AS "table",
          SUM(CASE WHEN type = 'qr' THEN n ELSE 0 END) AS qr
        FROM daily_counts WHERE day >= ? AND slug != '' GROUP BY slug ORDER BY view DESC, "table" DESC LIMIT 30`).bind(from),
      env.DB.prepare("SELECT venue, SUM(n) AS n FROM daily_counts WHERE day >= ? AND venue != '' GROUP BY venue ORDER BY n DESC LIMIT 30").bind(from),
    ]);
    const t = {};
    for (const r of totals.results) t[r.type] = r.n;
    return json({ ok: true, days, totals: t, daily: daily.results, games: games.results, venues: venues.results });
  }
  return json({ ok: false, message: '없는 주소예요.' }, 404);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const parts = [].concat(params.path || []);
  const route = parts[0] || '';
  try {
    if (route === 'health') return json({ ok: true, db: !!env.DB, admin: !!env.ADMIN_PASSWORD });
    if (route === 'report' && request.method === 'POST') return await postReport(request, env);
    if (route === 'event' && request.method === 'POST') return await postEvent(request, env);
    if (route === 'admin') return await admin(request, env, parts.slice(1));
    return json({ ok: false, message: '없는 주소예요.' }, 404);
  } catch (e) {
    return json({ ok: false, message: '서버에서 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.' }, 500);
  }
}
