/* 룰룰 공간 운영자: 매장 QR 만들기와 매장 페이지 보기
   매장 정보는 주소(# 뒤) 안에만 담고 서버에 저장하지 않아요. */
(function () {
  'use strict';
  var RS = window.RS;
  if (!RS) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc;

  // ---------- 매장 정보 <-> 주소 ----------
  // 이름, 한마디, 문의 링크, 게임 코드를 줄바꿈으로 이어 UTF-8 base64url로 바꿔요.
  function toB64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  var clean = function (s, max) { return String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max); };
  function encodeVenue(v) {
    return '1' + toB64([clean(v.n, 40), clean(v.m, 80), clean(v.k, 200), (v.g || []).join('.')].join('\n'));
  }
  function decodeVenue(raw) {
    try {
      if (!raw || raw.charAt(0) !== '1') return null;
      var p = fromB64(raw.slice(1)).split('\n');
      return { n: clean(p[0], 40), m: clean(p[1], 80), k: clean(p[2], 200), g: (p[3] || '').split('.').filter(Boolean).slice(0, 80) };
    } catch (e) { return null; }
  }
  function readVenue() {
    var h = location.hash.replace(/^#/, '');
    if (h) return decodeVenue(h);
    // 예전 방식 주소(?n=&g=)도 읽어요
    var q = new URLSearchParams(location.search);
    if (q.get('g')) return { n: clean(q.get('n'), 40), m: clean(q.get('m'), 80), k: clean(q.get('k'), 200), g: q.get('g').split('.').filter(Boolean) };
    return null;
  }
  function safeLink(k) {
    k = String(k || '').trim();
    if (!k) return '';
    if (/^(https?:\/\/|tel:)/i.test(k)) return k;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(k)) return 'https://' + k;
    return '';
  }

  // ---------- QR 그리기 ----------
  function qrCanvas(text, ecl, scale) {
    var qr = qrcode(0, ecl || 'M');
    qr.addData(text);
    qr.make();
    var n = qr.getModuleCount(), quiet = 4, size = (n + quiet * 2) * scale;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, size, size);
    x.fillStyle = '#233552';
    for (var r = 0; r < n; r++) for (var col = 0; col < n; col++) {
      if (qr.isDark(r, col)) x.fillRect((col + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
    return c;
  }
  var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  function labeledPNG(url, name) {
    var W = 1200, H = 1500, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#f05b48'; x.fillRect(0, 0, W, 18);
    x.fillStyle = '#233552'; x.textAlign = 'center';
    x.font = '800 76px ' + FONT;
    x.fillText(name, W / 2, 150, W - 120);
    x.fillStyle = '#5f6675'; x.font = '600 40px ' + FONT;
    x.fillText('보드게임 하는 법, QR로 바로 보기', W / 2, 220, W - 120);
    var q = qrCanvas(url, 'M', 24);
    x.imageSmoothingEnabled = false;
    x.drawImage(q, (W - 980) / 2, 280, 980, 980);
    x.fillStyle = '#233552'; x.font = '700 42px ' + FONT;
    x.fillText('휴대폰 카메라로 찍으면 우리 매장 게임이 열려요', W / 2, 1340, W - 120);
    x.fillStyle = '#f05b48'; x.font = '800 38px ' + FONT;
    x.fillText('룰룰 | 보드게임 룰 하는법 설명서', W / 2, 1420, W - 120);
    return c.toDataURL('image/png');
  }

  // ---------- 매장 QR 만들기 ----------
  var maker = $('[data-maker]');
  if (maker) {
    var form = $('.maker-form', maker);
    var nameIn = $('input[name="n"]', form), msgIn = $('input[name="m"]', form), linkIn = $('input[name="k"]', form);
    var gamesBox = $('[data-maker-games]', maker), countEl = $('[data-maker-count]', maker), qIn = $('[data-maker-q]', maker);
    var qrBox = $('[data-qr-box]', maker), qrName = $('[data-qr-name]', maker);
    var btns = $$('[data-act]', maker);
    var picked = [], all = [], current = '';

    var saved = readVenue() || RS.store.get('rs-maker', null);
    if (saved) {
      nameIn.value = saved.n || ''; msgIn.value = saved.m || ''; linkIn.value = saved.k || '';
      picked = (saved.g || []).slice();
    }

    var venueURL = function () {
      return location.origin + '/space/view/#' + encodeVenue({ n: nameIn.value, m: msgIn.value, k: safeLink(linkIn.value), g: picked });
    };
    var update = function () {
      var name = clean(nameIn.value, 40);
      countEl.textContent = '고른 게임 ' + picked.length + '개';
      qrName.textContent = name || '매장 이름';
      RS.store.set('rs-maker', { n: nameIn.value, m: msgIn.value, k: linkIn.value, g: picked });
      var ok = name && picked.length;
      btns.forEach(function (b) { b.disabled = !ok; });
      if (!ok) {
        current = '';
        qrBox.innerHTML = '<p class="muted">' + (name ? '매장에 있는 게임을 하나 이상 골라 주세요.' : '매장 이름을 쓰고 게임을 고르면 QR이 나와요.') + '</p>';
        return;
      }
      current = venueURL();
      qrBox.innerHTML = '';
      var c = qrCanvas(current, 'M', 6);
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', name + ' 매장 페이지 QR');
      qrBox.appendChild(c);
    };

    RS.loadGames().then(function (d) {
      all = d.games;
      var known = all.map(function (g) { return g.c; });
      picked = picked.filter(function (c) { return known.indexOf(c) > -1; });
      gamesBox.innerHTML = all.map(function (g) {
        return '<label data-n="' + esc([g.n].concat(g.a || []).join('|')) + '" data-c="' + esc(RS.cho(g.n)) + '"><input type="checkbox" value="' + g.c + '"' + (picked.indexOf(g.c) > -1 ? ' checked' : '') + '>' + esc(g.n) + '</label>';
      }).join('');
      update();
    }).catch(function () {
      gamesBox.innerHTML = '<p class="muted">게임 목록을 불러오지 못했어요. 새로고침해 주세요.</p>';
    });

    gamesBox.addEventListener('change', function () {
      // 고른 순서를 지키되, 화면 순서대로 정리
      var on = $$('input:checked', gamesBox).map(function (x) { return x.value; });
      picked = picked.filter(function (c) { return on.indexOf(c) > -1; });
      on.forEach(function (c) { if (picked.indexOf(c) < 0) picked.push(c); });
      update();
    });
    qIn.addEventListener('input', function () {
      var q = qIn.value;
      $$('label', gamesBox).forEach(function (l) { l.classList.toggle('miss', !RS.matchQuery(q, l.dataset.n, l.dataset.c)); });
    });
    [nameIn, msgIn, linkIn].forEach(function (i) { i.addEventListener('input', update); });
    linkIn.addEventListener('change', function () {
      var v = linkIn.value.trim();
      if (v && !safeLink(v)) RS.toast('문의 링크는 https:// 로 시작하는 주소나 tel: 전화번호로 써 주세요.');
    });

    maker.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || b.disabled || !current) return;
      var act = b.dataset.act, name = clean(nameIn.value, 40);
      if (act === 'open') window.open(current, '_blank', 'noopener');
      if (act === 'copy') RS.copyText(current, '매장 페이지 링크를 복사했어요');
      if (act === 'png') {
        var a = document.createElement('a');
        a.href = labeledPNG(current, name);
        a.download = name.replace(/[\\/:*?"<>|]/g, '') + ' 룰룰 QR.png';
        document.body.appendChild(a); a.click(); a.remove();
      }
      if (act === 'print') printSheet(name, current);
    });

    var printSheet = function (name, url) {
      var old = $('.print-sheet'); if (old) old.remove();
      var sheet = document.createElement('div');
      sheet.className = 'print-sheet';
      var venueImg = qrCanvas(url, 'M', 10).toDataURL('image/png');
      var games = picked.map(function (c) { return all.filter(function (g) { return g.c === c; })[0]; }).filter(Boolean);
      var v = encodeURIComponent(name.slice(0, 20));
      var cells = games.map(function (g) {
        var src = qrCanvas(location.origin + '/games/' + g.s + '/?src=qr&v=' + v, 'L', 6).toDataURL('image/png');
        return '<div><img src="' + src + '" alt=""><b>' + esc(g.n) + '</b><small>찍으면 하는 법이 열려요</small></div>';
      }).join('');
      sheet.innerHTML = '<section class="print-page"><p class="print-title">' + esc(name) + '</p>' +
        '<p class="print-sub">보드게임 하는 법, QR로 바로 보세요</p>' +
        '<img class="print-qr" src="' + venueImg + '" alt="">' +
        '<p class="print-sub">휴대폰 카메라로 찍으면 우리 매장 게임과 1분 요약이 열려요.</p>' +
        (clean(msgIn.value, 80) ? '<p class="print-sub">' + esc(clean(msgIn.value, 80)) + '</p>' : '') + '</section>' +
        '<section class="print-page"><p class="print-sub" style="margin:0 0 6mm">게임 상자에 붙이는 QR 스티커 (점선대로 잘라 쓰세요)</p><div class="print-grid">' + cells + '</div></section>';
      document.body.appendChild(sheet);
      var imgs = $$('img', sheet), left = imgs.length;
      var go = function () { window.print(); };
      var done = function () { if (--left <= 0) setTimeout(go, 50); };
      imgs.forEach(function (im) { if (im.complete) done(); else { im.onload = done; im.onerror = done; } });
      window.addEventListener('afterprint', function rm() { sheet.remove(); window.removeEventListener('afterprint', rm); });
    };
  }

  // ---------- 매장 페이지 보기 ----------
  var venueEl = $('[data-venue]');
  if (venueEl) {
    var v = readVenue();
    var list = $('[data-v-list]', venueEl), empty = $('[data-v-empty]', venueEl), filter = $('[data-v-filter]', venueEl);
    if (!v || !v.n) {
      $('[data-v-name]', venueEl).textContent = '매장 정보를 읽지 못했어요';
      $('[data-v-msg]', venueEl).textContent = 'QR을 다시 찍거나 매장에 문의해 주세요. 룰룰의 게임은 모두 게임 찾기에서 볼 수 있어요.';
      $('[data-v-actions]', venueEl).innerHTML = '<a class="btn btn-sub" href="/games/">게임 찾기</a>';
      filter.hidden = true;
      return;
    }
    try { sessionStorage.setItem('rs-venue', v.n.slice(0, 40)); } catch (e) { /* 무시 */ }
    document.title = v.n + ' 보드게임 - 룰룰';
    $('[data-v-name]', venueEl).textContent = v.n;
    $('[data-v-msg]', venueEl).textContent = v.m || '아래에서 게임을 고르면 1분 요약부터 볼 수 있어요.';
    var link = safeLink(v.k);
    $('[data-v-actions]', venueEl).innerHTML = link ? '<a class="btn btn-sub" href="' + esc(link) + '" rel="noopener" target="_blank">매장에 문의하기</a>' : '';
    RS.track('venue', '');

    RS.loadGames().then(function (d) {
      var games = v.g.map(function (c) { return d.games.filter(function (g) { return g.c === c; })[0]; }).filter(Boolean);
      var param = '?src=qr&v=' + encodeURIComponent(v.n.slice(0, 20));
      var draw = function (p) {
        var shown = games.filter(function (g) { return !p || (p >= 6 ? g.p[1] >= 6 : (g.p[0] <= p && p <= g.p[1])); });
        list.innerHTML = shown.map(function (g) { return RS.cardHTML(g, '/games/' + g.s + '/' + param); }).join('');
        empty.hidden = shown.length > 0;
        if (!shown.length && games.length) empty.textContent = '이 인원으로 할 수 있는 게임이 이 매장에는 없어요. 인원을 바꿔 보세요.';
      };
      draw(0);
      RS.radioGroup(filter, function (b) { draw(Number(b.dataset.v) || 0); });
    }).catch(function () {
      list.innerHTML = '<p class="muted">게임 목록을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>';
    });
  }
})();
