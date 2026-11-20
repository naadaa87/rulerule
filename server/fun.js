// 재미로 알아보기: 취향 테스트, 보드게임 월드컵, 상식 퀴즈 결과 모으기와 점수
// - POST /api/play  { act: 'typetest' | 'cup' | 'quiz' | 'plan' | 'spin', ... }
// - GET  /api/fun   모두의 결과 (유형 비율, 월드컵 순위)
// - GET  /api/chart 룰룰 차트 (이번 주 많이 본 게임, 저장·해 본 게임, 별점, 모임 게임 짜기)
import { json, fail, readBody, clip, ipHashOf, tooMany, logAction, assetJSON, kstDay } from './util.js';
import { grow } from './growth.js';
import { isBot } from './kpi.js';

export const TYPES = ['strategy', 'bluff', 'speed', 'talk', 'coop', 'puzzle', 'luck', 'create'];
const SLUG = /^[a-z0-9-]{2,40}$/;

async function knownSlugs(env, request) {
  const d = await assetJSON(env, request, '/data/games.json');
  return d ? new Set(d.games.map((g) => g.s)) : null;
}
const bump = (db, kind, key, n = 1) => db.prepare('INSERT INTO fun_stats (kind, k, n) VALUES (?, ?, ?) ON CONFLICT (kind, k) DO UPDATE SET n = n + excluded.n').bind(kind, key, n);

async function play(request, env, me) {
  const body = await readBody(request, 4000);
  if (!body) return fail('보낸 내용을 읽지 못했어요.');
  const act = String(body.act || '');
  const db = env.DB;
  const ip = await ipHashOf(request);
  const bot = isBot(request);
  const uid = me ? me.id : 0;

  if (act === 'typetest') {
    const type = String(body.type || '');
    if (!TYPES.includes(type)) return fail('알 수 없는 유형이에요.');
    if (!bot && !(await tooMany(db, ip, 'typetest', 20, 60))) {
      await bump(db, 'type', type).run();
      await logAction(db, ip, 'typetest');
    }
    const gain = uid ? await grow(env, request, uid, 'typetest', type, ['taste']) : null;
    return json({ ok: true, gain });
  }

  if (act === 'cup') {
    const known = await knownSlugs(env, request);
    const ok = (s) => SLUG.test(String(s || '')) && (!known || known.has(s));
    const champ = String(body.champ || '');
    const matches = Array.isArray(body.matches) ? body.matches.slice(0, 31) : [];
    const clean = matches.filter((m) => Array.isArray(m) && m.length === 2 && ok(m[0]) && ok(m[1]) && m[0] !== m[1]);
    if (!ok(champ) || clean.length < 3) return fail('결과를 읽지 못했어요.');
    if (!bot && !(await tooMany(db, ip, 'cup', 12, 60))) {
      const st = [bump(db, 'cup_champ', champ)];
      for (const [w, l] of clean) st.push(bump(db, 'cup_win', w), bump(db, 'cup_game', w), bump(db, 'cup_game', l));
      st.push(bump(db, 'cup_total', 'all'));
      await db.batch(st);
      await logAction(db, ip, 'cup');
    }
    const gain = uid ? await grow(env, request, uid, 'cup', champ, ['cup1']) : null;
    return json({ ok: true, gain });
  }

  if (act === 'quiz') {
    const kind = body.kind === 'story' ? 'story' : 'mix';
    const total = Math.max(1, Math.min(20, Math.round(Number(body.total) || 0)));
    const score = Math.max(0, Math.min(total, Math.round(Number(body.score) || 0)));
    let ref = '';
    if (kind === 'story') {
      const slug = clip(body.slug, 40);
      const known = await knownSlugs(env, request);
      if (!SLUG.test(slug) || (known && !known.has(slug))) return fail('알 수 없는 이야기예요.');
      ref = `story:${slug}`;
      if (!bot && !(await tooMany(db, ip, 'squiz', 60, 60))) {
        await db.batch([bump(db, 'squiz_play', slug), bump(db, 'squiz_full', slug, score === total ? 1 : 0)]);
        await logAction(db, ip, 'squiz');
      }
    } else {
      ref = `mix:${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}`;
      if (!bot && !(await tooMany(db, ip, 'mquiz', 20, 60))) {
        await db.batch([bump(db, 'mquiz_play', 'all'), bump(db, 'mquiz_score', String(score))]);
        await logAction(db, ip, 'mquiz');
      }
    }
    // 점수는 다 맞혔을 때만 줘요 (이야기마다 한 번, 섞어 풀기는 하루 한 번)
    const gain = uid && score === total ? await grow(env, request, uid, 'quiz', ref, ['story10']) : null;
    return json({ ok: true, gain });
  }
  if (act === 'plan' || act === 'spin') {
    const known = await knownSlugs(env, request);
    const ok = (x) => SLUG.test(String(x || '')) && (!known || known.has(x));
    const list = (act === 'plan' ? (Array.isArray(body.games) ? body.games : []) : [body.game]).slice(0, 5).filter(ok);
    const uniq = [...new Set(list)];
    if (!uniq.length || (act === 'plan' && uniq.length < 2)) return fail('결과를 읽지 못했어요.');
    if (!bot && !(await tooMany(db, ip, act, 30, 60))) {
      await db.batch([...uniq.map((x) => bump(db, `${act}_game`, x)), bump(db, `${act}_total`, 'all')]);
      await logAction(db, ip, act);
    }
    return json({ ok: true });
  }
  return fail('알 수 없는 요청이에요.');
}

