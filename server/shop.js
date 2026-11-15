// 보드게임몰: 쿠팡 파트너스 링크 이동과 관리
import { json, fail, readBody, nowIso, kstDay, assetJSON } from './util.js';

export const searchUrl = (q) => `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(q)}&channel=user`;
const okLink = (u) => /^https:\/\/(link\.coupang\.com|coupa\.ng|www\.coupang\.com|m\.coupang\.com)\//.test(u || '');

// /go/{상품} : 파트너스 링크로 보내고 하루 단위로 몇 번 눌렸는지 세요
export async function go(request, env, id) {
  const fallback = new URL('/shop/', request.url).toString();
  if (!/^[a-z0-9-]{1,60}$/.test(id || '')) return Response.redirect(fallback, 302);
  const shop = await assetJSON(env, request, '/data/shop.json');
  const item = shop && shop.items[id];
  if (!item) return Response.redirect(fallback, 302);
  let target = item.u || searchUrl(item.q);
  if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT url FROM shop_links WHERE id = ?').bind(id).first();
      if (row && okLink(row.url)) target = row.url;
      const src = (new URL(request.url).searchParams.get('from') || '').replace(/[^a-z0-9-]/g, '').slice(0, 40);
      await env.DB.prepare('INSERT INTO shop_clicks (day, id, src, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, id, src) DO UPDATE SET n = n + 1').bind(kstDay(), id, src).run();
    } catch (e) { /* 표가 아직 없으면 그냥 보내요 */ }
  }
  return new Response(null, { status: 302, headers: { location: target, 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer-when-downgrade' } });
}

// 쿠팡 파트너스 Open API로 링크 자동 만들기 (COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY가 있을 때만)
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

export async function adminShop(request, env, parts) {
  const db = env.DB;
  const [action] = parts;
  if (!action && request.method === 'GET') {
    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get('days')) || 30, 1), 365);
    const [links, clicks, bySrc] = await db.batch([
      db.prepare('SELECT id, url, updated_at FROM shop_links'),
      db.prepare('SELECT id, SUM(n) AS n FROM shop_clicks WHERE day >= ? GROUP BY id').bind(kstDay(days - 1)),
      db.prepare("SELECT src, SUM(n) AS n FROM shop_clicks WHERE day >= ? GROUP BY src ORDER BY n DESC LIMIT 20").bind(kstDay(days - 1)),
    ]);
    return json({ ok: true, days, api: !!(env.COUPANG_ACCESS_KEY && env.COUPANG_SECRET_KEY), links: links.results, clicks: clicks.results, sources: bySrc.results });
  }
  if (action === 'link' && request.method === 'POST') {
    const b = await readBody(request, 2000);
    if (!b || !/^[a-z0-9-]{1,60}$/.test(b.id || '')) return fail('상품을 알 수 없어요.');
    const u = String(b.url || '').trim();
    if (!u) {
      await db.prepare('DELETE FROM shop_links WHERE id = ?').bind(b.id).run();
      return json({ ok: true, removed: true });
    }
    if (!okLink(u)) return fail('쿠팡 파트너스 링크(https://link.coupang.com/...)를 넣어 주세요.');
    await db.prepare('INSERT INTO shop_links (id, url, updated_at) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET url = excluded.url, updated_at = excluded.updated_at').bind(b.id, u, nowIso()).run();
    return json({ ok: true });
  }
  if (action === 'auto' && request.method === 'POST') {
    if (!env.COUPANG_ACCESS_KEY || !env.COUPANG_SECRET_KEY) return fail('Cloudflare에 COUPANG_ACCESS_KEY와 COUPANG_SECRET_KEY가 없어요. 쿠팡 파트너스 API 승인 뒤 넣어 주세요.', 400);
    const shop = await assetJSON(env, request, '/data/shop.json');
    const { results } = await db.prepare('SELECT id FROM shop_links').all();
    const have = new Set(results.map((r) => r.id));
    const todo = Object.entries(shop.items).filter(([id]) => !have.has(id)).slice(0, 40);
    let made = 0;
    try {
      for (let i = 0; i < todo.length; i += 10) {
        const chunk = todo.slice(i, i + 10);
        const data = await deeplinks(env, chunk.map(([, it]) => it.u || searchUrl(it.q)));
        for (let k = 0; k < chunk.length; k++) {
          const short = data[k] && data[k].shortenUrl;
          if (short && okLink(short)) {
            await db.prepare('INSERT INTO shop_links (id, url, updated_at) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET url = excluded.url, updated_at = excluded.updated_at').bind(chunk[k][0], short, nowIso()).run();
            made++;
          }
        }
      }
    } catch (e) {
      return fail(`링크를 ${made}개 만든 뒤 멈췄어요: ${e.message}`, 502);
    }
    return json({ ok: true, made, left: Math.max(0, Object.keys(shop.items).length - have.size - made) });
  }
  return fail('없는 주소예요.', 404);
}
