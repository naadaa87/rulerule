// 검색엔진에 새 페이지 알리기 (IndexNow)
// 네이버(서치어드바이저)와 IndexNow 공용 주소(빙 등 참여 검색엔진에 함께 전달)로 보내요.
// 열쇠는 site.config.json의 indexNowKey이고, 빌드가 /{열쇠}.txt와 /data/site.json에 적어 둬요.
import { json, fail, readBody, assetJSON, nowIso } from './util.js';

const ENDPOINTS = [
  ['네이버', 'https://searchadvisor.naver.com/indexnow'],
  ['IndexNow(빙 등)', 'https://api.indexnow.org/indexnow'],
];

async function sitemapUrls(env, request) {
  try {
    const r = await env.ASSETS.fetch(new URL('/sitemap.xml', request.url));
    if (!r.ok) return [];
    const xml = await r.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch (e) {
    return [];
  }
}

export async function indexNow(request, env) {
  const site = await assetJSON(env, request, '/data/site.json');
  if (!site || !site.indexNowKey || !site.siteUrl) return fail('IndexNow 열쇠가 없어요. site.config.json의 indexNowKey를 확인해 주세요.', 400);
  const base = new URL(site.siteUrl);
  if (request.method === 'GET') {
    const last = env.DB ? await env.DB.prepare("SELECT v FROM kv WHERE k = 'indexnow_last'").first() : null;
    return json({ ok: true, key: site.indexNowKey, keyLocation: `${base.origin}/${site.indexNowKey}.txt`, last: last ? JSON.parse(last.v) : null });
  }
  if (request.method !== 'POST') return fail('없는 주소예요.', 404);
  const b = (await readBody(request, 20000)) || {};
  let urls = Array.isArray(b.urls) && b.urls.length ? b.urls : await sitemapUrls(env, request);
  urls = [...new Set(urls.map((u) => String(u).trim()).filter((u) => {
    try { return new URL(u).host === base.host; } catch (e) { return false; }
  }))].slice(0, 10000);
  if (!urls.length) return fail('알릴 주소가 없어요.');
  const body = JSON.stringify({ host: base.host, key: site.indexNowKey, keyLocation: `${base.origin}/${site.indexNowKey}.txt`, urlList: urls });
  const results = [];
  for (const [name, endpoint] of ENDPOINTS) {
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body });
      results.push({ name, status: r.status, ok: r.status === 200 || r.status === 202 });
    } catch (e) {
      results.push({ name, status: 0, ok: false, error: String(e.message || e).slice(0, 120) });
    }
  }
  const record = { at: nowIso(), count: urls.length, results };
  if (env.DB) {
    try { await env.DB.prepare("INSERT INTO kv (k, v) VALUES ('indexnow_last', ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(record)).run(); } catch (e) { /* 기록 실패는 넘어가요 */ }
  }
  return json({ ok: results.some((x) => x.ok), ...record });
}
