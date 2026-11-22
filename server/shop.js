// 보드게임몰: 쿠팡 파트너스 링크 이동과 관리
import { json, fail, readBody, nowIso, kstDay, assetJSON } from './util.js';
import { logClick, isBot } from './kpi.js';

export const searchUrl = (q) => `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(q)}&channel=user`;
export const productUrl = (p) => `https://www.coupang.com/vp/products/${p}`;
const okLink = (u) => /^https:\/\/(link\.coupang\.com|coupa\.ng|www\.coupang\.com|m\.coupang\.com)\//.test(u || '');
const STATES = ['', 'ok', 'broken'];

// 상품 페이지 대신 보낼 곳: 관리 화면의 검색 링크 → 원고의 검색 링크(파트너스) → 쿠팡 검색 결과
function altOf(item, row) {
  if (row && okLink(row.alt)) return row.alt;
  if (okLink(item.s)) return item.s;
  return searchUrl(item.q);
}

// /go/{상품} : 파트너스 링크로 보내고 하루 단위로 몇 번 눌렸는지 세요
// ?alt=1 이면 상품 페이지 대신 검색 결과로, 관리 화면에서 '안 열림'으로 표시한 상품도 검색 결과로 보내요
export async function go(request, env, id) {
  const fallback = new URL('/shop/', request.url).toString();
  if (!/^[a-z0-9-]{1,60}$/.test(id || '')) return Response.redirect(fallback, 302);
  const shop = await assetJSON(env, request, '/data/shop.json');
  const item = shop && shop.items[id];
  if (!item) return Response.redirect(fallback, 302);
  const params = new URL(request.url).searchParams;
  const wantAlt = params.get('alt') === '1';
  let row = null;
  if (env.DB) {
    try { row = await env.DB.prepare('SELECT url, alt, state FROM shop_links WHERE id = ?').bind(id).first(); } catch (e) { /* 표가 아직 없으면 원고 링크로 */ }
  }
  const useAlt = wantAlt || (row && row.state === 'broken');
  const target = useAlt ? altOf(item, row) : (row && okLink(row.url) ? row.url : item.u || searchUrl(item.q));
  if (env.DB && !isBot(request)) {
    try {
      const src = ((params.get('from') || '').replace(/[^a-z0-9-]/g, '').slice(0, 36) + (useAlt ? '-alt' : '')).replace(/^-/, '');
      await env.DB.prepare('INSERT INTO shop_clicks (day, id, src, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, id, src) DO UPDATE SET n = n + 1').bind(kstDay(), id, src).run();
      await logClick(request, env, id, src);
    } catch (e) { /* 집계가 실패해도 이동은 해요 */ }
  }
  return new Response(null, { status: 302, headers: { location: target, 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer-when-downgrade' } });
}

// 쿠팡 파트너스 Open API로 링크 만들기 (COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY가 있을 때만)
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function deeplinks(env, urls) {
  const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';
  const d = new Date().toISOString();
  const signed = `${d.slice(2, 4)}${d.slice(5, 7)}${d.slice(8, 10)}T${d.slice(11, 13)}${d.slice(14, 16)}${d.slice(17, 19)}Z`;
  const signature = await hmacHex(env.COUPANG_SECRET_KEY, `${signed}POST${path}`);
  const r = await fetch(`https://api-gateway.coupang.com${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json;charset=UTF-8', authorization: `CEA algorithm=HmacSHA256, access-key=${env.COUPANG_ACCESS_KEY}, signed-date=${signed}, signature=${signature}` },
    body: JSON.stringify({ coupangUrls: urls }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || String(j.rCode) !== '0') throw new Error(j.rMessage || j.message || `쿠팡 API 응답 ${r.status}`);
  return j.data || [];
}

const upsert = (db, id, f) => db.prepare(`INSERT INTO shop_links (id, url, alt, state, note, checked_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET url = excluded.url, alt = excluded.alt, state = excluded.state, note = excluded.note, checked_at = excluded.checked_at, updated_at = excluded.updated_at`)
  .bind(id, f.url || '', f.alt || '', f.state || '', f.note || '', f.checked_at || '', nowIso());

export async function adminShop(request, env, parts) {
  const db = env.DB;
  const [action] = parts;
  if (!action && request.method === 'GET') {
    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 30, 1), 365);
    const [links, clicks, bySrc, reports] = await db.batch([
      db.prepare('SELECT id, url, alt, state, note, checked_at, updated_at FROM shop_links'),
      db.prepare('SELECT id, SUM(n) AS n FROM shop_clicks WHERE day >= ? GROUP BY id').bind(kstDay(days - 1)),
      db.prepare("SELECT src, SUM(n) AS n FROM shop_clicks WHERE day >= ? GROUP BY src ORDER BY n DESC LIMIT 20").bind(kstDay(days - 1)),
      db.prepare("SELECT slug AS id, COUNT(*) AS n, MAX(created_at) AS last FROM reports WHERE kind = 'link' AND status = 'new' GROUP BY slug"),
    ]);
    return json({ ok: true, days, api: !!(env.COUPANG_ACCESS_KEY && env.COUPANG_SECRET_KEY), links: links.results, clicks: clicks.results, sources: bySrc.results, linkReports: reports.results });
  }
  // 링크 저장·점검 표시: 보낸 칸만 바꾸고, 모든 칸이 비면 지워요
  if (action === 'link' && request.method === 'POST') {
    const b = await readBody(request, 3000);
    if (!b || !/^[a-z0-9-]{1,60}$/.test(b.id || '')) return fail('상품을 알 수 없어요.');
    const cur = (await db.prepare('SELECT url, alt, state, note, checked_at FROM shop_links WHERE id = ?').bind(b.id).first()) || {};
    const f = { url: cur.url || '', alt: cur.alt || '', state: cur.state || '', note: cur.note || '', checked_at: cur.checked_at || '' };
    for (const k of ['url', 'alt']) {
      if (b[k] === undefined) continue;
      const u = String(b[k] || '').trim();
      if (u && !okLink(u)) return fail('쿠팡 파트너스 링크(https://link.coupang.com/...)를 넣어 주세요.');
      f[k] = u;
    }
    if (b.state !== undefined) {
      if (!STATES.includes(b.state)) return fail('상태를 알 수 없어요.');
      f.state = b.state;
      f.checked_at = b.state ? nowIso() : '';
    }
    if (b.note !== undefined) f.note = String(b.note || '').slice(0, 200);
    if (!f.url && !f.alt && !f.state && !f.note) {
      await db.prepare('DELETE FROM shop_links WHERE id = ?').bind(b.id).run();
      return json({ ok: true, removed: true });
    }
    await upsert(db, b.id, f).run();
    // '정상'으로 확인하면 그 상품의 링크 신고는 처리한 것으로 옮겨요
    if (b.state === 'ok') await db.prepare("UPDATE reports SET status = 'done' WHERE kind = 'link' AND slug = ? AND status = 'new'").bind(b.id).run();
    return json({ ok: true, link: f });
  }
  // Open API: 상품 단위 링크(판매자가 바뀌어도 열리는 주소)와 검색 결과 링크를 한꺼번에 만들어요
  if (action === 'auto' && request.method === 'POST') {
    if (!env.COUPANG_ACCESS_KEY || !env.COUPANG_SECRET_KEY) return fail('Cloudflare에 COUPANG_ACCESS_KEY와 COUPANG_SECRET_KEY가 없어요. 쿠팡 파트너스 API 승인 뒤 넣어 주세요.', 400);
    const b = (await readBody(request, 500)) || {};
    const all = b.mode === 'all';
    const shop = await assetJSON(env, request, '/data/shop.json');
    const { results } = await db.prepare('SELECT id, url, alt, state, note, checked_at FROM shop_links').all();
    const have = Object.fromEntries(results.map((r) => [r.id, r]));
    // 할 일: [상품, 칸, 쿠팡 주소]
    const jobs = [];
    for (const [id, it] of Object.entries(shop.items)) {
      const r = have[id] || {};
      if ((all || !(r.url || it.p)) && it.cu) jobs.push([id, 'url', it.cu]);
      if ((all || !(r.alt || it.s)) && it.q && id !== 'coupang-boardgames') jobs.push([id, 'alt', searchUrl(it.q)]);
    }
    const offset = all ? Math.max(0, Number(b.offset) || 0) : 0;
    const todo = jobs.slice(offset, offset + 40);
    let made = 0;
    try {
      for (let i = 0; i < todo.length; i += 10) {
        const chunk = todo.slice(i, i + 10);
        const data = await deeplinks(env, chunk.map((j) => j[2]));
        for (let k = 0; k < chunk.length; k++) {
          const short = data[k] && data[k].shortenUrl;
          if (!short || !okLink(short)) continue;
          const [id, field] = chunk[k];
          const r = have[id] || { url: '', alt: '', state: '', note: '', checked_at: '' };
          r[field] = short;
          have[id] = r;
          await upsert(db, id, r).run();
          made++;
        }
      }
    } catch (e) {
      return fail(`링크를 ${made}개 만든 뒤 멈췄어요: ${e.message}`, 502);
    }
    const next = offset + todo.length;
    return json({ ok: true, made, next, total: jobs.length, left: Math.max(0, jobs.length - next) });
  }
  return fail('없는 주소예요.', 404);
}
