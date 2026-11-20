/* 룰룰 운영 관리
   대시보드, 지표(KPI), 원고 관리, 오류 신고, 문의함, 커뮤니티, 쇼핑 링크, 쿠팡 실적 입력, 설정
   주소의 # 뒤(#/kpi/overview 등)로 화면을 바꿔요. */
(function () {
  'use strict';
  var RS = window.RS;
  var root = document.querySelector('[data-admin]');
  if (!RS || !root) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc;
  var repo = root.dataset.repo, branch = root.dataset.branch || 'main';
  var TOK = 'rs-admin-token';
  var token = '';
  try { token = sessionStorage.getItem(TOK) || localStorage.getItem(TOK) || ''; } catch (e) { token = ''; }
  var gamesBySlug = {}, gamesData = null, shopData = null;
  var KIND = { wrong: '규칙이 틀림', unclear: '설명이 헷갈림', typo: '오타, 표현', request: '게임 추가 요청', other: '그 밖의 의견' };

  // ---------- 서버 ----------
  function api(path, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ 'x-admin-token': token }, opt.headers || {});
    return fetch('/api/admin/' + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        j._status = r.status;
        if (r.status === 401 && token) logout('로그인이 끝났어요. 다시 들어가 주세요.');
        return j;
      });
    });
  }
  var post = function (path, body) { return api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }); };

  // ---------- 모양 다듬기 ----------
  var N = function (n) { return n == null ? '–' : Number(n).toLocaleString('ko-KR'); };
  var P = function (n, d) { return n == null || isNaN(n) ? '–' : Number(n).toFixed(d == null ? 1 : d) + '%'; };
  var W = function (n) { return n == null ? '–' : '₩' + Number(n).toLocaleString('ko-KR'); };
  var D = function (sec) {
    sec = Math.round(sec || 0);
    if (!sec) return '–';
    var m = Math.floor(sec / 60), s = sec % 60;
    return m ? m + '분 ' + (s < 10 ? '0' : '') + s + '초' : s + '초';
  };
  var pct = function (a, b) { return b ? a / b * 100 : null; };
  var fmtTime = function (iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  var hm = function (iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); };
  var md = function (day) { var p = String(day).split('-'); return Number(p[1]) + '/' + Number(p[2]); };
  var gameName = function (s) { return gamesBySlug[s] ? gamesBySlug[s].n : s; };
  var itemName = function (id) { return shopData && shopData.items[id] ? shopData.items[id].n : id; };
  var PAGES = { '/': '처음 화면', '/games/': '게임 찾기', '/shop/': '보드게임몰', '/rules/': '보드게임 룰 모음', '/traditional/': '전통놀이', '/community/': '커뮤니티 홈', '/saved/': '저장한 게임', '/account/': '내 정보', '/about/': '룰룰 소개', '/privacy/': '개인정보처리방침', '/terms/': '이용약관', '/contact/': '제휴·문의', '/space/': '공간 운영자', '/learn/': '배우기' };
  var pageName = function (p) {
    var m = String(p || '').match(/^\/games\/([a-z0-9-]+)\/$/);
    if (m) return gameName(m[1]);
    if (PAGES[p]) return PAGES[p];
    m = String(p || '').match(/^\/community\/([a-z-]+)\//);
    if (m) return '커뮤니티 · ' + ({ board: '게시판', post: '글', clubs: '모임', club: '모임', events: '정모·번개', event: '일정', rank: '랭킹', user: '프로필', levels: '등급 안내', rules: '이용 규칙', write: '글쓰기' }[m[1]] || m[1]);
    m = String(p || '').match(/^\/collections\/([a-z0-9-]+)\/$/);
    if (m) return '묶음 · ' + m[1];
    return p;
  };
  var pageCell = function (p) { return '<a href="' + esc(p) + '" target="_blank" rel="noopener">' + esc(pageName(p)) + '</a><br><small class="muted">' + esc(p) + '</small>'; };
  var CH = { naver: '네이버 검색', 'naver-community': '네이버 블로그·카페', google: '구글', daum: '다음·카카오 검색', 'search-other': '그 밖의 검색', youtube: '유튜브', social: 'SNS', kakaotalk: '카카오톡', qr: 'QR 코드', campaign: '캠페인 링크(utm)', referral: '다른 사이트', direct: '직접 들어옴', internal: '다시 들어옴(30분 넘게 쉼)', '': '알 수 없음' };
  var SRC = { shop: '보드게임몰', game: '게임 페이지 구매 상자', home: '처음 화면 보드게임몰 띠', 'shop-more': '보드게임몰 ‘더 보기’', unknown: '알 수 없음' };
  var DEV = { m: '휴대폰', t: '태블릿', d: 'PC' };
  var FEAT = { table: '테이블 모드', speak: '소리 내 읽기', share: '링크 보내기', qr: 'QR로 게임 열기', venue: '매장 안내 페이지', 'test-start': '취향 테스트 시작', 'test-done': '취향 테스트 끝까지', 'cup-start': '월드컵 시작', 'cup-done': '월드컵 끝까지', 'quiz-done': '상식 퀴즈 끝까지', 'squiz-done': '이야기 퀴즈 끝까지', 'fun-share': '재미 결과 공유', 'plan-make': '모임 게임 짜기', 'plan-share': '모임 순서 보내기', 'roulette-spin': '돌림판 돌리기' };

  // 앞뒤 기간 비교
  function delta(cur, prev, invert) {
    if (cur == null || prev == null) return '';
    if (!prev && !cur) return '<span class="delta flat">변화 없음</span>';
    if (!prev) return '<span class="delta up">새로 생김</span>';
    var d = (cur - prev) / prev * 100;
    if (Math.abs(d) < 0.05) return '<span class="delta flat">변화 없음</span>';
    var good = invert ? d < 0 : d > 0;
    return '<span class="delta ' + (good ? 'up' : 'down') + '">' + (d > 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0) + '%</span>';
  }
  function kpiCard(label, value, sub, dl) {
    return '<div class="kpi"><span class="kpi-label">' + label + '</span><b class="kpi-val">' + value + '</b><span class="kpi-sub">' + (dl || '') + (sub ? '<small>' + sub + '</small>' : '') + '</span></div>';
  }
  function card(title, inner, extra) {
    return '<section class="adm-card"><div class="adm-card-head"><h2>' + title + '</h2>' + (extra || '') + '</div>' + inner + '</section>';
  }
  function empty(msg) { return '<p class="adm-empty">' + (msg || '아직 기록이 없어요.') + '</p>'; }
  function tableHTML(head, rows, opt) {
    opt = opt || {};
    if (!rows.length) return empty(opt.empty);
    return '<div class="tbl-wrap"><table class="tbl' + (opt.cls ? ' ' + opt.cls : '') + '"' + (opt.sort ? ' data-sortable' : '') + '><thead><tr>' + head.map(function (h, i) { return '<th' + (i ? ' class="num"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c, i) { var v = c && typeof c === 'object' ? c : { h: c }; return '<td' + (i ? ' class="num"' : '') + (v.s != null ? ' data-s="' + esc(v.s) + '"' : '') + '>' + (v.h == null ? '' : v.h) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  // 표 머리를 누르면 정렬
  root.addEventListener('click', function (e) {
    var th = e.target.closest('table[data-sortable] th');
    if (!th) return;
    var tbl = th.closest('table'), idx = Array.prototype.indexOf.call(th.parentNode.children, th);
    var asc = th.dataset.dir === 'desc';
    $$('th', tbl).forEach(function (x) { delete x.dataset.dir; });
    th.dataset.dir = asc ? 'asc' : 'desc';
    var rows = $$('tbody tr', tbl);
    var val = function (tr) { var td = tr.children[idx]; var s = td.dataset.s != null ? td.dataset.s : td.textContent; var n = Number(String(s).replace(/[^0-9.-]/g, '')); return s !== '' && !isNaN(n) && /\d/.test(s) ? n : s; };
    rows.sort(function (a, b) { var x = val(a), y = val(b); var c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ko'); return asc ? c : -c; });
    rows.forEach(function (r) { r.parentNode.appendChild(r); });
  });

  // 가로 막대
  function bars(rows, fmt, opt) {
    opt = opt || {};
    if (!rows.length) return empty(opt.empty);
    var max = Math.max.apply(null, rows.map(function (r) { return r.v || 0; }).concat([1]));
    var total = rows.reduce(function (n, r) { return n + (r.v || 0); }, 0);
    return '<ul class="hbars">' + rows.map(function (r) {
      return '<li><span class="hb-label">' + r.label + '</span><span class="hb-track"><span class="hb-fill" style="width:' + Math.max(1.5, (r.v || 0) / max * 100).toFixed(1) + '%"></span></span><span class="hb-val">' + (fmt || N)(r.v) + (opt.share && total ? ' <small>' + P(r.v / total * 100, 0) + '</small>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  // 날짜별 꺾은선 (SVG)
  function lineChart(labels, series, fmt) {
    var narrow = window.innerWidth < 640;
    var W0 = narrow ? 420 : 720, H0 = narrow ? 240 : 230, L = 40, R = 10, T = 14, B = 28;
    var all = [];
    series.forEach(function (s) { s.values.forEach(function (v) { if (v != null) all.push(v); }); });
    var max = Math.max.apply(null, all.concat([1]));
    // 눈금 4칸이 정수로 떨어지게
    var unit = Math.max(1, Math.pow(10, Math.floor(Math.log10(max / 4))));
    var nice = Math.max(4, Math.ceil(max / (4 * unit)) * 4 * unit);
    var n = labels.length, iw = W0 - L - R, ih = H0 - T - B;
    var x = function (i) { return L + (n === 1 ? iw / 2 : i / (n - 1) * iw); };
    var y = function (v) { return T + ih - v / nice * ih; };
    var g = '';
    for (var k = 0; k <= 4; k++) {
      var gv = nice / 4 * k, gy = y(gv);
      g += '<line x1="' + L + '" x2="' + (W0 - R) + '" y1="' + gy + '" y2="' + gy + '" class="grid"/><text x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end" class="ax">' + (fmt || N)(Math.round(gv * 10) / 10) + '</text>';
    }
    var every = Math.max(1, Math.ceil(n / (narrow ? 5 : 8)));
    labels.forEach(function (lb, i) { if (i % every === 0 || (i === n - 1 && (n - 1) % every >= every / 2)) g += '<text x="' + x(i) + '" y="' + (H0 - 8) + '" text-anchor="middle" class="ax">' + esc(lb) + '</text>'; });
    series.forEach(function (s, si) {
      var pts = [];
      s.values.forEach(function (v, i) { if (v != null) pts.push([x(i), y(v), v, i]); });
      if (pts.length > 1) g += '<path class="ln ln' + si + '" d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + '"/>';
      pts.forEach(function (p) { g += '<circle class="pt pt' + si + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (n > 40 ? 2 : 3.5) + '"><title>' + esc(labels[p[3]] + ' ' + s.name + ' ' + (fmt || N)(p[2])) + '</title></circle>'; });
    });
    var legend = '<p class="legend">' + series.map(function (s, i) { return '<span class="lg lg' + i + '">' + esc(s.name) + '</span>'; }).join('') + '</p>';
    var summary = series.map(function (s) { var t = s.values.reduce(function (a, b) { return a + (b || 0); }, 0); return s.name + ' 합계 ' + N(t); }).join(', ');
    return legend + '<svg class="chart" viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + esc(summary) + '">' + g + '</svg>';
  }
  function hourChart(hours) {
    var arr = []; for (var i = 0; i < 24; i++) arr.push(0);
    hours.forEach(function (h) { arr[h.hr] = h.pv; });
    var max = Math.max.apply(null, arr.concat([1]));
    return '<div class="hours" role="img" aria-label="시간대별 페이지뷰">' + arr.map(function (v, h) { return '<span title="' + h + '시 ' + N(v) + '"><i style="height:' + Math.max(2, v / max * 100) + '%"></i>' + (h % 6 === 0 ? '<em>' + h + '시</em>' : '') + '</span>'; }).join('') + '</div>';
  }
  function funnel(steps) {
    var first = steps[0].v || 0;
    return '<ol class="funnel">' + steps.map(function (s, i) {
      var prev = i ? steps[i - 1].v : null;
      var w = first ? Math.max(2, (s.v || 0) / first * 100) : 2;
      return '<li><div class="fn-head"><b>' + s.label + '</b><span>' + (s.v == null ? '입력 전' : N(s.v)) + (i && s.v != null && prev ? ' <small>앞 단계의 ' + P(s.v / prev * 100) + '</small>' : '') + '</span></div><span class="fn-bar"><i style="width:' + (s.v == null ? 0 : w.toFixed(1)) + '%"></i></span>' + (s.note ? '<small class="muted">' + s.note + '</small>' : '') + '</li>';
    }).join('') + '</ol>';
  }

  // ---------- 들어가기 ----------
  var login = $('[data-login]', root), app = $('[data-body]', root), lform = $('[data-login-form]', root), lmsg = $('.form-msg', lform);
  var health = {};
  fetch('/api/health').then(function (r) { return r.json(); }).then(function (h) {
    health = h;
    var miss = [];
    if (!h.db) miss.push('D1 데이터베이스를 <b>DB</b>라는 이름으로 연결하기');
    if (!h.admin) miss.push('비밀 값 <b>ADMIN_PASSWORD</b> 넣기 (Cloudflare → Workers & Pages → rulerule → 설정 → 변수 및 비밀)');
    if (miss.length) login.insertAdjacentHTML('beforeend', '<div class="notice"><b>Cloudflare 설정이 아직 끝나지 않았어요.</b> 아래를 마친 뒤 다시 배포해 주세요. 자세한 순서는 README에 있어요.<ol>' + miss.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ol></div>');
  }).catch(function () {
    login.insertAdjacentHTML('beforeend', '<div class="notice">서버 기능(/api)에 연결하지 못했어요. 이 화면은 Cloudflare에 배포한 주소에서 열어 주세요.</div>');
  });
  function saveToken(t, remember) {
    try {
      sessionStorage.removeItem(TOK); localStorage.removeItem(TOK);
      if (t) (remember ? localStorage : sessionStorage).setItem(TOK, t);
    } catch (e) { /* 무시 */ }
  }
  function logout(msg) {
    token = ''; saveToken('');
    app.hidden = true; login.hidden = false;
    if (msg) { lmsg.className = 'form-msg err'; lmsg.textContent = msg; }
  }
  lform.addEventListener('submit', function (e) {
    e.preventDefault();
    lmsg.className = 'form-msg'; lmsg.textContent = '확인하는 중이에요';
    var remember = lform.elements.remember.checked;
    fetch('/api/admin-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pw: lform.elements.pw.value, remember: remember }) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (!j.ok) { lmsg.className = 'form-msg err'; lmsg.textContent = j.message || '들어가지 못했어요.'; return; }
        token = j.token; saveToken(token, remember);
        lform.elements.pw.value = '';
        // 운영자 기기의 방문은 지표에서 빼요 (설정에서 바꿀 수 있어요)
        try { if (localStorage.getItem('rs-notrack-set') !== '1') { localStorage.setItem('rs-notrack', '1'); localStorage.setItem('rs-notrack-set', '1'); } } catch (e2) { /* 무시 */ }
        start();
      }).catch(function () { lmsg.className = 'form-msg err'; lmsg.textContent = '서버에 연결하지 못했어요.'; });
  });
  $('[data-logout]', root).addEventListener('click', function () { logout('로그아웃했어요.'); });

  var started = false;
  function start() {
    login.hidden = true; app.hidden = false;
    if (started) { route(); return; }
    started = true;
    Promise.all([
      RS.loadGames().then(function (d) { gamesData = d; d.games.forEach(function (g) { gamesBySlug[g.s] = g; }); }).catch(function () { gamesData = { games: [] }; }),
      fetch('/data/shop.json').then(function (r) { return r.json(); }).then(function (d) { shopData = d; }).catch(function () { shopData = { items: {} }; }),
    ]).then(function () { route(); refreshCounts(); });
  }
  if (token) {
    api('system').then(function (j) { if (j._status === 200) start(); else logout(j._status === 401 ? '' : (j.message || '')); });
  }

  // ---------- 화면 바꾸기 ----------
  var ROUTES = {
    home: ['대시보드', '', renderHome],
    'kpi/overview': ['한눈에 보기', '지표', kpiOverview, true],
    'kpi/content': ['페이지·게임', '지표', kpiContent, true],
    'kpi/traffic': ['유입 경로', '지표', kpiTraffic, true],
    'kpi/shop': ['구매·전환', '지표', kpiShop, true],
    'kpi/engage': ['검색·참여', '지표', kpiEngage, true],
    'kpi/live': ['실시간', '지표', kpiLive],
    content: ['원고 관리', '운영', loadContent],
    reports: ['오류 신고', '운영', loadReports],
    inquiries: ['문의함', '운영', loadInq],
    community: ['커뮤니티', '운영', loadCm],
    shop: ['쇼핑 링크', '보드게임몰', loadShop],
    coupang: ['쿠팡 실적 입력', '보드게임몰', loadCp],
    settings: ['설정·도움말', '설정', loadSettings],
  };
  var shown = {}, current = '', liveTimer = null;
  function panelOf(r) { return $('#a-' + r.replace('/', '-')); }
  function route() {
    var r = (location.hash.match(/^#\/(.+)$/) || [])[1] || 'home';
    if (!ROUTES[r]) r = 'home';
    current = r;
    var def = ROUTES[r];
    $$('.adm-panel', root).forEach(function (p) { p.hidden = true; });
    $$('[data-route]', root).forEach(function (a) { if (a.dataset.route === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('[data-title]', root).textContent = def[0];
    $('[data-crumb]', root).textContent = def[1] || '';
    var per = $('[data-period]', root);
    per.hidden = !def[3];
    if (def[3]) paintPeriod();
    var p = panelOf(r);
    p.hidden = false;
    clearInterval(liveTimer);
    var key = r + (def[3] ? '|' + periodKey() : '');
    if (!def[3] || shown[r] !== key) { shown[r] = key; p.innerHTML = '<p class="adm-empty">불러오는 중이에요</p>'; def[2](p); }
    document.title = def[0] + ' - 운영 관리';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { if (started && !app.hidden) route(); });
  function refreshCounts() {
    api('kpi/dash').then(function (j) {
      if (!j.ok) return;
      ['reports', 'inquiries', 'flags'].forEach(function (k) {
        var el = $('[data-count="' + k + '"]', root);
        if (el) { el.textContent = j.todo[k]; el.hidden = !j.todo[k]; }
      });
    });
  }

  // ---------- 기간 ----------
  var kstToday = function () { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); };
  var addDay = function (day, n) { return new Date(Date.parse(day + 'T00:00:00Z') + n * 86400e3).toISOString().slice(0, 10); };
  var period = { p: '7', from: '', to: '' };
  try { period = JSON.parse(sessionStorage.getItem('rs-admin-period')) || period; } catch (e) { /* 무시 */ }
  function rangeOf() {
    var t = kstToday();
    if (period.p === 'today') return [t, t];
    if (period.p === 'yday') return [addDay(t, -1), addDay(t, -1)];
    if (period.p === 'custom' && period.from && period.to) return [period.from, period.to];
    var n = Number(period.p) || 7;
    return [addDay(t, -(n - 1)), t];
  }
  var periodKey = function () { return rangeOf().join('~'); };
  var qs = function () { var r = rangeOf(); return 'from=' + r[0] + '&to=' + r[1]; };
  function paintPeriod() {
    var el = $('[data-period]', root), r = rangeOf();
    var opts = [['today', '오늘'], ['yday', '어제'], ['7', '7일'], ['30', '30일'], ['90', '90일'], ['custom', '직접']];
    el.innerHTML = '<div class="seg" role="radiogroup" aria-label="기간">' + opts.map(function (o) { return '<button type="button" role="radio" aria-checked="' + (period.p === o[0]) + '" data-p="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<form class="per-custom" data-custom' + (period.p === 'custom' ? '' : ' hidden') + '><input type="date" name="from" value="' + r[0] + '" max="' + kstToday() + '" aria-label="시작일"><span>~</span><input type="date" name="to" value="' + r[1] + '" max="' + kstToday() + '" aria-label="종료일"><button class="btn btn-sub btn-sm" type="submit">보기</button></form>' +
      '<p class="per-text">' + md(r[0]) + (r[0] !== r[1] ? ' ~ ' + md(r[1]) : '') + ' · 비교: 바로 앞 같은 기간</p>';
  }
  $('[data-period]', root).addEventListener('click', function (e) {
    var b = e.target.closest('[data-p]'); if (!b) return;
    period.p = b.dataset.p;
    if (period.p === 'custom') { var r = rangeOf(); period.from = period.from || r[0]; period.to = period.to || r[1]; }
    try { sessionStorage.setItem('rs-admin-period', JSON.stringify(period)); } catch (e2) { /* 무시 */ }
    route();
  });
  $('[data-period]', root).addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (!f.elements.from.value || !f.elements.to.value) return;
    period = { p: 'custom', from: f.elements.from.value, to: f.elements.to.value };
    try { sessionStorage.setItem('rs-admin-period', JSON.stringify(period)); } catch (e2) { /* 무시 */ }
    route();
  });
  function csvLink(kind, label) {
    return '<button type="button" class="btn btn-ghost btn-sm" data-csv="' + kind + '">' + (label || 'CSV 내려받기') + '</button>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-csv]'); if (!b) return;
    fetch('/api/admin/kpi/csv?kind=' + b.dataset.csv + '&' + qs(), { headers: { 'x-admin-token': token } }).then(function (r) {
      if (!r.ok) { RS.toast('내려받지 못했어요'); return; }
      return r.blob().then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'rulerule-' + b.dataset.csv + '-' + periodKey().replace('~', '_') + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      });
    });
  });
  function failBox(p, j) { p.innerHTML = '<p class="notice">' + esc((j && j.message) || '불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.') + '</p>'; }

  // ---------- 지표 설명 ----------
  var GLOSSARY = [
    ['방문자', '기간 안에 들어온 브라우저 수예요. 브라우저마다 저장한 무작위 번호로 세요. 같은 사람이라도 휴대폰과 PC는 따로 세져요.'],
    ['방문', '30분 넘게 아무 페이지도 열지 않으면 다음에 들어올 때 새 방문으로 세요. (구글 애널리틱스의 세션과 같은 뜻)'],
    ['페이지뷰', '페이지를 연 횟수예요.'],
    ['평균 체류 시간', '페이지를 화면에 띄워 두고 실제로 보고 있던 시간의 평균이에요. 다른 탭으로 옮긴 시간은 빼요. 한 페이지는 30분까지만 세요.'],
    ['이탈률', '한 페이지만 보고 구매 버튼도 누르지 않은 방문의 비율이에요. 낮을수록 좋아요.'],
    ['신규 방문자', '그날 처음 생긴 방문자 번호예요. 브라우저 데이터를 지운 사람도 새로 세져요.'],
    ['구매 버튼 클릭', '쿠팡으로 가는 구매 버튼(/go/)을 누른 횟수예요. 검색 로봇은 빼요.'],
    ['구매 클릭률', '구매 버튼을 한 번 이상 누른 방문 ÷ 전체 방문이에요.'],
    ['쿠팡 주문·구매액·수익', '쿠팡 파트너스 리포트의 숫자를 ‘쿠팡 실적 입력’에 옮겨 적은 값이에요. 링크를 누르고 24시간 안의 모든 구매가 들어가요(다른 상품 포함). 리포트에는 다음 날 오후 4시쯤 반영돼요.'],
    ['구매 전환율', '쿠팡 주문 수 ÷ 우리 사이트 구매 버튼 클릭 수예요. 실적을 입력한 날만 계산해요.'],
    ['끝까지 읽음', '게임 페이지를 90% 넘게 스크롤한 비율이에요.'],
  ];
  var glossaryHTML = '<dl class="gloss">' + GLOSSARY.map(function (g) { return '<dt>' + g[0] + '</dt><dd>' + g[1] + '</dd>'; }).join('') + '</dl>';

  // ---------- 대시보드 ----------
  function renderHome(p) {
    Promise.all([api('kpi/dash'), api('system')]).then(function (r) {
      var j = r[0], s = r[1];
      if (!j.ok) { failBox(p, j); return; }
      var t = j.t, y = j.y;
      var todo = [
        ['#/reports', '새 오류 신고', j.todo.reports, '설명이 틀렸다는 의견이에요. 원고를 고친 뒤 처리 완료로 옮겨 주세요.'],
        ['#/inquiries', '새 문의', j.todo.inquiries, '제휴·문의 양식으로 들어온 글이에요.'],
        ['#/community', '커뮤니티 신고', j.todo.flags, '회원이 신고한 글·댓글·후기예요.'],
      ];
      var draft = (gamesData.games || []).filter(function (g) { return g.st === 'draft'; }).length;
      var cpGap = j.cpLast ? Math.round((Date.parse(j.today) - Date.parse(j.cpLast)) / 86400e3) : null;
      var todoHTML = '<ul class="todo">' + todo.map(function (x) {
        return '<li class="' + (x[2] ? 'on' : '') + '"><a href="' + x[0] + '"><b>' + x[1] + '</b><span class="todo-n">' + x[2] + '</span></a><small>' + x[3] + '</small></li>';
      }).join('') +
        '<li class="' + (cpGap == null || cpGap > 2 ? 'on' : '') + '"><a href="#/coupang"><b>쿠팡 실적 입력</b><span class="todo-n">' + (j.cpLast ? md(j.cpLast) : '처음') + '</span></a><small>' + (j.cpLast ? '마지막으로 넣은 날짜예요. 파트너스 리포트의 어제 숫자를 옮겨 적으면 전환율이 보여요.' : '아직 넣은 실적이 없어요. 파트너스 리포트의 일별 숫자를 옮겨 적어 주세요.') + '</small></li>' +
        '<li class="' + (draft ? 'on' : '') + '"><a href="#/content"><b>검수 중 원고</b><span class="todo-n">' + draft + '</span></a><small>자료와 견줘 보면 ‘자료 대조 완료’로 올릴 수 있어요.</small></li></ul>';
      var setup = [
        ['D1 데이터베이스(DB)', true, '연결됨'],
        ['관리자 비밀번호', true, '설정됨'],
        ['쿠팡 파트너스 API 키', s.coupangApi, s.coupangApi ? '설정됨' : '최종 승인 뒤 넣으면 링크 자동 만들기를 쓸 수 있어요'],
        ['새 문의 알림(INQUIRY_WEBHOOK_URL)', s.webhook, s.webhook ? '설정됨' : '선택 사항'],
        ['방문 통계', !!s.firstDay, s.firstDay ? md(s.firstDay) + '부터 모으는 중' : '첫 방문을 기다리는 중'],
      ];
      p.innerHTML =
        '<div class="kpi-grid kpi-4">' +
        kpiCard('오늘 방문자', N(t.uv), '어제 ' + N(y.uv), '') +
        kpiCard('오늘 페이지뷰', N(t.pv), '어제 ' + N(y.pv), '') +
        kpiCard('오늘 구매 버튼 클릭', N(t.clicks), '어제 ' + N(y.clicks), '') +
        kpiCard('지금 보고 있는 사람', N(j.live), '최근 5분', '<a class="small" href="#/kpi/live">실시간 보기</a>') +
        '</div>' +
        '<div class="adm-cols">' +
        card('최근 14일', lineChart(j.days.map(function (d) { return md(d.day); }), [{ name: '방문자', values: j.days.map(function (d) { return d.uv; }) }, { name: '구매 버튼 클릭', values: j.days.map(function (d) { return d.clicks; }) }]), '<a class="small" href="#/kpi/overview">지표 자세히</a>') +
        card('할 일', todoHTML) +
        '</div><div class="adm-cols">' +
        card('이번 주 많이 본 게임', bars(j.games.map(function (g) { return { label: '<a href="/games/' + g.slug + '/" target="_blank">' + esc(gameName(g.slug)) + '</a>', v: g.pv }; }), N, { empty: '아직 게임 페이지 기록이 없어요.' })) +
        card('설정 상태', '<ul class="setup">' + setup.map(function (x) { return '<li class="' + (x[1] ? 'ok' : 'no') + '"><b>' + x[0] + '</b><span>' + x[2] + '</span></li>'; }).join('') + '</ul><p class="small muted">자세한 내용은 <a href="#/settings">설정·도움말</a>에 있어요.</p>') +
        '</div>' +
        card('바로가기', '<div class="quick">' + [
          ['/', '룰룰 사이트'], ['https://partners.coupang.com/#affiliate/ws/report/trend/daily', '쿠팡 파트너스 리포트'], ['https://dash.cloudflare.com/', 'Cloudflare'],
          ['https://github.com/' + repo, 'GitHub 저장소'], ['https://searchadvisor.naver.com/', '네이버 서치어드바이저'], ['https://search.google.com/search-console', '구글 서치 콘솔'],
        ].map(function (q) { return '<a class="btn btn-ghost btn-sm" href="' + q[0] + '" target="_blank" rel="noopener">' + q[1] + '</a>'; }).join('') + '</div>');
      refreshCounts();
    });
  }

  // ---------- 지표: 한눈에 보기 ----------
  var trendMetric = 'uv';
  function kpiOverview(p) {
    api('kpi/summary?' + qs()).then(function (j) {
      if (!j.ok) { failBox(p, j); return; }
      var c = j.cur, v = j.prev;
      var cvr = c.cpDays ? pct(c.orders, c.clicks) : null, pcvr = v.cpDays ? pct(v.orders, v.clicks) : null;
      var visit = '<div class="kpi-grid">' +
        kpiCard('방문자', N(c.uv), '신규 ' + N(c.newUv) + (c.uv ? ' (' + P(c.newUv / c.uv * 100, 0) + ')' : ''), delta(c.uv, v.uv)) +
        kpiCard('방문', N(c.ses), '', delta(c.ses, v.ses)) +
        kpiCard('페이지뷰', N(c.pv), '방문당 ' + c.pps + '쪽', delta(c.pv, v.pv)) +
        kpiCard('평균 체류 시간', D(c.dur), '방문당 ' + D(c.sesDur), delta(c.dur, v.dur)) +
        kpiCard('이탈률', P(c.bounce), '한 페이지만 보고 나감', delta(c.bounce, v.bounce, true)) +
        kpiCard('게임 설명 조회', N(c.gamePv), '게임 페이지 페이지뷰', delta(c.gamePv, v.gamePv)) +
        '</div>';
      var buy = '<div class="kpi-grid">' +
        kpiCard('구매 버튼 클릭', N(c.clicks), '누른 방문자 ' + N(c.clickUv), delta(c.clicks, v.clicks)) +
        kpiCard('구매 클릭률', P(c.ctr, 2), '구매 버튼을 누른 방문 비율', delta(c.ctr, v.ctr)) +
        kpiCard('쿠팡 주문', c.cpDays ? N(c.orders) : '입력 전', c.cpDays ? c.cpDays + '일 입력됨' : '<a href="#/coupang">실적 입력하기</a>', c.cpDays ? delta(c.orders, v.orders) : '') +
        kpiCard('구매 전환율', cvr == null ? '–' : P(cvr, 2), '주문 ÷ 구매 버튼 클릭', cvr == null ? '' : delta(cvr, pcvr)) +
        kpiCard('구매액', c.cpDays ? W(c.gmv) : '–', '쿠팡 리포트 합산 금액', c.cpDays ? delta(c.gmv, v.gmv) : '') +
        kpiCard('수익', c.cpDays ? W(c.commission) : '–', '파트너스 수수료(지급 전)', c.cpDays ? delta(c.commission, v.commission) : '') +
        '</div>';
      var eng = '<div class="kpi-grid">' +
        kpiCard('새 회원', N(c.signups), '', delta(c.signups, v.signups)) +
        kpiCard('후기', N(c.reviews), '', delta(c.reviews, v.reviews)) +
        kpiCard('게시글', N(c.posts), '공지 빼고', delta(c.posts, v.posts)) +
        kpiCard('댓글', N(c.comments), '', delta(c.comments, v.comments)) +
        '</div>';
      var M = { uv: ['방문자', 'uv'], ses: ['방문', 'ses'], pv: ['페이지뷰', 'pv'], clicks: ['구매 버튼 클릭', 'clicks'], orders: ['쿠팡 주문', 'orders'] };
      var trend = function () {
        var m = M[trendMetric];
        return lineChart(j.days.map(function (d) { return md(d.day); }), [{ name: m[0], values: j.days.map(function (d) { return d[m[1]]; }) }]);
      };
      p.innerHTML =
        '<h2 class="adm-h">방문</h2>' + visit +
        '<h2 class="adm-h">구매 연결 (쿠팡 파트너스)</h2>' + buy +
        '<h2 class="adm-h">참여</h2>' + eng +
        '<div class="adm-cols">' +
        card('날짜별 흐름', '<div class="seg seg-sm" role="radiogroup" aria-label="지표 고르기" data-trend>' + Object.keys(M).map(function (k) { return '<button type="button" role="radio" aria-checked="' + (k === trendMetric) + '" data-m="' + k + '">' + M[k][0] + '</button>'; }).join('') + '</div><div data-chart>' + trend() + '</div>', csvLink('daily', '일별 CSV')) +
        card('구매로 이어지는 흐름', funnel([
          { label: '방문', v: c.ses },
          { label: '게임 설명을 본 방문', v: c.gameSes },
          { label: '구매 버튼을 누른 방문', v: c.clickSes },
          { label: '쿠팡 주문', v: c.cpDays ? c.orders : null, note: c.cpDays ? '쿠팡 리포트 기준(24시간 안의 모든 구매)' : '쿠팡 실적을 입력하면 보여요' },
        ])) +
        '</div><div class="adm-cols adm-cols-3">' +
        card('많이 본 게임', bars(j.games.map(function (g) { return { label: esc(gameName(g.slug)), v: g.pv }; })), '<a class="small" href="#/kpi/content">전체</a>') +
        card('많이 본 페이지', bars(j.pages.map(function (g) { return { label: esc(pageName(g.path)), v: g.pv }; })), '<a class="small" href="#/kpi/content">전체</a>') +
        card('들어온 경로', bars(j.channels.map(function (g) { return { label: esc(CH[g.ch] || g.ch), v: g.ses }; }), N, { share: true }), '<a class="small" href="#/kpi/traffic">전체</a>') +
        '</div>' +
        '<details class="adm-card adm-details"><summary>지표 설명</summary>' + glossaryHTML + '</details>';
      $('[data-trend]', p).addEventListener('click', function (e) {
        var b = e.target.closest('[data-m]'); if (!b) return;
        trendMetric = b.dataset.m;
        $$('[data-m]', p).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        $('[data-chart]', p).innerHTML = trend();
      });
    }).catch(function () { failBox(p); });
  }

  // ---------- 지표: 페이지·게임 ----------
  function kpiContent(p) {
    api('kpi/content?' + qs()).then(function (j) {
      if (!j.ok) { failBox(p, j); return; }
      var clk = {}, ev = {}, rv = {};
      j.gameClicks.forEach(function (x) { clk[x.slug] = x; });
      j.gameEvents.forEach(function (x) { (ev[x.slug] = ev[x.slug] || {})[x.t] = x.n; });
      j.reviews.forEach(function (x) { rv[x.slug] = x; });
      var seen = {};
      var rows = j.games.map(function (g) {
        seen[g.slug] = 1;
        var c = clk[g.slug] || {}, e = ev[g.slug] || {}, r = rv[g.slug] || {};
        return ['<a href="/games/' + g.slug + '/" target="_blank">' + esc(gameName(g.slug)) + '</a>', N(g.pv), N(g.uv), { h: D(g.dur), s: Math.round(g.dur || 0) }, P(g.done, 0), N(e.table || 0), N(c.clicks || 0), { h: P(pct(c.ses || 0, g.ses), 1), s: pct(c.ses || 0, g.ses) || 0 }, N(r.n || 0), r.rating ? r.rating.toFixed(1) : '–'];
      });
      var unseen = (gamesData.games || []).filter(function (g) { return !seen[g.s]; });
      p.innerHTML =
        card('게임별 성과', tableHTML(['게임', '조회', '방문자', '평균 체류', '끝까지 읽음', '테이블 모드', '구매 클릭', '구매 클릭률', '후기(누적)', '별점'], rows, { sort: true, empty: '이 기간에 게임 페이지 기록이 없어요.' }) +
          (unseen.length ? '<p class="small muted">이 기간에 한 번도 열리지 않은 게임 ' + unseen.length + '개: ' + unseen.slice(0, 30).map(function (g) { return esc(g.n); }).join(', ') + (unseen.length > 30 ? ' 외' : '') + '</p>' : '') +
          '<p class="small muted">표 머리를 누르면 정렬돼요. 구매 클릭률은 그 게임 페이지를 본 방문 가운데 그 페이지에서 구매 버튼을 누른 방문의 비율이에요.</p>') +
        card('페이지별', tableHTML(['페이지', '페이지뷰', '방문자', '평균 체류', '평균 스크롤', '들어온 수'], j.pages.map(function (x) {
          return [pageCell(x.path), N(x.pv), N(x.uv), { h: D(x.dur), s: Math.round(x.dur || 0) }, P(x.dep, 0), N(x.entries)];
        }), { sort: true }), csvLink('pages')) +
        card('처음 들어온 페이지', tableHTML(['페이지', '들어온 수', '바로 나간 비율'], j.landing.map(function (x) {
          return [pageCell(x.path), N(x.entries), { h: P(pct(x.single, x.entries), 0), s: pct(x.single, x.entries) || 0 }];
        }), { sort: true }) + '<p class="small muted">바로 나간 비율이 높은 첫 페이지는 제목·첫 화면을 손볼 후보예요.</p>');
    }).catch(function () { failBox(p); });
  }

  // ---------- 지표: 유입 경로 ----------
  function kpiTraffic(p) {
    api('kpi/traffic?' + qs()).then(function (j) {
      if (!j.ok) { failBox(p, j); return; }
      var totalSes = j.devices.reduce(function (n, d) { return n + d.ses; }, 0);
      var vis = j.visitors || {};
      p.innerHTML =
        card('들어온 경로', tableHTML(['경로', '방문', '방문자', '바로 나간 비율', '구매 버튼 누른 방문', '구매 클릭률'], j.channels.map(function (x) {
          return [esc(CH[x.ch] || x.ch), N(x.ses), N(x.uv), { h: P(pct(x.single, x.ses), 0), s: pct(x.single, x.ses) || 0 }, N(x.buyers), { h: P(pct(x.buyers, x.ses), 1), s: pct(x.buyers, x.ses) || 0 }];
        }), { sort: true }) + '<p class="small muted">방문이 시작된 첫 페이지 기준이에요. 카카오톡·인스타그램 앱 안 브라우저는 이전 주소를 알려 주지 않아 앱 이름으로 나눠요.</p>') +
        '<div class="adm-cols">' +
        card('기기', bars(j.devices.map(function (d) { return { label: DEV[d.dev] || d.dev, v: d.ses }; }), N, { share: true }) + '<p class="small muted">방문 ' + N(totalSes) + '번 기준</p>') +
        card('새로 온 방문자와 다시 온 방문자', bars([{ label: '처음 온 방문자', v: vis.nv || 0 }, { label: '다시 온 방문자', v: Math.max(0, (vis.n || 0) - (vis.nv || 0)) }], N, { share: true })) +
        '</div>' +
        card('시간대 (한국 시간)', hourChart(j.hours) + '<p class="small muted">페이지뷰 기준. 공지·투표를 올릴 시간을 정할 때 참고하세요.</p>') +
        '<div class="adm-cols">' +
        card('이전 사이트', tableHTML(['사이트', '방문'], j.refs.map(function (x) { return [esc(x.ref), N(x.ses)]; }), { empty: '다른 사이트에서 들어온 기록이 없어요.' })) +
        card('검색어', tableHTML(['검색어', '경로', '방문'], j.keywords.map(function (x) { return [esc(x.kw), esc(CH[x.ch] || x.ch), N(x.ses)]; }), { empty: '검색어를 알 수 있는 방문이 아직 없어요. 네이버·구글은 대부분 검색어를 넘겨주지 않아요. 서치어드바이저·서치 콘솔에서 확인하세요.' })) +
        '</div><div class="adm-cols">' +
        card('캠페인 링크(utm)', tableHTML(['source/medium/campaign', '방문'], j.utm.map(function (x) { return [esc(x.utm), N(x.ses)]; }), { empty: '캠페인 링크로 들어온 방문이 없어요. 홍보 글에 ?utm_source=instagram&utm_campaign=이름 을 붙이면 따로 세져요.' })) +
        card('국가', bars(j.countries.map(function (x) { return { label: esc(x.cc || '알 수 없음'), v: x.ses }; }), N, { share: true })) +
        '</div>';
    }).catch(function () { failBox(p); });
  }

  // ---------- 지표: 구매·전환 ----------
  function kpiShop(p) {
    api('kpi/shop?' + qs()).then(function (j) {
      if (!j.ok) { failBox(p, j); return; }
      var t = j.totals, totalClicks = t.clicks;
      var cvr = t.cpDays ? pct(t.orders, t.clicks) : null;
      var shopCtr = pct(j.shopClicks.ses, j.shopPage.ses);
      p.innerHTML =
        '<div class="kpi-grid">' +
        kpiCard('구매 버튼 클릭', N(t.clicks), '누른 방문자 ' + N(t.clickUv)) +
        kpiCard('구매 클릭률', P(t.ctr, 2), '전체 방문 기준') +
        kpiCard('보드게임몰 방문', N(j.shopPage.ses), '페이지뷰 ' + N(j.shopPage.pv)) +
        kpiCard('보드게임몰 클릭률', P(shopCtr, 1), '보드게임몰을 본 방문 가운데 구매 버튼을 누른 비율') +
        kpiCard('쿠팡 주문', t.cpDays ? N(t.orders) : '입력 전', t.cpDays ? '취소 ' + N(t.cancels) : '<a href="#/coupang">실적 입력하기</a>') +
        kpiCard('구매 전환율', cvr == null ? '–' : P(cvr, 2), '주문 ÷ 구매 버튼 클릭') +
        kpiCard('구매액', t.cpDays ? W(t.gmv) : '–', t.orders ? '주문당 ' + W(Math.round(t.gmv / t.orders)) : '') +
        kpiCard('수익', t.cpDays ? W(t.commission) : '–', t.clicks && t.cpDays ? '클릭당 ' + W(Math.round(t.commission / t.clicks)) : '') +
        '</div>' +
        '<div class="adm-cols">' +
        card('어디서 눌렀나요', bars(j.sources.map(function (x) { return { label: esc(SRC[x.src] || x.src), v: x.clicks }; }), N, { share: true, empty: '이 기간에 구매 버튼 클릭이 없어요.' })) +
        card('쿠팡 실적 (입력한 날)', tableHTML(['날짜', '쿠팡 클릭', '주문', '구매액', '수익'], j.cp.map(function (x) { return [md(x.day), N(x.clicks), N(x.orders), W(x.gmv), W(x.commission)]; }), { empty: '이 기간에 입력한 실적이 없어요.' }), '<a class="small" href="#/coupang">입력하기</a>') +
        '</div>' +
        card('상품별 클릭', tableHTML(['상품', '클릭', '클릭한 방문자', '비중'], j.items.map(function (x) {
          return [esc(itemName(x.item)) + '<br><small class="muted">' + esc(x.item) + '</small>', N(x.clicks), N(x.uv), P(pct(x.clicks, totalClicks), 1)];
        }), { sort: true, empty: '이 기간에 구매 버튼 클릭이 없어요.' }), csvLink('items')) +
        '<div class="notice small"><b>전환은 이렇게 세요.</b> 쿠팡은 파트너스 링크로 들어온 뒤 24시간 안의 모든 구매(다른 상품 포함)를 실적으로 잡아요. 그래서 상품별 주문은 쿠팡 리포트에서만 볼 수 있고, 여기서는 날짜별 합계를 우리 클릭 수와 견줘 전환율을 계산해요. 본인 구매·취소·반품은 수익에서 빠져요.</div>';
    }).catch(function () { failBox(p); });
  }

  // ---------- 지표: 검색·참여 ----------
  function kpiEngage(p) {
    api('kpi/engage?' + qs()).then(function (j) {
      if (!j.ok) { failBox(p, j); return; }
      var c = j.community, mk = {};
      j.marks.forEach(function (x) { mk[x.kind] = x.n; });
      p.innerHTML =
        '<div class="kpi-grid">' +
        kpiCard('새 회원', N(c.signups), '전체 회원 ' + N(c.members)) +
        kpiCard('점수를 받은 회원', N(c.active), '이 기간에 활동한 회원') +
        kpiCard('후기', N(c.reviews)) + kpiCard('게시글', N(c.posts)) + kpiCard('댓글', N(c.comments)) +
        kpiCard('투표 참여', N(c.votes)) + kpiCard('정모·번개 참여 신청', N(c.joins)) +
        kpiCard('저장·해 봤어요', N((mk.saved || 0) + (mk.played || 0)), '저장 ' + N(mk.saved || 0) + ' · 해 봤어요 ' + N(mk.played || 0)) +
        '</div>' +
        '<div class="adm-cols">' +
        card('사이트 안 검색어', tableHTML(['검색어', '검색', '결과'], j.search.map(function (x) { return [esc(x.k), N(x.n), x.minRes ? N(x.minRes) + '개' : '<span class="badge badge-warn">없음</span>']; }), { empty: '게임 찾기에서 검색한 기록이 없어요.' }), csvLink('search')) +
        card('결과가 없던 검색어', tableHTML(['검색어', '검색'], j.zero.map(function (x) { return [esc(x.k), N(x.n)]; }), { empty: '결과 없는 검색이 없어요.' }) + '<p class="small muted">찾았는데 없던 게임이에요. 새 원고를 쓸 후보로 보세요.</p>') +
        '</div>' +
        card('기능 사용', bars(j.features.map(function (x) { return { label: esc(FEAT[x.t] || x.t) + ' <small class="muted">방문자 ' + N(x.uv) + '</small>', v: x.n }; }), N, { empty: '이 기간에 기능 사용 기록이 없어요.' }));
    }).catch(function () { failBox(p); });
  }

  // ---------- 지표: 실시간 ----------
  function kpiLive(p) {
    var draw = function () {
      api('kpi/live').then(function (j) {
        if (!j.ok) { failBox(p, j); return; }
        p.innerHTML =
          '<div class="kpi-grid kpi-3">' + kpiCard('지금 보고 있는 사람', N(j.v5), '최근 5분 방문자') + kpiCard('최근 30분 방문자', N(j.v30)) + kpiCard('최근 30분 페이지뷰', N(j.pv30)) + '</div>' +
          '<div class="adm-cols">' +
          card('최근 30분 페이지', bars(j.pages.map(function (x) { return { label: esc(pageName(x.path)), v: x.uv }; }), N, { empty: '최근 30분 동안 들어온 사람이 없어요.' })) +
          card('최근 24시간 구매 버튼', tableHTML(['시각', '상품', '누른 곳'], j.clicks.map(function (x) { return [hm(x.ts), esc(itemName(x.item)), esc(x.path ? pageName(x.path) : (SRC[x.src] || x.src || '–'))]; }), { empty: '최근 24시간 동안 누른 사람이 없어요.' })) +
          '</div>' +
          card('방금 열린 페이지', tableHTML(['시각', '페이지', '들어온 경로', '기기'], j.recent.map(function (x) { return [hm(x.ts), esc(pageName(x.path)), x.en ? esc(CH[x.ch] || x.ch) : '<span class="muted">사이트 안</span>', DEV[x.dev] || x.dev]; }))) +
          '<p class="small muted">30초마다 새로 고쳐요. 마지막: ' + hm(j.now) + '</p>';
      });
    };
    draw();
    liveTimer = setInterval(function () { if (current === 'kpi/live' && document.visibilityState === 'visible') draw(); }, 30000);
  }

  // ---------- 쿠팡 실적 입력 ----------
  function parsePaste(text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var m = line.match(/(20\d{2})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})/);
      if (!m) return;
      var day = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
      var rest = line.slice(line.indexOf(m[0]) + m[0].length);
      var nums = (rest.match(/-?[\d,]+(\.\d+)?/g) || []).map(function (x) { return Number(x.replace(/,/g, '')); });
      out.push({ day: day, clicks: nums[0] || 0, orders: nums[1] || 0, gmv: nums[2] || 0, commission: nums[3] || 0, cancels: nums[4] || 0 });
    });
    return out;
  }
  function loadCp(p) {
    Promise.all([api('cp'), api('kpi/summary?from=' + addDay(kstToday(), -89) + '&to=' + kstToday())]).then(function (r) {
      var j = r[0], s = r[1];
      if (!j.ok) { failBox(p, j); return; }
      var ours = {};
      (s.days || []).forEach(function (d) { ours[d.day] = d.clicks; });
      var y = addDay(kstToday(), -1);
      p.innerHTML =
        '<div class="notice small"><b>옮겨 적는 순서</b><ol><li><a href="https://partners.coupang.com/#affiliate/ws/report/trend/daily" target="_blank" rel="noopener">쿠팡 파트너스 → 리포트 → 기간별 리포트(일별 실적)</a>에서 날짜별 숫자를 봐요. 숫자는 다음 날 오후 4시쯤 반영돼요.</li><li>아래 칸에 날짜별로 클릭, 구매 건수, 합산 금액, 수익을 넣고 저장해요. 여러 날은 표를 복사해 ‘한꺼번에 붙여 넣기’에 넣으면 돼요.</li><li>저장하면 지표의 구매 전환율·구매액·수익에 바로 쓰여요.</li></ol>쿠팡 파트너스 최종 승인 뒤 Open API 키를 받으면, 이 입력을 자동으로 가져오도록 붙일 수 있어요.</div>' +
        card('하루씩 넣기', '<form class="cp-form" data-cpform>' +
          '<label class="field"><span>날짜</span><input type="date" name="day" value="' + y + '" max="' + kstToday() + '" required></label>' +
          '<label class="field"><span>쿠팡 클릭</span><input name="clicks" inputmode="numeric" placeholder="0"></label>' +
          '<label class="field"><span>구매 건수</span><input name="orders" inputmode="numeric" placeholder="0"></label>' +
          '<label class="field"><span>합산 금액(원)</span><input name="gmv" inputmode="numeric" placeholder="0"></label>' +
          '<label class="field"><span>수익(원)</span><input name="commission" inputmode="numeric" placeholder="0"></label>' +
          '<label class="field"><span>취소 건수</span><input name="cancels" inputmode="numeric" placeholder="0"></label>' +
          '<label class="field cp-memo"><span>메모</span><input name="memo" maxlength="100" placeholder="예: 블로그 글 올린 날"></label>' +
          '<button class="btn btn-main" type="submit">저장</button></form>') +
        card('한꺼번에 붙여 넣기', '<p class="small muted">한 줄에 하루씩, 날짜 다음에 클릭 · 구매 건수 · 합산 금액 · 수익 · 취소 순서로 숫자가 오면 돼요. 쿠팡 리포트 표를 그대로 복사해도 순서가 같으면 읽어요.</p><textarea rows="5" data-paste placeholder="2026-11-17\t12\t1\t32,600\t978\n2026-11-18\t8\t0\t0\t0"></textarea><div class="row-btns"><button type="button" class="btn btn-sub" data-preview>미리 보기</button></div><div data-prev></div>') +
        card('넣은 실적', tableHTML(['날짜', '우리 사이트 클릭', '쿠팡 클릭', '구매 건수', '합산 금액', '수익', '취소', '전환율', ''], j.rows.map(function (x) {
          var ourC = ours[x.day];
          return [md(x.day) + (x.memo ? '<br><small class="muted">' + esc(x.memo) + '</small>' : ''), ourC == null ? '–' : N(ourC), N(x.clicks), N(x.orders), W(x.gmv), W(x.commission), N(x.cancels), ourC ? P(pct(x.orders, ourC), 1) : '–',
            '<span class="row-btns"><button type="button" class="btn btn-ghost btn-sm" data-edit=\'' + esc(JSON.stringify(x)) + '\'>고치기</button><button type="button" class="btn btn-ghost btn-sm" data-delday="' + x.day + '">지우기</button></span>'];
        }), { empty: '아직 넣은 실적이 없어요.' }));
      var f = $('[data-cpform]', p);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var el = f.elements, row = { day: el.day.value };
        ['clicks', 'orders', 'gmv', 'commission', 'cancels', 'memo'].forEach(function (k) { row[k] = el[k].value; });
        post('cp/save', { rows: [row] }).then(function (x) { RS.toast(x.ok ? '저장했어요' : (x.message || '저장하지 못했어요')); if (x.ok) { shown = {}; loadCp(p); } });
      });
    }).catch(function () { failBox(p); });
  }
  var cpPreview = [];
  $('#a-coupang').addEventListener('click', function (e) {
    var p = $('#a-coupang'), b = e.target.closest('button'); if (!b) return;
    var f = $('[data-cpform]', p);
    if (b.hasAttribute('data-preview')) {
      cpPreview = parsePaste($('[data-paste]', p).value);
      var box = $('[data-prev]', p);
      if (!cpPreview.length) { box.innerHTML = '<p class="notice small">날짜가 있는 줄을 찾지 못했어요. 2026-11-17처럼 날짜로 시작하게 붙여 넣어 주세요.</p>'; return; }
      box.innerHTML = tableHTML(['날짜', '쿠팡 클릭', '구매 건수', '합산 금액', '수익', '취소'], cpPreview.map(function (x) { return [x.day, N(x.clicks), N(x.orders), W(x.gmv), W(x.commission), N(x.cancels)]; })) +
        '<div class="row-btns"><button type="button" class="btn btn-main" data-saveall>' + cpPreview.length + '일 저장</button></div>';
    }
    if (b.hasAttribute('data-saveall')) post('cp/save', { rows: cpPreview }).then(function (x) { RS.toast(x.ok ? x.saved + '일을 저장했어요' : (x.message || '저장하지 못했어요')); if (x.ok) { shown = {}; loadCp(p); } });
    if (b.dataset.delday) {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더'; return; }
      post('cp/delete', { day: b.dataset.delday }).then(function (x) { RS.toast(x.ok ? '지웠어요' : '지우지 못했어요'); shown = {}; loadCp(p); });
    }
    if (b.dataset.edit && f) {
      var x = JSON.parse(b.dataset.edit), el = f.elements;
      el.day.value = x.day;
      ['clicks', 'orders', 'gmv', 'commission', 'cancels', 'memo'].forEach(function (k) { el[k].value = x[k] || (k === 'memo' ? '' : 0); });
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // ---------- 설정·도움말 ----------
  function loadSettings(p) {
    api('system').then(function (s) {
      if (!s.ok) { failBox(p, s); return; }
      var off = false;
      try { off = localStorage.getItem('rs-notrack') === '1'; } catch (e) { off = false; }
      var rows = [
        ['D1 데이터베이스(DB)', '연결됨', true],
        ['관리자 비밀번호(ADMIN_PASSWORD)', '설정됨 · 바꾸면 모든 기기에서 다시 로그인해야 해요', true],
        ['쿠팡 파트너스 API 키', s.coupangApi ? '설정됨' : '없음 · 최종 승인 뒤 COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY를 비밀 값으로 넣어요', s.coupangApi],
        ['새 문의 알림', s.webhook ? '설정됨' : '없음 · 선택 사항(INQUIRY_WEBHOOK_URL)', s.webhook],
        ['비밀번호 보강 값', s.pepper ? '설정됨' : '없음 · 선택 사항(AUTH_PEPPER, 회원이 생기기 전에만 넣으세요)', s.pepper],
      ];
      p.innerHTML =
        card('이 기기', '<p>운영자 기기의 방문은 지표를 흐리게 해요. 처음 로그인할 때 이 브라우저의 방문 통계를 자동으로 껐어요.</p><p><b data-ntstate>' + (off ? '이 브라우저의 방문은 지표에서 빼고 있어요.' : '이 브라우저의 방문도 지표에 들어가요.') + '</b></p><div class="row-btns"><button type="button" class="btn btn-sub" data-nt>' + (off ? '이 브라우저도 세기' : '이 브라우저 빼기') + '</button></div><p class="small muted">휴대폰 등 다른 기기도 빼려면 그 기기에서 개인정보처리방침 페이지의 ‘방문 통계 끄기’를 누르세요.</p>') +
        card('Cloudflare 설정 상태', '<ul class="setup">' + rows.map(function (x) { return '<li class="' + (x[2] ? 'ok' : 'no') + '"><b>' + x[0] + '</b><span>' + x[1] + '</span></li>'; }).join('') + '</ul><p class="small muted">비밀 값은 Cloudflare → Workers & Pages → rulerule → 설정 → 변수 및 비밀에서 넣고, 넣은 뒤에는 다시 배포해야 적용돼요.</p>') +
        card('모은 기록', tableHTML(['종류', '줄 수'], [['페이지뷰 기록', N(s.rows.pv)], ['구매 버튼 기록', N(s.rows.clk)], ['검색·기능 기록', N(s.rows.ev)], ['회원', N(s.rows.users)], ['후기', N(s.rows.reviews)]]) + '<p class="small muted">' + (s.firstDay ? md(s.firstDay) + '부터 모았어요. ' : '') + '방문 기록은 400일이 지나면 자동으로 지워요. 이름·IP는 모으지 않아요.</p>') +
        card('지표 설명', glossaryHTML) +
        card('로그인', '<p class="small">로그인은 12시간(‘7일 유지’를 고르면 7일) 동안 이어져요. 비밀번호를 15분 안에 8번 틀리면 잠시 막혀요.</p><div class="row-btns"><button type="button" class="btn btn-ghost" data-logout2>로그아웃</button></div>');
      $('[data-nt]', p).addEventListener('click', function () {
        try {
          if (localStorage.getItem('rs-notrack') === '1') localStorage.removeItem('rs-notrack'); else localStorage.setItem('rs-notrack', '1');
          localStorage.setItem('rs-notrack-set', '1');
        } catch (e) { /* 무시 */ }
        loadSettings(p);
      });
      $('[data-logout2]', p).addEventListener('click', function () { logout('로그아웃했어요.'); });
    });
  }

  // ---------- 오류 신고 ----------
  var repStatus = 'new';
  function loadReports(p) {
    p.innerHTML = '<div class="row-btns" role="radiogroup" aria-label="보기">' +
      [['new', '새 신고'], ['done', '처리함'], ['all', '전체']].map(function (x) {
        return '<button type="button" class="chip" role="radio" aria-checked="' + (repStatus === x[0]) + '" data-st="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div><div class="report-list" data-list><p class="muted">불러오는 중이에요</p></div>';
    RS.radioGroup($('[role="radiogroup"]', p), function (b) { repStatus = b.dataset.st; fetchReports(); });
    fetchReports();
  }
  var ghEdit = function (slug) { return 'https://github.com/' + repo + '/edit/' + branch + '/content/games/' + slug + '.json'; };
  function fetchReports() {
    var box = $('#a-reports [data-list]');
    api('reports?status=' + repStatus).then(function (j) {
      if (j._status !== 200) { box.innerHTML = '<p class="notice">' + esc(j.message || '신고를 불러오지 못했어요.') + '</p>'; return; }
      if (!j.reports.length) { box.innerHTML = '<p class="muted">' + (repStatus === 'new' ? '새 신고가 없어요.' : '신고가 없어요.') + '</p>'; return; }
      box.innerHTML = j.reports.map(function (r) {
        var g = gamesBySlug[r.slug];
        return '<article class="report" data-id="' + r.id + '">' +
          '<div class="report-meta"><span class="badge' + (r.status === 'new' ? ' new' : '') + '">' + (r.status === 'new' ? '새 신고' : '처리함') + '</span>' +
          '<b>' + esc(KIND[r.kind] || r.kind) + '</b><span>' + esc(g ? g.n : (r.slug || '게임과 상관없음')) + '</span><span>' + esc(fmtTime(r.created_at)) + '</span>' +
          (r.page ? '<span>' + esc(r.page) + '</span>' : '') + '</div>' +
          '<p class="report-msg">' + esc(r.message) + '</p>' +
          (r.contact ? '<p class="small">답장 받을 곳: ' + esc(r.contact) + '</p>' : '') +
          '<div class="row-btns">' +
          (r.status === 'new' ? '<button type="button" class="btn btn-sub" data-done>처리 완료</button>' : '<button type="button" class="btn btn-ghost" data-undo>새 신고로 되돌리기</button>') +
          (g && repo ? '<a class="btn btn-ghost" href="' + ghEdit(r.slug) + '" target="_blank" rel="noopener">원고 고치기</a>' : '') +
          '<button type="button" class="btn btn-ghost" data-del>지우기</button></div></article>';
      }).join('');
    }).catch(function () { box.innerHTML = '<p class="notice">서버에 연결하지 못했어요.</p>'; });
  }
  $('#a-reports').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var cardEl = b.closest('[data-id]'); if (!cardEl) return;
    var id = cardEl.dataset.id;
    if (b.hasAttribute('data-done') || b.hasAttribute('data-undo')) {
      b.disabled = true;
      post('reports/' + id, { status: b.hasAttribute('data-done') ? 'done' : 'new' })
        .then(function (j) { if (j.ok) { cardEl.remove(); RS.toast(b.hasAttribute('data-done') ? '처리 완료로 옮겼어요' : '새 신고로 되돌렸어요'); refreshCounts(); } else { b.disabled = false; RS.toast('바꾸지 못했어요'); } });
    }
    if (b.hasAttribute('data-del')) {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더 누르면 지워요'; return; }
      api('reports/' + id, { method: 'DELETE' }).then(function (j) { if (j.ok) { cardEl.remove(); RS.toast('지웠어요'); refreshCounts(); } else RS.toast('지우지 못했어요'); });
    }
  });

  // ---------- 원고 관리 ----------
  var TEMPLATE = {
    slug: 'game-slug', code: 'xx', name: '게임 이름', original: '', aliases: [], kind: 'board', group: 'family',
    players: [2, 4], best: '', minutes: [15, 30], age: 8, level: 1, tags: [], oneLine: '한 줄 소개', intro: '', compare: '', edition: '', source: '',
    status: 'draft', checked: null, components: ['구성물'],
    summary: { goal: '이기는 법', turn: ['내 차례에 할 일'], end: '끝나는 때' },
    setup: ['준비하기'], examples: [], scoring: [], rules: [], tricky: [], faq: [], variants: [], houseRules: [], tools: [], related: [], diagram: '', diagramCaption: ''
  };
  function loadContent(p) {
    var list = (gamesData && gamesData.games) || [];
    var checked = list.filter(function (g) { return g.st === 'checked'; }).length, reviewed = list.filter(function (g) { return g.st === 'reviewed'; }).length;
    var newURL = repo ? 'https://github.com/' + repo + '/new/' + branch + '/content/games?filename=' + encodeURIComponent('game-slug.json') + '&value=' + encodeURIComponent(JSON.stringify(TEMPLATE, null, 2)) : '';
    p.innerHTML = '<div class="kpi-grid kpi-4">' + kpiCard('전체 게임', N(list.length)) + kpiCard('검수 완료', N(checked), '실제 게임으로 확인') + kpiCard('자료 대조 완료', N(reviewed)) + kpiCard('검수 중', N(list.length - checked - reviewed)) + '</div>' +
      '<div class="notice small">원고는 GitHub의 <b>content/games</b> 폴더에 게임마다 JSON 파일 하나로 있어요. ‘고치기’를 누르면 GitHub 편집 화면이 열리고, 저장(Commit)하면 1~2분 뒤 사이트에 반영돼요. 새 게임은 파일 이름과 <b>slug</b>를 같은 영문 이름으로, <b>code</b>는 다른 게임과 겹치지 않는 영문 2~3자로 정해 주세요. 검수를 마친 게임은 <b>status</b>를 "checked"로 바꾸고 <b>checked</b>에 날짜와 확인한 사람을 적어 주세요.</div>' +
      (repo ? '<div class="row-btns"><a class="btn btn-main" href="' + newURL + '" target="_blank" rel="noopener">새 게임 원고 만들기</a><a class="btn btn-ghost" href="https://github.com/' + repo + '/tree/' + branch + '/content" target="_blank" rel="noopener">원고 폴더 열기</a></div>' : '<p class="notice">site.config.json에 githubRepo를 적으면 고치기 버튼이 생겨요.</p>') +
      card('원고 목록', tableHTML(['게임', '상태', '채운 항목', ''], list.map(function (g) {
        return ['<a href="/games/' + g.s + '/" target="_blank">' + esc(g.n) + '</a>',
          { h: '<span class="badge ' + (g.st === 'checked' ? 'checked">검수 완료' : g.st === 'reviewed' ? 'checked">자료 대조' : 'draft">검수 중') + '</span>' + (g.ck && g.ck.date ? '<br><small class="muted">' + esc(g.ck.date) + '</small>' : ''), s: g.st },
          g.done + ' / 6',
          repo ? '<a class="link-btn" href="' + ghEdit(g.s) + '" target="_blank" rel="noopener">고치기</a>' : ''];
      }), { sort: true }) + '<p class="muted small">채운 항목은 구성물, 준비하기, 따라 해 보기, 자세한 규칙, 헷갈리는 상황, 자주 묻는 질문 여섯 가지 가운데 내용이 있는 것의 수예요.</p>');
  }

  // ---------- 문의함 ----------
  var chipsHTML = function (cur, list, attr) {
    return '<div class="row-btns" role="radiogroup">' + list.map(function (x) { return '<button type="button" class="chip" role="radio" aria-checked="' + (cur === x[0]) + '" ' + attr + '="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  };
  var IKIND = { partner: '제휴·협업', ad: '광고·입점', store: '매장 등록', game: '게임 추가', bug: '오류·불편', etc: '그 밖의 문의' };
  var inqStatus = 'new';
  function loadInq(p) {
    p.innerHTML = chipsHTML(inqStatus, [['new', '새 문의'], ['done', '답변함'], ['all', '전체']], 'data-ist') + '<div data-list><p class="muted">불러오는 중이에요</p></div>';
    RS.radioGroup($('[role="radiogroup"]', p), function (b) { inqStatus = b.dataset.ist; fetchInq(); });
    fetchInq();
  }
  function fetchInq() {
    var box = $('#a-inquiries [data-list]');
    api('inquiries?status=' + inqStatus).then(function (j) {
      if (j._status !== 200) { box.innerHTML = '<p class="notice">' + esc(j.message || '문의를 불러오지 못했어요.') + '</p>'; return; }
      if (!j.inquiries.length) { box.innerHTML = '<p class="muted">' + (inqStatus === 'new' ? '새 문의가 없어요.' : '문의가 없어요.') + '</p>'; return; }
      box.innerHTML = j.inquiries.map(function (r) {
        var reply = 'mailto:' + encodeURIComponent(r.email) + '?subject=' + encodeURIComponent('[룰룰] ' + (r.title || IKIND[r.kind] + ' 문의') + ' 답변드려요');
        return '<article class="report" data-id="' + r.id + '"><div class="report-meta"><span class="badge' + (r.status === 'new' ? ' new' : '') + '">' + (r.status === 'new' ? '새 문의' : '답변함') + '</span><b>' + esc(IKIND[r.kind] || r.kind) + '</b><span>' + esc(fmtTime(r.created_at)) + '</span></div>' +
          (r.title ? '<p><b>' + esc(r.title) + '</b></p>' : '') + '<p class="report-msg">' + esc(r.message) + '</p>' +
          '<p class="small">' + esc(r.name) + (r.org ? ' · ' + esc(r.org) : '') + ' · <a href="' + reply + '">' + esc(r.email) + '</a>' + (r.phone ? ' · ' + esc(r.phone) : '') + '</p>' +
          '<label class="field"><span class="small">메모</span><input data-memo maxlength="500" value="' + esc(r.memo || '') + '" placeholder="처리 내용을 적어 두세요"></label>' +
          '<div class="row-btns"><a class="btn btn-sub" href="' + reply + '">이메일로 답하기</a>' +
          (r.status === 'new' ? '<button type="button" class="btn btn-sub" data-done>답변함으로 옮기기</button>' : '<button type="button" class="btn btn-ghost" data-undo>새 문의로 되돌리기</button>') +
          '<button type="button" class="btn btn-ghost" data-save>메모 저장</button><button type="button" class="btn btn-ghost" data-del>지우기</button></div></article>';
      }).join('');
    });
  }
  $('#a-inquiries').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var cardEl = b.closest('[data-id]'); if (!cardEl) return;
    var id = cardEl.dataset.id, memo = $('[data-memo]', cardEl).value;
    if (b.hasAttribute('data-done') || b.hasAttribute('data-undo') || b.hasAttribute('data-save')) {
      var st = b.hasAttribute('data-done') ? 'done' : b.hasAttribute('data-undo') ? 'new' : (inqStatus === 'done' ? 'done' : $('.badge.new', cardEl) ? 'new' : 'done');
      post('inquiries/' + id, { status: st, memo: memo }).then(function (j) {
        if (!j.ok) { RS.toast('저장하지 못했어요'); return; }
        RS.toast(b.hasAttribute('data-save') ? '메모를 저장했어요' : '옮겼어요');
        if (!b.hasAttribute('data-save') && inqStatus !== 'all') cardEl.remove();
        refreshCounts();
      });
    }
    if (b.hasAttribute('data-del')) {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더 누르면 지워요'; return; }
      api('inquiries/' + id, { method: 'DELETE' }).then(function (j) { if (j.ok) { cardEl.remove(); RS.toast('지웠어요'); refreshCounts(); } });
    }
  });

  // ---------- 쇼핑 링크 ----------
  function loadShop(p) {
    api('shop?days=30').then(function (j) {
      var shopItems = shopData.items;
      if (j._status !== 200) { p.innerHTML = '<p class="notice">' + esc(j.message || '불러오지 못했어요.') + '</p>'; return; }
      var link = {}, clicks = {};
      j.links.forEach(function (l) { link[l.id] = l.url; });
      j.clicks.forEach(function (c) { clicks[c.id] = c.n; });
      var ids = Object.keys(shopItems).sort(function (a, b) { return (clicks[b] || 0) - (clicks[a] || 0) || (link[a] ? 1 : 0) - (link[b] ? 1 : 0); });
      var done = ids.filter(function (id) { return link[id] || shopItems[id].p; }).length;
      var total = ids.reduce(function (n, id) { return n + (clicks[id] || 0); }, 0);
      p.innerHTML = '<div class="kpi-grid kpi-3">' + kpiCard('파트너스 링크 넣음', done + ' / ' + ids.length, done === ids.length ? '모든 구매 버튼에 수수료가 붙어요' : '비어 있는 상품은 수수료가 없어요') + kpiCard('최근 30일 구매 버튼', N(total)) + kpiCard('쿠팡 API', j.api ? '연결됨' : '없음', j.api ? '' : '최종 승인 뒤 키를 넣을 수 있어요') + '</div>' +
        '<div class="notice small"><b>파트너스 링크 바꾸는 순서</b><ol><li>‘고른 상품 열기’ 또는 ‘쿠팡에서 찾기’로 알맞은 상품 페이지를 열고 주소를 복사해요.</li><li>쿠팡 파트너스 → 링크 생성 → 간편 링크 만들기에 그 주소를 붙여 넣고 단축 링크(https://link.coupang.com/a/...)를 만들어요.</li><li>아래 칸에 붙여 넣고 ‘저장’을 누르면 바로 사이트의 구매 버튼에 쓰여요. 원고(content/shop.json)의 url보다 이 칸이 먼저 쓰여요.</li></ol></div>' +
        (j.api ? '<div class="row-btns"><button type="button" class="btn btn-main" data-auto>쿠팡 API로 빈 링크 자동 만들기</button></div>' : '') +
        (j.sources.length ? card('어디서 많이 눌렀나요 (최근 30일)', bars(j.sources.map(function (s) { return { label: esc(SRC[s.src] || (gamesBySlug[s.src] ? gameName(s.src) + ' 페이지' : s.src || '알 수 없음')), v: s.n }; }), N, { share: true })) : '') +
        card('상품과 링크', '<div class="tbl-wrap"><table class="tbl shop-tbl"><thead><tr><th>상품</th><th class="num">30일 클릭</th><th>파트너스 링크</th></tr></thead><tbody>' +
        ids.map(function (id) {
          var it = shopItems[id];
          var search = 'https://www.coupang.com/np/search?q=' + encodeURIComponent(it.q);
          var state = link[id] ? '<span class="badge">관리 화면 링크</span>' : it.p ? '<span class="badge">원고 링크</span>' : '<span class="badge badge-warn">수수료 없음</span>';
          return '<tr data-id="' + id + '"><td><div class="shop-row">' + (it.img ? '<img src="' + esc(it.img) + '" width="48" height="48" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + '<div><b>' + esc(it.n) + '</b> ' + state + '<br>' + (it.cu ? '<a class="small" href="' + esc(it.cu) + '" target="_blank" rel="noopener">고른 상품 열기</a> · ' : '') + '<a class="small" href="' + search + '" target="_blank" rel="noopener">쿠팡에서 찾기</a> · <span class="small muted">' + id + '</span></div></div></td><td class="num">' + (clicks[id] || 0) + '</td>' +
            '<td><div class="shop-in"><input data-url value="' + esc(link[id] || '') + '" placeholder="' + esc(it.p || 'https://link.coupang.com/a/...') + '" inputmode="url"><button type="button" class="btn btn-sub btn-sm" data-save>저장</button></div></td></tr>';
        }).join('') + '</tbody></table></div>');
    });
  }
  $('#a-shop').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-auto')) {
      b.disabled = true; b.textContent = '만드는 중이에요';
      post('shop/auto').then(function (j) { RS.toast(j.ok ? '링크 ' + j.made + '개를 만들었어요' : (j.message || '만들지 못했어요')); loadShop($('#a-shop')); });
      return;
    }
    var row = b.closest('[data-id]'); if (!row || !b.hasAttribute('data-save')) return;
    post('shop/link', { id: row.dataset.id, url: $('[data-url]', row).value.trim() }).then(function (j) { RS.toast(j.ok ? (j.removed ? '링크를 지웠어요' : '저장했어요') : (j.message || '저장하지 못했어요')); });
  });

  // ---------- 커뮤니티 관리 ----------
  var TARGET = { post: '글', event: '일정', club: '모임', comment: '댓글', review: '후기' };
  var linkOf = function (t, id, parent) {
    if (t === 'post') return '/community/post/?id=' + id;
    if (t === 'event') return '/community/event/?id=' + id;
    if (t === 'club') return '/community/club/?id=' + id;
    var pp = String(parent || '').split(':');
    if (pp[0] === 'game') return '/games/' + pp[1] + '/#reviews';
    return pp[0] ? linkOf(pp[0], pp[1]) : '#';
  };
  function table(rows, cols) {
    if (!rows || !rows.length) return '<p class="muted">없어요.</p>';
    return '<div class="tbl-wrap"><table class="tbl"><tbody>' + rows.map(function (r) { return '<tr>' + cols(r).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function loadCm(p) {
    p = p || $('#a-community');
    Promise.all([api('community/flags'), api('community/recent')]).then(function (r) {
      var f = r[0], c = r[1];
      if (f._status !== 200) { p.innerHTML = '<p class="notice">' + esc(f.message || '불러오지 못했어요.') + '</p>'; return; }
      var act = function (t, id, hidden) {
        return '<span class="row-btns" data-t="' + t + '" data-i="' + id + '"><button type="button" class="btn btn-ghost btn-sm" data-hide="' + (hidden ? 0 : 1) + '">' + (hidden ? '다시 보이기' : '가리기') + '</button><button type="button" class="btn btn-ghost btn-sm" data-remove>지우기</button></span>';
      };
      var userAct = function (u) {
        return '<span class="row-btns" data-u="' + u.id + '">' + (u.status === 'banned' ? '<button type="button" class="btn btn-ghost btn-sm" data-ua="unban">제한 풀기</button>' : '<button type="button" class="btn btn-ghost btn-sm" data-ua="ban">이용 제한</button>') +
          '<button type="button" class="btn btn-ghost btn-sm" data-ua="reset">임시 비밀번호</button></span>';
      };
      var CATN = { free: '자유', qna: '규칙 질문', review: '게임 후기', recommend: '추천', poll: '투표', notice: '공지' };
      p.innerHTML = '<div class="kpi-grid kpi-3">' + kpiCard('회원', N(c.userCount)) + kpiCard('확인할 신고', N(f.flags.length)) + kpiCard('최근 후기', N((c.reviews || []).length)) + '</div>' +
        card('확인할 신고', f.flags.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>대상</th><th>신고</th><th>사유</th><th></th></tr></thead><tbody>' + f.flags.map(function (x) {
          return '<tr><td>' + TARGET[x.target] + ' · <a href="' + linkOf(x.target, x.target_id, x.parent) + '" target="_blank">' + esc(x.label || '(지워짐)') + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : '') + '</td><td>' + x.n + '</td><td class="small">' + esc(x.reasons || '') + '</td><td>' + act(x.target, x.target_id, x.hidden) +
            '<span class="row-btns" data-t="' + x.target + '" data-i="' + x.target_id + '"><button type="button" class="btn btn-ghost btn-sm" data-dismiss>문제없음</button></span></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">확인할 신고가 없어요.</p>') +
        card('공지·투표 올리기', '<form class="cm-form" data-sysform><p class="muted small">‘룰룰 운영팀’ 이름으로 올라가요. 고정하면 게시판과 커뮤니티 홈 맨 위에 보여요.</p>' +
          '<div class="row-btns" role="radiogroup" data-syscat><button type="button" class="chip" role="radio" aria-checked="true" data-c="notice">공지</button><button type="button" class="chip" role="radio" aria-checked="false" data-c="poll">투표</button></div>' +
          '<label class="field"><span>제목</span><input name="title" maxlength="60" required></label>' +
          '<label class="field"><span>내용</span><textarea name="body" rows="5" maxlength="5000"></textarea></label>' +
          '<div class="field" data-sysopts hidden><span>투표 보기 (한 줄에 하나, 2~6개)</span><textarea name="options" rows="4" placeholder="윷놀이\n공기놀이\n제기차기"></textarea><label class="field field-inline"><span>기간</span><select name="days"><option value="3">3일</option><option value="7" selected>7일</option><option value="14">14일</option><option value="30">30일</option></select></label></div>' +
          '<label class="check"><input type="checkbox" name="pinned" checked><span>맨 위에 고정하기</span></label>' +
          '<p class="form-msg" role="status"></p><button class="btn btn-main" type="submit">올리기</button></form>') +
        card('최근 글', table(c.posts, function (x) { return [esc(CATN[x.cat] || x.cat), '<a href="/community/post/?id=' + x.id + '" target="_blank">' + esc(x.title) + '</a>' + (x.pinned ? ' <span class="badge">고정</span>' : '') + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('post', x.id, x.hidden) + '<span class="row-btns" data-pin="' + x.id + '"><button type="button" class="btn btn-ghost btn-sm" data-pinv="' + (x.pinned ? 0 : 1) + '">' + (x.pinned ? '고정 풀기' : '고정') + '</button></span>']; })) +
        card('최근 후기', table(c.reviews, function (x) { return [esc(gameName(x.slug)) + ' · ' + '★'.repeat(x.rating), '<a href="/games/' + x.slug + '/#reviews" target="_blank">' + esc(x.body || '(별점만)') + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('review', x.id, x.hidden)]; })) +
        '<div class="adm-cols">' +
        card('최근 일정', table(c.events, function (x) { return [x.kind === 'regular' ? '정모' : '번개', '<a href="/community/event/?id=' + x.id + '" target="_blank">' + esc(x.title) + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('event', x.id, x.hidden)]; })) +
        card('최근 모임', table(c.clubs, function (x) { return [esc(x.region), '<a href="/community/club/?id=' + x.id + '" target="_blank">' + esc(x.title) + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('club', x.id, x.hidden)]; })) +
        '</div>' +
        card('최근 가입한 회원', table(c.users, function (u) { return [esc(u.login), esc(u.nick) + (u.status === 'banned' ? ' <span class="badge">제한</span>' : ''), esc(fmtTime(u.created_at)), userAct(u)]; }) +
          '<p class="muted small">임시 비밀번호는 비밀번호를 잊은 회원이 문의했을 때 본인인지 확인한 뒤 알려 주세요. 회원은 로그인 후 내 정보에서 비밀번호를 바꿀 수 있어요.</p>');
      var sf = $('[data-sysform]', p), syscat = 'notice';
      RS.radioGroup($('[data-syscat]', sf), function (b) { syscat = b.dataset.c; $('[data-sysopts]', sf).hidden = syscat !== 'poll'; });
      sf.addEventListener('submit', function (e) {
        e.preventDefault();
        var m = $('.form-msg', sf), el = sf.elements;
        var body = { cat: syscat, title: el.title.value.trim(), body: el.body.value, pinned: el.pinned.checked, days: Number(el.days.value), options: el.options.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean) };
        post('community/post', body).then(function (j) {
          if (!j.ok) { m.className = 'form-msg err'; m.textContent = j.message || '올리지 못했어요.'; return; }
          RS.toast('올렸어요'); loadCm(p);
        });
      });
      refreshCounts();
    });
  }
  $('#a-community').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var p = $('#a-community');
    var box = b.closest('[data-t]'), ub = b.closest('[data-u]'), pin = b.closest('[data-pin]');
    if (pin) { post('community/pin', { id: Number(pin.dataset.pin), pinned: b.dataset.pinv === '1' }).then(function (j) { RS.toast(j.ok ? (b.dataset.pinv === '1' ? '고정했어요' : '고정을 풀었어요') : '바꾸지 못했어요'); loadCm(p); }); return; }
    if (box) {
      var body = { target: box.dataset.t, id: Number(box.dataset.i) };
      if (b.hasAttribute('data-hide')) { body.hidden = b.dataset.hide === '1'; post('community/hide', body).then(function (j) { RS.toast(j.ok ? (body.hidden ? '가렸어요' : '다시 보이게 했어요') : '바꾸지 못했어요'); loadCm(p); }); }
      if (b.hasAttribute('data-dismiss')) post('community/dismiss', body).then(function () { RS.toast('신고를 정리했어요'); loadCm(p); });
      if (b.hasAttribute('data-remove')) {
        if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더 누르면 지워요'; return; }
        post('community/remove', body).then(function (j) { RS.toast(j.ok ? '지웠어요' : '지우지 못했어요'); loadCm(p); });
      }
    }
    if (ub) {
      var a = b.dataset.ua;
      if (a === 'reset' && !confirm('이 회원의 비밀번호를 임시 비밀번호로 바꿀까요?')) return;
      post('community/user/' + ub.dataset.u, { action: a }).then(function (j) {
        if (!j.ok) { RS.toast('바꾸지 못했어요'); return; }
        if (a === 'reset') prompt('임시 비밀번호예요. 회원에게 알려 주세요.', j.temp); else { RS.toast(a === 'ban' ? '이용을 제한했어요' : '제한을 풀었어요'); loadCm(p); }
      });
    }
  });
})();
