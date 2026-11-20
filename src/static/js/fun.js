/* 룰룰 재미로 알아보기: 알고 계셨나요, 이야기 퀴즈, 취향 테스트, 보드게임 월드컵, 상식 퀴즈 */
(function () {
  'use strict';
  var RS = window.RS;
  if (!RS) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc, store = RS.store;
  var RRS = window.RRS || null;
  var ico = function (id) { return '<svg class="ico" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var dataOf = function (id) { var el = document.getElementById(id); if (!el) return null; try { return JSON.parse(el.textContent); } catch (e) { return null; } };
  var bare = function (n) { return String(n).replace(/[!?]+$/, ''); };
  function post(body) {
    var send = RRS ? RRS.api('play', { method: 'POST', body: body }) : fetch('/api/play', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
    return send.then(function (j) { if (j && j.gain && RRS) RRS.gain(j.gain); return j; }, function () { return null; });
  }
  function loggedIn() { return RRS ? RRS.me() : Promise.resolve(null); }
  function loginHint(el, what) {
    loggedIn().then(function (u) {
      if (u || !el) return;
      el.insertAdjacentHTML('beforeend', '<p class="fun-login muted small">' + esc(what) + ' <a href="/account/?next=' + encodeURIComponent(location.pathname) + '">로그인</a>하면 활동 점수와 배지를 받아요.</p>');
    });
  }
  var funStats = null;
  function loadStats() {
    if (!funStats) funStats = fetch('/api/fun', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { return j && j.ok ? j : null; }, function () { return null; });
    return funStats;
  }
  function scrollTop(el) {
    var y = (el || document.body).getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  // ---------- 알고 계셨나요? ----------
  var storiesP = null;
  function stories() {
    if (!storiesP) storiesP = fetch('/data/stories.json').then(function (r) { return r.json(); }).then(function (d) { return d.stories || []; }, function () { return []; });
    return storiesP;
  }
  $$('[data-dyk]').forEach(function (box) {
    var t = $('[data-dyk-t]', box), a = $('[data-dyk-a]', box), btn = $('[data-dyk-next]', box);
    var cur = (a && a.getAttribute('href')) || '';
    function next() {
      stories().then(function (list) {
        if (!list.length) return;
        var pick = list[Math.floor(Math.random() * list.length)];
        if ('/stories/' + pick.s + '/' === cur && list.length > 1) pick = list[(list.indexOf(pick) + 1) % list.length];
        cur = '/stories/' + pick.s + '/';
        box.classList.remove('is-in'); void box.offsetWidth; box.classList.add('is-in');
        t.textContent = pick.tz;
        a.textContent = bare(pick.n) + ' 이야기 읽기';
        a.setAttribute('href', cur);
      });
    }
    if (btn) btn.addEventListener('click', next);
    if (!box.classList.contains('dyk-hero')) next();
  });

  // ---------- 이야기 모음 거르기 ----------
  var sf = $('[data-sfilter]'), sg = $('[data-sgrid]');
  if (sf && sg) {
    sf.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      $$('button', sf).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var v = b.getAttribute('data-v');
      $$('.scard', sg).forEach(function (c) { c.hidden = !!v && c.getAttribute('data-g') !== v; });
    });
  }

  // ---------- 이야기 퀴즈 ----------
  var sq = $('[data-squiz]');
  if (sq) {
    var slug = sq.getAttribute('data-squiz');
    var items = $$('.sq', sq), res = $('[data-sq-result]', sq), right = 0, done = 0;
    items.forEach(function (li) {
      var a = Number(li.getAttribute('data-a'));
      li.addEventListener('click', function (e) {
        var b = e.target.closest('.sq-opt');
        if (!b || li.classList.contains('is-done')) return;
        var i = Number(b.getAttribute('data-i'));
        li.classList.add('is-done');
        $$('.sq-opt', li).forEach(function (o, j) { o.disabled = true; if (j === a) o.classList.add('is-right'); });
        if (i === a) { right++; li.classList.add('ok'); } else { b.classList.add('is-wrong'); li.classList.add('no'); }
        var why = $('.sq-why', li);
        why.hidden = false;
        why.insertAdjacentHTML('afterbegin', '<b>' + (i === a ? '맞았어요. ' : '아쉬워요. ') + '</b>');
        done++;
        if (done === items.length) finish();
      });
    });
    function finish() {
      var all = right === items.length;
      res.hidden = false;
      res.innerHTML = '<p class="sq-score"><b>' + right + '</b> / ' + items.length + '</p><p>' + (all ? '모두 맞혔어요! 이 게임의 이야기를 제대로 읽으셨네요.' : right ? '조금만 더 하면 다 맞힐 수 있어요. 위 풀이를 한 번 더 읽어 보세요.' : '처음엔 다 그래요. 풀이를 읽고 나면 기억에 오래 남아요.') + '</p>' +
        '<div class="row-btns"><a class="btn btn-main" href="/quiz/">상식 퀴즈 10문제 더 풀기</a><a class="btn btn-sub" href="/stories/">다른 이야기 보기</a></div>';
      RS.track('squiz-done', slug, { n: right });
      post({ act: 'quiz', kind: 'story', slug: slug, score: right, total: items.length });
      if (all) loginHint(res, '다 맞혔어요!');
    }
  }
  var ss = $('[data-story-share]');
  if (ss) ss.addEventListener('click', function () {
    RS.track('fun-share', 'story');
    RS.shareOrCopy({ title: document.title, text: ($('.story-title') || {}).textContent || '', url: location.origin + location.pathname });
  });
  $$('[data-type-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      RS.track('fun-share', 'type');
      RS.shareOrCopy({ title: document.title, text: '나의 보드게임 취향은? 룰룰 취향 테스트', url: location.origin + '/test/' + b.getAttribute('data-type-share') + '/' });
    });
  });

  // ---------- 취향 테스트 ----------
  var TD = dataOf('test-data');
  if (TD) testInit(TD);
  function testInit(D) {
    var intro = $('[data-test-intro]'), run = $('[data-test-run]'), resEl = $('[data-test-res]');
    var qEl = $('[data-test-q]'), optsEl = $('[data-test-opts]'), bar = $('[data-test-bar]'), num = $('[data-test-num]'), prog = $('[data-test-prog]');
    var answers = [], qi = 0, N = D.questions.length;
    var pop = {}; (D.popular || []).forEach(function (s, i) { pop[s] = 1 - i / 100; });
    var last = store.get('rr-type', null);
    var countEl = $('[data-test-count]');
    loadStats().then(function (st) {
      var total = 0;
      if (st && st.types) for (var k in st.types) total += st.types[k];
      var bits = [];
      if (total >= 10) bits.push('지금까지 ' + total.toLocaleString('ko-KR') + '번 테스트했어요.');
      if (last && D.types[last.t]) bits.push('지난번 내 결과는 <a href="/test/' + last.t + '/">' + esc(D.types[last.t].name) + '</a>였어요.');
      if (countEl) countEl.innerHTML = bits.join(' ');
    });
    $('[data-test-start]').addEventListener('click', function () {
      answers = []; qi = 0;
      intro.hidden = true; resEl.hidden = true; run.hidden = false;
      RS.track('test-start', '');
      show(); scrollTop(run);
    });
    $('[data-test-back]').addEventListener('click', function () {
      if (qi === 0) { run.hidden = true; intro.hidden = false; scrollTop(intro); return; }
      qi--; answers.pop(); show();
    });
    function show() {
      var q = D.questions[qi];
      bar.style.width = (qi / N * 100) + '%';
      prog.setAttribute('aria-valuenow', qi);
      num.textContent = (qi + 1) + ' / ' + N;
      qEl.textContent = q.q;
      optsEl.innerHTML = q.a.map(function (a, i) { return '<button type="button" class="test-opt" data-i="' + i + '"><span class="test-opt-k">' + 'ABCD'[i] + '</span>' + esc(a.t) + '</button>'; }).join('');
      run.classList.remove('is-in'); void run.offsetWidth; run.classList.add('is-in');
      try { qEl.focus({ preventScroll: true }); } catch (e) { /* 넘어감 */ }
    }
    optsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.test-opt');
      if (!b) return;
      b.classList.add('is-on');
      answers[qi] = Number(b.getAttribute('data-i'));
      setTimeout(function () { qi++; if (qi < N) show(); else finish(); }, 180);
    });
    function finish() {
      var sc = {}, f = { p: 0, m: 0, kid: 0 };
      D.order.forEach(function (t) { sc[t] = 0; });
      answers.forEach(function (ai, i) {
        var a = D.questions[i].a[ai];
        for (var k in a.w) sc[k] += a.w[k];
        if (a.f) for (var k2 in a.f) f[k2] = a.f[k2];
      });
      var ranked = D.order.slice().sort(function (x, y) { return sc[y] - sc[x] || D.order.indexOf(x) - D.order.indexOf(y); });
      var top = ranked[0], T = D.types[top];
      var sum = 0; D.order.forEach(function (t) { sum += Math.max(0, sc[t]); });
      var pct = function (t) { return sum ? Math.round(Math.max(0, sc[t]) / sum * 100) : 0; };
      // 추천 게임
      var scoreOf = function (g) { var s = 0; D.order.forEach(function (t) { var w = g.w[0] === t ? 2 : g.w.indexOf(t) > -1 ? 1 : 0; s += w * Math.max(0, sc[t]); }); return s + (pop[g.s] || 0); };
      var fits = function (g, lv) {
        if (f.p && lv < 3) { if (f.p >= 8 ? g.p[1] < 7 : !(g.p[0] <= f.p && g.p[1] >= f.p)) return false; }
        if (f.m && f.m < 90 && lv < 2) { if (g.m[0] > (f.m === 15 ? 20 : f.m)) return false; }
        if (f.kid && lv < 1) { if (g.age > 8) return false; }
        return true;
      };
      var sorted = D.games.slice().sort(function (a, b) { return scoreOf(b) - scoreOf(a); });
      var picks = [], lv = 0;
      while (picks.length < 6 && lv < 4) { sorted.forEach(function (g) { if (picks.length < 6 && picks.indexOf(g) < 0 && fits(g, lv)) picks.push(g); }); lv++; }
      var cond = [];
      if (f.p) cond.push(f.p >= 8 ? '7명 이상' : f.p === 4 ? '3~4명' : f.p === 6 ? '5~6명' : '2명');
      if (f.m && f.m < 90) cond.push(f.m + '분 안팎');
      if (f.kid) cond.push('아이와 함께');
      var M = D.types[T.match];
      run.hidden = true; resEl.hidden = false;
      resEl.innerHTML = '<div class="wrap res-wrap">' +
        '<div class="res-card" style="--tc:' + T.color + '">' +
        '<img class="res-pic" src="' + T.img + '" width="' + T.iw + '" height="' + T.ih + '" alt="' + esc(T.nick) + ' 캐릭터">' +
        '<div class="res-copy"><p class="res-k">나의 보드게임 취향은</p><h2 class="res-name">' + esc(T.name) + '</h2><p class="res-line">' + esc(T.line) + '</p>' +
        '<div class="res-bars">' + ranked.slice(0, 3).map(function (t) { return '<p><span>' + esc(D.types[t].nick) + '</span><i><b style="width:' + pct(t) + '%;background:' + D.types[t].color + '"></b></i><em>' + pct(t) + '%</em></p>'; }).join('') + '</div>' +
        '<p class="res-desc">' + esc(T.desc) + '</p>' +
        '<ul class="res-good">' + T.good.map(function (x) { return '<li>' + ico('i-check') + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p class="res-tip"><b>한 가지 팁</b> ' + esc(T.tip) + '</p>' +
        '<a class="res-match" href="/test/' + T.match + '/">' + '<small>잘 맞는 짝</small><b>' + esc(M.nick) + ' · ' + esc(M.name) + '</b></a>' +
        '<p class="res-same muted small" data-res-same></p>' +
        '<div class="row-btns"><button type="button" class="btn btn-coral" data-res-share>' + ico('i-share') + '결과 보내기</button><button type="button" class="btn btn-sub" data-res-again>다시 하기</button><a class="btn btn-ghost" href="/test/' + top + '/">유형 자세히 보기</a></div>' +
        '</div></div>' +
        '<h2 class="sec-title res-sub">지금 같이 하기 좋은 게임</h2>' +
        (cond.length ? '<p class="sec-lead">' + esc(cond.join(' · ')) + ' 조건에 맞춰 골랐어요.</p>' : '') +
        '<div class="gcards res-games">' + picks.map(function (g) { return RS.cardHTML(g); }).join('') + '</div>' +
        '<div class="res-next"><a class="fun-card fc-cup" href="/worldcup/"><span class="fun-card-t">보드게임 월드컵</span><span class="fun-card-d">추천 게임 중 최애를 골라 보세요</span><span class="fun-card-go">해 보기</span></a><a class="fun-card fc-quiz" href="/quiz/"><span class="fun-card-t">보드게임 상식 퀴즈</span><span class="fun-card-d">10문제, 몇 개나 맞힐까요?</span><span class="fun-card-go">해 보기</span></a></div>' +
        '</div>';
      store.set('rr-type', { t: top, d: Date.now() });
      RS.track('test-done', top);
      post({ act: 'typetest', type: top });
      loginHint($('.res-copy', resEl), '');
      loadStats().then(function (st) {
        if (!st || !st.types) return;
        var total = 0; for (var k in st.types) total += st.types[k];
        var mine = (st.types[top] || 0) + 1; total += 1;
        var el = $('[data-res-same]', resEl);
        if (el && total >= 10) el.textContent = '테스트한 사람 가운데 ' + Math.round(mine / total * 100) + '%가 나와 같은 유형이에요.';
      });
      $('[data-res-share]', resEl).addEventListener('click', function () {
        RS.track('fun-share', 'test');
        RS.shareOrCopy({ title: '나의 보드게임 취향은 ‘' + T.name + '’', text: '나의 보드게임 취향은 ‘' + T.name + '’이에요. 너는 어떤 유형일까?', url: location.origin + '/test/' + top + '/' });
      });
      $('[data-res-again]', resEl).addEventListener('click', function () { resEl.hidden = true; intro.hidden = false; scrollTop(intro); });
      scrollTop(resEl);
    }
  }

  // ---------- 보드게임 월드컵 ----------
  var CD = dataOf('cup-data');
  if (CD) cupInit(CD);
  function cupInit(D) {
    var intro = $('[data-cup-intro]'), run = $('[data-cup-run]'), resEl = $('[data-cup-res]');
    var pairEl = $('[data-cup-pair]'), roundEl = $('[data-cup-round]'), stepEl = $('[data-cup-step]'), bar = $('[data-cup-bar]');
    var by = {}; D.games.forEach(function (g) { by[g.s] = g; });
    var size = 16, pool = 'all';
    function radio(sel, set) {
      var box = $(sel);
      box.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-v]');
        if (!b) return;
        $$('button', box).forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        set(b.getAttribute('data-v'));
      });
    }
    radio('[data-cup-size]', function (v) { size = Number(v); });
    radio('[data-cup-pool]', function (v) { pool = v; });
    var round = [], next = [], pi = 0, matches = [], total = 0, doneN = 0, lost = {};
    var label = function (n) { return n === 2 ? '결승' : n + '강'; };
    $('[data-cup-start]').addEventListener('click', function () {
      var list = pool === 'all' ? D.games : pool === 'popular' ? D.popular.map(function (s) { return by[s]; }).filter(Boolean) : D.games.filter(function (g) { return g.g === pool; });
      var n = size;
      while (n > list.length && n > 2) n = n / 2;
      if (n !== size) RS.toast('게임 수에 맞춰 ' + label(n) + '으로 시작해요');
      round = shuffle(list).slice(0, n); next = []; pi = 0; matches = []; lost = {};
      total = n - 1; doneN = 0;
      intro.hidden = true; resEl.hidden = true; run.hidden = false;
      RS.track('cup-start', pool, { n: n });
      show(); scrollTop(run);
    });
    function card(g, side) {
      return '<button type="button" class="cup-pick" data-side="' + side + '">' +
        (g.f ? '<img src="/assets/img/frame/' + g.s + '.svg" width="480" height="300" alt="">' : '<span class="cup-tile"><span class="tile tile-lg" data-g="' + g.g + '"><span>' + esc(RS.firstSyl(g.n)) + '</span></span></span>') +
        '<span class="cup-name">' + esc(g.n) + '</span><span class="cup-one">' + esc(g.one) + '</span>' +
        '<span class="cup-meta">' + g.p[0] + (g.p[1] >= 99 ? '명 이상' : g.p[0] === g.p[1] ? '명' : '–' + g.p[1] + '명') + ' · ' + g.m[0] + (g.m[0] === g.m[1] ? '' : '–' + g.m[1]) + '분</span></button>';
    }
    function show() {
      var a = round[pi * 2], b = round[pi * 2 + 1];
      roundEl.textContent = label(round.length);
      stepEl.textContent = round.length === 2 ? '' : (pi + 1) + ' / ' + (round.length / 2);
      bar.style.width = (doneN / total * 100) + '%';
      pairEl.innerHTML = card(a, 0) + '<span class="cup-vs" aria-hidden="true">VS</span>' + card(b, 1);
      pairEl.classList.remove('is-in'); void pairEl.offsetWidth; pairEl.classList.add('is-in');
    }
    pairEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.cup-pick');
      if (!btn || pairEl.classList.contains('is-busy')) return;
      pairEl.classList.add('is-busy');
      var side = Number(btn.getAttribute('data-side'));
      var w = round[pi * 2 + side], l = round[pi * 2 + 1 - side];
      btn.classList.add('is-picked');
      matches.push([w.s, l.s]); lost[l.s] = round.length; next.push(w); doneN++;
      setTimeout(function () {
        pairEl.classList.remove('is-busy');
        pi++;
        if (pi * 2 >= round.length) {
          if (next.length === 1) return finish(next[0]);
          round = next; next = []; pi = 0;
        }
        show();
      }, 260);
    });
    function finish(ch) {
      var second = matches[matches.length - 1][1];
      var semis = Object.keys(lost).filter(function (s) { return lost[s] === 4; });
      run.hidden = true; resEl.hidden = false;
      resEl.innerHTML = '<div class="wrap cup-res-wrap">' +
        '<div class="cup-champ"><p class="res-k">나의 최애 보드게임</p>' +
        (ch.f ? '<img class="cup-champ-img" src="/assets/img/frame/' + ch.s + '.svg" width="480" height="300" alt="">' : '') +
        '<h2 class="res-name">' + ico('i-trophy') + esc(ch.n) + '</h2><p class="res-line">' + esc(ch.one) + '</p>' +
        '<p class="cup-podium"><span>준우승 <b>' + esc(by[second].n) + '</b></span>' + (semis.length ? '<span>4강 <b>' + semis.map(function (s) { return esc(by[s].n); }).join(', ') + '</b></span>' : '') + '</p>' +
        '<div class="row-btns"><a class="btn btn-main" href="/games/' + ch.s + '/">' + esc(bare(ch.n)) + ' 하는법 보기</a><a class="btn btn-sub" href="/stories/' + ch.s + '/">이야기 읽기</a><button type="button" class="btn btn-coral" data-cup-share>' + ico('i-share') + '결과 보내기</button><button type="button" class="btn btn-ghost" data-cup-again>다시 하기</button></div>' +
        '<div data-cup-hint></div></div></div>';
      RS.track('cup-done', ch.s, { n: matches.length + 1 });
      post({ act: 'cup', champ: ch.s, matches: matches }).then(function () { funStats = null; rank(); });
      loginHint($('[data-cup-hint]', resEl), '');
      $('[data-cup-share]', resEl).addEventListener('click', function () {
        RS.track('fun-share', 'cup');
        RS.shareOrCopy({ title: '보드게임 월드컵 우승: ' + ch.n, text: '나의 보드게임 월드컵 우승은 ‘' + ch.n + '’! 너의 최애 보드게임은?', url: location.origin + '/worldcup/' });
      });
      $('[data-cup-again]', resEl).addEventListener('click', function () { resEl.hidden = true; intro.hidden = false; scrollTop(intro); });
      scrollTop(resEl);
    }
    function rank() {
      var el = $('[data-cup-rank]'), tot = $('[data-cup-total]');
      loadStats().then(function (st) {
        if (!st) { el.innerHTML = '<p class="muted">순위를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>'; return; }
        if (tot && st.cupTotal) tot.textContent = '지금까지 ' + st.cupTotal.toLocaleString('ko-KR') + '번 열렸어요';
        var list = (st.cup || []).filter(function (x) { return by[x.s]; }).slice(0, 10);
        if (!list.length) { el.innerHTML = '<p class="muted">아직 모인 결과가 없어요. 첫 우승 게임을 골라 주세요!</p>'; return; }
        el.innerHTML = '<ol class="cup-rank-list">' + list.map(function (x, i) {
          var g = by[x.s], rate = x.games ? Math.round(x.win / x.games * 100) : 0;
          return '<li><span class="cr-n">' + (i + 1) + '</span><a href="/games/' + g.s + '/"><span class="tile tile-sm" data-g="' + g.g + '"><span>' + esc(RS.firstSyl(g.n)) + '</span></span>' + esc(g.n) + '</a><span class="cr-c">우승 <b>' + x.champ + '</b>회</span><span class="cr-r"><i><b style="width:' + rate + '%"></b></i>승률 ' + rate + '%</span></li>';
        }).join('') + '</ol>';
      });
    }
    rank();
  }

  // ---------- 상식 퀴즈 ----------
  var QD = dataOf('quiz-data');
  if (QD) quizInit(QD);
  function quizInit(all) {
    var intro = $('[data-quiz-intro]'), run = $('[data-quiz-run]'), resEl = $('[data-quiz-res]');
    var qEl = $('[data-quiz-q]'), optsEl = $('[data-quiz-opts]'), whyEl = $('[data-quiz-why]'), gameEl = $('[data-quiz-game]');
    var bar = $('[data-quiz-bar]'), num = $('[data-quiz-num]'), scoreEl = $('[data-quiz-score]');
    var set = [], qi = 0, right = 0, wrong = [], N = 10;
    $('[data-quiz-start]').addEventListener('click', start);
    function start() {
      var seen = {}; set = [];
      shuffle(all).forEach(function (q) { if (set.length < N && !seen[q.s]) { seen[q.s] = 1; set.push(q); } });
      qi = 0; right = 0; wrong = [];
      intro.hidden = true; resEl.hidden = true; run.hidden = false;
      show(); scrollTop(run);
    }
    function show() {
      var q = set[qi];
      bar.style.width = (qi / N * 100) + '%';
      num.textContent = (qi + 1) + ' / ' + N;
      scoreEl.textContent = '맞힘 ' + right;
      gameEl.innerHTML = '<a href="/stories/' + q.s + '/">' + esc(q.n) + '</a>';
      qEl.textContent = q.q;
      optsEl.innerHTML = q.o.map(function (o, i) { return '<button type="button" class="test-opt" data-i="' + i + '"><span class="test-opt-k">' + 'ABCD'[i] + '</span>' + esc(o) + '</button>'; }).join('');
      whyEl.hidden = true; whyEl.innerHTML = '';
      run.classList.remove('is-in'); void run.offsetWidth; run.classList.add('is-in');
      try { qEl.focus({ preventScroll: true }); } catch (e) { /* 넘어감 */ }
    }
    optsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.test-opt');
      if (!b || optsEl.classList.contains('is-done')) return;
      var q = set[qi], i = Number(b.getAttribute('data-i')), ok = i === q.a;
      optsEl.classList.add('is-done');
      $$('.test-opt', optsEl).forEach(function (o, j) { o.disabled = true; if (j === q.a) o.classList.add('is-right'); });
      if (ok) right++; else { b.classList.add('is-wrong'); wrong.push(q); }
      scoreEl.textContent = '맞힘 ' + right;
      whyEl.hidden = false;
      whyEl.innerHTML = '<p><b>' + (ok ? '맞았어요.' : '아쉬워요.') + '</b> ' + esc(q.why) + '</p><div class="row-btns"><button type="button" class="btn btn-main" data-quiz-next>' + (qi + 1 < N ? '다음 문제' : '결과 보기') + '</button><a class="btn btn-ghost" href="/stories/' + q.s + '/" target="_blank" rel="noopener">' + esc(bare(q.n)) + ' 이야기 읽기</a></div>';
      $('[data-quiz-next]', whyEl).focus();
    });
    whyEl.addEventListener('click', function (e) {
      if (!e.target.closest('[data-quiz-next]')) return;
      optsEl.classList.remove('is-done');
      qi++;
      if (qi < N) show(); else finish();
    });
    function finish() {
      var msg = right === N ? '보드게임 박사예요! 한 문제도 놓치지 않았어요.' : right >= 8 ? '거의 다 맞혔어요. 보드게임을 꽤 좋아하시는군요.' : right >= 5 ? '절반 넘게 맞혔어요. 틀린 문제의 이야기를 읽어 보세요.' : right >= 2 ? '이야기를 몇 편 읽고 나면 금방 늘어요.' : '오늘부터 시작이에요. 이야기를 읽고 다시 도전해 보세요.';
      run.hidden = true; resEl.hidden = false;
      resEl.innerHTML = '<div class="wrap-narrow"><div class="quiz-res"><p class="res-k">보드게임 상식 퀴즈</p><p class="quiz-big"><b>' + right + '</b> / ' + N + '</p><p class="res-line">' + esc(msg) + '</p>' +
        '<div class="row-btns" style="justify-content:center"><button type="button" class="btn btn-coral" data-quiz-share>' + ico('i-share') + '결과 보내기</button><button type="button" class="btn btn-sub" data-quiz-again>새 문제로 다시 풀기</button></div><div data-quiz-hint></div></div>' +
        (wrong.length ? '<h2 class="h2">틀린 문제의 이야기</h2><ul class="quiz-wrong">' + wrong.map(function (q) { return '<li><a href="/stories/' + q.s + '/"><b>' + esc(q.n) + '</b><span>' + esc(q.q) + '</span></a></li>'; }).join('') + '</ul>' : '') + '</div>';
      RS.track('quiz-done', '', { n: right });
      post({ act: 'quiz', kind: 'mix', score: right, total: N });
      if (right === N) loginHint($('[data-quiz-hint]', resEl), '');
      $('[data-quiz-share]', resEl).addEventListener('click', function () {
        RS.track('fun-share', 'quiz');
        RS.shareOrCopy({ title: '보드게임 상식 퀴즈 ' + right + '/' + N, text: '보드게임 상식 퀴즈에서 ' + N + '문제 중 ' + right + '문제를 맞혔어요. 너는 몇 개?', url: location.origin + '/quiz/' });
      });
      $('[data-quiz-again]', resEl).addEventListener('click', start);
      scrollTop(resEl);
    }
  }
})();
