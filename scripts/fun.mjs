// 재미로 알아보기: 보드게임 이야기, 취향 테스트, 보드게임 월드컵, 상식 퀴즈, 모임 게임 짜기, 룰룰 차트
// build.mjs가 쓰는 도구를 받아 페이지와 자료를 만들어 돌려줘요.
import fs from 'node:fs';
import path from 'node:path';

export const STORY_DATE = '2026-11-20';

export function makeFun(x) {
  const { ROOT, layout, esc, pic, tile, gameCard, bySlug, games, sortedGames, icon, buyBox, abs, cfg, GROUPS, LEVELS, playersText, minutesText, VISUALS, frameSVG, bare, josa, GROW_RULES, popular, BRAND_IMG, SEO = {}, datesOf = null } = x;
  const sDates = (g) => (datesOf ? datesOf(`content/stories/${g.slug}.json`) : null) || { pub: STORY_DATE, mod: STORY_DATE };
  const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const problems = [];

  // ---------- 원고 읽기와 점검 ----------
  const stories = {};
  for (const g of games) {
    const f = path.join(ROOT, 'content', 'stories', `${g.slug}.json`);
    if (!fs.existsSync(f)) { problems.push(`이야기가 없어요: ${g.slug}`); continue; }
    const s = read(f);
    const need = (c, m) => { if (!c) problems.push(`stories/${g.slug}.json: ${m}`); };
    need(s.slug === g.slug, 'slug가 파일 이름과 달라요');
    need(s.title && s.teaser && s.lead, '제목, 한 줄, 첫 문단이 필요해요');
    need(Array.isArray(s.sections) && s.sections.length >= 2 && s.sections.every((x2) => x2.h && x2.p), '본문 단락이 2개 이상 필요해요');
    need(Array.isArray(s.trivia) && s.trivia.length >= 2, '재미있는 사실이 2개 이상 필요해요');
    need(Array.isArray(s.quiz) && s.quiz.length >= 2 && s.quiz.every((q) => q.q && Array.isArray(q.o) && q.o.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length && q.why), '퀴즈 형식이 맞지 않아요');
    stories[g.slug] = s;
  }
  const TEST = read(path.join(ROOT, 'content', 'test.json'));
  for (const g of games) {
    const w = TEST.games[g.slug];
    if (!w || !w.length || !w.every((t) => TEST.types[t])) problems.push(`test.json: ${g.slug} 유형이 없거나 잘못됐어요`);
  }
  const TYPES = TEST.order;
  const typeOf = (t) => ({ key: t, ...TEST.types[t] });
  const charImg = (t, cls = '', alt = '') => pic(`char-${TEST.types[t].char}`, alt, cls);
  const gname = (g) => bare(g.name);
  const compact = (g) => ({ s: g.slug, n: g.name, g: g.group, p: g.players, m: g.minutes, age: g.age, l: g.level, one: g.oneLine });
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const frameSrc = (s) => `/assets/img/frame/${s}.svg`;
  const frameImg = (g, cls = 'sframe', eager = false) => (VISUALS[g.slug] ? `<img class="${cls}" src="${frameSrc(g.slug)}" width="480" height="300" alt="${esc(`${g.name} 그림 설명`)}"${eager ? '' : ' loading="lazy"'} decoding="async">` : `<span class="${cls} sframe-tile">${tile(g, 'tile-lg')}</span>`);
  const list = sortedGames.filter((g) => stories[g.slug]);

  // 게임 그림 설명 첫 장을 따로 그림 파일로 (월드컵, 이야기 카드에서 써요)
  const frames = games.filter((g) => VISUALS[g.slug]).map((g) => {
    const f = VISUALS[g.slug][0];
    const svg = frameSVG(f.art, f.t).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, \'Apple SD Gothic Neo\', \'Malgun Gothic\', \'Noto Sans KR\', sans-serif" ');
    return [`assets/img/frame/${g.slug}.svg`, `<?xml version="1.0" encoding="UTF-8"?>\n${svg.replace('<svg ', '<svg style="background:#fff" ')}`];
  });

  // ---------- 조각 ----------
  const crumbs = (items) => `<nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a>${items.map(([h, t]) => `<span aria-hidden="true">/</span>${h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}`).join('')}</nav>`;
  const scard = (g) => {
    const s = stories[g.slug];
    return `<a class="scard" href="/stories/${g.slug}/" data-g="${g.group}">
<span class="scard-top">${tile(g, 'tile-sm')}<span class="scard-game">${esc(g.name)}</span></span>
<span class="scard-t">${esc(s.title)}</span>
<span class="scard-d">${esc(s.teaser)}</span>
<span class="scard-meta">${icon('i-book')}이야기 · 퀴즈 ${s.quiz.length}문제</span>
</a>`;
  };
  const FUN = [
    ['test', '/test/', 'fc-test', '나에게 맞는 보드게임 테스트', '질문 10개로 알아보는 8가지 게임 취향', 'char-card'],
    ['plan', '/plan/', 'fc-plan', '오늘 모임 게임 순서 짜기', '인원과 시간만 고르면 몸풀기부터 마무리까지', 'pawn-map'],
    ['worldcup', '/worldcup/', 'fc-cup', '보드게임 월드컵', '16강 토너먼트로 고르는 나의 최애 게임', 'char-dice'],
    ['chart', '/chart/', 'fc-chart', '룰룰 차트', '이번 주 많이 본 게임과 모두의 순위', 'fox-explain'],
    ['quiz', '/quiz/', 'fc-quiz', '보드게임 상식 퀴즈', '10문제, 몇 개나 맞힐 수 있을까요?', 'char-book'],
    ['stories', '/stories/', 'fc-story', '보드게임 이야기', `게임 ${list.length}가지의 유래와 숨은 이야기`, 'char-domi'],
  ];
  const funCards = (skip = '') => `<div class="fun-cards">${FUN.filter((f) => f[0] !== skip).map(([, h, cls, t, d, im]) => `<a class="fun-card ${cls}" href="${h}">${pic(im, '', 'fun-card-pic')}<span class="fun-card-t">${t}</span><span class="fun-card-d">${d}</span><span class="fun-card-go">해 보기</span></a>`).join('')}</div>`;
  const funBand = (skip) => `<section class="fun-band"><div class="wrap"><h2 class="sec-title">재미로 더 알아보기</h2>${funCards(skip)}</div></section>`;
  const dykFirst = list.find((g) => g.slug === 'yutnori') || list[0];
  const dyk = (cls = '') => `<div class="dyk ${cls}" data-dyk>
<p class="dyk-k">${icon('i-spark')}알고 계셨나요?</p>
<p class="dyk-t" data-dyk-t>${esc(stories[dykFirst.slug].teaser)}</p>
<p class="dyk-row"><a class="dyk-a" href="/stories/${dykFirst.slug}/" data-dyk-a>${esc(gname(dykFirst))} 이야기 읽기</a><button type="button" class="dyk-next" data-dyk-next>다른 이야기</button></p>
</div>`;

  // ---------- 페이지: 이야기 모음 ----------
  function storiesHub() {
    const feat = ['yutnori', 'monopoly', 'jenga', 'go-stop', 'dixit', 'chess'].map((s) => bySlug[s]).filter((g) => g && stories[g.slug]);
    const chips = [['', '전체'], ['family', '가족 게임'], ['party', '파티 게임'], ['strategy', '전략 게임'], ['traditional', '전통놀이']];
    const body = `<section class="fun-hero">
<div class="wrap fun-hero-grid">
<div>
${crumbs([['', '보드게임 이야기']])}
<p class="fun-kicker">재미로 알아보는</p>
<h1 class="fun-title">보드게임 이야기</h1>
<p class="fun-lead">게임 ${list.length}가지에 얽힌 유래와 역사, 알고 보면 재미있는 사실을 모았어요. 다 읽었다면 이야기마다 붙은 퀴즈로 확인해 보세요.</p>
<div class="row-btns"><a class="btn btn-main" href="/quiz/">${icon('i-spark')}상식 퀴즈 10문제</a><a class="btn btn-sub" href="#all">이야기 전체 보기</a></div>
</div>
${dyk('dyk-hero')}
</div>
</section>
<section class="wrap fun-sec">
<h2 class="sec-title">먼저 읽어 볼 이야기</h2>
<div class="sfeat-grid">${feat.map((g) => `<a class="sfeat" href="/stories/${g.slug}/">${frameImg(g)}<span class="sfeat-body"><span class="scard-game">${esc(g.name)}</span><span class="sfeat-t">${esc(stories[g.slug].title)}</span><span class="scard-d">${esc(stories[g.slug].teaser)}</span></span></a>`).join('')}</div>
</section>
<section class="wrap fun-sec" id="all">
<div class="sec-row"><h2 class="sec-title">이야기 ${list.length}편</h2></div>
<div class="chips" role="group" aria-label="갈래로 거르기" data-sfilter>${chips.map(([v, t], i) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${i ? 'false' : 'true'}">${t}</button>`).join('')}</div>
<div class="story-grid" data-sgrid>${list.map(scard).join('')}</div>
</section>
${funBand('stories')}`;
    return layout({
      title: `보드게임 이야기 ${list.length}편 | 유래와 역사, 재미있는 사실 - ${cfg.siteName}`,
      description: `윷놀이, 모노폴리, 젠가, 고스톱처럼 익숙한 보드게임 ${list.length}가지의 유래와 역사, 알고 보면 재미있는 사실을 모았어요. 이야기마다 퀴즈 3문제가 있어요.`,
      keywords: ['보드게임 유래', '보드게임 역사', '보드게임 상식', '보드게임 이야기', '윷놀이 유래', '모노폴리 역사', '젠가 뜻'],
      path: '/stories/', body, scripts: ['fun.js'],
      ogImage: '/assets/img/og/fun-stories.png',
      jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: '보드게임 이야기', url: abs('/stories/'), inLanguage: 'ko', hasPart: list.map((g) => ({ '@type': 'Article', headline: stories[g.slug].title, url: abs(`/stories/${g.slug}/`) })) },
    });
  }

  // ---------- 페이지: 이야기 한 편 ----------
  // 이야기 페이지의 질문과 답: 기본 사실(처음 나온 해, 만든 사람, 받은 상, 다른 이름)과 이름 뜻
  function storyFaq(g) {
    const s = stories[g.slug];
    const n = gname(g);
    const f = Object.fromEntries(s.facts.map((x) => [x.k, x.v]));
    // 괄호 붙은 값: 조사는 괄호 앞 낱말에 맞추고 괄호는 그대로 둬요
    const part = (v) => { const m = String(v).match(/^(.*?)\s*(\([^)]*\))\s*$/); return m ? [m[1], m[2]] : [String(v), '']; };
    const withJosa = (v, a, b) => { const [w, p2] = part(v); return `${w}${p2}${josa(w, a, b).slice(w.length)}`; };
    const out = [];
    const when = f['처음 나온 해'] || f['처음 나온 때'] || f['상품으로 나온 해'];
    if (when) out.push({ q: `${josa(n, '은', '는')} 언제 처음 나왔나요?`, a: `${when}에 처음 나왔어요.${f['처음 나온 곳'] ? ` 처음 나온 곳은 ${withJosa(f['처음 나온 곳'], '이에요', '예요')}.` : ''}` });
    else if (f['처음 나온 곳']) out.push({ q: `${josa(n, '은', '는')} 어디에서 처음 나왔나요?`, a: `처음 나온 곳은 ${withJosa(f['처음 나온 곳'], '이에요', '예요')}.` });
    if (f['만든 사람']) out.push({ q: `${josa(n, '은', '는')} 누가 만들었나요?`, a: /요$/.test(f['만든 사람']) ? `${f['만든 사람']}.` : `${withJosa(f['만든 사람'], '이', '가')} 만들었어요.` });
    if (f['받은 상']) out.push({ q: `${josa(n, '은', '는')} 어떤 상을 받았나요?`, a: `${f['받은 상']} 상을 받았어요.` });
    if (f['뿌리']) out.push({ q: `${n}의 뿌리는 어디인가요?`, a: `${withJosa(f['뿌리'], '이에요', '예요')}.` });
    if (f['갈래']) out.push({ q: `${josa(n, '은', '는')} 어떤 놀이인가요?`, a: `${withJosa(f['갈래'], '이에요', '예요')}.` });
    const other = f['다른 이름'] || f['다른 나라 이름'];
    if (other) { const [w, p2] = part(other); out.push({ q: `${n}의 다른 이름은 무엇인가요?`, a: `${w}${josa(w, '이라고도', '라고도').slice(w.length)} 불러요.${p2 ? ` ${p2.replace(/^\(|\)$/g, '')}.` : ''}` }); }
    if ((SEO[g.slug] || {}).meaning) out.push({ q: `${n} 이름은 무슨 뜻인가요?`, a: SEO[g.slug].meaning });
    return out.map((x) => ({ q: x.q, a: x.a.replace(/요\.\./g, '요.').replace(/\.\.$/, '.') }));
  }
  function storyPage(g) {
    const s = stories[g.slug];
    const n = gname(g);
    const sfaq = storyFaq(g);
    const fig = VISUALS[g.slug] ? `<figure class="story-fig">${frameSVG(VISUALS[g.slug][0].art, `${g.name} 그림: ${VISUALS[g.slug][0].t}`)}<figcaption>${esc(VISUALS[g.slug][0].t)}</figcaption></figure>` : '';
    const rel = (g.related || []).map((r) => bySlug[r]).filter((r) => r && stories[r.slug]).slice(0, 3);
    const body = `<article class="story" data-story="${g.slug}">