// 룰룰 차트: 이번 주(최근 7일)와 그 전 주를 견줘 순위 변화를 보여 줘요
async function chart(env) {
  const db = env.DB;
  const from = kstDay(6), prevFrom = kstDay(13);
  const [week, prev, saved, played, rated, champ, plan, spin, types] = await db.batch([
    db.prepare("SELECT slug AS s, COUNT(DISTINCT vid) AS n FROM pv WHERE kind = 'game' AND slug != '' AND day >= ? GROUP BY slug ORDER BY n DESC LIMIT 20").bind(from),
    db.prepare("SELECT slug AS s, COUNT(DISTINCT vid) AS n FROM pv WHERE kind = 'game' AND slug != '' AND day >= ? AND day < ? GROUP BY slug ORDER BY n DESC LIMIT 100").bind(prevFrom, from),
    db.prepare("SELECT slug AS s, COUNT(*) AS n FROM marks WHERE kind IN ('saved', 'want') GROUP BY slug ORDER BY n DESC LIMIT 10"),
    db.prepare("SELECT slug AS s, COUNT(*) AS n FROM marks WHERE kind = 'played' GROUP BY slug ORDER BY n DESC LIMIT 10"),
    db.prepare('SELECT slug AS s, COUNT(*) AS n, ROUND(AVG(rating), 2) AS a FROM reviews WHERE hidden = 0 GROUP BY slug HAVING COUNT(*) >= 2 ORDER BY a DESC, n DESC LIMIT 10'),
    db.prepare("SELECT k AS s, n FROM fun_stats WHERE kind = 'cup_champ' ORDER BY n DESC LIMIT 10"),
    db.prepare("SELECT k AS s, n FROM fun_stats WHERE kind = 'plan_game' ORDER BY n DESC LIMIT 10"),
    db.prepare("SELECT k AS s, n FROM fun_stats WHERE kind = 'spin_game' ORDER BY n DESC LIMIT 10"),
    db.prepare("SELECT k, n FROM fun_stats WHERE kind = 'type'"),
  ]);
  const prevRank = {};
  prev.results.forEach((r, i) => { prevRank[r.s] = i + 1; });
  const rows = (r) => r.results.map((x) => ({ s: x.s, n: x.n, ...(x.a !== undefined ? { a: x.a } : {}) }));
  return json({
    ok: true, from, to: kstDay(0),
    week: week.results.map((r, i) => ({ s: r.s, n: r.n, rank: i + 1, prev: prevRank[r.s] || 0 })),
    saved: rows(saved), played: rows(played), rated: rows(rated), cup: rows(champ), plan: rows(plan), spin: rows(spin),
    types: Object.fromEntries(types.results.map((r) => [r.k, r.n])),
  }, 200, { 'cache-control': 'public, max-age=600' });
}

async function stats(env) {
  const db = env.DB;
  const [types, champ, win, games, total, mq] = await db.batch([
    db.prepare("SELECT k, n FROM fun_stats WHERE kind = 'type'"),
    db.prepare("SELECT k, n FROM fun_stats WHERE kind = 'cup_champ' ORDER BY n DESC LIMIT 40"),
    db.prepare("SELECT k, n FROM fun_stats WHERE kind = 'cup_win'"),
    db.prepare("SELECT k, n FROM fun_stats WHERE kind = 'cup_game'"),
    db.prepare("SELECT n FROM fun_stats WHERE kind = 'cup_total' AND k = 'all'"),
    db.prepare("SELECT k, n FROM fun_stats WHERE kind = 'mquiz_score'"),
  ]);
  const W = Object.fromEntries(win.results.map((r) => [r.k, r.n]));
  const G = Object.fromEntries(games.results.map((r) => [r.k, r.n]));
  const C = Object.fromEntries(champ.results.map((r) => [r.k, r.n]));
  const cup = Object.keys(G).map((s) => ({ s, champ: C[s] || 0, win: W[s] || 0, games: G[s] || 0 }))
    .filter((x) => x.games >= 1)
    .sort((a, b) => b.champ - a.champ || (b.win / b.games) - (a.win / a.games) || b.games - a.games)
    .slice(0, 30);
  return json({
    ok: true,
    types: Object.fromEntries(types.results.map((r) => [r.k, r.n])),
    cup, cupTotal: (total.results[0] || {}).n || 0,
    quiz: Object.fromEntries(mq.results.map((r) => [r.k, r.n])),
  }, 200, { 'cache-control': 'public, max-age=60' });
}

export async function fun(request, env, route, me) {
  if (route === 'play' && request.method === 'POST') return await play(request, env, me);
  if (route === 'fun' && request.method === 'GET') return await stats(env);
  if (route === 'chart' && request.method === 'GET') return await chart(env);
  return fail('없는 주소예요.', 404);
}
