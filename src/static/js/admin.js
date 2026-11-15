/* 룰룰 운영 관리: 신고함, 이용 기록, 원고 관리 */
(function () {
  'use strict';
  var RS = window.RS;
  var root = document.querySelector('[data-admin]');
  if (!RS || !root) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc;
  var repo = root.dataset.repo, branch = root.dataset.branch || 'main';
  var KEY = 'rs-admin-key';
  var key = '';
  try { key = sessionStorage.getItem(KEY) || ''; } catch (e) { key = ''; }
  var gamesBySlug = {}, gamesData = null;
  var KIND = { wrong: '규칙이 틀림', unclear: '설명이 헷갈림', typo: '오타, 표현', request: '게임 추가 요청', other: '그 밖의 의견' };
  var TYPE = { view: '게임 페이지 열람', table: '테이블 모드', qr: 'QR로 들어옴', venue: '매장 페이지', speak: '소리 내 읽기', share: '링크 보내기', buy: '구매 버튼 누름' };

  function api(path, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ 'x-admin-key': key }, opt.headers || {});
    return fetch('/api/admin/' + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    });
  }
  var ghEdit = function (slug) { return 'https://github.com/' + repo + '/edit/' + branch + '/content/games/' + slug + '.json'; };
  var fmtTime = function (iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ---------- 들어가기 ----------
  var login = $('[data-login]', root), body = $('[data-body]', root), lform = $('[data-login-form]', root), lmsg = $('.form-msg', lform);
  function setupNotice(h) {
    var miss = [];
    if (!h.db) miss.push('D1 데이터베이스를 <b>DB</b>라는 이름으로 연결하기');
    if (!h.admin) miss.push('환경 변수 <b>ADMIN_PASSWORD</b> 넣기');
    if (!miss.length) return '';
    return '<div class="notice"><b>Cloudflare 설정이 아직 끝나지 않았어요.</b> 아래를 마친 뒤 다시 배포해 주세요. 자세한 순서는 README에 있어요.<ol>' + miss.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ol></div>';
  }
  fetch('/api/health').then(function (r) { return r.json(); }).then(function (h) {
    var n = setupNotice(h);
    if (n) login.insertAdjacentHTML('afterbegin', n);
  }).catch(function () {
    login.insertAdjacentHTML('afterbegin', '<div class="notice">서버 기능(/api)에 연결하지 못했어요. 이 화면은 Cloudflare에 배포한 주소에서 열어 주세요.</div>');
  });

  function enter() {
    lmsg.textContent = '확인하는 중이에요'; lmsg.className = 'form-msg';
    return api('stats?days=7').then(function (j) {
      if (j._status === 200) {
        try { sessionStorage.setItem(KEY, key); } catch (e) { /* 무시 */ }
        login.hidden = true; body.hidden = false;
        start();
        return;
      }
      key = '';
      try { sessionStorage.removeItem(KEY); } catch (e) { /* 무시 */ }
      lmsg.className = 'form-msg err';
      lmsg.textContent = j._status === 401 ? '비밀번호가 맞지 않아요.' : (j.message || '지금은 들어갈 수 없어요. 잠시 뒤 다시 시도해 주세요.');
    }).catch(function () { lmsg.className = 'form-msg err'; lmsg.textContent = '서버에 연결하지 못했어요.'; });
  }
  lform.addEventListener('submit', function (e) { e.preventDefault(); key = lform.elements.pw.value; enter(); });
  if (key) enter();

  // ---------- 탭 ----------
  var tabs = $$('[role="tab"]', body), panels = $$('.panel', body), loaded = {};
  function show(id) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('aria-controls') === id)); });
    panels.forEach(function (p) { p.classList.toggle('active', p.id === id); });
    if (!loaded[id]) { loaded[id] = true; ({ 'a-reports': loadReports, 'a-stats': loadStats, 'a-content': loadContent, 'a-inq': loadInq, 'a-shop': loadShop, 'a-cm': loadCm })[id](); }
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); }); });

  function start() {
    RS.loadGames().then(function (d) {
      gamesData = d;
      d.games.forEach(function (g) { gamesBySlug[g.s] = g; });
    }).catch(function () { gamesData = { games: [] }; }).then(function () { show('a-reports'); });
  }

  // ---------- 신고함 ----------
  var repStatus = 'new';
  function loadReports() {
    var p = $('#a-reports');
    p.innerHTML = '<div class="row-btns" role="radiogroup" aria-label="보기">' +
      [['new', '새 신고'], ['done', '처리함'], ['all', '전체']].map(function (x) {
        return '<button type="button" class="chip" role="radio" aria-checked="' + (repStatus === x[0]) + '" data-st="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '</div><div class="report-list" data-list><p class="muted">불러오는 중이에요</p></div>';
    RS.radioGroup($('[role="radiogroup"]', p), function (b) { repStatus = b.dataset.st; fetchReports(); });
    fetchReports();
  }
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
    var card = b.closest('[data-id]'); if (!card) return;
    var id = card.dataset.id;
    if (b.hasAttribute('data-done') || b.hasAttribute('data-undo')) {
      b.disabled = true;
      api('reports/' + id, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: b.hasAttribute('data-done') ? 'done' : 'new' }) })
        .then(function (j) { if (j.ok) { card.remove(); RS.toast(b.hasAttribute('data-done') ? '처리 완료로 옮겼어요' : '새 신고로 되돌렸어요'); } else { b.disabled = false; RS.toast('바꾸지 못했어요'); } });
    }
    if (b.hasAttribute('data-del')) {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더 누르면 지워요'; return; }
      api('reports/' + id, { method: 'DELETE' }).then(function (j) { if (j.ok) { card.remove(); RS.toast('지웠어요'); } else RS.toast('지우지 못했어요'); });
    }
  });

  // ---------- 이용 기록 ----------
  var days = 30;
  function loadStats() {
    var p = $('#a-stats');
    p.innerHTML = '<div class="row-btns" role="radiogroup" aria-label="기간">' + [7, 30, 90].map(function (d) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (d === days) + '" data-d="' + d + '">최근 ' + d + '일</button>';
    }).join('') + '</div><div data-out><p class="muted">불러오는 중이에요</p></div>';
    RS.radioGroup($('[role="radiogroup"]', p), function (b) { days = Number(b.dataset.d); fetchStats(); });
    fetchStats();
  }
  function fetchStats() {
    var out = $('#a-stats [data-out]');
    api('stats?days=' + days).then(function (j) {
      if (j._status !== 200) { out.innerHTML = '<p class="notice">' + esc(j.message || '기록을 불러오지 못했어요.') + '</p>'; return; }
      var t = j.totals || {};
      var stat = function (k) { return '<div class="stat"><b>' + (t[k] || 0).toLocaleString('ko-KR') + '</b><span>' + TYPE[k] + '</span></div>'; };
      var max = Math.max.apply(null, [1].concat(j.daily.map(function (d) { return d.n; })));
      var name = function (s) { return gamesBySlug[s] ? gamesBySlug[s].n : s; };
      out.innerHTML = '<div class="stat-grid">' + ['view', 'table', 'buy', 'qr', 'venue', 'share'].map(stat).join('') + '</div>' +
        '<h2 class="h3">날짜별 게임 페이지 열람</h2>' +
        (j.daily.length ? '<div class="bars" role="img" aria-label="날짜별 열람 수 막대 그래프">' + j.daily.map(function (d) { return '<span title="' + d.day + ' ' + d.n + '회" style="height:' + Math.round(d.n / max * 100) + '%"></span>'; }).join('') + '</div><p class="muted small">' + esc(j.daily[0].day) + ' ~ ' + esc(j.daily[j.daily.length - 1].day) + '</p>' : '<p class="muted">아직 기록이 없어요.</p>') +
        '<h2 class="h3">많이 본 게임</h2>' +
        (j.games.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>게임</th><th>열람</th><th>테이블 모드</th><th>QR</th></tr></thead><tbody>' + j.games.map(function (g) {
          return '<tr><td><a href="/games/' + esc(g.slug) + '/">' + esc(name(g.slug)) + '</a></td><td>' + g.view + '</td><td>' + g.table + '</td><td>' + g.qr + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">아직 기록이 없어요.</p>') +
        '<h2 class="h3">매장 QR로 들어온 기록</h2>' +
        (j.venues.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>매장 이름</th><th>기록 수</th></tr></thead><tbody>' + j.venues.map(function (v) {
          return '<tr><td>' + esc(v.venue) + '</td><td>' + v.n + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">아직 매장 QR로 들어온 기록이 없어요.</p>') +
        '<p class="muted small">이름, 연락처 같은 개인 정보는 기록하지 않고 날짜별 숫자만 세요.</p>';
    }).catch(function () { out.innerHTML = '<p class="notice">서버에 연결하지 못했어요.</p>'; });
  }

  // ---------- 원고 관리 ----------
  var TEMPLATE = {
    slug: 'game-slug', code: 'xx', name: '게임 이름', original: '', aliases: [], kind: 'board', group: 'family',
    players: [2, 4], best: '', minutes: [15, 30], age: 8, level: 1, tags: [], oneLine: '한 줄 소개', intro: '', compare: '', edition: '', source: '',
    status: 'draft', checked: null, components: ['구성물'],
    summary: { goal: '이기는 법', turn: ['내 차례에 할 일'], end: '끝나는 때' },
    setup: ['준비하기'], examples: [], scoring: [], rules: [], tricky: [], faq: [], variants: [], houseRules: [], tools: [], related: [], diagram: '', diagramCaption: ''
  };
  function loadContent() {
    var p = $('#a-content'), list = (gamesData && gamesData.games) || [];
    var draft = list.filter(function (g) { return g.st !== 'checked'; }).length;
    var newURL = repo ? 'https://github.com/' + repo + '/new/' + branch + '/content/games?filename=' + encodeURIComponent('game-slug.json') + '&value=' + encodeURIComponent(JSON.stringify(TEMPLATE, null, 2)) : '';
    p.innerHTML = '<div class="stat-grid"><div class="stat"><b>' + list.length + '</b><span>전체 게임</span></div><div class="stat"><b>' + (list.length - draft) + '</b><span>검수 완료</span></div><div class="stat"><b>' + draft + '</b><span>검수 중</span></div></div>' +
      '<div class="notice">원고는 GitHub의 <b>content/games</b> 폴더에 게임마다 JSON 파일 하나로 있어요. ‘고치기’를 누르면 GitHub 편집 화면이 열리고, 저장(Commit)하면 1~2분 뒤 사이트에 반영돼요. 새 게임은 파일 이름과 <b>slug</b>를 같은 영문 이름으로, <b>code</b>는 다른 게임과 겹치지 않는 영문 2~3자로 정해 주세요. 검수를 마친 게임은 <b>status</b>를 "checked"로 바꾸고 <b>checked</b>에 날짜와 확인한 사람을 적어 주세요.</div>' +
      (repo ? '<div class="row-btns"><a class="btn btn-main" href="' + newURL + '" target="_blank" rel="noopener">새 게임 원고 만들기</a><a class="btn btn-ghost" href="https://github.com/' + repo + '/tree/' + branch + '/content" target="_blank" rel="noopener">원고 폴더 열기</a></div>' : '<p class="notice">site.config.json에 githubRepo를 적으면 고치기 버튼이 생겨요.</p>') +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>게임</th><th>상태</th><th>채운 항목</th><th></th></tr></thead><tbody>' +
      list.map(function (g) {
        return '<tr><td><a href="/games/' + g.s + '/">' + esc(g.n) + '</a></td>' +
          '<td><span class="badge ' + (g.st === 'checked' ? 'checked">검수 완료' : g.st === 'reviewed' ? 'checked">자료 대조' : 'draft">검수 중') + '</span>' + (g.ck && g.ck.date ? '<br><small class="muted">' + esc(g.ck.date) + '</small>' : '') + '</td>' +
          '<td>' + g.done + ' / 6</td>' +
          '<td>' + (repo ? '<a class="link-btn" href="' + ghEdit(g.s) + '" target="_blank" rel="noopener">고치기</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted small">채운 항목은 구성물, 준비하기, 따라 해 보기, 자세한 규칙, 헷갈리는 상황, 자주 묻는 질문 여섯 가지 가운데 내용이 있는 것의 수예요.</p>';
  }
  // ---------- 공용 ----------
  var post = function (path, body) { return api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }); };
  var chipsHTML = function (cur, list, attr) {
    return '<div class="row-btns" role="radiogroup">' + list.map(function (x) { return '<button type="button" class="chip" role="radio" aria-checked="' + (cur === x[0]) + '" ' + attr + '="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  };

  // ---------- 문의함 ----------
  var IKIND = { partner: '제휴·협업', ad: '광고·입점', store: '매장 등록', game: '게임 추가', bug: '오류·불편', etc: '그 밖의 문의' };
  var inqStatus = 'new';
  function loadInq() {
    var p = $('#a-inq');
    p.innerHTML = chipsHTML(inqStatus, [['new', '새 문의'], ['done', '답변함'], ['all', '전체']], 'data-ist') + '<div data-list><p class="muted">불러오는 중이에요</p></div>';
    RS.radioGroup($('[role="radiogroup"]', p), function (b) { inqStatus = b.dataset.ist; fetchInq(); });
    fetchInq();
  }
  function fetchInq() {
    var box = $('#a-inq [data-list]');
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
  $('#a-inq').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var card = b.closest('[data-id]'); if (!card) return;
    var id = card.dataset.id, memo = $('[data-memo]', card).value;
    if (b.hasAttribute('data-done') || b.hasAttribute('data-undo') || b.hasAttribute('data-save')) {
      var st = b.hasAttribute('data-done') ? 'done' : b.hasAttribute('data-undo') ? 'new' : (inqStatus === 'done' ? 'done' : $('.badge.new', card) ? 'new' : 'done');
      post('inquiries/' + id, { status: st, memo: memo }).then(function (j) {
        if (!j.ok) { RS.toast('저장하지 못했어요'); return; }
        RS.toast(b.hasAttribute('data-save') ? '메모를 저장했어요' : '옮겼어요');
        if (!b.hasAttribute('data-save') && inqStatus !== 'all') card.remove();
      });
    }
    if (b.hasAttribute('data-del')) {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더 누르면 지워요'; return; }
      api('inquiries/' + id, { method: 'DELETE' }).then(function (j) { if (j.ok) { card.remove(); RS.toast('지웠어요'); } });
    }
  });

  // ---------- 쇼핑 링크 ----------
  var shopItems = null;
  function loadShop() {
    var p = $('#a-shop');
    p.innerHTML = '<p class="muted">불러오는 중이에요</p>';
    Promise.all([fetch('/data/shop.json').then(function (r) { return r.json(); }), api('shop?days=30')]).then(function (r) {
      shopItems = r[0].items;
      var j = r[1];
      if (j._status !== 200) { p.innerHTML = '<p class="notice">' + esc(j.message || '불러오지 못했어요.') + '</p>'; return; }
      var link = {}, clicks = {};
      j.links.forEach(function (l) { link[l.id] = l.url; });
      j.clicks.forEach(function (c) { clicks[c.id] = c.n; });
      var ids = Object.keys(shopItems).sort(function (a, b) { return (clicks[b] || 0) - (clicks[a] || 0) || (link[a] ? 1 : 0) - (link[b] ? 1 : 0); });
      var done = ids.filter(function (id) { return link[id]; }).length;
      var total = ids.reduce(function (n, id) { return n + (clicks[id] || 0); }, 0);
      p.innerHTML = '<div class="stat-grid"><div class="stat"><b>' + done + ' / ' + ids.length + '</b><span>파트너스 링크 넣음</span></div><div class="stat"><b>' + total + '</b><span>최근 30일 구매 버튼</span></div></div>' +
        '<div class="notice"><b>파트너스 링크 넣는 순서</b><ol><li>‘쿠팡에서 찾기’를 눌러 알맞은 상품 페이지를 열고 주소를 복사해요.</li><li>쿠팡 파트너스 → 링크 생성 → 간편 링크 만들기에 그 주소를 붙여 넣고 단축 링크(https://link.coupang.com/a/...)를 만들어요.</li><li>아래 칸에 붙여 넣고 ‘저장’을 누르면 바로 사이트의 구매 버튼에 쓰여요.</li></ol>링크를 넣지 않은 상품은 쿠팡 검색 결과로 가요. 이때는 수수료가 생기지 않으니, 많이 눌린 상품(위쪽)부터 채워 주세요.</div>' +
        (j.api ? '<div class="row-btns"><button type="button" class="btn btn-main" data-auto>쿠팡 API로 빈 링크 자동 만들기</button></div>' : '<p class="muted small">쿠팡 파트너스 API 승인을 받은 뒤 Cloudflare에 COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY를 넣으면 빈 링크를 한 번에 만들 수 있어요.</p>') +
        (j.sources.length ? '<h2 class="h3">어디서 많이 눌렀나요 (최근 30일)</h2><p class="small">' + j.sources.map(function (s) { return esc(s.src || '바로 들어옴') + ' ' + s.n; }).join(' · ') + '</p>' : '') +
        '<div class="tbl-wrap"><table class="tbl shop-tbl"><thead><tr><th>상품</th><th>30일 클릭</th><th>파트너스 링크</th></tr></thead><tbody>' +
        ids.map(function (id) {
          var it = shopItems[id];
          var search = 'https://www.coupang.com/np/search?q=' + encodeURIComponent(it.q);
          return '<tr data-id="' + id + '"><td><b>' + esc(it.n) + '</b><br><a class="small" href="' + search + '" target="_blank" rel="noopener">쿠팡에서 찾기</a> · <span class="small muted">' + id + '</span></td><td>' + (clicks[id] || 0) + '</td>' +
            '<td><div class="shop-in"><input data-url value="' + esc(link[id] || '') + '" placeholder="https://link.coupang.com/a/..." inputmode="url"><button type="button" class="btn btn-sub btn-sm" data-save>저장</button></div></td></tr>';
        }).join('') + '</tbody></table></div>';
    });
  }
  $('#a-shop').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-auto')) {
      b.disabled = true; b.textContent = '만드는 중이에요';
      post('shop/auto').then(function (j) { RS.toast(j.ok ? '링크 ' + j.made + '개를 만들었어요' : (j.message || '만들지 못했어요')); loadShop(); });
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
  function loadCm() {
    var p = $('#a-cm');
    p.innerHTML = '<p class="muted">불러오는 중이에요</p>';
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
      p.innerHTML = '<div class="stat-grid"><div class="stat"><b>' + c.userCount + '</b><span>회원</span></div><div class="stat"><b>' + f.flags.length + '</b><span>확인할 신고</span></div><div class="stat"><b>' + (c.reviews || []).length + '</b><span>최근 후기</span></div></div>' +
        '<form class="cm-form" data-sysform style="max-width:640px;margin:18px 0"><h2 class="h3" style="margin-top:0">공지·투표 올리기</h2><p class="muted small">‘룰룰 운영팀’ 이름으로 올라가요. 고정하면 게시판과 커뮤니티 홈 맨 위에 보여요.</p>' +
        '<div class="row-btns" role="radiogroup" data-syscat><button type="button" class="chip" role="radio" aria-checked="true" data-c="notice">공지</button><button type="button" class="chip" role="radio" aria-checked="false" data-c="poll">투표</button></div>' +
        '<label class="field"><span>제목</span><input name="title" maxlength="60" required></label>' +
        '<label class="field"><span>내용</span><textarea name="body" rows="5" maxlength="5000"></textarea></label>' +
        '<div class="field" data-sysopts hidden><span>투표 보기 (한 줄에 하나, 2~6개)</span><textarea name="options" rows="4" placeholder="윷놀이\n공기놀이\n제기차기"></textarea><label class="field field-inline"><span>기간</span><select name="days"><option value="3">3일</option><option value="7" selected>7일</option><option value="14">14일</option><option value="30">30일</option></select></label></div>' +
        '<label class="check"><input type="checkbox" name="pinned" checked><span>맨 위에 고정하기</span></label>' +
        '<p class="form-msg" role="status"></p><button class="btn btn-main" type="submit">올리기</button></form>' +
        '<h2 class="h3">확인할 신고</h2>' + (f.flags.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>대상</th><th>신고</th><th>사유</th><th></th></tr></thead><tbody>' + f.flags.map(function (x) {
          return '<tr><td>' + TARGET[x.target] + ' · <a href="' + linkOf(x.target, x.target_id, x.parent) + '" target="_blank">' + esc(x.label || '(지워짐)') + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : '') + '</td><td>' + x.n + '</td><td class="small">' + esc(x.reasons || '') + '</td><td>' + act(x.target, x.target_id, x.hidden) +
            '<span class="row-btns" data-t="' + x.target + '" data-i="' + x.target_id + '"><button type="button" class="btn btn-ghost btn-sm" data-dismiss>문제없음</button></span></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">확인할 신고가 없어요.</p>') +
        '<h2 class="h3">최근 글</h2>' + table(c.posts, function (x) { return [esc(CATN[x.cat] || x.cat), '<a href="/community/post/?id=' + x.id + '" target="_blank">' + esc(x.title) + '</a>' + (x.pinned ? ' <span class="badge">고정</span>' : '') + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('post', x.id, x.hidden) + '<span class="row-btns" data-pin="' + x.id + '"><button type="button" class="btn btn-ghost btn-sm" data-pinv="' + (x.pinned ? 0 : 1) + '">' + (x.pinned ? '고정 풀기' : '고정') + '</button></span>']; }) +
        '<h2 class="h3">최근 후기</h2>' + table(c.reviews, function (x) { return [esc(gamesBySlug[x.slug] ? gamesBySlug[x.slug].n : x.slug) + ' · ' + '★'.repeat(x.rating), '<a href="/games/' + x.slug + '/#reviews" target="_blank">' + esc(x.body || '(별점만)') + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('review', x.id, x.hidden)]; }) +
        '<h2 class="h3">최근 일정</h2>' + table(c.events, function (x) { return [x.kind === 'regular' ? '정모' : '번개', '<a href="/community/event/?id=' + x.id + '" target="_blank">' + esc(x.title) + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('event', x.id, x.hidden)]; }) +
        '<h2 class="h3">최근 모임</h2>' + table(c.clubs, function (x) { return [esc(x.region), '<a href="/community/club/?id=' + x.id + '" target="_blank">' + esc(x.title) + '</a>' + (x.hidden ? ' <span class="badge">가려짐</span>' : ''), esc(x.nick), act('club', x.id, x.hidden)]; }) +
        '<h2 class="h3">최근 가입한 회원</h2>' + table(c.users, function (u) { return [esc(u.login), esc(u.nick) + (u.status === 'banned' ? ' <span class="badge">제한</span>' : ''), esc(fmtTime(u.created_at)), userAct(u)]; }) +
        '<p class="muted small">임시 비밀번호는 비밀번호를 잊은 회원이 문의했을 때 본인인지 확인한 뒤 알려 주세요. 회원은 로그인 후 내 정보에서 비밀번호를 바꿀 수 있어요.</p>';
      var sf = $('[data-sysform]', p), syscat = 'notice';
      RS.radioGroup($('[data-syscat]', sf), function (b) { syscat = b.dataset.c; $('[data-sysopts]', sf).hidden = syscat !== 'poll'; });
      sf.addEventListener('submit', function (e) {
        e.preventDefault();
        var m = $('.form-msg', sf);
        var el = sf.elements;
        var body = { cat: syscat, title: el.title.value.trim(), body: el.body.value, pinned: el.pinned.checked, days: Number(el.days.value), options: el.options.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean) };
        post('community/post', body).then(function (j) {
          if (!j.ok) { m.className = 'form-msg err'; m.textContent = j.message || '올리지 못했어요.'; return; }
          RS.toast('올렸어요'); loadCm();
        });
      });
    });
  }
  function table(rows, cols) {
    if (!rows || !rows.length) return '<p class="muted">없어요.</p>';
    return '<div class="tbl-wrap"><table class="tbl"><tbody>' + rows.map(function (r) { return '<tr>' + cols(r).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  $('#a-cm').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var box = b.closest('[data-t]'), ub = b.closest('[data-u]'), pin = b.closest('[data-pin]');
    if (pin) { post('community/pin', { id: Number(pin.dataset.pin), pinned: b.dataset.pinv === '1' }).then(function (j) { RS.toast(j.ok ? (b.dataset.pinv === '1' ? '고정했어요' : '고정을 풀었어요') : '바꾸지 못했어요'); loadCm(); }); return; }
    if (box) {
      var body = { target: box.dataset.t, id: Number(box.dataset.i) };
      if (b.hasAttribute('data-hide')) { body.hidden = b.dataset.hide === '1'; post('community/hide', body).then(function (j) { RS.toast(j.ok ? (body.hidden ? '가렸어요' : '다시 보이게 했어요') : '바꾸지 못했어요'); loadCm(); }); }
      if (b.hasAttribute('data-dismiss')) post('community/dismiss', body).then(function () { RS.toast('신고를 정리했어요'); loadCm(); });
      if (b.hasAttribute('data-remove')) {
        if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = '한 번 더 누르면 지워요'; return; }
        post('community/remove', body).then(function (j) { RS.toast(j.ok ? '지웠어요' : '지우지 못했어요'); loadCm(); });
      }
    }
    if (ub) {
      var a = b.dataset.ua;
      if (a === 'reset' && !confirm('이 회원의 비밀번호를 임시 비밀번호로 바꿀까요?')) return;
      post('community/user/' + ub.dataset.u, { action: a }).then(function (j) {
        if (!j.ok) { RS.toast('바꾸지 못했어요'); return; }
        if (a === 'reset') prompt('임시 비밀번호예요. 회원에게 알려 주세요.', j.temp); else { RS.toast(a === 'ban' ? '이용을 제한했어요' : '제한을 풀었어요'); loadCm(); }
      });
    }
  });
})();
