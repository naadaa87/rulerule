// 원고마다 처음 올린 날과 마지막으로 고친 날을 git 기록에서 읽어 content/dates.json에 적어요.
// 사이트맵 lastmod, RSS pubDate, 구조화 데이터(datePublished, dateModified)에 써요.
// 원고를 고친 뒤 `npm run dates`로 다시 만들면 돼요. (Cloudflare 빌드는 이 파일만 읽어요)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const out = {};
for (const dir of ['content/games', 'content/stories']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.json')).sort()) {
    const rel = `${dir}/${f}`;
    const days = git(['log', '--format=%cs', '--', rel]).split('\n').filter(Boolean);
    if (!days.length) continue;
    out[rel] = { pub: days[days.length - 1], mod: days[0] };
  }
}
fs.writeFileSync(path.join(ROOT, 'content', 'dates.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`content/dates.json: 원고 ${Object.keys(out).length}개의 날짜를 적었어요.`);