<header class="story-head">
<div class="wrap-narrow">
${crumbs([['/stories/', '보드게임 이야기'], ['', g.name]])}
<div class="story-game">${tile(g, 'tile-sm')}<span>${esc(g.name)}</span><span class="tag">${GROUPS[g.group]}</span></div>
<h1 class="story-title"><span class="story-kicker">${esc(n)} 유래와 역사</span>${esc(s.title)}</h1>
<p class="story-lead">${esc(s.lead)}</p>
<p class="game-dates">처음 올린 날 <time datetime="${sDates(g).pub}">${sDates(g).pub.replace(/-/g, '.')}</time> · 마지막으로 고친 날 <time datetime="${sDates(g).mod}">${sDates(g).mod.replace(/-/g, '.')}</time></p>
${s.facts.length ? `<dl class="story-facts">${s.facts.map((f) => `<div><dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd></div>`).join('')}</dl>` : ''}
</div>
</header>
<div class="wrap-narrow story-body">
${fig}
${s.sections.map((x2) => `<h2 class="story-h">${esc(x2.h)}</h2>\n<p>${esc(x2.p)}</p>`).join('\n')}
<aside class="story-trivia" aria-labelledby="tv-title">
<h2 class="story-h" id="tv-title">${icon('i-spark')}알고 보면 재미있는 사실</h2>
<ul>${s.trivia.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
</aside>
<section class="squiz" data-squiz="${g.slug}" aria-labelledby="sq-title">
<h2 class="story-h" id="sq-title">${esc(n)} 퀴즈 ${s.quiz.length}문제</h2>
<p class="muted small">읽은 내용으로 맞혀 보세요. 다 맞히면 회원은 활동 점수 +${GROW_RULES.quiz[0]}점을 받아요.</p>
<ol class="sq-list">${s.quiz.map((q) => `<li class="sq" data-a="${q.a}"><p class="sq-q">${esc(q.q)}</p><div class="sq-opts">${q.o.map((o, j) => `<button type="button" class="sq-opt" data-i="${j}">${esc(o)}</button>`).join('')}</div><p class="sq-why" hidden>${esc(q.why)}</p></li>`).join('')}</ol>
<div class="sq-result" data-sq-result hidden></div>
</section>
${sfaq.length ? `<section class="story-faq" aria-labelledby="sf-title"><h2 class="story-h" id="sf-title">${esc(n)} 유래, 한눈에 묻고 답하기</h2><div class="qa">${sfaq.map((x) => `<div class="qa-item"><p class="qa-q">${esc(x.q)}</p><p class="qa-a">${esc(x.a)}</p></div>`).join('')}</div></section>` : ''}
<div class="story-cta">
<a class="btn btn-main" href="/games/${g.slug}/">${esc(n)} 하는법 보기</a>
<button type="button" class="btn btn-sub" data-story-share>${icon('i-share')}이야기 보내기</button>
</div>
<p class="story-note muted small">이 글은 공개된 자료를 바탕으로 룰룰이 우리 말로 정리했어요. 기록마다 조금씩 다른 이야기는 ‘전해져요’, ‘알려져 있어요’처럼 적었어요. 틀린 곳이 보이면 <button type="button" class="link-btn" data-report="${g.slug}">알려 주세요</button>.</p>
${buyBox(g)}
</div>
${rel.length ? `<section class="wrap fun-sec"><h2 class="sec-title">이어서 읽기</h2><div class="story-grid">${rel.map(scard).join('')}</div></section>` : ''}
${funBand('stories')}
</article>`;
    const title = `${n} 유래와 역사 | ${s.title} - ${cfg.siteName}`;
    return layout({
      title,
      description: `${s.teaser} ${s.lead}`.slice(0, 155),
      keywords: [`${n} 유래`, `${n} 역사`, `${n} 뜻`, `${n} 이름 뜻`, `${n} 만든 사람`, `${n} 이야기`, `${n} 상식`, `${n} 하는법`],
      path: `/stories/${g.slug}/`, body, scripts: ['fun.js'], ogType: 'article', published: sDates(g).pub, modified: sDates(g).mod,
      ogImage: fs.existsSync(path.join(ROOT, 'src', 'static', 'img', 'og', `${g.slug}.png`)) ? `/assets/img/og/${g.slug}.png` : '',
      jsonld: [
        ...(sfaq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: sfaq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }] : []),
        { '@context': 'https://schema.org', '@type': 'Article', headline: `${n} 유래와 역사: ${s.title}`, description: s.teaser, inLanguage: 'ko', datePublished: sDates(g).pub, dateModified: sDates(g).mod, mainEntityOfPage: abs(`/stories/${g.slug}/`), image: abs(`/assets/img/og/${g.slug}.png`), about: { '@type': 'Game', name: g.name, url: abs(`/games/${g.slug}/`) }, author: { '@type': 'Organization', name: cfg.siteName, url: abs('/') }, publisher: { '@type': 'Organization', name: cfg.siteName, logo: { '@type': 'ImageObject', url: abs('/assets/img/icon-512.png') } } },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '홈', item: abs('/') }, { '@type': 'ListItem', position: 2, name: '보드게임 이야기', item: abs('/stories/') }, { '@type': 'ListItem', position: 3, name: g.name, item: abs(`/stories/${g.slug}/`) }] },
      ],
    });
  }

  // ---------- 취향 테스트 ----------
  const pop = new Set(popular);
  const topFor = (t, n = 8) => games.map((g) => ({ g, w: (TEST.games[g.slug][0] === t ? 2 : TEST.games[g.slug].includes(t) ? 1 : 0) + (pop.has(g.slug) ? 0.5 : 0) }))
    .filter((x2) => x2.w >= 1).sort((a, b) => b.w - a.w || a.g.level - b.g.level).slice(0, n).map((x2) => x2.g);
  const testData = () => ({
    order: TYPES,
    types: Object.fromEntries(TYPES.map((t) => { const T = TEST.types[t]; const d = BRAND_IMG[`char-${T.char}`]; return [t, { ...T, img: `/assets/img/brand/char-${T.char}.webp`, iw: d[0], ih: d[1] }]; })),
    questions: TEST.questions,
    games: games.map((g) => ({ ...compact(g), w: TEST.games[g.slug] })),
    popular,
  });
  const typeCard = (t) => { const T = TEST.types[t]; return `<a class="type-card" href="/test/${t}/" style="--tc:${T.color}">${charImg(t, 'type-pic')}<span class="type-nick">${esc(T.nick)}</span><span class="type-name">${esc(T.name)}</span><span class="type-line">${esc(T.line)}</span></a>`; };

  function testPage() {
    const body = `<section class="fun-hero test-hero" data-test-intro>
<div class="wrap fun-hero-grid">
<div>
${crumbs([['', '보드게임 취향 테스트']])}
<p class="fun-kicker">질문 10개 · 1분이면 끝</p>
<h1 class="fun-title">나에게 딱 맞는<br>보드게임은?</h1>
<p class="fun-lead">고르는 답에 따라 8가지 게임 취향 가운데 내 유형을 알려 드려요. 함께할 인원과 시간까지 반영해서, 지금 바로 꺼내기 좋은 게임을 골라 드려요.</p>
<div class="row-btns"><button type="button" class="btn btn-coral btn-lg" data-test-start>테스트 시작하기</button><a class="btn btn-sub" href="#types">8가지 유형 보기</a></div>
<p class="test-count muted small" data-test-count></p>
</div>
<div class="crew-grid" aria-hidden="true">${TYPES.map((t) => `<span style="--tc:${TEST.types[t].color}">${charImg(t)}<b>${esc(TEST.types[t].nick)}</b></span>`).join('')}</div>
</div>
</section>
<section class="test-run" data-test-run hidden>
<div class="wrap-narrow">
<div class="test-top"><button type="button" class="test-back" data-test-back aria-label="이전 질문">${icon('i-down')}</button><div class="test-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${TEST.questions.length}" aria-valuenow="0" data-test-prog><span data-test-bar></span></div><span class="test-num" data-test-num></span></div>
<h2 class="test-q" data-test-q tabindex="-1"></h2>
<div class="test-opts" data-test-opts></div>
</div>
</section>
<section class="test-res" data-test-res hidden aria-live="polite"></section>
<section class="wrap fun-sec" id="types">
<h2 class="sec-title">8가지 게임 취향</h2>
<p class="sec-lead">유형을 눌러 보면 그 유형에게 잘 맞는 게임을 볼 수 있어요.</p>
<div class="type-grid">${TYPES.map(typeCard).join('')}</div>
</section>
${funBand('test')}
<script type="application/json" id="test-data">${json(testData())}</script>`;
    return layout({
      title: `나에게 맞는 보드게임 테스트 | 8가지 게임 취향 알아보기 - ${cfg.siteName}`,
      description: '질문 10개로 알아보는 나의 보드게임 취향. 전략가, 심리술사, 순발력왕, 분위기 메이커 등 8가지 유형 가운데 내 유형과, 인원·시간에 맞는 추천 게임을 알려 드려요.',
      keywords: ['보드게임 추천 테스트', '보드게임 취향 테스트', '나에게 맞는 보드게임', '보드게임 추천', '성격 테스트 보드게임'],
      path: '/test/', body, scripts: ['fun.js'], ogImage: '/assets/img/og/fun-test.png',
    });
  }

  function testTypePage(t) {
    const T = typeOf(t), M = TEST.types[T.match];
    const top = topFor(t, 9);
    const body = `<section class="fun-hero type-hero" style="--tc:${T.color}">
<div class="wrap type-hero-grid">
<div>
${crumbs([['/test/', '보드게임 취향 테스트'], ['', T.name]])}
<p class="fun-kicker">보드게임 취향 · ${esc(T.nick)} 유형</p>
<h1 class="fun-title">${esc(T.name)}</h1>
<p class="type-line-big">${esc(T.line)}</p>
<p class="fun-lead">${esc(T.desc)}</p>
<div class="row-btns"><a class="btn btn-coral btn-lg" href="/test/">나도 테스트하기</a><button type="button" class="btn btn-sub" data-type-share="${t}">${icon('i-share')}이 유형 보내기</button></div>
</div>
${charImg(t, 'type-hero-pic', `${T.nick} 캐릭터`)}
</div>
</section>
<section class="wrap fun-sec type-detail">
<div class="type-boxes">
<div class="type-box"><h2>${icon('i-check')}이런 게임에서 빛나요</h2><ul>${T.good.map((x2) => `<li>${esc(x2)}</li>`).join('')}</ul></div>
<div class="type-box"><h2>${icon('i-spark')}한 가지 팁</h2><p>${esc(T.tip)}</p></div>
<a class="type-box type-match" href="/test/${T.match}/" style="--tc:${M.color}">${charImg(T.match, 'type-match-pic')}<span><small>잘 맞는 짝</small><b>${esc(M.name)}</b><span>${esc(M.line)}</span></span></a>
</div>
<h2 class="sec-title" style="margin-top:36px">${esc(T.nick)} 유형에게 추천하는 게임</h2>
<div class="gcards" style="margin-top:16px">${top.map((g) => gameCard(g)).join('')}</div>
<h2 class="h2">다른 유형도 보기</h2>
<div class="trad-links">${TYPES.filter((k) => k !== t).map((k) => `<a class="pill" href="/test/${k}/">${esc(TEST.types[k].nick)} · ${esc(TEST.types[k].name)}</a>`).join('')}</div>
</section>
${funBand('test')}`;
    return layout({
      title: `${T.name} 유형 | 보드게임 취향 테스트 - ${cfg.siteName}`,
      description: `${T.line}. ${T.desc}`.slice(0, 155),
      keywords: ['보드게임 취향 테스트', `${T.name}`, '보드게임 추천', ...top.slice(0, 4).map((g) => `${gname(g)} 하는법`)],
      path: `/test/${t}/`, body, scripts: ['fun.js'], ogImage: `/assets/img/og/type-${t}.png`,
    });
  }

  // ---------- 보드게임 월드컵 ----------
  function worldcupPage() {
    const pools = [['all', '전체 게임'], ['popular', '인기 게임'], ['family', '가족 게임'], ['party', '파티 게임'], ['strategy', '전략 게임'], ['traditional', '전통놀이']];
    const body = `<section class="fun-hero cup-hero" data-cup-intro>
<div class="wrap fun-hero-grid">
<div>
${crumbs([['', '보드게임 월드컵']])}
<p class="fun-kicker">토너먼트로 고르는 최애 게임</p>
<h1 class="fun-title">보드게임 월드컵</h1>
<p class="fun-lead">두 게임 가운데 더 해 보고 싶은 쪽을 골라 주세요. 끝까지 고르면 나의 최애 보드게임 하나가 남아요. 모두의 선택을 모은 순위도 함께 볼 수 있어요.</p>
<div class="cup-set">
<p class="cup-set-k">몇 강으로 할까요?</p>
<div class="chips" role="radiogroup" aria-label="몇 강" data-cup-size><button type="button" class="chip" role="radio" aria-checked="true" data-v="16">16강</button><button type="button" class="chip" role="radio" aria-checked="false" data-v="8">8강 (빠르게)</button><button type="button" class="chip" role="radio" aria-checked="false" data-v="32">32강</button></div>
<p class="cup-set-k">어떤 게임으로 할까요?</p>
<div class="chips" role="radiogroup" aria-label="게임 범위" data-cup-pool>${pools.map(([v, t], i) => `<button type="button" class="chip" role="radio" aria-checked="${i ? 'false' : 'true'}" data-v="${v}">${t}</button>`).join('')}</div>
</div>
<div class="row-btns"><button type="button" class="btn btn-coral btn-lg" data-cup-start>월드컵 시작</button></div>
</div>
<div class="cup-hero-art" aria-hidden="true">${pic('char-dice', '', 'cup-char')}<span class="cup-vs">VS</span>${pic('char-card', '', 'cup-char')}</div>
</div>
</section>
<section class="cup-run" data-cup-run hidden>
<div class="wrap">
<p class="cup-round"><b data-cup-round></b><span data-cup-step></span></p>
<div class="test-prog"><span data-cup-bar></span></div>
<div class="cup-pair" data-cup-pair></div>
<p class="muted small cup-hint">더 해 보고 싶은 게임을 눌러 주세요. 모르는 게임이면 그림을 보고 끌리는 쪽을 골라도 돼요.</p>
</div>
</section>
<section class="cup-res" data-cup-res hidden aria-live="polite"></section>
<section class="wrap fun-sec" id="rank">
<div class="sec-row"><h2 class="sec-title">모두의 월드컵 순위</h2><span class="muted small" data-cup-total></span></div>
<p class="sec-lead">지금까지 끝까지 마친 월드컵에서 우승을 가장 많이 한 게임이에요. 맞대결 승률도 함께 보여 드려요.</p>
<div class="cup-rank" data-cup-rank><div class="live-skel"></div></div>
</section>
${funBand('worldcup')}
<script type="application/json" id="cup-data">${json({ games: games.map((g) => ({ ...compact(g), f: VISUALS[g.slug] ? 1 : 0 })), popular })}</script>`;
    return layout({
      title: `보드게임 월드컵 | 16강으로 고르는 나의 최애 보드게임 - ${cfg.siteName}`,
      description: `보드게임 ${games.length}가지로 하는 이상형 월드컵. 두 게임 가운데 하나를 고르며 나의 최애 보드게임을 찾고, 모두의 우승 순위도 확인해 보세요.`,
      keywords: ['보드게임 월드컵', '보드게임 이상형 월드컵', '최애 보드게임', '보드게임 순위', '보드게임 추천'],
      path: '/worldcup/', body, scripts: ['fun.js'], ogImage: '/assets/img/og/fun-cup.png',
    });
  }

  // ---------- 상식 퀴즈 ----------
  function quizPage() {
    const qs = list.flatMap((g) => stories[g.slug].quiz.map((q) => ({ s: g.slug, n: g.name, q: q.q, o: q.o, a: q.a, why: q.why })));
    const body = `<section class="fun-hero quiz-hero" data-quiz-intro>
<div class="wrap fun-hero-grid">
<div>
${crumbs([['/stories/', '보드게임 이야기'], ['', '상식 퀴즈']])}
<p class="fun-kicker">${qs.length}문제 가운데 무작위 10문제</p>
<h1 class="fun-title">보드게임 상식 퀴즈</h1>
<p class="fun-lead">보드게임 이야기 ${list.length}편에서 고른 문제예요. 틀려도 괜찮아요. 문제마다 풀이와 이야기 링크가 있어서 풀다 보면 저절로 알게 돼요.</p>
<div class="row-btns"><button type="button" class="btn btn-coral btn-lg" data-quiz-start>퀴즈 시작</button><a class="btn btn-sub" href="/stories/">이야기 먼저 읽기</a></div>
<p class="muted small">10문제를 다 맞히면 회원은 하루 한 번 활동 점수 +${GROW_RULES.quiz[0]}점을 받아요.</p>
</div>
${pic('book-open', '', 'quiz-hero-pic')}
</div>
</section>
<section class="test-run" data-quiz-run hidden>
<div class="wrap-narrow">
<div class="test-top"><span class="quiz-score" data-quiz-score></span><div class="test-prog"><span data-quiz-bar></span></div><span class="test-num" data-quiz-num></span></div>
<p class="quiz-game" data-quiz-game></p>
<h2 class="test-q" data-quiz-q tabindex="-1"></h2>
<div class="test-opts" data-quiz-opts></div>
<div class="quiz-why" data-quiz-why hidden></div>
</div>
</section>
<section class="test-res" data-quiz-res hidden aria-live="polite"></section>
${funBand('quiz')}
<script type="application/json" id="quiz-data">${json(qs)}</script>`;
    return layout({
      title: `보드게임 상식 퀴즈 10문제 | 유래와 숨은 이야기 - ${cfg.siteName}`,
      description: `보드게임 이야기 ${list.length}편에서 고른 상식 퀴즈 10문제. 젠가 이름의 뜻, 모노폴리의 뿌리, 윷놀이 도개걸윷모의 뜻까지 몇 개나 맞힐 수 있을까요?`,
      keywords: ['보드게임 퀴즈', '보드게임 상식', '보드게임 상식 퀴즈', '젠가 뜻', '모노폴리 유래', '윷놀이 도개걸윷모 뜻'],
      path: '/quiz/', body, scripts: ['fun.js'], ogImage: '/assets/img/og/fun-quiz.png',
    });
  }

  // ---------- 모임 게임 짜기 ----------
  const est = (g) => Math.max(5, Math.round((g.minutes[0] + g.minutes[1]) / 2 / 5) * 5);
  const PLAN_EX = [
    ['둘이서 한 시간', '연인, 부부, 친구 둘이', 2, 60, ['dobble', 'patchwork', 'lost-cities']],
    ['처음 만난 여섯 명', '말을 트고 금방 친해지는 순서', 6, 90, ['just-one', 'codenames', 'spyfall', 'insider']],
    ['명절에 3대가 함께', '할머니부터 손주까지', 6, 60, ['yutnori', 'halli-galli', 'old-maid']],
    ['초등학생 아이와', '아이가 직접 이길 수 있는 게임으로', 4, 60, ['looping-louie', 'speed-cups', 'sleeping-queens']],
    ['파티룸에서 여덟 명', '다 같이 떠들썩하게', 8, 90, ['insider', 'telestrations', 'spyfall', 'one-night-werewolf']],
    ['전략 좋아하는 네 명', '머리 쓰는 저녁', 4, 180, ['splendor', 'catan', 'seven-wonders']],
  ];
  const ROLE_NAME = (i, k) => (i === 0 ? '몸풀기' : i === k - 1 ? '마무리' : '메인');
  for (const [t, , n, , slugs] of PLAN_EX) for (const sl of slugs) {
    const g = bySlug[sl];
    if (!g) problems.push(`모임 게임 짜기 예시(${t}): 없는 게임 ${sl}`);
    else if (n < g.players[0] || n > g.players[1]) problems.push(`모임 게임 짜기 예시(${t}): ${sl}은 ${n}명이 할 수 없어요`);
  }
  const planEx = ([t, d, n, time, slugs]) => {
    const gs = slugs.map((sl) => bySlug[sl]);
    const total = gs.reduce((a, g) => a + est(g), 0);
    const q = `/plan/?n=${n}&t=${time}&g=${slugs.join(',')}`;
    return `<a class="plan-ex" href="${q}">
<span class="plan-ex-t">${esc(t)}</span><span class="plan-ex-d">${esc(d)} · ${n}명</span>
<ol class="plan-ex-list">${gs.map((g, i) => `<li>${tile(g, 'tile-sm')}<span class="plan-ex-role">${ROLE_NAME(i, gs.length)}</span><b>${esc(g.name)}</b><small>${est(g)}분</small></li>`).join('')}</ol>
<span class="plan-ex-total">${icon('i-time')}약 ${total}분<span class="plan-ex-go">이 순서로 보기</span></span>
</a>`;
  };
  const chipRow = (name, label, items, def) => `<fieldset class="plan-field"><legend>${label}</legend><div class="chips" role="radiogroup" aria-label="${label}" data-plan-${name}>${items.map(([v, t]) => `<button type="button" class="chip" role="radio" aria-checked="${String(v) === String(def)}" data-v="${v}">${t}</button>`).join('')}</div></fieldset>`;
  const planData = () => ({
    games: games.map((g) => ({ ...compact(g), w: TEST.games[g.slug], t: g.tags, k: g.kind, b: g.best })),
    popular,
  });
  function planPage() {
    const body = `<section class="fun-hero plan-hero">
<div class="wrap fun-hero-grid">
<div>
${crumbs([['', '모임 게임 짜기']])}
<p class="fun-kicker">몇 명이서, 몇 시간?</p>
<h1 class="fun-title">오늘 모임,<br>게임 순서 짜기</h1>
<p class="fun-lead">인원과 시간, 분위기만 고르면 몸풀기부터 마무리까지 게임 순서를 짜 드려요. 마음에 안 드는 게임은 바로 바꾸고, 정한 순서는 단톡방에 보낼 수 있어요.</p>
</div>
${pic('pawn-map', '', 'plan-hero-pic', true)}
</div>
</section>
<section class="wrap plan-sec">
<div class="plan-form" data-plan-form>
${chipRow('n', '몇 명이에요?', [[2, '2명'], [3, '3명'], [4, '4명'], [5, '5명'], [6, '6명'], [7, '7명'], [8, '8명'], [10, '10명 이상']], 4)}
${chipRow('t', '얼마나 놀 거예요?', [[30, '30분'], [60, '1시간'], [90, '1시간 반'], [120, '2시간'], [180, '3시간']], 120)}
${chipRow('m', '어떤 분위기가 좋아요?', [['party', '웃고 떠들기'], ['brain', '머리 쓰기'], ['mix', '둘 다 섞어서']], 'mix')}
<fieldset class="plan-field"><legend>더 고르기 <span class="muted small">(여러 개 골라도 돼요)</span></legend><div class="chips" data-plan-opt>
<button type="button" class="chip" aria-pressed="false" data-v="kids">아이와 함께 (8살 이하)</button>
<button type="button" class="chip" aria-pressed="false" data-v="easy">처음인 사람이 많아요</button>
<button type="button" class="chip" aria-pressed="false" data-v="saved">저장한 게임에서만</button>
<button type="button" class="chip" aria-pressed="false" data-v="body">몸으로 하는 놀이도</button>
</div></fieldset>
<div class="row-btns"><button type="button" class="btn btn-coral btn-lg" data-plan-go>${icon('i-spark')}게임 순서 짜기</button></div>
</div>
<div class="plan-res" data-plan-res hidden aria-live="polite"></div>
</section>
<section class="wrap fun-sec plan-wheel" id="wheel">
<div class="plan-wheel-grid">
<div>
<h2 class="sec-title">그래도 못 고르겠다면, 돌림판</h2>
<p class="sec-lead">후보 가운데 하나를 돌림판이 골라 드려요. 고른 조건에 맞는 게임, 내가 저장한 게임, 인기 게임 가운데서 돌릴 수 있어요.</p>
<div class="chips" role="radiogroup" aria-label="돌림판 후보" data-wheel-src>
<button type="button" class="chip" role="radio" aria-checked="true" data-v="fit">조건에 맞는 게임</button>
<button type="button" class="chip" role="radio" aria-checked="false" data-v="saved">저장한 게임</button>
<button type="button" class="chip" role="radio" aria-checked="false" data-v="popular">인기 게임</button>
</div>
<div class="row-btns"><button type="button" class="btn btn-main btn-lg" data-wheel-spin>돌림판 돌리기</button></div>
<div class="wheel-res" data-wheel-res aria-live="polite"></div>
</div>
<div class="wheel-box"><span class="wheel-pin" aria-hidden="true"></span><div class="wheel" data-wheel aria-hidden="true"></div></div>
</div>
</section>
<section class="wrap fun-sec">
<h2 class="sec-title">이런 모임엔 이런 순서</h2>
<p class="sec-lead">룰룰이 미리 짜 둔 순서예요. 눌러서 그대로 쓰거나, 한두 개만 바꿔 써도 좋아요.</p>
<div class="plan-ex-grid">${PLAN_EX.map(planEx).join('')}</div>
</section>
<section class="wrap fun-sec">
<h2 class="sec-title">순서를 짤 때 알아 두면 좋은 것</h2>
<div class="type-boxes plan-tips">
<div class="type-box"><h2>${icon('i-spark')}처음엔 짧고 쉽게</h2><p>모두 모이기 전이나 서로 어색할 때는 10~15분짜리 순발력 게임으로 몸을 풀어요. 늦게 온 사람도 다음 판에 바로 끼어들 수 있어요.</p></div>
<div class="type-box"><h2>${icon('i-time')}설명 시간도 넣어요</h2><p>처음 하는 게임은 규칙 설명에 5~10분이 더 걸려요. 룰룰의 그림 설명을 함께 보면 훨씬 빨라져요.</p></div>
<div class="type-box"><h2>${icon('i-people')}마무리는 다 같이</h2><p>마지막 게임은 인원이 바뀌어도 되는 파티 게임이 좋아요. 일찍 가는 사람이 있어도 아쉬움 없이 끝낼 수 있어요.</p></div>
</div>
</section>
${funBand('plan')}
<script type="application/json" id="plan-data">${json(planData())}</script>`;
    return layout({
      title: `모임 게임 순서 짜기 | 인원·시간에 맞는 보드게임 추천 - ${cfg.siteName}`,
      description: '인원과 시간, 분위기만 고르면 몸풀기부터 마무리까지 보드게임 순서를 짜 드려요. 마음에 안 드는 게임은 바꾸고, 못 고르겠으면 돌림판으로 정해 보세요.',
      keywords: ['모임 보드게임 추천', '보드게임 순서', '인원별 보드게임', '파티룸 보드게임', '보드게임 돌림판', '보드게임 랜덤 추천'],
      path: '/plan/', body, scripts: ['plan.js'], ogImage: '/assets/img/og/fun-plan.png',
    });
  }

  // ---------- 룰룰 차트 ----------
  function chartPage() {
    const picks = popular.map((sl) => bySlug[sl]).filter(Boolean).slice(0, 10);
    const row = (g, i) => `<li class="chart-row"><span class="chart-rank">${i + 1}</span><span class="chart-move chart-pick">추천</span><a class="chart-game" href="/games/${g.slug}/">${tile(g, 'tile-sm')}<span><b>${esc(g.name)}</b><small>${esc(g.oneLine)}</small></span></a><span class="chart-meta">${playersText(g.players)} · ${minutesText(g.minutes)}</span></li>`;
    const BOX = [
      ['saved', '많이 저장한 게임', '저장하거나 해 보고 싶다고 표시한 수', '/games/', '게임 둘러보기'],
      ['played', '많이 해 본 게임', '‘해 봤어요’를 누른 수', '/games/', '해 본 게임 표시하기'],
      ['rated', '별점이 높은 게임', '후기 2개 이상, 평균 별점', '/games/', '별점 남기러 가기'],
      ['cup', '월드컵 우승이 많은 게임', '보드게임 월드컵 우승 횟수', '/worldcup/', '월드컵 하러 가기'],
      ['plan', '모임 순서에 많이 넣은 게임', '모임 게임 짜기에서 고른 수', '/plan/', '모임 게임 짜기'],
      ['types', '취향 테스트 유형 비율', '지금까지 나온 결과', '/test/', '나도 테스트하기'],
    ];
    const body = `<section class="fun-hero chart-hero">
<div class="wrap fun-hero-grid">
<div>
${crumbs([['', '룰룰 차트']])}
<p class="fun-kicker">매주 바뀌는 순위</p>
<h1 class="fun-title">룰룰 차트</h1>
<p class="fun-lead">이번 주 룰룰에서 사람들이 가장 많이 찾아본 게임과, 저장하고 해 보고 별점을 준 게임을 모았어요. 순위는 10분마다 새로 계산해요.</p>
<p class="chart-range muted small" data-chart-range>최근 7일 기준</p>
</div>
${pic('fox-explain', '', 'chart-hero-pic', true)}
</div>
</section>
<section class="wrap fun-sec">
<div class="sec-row"><h2 class="sec-title">이번 주 많이 본 게임 TOP 10</h2><span class="muted small">방문자 수 기준 · 지난주와 비교</span></div>
<ol class="chart-top" data-chart-week>${picks.map(row).join('')}</ol>
<p class="muted small chart-note" data-chart-note>아직 집계가 모이는 중이라, 지금은 룰룰이 고른 인기 게임 순서로 보여 드려요.</p>
</section>
<section class="wrap fun-sec">
<h2 class="sec-title">모두가 고른 게임</h2>
<div class="chart-grid">${BOX.map(([k, t, d, href, go]) => `<div class="chart-box" data-chart-box="${k}"><h3>${esc(t)}</h3><p class="muted small">${esc(d)}</p><ol class="chart-mini"><li class="live-skel"></li></ol><a class="more-link" href="${href}">${esc(go)}</a></div>`).join('')}</div>
</section>
${funBand('chart')}
<script type="application/json" id="chart-data">${json({ games: games.map(compact), types: Object.fromEntries(TYPES.map((t) => [t, { nick: TEST.types[t].nick, name: TEST.types[t].name, color: TEST.types[t].color }])) })}</script>`;
    return layout({
      title: `룰룰 차트 | 이번 주 인기 보드게임 순위 - ${cfg.siteName}`,
      description: '이번 주 가장 많이 본 보드게임 TOP 10과 많이 저장한 게임, 별점이 높은 게임, 월드컵 우승 게임까지. 룰룰 이용자들이 직접 만든 보드게임 순위예요.',
      keywords: ['보드게임 순위', '인기 보드게임', '보드게임 랭킹', '요즘 보드게임 추천', '보드게임 차트'],
      path: '/chart/', body, scripts: ['plan.js'], ogImage: '/assets/img/og/fun-chart.png',
    });
  }

  // ---------- 다른 페이지에 넣는 조각 ----------
  const homeBand = () => `<section class="sec fun-home">
<div class="wrap">
<div class="sec-row"><h2 class="sec-title">재미로 알아보기</h2><a class="more-link" href="/stories/">보드게임 이야기 ${list.length}편</a></div>
${funCards()}
${dyk('dyk-home')}
</div>
</section>`;
  const gameStoryBox = (g) => {
    const s = stories[g.slug];
    if (!s) return '';
    return `<aside class="story-box" aria-label="${esc(gname(g))} 이야기">
<p class="dyk-k">${icon('i-spark')}알고 계셨나요?</p>
<p class="story-box-t">${esc(s.teaser)}</p>
<a class="story-box-a" href="/stories/${g.slug}/">${icon('i-book')}${esc(s.title)} <span>이야기 읽고 퀴즈 풀기</span></a>
</aside>`;
  };

  const pages = [
    ['stories/index.html', storiesHub()],
    ...list.map((g) => [`stories/${g.slug}/index.html`, storyPage(g)]),
    ['test/index.html', testPage()],
    ...TYPES.map((t) => [`test/${t}/index.html`, testTypePage(t)]),
    ['worldcup/index.html', worldcupPage()],
    ['quiz/index.html', quizPage()],
    ['plan/index.html', planPage()],
    ['chart/index.html', chartPage()],
  ];
  const urls = [
    ['/stories/', 'weekly', '0.7'], ...list.map((g) => [`/stories/${g.slug}/`, 'monthly', '0.6', sDates(g).mod]),
    ['/test/', 'monthly', '0.7'], ...TYPES.map((t) => [`/test/${t}/`, 'monthly', '0.5']),
    ['/worldcup/', 'weekly', '0.6'], ['/quiz/', 'monthly', '0.5'],
    ['/plan/', 'monthly', '0.7'], ['/chart/', 'daily', '0.6'],
  ];
  const storiesData = list.map((g) => ({ s: g.slug, n: g.name, t: stories[g.slug].title, tz: stories[g.slug].teaser }));
  const rss = list.map((g) => ({ title: `${gname(g)} 유래와 역사 | ${stories[g.slug].title}`, link: `/stories/${g.slug}/`, desc: `${stories[g.slug].teaser} ${stories[g.slug].lead}`, day: sDates(g).pub, cat: '보드게임 이야기' }));
  const ogTypes = TYPES.map((t) => ({ t, ...TEST.types[t] }));
  return { problems, stories, pages, urls, frames, storiesData, rss, homeBand, gameStoryBox, ogTypes, josa };
}
