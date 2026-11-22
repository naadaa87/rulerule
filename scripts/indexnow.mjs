// 검색엔진에 새 페이지 알리기 (IndexNow) — GitHub Actions가 main에 올라간 뒤 자동으로 실행해요.
// 사이트맵의 주소를 네이버 서치어드바이저와 IndexNow 공용 주소(빙 등)에 보내요.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const site = cfg.siteUrl.replace(/\/$/, '');
const key = cfg.indexNowKey;
if (!key) { console.log('indexNowKey가 없어서 건너뛰어요.'); process.exit(0); }
const host = new URL(site).host;

const keyRes = await fetch(`${site}/${key}.txt`);
const keyText = (await keyRes.text()).trim();
if (keyRes.status !== 200 || keyText !== key) {
  console.error(`열쇠 파일이 아직 안 보여요 (${keyRes.status}). 배포가 끝난 뒤 다시 실행해 주세요.`);
  process.exit(1);
}
const xml = await (await fetch(`${site}/sitemap.xml`)).text();
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))].filter((u) => new URL(u).host === host).slice(0, 10000);
console.log(`사이트맵 주소 ${urls.length}개를 알려요.`);
const body = JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList: urls });
let ok = 0;
for (const [name, endpoint] of [['네이버', 'https://searchadvisor.naver.com/indexnow'], ['IndexNow(빙 등)', 'https://api.indexnow.org/indexnow']]) {
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body });
    const t = (await r.text()).slice(0, 200);
    console.log(`${name}: ${r.status} ${t}`);
    if (r.status === 200 || r.status === 202) ok++;
  } catch (e) {
    console.log(`${name}: 실패 ${e.message}`);
  }
}
if (!ok) process.exit(1);
