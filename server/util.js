// 서버 공통 도구
export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});
export const fail = (message, status = 400) => json({ ok: false, message }, status);

// 한국 시간
export const kstNow = () => new Date(Date.now() + 9 * 3600e3);
export const kstDay = (offsetDays = 0) => new Date(Date.now() + 9 * 3600e3 - offsetDays * 86400e3).toISOString().slice(0, 10);
export const kstStamp = () => kstNow().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
export const nowIso = () => new Date().toISOString();

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
export const randomToken = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));

// 길이가 달라도 같은 시간이 걸리도록 해시끼리 비교
export async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha256Hex(String(a || '')), sha256Hex(String(b || ''))]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0 && !!a;
}

export async function readBody(request, maxBytes) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

// 제어 문자를 빼고 앞뒤 공백을 지운 뒤 길이를 잘라요. 줄바꿈은 남겨요.
export const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, n);
export const oneLine = (s, n) => clip(s, n).replace(/\s+/g, ' ');

export async function ipHashOf(request) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  return ip ? (await sha256Hex(`rulerule:${ip}:${kstDay()}`)).slice(0, 16) : '';
}

// 같은 사이트에서 보낸 요청인지 확인 (다른 사이트가 몰래 보내는 요청 막기)
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = new URL(request.url).host;
  if (origin) {
    try { return new URL(origin).host === host; } catch (e) { return false; }
  }
  const ref = request.headers.get('referer');
  if (ref) {
    try { return new URL(ref).host === host; } catch (e) { return false; }
  }
  return false;
}

// 짧은 시간에 너무 많이 하는 것 막기
export async function tooMany(db, key, act, limit, minutes) {
  if (!key) return false;
  const since = new Date(Date.now() - minutes * 60e3).toISOString();
  const row = await db.prepare('SELECT COUNT(*) AS n FROM actions WHERE k = ? AND act = ? AND created_at > ?').bind(key, act, since).first();
  return !!(row && row.n >= limit);
}
export async function logAction(db, key, act) {
  if (!key) return;
  await db.prepare('INSERT INTO actions (k, act, created_at) VALUES (?, ?, ?)').bind(key, act, nowIso()).run();
  if (Math.random() < 0.03) {
    await db.prepare('DELETE FROM actions WHERE created_at < ?').bind(new Date(Date.now() - 2 * 86400e3).toISOString()).run();
  }
}

export const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '온라인'];
export const POST_CATS = { free: '자유', qna: '규칙 질문', review: '게임 후기', recommend: '추천해 주세요', poll: '투표', notice: '공지' };
export const USER_CATS = ['free', 'qna', 'review', 'recommend', 'poll'];

