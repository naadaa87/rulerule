/* 룰룰 테이블 모드: 게임 중에 휴대폰을 테이블에 두고 쓰는 화면과 도구 */
(function () {
  'use strict';
  var RS = window.RS;
  if (!RS) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc, plain = RS.plain, store = RS.store;

  var tm = null, game = null, step = 0, wakeLock = null, sheetEl = null;
  var STEP_NAMES = ['준비', '게임 진행', '끝내기'];
  var TOOL_LABEL = { score: '점수판', timer: '타이머', dice: '주사위', first: '누가 먼저', team: '팀 나누기', yut: '윷 던지기', roles: '역할 나누기' };
  if (window.RS && RS.game && RS.game.slug === 'liar-game') TOOL_LABEL.roles = '제시어 나누기';
  var TOOL_ICON = { score: 'i-check', timer: 'i-time', dice: null, first: 'i-people', team: 'i-people', yut: null, roles: 'i-flag' };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function rand(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function icon(id) { return '<svg class="ico" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  var dieIcon = '<svg class="die" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="16" r="2" fill="currentColor"/><circle cx="16" cy="8" r="2" fill="currentColor"/><circle cx="8" cy="16" r="2" fill="currentColor"/></svg>';
  var yutIcon = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="4" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10" y="3" width="4" height="18" rx="2" fill="currentColor"/><rect x="17" y="3" width="4" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

  // ---------- 화면 켜 두기 ----------
  function setWake(on) { var w = tm && $('.tm-wake', tm); if (w) w.hidden = !on; }
  function requestWake() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l; setWake(true);
      l.addEventListener('release', function () { setWake(false); });
    }).catch(function () { setWake(false); });
  }
  document.addEventListener('visibilitychange', function () { if (tm && document.visibilityState === 'visible') requestWake(); });

  // ---------- 열고 닫기 ----------
  function open(g, fromHash) {
    if (!g || tm) return;
    game = g; step = 0;
    var tools = (g.tools || []).slice();
    ['first', 'score', 'timer', 'team'].forEach(function (t) { if (tools.indexOf(t) < 0) tools.push(t); });
    tm = el('div', 'tm');
    tm.setAttribute('role', 'dialog');
    tm.setAttribute('aria-modal', 'true');
    tm.setAttribute('aria-label', g.name + ' 테이블 모드');
    if (store.get('rs-night', false)) tm.classList.add('night');
    tm.style.setProperty('--tm-size', store.get('rs-size', 1));
    tm.innerHTML =
      '<div class="tm-top"><p class="tm-name">' + esc(g.name) + '</p>' +
      '<span class="tm-wake" hidden>화면 켜 둠</span>' +
      '<button class="icon-btn" type="button" data-size aria-label="글씨 크기 바꾸기"><b style="font-size:18px">가</b></button>' +
      '<button class="icon-btn" type="button" data-night aria-label="밤 화면 켜고 끄기"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>' +
      '<button class="icon-btn" type="button" data-exit aria-label="테이블 모드 닫기">' + icon('i-close') + '</button></div>' +
      '<div class="tm-steps">' + STEP_NAMES.map(function (n, i) { return '<button type="button" data-step="' + i + '"><i></i><span>' + n + '</span></button>'; }).join('') + '</div>' +
      '<div class="tm-main"></div>' +
      '<div class="tm-tools">' + tools.map(function (t) {
        var ic = t === 'dice' ? dieIcon : (t === 'yut' ? yutIcon : icon(TOOL_ICON[t] || 'i-check'));
        return '<button type="button" class="tm-tool" data-tool="' + t + '">' + ic + '<span>' + TOOL_LABEL[t] + '</span></button>';
      }).join('') + '</div>';
    document.body.appendChild(tm);
    document.documentElement.style.overflow = 'hidden';
    tm.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    render();
    requestWake();
    if (!fromHash) { try { history.pushState({ tm: 1 }, '', location.pathname + location.search + '#table'); } catch (e) { /* 무시 */ } }
    RS.track('table', g.slug);
    setTimeout(function () { var b = $('[data-exit]', tm); if (b) b.focus(); }, 30);
  }

  function teardown() {
    if (!tm) return;
    closeSheet();
    tm.remove(); tm = null;
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
    var b = $('[data-table]'); if (b) b.focus();
  }
  function close() {
    if (location.hash === '#table') history.back(); else teardown();
  }
  window.addEventListener('popstate', function () { if (tm && location.hash !== '#table') teardown(); });

  function onKey(e) {
    if (e.key !== 'Escape') return;
    if (sheetEl) closeSheet(); else close();
  }

  function onClick(e) {
    var b = e.target.closest('button');
    if (!b || !tm.contains(b)) return;
    if (b.hasAttribute('data-exit')) return close();
    if (b.hasAttribute('data-night')) { tm.classList.toggle('night'); store.set('rs-night', tm.classList.contains('night')); return; }
    if (b.hasAttribute('data-size')) {
      var sizes = [1, 1.2, 1.4], cur = Number(tm.style.getPropertyValue('--tm-size')) || 1;
      var next = sizes[(sizes.indexOf(cur) + 1) % sizes.length];
      tm.style.setProperty('--tm-size', next); store.set('rs-size', next); return;
    }
    if (b.hasAttribute('data-step')) { step = Number(b.dataset.step); return render(); }
    if (b.hasAttribute('data-next')) { if (step < 2) { step++; render(); } else close(); return; }
    if (b.hasAttribute('data-prev')) { if (step > 0) { step--; render(); } return; }
    if (b.hasAttribute('data-help')) return openHelp();
    if (b.hasAttribute('data-restart')) { step = 0; render(); return; }
    if (b.dataset.tool) return openTool(b.dataset.tool);
  }

  function render() {
    var main = $('.tm-main', tm), g = game, s = g.summary, html = '';
    $$('.tm-steps button', tm).forEach(function (b, i) {
      if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('done', i < step);
    });
    if (step === 0) {
      html = '<div class="tm-card"><p class="tm-k">준비하기</p><p class="tm-sub" style="margin-top:6px;padding-top:0;border:0">하나씩 끝낼 때마다 눌러서 지워 가세요.</p>' +
        '<ol class="tm-list tm-check">' + g.setup.map(function (x) { return '<li tabindex="0" role="checkbox" aria-checked="false">' + fmt(x) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="tm-nav"><button type="button" class="btn btn-main" data-next>게임 시작</button></div>';
    } else if (step === 1) {
      html = '<div class="tm-card"><p class="tm-k">내 차례에 할 일</p><ol class="tm-list">' + s.turn.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ol>' +
        '<div class="tm-sub"><p class="tm-k">이기는 법</p><p style="margin-top:4px">' + fmt(s.goal) + '</p></div></div>' +
        ((g.tricky || []).length || (g.faq || []).length ? '<button type="button" class="btn btn-sub tm-help" data-help>이럴 땐? 자주 막히는 상황</button>' : '') +
        '<div class="tm-nav"><button type="button" class="btn btn-sub" data-prev>준비로</button><button type="button" class="btn btn-main" data-next>끝내기 단계</button></div>';
    } else {
      html = '<div class="tm-card"><p class="tm-k">끝나는 때</p><p class="tm-big">' + fmt(s.end) + '</p>' +
        ((g.scoring || []).length ? '<div class="tm-sub"><p class="tm-k">점수와 승패</p><ul class="list" style="margin-top:8px">' + g.scoring.map(function (x) { return '<li>' + fmt(x) + '</li>'; }).join('') + '</ul></div>' : '') +
        '</div><div class="tm-nav"><button type="button" class="btn btn-sub" data-restart>한 판 더</button><button type="button" class="btn btn-main" data-next>테이블 모드 닫기</button></div>';
    }
    main.innerHTML = html;
    main.scrollTop = 0;
    $$('.tm-check li', main).forEach(function (li) {
      var toggle = function () { var on = li.classList.toggle('done'); li.setAttribute('aria-checked', String(on)); };
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    });
  }

  // ---------- 시트 ----------
  function openSheet(title, body) {
    closeSheet();
    sheetEl = el('div', 'tsheet');
    sheetEl.setAttribute('role', 'dialog');
    sheetEl.setAttribute('aria-modal', 'true');
    sheetEl.setAttribute('aria-label', title);
    var inner = el('div', 'tsheet-body');
    var head = el('div', 'tsheet-head', '<h2>' + esc(title) + '</h2><button type="button" class="icon-btn" aria-label="닫기">' + icon('i-close') + '</button>');
    inner.appendChild(head);
    inner.appendChild(body);
    sheetEl.appendChild(inner);
    sheetEl.addEventListener('click', function (e) { if (e.target === sheetEl) closeSheet(); });
    $('button', head).addEventListener('click', closeSheet);
    tm.appendChild(sheetEl);
    setTimeout(function () { var f = $('button, input, textarea, select', inner); if (f) f.focus(); }, 30);
  }
  function closeSheet() {
    if (!sheetEl) return;
    if (sheetEl._cleanup) sheetEl._cleanup();
    sheetEl.remove(); sheetEl = null;
  }

  function openHelp() {
    var g = game, b = el('div');
    var items = (g.tricky || []).concat(g.faq || []);
    b.innerHTML = '<div class="qa">' + items.map(function (x) { return '<div class="qa-item"><p class="qa-q">' + fmt(x.q) + '</p><p class="qa-a">' + fmt(x.a) + '</p></div>'; }).join('') + '</div>' +
      '<p class="muted small" style="margin-top:12px">여기에 없는 상황이면 <button type="button" class="link-btn" data-report="' + esc(g.slug) + '">알려 주세요</button>. 설명에 더할게요.</p>';
    openSheet('이럴 땐?', b);
  }

  // ---------- 도구 ----------
  function openTool(t) {
    var fn = { score: toolScore, timer: toolTimer, dice: toolDice, first: toolFirst, team: toolTeam, yut: toolYut, roles: toolRoles }[t];
    if (fn) fn();
  }

  // 점수판
  function toolScore() {
    var key = 'rs-score-' + game.slug;
    var startN = Math.min(Math.max(game.players[0], 2), 6);
    var st = store.get(key, null);
    if (!st || !st.players) { st = { players: [] }; for (var i = 0; i < startN; i++) st.players.push({ n: (i + 1) + '번', v: 0 }); }
    var b = el('div');
    var draw = function () {
      b.innerHTML = '<div class="score-list">' + st.players.map(function (p, i) {
        return '<div class="score-row"><input aria-label="이름" value="' + esc(p.n) + '" data-name="' + i + '" maxlength="12">' +
          '<div class="score-ctrl"><button type="button" data-d="-1" data-i="' + i + '" aria-label="' + esc(p.n) + ' 1점 빼기">−</button>' +
          '<span class="score-val" aria-live="polite">' + p.v + '</span>' +
          '<button type="button" data-d="1" data-i="' + i + '" aria-label="' + esc(p.n) + ' 1점 더하기">+</button>' +
          '<button type="button" data-d="5" data-i="' + i + '" aria-label="' + esc(p.n) + ' 5점 더하기">+5</button></div></div>';
      }).join('') + '</div>' +
        '<div class="row-btns"><button type="button" class="btn btn-sub" data-add>사람 더하기</button><button type="button" class="btn btn-sub" data-del>한 명 빼기</button><button type="button" class="btn btn-ghost" data-zero>모두 0점으로</button></div>';
    };
    var save = function () { store.set(key, st); };
    draw();
    b.addEventListener('click', function (e) {
      var x = e.target.closest('button'); if (!x) return;
      if (x.dataset.d) { var p = st.players[Number(x.dataset.i)]; p.v += Number(x.dataset.d); save(); draw(); return; }
      if (x.hasAttribute('data-add') && st.players.length < 12) st.players.push({ n: (st.players.length + 1) + '번', v: 0 });
      if (x.hasAttribute('data-del') && st.players.length > 1) st.players.pop();
      if (x.hasAttribute('data-zero')) st.players.forEach(function (p) { p.v = 0; });
      save(); draw();
    });
    b.addEventListener('input', function (e) {
      if (e.target.dataset.name) { st.players[Number(e.target.dataset.name)].n = e.target.value; save(); }
    });
    openSheet('점수판', b);
  }

  // 타이머
  var timer = { left: 60, total: 60, run: false, id: null, up: false, beeped: false };
  function beep() {
    try {
      var A = window.AudioContext || window.webkitAudioContext; var ctx = new A();
      [0, 0.35, 0.7].forEach(function (t) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.26);
      });
    } catch (e) { /* 소리를 못 내는 기기 */ }
    if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
  }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function toolTimer() {
    var b = el('div');
    b.innerHTML = '<div class="chips" role="radiogroup" aria-label="시간">' + [30, 60, 90, 120, 180, 300].map(function (s) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (!timer.up && timer.total === s) + '" data-s="' + s + '">' + (s < 60 ? s + '초' : (s % 60 ? mmss(s) : s / 60 + '분')) + '</button>';
    }).join('') + '<button type="button" class="chip" role="radio" aria-checked="' + timer.up + '" data-s="up">스톱워치</button></div>' +
      '<p class="timer-face" aria-live="off">' + mmss(timer.left) + '</p>' +
      '<div class="row-btns" style="justify-content:center"><button type="button" class="btn btn-main" data-go>' + (timer.run ? '멈추기' : '시작') + '</button><button type="button" class="btn btn-sub" data-reset>처음으로</button></div>';
    var face = $('.timer-face', b), go = $('[data-go]', b);
    var paint = function () { face.textContent = mmss(timer.left); go.textContent = timer.run ? '멈추기' : '시작'; };
    var tick = function () {
      if (timer.up) timer.left += 1; else timer.left -= 1;
      if (!timer.up && timer.left <= 0) {
        timer.left = 0; stop();
        beep(); face.classList.add('ring'); RS.toast('시간이 다 됐어요');
        setTimeout(function () { face.classList.remove('ring'); }, 2000);
      }
      if (document.body.contains(face)) paint();
    };
    var stop = function () { timer.run = false; clearInterval(timer.id); timer.id = null; paint(); };
    RS.radioGroup($('.chips', b), function (x) {
      stop();
      if (x.dataset.s === 'up') { timer.up = true; timer.total = 0; timer.left = 0; } else { timer.up = false; timer.total = Number(x.dataset.s); timer.left = timer.total; }
      paint();
    });
    go.addEventListener('click', function () {
      if (timer.run) return stop();
      if (!timer.up && timer.left <= 0) timer.left = timer.total;
      timer.run = true; timer.id = setInterval(tick, 1000); paint();
    });
    $('[data-reset]', b).addEventListener('click', function () { stop(); timer.left = timer.up ? 0 : timer.total; paint(); });
    openSheet('타이머', b);
  }

  // 주사위
  var PIP = {
    1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]]
  };
  function face(n, red) { return '<div class="dface' + (red ? ' red' : '') + '" role="img" aria-label="' + n + '">' + PIP[n].map(function (p) { return '<i style="left:' + p[0] + '%;top:' + p[1] + '%"></i>'; }).join('') + '</div>'; }
  function toolDice() {
    var count = store.get('rs-dice', 2);
    var b = el('div');
    b.innerHTML = '<div class="chips" role="radiogroup" aria-label="주사위 개수">' + [1, 2, 3, 4, 5].map(function (n) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (n === count) + '" data-n="' + n + '">' + n + '개</button>';
    }).join('') + '</div><div class="dice-row" aria-live="polite"></div><p class="big-result" aria-live="polite"></p>' +
      '<div class="row-btns" style="justify-content:center"><button type="button" class="btn btn-main" data-roll>굴리기</button></div>';
    var row = $('.dice-row', b), res = $('.big-result', b);
    var roll = function () {
      var vals = []; for (var i = 0; i < count; i++) vals.push(rand(6) + 1);
      row.innerHTML = vals.map(function (v) { return face(v); }).join('');
      row.classList.remove('rolling'); void row.offsetWidth; row.classList.add('rolling');
      res.textContent = count > 1 ? '합 ' + vals.reduce(function (a, c) { return a + c; }, 0) : '';
    };
    RS.radioGroup($('.chips', b), function (x) { count = Number(x.dataset.n); store.set('rs-dice', count); roll(); });
    $('[data-roll]', b).addEventListener('click', roll);
    openSheet('주사위', b);
    roll();
  }

  // 누가 먼저
  function toolFirst() {
    var b = el('div');
    b.innerHTML = '<div class="finger-pad" aria-label="손가락 올리는 곳">모두 화면에 손가락을 하나씩 올려 주세요.<br>2초 동안 그대로 두면 한 명을 골라요.</div>' +
      '<p class="muted small" style="margin-top:10px">손가락으로 고르기가 어렵다면 번호로 뽑아요.</p>' +
      '<div class="row-btns"><label class="field" style="flex:1"><span>모인 사람</span><input type="number" min="2" max="20" value="' + Math.max(game.players[0], 2) + '" inputmode="numeric" data-n></label><button type="button" class="btn btn-main" data-pick>번호 뽑기</button></div>' +
      '<p class="big-result" aria-live="polite" data-out></p>';
    var pad = $('.finger-pad', b), out = $('[data-out]', b);
    var touches = new Map(), timerId = null, decided = false;
    var reset = function () { touches.forEach(function (t) { t.el.remove(); }); touches.clear(); decided = false; };
    var arm = function () {
      clearTimeout(timerId);
      if (decided || touches.size < 2) return;
      timerId = setTimeout(function () {
        var ids = Array.from(touches.keys()), win = ids[rand(ids.length)];
        touches.forEach(function (t, id) { t.el.classList.add(id === win ? 'win' : 'lose'); });
        decided = true;
        if (navigator.vibrate) navigator.vibrate(200);
      }, 2000);
    };
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (decided && touches.size === 0) reset();
      if (decided) return;
      var r = pad.getBoundingClientRect(), f = el('div', 'finger');
      f.style.left = (e.clientX - r.left) + 'px'; f.style.top = (e.clientY - r.top) + 'px';
      pad.appendChild(f);
      touches.set(e.pointerId, { el: f });
      try { pad.setPointerCapture(e.pointerId); } catch (x) { /* 무시 */ }
      arm();
    });
    pad.addEventListener('pointermove', function (e) {
      var t = touches.get(e.pointerId); if (!t || decided) return;
      var r = pad.getBoundingClientRect();
      t.el.style.left = (e.clientX - r.left) + 'px'; t.el.style.top = (e.clientY - r.top) + 'px';
    });
    var up = function (e) {
      var t = touches.get(e.pointerId); if (!t) return;
      if (!decided) { t.el.remove(); touches.delete(e.pointerId); arm(); }
      else { touches.delete(e.pointerId); if (touches.size === 0) setTimeout(function () { if (touches.size === 0) { pad.querySelectorAll('.finger').forEach(function (x) { x.remove(); }); decided = false; } }, 1500); }
    };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    $('[data-pick]', b).addEventListener('click', function () {
      var n = Math.min(Math.max(parseInt($('[data-n]', b).value, 10) || 2, 2), 20);
      out.textContent = n + '명 가운데 ' + (rand(n) + 1) + '번부터';
    });
    openSheet('누가 먼저 할까요?', b);
    sheetEl._cleanup = function () { clearTimeout(timerId); };
  }

  // 팀 나누기
  function toolTeam() {
    var names = store.get('rs-names', '');
    var b = el('div');
    b.innerHTML = '<label class="field"><span>이름 (한 줄에 한 명)</span><textarea rows="5" data-names placeholder="지현&#10;성민&#10;정숙&#10;현우">' + esc(names) + '</textarea></label>' +
      '<p class="muted small">이름 대신 숫자만 써도 돼요. 예: 8 이라고 쓰면 1번부터 8번까지 나눠요.</p>' +
      '<p class="picker-label">몇 팀으로 나눌까요?</p><div class="chips" role="radiogroup" aria-label="팀 수">' + [2, 3, 4].map(function (n) { return '<button type="button" class="chip" role="radio" aria-checked="' + (n === 2) + '" data-t="' + n + '">' + n + '팀</button>'; }).join('') + '</div>' +
      '<div class="row-btns"><button type="button" class="btn btn-main" data-mix>섞어서 나누기</button></div><div class="team-out" aria-live="polite"></div>';
    var teams = 2;
    RS.radioGroup($('.chips', b), function (x) { teams = Number(x.dataset.t); });
    $('[data-mix]', b).addEventListener('click', function () {
      var raw = $('[data-names]', b).value.trim();
      store.set('rs-names', raw);
      var list = /^\d+$/.test(raw) ? Array.from({ length: Math.min(Number(raw), 40) }, function (_, i) { return (i + 1) + '번'; }) : raw.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (list.length < teams) { $('.team-out', b).innerHTML = '<p class="muted">팀 수보다 사람이 많아야 해요.</p>'; return; }
      var mixed = shuffle(list), groups = [];
      for (var i = 0; i < teams; i++) groups.push([]);
      mixed.forEach(function (n, i) { groups[i % teams].push(n); });
      $('.team-out', b).innerHTML = groups.map(function (gp, i) { return '<div class="team"><b>' + (i + 1) + '팀</b> ' + gp.map(esc).join(', ') + '</div>'; }).join('');
    });
    openSheet('팀 나누기', b);
  }

  // 윷 던지기
  function toolYut() {
    var useBack = store.get('rs-backdo', false), history = [];
    var b = el('div');
    b.innerHTML = '<div class="yut-row" aria-hidden="true"></div><p class="big-result" aria-live="polite">던져 보세요</p>' +
      '<p class="center muted small" data-again></p>' +
      '<div class="row-btns" style="justify-content:center"><button type="button" class="btn btn-main" data-throw>윷 던지기</button></div>' +
      '<div class="house-list" style="margin-top:16px"><label><input type="checkbox" data-back' + (useBack ? ' checked' : '') + '><span><b>빽도 쓰기</b><small>× 표시한 윷가락 하나만 평평한 면이 보이면 한 칸 뒤로 가요.</small></span></label></div>' +
      '<p class="muted small" data-hist></p>';
    var row = $('.yut-row', b), res = $('.big-result', b), again = $('[data-again]', b), hist = $('[data-hist]', b);
    var draw = function (flat) { row.innerHTML = flat.map(function (f, i) { return '<div class="yut' + (f ? '' : ' round') + (i === 0 && useBack && f ? ' mark' : '') + '"></div>'; }).join(''); };
    draw([true, true, false, false]);
    $('[data-back]', b).addEventListener('change', function (e) { useBack = e.target.checked; store.set('rs-backdo', useBack); });
    $('[data-throw]', b).addEventListener('click', function () {
      var flat = [0, 1, 2, 3].map(function () { return rand(2) === 1; });
      var n = flat.filter(Boolean).length, name;
      if (n === 0) name = '모';
      else if (n === 1) name = (useBack && flat[0]) ? '빽도' : '도';
      else name = ['', '도', '개', '걸', '윷'][n];
      draw(flat);
      row.classList.remove('rolling'); void row.offsetWidth; row.classList.add('rolling');
      var moves = { '빽도': '한 칸 뒤로', '도': '1칸', '개': '2칸', '걸': '3칸', '윷': '4칸', '모': '5칸' }[name];
      res.textContent = name + ' (' + moves + ')';
      again.textContent = (name === '윷' || name === '모') ? '한 번 더 던져요!' : '';
      history.unshift(name); history = history.slice(0, 8);
      hist.textContent = '지난 결과: ' + history.join(', ');
      if (navigator.vibrate) navigator.vibrate(60);
    });
    openSheet('윷 던지기', b);
  }

  // 비밀 역할 나누기 (마피아, 아발론, 라이어 게임)
  var LIAR_WORDS = {
    '음식': ['김치찌개', '떡볶이', '짜장면', '삼겹살', '비빔밥', '치킨', '김밥', '라면', '냉면', '피자', '초밥', '순대', '붕어빵', '마라탕', '팥빙수'],
    '동물': ['기린', '펭귄', '고양이', '코끼리', '다람쥐', '거북이', '캥거루', '돌고래', '부엉이', '사자', '판다', '고슴도치', '낙타', '문어', '앵무새'],
    '장소': ['찜질방', '놀이공원', '편의점', '도서관', '공항', '병원', '수영장', '노래방', 'PC방', '캠핑장', '결혼식장', '지하철', '학교 운동장', '미용실', '시장'],
    '직업': ['소방관', '요리사', '선생님', '의사', '택배 기사', '유튜버', '경찰', '미용사', '농부', '조종사', '바리스타', '사진작가', '기자', '수의사', '마술사'],
    '물건': ['우산', '칫솔', '리모컨', '안경', '이어폰', '냉장고', '선풍기', '가위', '베개', '거울', '손목시계', '지갑', '전자레인지', '연필', '캐리어'],
    '운동': ['축구', '수영', '볼링', '탁구', '스키', '태권도', '배드민턴', '야구', '줄넘기', '등산', '골프', '농구', '씨름', '스케이트', '요가']
  };
  // 받침이 있으면 ‘이에요’, 없으면 ‘예요’
  function iyeyo(w) { var c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? '이에요' : '예요'); }
  var ROLE_SETS = {
    mafia: {
      min: 5, max: 16, countLabel: '역할 받을 사람 (진행자 빼고)',
      intro: '진행자 한 명을 정하고, 나머지 사람에게 역할을 비밀스럽게 나눠요. 휴대폰을 돌려 가며 자기 역할만 확인해요.',
      build: function (n) {
        var mafia = n <= 7 ? 1 : (n <= 11 ? 2 : 3), roles = [];
        for (var i = 0; i < mafia; i++) roles.push('마피아');
        roles.push('경찰', '의사');
        while (roles.length < n) roles.push('시민');
        return roles;
      },
      desc: {
        '마피아': '밤마다 다른 마피아와 함께 한 사람을 고릅니다. 낮에는 시민인 척하세요.',
        '경찰': '밤마다 한 사람을 가리켜 마피아인지 진행자에게 확인받아요.',
        '의사': '밤마다 한 사람을 가리켜 마피아의 공격에서 지켜요.',
        '시민': '낮 토론과 투표로 마피아를 찾아내세요.'
      },
      finalLead: '진행자는 아래 밤 대본을 천천히 읽어 주세요.',
      script: ['모두 눈을 감아요.', '마피아는 눈을 떠서 서로 확인하고, 오늘 밤 고를 사람을 손짓으로 정한 뒤 눈을 감아요.', '의사는 눈을 떠서 지킬 사람을 가리키고 눈을 감아요.', '경찰은 눈을 떠서 한 사람을 가리켜요. 진행자는 마피아면 고개를 끄덕여 알려 줘요.', '모두 눈을 떠요. 진행자가 밤에 일어난 일을 알려요.']
    },
    avalon: {
      min: 5, max: 10, countLabel: '모인 사람', opts: [['percival', '퍼시벌과 모르가나 넣기']],
      intro: '휴대폰 한 대로 역할을 비밀스럽게 나눠요. 한 사람씩 돌려 가며 자기 역할만 확인해요. 역할 카드가 있으면 카드를 쓰셔도 돼요.',
      build: function (n, o) {
        var evil = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 }[n], good = n - evil;
        var g = ['멀린'], e = ['암살자'];
        if (o.percival) { g.push('퍼시벌'); e.push('모르가나'); }
        while (g.length < good) g.push('충성스러운 신하');
        while (e.length < evil) e.push('모드레드의 부하');
        return g.concat(e);
      },
      desc: {
        '멀린': '선의 편. 밤에 악의 편이 누구인지 봐요. 마지막에 암살자에게 들키면 선이 져요.',
        '퍼시벌': '선의 편. 밤에 멀린이 누구인지 봐요. 모르가나가 함께 보여서 둘 중 누가 진짜인지 가려야 해요.',
        '충성스러운 신하': '선의 편. 원정을 세 번 성공시키세요.',
        '암살자': '악의 편. 선이 원정을 세 번 성공하면 멀린을 맞혀 판을 뒤집을 수 있어요.',
        '모르가나': '악의 편. 퍼시벌에게 멀린처럼 보여요.',
        '모드레드의 부하': '악의 편. 원정을 실패시키세요.'
      },
      finalLead: '한 사람이 아래 밤 대본을 천천히 읽어 주세요. 읽는 사람도 같이 눈을 감고 참여해요.',
      script: ['모두 눈을 감고 주먹을 앞으로 내밀어요.', '악의 편은 눈을 떠서 서로 확인한 뒤 눈을 감아요.', '악의 편은 엄지를 들어요. 멀린은 눈을 떠서 악의 편을 확인하고 눈을 감아요. 악의 편은 엄지를 내려요.', '(퍼시벌이 있으면) 멀린과 모르가나가 엄지를 들어요. 퍼시벌은 눈을 떠서 확인하고 눈을 감아요. 엄지를 내려요.', '모두 눈을 떠요.']
    },
    'liar-game': {
      min: 3, max: 12, countLabel: '모인 사람', topics: true,
      intro: '라이어 한 명만 빼고 모두 같은 제시어를 받아요. 휴대폰을 돌려 가며 자기 화면만 확인해요.',
      summary: function (n) { return '제시어 받는 사람 ' + (n - 1) + '명, 라이어 1명'; },
      build: function (n, o) {
        var topics = Object.keys(LIAR_WORDS);
        var topic = o.topic && LIAR_WORDS[o.topic] ? o.topic : topics[rand(topics.length)];
        var word = LIAR_WORDS[topic][rand(LIAR_WORDS[topic].length)];
        var roles = [];
        for (var i = 0; i < n - 1; i++) roles.push({ name: word, desc: '주제는 ' + iyeyo(topic) + '. 라이어가 눈치채지 못하게, 너무 쉽지 않게 설명하세요.' });
        roles.push({ name: '라이어', desc: '주제는 ' + iyeyo(topic) + '. 다른 사람의 설명을 듣고 제시어를 짐작하세요. 들키지 않는 게 먼저예요.' });
        return roles;
      },
      finalLead: '아래 순서대로 진행해요.',
      script: ['정해 둔 사람부터 한 바퀴 돌며 제시어를 한 문장으로 설명해요. 라이어도 아는 척 설명해요.', '필요하면 한 바퀴 더 돌아요.', '하나, 둘, 셋에 모두 라이어라고 생각하는 사람을 동시에 가리켜요.', '가장 많이 지목된 사람이 라이어가 아니면 라이어가 이겨요.', '라이어가 지목되면 라이어는 제시어를 한 번 맞혀 볼 수 있어요. 맞히면 라이어가, 틀리면 나머지 사람들이 이겨요.']
    }
  };
  function toolRoles() {
    var set = ROLE_SETS[game.slug];
    if (!set) return;
    var b = el('div'), opts = {}, n = Math.max(set.min, Math.min(set.max, 6));
    var summary = function () {
      if (set.summary) return set.summary(n, opts);
      var r = set.build(n, opts), c = {};
      r.forEach(function (x) { c[x] = (c[x] || 0) + 1; });
      return Object.keys(c).map(function (k) { return k + ' ' + c[k]; }).join(', ');
    };
    var config = function () {
      b.innerHTML = '<p class="muted">' + esc(set.intro) + '</p>' +
        '<div class="role-cfg" style="margin-top:12px"><div class="score-row"><b>' + esc(set.countLabel) + '</b><div class="score-ctrl"><button type="button" data-n="-1" aria-label="한 명 줄이기">−</button><span class="score-val">' + n + '</span><button type="button" data-n="1" aria-label="한 명 늘리기">+</button></div></div>' +
        (set.opts || []).map(function (o) { return '<div class="house-list" style="margin:0"><label><input type="checkbox" data-opt="' + o[0] + '"' + (opts[o[0]] ? ' checked' : '') + '><span><b>' + o[1] + '</b></span></label></div>'; }).join('') +
        (set.topics ? '<label class="field"><span>주제</span><select data-topic><option value="">아무거나</option>' + Object.keys(LIAR_WORDS).map(function (t) { return '<option' + (opts.topic === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' : '') +
        '</div><p class="muted small" style="margin-top:10px">' + esc(summary()) + '</p>' +
        '<div class="row-btns"><button type="button" class="btn btn-main" data-deal>섞어서 나누기</button></div>';
    };
    var deal = function () {
      var roles = shuffle(set.build(n, opts)).map(function (r) { return typeof r === 'string' ? { name: r, desc: (set.desc || {})[r] || '' } : r; });
      var i = 0, shown = false;
      var draw = function () {
        if (i >= roles.length) {
          b.innerHTML = '<p class="big-result" style="font-size:30px">모두 확인했어요</p><p class="muted center">' + esc(set.finalLead) + '</p>' +
            '<ol class="steps" style="margin-top:16px">' + set.script.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
            '<div class="row-btns"><button type="button" class="btn btn-sub" data-again>처음부터 다시 나누기</button></div>';
          return;
        }
        b.innerHTML = '<p class="center"><b>' + (i + 1) + '번</b> 차례예요. 다른 사람은 화면을 보지 마세요.</p>' +
          '<div class="role-card" role="button" tabindex="0" data-flip>' + (shown
            ? '<div><p class="role-name">' + esc(roles[i].name) + '</p><p>' + esc(roles[i].desc) + '</p><p class="muted small">한 번 더 누르면 가리고 다음 사람에게 넘어가요</p></div>'
            : '<p><b>눌러서 내 화면 보기</b></p>') + '</div>' +
          (shown ? '' : '<p class="muted small center">확인한 뒤 다시 눌러 가리고, 다음 사람에게 넘겨 주세요.</p>');
      };
      draw();
      b.onclick = function (e) {
        if (e.target.closest('[data-again]')) { config(); bindCfg(); return; }
        if (!e.target.closest('[data-flip]')) return;
        if (!shown) { shown = true; } else { shown = false; i++; }
        draw();
        var f = $('[data-flip]', b); if (f) f.focus();
      };
      b.onkeydown = function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-flip]')) { e.preventDefault(); e.target.click(); } };
    };
    var bindCfg = function () {
      b.onkeydown = null;
      b.onchange = function (e) { if (e.target.matches('[data-topic]')) { opts.topic = e.target.value; } };
      b.onclick = function (e) {
        var x = e.target.closest('button, input[type="checkbox"]'); if (!x) return;
        if (x.dataset.n) { n = Math.max(set.min, Math.min(set.max, n + Number(x.dataset.n))); config(); }
        else if (x.dataset.opt) { opts[x.dataset.opt] = x.checked; config(); }
        else if (x.hasAttribute('data-deal')) deal();
      };
    };
    config(); bindCfg();
    openSheet(game.slug === 'liar-game' ? '제시어 나누기' : '역할 나누기', b);
  }

  window.RS_TABLE = { open: open, close: close };

  // 주소 끝이 #table이면 바로 열기 (상자 QR 등)
  if (location.hash === '#table' && RS.game) {
    try { history.replaceState(null, '', location.pathname + location.search); history.pushState({ tm: 1 }, '', location.pathname + location.search + '#table'); } catch (e) { /* 무시 */ }
    open(RS.game, true);
  }
})();
