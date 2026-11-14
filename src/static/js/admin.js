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
  var TYPE = { view: '게임 페이지 열람', table: '테이블 모드', qr: 'QR로 들어옴', venue: '매장 페이지', speak: '소리 내 읽기', share: '링크 보내기' };

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
    if (!loaded[id]) { loaded[id] = true; ({ 'a-reports': loadReports, 'a-stats': loadStats, 'a-content': loadContent })[id](); }
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
      out.innerHTML = '<div class="stat-grid">' + ['view', 'table', 'qr', 'venue', 'speak', 'share'].map(stat).join('') + '</div>' +
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
          '<td><span class="badge ' + (g.st === 'checked' ? 'checked">검수 완료' : 'draft">검수 중') + '</span>' + (g.ck && g.ck.date ? '<br><small class="muted">' + esc(g.ck.date) + '</small>' : '') + '</td>' +
          '<td>' + g.done + ' / 6</td>' +
          '<td>' + (repo ? '<a class="link-btn" href="' + ghEdit(g.s) + '" target="_blank" rel="noopener">고치기</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted small">채운 항목은 구성물, 준비하기, 따라 해 보기, 자세한 규칙, 헷갈리는 상황, 자주 묻는 질문 여섯 가지 가운데 내용이 있는 것의 수예요.</p>';
  }
})();