let schemaReady = false;
export async function ensureSchema(db) {
  // 처음 한 번만 실행돼요 (같은 서버 안에서)
  if (schemaReady) return;
  const T = (sql) => db.prepare(sql);
  await db.batch([
    T(`CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, slug TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL, message TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', page TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new')`),
    T('CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, id)'),
    T('CREATE INDEX IF NOT EXISTS idx_reports_ip ON reports (ip_hash, created_at)'),
    T(`CREATE TABLE IF NOT EXISTS daily_counts (day TEXT NOT NULL, type TEXT NOT NULL, slug TEXT NOT NULL DEFAULT '', venue TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, type, slug, venue))`),
    T(`CREATE TABLE IF NOT EXISTS actions (k TEXT NOT NULL, act TEXT NOT NULL, created_at TEXT NOT NULL)`),
    T('CREATE INDEX IF NOT EXISTS idx_actions ON actions (k, act, created_at)'),
    T(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT NOT NULL UNIQUE, nick TEXT NOT NULL UNIQUE, pw TEXT NOT NULL, region TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'ok', created_at TEXT NOT NULL, last_at TEXT NOT NULL DEFAULT '')`),
    T(`CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`),
    T('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)'),
    T(`CREATE TABLE IF NOT EXISTS clubs (id INTEGER PRIMARY KEY AUTOINCREMENT, owner_id INTEGER NOT NULL, name TEXT NOT NULL, region TEXT NOT NULL, area TEXT NOT NULL DEFAULT '', intro TEXT NOT NULL DEFAULT '', games TEXT NOT NULL DEFAULT '', openchat TEXT NOT NULL DEFAULT '', member_count INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0)`),
    T('CREATE INDEX IF NOT EXISTS idx_clubs_region ON clubs (hidden, region, id)'),
    T(`CREATE TABLE IF NOT EXISTS club_members (club_id INTEGER NOT NULL, user_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'member', created_at TEXT NOT NULL, PRIMARY KEY (club_id, user_id))`),
    T('CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members (user_id)'),
    T(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, club_id INTEGER NOT NULL DEFAULT 0, user_id INTEGER NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL, region TEXT NOT NULL, place TEXT NOT NULL DEFAULT '', starts_at TEXT NOT NULL, max_people INTEGER NOT NULL DEFAULT 4, games TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', fee TEXT NOT NULL DEFAULT '', attendee_count INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, canceled INTEGER NOT NULL DEFAULT 0)`),
    T('CREATE INDEX IF NOT EXISTS idx_events_start ON events (hidden, starts_at)'),
    T('CREATE INDEX IF NOT EXISTS idx_events_club ON events (club_id, starts_at)'),
    T(`CREATE TABLE IF NOT EXISTS event_members (event_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (event_id, user_id))`),
    T('CREATE INDEX IF NOT EXISTS idx_event_members_user ON event_members (user_id)'),
    T(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, cat TEXT NOT NULL, game TEXT NOT NULL DEFAULT '', title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, comments INTEGER NOT NULL DEFAULT 0, hidden INTEGER NOT NULL DEFAULT 0)`),
    T('CREATE INDEX IF NOT EXISTS idx_posts_list ON posts (hidden, cat, id)'),
    T('CREATE INDEX IF NOT EXISTS idx_posts_game ON posts (game, id)'),
    T(`CREATE TABLE IF NOT EXISTS post_likes (post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, PRIMARY KEY (post_id, user_id))`),
    T(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, target TEXT NOT NULL, target_id INTEGER NOT NULL, user_id INTEGER NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0)`),
    T('CREATE INDEX IF NOT EXISTS idx_comments_target ON comments (target, target_id, id)'),
    T(`CREATE TABLE IF NOT EXISTS flags (id INTEGER PRIMARY KEY AUTOINCREMENT, target TEXT NOT NULL, target_id INTEGER NOT NULL, user_id INTEGER NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', UNIQUE (target, target_id, user_id))`),
    T('CREATE INDEX IF NOT EXISTS idx_flags_status ON flags (status, id)'),
    T(`CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL, org TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '', message TEXT NOT NULL, page TEXT NOT NULL DEFAULT '', ip_hash TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', memo TEXT NOT NULL DEFAULT '')`),
    T('CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status, id)'),
    T(`CREATE TABLE IF NOT EXISTS shop_links (id TEXT PRIMARY KEY, url TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    T(`CREATE TABLE IF NOT EXISTS shop_clicks (day TEXT NOT NULL, id TEXT NOT NULL, src TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, id, src))`),
    // 성장과 참여 (2026-11-16)
    T(`CREATE TABLE IF NOT EXISTS points (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, act TEXT NOT NULL, ref TEXT NOT NULL DEFAULT '', pts INTEGER NOT NULL, day TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE (user_id, act, ref))`),
    T('CREATE INDEX IF NOT EXISTS idx_points_day ON points (user_id, act, day)'),
    T('CREATE INDEX IF NOT EXISTS idx_points_time ON points (created_at)'),
    T(`CREATE TABLE IF NOT EXISTS user_badges (user_id INTEGER NOT NULL, badge TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (user_id, badge))`),
    T(`CREATE TABLE IF NOT EXISTS marks (user_id INTEGER NOT NULL, slug TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (user_id, slug, kind))`),
    T('CREATE INDEX IF NOT EXISTS idx_marks_slug ON marks (slug, kind)'),
    T(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, user_id INTEGER NOT NULL, rating INTEGER NOT NULL, best TEXT NOT NULL DEFAULT '', diff INTEGER NOT NULL DEFAULT 0, body TEXT NOT NULL DEFAULT '', helpful INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, UNIQUE (slug, user_id))`),
    T('CREATE INDEX IF NOT EXISTS idx_reviews_slug ON reviews (slug, hidden, id)'),
    T('CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews (user_id)'),
    T(`CREATE TABLE IF NOT EXISTS review_helpful (review_id INTEGER NOT NULL, user_id INTEGER NOT NULL, PRIMARY KEY (review_id, user_id))`),
    T(`CREATE TABLE IF NOT EXISTS poll_options (post_id INTEGER NOT NULL, idx INTEGER NOT NULL, label TEXT NOT NULL, votes INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (post_id, idx))`),
    T(`CREATE TABLE IF NOT EXISTS poll_votes (post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, idx INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (post_id, user_id))`),
    T(`CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, link TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0)`),
    T('CREATE INDEX IF NOT EXISTS idx_notes_user ON notes (user_id, read, id)'),
    T(`CREATE TABLE IF NOT EXISTS manner (event_id INTEGER NOT NULL, from_id INTEGER NOT NULL, to_id INTEGER NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (event_id, from_id, to_id))`),
    T(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL DEFAULT '')`),
  ]);
  // 이미 있는 표에 새 칸 더하기
  const ADD = {
    users: [['xp', 'INTEGER NOT NULL DEFAULT 0'], ['stars', 'INTEGER NOT NULL DEFAULT 0'], ['badge', "TEXT NOT NULL DEFAULT ''"], ['streak', 'INTEGER NOT NULL DEFAULT 0'], ['last_checkin', "TEXT NOT NULL DEFAULT ''"], ['checkins', 'INTEGER NOT NULL DEFAULT 0'], ['manner_sum', 'INTEGER NOT NULL DEFAULT 0'], ['manner_n', 'INTEGER NOT NULL DEFAULT 0']],
    posts: [['pinned', 'INTEGER NOT NULL DEFAULT 0'], ['adopted', 'INTEGER NOT NULL DEFAULT 0'], ['poll_ends', "TEXT NOT NULL DEFAULT ''"]],
  };
  for (const [table, cols] of Object.entries(ADD)) {
    const { results } = await db.prepare(`PRAGMA table_info(${table})`).all();
    const have = new Set(results.map((r) => r.name));
    for (const [c, def] of cols) {
      if (!have.has(c)) {
        try { await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${c} ${def}`).run(); } catch (e) { /* 다른 요청이 먼저 더했으면 넘어가요 */ }
      }
    }
  }
  try { await db.prepare('CREATE INDEX IF NOT EXISTS idx_users_xp ON users (status, xp)').run(); } catch (e) { /* 넘어가요 */ }
  await seed(db);
  schemaReady = true;
}

