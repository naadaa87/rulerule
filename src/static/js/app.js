/* 룰룰 공통 스크립트: 메뉴, 검색과 거르기, 처음 화면 고르기, 게임 쪽 기능, 틀린 곳 알려 주기 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 공간을 못 쓰면 넘어감 */ } }
  };
  var escHTML = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var plain = function (s) { return String(s || '').replace(/\*\*(.+?)\*\*/g, '$1'); };

  // ---------- 알림 ----------
  var toastTimer;
  function toast(msg) {
    var t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function copyText(text, okMsg) {
    var done = function () { toast(okMsg || '복사했어요'); };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    }
    fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('복사하지 못했어요. 길게 눌러 직접 복사해 주세요.'); }
      document.body.removeChild(ta);
    }
  }

  function shareOrCopy(data) {
    if (navigator.share) {
      navigator.share(data).catch(function () { /* 사용자가 닫음 */ });
    } else {
      copyText((data.text ? data.text + '\n' : '') + (data.url || ''), '링크를 복사했어요');
    }
  }

  // ---------- 이용 기록 (개인 정보 없이 숫자만) ----------
  var params = new URLSearchParams(location.search);
  if (params.get('v')) { try { sessionStorage.setItem('rs-venue', params.get('v').slice(0, 40)); } catch (e) { /* 무시 */ } }
  function venue() { try { return sessionStorage.getItem('rs-venue') || ''; } catch (e) { return ''; } }
  function track(type, slug) {
    try {
      var body = JSON.stringify({ t: type, s: slug || '', v: venue() });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/event', new Blob([body], { type: 'text/plain' }));
      else fetch('/api/event', { method: 'POST', body: body, keepalive: true });
    } catch (e) { /* 기록 실패는 화면에 영향 없음 */ }
  }

  window.RS = { $: $, $$: $$, toast: toast, copyText: copyText, shareOrCopy: shareOrCopy, track: track, store: store, esc: escHTML, plain: plain };

  // ---------- 메뉴 ----------
  var menuBtn = $('.menu-btn'), nav = $('#site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
  }

  // ---------- 초성 검색 ----------
  var CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  function cho(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i) - 0xac00;
      out += (c >= 0 && c < 11172) ? CHO[Math.floor(c / 588)] : s[i];
    }
    return out;
  }
  var norm = function (s) { return String(s || '').toLowerCase().replace(/[\s·:!,.-]/g, ''); };
  function matchQuery(q, names, chos) {
    q = norm(q);
    if (!q) return true;
    if (/^[ㄱ-ㅎ]+$/.test(q)) return norm(chos || cho(names)).indexOf(q) > -1;
    return norm(names).indexOf(q) > -1;
  }

  // ---------- 게임 카드 (화면에서 만들 때) ----------
  var LEVELS = { 1: '쉬움', 2: '보통', 3: '어려움' };
  var PIPS = { 1: [[12, 12]], 2: [[8, 8], [16, 16]], 3: [[7.5, 7.5], [12, 12], [16.5, 16.5]] };
  function dieSVG(l) {
    return '<svg class="die" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      PIPS[l].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="currentColor"/>'; }).join('') + '</svg>';
  }
  function playersText(p) { return p[1] >= 99 ? p[0] + '명 이상' : (p[0] === p[1] ? p[0] + '명' : p[0] + '–' + p[1] + '명'); }
  function minutesText(m) { return m[0] === m[1] ? m[0] + '분' : m[0] + '–' + m[1] + '분'; }
  function firstSyl(n) { var s = n.replace(/^[^가-힣A-Za-z0-9]+/, ''); return (s || n).charAt(0); }
  function cardHTML(g, href) {
    return '<a class="gcard" href="' + (href || '/games/' + g.s + '/') + '">' +
      '<div class="tile" data-g="' + g.g + '" aria-hidden="true"><span>' + escHTML(firstSyl(g.n)) + '</span></div>' +
      '<span class="gcard-body"><span class="gcard-name">' + escHTML(g.n) + '</span>' +
      '<span class="gcard-one">' + escHTML(g.one) + '</span>' +
      '<span class="gcard-meta"><span><svg class="ico" aria-hidden="true"><use href="#i-people"/></svg>' + playersText(g.p) + '</span>' +
      '<span><svg class="ico" aria-hidden="true"><use href="#i-time"/></svg>' + minutesText(g.m) + '</span>' +
      '<span>' + dieSVG(g.l) + LEVELS[g.l] + '</span></span></span></a>';
  }
  window.RS.cardHTML = cardHTML;
  window.RS.matchQuery = matchQuery;
  window.RS.cho = cho;

  var gamesData = null;
  function loadGames() {
    if (gamesData) return Promise.resolve(gamesData);
    return fetch('/data/games.json').then(function (r) { return r.json(); }).then(function (d) { gamesData = d; return d; });
  }
  window.RS.loadGames = loadGames;

  // 라디오 묶음(칩, 토큰) 공통 처리
  function radioGroup(container, onChange, attr) {
    attr = attr || 'aria-checked';
    container.addEventListener('click', function (e) {
      var b = e.target.closest('[role="radio"]');
      if (!b || !container.contains(b)) return;
      $$('[role="radio"]', container).forEach(function (x) { x.setAttribute(attr, String(x === b)); });
      onChange(b);
    });
    container.addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
      var items = $$('[role="radio"]', container);
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
      n.focus(); n.click();
    });
  }
  window.RS.radioGroup = radioGroup;

  // ---------- 처음 화면: 인원과 시간으로 바로 고르기 ----------
  var picker = $('[data-picker]');
  if (picker) {
    var pick = { p: 0, m: 0 };
    var deal = $('[data-deal]'), dealTitle = $('[data-deal-title]'), dealMore = $('[data-deal-more]');
    var render = function () {
      if (!pick.p) return;
      loadGames().then(function (d) {
        var pop = d.popular || [];
        var list = d.games.filter(function (g) {
          var okP = pick.p >= 6 ? g.p[1] >= 6 : (g.p[0] <= pick.p && pick.p <= g.p[1]);
          var okM = !pick.m || g.m[0] <= pick.m;
          return okP && okM;
        }).sort(function (a, b) {
          var ia = pop.indexOf(a.s), ib = pop.indexOf(b.s);
          if (ia < 0) ia = 999; if (ib < 0) ib = 999;
          return ia - ib || a.l - b.l;
        });
        var who = pick.p >= 6 ? '6명 이상' : pick.p + '명';
        var when = pick.m ? (pick.m === 60 ? '1시간' : pick.m + '분') + ' 안에' : '';
        dealTitle.textContent = who + '이 ' + (when ? when + ' ' : '') + '할 수 있는 게임 ' + list.length + '개';
        if (!list.length) {
          deal.innerHTML = '<p class="deal-empty">조건에 맞는 게임이 없어요. 시간을 조금 늘려 보세요.</p>';
        } else {
          deal.innerHTML = list.slice(0, 6).map(function (g) { return cardHTML(g); }).join('');
          $$('.gcard', deal).forEach(function (el, i) { el.classList.add('deal-in'); el.style.animationDelay = (i * 45) + 'ms'; });
        }
        var q = new URLSearchParams();
        q.set('p', pick.p >= 6 ? '6' : String(pick.p));
        if (pick.m) q.set('m', String(pick.m));
        dealMore.href = '/games/?' + q.toString();
        dealMore.textContent = list.length > 6 ? '나머지 ' + (list.length - 6) + '개까지 보기' : '게임 찾기에서 더 고르기';
      }).catch(function () { dealTitle.textContent = '게임 목록을 불러오지 못했어요. 게임 찾기에서 골라 주세요.'; });
    };
    radioGroup($('.tokens', picker), function (b) { pick.p = Number(b.dataset.p); render(); });
    radioGroup($('.chips', picker), function (b) { pick.m = Number(b.dataset.m); render(); });
  }

  // ---------- 게임 찾기 ----------
  var finder = $('[data-finder]');
  if (finder) {
    var cards = $$('[data-list] .gcard', finder);
    var qInput = $('[data-q]', finder);
    var countEl = $('[data-count]', finder), emptyEl = $('[data-empty]', finder), resetBtn = $('[data-reset]', finder);
    var st = { q: '', p: '', m: '', l: '', k: '', t: [] };
    var setRadio = function (key, val) {
      var g = $('[data-f="' + key + '"]', finder);
      if (!g) return;
      $$('[role="radio"]', g).forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.v === val)); });
    };
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) {
        var p = c.dataset.p.split(',').map(Number), m = c.dataset.m.split(',').map(Number);
        var ok = matchQuery(st.q, c.dataset.n, c.dataset.c);
        if (ok && st.p) { var want = Number(st.p); ok = want >= 7 ? p[1] >= 7 : (p[0] <= want && want <= p[1]); }
        if (ok && st.m) ok = m[0] <= Number(st.m);
        if (ok && st.l) ok = c.dataset.l === st.l;
        if (ok && st.k) ok = st.k === 'kids' ? Number(c.dataset.age) <= 7 : c.dataset.k === st.k;
        if (ok && st.t.length) { var tags = c.dataset.t.split('|'); ok = st.t.every(function (t) { return tags.indexOf(t) > -1; }); }
        c.hidden = !ok;
        if (ok) n++;
      });
      countEl.textContent = '게임 ' + n + '개';
      emptyEl.hidden = n > 0;
      var any = st.q || st.p || st.m || st.l || st.k || st.t.length;
      resetBtn.hidden = !any;
      var u = new URLSearchParams();
      ['q', 'p', 'm', 'l', 'k'].forEach(function (k) { if (st[k]) u.set(k, st[k]); });
      if (st.t.length) u.set('t', st.t.join(','));
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u.toString() : '') + location.hash);
    };
    ['p', 'm', 'l', 'k'].forEach(function (key) {
      var g = $('[data-f="' + key + '"]', finder);
      radioGroup(g, function (b) { st[key] = b.dataset.v; apply(); });
    });
    var tagBox = $('[data-f="t"]', finder);
    if (tagBox) {
      tagBox.addEventListener('click', function (e) {
        var b = e.target.closest('[aria-pressed]');
        if (!b) return;
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        st.t = $$('[aria-pressed="true"]', tagBox).map(function (x) { return x.dataset.v; });
        apply();
      });
    }
    qInput.addEventListener('input', function () { st.q = qInput.value.trim(); apply(); });
    resetBtn.addEventListener('click', function () {
      st = { q: '', p: '', m: '', l: '', k: '', t: [] };
      qInput.value = '';
      ['p', 'm', 'l', 'k'].forEach(function (k) { setRadio(k, ''); });
      if (tagBox) $$('[aria-pressed]', tagBox).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      apply();
    });
    // 주소로 넘어온 조건 적용
    var u0 = new URLSearchParams(location.search);
    st.q = (u0.get('q') || '').slice(0, 40); qInput.value = st.q;
    ['p', 'm', 'l', 'k'].forEach(function (k) { if (u0.get(k)) { st[k] = u0.get(k); setRadio(k, st[k]); } });
    if (u0.get('t') && tagBox) {
      st.t = u0.get('t').split(',');
      $$('[aria-pressed]', tagBox).forEach(function (b) { b.setAttribute('aria-pressed', String(st.t.indexOf(b.dataset.v) > -1)); });
      $('.filter-more', finder).open = true;
    }
    apply();
    if (location.hash === '#search' && !st.q) setTimeout(function () { qInput.focus(); }, 50);
  }

  // ---------- 게임 쪽 ----------
  var gameEl = $('article.game');
  var game = null;
  if (gameEl) {
    try { game = JSON.parse($('#game-data').textContent); } catch (e) { game = null; }
    window.RS.game = game;

    // 단계 탭
    var tabs = $$('.tabs [role="tab"]', gameEl);
    var panels = $$('.panel', gameEl);
    var showTab = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) { p.classList.toggle('active', p.id === id); });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        var id = t.getAttribute('aria-controls');
        showTab(id);
        // 탭이 화면 위에 붙어 있으면 새 내용의 첫 줄로 올려 줌
        var bar = $('.tabs', gameEl), panel = document.getElementById(id);
        var y = panel.getBoundingClientRect().top + window.scrollY - (bar.getBoundingClientRect().bottom + 8);
        if (window.scrollY > y) window.scrollTo({ top: y });
      });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        showTab(n.getAttribute('aria-controls'), true);
      });
    });
    // 주소의 # 뒤를 보고 알맞은 단계를 열어요 (#house, #rule-2, #learn, #detail)
    var firstTab = tabs.length ? tabs[0].getAttribute('aria-controls') : 'summary';
    var fromHash = function () {
      var h = location.hash;
      if (h === '#table') return;
      var id = h === '#house' || h.indexOf('#rule-') === 0 || h === '#detail' ? 'detail'
        : h === '#learn' ? 'learn' : h === '#summary' ? 'summary'
        : (h === '#visual' || h.indexOf('#v-') === 0) && document.getElementById('visual') ? 'visual' : firstTab;
      showTab(id);
      if (h.indexOf('#v-') === 0 && window.RS.visGo) window.RS.visGo(Number(h.slice(3)) - 1, true);
      if (h === '#house' || h.indexOf('#rule-') === 0) setTimeout(function () { var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView(); }, 60);
    };
    // 그림으로 보기: 한 장씩 넘기기
    var vis = $('[data-vis]', gameEl);
    if (vis) {
      var visTrack = $('[data-vis-track]', vis), steps = $$('.vis-step', vis), dots = $$('[data-vis-go]', vis);
      var prevB = $('[data-vis-prev]', vis), nextB = $('[data-vis-next]', vis), countEl = $('.vis-count', vis), modeB = $('[data-vis-mode]', vis);
      var cur = 0, total = steps.length, ticking = false;
      var stepW = function () { return steps.length > 1 ? steps[1].offsetLeft - steps[0].offsetLeft : visTrack.clientWidth; };
      var paint = function () {
        dots.forEach(function (d, i) { d.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
        if (countEl) countEl.textContent = (cur + 1) + ' / ' + total;
        prevB.disabled = cur === 0;
        nextB.textContent = cur === total - 1 ? '처음부터' : '다음';
      };
      var go = function (i, instant) {
        cur = Math.max(0, Math.min(total - 1, i));
        if (!vis.classList.contains('all')) visTrack.scrollTo({ left: cur * stepW(), behavior: instant ? 'auto' : undefined });
        else steps[cur].scrollIntoView({ block: 'start' });
        paint();
      };
      window.RS.visGo = go;
      prevB.addEventListener('click', function () { go(cur - 1); });
      nextB.addEventListener('click', function () { go(cur === total - 1 ? 0 : cur + 1); });
      dots.forEach(function (d) { d.addEventListener('click', function () { go(Number(d.dataset.visGo)); }); });
      visTrack.addEventListener('scroll', function () {
        if (ticking || vis.classList.contains('all')) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; var i = Math.round(visTrack.scrollLeft / stepW()); if (i !== cur) { cur = i; paint(); } });
      }, { passive: true });
      visTrack.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      });
      modeB.addEventListener('click', function () {
        var all = vis.classList.toggle('all');
        modeB.setAttribute('aria-pressed', String(all));
        modeB.textContent = all ? '한 장씩 보기' : '모두 펼치기';
        if (!all) go(cur, true);
      });
      paint();
    }
    fromHash();
    window.addEventListener('hashchange', function () {
      if (/^#(house|learn|detail|summary|visual|rule-\d+|v-\d+)$/.test(location.hash)) fromHash();
    });

    // 구성물 체크 기억하기
    $$('.checklist[data-store]', gameEl).forEach(function (ul) {
      var key = 'rs-' + ul.dataset.store;
      var saved = store.get(key, []);
      $$('input', ul).forEach(function (cb) {
        cb.checked = saved.indexOf(Number(cb.dataset.i)) > -1;
        cb.addEventListener('change', function () {
          store.set(key, $$('input', ul).filter(function (x) { return x.checked; }).map(function (x) { return Number(x.dataset.i); }));
        });
      });
    });

    // 소리 내 읽기
    var speakBtn = $('[data-speak]', gameEl);
    if (speakBtn) {
      if (!('speechSynthesis' in window) || !game) { speakBtn.hidden = true; }
      else {
        var label = speakBtn.innerHTML;
        speakBtn.addEventListener('click', function () {
          if (speechSynthesis.speaking) { speechSynthesis.cancel(); speakBtn.innerHTML = label; return; }
          var s = game.summary;
          var text = game.name + '. 이기는 법. ' + plain(s.goal) + ' 내 차례에는. ' + s.turn.map(plain).join(' ') + ' 끝나는 때. ' + plain(s.end);
          var u = new SpeechSynthesisUtterance(text);
          u.lang = 'ko-KR'; u.rate = 1;
          var v = speechSynthesis.getVoices().filter(function (x) { return /^ko/i.test(x.lang); })[0];
          if (v) u.voice = v;
          u.onend = u.onerror = function () { speakBtn.innerHTML = label; };
          speakBtn.textContent = '읽기 멈추기';
          speechSynthesis.speak(u);
          track('speak', game.slug);
        });
      }
    }

    // 링크 보내기
    $$('[data-share]', gameEl).forEach(function (b) {
      b.addEventListener('click', function () {
        shareOrCopy({ title: document.title, text: game ? game.name + ' 하는 법, 1분 요약으로 봐요' : '', url: location.origin + location.pathname });
        if (game) track('share', game.slug);
      });
    });

    // 규칙에서 찾기
    var find = $('[data-rule-find]', gameEl);
    if (find) {
      find.addEventListener('input', function () {
        var q = norm(find.value);
        $$('.rule-sec', gameEl).forEach(function (sec) {
          var title = norm(sec.querySelector('.h3').textContent);
          var any = false;
          $$('li', sec).forEach(function (li) {
            var hit = !q || title.indexOf(q) > -1 || norm(li.textContent).indexOf(q) > -1;
            li.classList.toggle('miss', !hit);
            if (hit) any = true;
          });
          sec.classList.toggle('miss', !any);
        });
      });
    }

    // 우리 집 규칙 정하기
    var house = $('#house', gameEl);
    if (house && game) {
      var out = $('.house-out', house), card = $('.house-card', house);
      var makeText = function () {
        var picked = $$('input:checked', house).map(function (x) { return x.value; });
        var rules = (game.houseRules || []).filter(function (h) { return picked.indexOf(h.id) > -1; });
        var url = location.origin + location.pathname + (picked.length ? '?h=' + picked.join(',') : '') + '#house';
        var lines = ['우리 집 ' + game.name + ' 규칙'];
        if (rules.length) rules.forEach(function (h) { lines.push('- ' + plain(h.title) + ': ' + plain(h.text)); });
        else lines.push('- 하우스룰 없이 공식 규칙대로 해요.');
        lines.push('나머지는 룰룰 설명대로 해요.');
        return { text: lines.join('\n'), url: url, n: rules.length };
      };
      var show = function () { var r = makeText(); card.textContent = r.text + '\n' + r.url; out.hidden = false; return r; };
      $('[data-house-make]', house).addEventListener('click', function () { show(); });
      $('[data-house-share]', house).addEventListener('click', function () { var r = show(); shareOrCopy({ title: '우리 집 ' + game.name + ' 규칙', text: r.text, url: r.url }); });
      $('[data-house-copy]', house).addEventListener('click', function () { var r = show(); copyText(r.text + '\n' + r.url, '규칙 카드를 복사했어요'); });
      var pre = (params.get('h') || '').split(',').filter(Boolean);
      if (pre.length) {
        $$('input', house).forEach(function (cb) { cb.checked = pre.indexOf(cb.value) > -1; });
        show();
      }
    }

    // 테이블 모드
    $$('[data-table]').forEach(function (b) {
      b.addEventListener('click', function () { if (window.RS_TABLE) window.RS_TABLE.open(game); });
    });

    if (game) {
      track('view', game.slug);
      if (params.get('src') === 'qr') track('qr', game.slug);
    }
  }

  // ---------- 틀린 곳 알려 주기 ----------
  var dlg = $('#report-dialog'), form = $('#report-form');
  if (dlg && form) {
    var msg = $('.form-msg', form);
    var openReport = function (slug) {
      form.reset();
      msg.textContent = ''; msg.className = 'form-msg';
      if (slug === undefined || slug === null) slug = game ? game.slug : '';
      form.elements.slug.value = slug;
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      setTimeout(function () { form.elements.message.focus(); }, 30);
    };
    var closeReport = function () { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); };
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-report]');
      if (b) { e.preventDefault(); openReport(b.getAttribute('data-report') || (game ? game.slug : '')); }
    });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', closeReport); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeReport(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('button[type="submit"]', form);
      var data = {
        slug: form.elements.slug.value, kind: form.elements.kind.value,
        message: form.elements.message.value.trim(), contact: form.elements.contact.value.trim(),
        website: form.elements.website.value, page: location.pathname
      };
      if (data.message.length < 5) { msg.textContent = '조금만 더 자세히 적어 주세요. (5자 이상)'; msg.className = 'form-msg err'; return; }
      btn.disabled = true; msg.textContent = '보내는 중이에요'; msg.className = 'form-msg';
      fetch('/api/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { j.status = r.status; return j; }); })
        .then(function (j) {
          if (j.ok) {
            msg.textContent = '보내 주셔서 고마워요. 확인한 뒤 설명을 고칠게요.'; msg.className = 'form-msg ok';
            setTimeout(closeReport, 1800);
          } else {
            msg.textContent = j.message || '지금은 보낼 수 없어요. 잠시 뒤 다시 시도해 주세요.'; msg.className = 'form-msg err';
          }
        })
        .catch(function () { msg.textContent = '인터넷 연결을 확인하고 다시 보내 주세요.'; msg.className = 'form-msg err'; })
        .then(function () { btn.disabled = false; });
    });
  }

  // ---------- 오프라인에서도 열리게 ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { /* 무시 */ }); });
  }
})();
