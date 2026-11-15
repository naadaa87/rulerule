/* 룰룰 참여 기능: 등급과 점수, 저장·최근 본 게임, 해 봤어요, 후기와 별점, 처음 화면 소식, 랭킹, 프로필 */
(function () {
  'use strict';
  var RS = window.RS, G = window.RRG;
  if (!RS || !G) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc, store = RS.store;
  var params = new URLSearchParams(location.search);

  // ---------- 서버 ----------
  function api(path, opt) {
    opt = opt || {};
    var init = { method: opt.method || 'GET', credentials: 'same-origin', headers: {} };
    if (opt.body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(opt.body); }
    return fetch('/api/' + path, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, message: '서버 응답을 읽지 못했어요.' }; }).then(function (j) { j._status = r.status; return j; });
    }, function () { return { ok: false, _status: 0, message: '인터넷 연결을 확인해 주세요.' }; });
  }
  var ico = function (id) { return '<svg class="ico" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var loginHref = function () { return '/account/?next=' + encodeURIComponent(location.pathname + location.search + location.hash); };
  function ago(iso) {
    var d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!(d >= 0)) return '';
    if (d < 60) return '방금';
    if (d < 3600) return Math.floor(d / 60) + '분 전';
    if (d < 86400) return Math.floor(d / 3600) + '시간 전';
    if (d < 86400 * 7) return Math.floor(d / 86400) + '일 전';
    var t = new Date(new Date(iso).getTime() + 9 * 3600e3);
    return (t.getUTCFullYear() === new Date().getFullYear() ? '' : t.getUTCFullYear() + '. ') + (t.getUTCMonth() + 1) + '. ' + t.getUTCDate() + '.';
  }

  // ---------- 이 기기에 남기는 기록 ----------
  var K_SAVED = 'rr-saved', K_RECENT = 'rr-recent', K_MARKS = 'rr-marks';
  function savedList() { var a = store.get(K_SAVED, []); return Array.isArray(a) ? a : []; }
  function isSaved(s) { return savedList().indexOf(s) > -1; }
  function setSaved(s, on) {
    var a = savedList().filter(function (x) { return x !== s; });
    if (on) a.unshift(s);
    store.set(K_SAVED, a.slice(0, 300));
  }
  function recentList() { var a = store.get(K_RECENT, []); return Array.isArray(a) ? a.filter(function (x) { return x && x.s; }) : []; }
  function pushRecent(s, patch) {
    var a = recentList(), old = a.filter(function (x) { return x.s === s; })[0] || { s: s, v: 0, n: 0 };
    var item = { s: s, t: Date.now(), v: old.v || 0, n: old.n || 0 };
    if (patch) { for (var k in patch) item[k] = patch[k]; }
    store.set(K_RECENT, [item].concat(a.filter(function (x) { return x.s !== s; })).slice(0, 16));
  }
  function marks() { var m = store.get(K_MARKS, null); return m && m.played ? m : { played: [], want: [] }; }
  function setMarks(list) {
    var m = { played: [], want: [] };
    (list || []).forEach(function (x) { if (m[x.kind]) m[x.kind].push(x.slug); });
    store.set(K_MARKS, m);
    return m;
  }
  function setMark(kind, s, on) {
    var m = marks();
    m[kind] = (m[kind] || []).filter(function (x) { return x !== s; });
    if (on) m[kind].unshift(s);
    if (kind === 'played' && on) m.want = m.want.filter(function (x) { return x !== s; });
    store.set(K_MARKS, m);
  }

  // ---------- 나 ----------
  var meP = null;
  function textOn(hex) { // 등급 색 위에 쓸 글자색
    var c = hex.replace('#', ''), r = parseInt(c.substr(0, 2), 16) / 255, g = parseInt(c.substr(2, 2), 16) / 255, b = parseInt(c.substr(4, 2), 16) / 255;
    var f = function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) > 0.3 ? '#233552' : '#fff';
  }
  function paintHead(u) {
    var info = u ? G.level(u.xp || 0) : null;
    $$('[data-acct]').forEach(function (a) {
      var box = $('[data-acct-ico]', a);
      if (box) box.innerHTML = info ? G.emblem(info, 28) : ico('i-user');
      a.classList.toggle('lv-on', !!info);
      if (info) a.setAttribute('title', 'Lv.' + info.lv + ' ' + info.name);
    });
    $$('[data-unread]').forEach(function (d) { d.hidden = !(u && u.unread > 0); });
    $$('[data-tab-acct] span').forEach(function (sp) { sp.textContent = u ? '내 정보' : '로그인'; });
  }
  function remember(u) {
    store.set('rr-me', u ? { nick: u.nick, xp: u.xp || 0, fb: u.badge || '' } : null);
    if (RS.paintAccount) RS.paintAccount();
    paintHead(u);
    if (u) syncOnce(u); else { try { sessionStorage.removeItem('rr-sync'); } catch (e) { /* 넘어감 */ } store.set(K_MARKS, null); }
  }
  function me(force) {
    if (!meP || force) meP = api('me').then(function (j) { var u = j && j.ok ? j.user : null; if (j && j.ok) remember(u); return u; });
    return meP;
  }
  function setMe(u) { meP = Promise.resolve(u); remember(u); }
  var syncP = null;
  function syncOnce(u) {
    var key = '';
    try { key = sessionStorage.getItem('rr-sync') || ''; } catch (e) { /* 넘어감 */ }
    if (key === u.nick || syncP) return syncP;
    syncP = api('sync', { method: 'POST', body: { slugs: savedList().slice(0, 200) } }).then(function (j) {
      syncP = null;
      if (!j.ok) return;
      try { sessionStorage.setItem('rr-sync', u.nick); } catch (e) { /* 넘어감 */ }
      var local = savedList();
      (j.marks || []).forEach(function (x) { if (x.kind === 'saved' && local.indexOf(x.slug) < 0) local.push(x.slug); });
      store.set(K_SAVED, local);
      setMarks(j.marks);
      document.dispatchEvent(new CustomEvent('rr:marks'));
    });
    return syncP;
  }
  var cached = store.get('rr-me', null);
  if (cached && cached.nick) { paintHead(cached); me(); }

  // ---------- 사람 표시: 등급 + 대표 배지 + 닉네임 ----------
  function lvChip(xp) {
    var info = G.level(xp || 0);
    return '<span class="lv" style="background:' + info.color + ';color:' + textOn(info.color) + '">Lv.' + info.lv + '</span>';
  }
  function who(o) {
    if (!o) return '';
    if (o.gone) return '<span class="who who-gone">탈퇴한 회원</span>';
    if (o.sys) return '<span class="who who-sys">' + esc(o.nick) + ' <span class="tag tag-coral">운영</span></span>';
    var info = G.level(o.xp || 0), b = o.fb && G.BY[o.fb] ? G.badge(G.BY[o.fb], 18) : '';
    return '<a class="who" href="/community/user/?n=' + encodeURIComponent(o.nick) + '" title="Lv.' + info.lv + ' ' + esc(info.name) + (o.fb && G.BY[o.fb] ? ' · ' + esc(G.BY[o.fb].name) : '') + '">' + lvChip(o.xp) + b + '<span class="who-n">' + esc(o.nick) + '</span></a>';
  }
  function stars(n, size) {
    var h = '<span class="stars" role="img" aria-label="별 5개 중 ' + (Math.round(n * 10) / 10) + '개"' + (size ? ' style="font-size:' + size + 'px"' : '') + '>';
    for (var i = 1; i <= 5; i++) h += '<svg class="' + (n >= i - 0.25 ? '' : 'off') + '" aria-hidden="true"><use href="#i-star"/></svg>';
    return h + '</span>';
  }

  // ---------- 점수 알림, 등급 오름, 새 배지 ----------
  var toastEl = null, toastTimer = 0;
  function notice(html, ms) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'gain-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = html;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2600);
  }
  function needLogin(what) { notice(esc(what) + ' <a href="' + loginHref() + '" style="color:var(--butter)">로그인</a>', 4200); }
  var popQueue = [], popping = false;
  function popNext() {
    var it = popQueue.shift();
    if (!it) { popping = false; return; }
    popping = true;
    var d = document.createElement('dialog');
    d.className = 'lvup';
    var confetti = '';
    var cols = ['#F05B48', '#FFE6A7', '#55B9A7', '#233552'];
    for (var i = 0; i < 18; i++) confetti += '<i style="left:' + (5 + i * 5) + '%;background:' + cols[i % 4] + ';animation-delay:' + (i % 6) * 0.08 + 's"></i>';
    var art, k, t, desc;
    if (it.lv) {
      var info = G.level(G.LEVELS[it.lv - 1].min);
      art = G.emblem(info, 104); k = '등급이 올랐어요'; t = 'Lv.' + info.lv + ' ' + info.name; desc = info.line;
    } else {
      var b = G.BY[it.key] || { name: it.name, desc: '', icon: 'star', color: '#F05B48' };
      art = G.badge(b, 104); k = '새 배지를 받았어요'; t = b.name; desc = b.desc;
    }
    d.innerHTML = '<div class="lvup-body"><div class="confetti" aria-hidden="true">' + confetti + '</div>' + art + '<p class="lvup-k">' + k + '</p><p class="lvup-t">' + esc(t) + '</p><p class="lvup-d">' + esc(desc) + '</p><div class="row-btns" style="justify-content:center"><button type="button" class="btn btn-main" data-ok>좋아요</button><a class="btn btn-ghost" href="/account/#badges">내 배지 보기</a></div></div>';
    document.body.appendChild(d);
    var close = function () { d.close(); d.remove(); setTimeout(popNext, 200); };
    $('[data-ok]', d).addEventListener('click', close);
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function gain(g) {
    if (!g) return;
    if (g.pts) notice('<b>+' + g.pts + '점</b><span>' + esc(String(g.label || '').replace(/ \([^)]*\)/g, '')) + '</span>');
    if (g.up) popQueue.push({ lv: g.up.lv });
    (g.badges || []).forEach(function (b) { popQueue.push({ key: b.key || b, name: b.name }); });
    if (popQueue.length && !popping) setTimeout(popNext, g.pts ? 900 : 0);
    me(true);
  }

  window.RRS = { api: api, me: me, setMe: setMe, who: who, lvChip: lvChip, stars: stars, gain: gain, notice: notice, needLogin: needLogin, ago: ago, marks: marks, savedList: savedList, recentList: recentList };
  // 앞 페이지에서 넘겨받은 점수 알림 (글을 올리고 바로 글 페이지로 넘어갈 때)
  try {
    var later = sessionStorage.getItem('rr-gain');
    if (later) { sessionStorage.removeItem('rr-gain'); setTimeout(function () { gain(JSON.parse(later)); }, 400); }
  } catch (e) { /* 넘어감 */ }

  // ---------- 게임 목록 도우미 ----------
  var gameMap = null;
  function games() {
    if (gameMap) return Promise.resolve(gameMap);
    return RS.loadGames().then(function (d) { gameMap = {}; d.games.forEach(function (g) { gameMap[g.s] = g; }); gameMap._list = d.games; return gameMap; });
  }
  function tileHTML(g, cls) { return '<div class="tile ' + (cls || '') + '" data-g="' + g.g + '" aria-hidden="true"><span>' + esc(RS.firstSyl ? RS.firstSyl(g.n) : g.n.charAt(0)) + '</span></div>'; }

  // 게임 카드에 별점 붙이기
  var statsP = null;
  function gameStats() { if (!statsP) statsP = api('games/stats').then(function (j) { return j.ok ? j.stats : {}; }); return statsP; }
  function paintRatings(root) {
    var cards = $$('.gcard[data-slug]', root || document);
    if (!cards.length) return;
    gameStats().then(function (st) {
      cards.forEach(function (c) {
        var x = st[c.dataset.slug], meta = $('.gcard-meta', c);
        if (!meta || $('.rate', meta)) return;
        if (x && x.n) meta.insertAdjacentHTML('beforeend', '<span class="rate">' + ico('i-star') + x.r.toFixed(1) + ' <small>(' + x.n + ')</small></span>');
      });
    });
  }
  RS.paintRatings = paintRatings;
  paintRatings();
  // 처음 화면처럼 카드가 새로 그려질 때도 붙여요
  var deal = $('[data-deal]');
  if (deal && window.MutationObserver) new MutationObserver(function () { paintRatings(deal); }).observe(deal, { childList: true });

  // ---------- 게임 페이지 ----------
  var gameEl = $('article.game[data-slug]');
  if (gameEl) gamePage(gameEl.dataset.slug);

  function gamePage(slug) {
    pushRecent(slug);
    document.addEventListener('rr:vis', function (e) { if (e.detail) pushRecent(slug, { v: e.detail.i, n: e.detail.n }); });

    var react = $('[data-react]'), rateEl = $('[data-game-rate]'), rvBox = $('[data-rv-body]');
    var state = { counts: { saved: 0, played: 0, want: 0 }, my: null, me: null, sort: 'helpful', page: 1, list: [], summary: null };
    var paintReact = function () {
      if (!react) return;
      var m = marks();
      $$('button[data-k]', react).forEach(function (b) {
        var k = b.dataset.k;
        var on = k === 'saved' ? isSaved(slug) : (state.my ? state.my.marks.indexOf(k) > -1 : m[k].indexOf(slug) > -1);
        b.setAttribute('aria-pressed', String(on));
        var n = state.counts[k] || 0;
        $('em', b).textContent = n ? ' ' + n : '';
        if (k === 'saved') { var u = $('use', b); if (u) u.setAttribute('href', '#i-bookmark'); b.style.setProperty('--fill', on ? 'currentColor' : 'none'); }
      });
    };
    paintReact();
    document.addEventListener('rr:marks', paintReact);
    if (react) react.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (!b) return;
      var k = b.dataset.k, on = b.getAttribute('aria-pressed') !== 'true';
      if (k === 'saved') {
        setSaved(slug, on);
        state.counts.saved = Math.max(0, (state.counts.saved || 0) + (on ? 1 : -1) * (state.me ? 1 : 0));
        paintReact();
        notice(on ? '저장했어요. <a href="/saved/" style="color:var(--butter)">저장한 게임 보기</a>' : '저장을 풀었어요.');
        if (state.me) api('games/' + slug + '/mark', { method: 'POST', body: { kind: 'saved', on: on } });
        return;
      }
      if (!state.me) { needLogin(k === 'played' ? '로그인하면 해 본 게임을 체크하고 도감을 채울 수 있어요.' : '로그인하면 하고 싶은 게임을 모아 둘 수 있어요.'); return; }
      b.disabled = true;
      api('games/' + slug + '/mark', { method: 'POST', body: { kind: k, on: on } }).then(function (j) {
        b.disabled = false;
        if (!j.ok) { RS.toast(j.message); return; }
        state.counts = j.counts; state.my = state.my || { marks: [] }; state.my.marks = j.mine;
        setMark(k, slug, on);
        paintReact(); paintRate();
        if (j.gain) gain(j.gain); else if (k === 'played') notice(on ? '해 본 게임에 넣었어요.' : '해 본 게임에서 뺐어요.');
        else notice(on ? '하고 싶은 게임에 넣었어요.' : '하고 싶은 게임에서 뺐어요.');
      });
    });

    var paintRate = function () {
      if (!rateEl || !state.summary) return;
      var s = state.summary, bits = [];
      if (s.n) bits.push('<a href="#reviews">' + stars(s.avg, 17) + ' <b>' + s.avg.toFixed(1) + '</b> 별점 ' + s.n + '개</a>');
      if (state.counts.played) bits.push('해 본 사람 ' + state.counts.played + '명');
      if (!bits.length) bits.push('<a href="#reviews">첫 별점을 남겨 주세요</a>');
      rateEl.innerHTML = bits.join('<span aria-hidden="true">·</span>');
    };

    function load(more) {
      return Promise.all([api('games/' + slug + '?sort=' + state.sort + '&page=' + state.page), cached ? me() : Promise.resolve(null)]).then(function (r) {
        var j = r[0];
        state.me = r[1];
        if (!j.ok) { if (rvBox) rvBox.innerHTML = '<div class="state"><h3>후기를 불러오지 못했어요</h3><p>' + esc(j.message || '') + '</p><button type="button" class="btn btn-sub" data-retry>다시 불러오기</button></div>'; var rb = $('[data-retry]', rvBox); if (rb) rb.addEventListener('click', function () { load(); }); return; }
        state.counts = j.counts; state.my = j.my; state.summary = j.summary;
        state.list = more ? state.list.concat(j.reviews) : j.reviews;
        state.more = j.reviews.length >= j.per;
        if (state.my) { var m = marks(); ['played', 'want'].forEach(function (k) { setMark(k, slug, state.my.marks.indexOf(k) > -1); }); void m; if (state.my.marks.indexOf('saved') > -1 && !isSaved(slug)) setSaved(slug, true); }
        paintReact(); paintRate(); paintReviews();
      });
    }
    var BEST = ['2', '3', '4', '5', '6', '7+'], DIFF = { 1: '쉬웠어요', 2: '적당했어요', 3: '어려웠어요' };
    var LABELS = { 1: '아쉬워요', 2: '그저 그래요', 3: '괜찮아요', 4: '재밌어요', 5: '최고예요' };
    function paintReviews() {
      if (!rvBox) return;
      var s = state.summary, my = state.my && state.my.review, h = '';
      var maxD = Math.max(1, s.dist[1], s.dist[2], s.dist[3], s.dist[4], s.dist[5]);
      var dTot = s.diff[1] + s.diff[2] + s.diff[3];
      h += '<div class="rv-sum">' +
        '<div class="rv-avg">' + (s.n ? '<b>' + s.avg.toFixed(1) + '</b>' + stars(s.avg) + '<small>별점 ' + s.n + '개 · 후기 ' + s.texts + '개</small>' : '<b>–</b>' + stars(0) + '<small>아직 별점이 없어요</small>') + '</div>' +
        '<div class="rv-bars">' + [5, 4, 3, 2, 1].map(function (k) { return '<div class="rv-bar"><span>' + k + '점</span><i><b style="width:' + Math.round((s.dist[k] / maxD) * 100) + '%"></b></i><span>' + s.dist[k] + '</span></div>'; }).join('') + '</div>' +
        '<div class="rv-facts"><div><p>해 본 사람들이 꼽은 인원</p><div class="rv-chips">' + (BEST.filter(function (b) { return s.best[b]; }).sort(function (a, b) { return s.best[b] - s.best[a]; }).map(function (b) { return '<span>' + b + '명<b>' + s.best[b] + '</b></span>'; }).join('') || '<span class="muted">아직 없어요</span>') + '</div></div>' +
        '<div><p>체감 난이도</p>' + (dTot ? '<div class="diff-bar">' + [1, 2, 3].map(function (k) { return '<i style="width:' + Math.round((s.diff[k] / dTot) * 100) + '%"></i>'; }).join('') + '</div><div class="diff-legend">' + [1, 2, 3].map(function (k) { return '<span>' + DIFF[k] + ' ' + s.diff[k] + '</span>'; }).join('') + '</div>' : '<p class="muted small" style="font-weight:600">아직 없어요</p>') + '</div></div>' +
        '</div>';
      if (!state.me) {
        h += '<div class="state" style="margin-top:16px">' + '<h3>해 본 게임이라면 별점을 남겨 주세요</h3><p>별점과 후기를 남기면 점수를 받고, 다른 사람이 ‘도움돼요’를 누르면 별이 쌓여요.</p><div class="row-btns" style="justify-content:center"><a class="btn btn-main" href="' + loginHref() + '">로그인하고 남기기</a><a class="btn btn-sub" href="/account/?mode=signup">회원가입</a></div></div>';
      } else {
        var r0 = my || { rating: 0, best: '', diff: 0, body: '' }, bestOn = String(r0.best || '').split(',');
        h += '<form class="rv-form" data-rv-form><h3>' + (my ? '내 후기 고치기' : '이 게임, 어땠나요?') + '</h3>' +
          '<div style="display:flex;flex-wrap:wrap;align-items:center"><div class="star-pick" role="radiogroup" aria-label="별점">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" role="radio" aria-checked="' + (r0.rating === k) + '" aria-label="' + k + '점" data-star="' + k + '"><svg aria-hidden="true"><use href="#i-star"/></svg></button>'; }).join('') + '</div><span class="star-pick-label" data-star-label>' + (r0.rating ? LABELS[r0.rating] : '별을 눌러 골라 주세요') + '</span></div>' +
          '<div><p class="small" style="font-weight:800;margin-bottom:6px">몇 명이서 할 때 좋았나요? (여러 개 골라도 돼요)</p><div class="chips" data-best>' + BEST.map(function (b) { return '<button type="button" class="chip" aria-pressed="' + (bestOn.indexOf(b) > -1) + '" data-v="' + b + '">' + b + '명</button>'; }).join('') + '</div></div>' +
          '<div><p class="small" style="font-weight:800;margin-bottom:6px">처음 배울 때 난이도</p><div class="chips" role="radiogroup" data-diff>' + [1, 2, 3].map(function (k) { return '<button type="button" class="chip" role="radio" aria-checked="' + (r0.diff === k) + '" data-v="' + k + '">' + DIFF[k] + '</button>'; }).join('') + '</div></div>' +
          '<label class="field"><span>후기 (선택, 20자 넘게 쓰면 +' + G.RULES.review[0] + '점)</span><textarea name="body" rows="4" maxlength="1000" placeholder="누구와, 몇 명이서 했는지, 어떤 점이 좋았는지 적어 주면 고르는 사람에게 큰 도움이 돼요.">' + esc(r0.body || '') + '</textarea></label>' +
          '<div class="row-btns" style="margin-top:0"><button type="submit" class="btn btn-main">' + (my ? '고친 후기 올리기' : '후기 올리기') + '</button>' + (my ? '<button type="button" class="btn btn-ghost" data-rv-del>후기 지우기</button>' : '') + '<span class="rv-gain">' + (my ? '' : '별점 +' + G.RULES.rate[0] + '점') + '</span></div><p class="form-msg" role="status"></p></form>';
      }
      h += '<div class="rv-tools"><div class="saved-tabs" style="margin:0" role="tablist" aria-label="후기 정렬">' + [['helpful', '도움순'], ['new', '최신순']].map(function (x) { return '<button type="button" role="tab" aria-selected="' + (state.sort === x[0]) + '" data-sort="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><a class="more-link" href="/community/write/?t=post&amp;cat=review&amp;game=' + slug + '">게시판에 긴 후기 쓰기</a></div>';
      var shown = state.list.filter(function (r) { return r.body || r.mine; });
      h += shown.length ? '<div class="rv-list">' + shown.map(function (r) {
        var tags = String(r.best || '').split(',').filter(Boolean).map(function (b) { return '<span class="tag">' + b + '명 추천</span>'; }).join('') + (r.diff ? '<span class="tag tag-teal">' + DIFF[r.diff] + '</span>' : '');
        return '<article class="rv"><div class="rv-head">' + who(r) + stars(r.rating) + '<span class="rv-when">' + ago(r.created_at) + (r.edited ? ' (고침)' : '') + '</span></div>' +
          (tags ? '<div class="rv-tags">' + tags + '</div>' : '') + (r.body ? '<p class="rv-body">' + esc(r.body) + '</p>' : '') +
          '<div class="rv-foot">' + (r.mine ? '<span class="muted small">내 후기예요</span>' : '<button type="button" class="help-btn" aria-pressed="' + !!r.helped + '" data-help="' + r.id + '">' + ico('i-thumb') + '도움돼요 <b>' + (r.helpful || 0) + '</b></button><button type="button" class="link-btn" data-flag="review" data-id="' + r.id + '">신고</button>') + '</div></article>';
      }).join('') + '</div>' + (state.more ? '<p class="center"><button type="button" class="btn btn-sub" data-rv-more>후기 더 보기</button></p>' : '') : '<p class="muted" style="padding:12px 2px">아직 글로 남긴 후기가 없어요. 첫 후기를 남겨 주세요.</p>';
      rvBox.innerHTML = h;
      bindReviews();
    }
    function bindReviews() {
      var f = $('[data-rv-form]', rvBox), pick = { rating: 0, diff: 0 };
      if (f) {
        var r0 = state.my && state.my.review;
        pick.rating = r0 ? r0.rating : 0; pick.diff = r0 ? r0.diff : 0;
        var paintStars = function (n) { $$('[data-star]', f).forEach(function (b) { var k = Number(b.dataset.star); b.classList.toggle('on', k <= n); b.setAttribute('aria-checked', String(k === pick.rating)); }); $('[data-star-label]', f).textContent = n ? LABELS[n] : '별을 눌러 골라 주세요'; };
        paintStars(pick.rating);
        $$('[data-star]', f).forEach(function (b) {
          b.addEventListener('click', function () { pick.rating = Number(b.dataset.star); paintStars(pick.rating); });
          b.addEventListener('mouseenter', function () { paintStars(Number(b.dataset.star)); });
        });
        $('.star-pick', f).addEventListener('mouseleave', function () { paintStars(pick.rating); });
        $$('[data-best] .chip', f).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }); });
        $$('[data-diff] .chip', f).forEach(function (b) { b.addEventListener('click', function () { pick.diff = pick.diff === Number(b.dataset.v) ? 0 : Number(b.dataset.v); $$('[data-diff] .chip', f).forEach(function (x) { x.setAttribute('aria-checked', String(Number(x.dataset.v) === pick.diff)); }); }); });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var m = $('.form-msg', f), btn = $('button[type=submit]', f);
          if (!pick.rating) { m.textContent = '별점을 먼저 골라 주세요.'; m.className = 'form-msg err'; return; }
          btn.disabled = true; m.textContent = '올리는 중이에요'; m.className = 'form-msg';
          var best = $$('[data-best] [aria-pressed="true"]', f).map(function (x) { return x.dataset.v; });
          api('games/' + slug + '/review', { method: 'POST', body: { rating: pick.rating, best: best, diff: pick.diff, body: f.body.value } }).then(function (j) {
            btn.disabled = false;
            if (!j.ok) { m.textContent = j.message || '올리지 못했어요.'; m.className = 'form-msg err'; return; }
            setMark('played', slug, true);
            if (j.gain) gain(j.gain); else notice('후기를 고쳤어요.');
            statsP = null; state.page = 1; load();
          });
        });
        var del = $('[data-rv-del]', f);
        if (del) del.addEventListener('click', function () {
          if (!confirm('내 후기를 지울까요? 후기로 받은 점수와 별도 함께 빠져요.')) return;
          api('games/' + slug + '/review', { method: 'DELETE' }).then(function (j) { if (!j.ok) { RS.toast(j.message); return; } notice('후기를 지웠어요.'); me(true); state.page = 1; load(); });
        });
      }
      $$('[data-sort]', rvBox).forEach(function (b) { b.addEventListener('click', function () { if (state.sort === b.dataset.sort) return; state.sort = b.dataset.sort; state.page = 1; load(); }); });
      var more = $('[data-rv-more]', rvBox);
      if (more) more.addEventListener('click', function () { state.page++; more.disabled = true; load(true); });
      $$('[data-help]', rvBox).forEach(function (b) {
        b.addEventListener('click', function () {
          if (!state.me) { needLogin('로그인하면 도움된 후기에 표시할 수 있어요.'); return; }
          api('reviews/' + b.dataset.help + '/helpful', { method: 'POST' }).then(function (j) {
            if (!j.ok) { RS.toast(j.message); return; }
            b.setAttribute('aria-pressed', String(j.helped)); $('b', b).textContent = j.helpful;
            state.list.forEach(function (r) { if (String(r.id) === b.dataset.help) { r.helped = j.helped; r.helpful = j.helpful; } });
          });
        });
      });
    }
    // 화면에 보일 때 불러와요 (첫 화면 속도를 위해)
    var rvSec = $('[data-reviews]');
    var started = false, start = function () { if (started) return; started = true; load(); loadTalk(); };
    if (rvSec && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: '600px 0px' });
      io.observe(rvSec);
      // 별점 줄과 반응 숫자는 바로 보여야 해서 조금 뒤에 먼저 불러요
      setTimeout(start, 1200);
    } else start();
    if (location.hash === '#reviews') start();

    function loadTalk() {
      var sec = $('[data-talk]'), ul = $('[data-talk-list]');
      if (!sec) return;
      api('posts?game=' + slug).then(function (j) {
        if (!j.ok || !j.posts.length) return;
        var CATS = { free: '자유', qna: '규칙 질문', review: '게임 후기', recommend: '추천해 주세요', poll: '투표', notice: '공지' };
        ul.innerHTML = j.posts.slice(0, 4).map(function (p) {
          return '<li><a class="prow" href="/community/post/?id=' + p.id + '"><span class="badge badge-cat">' + (CATS[p.cat] || '') + '</span><span class="prow-t">' + esc(p.title) + (p.comments ? ' <span class="prow-c">[' + p.comments + ']</span>' : '') + (p.adopted ? ' <span class="adopt-tag">해결</span>' : '') + '</span><span class="prow-meta">' + esc(p.gone ? '탈퇴한 회원' : p.nick) + ' · ' + ago(p.created_at) + '</span></a></li>';
        }).join('');
        sec.hidden = false;
      });
    }
  }

  // ---------- 처음 화면 ----------
  var recentSec = $('[data-recent-sec]');
  if (recentSec) {
    var rec = recentList();
    if (rec.length) {
      games().then(function (gm) {
        var list = rec.filter(function (x) { return gm[x.s]; });
        if (!list.length) return;
        var r0 = list.filter(function (x) { return x.n > 1 && x.v > 0 && x.v < x.n - 1; })[0];
        if (r0) {
          var g0 = gm[r0.s];
          $('[data-resume]', recentSec).innerHTML = '<div class="resume">' + tileHTML(g0) + '<p class="resume-k">' + esc(g0.n) + ' 이어서 보기</p><p class="resume-d">그림 설명 ' + r0.n + '장 가운데 ' + (r0.v + 1) + '번째에서 멈췄어요 · ' + ago(new Date(r0.t).toISOString()) + '</p><a class="btn btn-main" href="/games/' + r0.s + '/#v-' + (r0.v + 1) + '">' + (r0.v + 1) + '단계부터 이어서</a></div>';
        }
        $('[data-recent]', recentSec).innerHTML = list.slice(0, 6).map(function (x) { return RS.cardHTML ? RS.cardHTML(gm[x.s]) : ''; }).join('');
        recentSec.hidden = false;
        paintRatings(recentSec);
      });
    }
  }
  var live = $('[data-live]');
  if (live) {
    var liveStart = function () {
      Promise.all([api('community/home'), cached ? me() : Promise.resolve(null), games()]).then(function (r) {
        var j = r[0], u = r[1], gm = r[2];
        var pollBox = $('[data-live-poll]', live), rvB = $('[data-live-reviews]', live), topB = $('[data-live-top]', live);
        var fail = function (box, title) { box.innerHTML = '<h3>' + title + '</h3><p class="muted">지금은 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.</p>'; };
        if (!j.ok) { fail(pollBox, ico('i-poll') + '이번 주 투표'); fail(rvB, ico('i-star') + '새로 올라온 후기'); fail(topB, ico('i-trophy') + '이달의 활동왕'); return; }
        renderPoll(pollBox, j.poll, u);
        rvB.innerHTML = '<h3>' + ico('i-star') + '새로 올라온 후기</h3>' + (j.reviews.length ? '<div class="rv-list">' + j.reviews.slice(0, 3).map(function (x) {
          var g = gm[x.slug];
          return '<div class="rv" style="padding:10px 0"><div class="rv-head"><a href="/games/' + x.slug + '/#reviews" style="font-weight:900;text-decoration:none">' + esc(g ? g.n : x.slug) + '</a>' + stars(x.rating, 14) + '</div><p class="rv-body small" style="margin-top:4px;-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">' + esc(x.body) + '</p><div class="rv-head" style="margin-top:6px">' + who(x) + '<span class="rv-when">' + ago(x.created_at) + '</span></div></div>';
        }).join('') + '</div>' : '<p class="muted">아직 후기가 없어요. 해 본 게임에 첫 후기를 남겨 보세요.</p><a class="more-link" href="/games/">게임 고르기</a>');
        topB.innerHTML = '<h3>' + ico('i-trophy') + '이달의 활동왕</h3>' + (j.top.length ? '<ol class="rank-list">' + j.top.map(function (x, i) { return '<li><span class="rank-n">' + (i + 1) + '</span>' + who(x) + '<span class="rank-s">' + x.s + '점</span></li>'; }).join('') + '</ol>' : '<p class="muted">이달의 첫 활동왕이 되어 보세요. 출석 체크만 해도 점수가 쌓여요.</p>') + '<a class="more-link" href="/community/rank/">랭킹 전체 보기</a>';
      });
    };
    if ('IntersectionObserver' in window) {
      var lio = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { lio.disconnect(); liveStart(); } }, { rootMargin: '400px 0px' });
      lio.observe(live);
    } else liveStart();
  }

  // ---------- 투표 (처음 화면, 커뮤니티 홈, 글 페이지가 함께 써요) ----------
  function pollHTML(p, u) {
    var canVote = u && p.mine < 0 && !p.closed;
    var h = '<div class="poll">';
    p.options.forEach(function (o) {
      var pct = p.total ? Math.round((o.votes / p.total) * 100) : 0;
      if (canVote || (!u && !p.closed)) h += '<button type="button" class="poll-opt" data-vote="' + o.idx + '"><span>' + esc(o.label) + '</span><b>' + (p.mine >= 0 ? pct + '%' : '고르기') + '</b></button>';
      else h += '<div class="poll-opt' + (o.idx === p.mine ? ' mine' : '') + '"><i style="width:' + pct + '%"></i><span>' + esc(o.label) + (o.idx === p.mine ? ' (내 선택)' : '') + '</span><b>' + pct + '% · ' + o.votes + '표</b></div>';
    });
    h += '</div><p class="poll-meta">' + p.total + '명 참여' + (p.ends ? ' · ' + (p.closed ? '마감된 투표' : p.ends.replace(/^\d{4}-(\d{2})-(\d{2})$/, function (_, a, b) { return Number(a) + '월 ' + Number(b) + '일까지'; })) : '') + (canVote ? ' · 고르면 +' + G.RULES.vote[0] + '점' : '') + '</p>';
    return h;
  }
  function bindPoll(box, p, u, onDone) {
    $$('[data-vote]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!u) { needLogin('로그인하면 투표할 수 있어요.'); return; }
        $$('[data-vote]', box).forEach(function (x) { x.disabled = true; });
        api('posts/' + p.id + '/vote', { method: 'POST', body: { idx: Number(b.dataset.vote) } }).then(function (j) {
          if (!j.ok) { RS.toast(j.message); $$('[data-vote]', box).forEach(function (x) { x.disabled = false; }); return; }
          gain(j.gain);
          var np = j.poll; np.id = p.id; np.title = p.title;
          onDone(np);
        });
      });
    });
  }
  function renderPoll(box, p, u) {
    if (!p) { box.innerHTML = '<h3>' + ico('i-poll') + '이번 주 투표</h3><p class="muted">지금 열린 투표가 없어요. 궁금한 걸 직접 물어보세요.</p><a class="more-link" href="/community/write/?t=post&amp;cat=poll">투표 만들기</a>'; return; }
    box.innerHTML = '<h3>' + ico('i-poll') + '이번 주 투표</h3><p style="font-weight:800;margin:-4px 0 0">' + esc(p.title) + '</p>' + pollHTML(p, u) + '<a class="more-link" href="/community/post/?id=' + p.id + '">댓글 보기</a>';
    bindPoll(box, p, u, function (np) { renderPoll(box, np, u); });
  }
  window.RRS.pollHTML = pollHTML;
  window.RRS.bindPoll = bindPoll;
  window.RRS.renderPoll = renderPoll;

  // ---------- 저장한 게임 ----------
  var savedRoot = $('[data-saved]');
  if (savedRoot) savedPage();
  function savedPage() {
    var tabs = $('[data-saved-tabs]'), body = $('[data-saved-body]', savedRoot);
    var cur = ['saved', 'recent', 'played', 'want'].indexOf(params.get('tab')) > -1 ? params.get('tab') : 'saved';
    var empty = function (k) { var t = $('template[data-empty="' + k + '"]', savedRoot); return t ? t.innerHTML : ''; };
    function card(g, opt) {
      var meta = (g.p[1] >= 99 ? g.p[0] + '명 이상' : g.p[0] === g.p[1] ? g.p[0] + '명' : g.p[0] + '–' + g.p[1] + '명') + ' · ' + (g.m[0] === g.m[1] ? g.m[0] : g.m[0] + '–' + g.m[1]) + '분';
      return '<article class="scard"><div class="scard-top" style="background:' + ({ family: 'var(--butter-2)', party: 'var(--coral-tint)', strategy: 'var(--teal-tint)', traditional: '#e8ecf4' }[g.g] || 'var(--cream)') + '">' + tileHTML(g) + '</div>' +
        (opt.toggle ? '<button type="button" class="scard-mark" aria-pressed="true" aria-label="저장 풀기" data-unsave="' + g.s + '">' + ico('i-bookmark') + '</button>' : '') +
        '<h3>' + esc(g.n) + '</h3><p>' + meta + (opt.note ? ' · ' + opt.note : '') + '</p>' +
        '<a class="btn ' + (opt.resume ? 'btn-main' : 'btn-sub') + '" href="/games/' + g.s + '/' + (opt.resume || '') + '">' + (opt.resume ? '이어서 확인하기' : '하는 법 보기') + '</a></article>';
    }
    function show() {
      $$('[data-tab]', tabs).forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === cur)); });
      Promise.all([games(), (cur === 'played' || cur === 'want') && cached ? me() : Promise.resolve(null)]).then(function (r) {
        var gm = r[0], u = r[1], h = '';
        if (cur === 'saved') {
          var list = savedList().filter(function (s) { return gm[s]; });
          h = list.length ? '<p class="muted" style="margin-bottom:12px">' + list.length + '개 저장했어요' + (cached ? '' : ' · 로그인하면 다른 기기에서도 보여요') + '</p><div class="scards">' + list.map(function (s) { return card(gm[s], { toggle: true }); }).join('') + '</div>' : empty('saved');
        } else if (cur === 'recent') {
          var rl = recentList().filter(function (x) { return gm[x.s]; });
          h = rl.length ? '<div class="scards">' + rl.map(function (x) {
            var mid = x.n > 1 && x.v > 0 && x.v < x.n - 1;
            return card(gm[x.s], { note: ago(new Date(x.t).toISOString()) + (mid ? ' · ' + (x.v + 1) + '/' + x.n + '단계' : ''), resume: mid ? '#v-' + (x.v + 1) : '' });
          }).join('') + '</div><p class="center"><button type="button" class="btn btn-ghost" data-clear-recent>최근 본 기록 지우기</button></p>' : empty('recent');
        } else {
          if (!u) { h = empty(cur === 'played' ? 'played' : 'want'); }
          else {
            var arr = (marks()[cur] || []).filter(function (s) { return gm[s]; });
            if (cur === 'played') {
              var total = gm._list.length;
              h = '<div class="dex-head"><p><b>보드게임 도감</b> ' + arr.length + ' / ' + total + '</p><div class="dex-bar" aria-hidden="true"><b style="width:' + Math.round((arr.length / total) * 100) + '%"></b></div></div>';
              h += arr.length ? '<div class="scards">' + arr.map(function (s) { return card(gm[s], { note: '해 봤어요' }); }).join('') + '</div>' : empty('played').replace('로그인하기', '게임 찾으러 가기').replace('href="/account/"', 'href="/games/"');
            } else h = arr.length ? '<div class="scards">' + arr.map(function (s) { return card(gm[s], {}); }).join('') + '</div>' : empty('want');
          }
        }
        body.innerHTML = h;
        $$('[data-unsave]', body).forEach(function (b) {
          b.addEventListener('click', function () {
            var s = b.dataset.unsave;
            setSaved(s, false);
            if (cached) api('games/' + s + '/mark', { method: 'POST', body: { kind: 'saved', on: false } });
            notice('저장을 풀었어요.');
            show();
          });
        });
        var cl = $('[data-clear-recent]', body);
        if (cl) cl.addEventListener('click', function () { store.set(K_RECENT, []); show(); });
      });
    }
    $$('[data-tab]', tabs).forEach(function (b) {
      b.addEventListener('click', function () {
        cur = b.dataset.tab;
        var u = new URL(location.href); u.searchParams.set('tab', cur); history.replaceState(null, '', u.pathname + u.search);
        show();
      });
    });
    document.addEventListener('rr:marks', show);
    show();
  }

  // ---------- 내 정보: 성장 카드 (community.js가 부르기) ----------
  function growthHTML(x, nick) {
    var info = x.level, have = {};
    (x.badges || []).forEach(function (b) { have[b.badge] = b.created_at; });
    var days = '';
    var st = x.streak || 0, inWeek = st % 7 || (st ? 7 : 0);
    for (var i = 1; i <= 7; i++) days += '<i class="' + (i <= inWeek ? 'on' : '') + '">' + i + '</i>';
    var h = '<div class="grow-card">' +
      '<div class="grow-top">' + G.emblem(info, 76) + '<div><p class="grow-lv">Lv.' + info.lv + (x.rank ? ' · 전체 ' + x.rank + '위' : '') + '</p><p class="grow-name">' + esc(info.name) + '</p><p class="grow-line">' + esc(info.line) + '</p></div></div>' +
      '<div class="xp"><div class="xp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + info.pct + '" aria-label="다음 등급까지"><b style="width:' + info.pct + '%"></b></div><p class="xp-txt"><span>' + x.xp + '점</span><span>' + (info.next ? '다음 등급 ‘' + esc(info.nextName) + '’까지 ' + info.need + '점' : '가장 높은 등급이에요') + '</span></p></div>' +
      '<div class="grow-stats"><div><b>' + x.xp + '</b><small>점수</small></div><div><b>' + (x.stars || 0) + '</b><small>받은 별</small></div><div><b>' + (x.streak || 0) + '일</b><small>연속 출석</small></div><div><b>' + (x.badges || []).length + '</b><small>배지</small></div></div>' +
      (x.manner ? '<p style="position:relative;z-index:1"><span class="manner">' + ico('i-heart') + '매너 별점 ' + x.manner.avg.toFixed(1) + ' (' + x.manner.n + '명)</span></p>' : '') +
      (nick === undefined ? '<div class="checkin"><button type="button" class="btn" data-checkin' + (x.checked ? ' disabled' : '') + '>' + (x.checked ? ico('i-check') + '오늘 출석 완료' : '출석 체크 +' + G.RULES.checkin[0] + '점') + '</button><div class="checkin-days" aria-label="이번 주 출석">' + days + '</div><small style="color:#c9d1e0">7일 연속이면 +' + G.RULES.streak7[0] + '점</small></div>' : '') +
      '</div>';
    return { card: h, have: have };
  }
  function badgesHTML(have, featured, pickable) {
    return '<div class="badge-grid">' + G.BADGES.map(function (b) {
      var own = !!have[b.key];
      var inner = G.badge(b, 52, !own) + '<b>' + esc(b.name) + '</b><small>' + esc(b.desc) + '</small>';
      if (own && pickable) return '<button type="button" class="badge-cell" aria-pressed="' + (featured === b.key) + '" data-feature="' + b.key + '" title="대표 배지로 고르기">' + inner + '</button>';
      return '<div class="badge-cell' + (own ? '' : ' locked') + '">' + inner + '</div>';
    }).join('') + '</div>';
  }
  function dexHTML(played, gm) {
    var list = gm._list, set = {};
    played.forEach(function (s) { set[s] = 1; });
    var n = list.filter(function (g) { return set[g.s]; }).length;
    return '<div class="dex-head"><p><b>' + n + '</b> / ' + list.length + '개</p><div class="dex-bar" aria-hidden="true"><b style="width:' + Math.round((n / list.length) * 100) + '%"></b></div></div>' +
      '<div class="dex">' + list.map(function (g) { return '<a href="/games/' + g.s + '/" class="' + (set[g.s] ? '' : 'off') + '" title="' + esc(g.n) + (set[g.s] ? ' (해 봤어요)' : '') + '">' + tileHTML(g) + '<span>' + esc(g.n) + '</span></a>'; }).join('') + '</div>';
  }
  window.RRS.renderGrowth = function (el, user) {
    if (!el) return;
    el.innerHTML = '<div class="skel-card"></div>';
    Promise.all([api('growth'), games(), api('notes')]).then(function (r) {
      var x = r[0], gm = r[1], nt = r[2];
      if (!x.ok) { el.innerHTML = '<p class="notice">' + esc(x.message || '성장 기록을 불러오지 못했어요.') + '</p>'; return; }
      var gh = growthHTML(x);
      var played = (x.marks || []).filter(function (m) { return m.kind === 'played'; }).map(function (m) { return m.slug; });
      setMarks(x.marks);
      var notes = nt.ok ? nt.notes : [];
      var unread = notes.filter(function (n) { return !n.read; }).length;
      el.innerHTML = gh.card +
        '<div class="prof-sec" id="notes" style="margin-top:14px"><h2>' + ico('i-bell') + '알림' + (unread ? ' <span class="tag tag-coral">새 알림 ' + unread + '</span>' : '') + '</h2>' + (notes.length ? '<div class="notes">' + notes.slice(0, 8).map(function (n) { return '<a href="' + esc(n.link || '/account/') + '" class="' + (n.read ? '' : 'new') + '"><span>' + esc(n.text) + '</span><small>' + ago(n.created_at) + '</small></a>'; }).join('') + '</div>' : '<p class="muted">아직 알림이 없어요. 내 글에 댓글이 달리거나 배지를 받으면 여기에 알려 드려요.</p>') + '</div>' +
        '<div class="prof-sec" id="badges" style="margin-top:14px"><h2>' + ico('i-trophy') + '내 배지 <span class="muted small">' + (x.badges || []).length + ' / ' + G.BADGES.length + '</span></h2><p class="muted small" style="margin:-6px 0 12px">받은 배지를 누르면 닉네임 옆에 보이는 대표 배지가 돼요.</p>' + badgesHTML(gh.have, x.badge, true) + '</div>' +
        '<div class="prof-sec" id="dex" style="margin-top:14px"><h2>' + ico('i-dice') + '나의 보드게임 도감</h2><p class="muted small" style="margin:-6px 0 12px">게임 페이지에서 ‘해 봤어요’를 누르거나 별점을 남기면 채워져요.</p>' + dexHTML(played, gm) + '</div>' +
        '<div class="prof-sec" style="margin-top:14px"><h2>' + ico('i-spark') + '최근 받은 점수</h2>' + ((x.recent || []).length ? '<ul class="pt-list">' + x.recent.map(function (p) { return '<li><span>' + esc((G.RULES[p.act] || [0, 0, p.act])[2]) + ' <small class="muted">' + ago(p.created_at) + '</small></span><b>' + (p.pts > 0 ? '+' : '') + p.pts + '점</b></li>'; }).join('') + '</ul>' : '<p class="muted">아직 받은 점수가 없어요.</p>') + '<p style="margin-top:10px"><a class="more-link" href="/community/levels/">점수 얻는 방법 보기</a></p></div>';
      var ci = $('[data-checkin]', el);
      if (ci) ci.addEventListener('click', function () {
        ci.disabled = true;
        api('checkin', { method: 'POST' }).then(function (j) {
          if (!j.ok) { ci.disabled = false; RS.toast(j.message || '출석 체크를 하지 못했어요.'); return; }
          if (j.already) { notice('오늘은 이미 출석했어요.'); }
          else gain(j.gain);
          window.RRS.renderGrowth(el, user);
        });
      });
      $$('[data-feature]', el).forEach(function (b) {
        b.addEventListener('click', function () {
          var key = b.getAttribute('aria-pressed') === 'true' ? '' : b.dataset.feature;
          api('auth/profile', { method: 'POST', body: { nick: user.nick, region: user.region || '', bio: user.bio || '', badge: key } }).then(function (j) {
            if (!j.ok) { RS.toast(j.message); return; }
            $$('[data-feature]', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.feature === key)); });
            user.badge = key;
            notice(key ? '‘' + esc(G.BY[key].name) + '’ 배지를 대표 배지로 골랐어요.' : '대표 배지를 뺐어요.');
            me(true);
          });
        });
      });
      if (unread) api('notes', { method: 'POST' }).then(function () { $$('[data-unread]').forEach(function (d) { d.hidden = true; }); });
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(function () { t.scrollIntoView({ block: 'start' }); }, 60); }
    });
  };

  // ---------- 랭킹, 프로필 (커뮤니티 틀 안) ----------
  var cmRoot = $('[data-cm]');
  var cmBody = function () { return $('[data-cm-body]'); };
  if (cmRoot && cmRoot.dataset.cm === 'rank') rankPage();
  if (cmRoot && cmRoot.dataset.cm === 'user') userPage();

  function rankList(list, unit, empty) {
    return list.length ? '<ol class="rank-list">' + list.map(function (x, i) { return '<li><span class="rank-n">' + (i + 1) + '</span>' + who(x) + '<span class="rank-s">' + x.s + unit + '</span></li>'; }).join('') + '</ol>' : '<p class="muted">' + empty + '</p>';
  }
  function rankPage() {
    Promise.all([api('rank'), cached ? me() : Promise.resolve(null)]).then(function (r) {
      var j = r[0], u = r[1], b = cmBody();
      if (!j.ok) { b.innerHTML = '<div class="state"><h2>랭킹을 불러오지 못했어요</h2><p>' + esc(j.message || '') + '</p></div>'; return; }
      var mon = Number(j.month.slice(5));
      var mine = u ? '<div class="resume" style="margin-bottom:16px">' + G.emblem(G.level(u.xp), 56) + '<p class="resume-k">' + esc(u.nick) + '님은 Lv.' + G.level(u.xp).lv + ' ' + esc(G.level(u.xp).name) + '</p><p class="resume-d">지금 ' + u.xp + '점' + (G.level(u.xp).next ? ' · 다음 등급까지 ' + G.level(u.xp).need + '점' : '') + '</p><a class="btn btn-main" href="/account/">내 성장 보기</a></div>' : '<div class="resume" style="margin-bottom:16px">' + G.emblem(G.level(0), 56) + '<p class="resume-k">나도 랭킹에 올라 볼까요?</p><p class="resume-d">회원가입만 해도 ' + G.RULES.welcome[0] + '점, 출석 체크와 후기로 점수가 쌓여요.</p><a class="btn btn-main" href="/account/?mode=signup">회원가입</a></div>';
      b.innerHTML = mine + '<div class="rank-grid">' +
        '<section class="rank-box"><h2>' + ico('i-trophy') + ' ' + mon + '월 활동왕</h2><p class="muted small" style="margin:-6px 0 10px">이번 달에 받은 점수 순서예요. 매달 1일에 새로 시작해요.</p>' + rankList(j.monthly, '점', '아직 이번 달 기록이 없어요. 첫 주인공이 되어 보세요.') + '</section>' +
        '<div class="cm-side-stack">' +
        '<section class="rank-box"><h2>누적 등급 순위</h2>' + rankList(j.all.slice(0, 10), '점', '아직 기록이 없어요.') + '</section>' +
        '<section class="rank-box"><h2>' + ico('i-star') + ' 별을 많이 받은 사람</h2>' + rankList(j.stars, '개', '아직 받은 별이 없어요.') + '</section>' +
        '<section class="rank-box"><h2>후기왕</h2>' + rankList(j.reviewers, '개', '아직 후기가 없어요.') + '</section>' +
        '<section class="rank-box"><h2>규칙 해결사</h2><p class="muted small" style="margin:-6px 0 10px">규칙 질문에서 답변이 채택된 횟수예요.</p>' + rankList(j.solvers, '번', '아직 채택된 답변이 없어요. 규칙 질문 게시판에서 답해 보세요.') + '</section>' +
        '</div></div>';
    });
  }
  function joined(iso) { var t = new Date(new Date(iso).getTime() + 9 * 3600e3); return t.getUTCFullYear() + '년 ' + (t.getUTCMonth() + 1) + '월 가입'; }
  function userPage() {
    var nick = params.get('n') || '';
    var b = cmBody();
    if (!nick) { b.innerHTML = '<div class="state"><h2>회원을 찾지 못했어요</h2><p>주소를 다시 확인해 주세요.</p><a class="btn btn-sub" href="/community/rank/">랭킹 보기</a></div>'; return; }
    Promise.all([api('users/' + encodeURIComponent(nick)), games()]).then(function (r) {
      var j = r[0], gm = r[1];
      if (!j.ok) { b.innerHTML = '<div class="state"><h2>회원을 찾지 못했어요</h2><p>' + esc(j.message || '') + '</p><a class="btn btn-sub" href="/community/rank/">랭킹 보기</a></div>'; return; }
      var u = j.user;
      document.title = u.nick + '님의 프로필 - 룰룰';
      var x = { level: u.level, xp: u.xp, stars: u.stars, streak: 0, badges: j.badges, manner: u.manner, rank: u.rank };
      var gh = growthHTML(x, u.nick);
      var card = gh.card.replace('<div class="grow-stats"><div><b>' + x.xp + '</b><small>점수</small></div><div><b>' + (x.stars || 0) + '</b><small>받은 별</small></div><div><b>0일</b><small>연속 출석</small></div>', '<div class="grow-stats"><div><b>' + x.xp + '</b><small>점수</small></div><div><b>' + (x.stars || 0) + '</b><small>받은 별</small></div><div><b>' + j.played.length + '</b><small>해 본 게임</small></div>');
      var CATS = { free: '자유', qna: '규칙 질문', review: '게임 후기', recommend: '추천해 주세요', poll: '투표', notice: '공지' };
      b.innerHTML = '<div class="prof"><div class="prof-side"><h1 class="cm-title" style="margin:0 0 4px;display:flex;align-items:center;gap:8px">' + esc(u.nick) + (u.fb && G.BY[u.fb] ? G.badge(G.BY[u.fb], 30) : '') + '</h1><p class="muted small">' + (u.region ? esc(u.region) + ' · ' : '') + joined(u.created_at) + (u.sys ? ' · 운영 계정' : '') + '</p>' + (u.bio ? '<p>' + esc(u.bio) + '</p>' : '') + card + '</div>' +
        '<div><div class="prof-sec"><h2>' + ico('i-trophy') + '배지 <span class="muted small">' + j.badges.length + ' / ' + G.BADGES.length + '</span></h2>' + badgesHTML(gh.have, u.fb, false) + '</div>' +
        '<div class="prof-sec" style="margin-top:14px"><h2>보드게임 도감</h2>' + dexHTML(j.played, gm) + '</div>' +
        '<div class="prof-sec" style="margin-top:14px"><h2>' + ico('i-star') + '남긴 후기</h2>' + (j.reviews.length ? '<div class="rv-list">' + j.reviews.map(function (rv) { var g = gm[rv.slug]; return '<div class="rv"><div class="rv-head"><a href="/games/' + rv.slug + '/#reviews" style="font-weight:900;text-decoration:none">' + esc(g ? g.n : rv.slug) + '</a>' + stars(rv.rating, 14) + '<span class="rv-when">' + ago(rv.created_at) + (rv.helpful ? ' · 도움돼요 ' + rv.helpful : '') + '</span></div>' + (rv.body ? '<p class="rv-body small">' + esc(rv.body) + '</p>' : '') + '</div>'; }).join('') + '</div>' : '<p class="muted">아직 남긴 후기가 없어요.</p>') + '</div>' +
        '<div class="prof-sec" style="margin-top:14px"><h2>' + ico('i-chat') + '쓴 글</h2>' + (j.posts.length ? '<ul class="plist">' + j.posts.map(function (p) { return '<li><a class="prow" href="/community/post/?id=' + p.id + '"><span class="badge badge-cat">' + (CATS[p.cat] || '') + '</span><span class="prow-t">' + esc(p.title) + (p.comments ? ' <span class="prow-c">[' + p.comments + ']</span>' : '') + '</span><span class="prow-meta">' + ago(p.created_at) + (p.likes ? ' · 좋아요 ' + p.likes : '') + '</span></a></li>'; }).join('') + '</ul>' : '<p class="muted">아직 쓴 글이 없어요.</p>') + '</div></div></div>';
    });
  }
})();