// 운영팀 계정과 첫 공지·투표 (한 번만)
export const SYSTEM_LOGIN = 'rulerule_team';
export async function systemUserId(db) {
  let u = await db.prepare('SELECT id FROM users WHERE login = ?').bind(SYSTEM_LOGIN).first();
  if (u) return u.id;
  await db.prepare("INSERT OR IGNORE INTO users (login, nick, pw, status, created_at, xp) VALUES (?, '룰룰 운영팀', '', 'system', ?, 0)").bind(SYSTEM_LOGIN, nowIso()).run();
  u = await db.prepare('SELECT id FROM users WHERE login = ?').bind(SYSTEM_LOGIN).first();
  return u.id;
}
async function seed(db) {
  const done = await db.prepare("SELECT v FROM kv WHERE k = 'seed1'").first();
  if (done) return;
  const r = await db.prepare("INSERT OR IGNORE INTO kv (k, v) VALUES ('seed1', ?)").bind(nowIso()).run();
  if (!r.meta.changes) return;
  const sid = await systemUserId(db);
  const now = nowIso();
  const notice = `룰룰 커뮤니티를 열었어요. 이곳에서 활동하면 점수가 쌓이고 등급이 올라가요.

· 출석 체크, 게임 별점과 후기, 해 봤어요 체크, 글과 댓글, 투표, 모임 참여로 점수를 모아요.
· 점수가 쌓이면 ‘첫 판’에서 ‘룰룰 레전드’까지 10단계 등급이 올라가요.
· 다른 사람이 내 글에 좋아요를, 내 후기에 도움돼요를 누르면 별을 받아요.
· 일주일 개근, 도감 10, 규칙 해결사 같은 배지 17가지를 모아 보세요. 마음에 드는 배지는 닉네임 옆에 달 수 있어요.

자세한 규칙은 ‘등급과 배지 안내’ 페이지에 정리해 두었어요.`;
  const p1 = await db.prepare("INSERT INTO posts (user_id, cat, game, title, body, created_at, updated_at, pinned) VALUES (?, 'notice', '', ?, ?, ?, ?, 1)").bind(sid, '룰룰 커뮤니티 이용 안내: 등급, 별, 배지', notice, now, now).run();
  const ends = new Date(Date.now() + 14 * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10);
  const p2 = await db.prepare("INSERT INTO posts (user_id, cat, game, title, body, created_at, updated_at, pinned, poll_ends) VALUES (?, 'poll', '', ?, ?, ?, ?, 1, ?)").bind(sid, '이번 주말 모임, 어떤 게임이 가장 하고 싶나요?', '한 표씩 골라 주세요. 결과는 다음 모임 추천에 반영할게요. 다른 게임이 있다면 댓글로 알려 주세요.', now, now, ends).run();
  const opts = ['루미큐브', '할리갈리', '다빈치 코드', '스플렌더', '아발론'];
  await db.batch(opts.map((o, i) => db.prepare('INSERT INTO poll_options (post_id, idx, label) VALUES (?, ?, ?)').bind(p2.meta.last_row_id, i, o)));
  void p1;
}

// 빌드 결과물(정적 파일)에서 JSON 읽기
const assetCache = {};
export async function assetJSON(env, request, p) {
  if (assetCache[p]) return assetCache[p];
  try {
    const r = await env.ASSETS.fetch(new URL(p, request.url));
    if (!r.ok) return null;
    assetCache[p] = await r.json();
    return assetCache[p];
  } catch (e) {
    return null;
  }
}
