/* 룰룰 커뮤니티: 회원, 모임, 정모·번개, 자유게시판, 댓글, 제휴·문의 */
(function () {
  'use strict';
  var RS = window.RS;
  if (!RS) return;
  var $ = RS.$, $$ = RS.$$, esc = RS.esc, store = RS.store;
  var dataEl = document.getElementById('cm-data');
  var DATA = dataEl ? JSON.parse(dataEl.textContent) : { regions: [], cats: {} };
  var REGIONS = DATA.regions, CATS = DATA.cats, USER_CATS = DATA.userCats || Object.keys(CATS);
  var RRS = window.RRS || null;
  var gain = function (g) { if (RRS && g) RRS.gain(g); };
  // 다른 페이지로 넘어가는 동작의 점수 알림은 다음 페이지에서 보여 줘요
  var gainLater = function (g) { if (g) try { sessionStorage.setItem('rr-gain', JSON.stringify(g)); } catch (e) { /* 넘어감 */ } };
  var KIND = { regular: '정모', flash: '번개' };
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
  var mePromise = null;
  function getMe(force) {
    if (RRS) return RRS.me(force);
    if (!mePromise || force) {
      mePromise = api('me').then(function (j) {
        var u = j && j.ok ? j.user : null;
        store.set('rr-me', u ? { nick: u.nick } : null);
        if (RS.paintAccount) RS.paintAccount();
        return u;
      });
    }
    return mePromise;
  }
  function setMe(u) {
    if (RRS) { RRS.setMe(u); return; }
    store.set('rr-me', u ? { nick: u.nick } : null);
    mePromise = Promise.resolve(u);
    if (RS.paintAccount) RS.paintAccount();
  }

  var games = null, gameBySlug = {};
  function loadGames() {
    if (games) return Promise.resolve(games);
    return RS.loadGames().then(function (d) {
      games = d.games; games.forEach(function (g) { gameBySlug[g.s] = g; });
      return games;
    }).catch(function () { games = []; return games; });
  }

  // ---------- 보여 주기 도우미 ----------
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  function kstParts(stamp) { // 'YYYY-MM-DDTHH:MM' (한국 시각)
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(stamp || '');
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5], wd: WEEK[d.getUTCDay()] };
  }
  function whenText(stamp) {
    var p = kstParts(stamp);
    if (!p) return '';
    var ampm = p.h < 12 ? '오전' : '오후', h = p.h % 12 || 12;
    return p.mo + '월 ' + p.d + '일 (' + p.wd + ') ' + ampm + ' ' + h + ':' + String(p.mi).padStart(2, '0');
  }
  function kstToday() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function dday(stamp) {
    var a = new Date(stamp.slice(0, 10) + 'T00:00:00Z'), b = new Date(kstToday() + 'T00:00:00Z');
    var n = Math.round((a - b) / 86400e3);
    return n <= 0 ? '오늘' : n === 1 ? '내일' : 'D-' + n;
  }
  function ago(iso) {
    var t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    var s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return '방금';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    if (s < 86400 * 7) return Math.floor(s / 86400) + '일 전';
    var d = new Date(t + 9 * 3600e3);
    return (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일';
  }
  var nick = function (o) { return RRS ? RRS.who(o) : (o.gone ? '탈퇴한 회원' : esc(o.nick)); };
  var gameChips = function (list) {
    var arr = String(list || '').split(',').filter(Boolean);
    if (!arr.length) return '';
    return '<span class="cm-games">' + arr.map(function (s) { var g = gameBySlug[s]; return g ? '<a class="pill pill-sm" href="/games/' + s + '/">' + esc(g.n) + '</a>' : ''; }).join('') + '</span>';
  };
  var ico = function (id) { return '<svg class="ico" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
  var regionOptions = function (sel, emptyLabel) {
    return (emptyLabel ? '<option value="">' + emptyLabel + '</option>' : '') + REGIONS.map(function (r) { return '<option' + (r === sel ? ' selected' : '') + '>' + r + '</option>'; }).join('');
  };
  function msg(el, text, bad) { if (!el) return; el.textContent = text || ''; el.className = 'form-msg' + (bad ? ' err' : text ? ' ok' : ''); }
  var bodyEl = function () { return $('[data-cm-body]'); };
  function render(html) { var b = bodyEl(); if (b) b.innerHTML = html; }
  function setTitle(t) { document.title = t + ' - 룰룰'; }
  function notFound(text) {
    render('<div class="cm-empty"><p>' + esc(text || '찾는 내용이 없어요.') + '</p><p><a class="btn btn-sub" href="/community/">커뮤니티 홈으로</a></p></div>');
  }
  var loginLink = function () { return '/account/?next=' + encodeURIComponent(location.pathname + location.search); };
  function needLogin(text) {
    return '<div class="cm-login-card"><p>' + esc(text || '로그인하면 참여할 수 있어요.') + '</p><div class="row-btns"><a class="btn btn-main" href="' + loginLink() + '">로그인</a><a class="btn btn-sub" href="/account/?mode=signup&next=' + encodeURIComponent(location.pathname + location.search) + '">회원가입</a></div></div>';
  }
  function pager(page, per, total, onGo) {
    var pages = Math.ceil(total / per);
    if (pages <= 1) return '';
    var h = '<nav class="pager" aria-label="쪽 이동">';
    if (page > 1) h += '<button type="button" class="btn btn-sub btn-sm" data-page="' + (page - 1) + '">이전</button>';
    h += '<span>' + page + ' / ' + pages + '</span>';
    if (page < pages) h += '<button type="button" class="btn btn-sub btn-sm" data-page="' + (page + 1) + '">다음</button>';
    return h + '</nav>';
  }
  function bindPager(root, onGo) { $$('[data-page]', root).forEach(function (b) { b.addEventListener('click', function () { onGo(Number(b.dataset.page)); window.scrollTo({ top: 0 }); }); }); }

  // ---------- 신고 ----------
  var flagDialog;
  function openFlag(target, id) {
    if (!flagDialog) {
      flagDialog = document.createElement('dialog');
      flagDialog.className = 'sheet';
      flagDialog.innerHTML = '<form class="sheet-body" method="dialog"><div class="sheet-head"><h2>신고하기</h2><button type="button" class="icon-btn" data-x aria-label="닫기">' + ico('i-close') + '</button></div>' +
        '<p class="muted">운영자가 확인한 뒤 조치해요. 신고한 사람은 알려지지 않아요.</p>' +
        '<label class="field"><span>어떤 문제인가요?</span><select name="reason"><option>욕설·비하·혐오</option><option>개인 정보 노출</option><option>광고·도배</option><option>사기·금전 요구 의심</option><option>이성 만남 목적</option><option>그 밖의 문제</option></select></label>' +
        '<label class="field"><span>덧붙일 말 (선택)</span><input name="more" maxlength="120"></label>' +
        '<p class="form-msg" role="status"></p><div class="sheet-actions"><button class="btn btn-main" type="submit">신고 보내기</button></div></form>';
      document.body.appendChild(flagDialog);
      $('[data-x]', flagDialog).addEventListener('click', function () { flagDialog.close(); });
    }
    var form = $('form', flagDialog), m = $('.form-msg', form);
    msg(m, '');
    form.onsubmit = function (e) {
      e.preventDefault();
      var reason = form.reason.value + (form.more.value ? ' - ' + form.more.value : '');
      api('flag', { method: 'POST', body: { target: target, id: id, reason: reason } }).then(function (j) {
        if (j.ok) { flagDialog.close(); RS.toast('신고를 받았어요. 확인할게요.'); }
        else if (j._status === 401) location.href = loginLink();
        else msg(m, j.message, true);
      });
    };
    if (flagDialog.showModal) flagDialog.showModal(); else flagDialog.setAttribute('open', '');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-flag]');
    if (!b) return;
    e.preventDefault();
    getMe().then(function (me) {
      if (!me) { location.href = loginLink(); return; }
      openFlag(b.dataset.flag, Number(b.dataset.id));
    });
  });

  // ---------- 댓글 ----------
  function commentsHTML(list, target, id, me, canWrite, label, adoptable) {
    var h = '<section class="cm-comments" data-comments="' + target + ':' + id + '"><h2 class="h3">' + (label || '댓글') + ' <span class="muted">' + list.length + '</span></h2>';
    h += list.length ? '<ul class="cmt-list">' + list.map(function (c) {
      return '<li class="cmt' + (c.adopted ? ' adopted' : '') + '"><p class="cmt-meta">' + (c.adopted ? '<span class="adopt-tag">' + ico('i-check') + '채택된 답변</span>' : '') + '<b>' + nick(c) + '</b><span>' + ago(c.created_at) + '</span>' +
        (adoptable && !c.mine && !c.hidden && !c.gone ? '<button type="button" class="link-btn adopt-btn" data-adopt="' + c.id + '">이 답변 채택하기</button>' : '') +
        (c.mine && !c.adopted ? '<button type="button" class="link-btn" data-cdel="' + c.id + '">지우기</button>' : (me && !c.hidden && !c.mine ? '<button type="button" class="link-btn" data-flag="comment" data-id="' + c.id + '">신고</button>' : '')) + '</p>' +
        (c.hidden ? '<p class="cmt-body muted">운영 정책에 따라 가려진 댓글이에요.</p>' : '<p class="cmt-body">' + esc(c.body) + '</p>') + '</li>';
    }).join('') + '</ul>' : '<p class="muted">아직 ' + (label || '댓글') + '이 없어요.</p>';
    if (canWrite === true) {
      h += '<form class="cmt-form" data-cform><label class="sr" for="cmt-in">' + (label || '댓글') + ' 쓰기</label><textarea id="cmt-in" name="body" rows="3" maxlength="1000" placeholder="' + (target === 'club' ? '모임 사람들에게 남길 말' : '댓글을 남겨 주세요') + '" required></textarea><div class="cmt-actions"><p class="form-msg" role="status"></p><button class="btn btn-main btn-sm" type="submit">올리기</button></div></form>';
    } else if (canWrite) {
      h += '<p class="muted small">' + canWrite + '</p>';
    } else if (!me) {
      h += needLogin('로그인하면 ' + (label || '댓글') + '을 남길 수 있어요.');
    }
    return h + '</section>';
  }
  function bindComments(root, target, id, reload) {
    var form = $('[data-cform]', root);
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var m = $('.form-msg', form), btn = $('button[type=submit]', form);
        btn.disabled = true;
        api('comments', { method: 'POST', body: { target: target, id: id, body: form.body.value } }).then(function (j) {
          btn.disabled = false;
          if (j.ok) { gain(j.gain); reload(); } else msg(m, j.message, true);
        });
      });
    }
    $$('[data-cdel]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('이 댓글을 지울까요?')) return;
        api('comments/' + b.dataset.cdel, { method: 'DELETE' }).then(function (j) { if (j.ok) reload(); else RS.toast(j.message); });
      });
    });
  }

  // ---------- 카드 ----------
  function eventCard(e) {
    var full = e.attendee_count >= e.max_people;
    return '<a class="ecard" href="/community/event/?id=' + e.id + '">' +
      '<span class="ecard-top"><span class="badge badge-' + e.kind + '">' + KIND[e.kind] + '</span><span class="ecard-dday">' + dday(e.starts_at) + '</span>' + (full ? '<span class="badge badge-full">마감</span>' : '') + '</span>' +
      '<span class="ecard-t">' + esc(e.title) + '</span>' +
      '<span class="ecard-meta">' + ico('i-cal') + whenText(e.starts_at) + '</span>' +
      '<span class="ecard-meta">' + ico('i-pin') + esc(e.region) + ' · ' + esc(e.place) + '</span>' +
      '<span class="ecard-foot">' + ico('i-people') + e.attendee_count + ' / ' + e.max_people + '명' + (e.club_name ? '<span class="ecard-club">' + esc(e.club_name) + '</span>' : '') + '</span></a>';
  }
  function clubCard(c) {
    return '<a class="ccard" href="/community/club/?id=' + c.id + '">' +
      '<span class="ccard-top"><span class="badge">' + esc(c.region) + (c.area ? ' · ' + esc(c.area) : '') + '</span><span class="muted small">' + ico('i-people') + c.member_count + '명</span></span>' +
      '<span class="ccard-t">' + esc(c.name) + '</span>' +
      '<span class="ccard-d">' + esc(c.intro || '') + '</span>' +
      (c.next_at ? '<span class="ccard-next">' + ico('i-cal') + '다음 일정 ' + whenText(c.next_at) + '</span>' : '') + '</a>';
  }
  function postRow(p) {
    var plainNick = p.gone ? '탈퇴한 회원' : esc(p.nick);
    var lv = RRS && !p.gone && !p.sys ? RRS.lvChip(p.xp) + ' ' : '';
    return '<li><a class="prow' + (p.pinned ? ' prow-pin' : '') + '" href="/community/post/?id=' + p.id + '"><span class="badge badge-cat' + (p.cat === 'notice' ? ' badge-notice' : p.cat === 'poll' ? ' badge-poll' : '') + '">' + (p.pinned ? '고정 · ' : '') + esc(CATS[p.cat] || '') + '</span><span class="prow-t">' + esc(p.title) +
      (p.comments ? ' <span class="prow-c">[' + p.comments + ']</span>' : '') + (p.adopted ? ' <span class="adopt-tag">해결</span>' : '') + '</span><span class="prow-meta">' + lv + plainNick + ' · ' + ago(p.created_at) + (p.likes ? ' · ' + ico('i-heart') + p.likes : '') + '</span></a></li>';
  }

  // ---------- 페이지: 커뮤니티 홈 ----------
  function pageHub() {
    Promise.all([api('community/home'), getMe(), loadGames()]).then(function (r) {
      var j = r[0], me = r[1];
      if (!j.ok) { render('<p class="notice">' + esc(j.message) + '</p>'); return; }
      var c = j.counts || {};
      var lvInfo = me && window.RRG ? window.RRG.level(me.xp) : null;
      render(
        '<div class="cm-hello">' + (me ? '<div class="cm-me">' + (lvInfo ? window.RRG.emblem(lvInfo, 48) : '') + '<p><b>' + esc(me.nick) + '</b>님, 반가워요. ' + (lvInfo ? 'Lv.' + lvInfo.lv + ' ' + esc(lvInfo.name) + (lvInfo.next ? ', 다음 등급까지 ' + lvInfo.need + '점 남았어요.' : '.') : '') + '</p>' + (me.checked ? '<span class="tag tag-teal">오늘 출석 완료</span>' : '<button type="button" class="btn btn-coral btn-sm" data-hub-checkin>출석 체크 +2점</button>') + '</div>' : '<p>로그인하면 모임에 가입하고 정모·번개에 참여할 수 있어요. 활동할수록 등급이 오르고 배지를 받아요. <a href="' + loginLink() + '">로그인</a> · <a href="/account/?mode=signup">회원가입</a></p>') +
        '<div class="row-btns"><a class="btn btn-main" href="/community/write/?t=event">' + ico('i-cal') + '번개 열기</a><a class="btn btn-sub" href="/community/write/?t=club">' + ico('i-people') + '모임 만들기</a><a class="btn btn-sub" href="/community/write/?t=post">' + ico('i-chat') + '글쓰기</a></div></div>' +
        '<p class="cm-stats"><span>회원 <b>' + (c.users || 0) + '</b></span><span>모임 <b>' + (c.clubs || 0) + '</b></span><span>다가오는 일정 <b>' + (c.events || 0) + '</b></span><span>게시글 <b>' + (c.posts || 0) + '</b></span></p>' +
        '<div class="live-grid cm-live"><div class="live-card" data-hub-poll></div><div class="live-card"><h3>' + ico('i-trophy') + '이달의 활동왕</h3>' + ((j.top || []).length ? '<ol class="rank-list">' + j.top.map(function (x, i) { return '<li><span class="rank-n">' + (i + 1) + '</span>' + nick(x) + '<span class="rank-s">' + x.s + '점</span></li>'; }).join('') + '</ol>' : '<p class="muted">이달의 첫 활동왕이 되어 보세요.</p>') + '<a class="more-link" href="/community/rank/">랭킹 전체 보기</a></div></div>' +
        '<div class="sec-row"><h2 class="h2">다가오는 정모·번개</h2><a class="more-link" href="/community/events/">모두 보기</a></div>' +
        (j.events.length ? '<div class="ecards">' + j.events.map(eventCard).join('') + '</div>' : '<div class="cm-empty"><p>아직 열린 일정이 없어요. 첫 번개를 열어 보세요.</p></div>') +
        '<div class="sec-row"><h2 class="h2">보드게임 모임</h2><a class="more-link" href="/community/clubs/">모두 보기</a></div>' +
        (j.clubs.length ? '<div class="ccards">' + j.clubs.map(clubCard).join('') + '</div>' : '<div class="cm-empty"><p>아직 만들어진 모임이 없어요. 우리 동네 첫 모임을 만들어 보세요.</p></div>') +
        '<div class="sec-row"><h2 class="h2">게시판 새 글</h2><a class="more-link" href="/community/board/">모두 보기</a></div>' +
        (j.posts.length ? '<ul class="plist">' + j.posts.map(postRow).join('') + '</ul>' : '<div class="cm-empty"><p>아직 글이 없어요. 규칙이 헷갈렸던 게임부터 물어보세요.</p></div>')
      );
      var hb = bodyEl();
      var pb = $('[data-hub-poll]', hb);
      if (pb && RRS) RRS.renderPoll(pb, j.poll, me);
      var hc = $('[data-hub-checkin]', hb);
      if (hc) hc.addEventListener('click', function () {
        hc.disabled = true;
        api('checkin', { method: 'POST' }).then(function (x) {
          if (!x.ok) { hc.disabled = false; RS.toast(x.message); return; }
          if (!x.already) gain(x.gain);
          hc.outerHTML = '<span class="tag tag-teal">오늘 출석 완료 · ' + (x.streak || 1) + '일째</span>';
        });
      });
    });
  }

  // ---------- 페이지: 일정 목록 ----------
  function pageEvents() {
    var state = { region: params.get('region') || '', kind: params.get('kind') || '', page: 1, mine: params.get('mine') === '1' };
    var b = bodyEl();
    b.innerHTML = '<div class="cm-filter"><label class="field field-inline"><span>지역</span><select data-f="region">' + regionOptions(state.region, '전체 지역') + '</select></label>' +
      '<div class="chips" role="radiogroup" aria-label="종류">' + [['', '전체'], ['regular', '정모'], ['flash', '번개']].map(function (k) { return '<button type="button" class="chip" role="radio" aria-checked="' + (state.kind === k[0]) + '" data-kind="' + k[0] + '">' + k[1] + '</button>'; }).join('') + '</div>' +
      '<a class="btn btn-main btn-sm" href="/community/write/?t=event">' + ico('i-cal') + '번개 열기</a></div><div data-list><p class="muted">불러오는 중이에요</p></div>';
    var list = $('[data-list]', b);
    function load() {
      var q = 'events?page=' + state.page + (state.region ? '&region=' + encodeURIComponent(state.region) : '') + (state.kind ? '&kind=' + state.kind : '') + (state.mine ? '&mine=1' : '');
      Promise.all([api(q), loadGames()]).then(function (r) {
        var j = r[0];
        if (!j.ok) { list.innerHTML = '<p class="notice">' + esc(j.message) + '</p>'; return; }
        list.innerHTML = j.events.length ? '<div class="ecards">' + j.events.map(eventCard).join('') + '</div>' + pager(j.page, j.per, j.total) : '<div class="cm-empty"><p>조건에 맞는 일정이 아직 없어요.</p><p><a class="btn btn-sub" href="/community/write/?t=event">이 조건으로 번개 열기</a></p></div>';
        bindPager(list, function (p) { state.page = p; load(); });
      });
    }
    $('[data-f=region]', b).addEventListener('change', function (e) { state.region = e.target.value; state.page = 1; load(); });
    $$('[data-kind]', b).forEach(function (c) {
      c.addEventListener('click', function () { state.kind = c.dataset.kind; state.page = 1; $$('[data-kind]', b).forEach(function (x) { x.setAttribute('aria-checked', String(x === c)); }); load(); });
    });
    load();
  }

  // ---------- 페이지: 일정 하나 ----------
  function pageEvent() {
    var id = Number(params.get('id'));
    if (!id) { notFound('일정 주소가 잘못됐어요.'); return; }
    function load() {
      Promise.all([api('events/' + id), getMe(), loadGames()]).then(function (r) {
        var j = r[0], me = r[1];
        if (!j.ok) { notFound(j.message); return; }
        var e = j.event, full = e.attendee_count >= e.max_people;
        setTitle(e.title);
        var action = '';
        if (e.canceled) action = '<p class="notice">취소된 일정이에요.</p>';
        else if (e.past) action = '<p class="notice">지난 일정이에요.</p>';
        else if (!me) action = needLogin('로그인하면 이 일정에 참여 신청할 수 있어요.');
        else if (e.mine) action = '<p class="muted">내가 연 일정이에요.</p>';
        else if (e.joined) action = '<button type="button" class="btn btn-sub" data-leave>참여 취소</button>';
        else action = '<button type="button" class="btn btn-main" data-join' + (full ? ' disabled' : '') + '>' + (full ? '정원이 다 찼어요' : '참여 신청') + '</button>';
        render(
          '<article class="cm-article">' +
          '<p class="cm-kicker"><span class="badge badge-' + e.kind + '">' + KIND[e.kind] + '</span>' + (e.past ? '' : '<span class="ecard-dday">' + dday(e.starts_at) + '</span>') + (e.club_id ? '<a href="/community/club/?id=' + e.club_id + '">' + esc(e.club_name || '모임') + '</a>' : '<span class="muted">누구나 참여하는 번개</span>') + '</p>' +
          '<h1 class="cm-title">' + esc(e.title) + '</h1>' +
          '<dl class="cm-facts"><div><dt>' + ico('i-cal') + '언제</dt><dd>' + whenText(e.starts_at) + '</dd></div><div><dt>' + ico('i-pin') + '어디서</dt><dd>' + esc(e.region) + ' · ' + esc(e.place) + '</dd></div>' +
          '<div><dt>' + ico('i-people') + '인원</dt><dd>' + e.attendee_count + ' / ' + e.max_people + '명</dd></div>' + (e.fee ? '<div><dt>참가비</dt><dd>' + esc(e.fee) + '</dd></div>' : '') + '</dl>' +
          gameChips(e.games) +
          (e.body ? '<div class="cm-text">' + esc(e.body) + '</div>' : '') +
          '<p class="cm-author">연 사람 <b>' + nick(e) + '</b> · ' + ago(e.created_at) + '</p>' +
          '<div class="cm-actions">' + action + '<button type="button" class="btn btn-ghost" data-share-url>링크 보내기</button>' +
          (e.mine ? '<a class="btn btn-ghost" href="/community/write/?t=event&id=' + e.id + '">고치기</a><button type="button" class="btn btn-ghost" data-del>지우기</button>' : (me ? '<button type="button" class="link-btn" data-flag="event" data-id="' + e.id + '">신고</button>' : '')) + '</div>' +
          '<section class="cm-people"><h2 class="h3">참여하는 사람 <span class="muted">' + j.people.length + '</span></h2><p class="people">' + j.people.map(function (p) { return '<span>' + nick(p) + '</span>'; }).join('') + '</p></section>' +
          (j.manner && j.manner.people.length ? '<section class="manner-box" data-manner><h2>함께한 사람들, 매너는 어땠나요?</h2><p class="small muted">일정이 끝나고 14일 안에 남길 수 있어요. 점수는 상대에게 이름 없이 평균으로만 보여요.</p>' + j.manner.people.map(function (p) { return '<div class="manner-row" data-mnick="' + esc(p.nick) + '"><b>' + esc(p.nick) + '</b><div class="star-pick" role="radiogroup" aria-label="' + esc(p.nick) + ' 매너 별점">' + [1, 2, 3, 4, 5].map(function (k) { return '<button type="button" role="radio" aria-checked="' + (p.score === k) + '" aria-label="' + k + '점" data-ms="' + k + '" class="' + (k <= p.score ? 'on' : '') + '"><svg aria-hidden="true"><use href="#i-star"/></svg></button>'; }).join('') + '</div></div>'; }).join('') + (j.manner.people.every(function (p) { return p.score; }) ? '<p class="small" style="font-weight:800">모두 평가했어요. 고마워요!</p>' : '<div class="row-btns" style="margin-top:4px"><button type="button" class="btn btn-main" data-manner-save>매너 별점 남기기</button></div>') + '</section>' : '') +
          '</article>' + commentsHTML(j.comments, 'event', id, me, me ? true : false, '댓글')
        );
        var b = bodyEl();
        var join = $('[data-join]', b), leave = $('[data-leave]', b), del = $('[data-del]', b);
        if (join) join.addEventListener('click', function () { api('events/' + id + '/join', { method: 'POST' }).then(function (x) { if (x.ok) { if (x.gain) gain(x.gain); else RS.toast('참여 신청했어요.'); load(); } else RS.toast(x.message); }); });
        var mb = $('[data-manner]', b);
        if (mb) {
          $$('.manner-row', mb).forEach(function (row) {
            $$('[data-ms]', row).forEach(function (s) {
              s.addEventListener('click', function () {
                var v = Number(s.dataset.ms); row.dataset.score = v;
                $$('[data-ms]', row).forEach(function (x) { var k = Number(x.dataset.ms); x.classList.toggle('on', k <= v); x.setAttribute('aria-checked', String(k === v)); });
              });
            });
          });
          var msave = $('[data-manner-save]', mb);
          if (msave) msave.addEventListener('click', function () {
            var scores = {};
            $$('.manner-row', mb).forEach(function (row) { if (row.dataset.score) scores[row.dataset.mnick] = Number(row.dataset.score); });
            if (!Object.keys(scores).length) { RS.toast('별을 눌러 점수를 골라 주세요.'); return; }
            api('events/' + id + '/manner', { method: 'POST', body: { scores: scores } }).then(function (x) {
              if (!x.ok) { RS.toast(x.message); return; }
              if (x.gain) gain(x.gain); else RS.toast('매너 별점을 남겼어요.');
              load();
            });
          });
        }
        if (leave) leave.addEventListener('click', function () { if (confirm('참여를 취소할까요?')) api('events/' + id + '/leave', { method: 'POST' }).then(function (x) { if (x.ok) load(); else RS.toast(x.message); }); });
        if (del) del.addEventListener('click', function () { if (confirm('이 일정을 지울까요? 참여 신청과 댓글도 함께 지워져요.')) api('events/' + id, { method: 'DELETE' }).then(function (x) { if (x.ok) location.href = e.club_id ? '/community/club/?id=' + e.club_id : '/community/events/'; else RS.toast(x.message); }); });
        $('[data-share-url]', b).addEventListener('click', function () { RS.shareOrCopy({ title: e.title, text: KIND[e.kind] + ' · ' + whenText(e.starts_at) + ' · ' + e.place, url: location.href }); });
        bindComments(b, 'event', id, load);
      });
    }
    load();
  }

  // ---------- 페이지: 모임 목록 ----------
  function pageClubs() {
    var state = { region: params.get('region') || '', q: '', page: 1 };
    var b = bodyEl();
    b.innerHTML = '<div class="cm-filter"><label class="field field-inline"><span>지역</span><select data-f="region">' + regionOptions(state.region, '전체 지역') + '</select></label>' +
      '<form class="cm-search" data-search><label class="sr" for="club-q">모임 찾기</label><input id="club-q" type="search" placeholder="모임 이름, 동네로 찾기" maxlength="30"><button class="btn btn-sub btn-sm" type="submit">찾기</button></form>' +
      '<a class="btn btn-main btn-sm" href="/community/write/?t=club">' + ico('i-people') + '모임 만들기</a></div><div data-list><p class="muted">불러오는 중이에요</p></div>';
    var list = $('[data-list]', b);
    function load() {
      api('clubs?page=' + state.page + (state.region ? '&region=' + encodeURIComponent(state.region) : '') + (state.q ? '&q=' + encodeURIComponent(state.q) : '')).then(function (j) {
        if (!j.ok) { list.innerHTML = '<p class="notice">' + esc(j.message) + '</p>'; return; }
        list.innerHTML = j.clubs.length ? '<div class="ccards">' + j.clubs.map(clubCard).join('') + '</div>' + pager(j.page, j.per, j.total) : '<div class="cm-empty"><p>조건에 맞는 모임이 아직 없어요.</p><p><a class="btn btn-sub" href="/community/write/?t=club">첫 모임 만들기</a></p></div>';
        bindPager(list, function (p) { state.page = p; load(); });
      });
    }
    $('[data-f=region]', b).addEventListener('change', function (e) { state.region = e.target.value; state.page = 1; load(); });
    $('[data-search]', b).addEventListener('submit', function (e) { e.preventDefault(); state.q = $('#club-q').value.trim(); state.page = 1; load(); });
    load();
  }

  // ---------- 페이지: 모임 하나 ----------
  function pageClub() {
    var id = Number(params.get('id'));
    if (!id) { notFound('모임 주소가 잘못됐어요.'); return; }
    function load() {
      Promise.all([api('clubs/' + id), getMe(), loadGames()]).then(function (r) {
        var j = r[0], me = r[1];
        if (!j.ok) { notFound(j.message); return; }
        var c = j.club;
        setTitle(c.name);
        var member = c.joined || c.mine;
        var action = !me ? needLogin('로그인하면 이 모임에 가입할 수 있어요.')
          : c.mine ? '<p class="muted">내가 만든 모임이에요.</p>'
          : c.joined ? '<button type="button" class="btn btn-sub" data-leave>모임 나가기</button>'
          : '<button type="button" class="btn btn-main" data-join>모임 가입하기</button>';
        var chat = c.openchat && c.openchat !== 'members' ? '<a class="btn btn-sub" href="' + esc(c.openchat) + '" target="_blank" rel="noopener nofollow">' + ico('i-chat') + '오픈채팅 들어가기</a>' : c.openchat === 'members' ? '<p class="muted small">가입하면 모임 오픈채팅 주소를 볼 수 있어요.</p>' : '';
        render(
          '<article class="cm-article">' +
          '<p class="cm-kicker"><span class="badge">' + esc(c.region) + (c.area ? ' · ' + esc(c.area) : '') + '</span><span class="muted">' + ico('i-people') + '회원 ' + c.member_count + '명</span></p>' +
          '<h1 class="cm-title">' + esc(c.name) + '</h1>' +
          gameChips(c.games) +
          '<div class="cm-text">' + esc(c.intro) + '</div>' +
          '<p class="cm-author">모임장 <b>' + esc(c.owner_nick) + '</b> · ' + ago(c.created_at) + ' 만듦</p>' +
          '<div class="cm-actions">' + action + chat + '<button type="button" class="btn btn-ghost" data-share-url>링크 보내기</button>' +
          (c.mine ? '<a class="btn btn-ghost" href="/community/write/?t=club&id=' + c.id + '">고치기</a><button type="button" class="btn btn-ghost" data-del>모임 닫기</button>' : (me ? '<button type="button" class="link-btn" data-flag="club" data-id="' + c.id + '">신고</button>' : '')) + '</div>' +
          '</article>' +
          '<section class="cm-sub"><div class="sec-row"><h2 class="h2">다가오는 일정</h2>' + (member ? '<span class="row-btns"><a class="btn btn-main btn-sm" href="/community/write/?t=event&club=' + c.id + '&kind=regular">정모 만들기</a><a class="btn btn-sub btn-sm" href="/community/write/?t=event&club=' + c.id + '">번개 만들기</a></span>' : '') + '</div>' +
          (j.upcoming.length ? '<div class="ecards">' + j.upcoming.map(function (e) { e.club_name = ''; return eventCard(e); }).join('') + '</div>' : '<p class="muted">잡힌 일정이 아직 없어요.</p>') +
          (j.past.length ? '<details class="past"><summary>지난 일정 ' + j.past.length + '개</summary><ul class="list">' + j.past.map(function (e) { return '<li><a href="/community/event/?id=' + e.id + '">' + whenText(e.starts_at) + ' · ' + KIND[e.kind] + ' · ' + esc(e.title) + '</a> (' + e.attendee_count + '명)</li>'; }).join('') + '</ul></details>' : '') +
          '</section>' +
          '<section class="cm-people"><h2 class="h3">회원 <span class="muted">' + j.members.length + '</span></h2><p class="people">' + j.members.map(function (m) { return '<span' + (m.role === 'owner' ? ' class="owner"' : '') + '>' + esc(m.nick) + '</span>'; }).join('') + '</p></section>' +
          commentsHTML(j.comments, 'club', id, me, me ? (member ? true : '모임 게시판은 가입한 사람만 쓸 수 있어요.') : false, '모임 게시판')
        );
        var b = bodyEl();
        var join = $('[data-join]', b), leave = $('[data-leave]', b), del = $('[data-del]', b);
        if (join) join.addEventListener('click', function () { api('clubs/' + id + '/join', { method: 'POST' }).then(function (x) { if (x.ok) { RS.toast('모임에 가입했어요.'); load(); } else RS.toast(x.message); }); });
        if (leave) leave.addEventListener('click', function () { if (confirm('모임에서 나갈까요?')) api('clubs/' + id + '/leave', { method: 'POST' }).then(function (x) { if (x.ok) load(); else RS.toast(x.message); }); });
        if (del) del.addEventListener('click', function () { if (confirm('모임을 닫을까요? 모임의 일정과 게시판 글도 모두 지워지고 되돌릴 수 없어요.')) api('clubs/' + id, { method: 'DELETE' }).then(function (x) { if (x.ok) location.href = '/community/clubs/'; else RS.toast(x.message); }); });
        $('[data-share-url]', b).addEventListener('click', function () { RS.shareOrCopy({ title: c.name, text: c.region + ' 보드게임 모임 · ' + c.name, url: location.href }); });
        bindComments(b, 'club', id, load);
      });
    }
    load();
  }

  // ---------- 페이지: 게시판 ----------
  function pageBoard() {
    var state = { cat: params.get('cat') || '', game: params.get('game') || '', q: params.get('q') || '', page: 1 };
    var b = bodyEl();
    loadGames().then(function () {
      var g = gameBySlug[state.game];
      b.innerHTML = '<div class="cm-filter"><div class="chips" role="radiogroup" aria-label="말머리">' + [['', '전체']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k]]; })).map(function (k) { return '<button type="button" class="chip" role="radio" aria-checked="' + (state.cat === k[0]) + '" data-cat="' + k[0] + '">' + k[1] + '</button>'; }).join('') + '</div>' +
        '<form class="cm-search" data-search><label class="sr" for="post-q">글 찾기</label><input id="post-q" type="search" placeholder="제목, 내용으로 찾기" maxlength="30" value="' + esc(state.q) + '"><button class="btn btn-sub btn-sm" type="submit">찾기</button></form>' +
        '<a class="btn btn-main btn-sm" href="/community/write/?t=post' + (g ? '&game=' + state.game : '') + '">' + ico('i-chat') + '글쓰기</a></div>' +
        (g ? '<p class="cm-gamefilter"><a class="pill" href="/games/' + state.game + '/">' + esc(g.n) + ' 하는법 보기</a> 이야기만 보고 있어요. <a href="/community/board/">전체 보기</a></p>' : '') +
        '<div data-list><p class="muted">불러오는 중이에요</p></div>';
      var list = $('[data-list]', b);
      function load() {
        api('posts?page=' + state.page + (state.cat ? '&cat=' + state.cat : '') + (state.game ? '&game=' + state.game : '') + (state.q ? '&q=' + encodeURIComponent(state.q) : '')).then(function (j) {
          if (!j.ok) { list.innerHTML = '<p class="notice">' + esc(j.message) + '</p>'; return; }
          list.innerHTML = j.posts.length ? '<ul class="plist">' + j.posts.map(postRow).join('') + '</ul>' + pager(j.page, j.per, j.total) : '<div class="cm-empty"><p>' + (g ? esc(g.n) + ' 이야기가 아직 없어요. 첫 글을 남겨 보세요.' : '조건에 맞는 글이 없어요.') + '</p></div>';
          bindPager(list, function (p) { state.page = p; load(); });
        });
      }
      $$('[data-cat]', b).forEach(function (c) {
        c.addEventListener('click', function () { state.cat = c.dataset.cat; state.page = 1; $$('[data-cat]', b).forEach(function (x) { x.setAttribute('aria-checked', String(x === c)); }); load(); });
      });
      $('[data-search]', b).addEventListener('submit', function (e) { e.preventDefault(); state.q = $('#post-q').value.trim(); state.page = 1; load(); });
      load();
    });
  }

  // ---------- 페이지: 글 하나 ----------
  function pagePost() {
    var id = Number(params.get('id'));
    if (!id) { notFound('글 주소가 잘못됐어요.'); return; }
    function load(count) {
      Promise.all([api('posts/' + id), getMe(), loadGames()]).then(function (r) {
        var j = r[0], me = r[1];
        if (!j.ok) { notFound(j.message); return; }
        var p = j.post;
        setTitle(p.title);
        render(
          '<article class="cm-article">' +
          '<p class="cm-kicker"><a class="badge badge-cat" href="/community/board/?cat=' + p.cat + '">' + esc(CATS[p.cat] || '') + '</a>' + (p.game && gameBySlug[p.game] ? '<a class="pill pill-sm" href="/games/' + p.game + '/">' + esc(gameBySlug[p.game].n) + '</a>' : '') + '</p>' +
          '<h1 class="cm-title">' + esc(p.title) + '</h1>' +
          '<p class="cm-author"><b>' + nick(p) + '</b> · ' + ago(p.created_at) + (p.updated_at !== p.created_at ? ' (고침)' : '') + ' · 조회 ' + p.views + '</p>' +
          (p.hidden ? '<p class="notice">운영 정책에 따라 다른 사람에게는 가려진 글이에요.</p>' : '') +
          (p.body ? '<div class="cm-text">' + esc(p.body) + '</div>' : '') +
          (j.poll ? '<div class="cm-poll" data-post-poll></div>' : '') +
          (p.cat === 'qna' ? (p.adopted ? '<p class="status status-ok">' + ico('i-check') + '<span>답변이 채택된 질문이에요.</span></p>' : '<p class="tip">' + (p.mine ? '도움이 된 댓글에 ‘이 답변 채택하기’를 누르면 답한 사람이 점수와 별 3개를 받아요.' : '정확한 답을 달아 채택되면 +' + (window.RRG ? window.RRG.RULES.adopted[0] : 15) + '점과 별 3개를 받아요.') + '</p>') : '') +
          '<div class="cm-actions"><button type="button" class="btn ' + (p.liked ? 'btn-main' : 'btn-sub') + '" data-like aria-pressed="' + p.liked + '">' + ico('i-heart') + '좋아요 ' + p.likes + '</button>' +
          '<button type="button" class="btn btn-ghost" data-share-url>링크 보내기</button>' +
          (p.mine ? '<a class="btn btn-ghost" href="/community/write/?t=post&id=' + p.id + '">고치기</a><button type="button" class="btn btn-ghost" data-del>지우기</button>' : (me ? '<button type="button" class="link-btn" data-flag="post" data-id="' + p.id + '">신고</button>' : '')) + '</div>' +
          '</article>' + commentsHTML(j.comments, 'post', id, me, me ? true : false, p.cat === 'qna' ? '답변' : '댓글', p.cat === 'qna' && p.mine && !p.adopted) +
          '<p class="center"><a class="btn btn-sub" href="/community/board/">목록으로</a></p>'
        );
        var b = bodyEl();
        var pp = $('[data-post-poll]', b);
        if (pp && RRS) {
          var paintPoll = function (poll) { poll.id = id; pp.innerHTML = RRS.pollHTML(poll, me); RRS.bindPoll(pp, poll, me, paintPoll); };
          paintPoll(j.poll);
        }
        $$('[data-adopt]', b).forEach(function (a) {
          a.addEventListener('click', function () {
            if (!confirm('이 댓글을 답변으로 채택할까요? 한 번 채택하면 바꿀 수 없어요.')) return;
            api('posts/' + id + '/adopt', { method: 'POST', body: { comment: Number(a.dataset.adopt) } }).then(function (x) {
              if (!x.ok) { RS.toast(x.message); return; }
              if (x.gain) gain(x.gain); else RS.toast('답변을 채택했어요.');
              load();
            });
          });
        });
        $('[data-like]', b).addEventListener('click', function () {
          if (!me) { location.href = loginLink(); return; }
          api('posts/' + id + '/like', { method: 'POST' }).then(function (x) {
            if (!x.ok) { if (RRS) RRS.notice(esc(x.message)); else RS.toast(x.message); return; }
            var btn = $('[data-like]', b);
            btn.className = 'btn ' + (x.liked ? 'btn-main' : 'btn-sub');
            btn.setAttribute('aria-pressed', String(x.liked));
            btn.innerHTML = ico('i-heart') + '좋아요 ' + x.likes;
          });
        });
        var del = $('[data-del]', b);
        if (del) del.addEventListener('click', function () { if (confirm('이 글을 지울까요? 댓글도 함께 지워져요.')) api('posts/' + id, { method: 'DELETE' }).then(function (x) { if (x.ok) location.href = '/community/board/'; else RS.toast(x.message); }); });
        $('[data-share-url]', b).addEventListener('click', function () { RS.shareOrCopy({ title: p.title, url: location.href }); });
        bindComments(b, 'post', id, load);
      });
    }
    load();
  }

  // ---------- 페이지: 글쓰기 (글, 모임, 일정) ----------
  function gamePicker(name, initial, max) {
    var chosen = String(initial || '').split(',').filter(Boolean);
    var html = '<div class="gpick" data-gpick="' + name + '"><input type="hidden" name="' + name + '" value="' + esc(chosen.join(',')) + '">' +
      '<div class="gpick-chips" data-chips></div><input class="gpick-in" list="gpick-list" placeholder="게임 이름을 적고 골라요 (최대 ' + max + '개)" aria-label="게임 고르기" data-gin>' +
      '<datalist id="gpick-list">' + games.map(function (g) { return '<option value="' + esc(g.n) + '">'; }).join('') + '</datalist></div>';
    return html;
  }
  function bindGamePicker(root, max) {
    var box = $('[data-gpick]', root);
    if (!box) return;
    var hidden = $('input[type=hidden]', box), chips = $('[data-chips]', box), input = $('[data-gin]', box);
    var chosen = hidden.value.split(',').filter(Boolean);
    function paint() {
      hidden.value = chosen.join(',');
      chips.innerHTML = chosen.map(function (s) { var g = gameBySlug[s]; return '<button type="button" class="pill pill-sm" data-rm="' + s + '">' + esc(g ? g.n : s) + ' ×</button>'; }).join('');
      $$('[data-rm]', chips).forEach(function (b) { b.addEventListener('click', function () { chosen = chosen.filter(function (x) { return x !== b.dataset.rm; }); paint(); }); });
      input.disabled = chosen.length >= max;
    }
    function add() {
      var v = input.value.trim();
      var g = games.filter(function (x) { return x.n === v || x.a.indexOf(v) >= 0; })[0];
      if (g && chosen.indexOf(g.s) < 0 && chosen.length < max) { chosen.push(g.s); input.value = ''; paint(); }
    }
    input.addEventListener('change', add);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    paint();
  }
  function pageWrite() {
    var t = params.get('t') || 'post', id = Number(params.get('id')) || 0;
    var LABEL = { post: '글', club: '모임', event: '일정' };
    if (!LABEL[t]) t = 'post';
    Promise.all([getMe(), loadGames()]).then(function (r) {
      var me = r[0];
      setTitle((id ? LABEL[t] + ' 고치기' : t === 'event' ? '정모·번개 열기' : t === 'club' ? '모임 만들기' : '글쓰기'));
      if (!me) { render('<h1 class="cm-title">' + (t === 'event' ? '정모·번개 열기' : t === 'club' ? '모임 만들기' : '글쓰기') + '</h1>' + needLogin('로그인한 회원만 ' + (t === 'post' ? '글을 쓸' : t === 'club' ? '모임을 만들' : '일정을 열') + ' 수 있어요.')); return; }
      var getOld = id ? api((t === 'post' ? 'posts/' : t === 'club' ? 'clubs/' : 'events/') + id) : Promise.resolve(null);
      var getClubs = t === 'event' ? api('clubs?mine=1') : Promise.resolve(null);
      Promise.all([getOld, getClubs]).then(function (rr) {
        var old = rr[0] ? (rr[0].post || rr[0].club || rr[0].event) : null;
        if (id && (!old || !old.mine)) { notFound('내가 만든 ' + LABEL[t] + '만 고칠 수 있어요.'); return; }
        old = old || {};
        var form = '';
        if (t === 'post') {
          var cat = old.cat || params.get('cat') || 'free';
          if (USER_CATS.indexOf(cat) < 0) cat = 'free';
          var catKeys = id ? USER_CATS.filter(function (k) { return (k === 'poll') === (cat === 'poll'); }) : USER_CATS;
          form = '<label class="field"><span>말머리</span><select name="cat" data-cat>' + catKeys.map(function (k) { return '<option value="' + k + '"' + (k === cat ? ' selected' : '') + '>' + CATS[k] + '</option>'; }).join('') + '</select></label>' +
            '<label class="field"><span>제목</span><input name="title" maxlength="60" required value="' + esc(old.title || '') + '"></label>' +
            '<div class="field"><span>어떤 게임 이야기인가요? (선택)</span>' + gamePicker('game', old.game || params.get('game') || '', 1) + '</div>' +
            (id ? '' : '<div class="field" data-poll-fields' + (cat === 'poll' ? '' : ' hidden') + '><span>투표 보기 (2~6개)</span><div class="opt-rows">' + [0, 1, 2, 3].map(function (i) { return '<input data-opt maxlength="40" placeholder="보기 ' + (i + 1) + (i < 2 ? ' (꼭 적어 주세요)' : ' (선택)') + '">'; }).join('') + '</div><div class="row-btns" style="margin-top:8px"><button type="button" class="btn btn-ghost btn-sm" data-add-opt>보기 더하기</button><label class="field field-inline" style="margin:0"><span>투표 기간</span><select name="days"><option value="3">3일</option><option value="7" selected>7일</option><option value="14">14일</option><option value="30">30일</option></select></label></div></div>') +
            '<label class="field"><span data-body-label>' + (cat === 'poll' ? '설명 (선택)' : '내용') + '</span><textarea name="body" rows="' + (cat === 'poll' ? 4 : 12) + '" maxlength="5000"' + (cat === 'poll' ? '' : ' required') + ' placeholder="규칙 질문이라면 어떤 판(에디션)인지, 몇 명이서 했는지 함께 적어 주면 답하기 쉬워요.">' + esc(old.body || '') + '</textarea></label>';
        } else if (t === 'club') {
          form = '<label class="field"><span>모임 이름</span><input name="name" maxlength="30" required value="' + esc(old.name || '') + '" placeholder="예: 신촌 퇴근길 보드게임"></label>' +
            '<div class="field-row"><label class="field"><span>지역</span><select name="region" required>' + regionOptions(old.region || me.region || '', '골라 주세요') + '</select></label>' +
            '<label class="field"><span>동네 (선택)</span><input name="area" maxlength="30" value="' + esc(old.area || '') + '" placeholder="예: 신촌, 홍대"></label></div>' +
            '<div class="field"><span>주로 하는 게임 (선택)</span>' + gamePicker('games', old.games || '', 8) + '</div>' +
            '<label class="field"><span>모임 소개</span><textarea name="intro" rows="8" maxlength="2000" required placeholder="언제, 어디서, 어떤 분위기로 모이는지 적어 주세요. 처음 오는 사람이 알아야 할 것도 함께요.">' + esc(old.intro || '') + '</textarea></label>' +
            '<label class="field"><span>카카오톡 오픈채팅 주소 (선택, 가입한 회원에게만 보여요)</span><input name="openchat" maxlength="140" inputmode="url" placeholder="https://open.kakao.com/o/..." value="' + esc(old.openchat && old.openchat !== 'members' ? old.openchat : '') + '"></label>';
        } else {
          var myClubs = rr[1] && rr[1].ok ? rr[1].clubs : [];
          var clubId = Number(old.club_id || params.get('club') || 0);
          var kind = old.kind || params.get('kind') || 'flash';
          var tomorrow = new Date(Date.now() + 9 * 3600e3 + 86400e3).toISOString().slice(0, 10) + 'T19:00';
          var minStamp = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16);
          form = (id ? '' : '<label class="field"><span>어디에 여나요?</span><select name="club"><option value="0">누구나 참여하는 번개</option>' + myClubs.map(function (c) { return '<option value="' + c.id + '"' + (c.id === clubId ? ' selected' : '') + '>' + esc(c.name) + ' 모임</option>'; }).join('') + '</select></label>') +
            '<div class="chips" role="radiogroup" aria-label="종류" data-kindpick>' + [['flash', '번개 (한 번 모이기)'], ['regular', '정모 (모임 정기 모임)']].map(function (k) { return '<button type="button" class="chip" role="radio" aria-checked="' + (kind === k[0]) + '" data-k="' + k[0] + '">' + k[1] + '</button>'; }).join('') + '</div><input type="hidden" name="kind" value="' + kind + '">' +
            '<label class="field"><span>제목</span><input name="title" maxlength="40" required value="' + esc(old.title || '') + '" placeholder="예: 금요일 저녁 루미큐브 한 판"></label>' +
            '<div class="field-row"><label class="field"><span>날짜와 시각</span><input type="datetime-local" name="starts_at" required min="' + minStamp + '" value="' + esc(old.starts_at || tomorrow) + '"></label>' +
            '<label class="field"><span>최대 인원</span><input type="number" name="max_people" min="2" max="50" required value="' + (old.max_people || 4) + '"></label></div>' +
            '<div class="field-row"><label class="field"><span>지역</span><select name="region" required>' + regionOptions(old.region || me.region || '', '골라 주세요') + '</select></label>' +
            '<label class="field"><span>만날 곳</span><input name="place" maxlength="60" required value="' + esc(old.place || '') + '" placeholder="예: 강남역 ○○보드게임카페"></label></div>' +
            '<label class="field"><span>참가비 (선택)</span><input name="fee" maxlength="30" value="' + esc(old.fee || '') + '" placeholder="예: 카페 이용료 각자, 1만 원"></label>' +
            '<div class="field"><span>할 게임 (선택)</span>' + gamePicker('games', old.games || params.get('game') || '', 8) + '</div>' +
            '<label class="field"><span>소개</span><textarea name="body" rows="6" maxlength="2000" placeholder="처음 오는 사람도 괜찮은지, 준비물, 연락 방법 등을 적어 주세요.">' + esc(old.body || '') + '</textarea></label>';
        }
        render('<h1 class="cm-title">' + esc(document.title.replace(' - 룰룰', '')) + '</h1>' +
          '<form class="cm-form" data-wform novalidate>' + form +
          '<label class="hp" aria-hidden="true">비워 두세요<input name="website" tabindex="-1" autocomplete="off"></label>' +
          '<p class="muted small">개인 정보(전화번호, 주소)는 적지 마세요. <a href="/community/rules/">커뮤니티 이용 규칙</a>을 어기면 글이 가려질 수 있어요.</p>' +
          '<p class="form-msg" role="status" aria-live="polite"></p><div class="row-btns"><button class="btn btn-main" type="submit">' + (id ? '고친 내용 저장' : '올리기') + '</button><a class="btn btn-ghost" href="javascript:history.back()">취소</a></div></form>');
        var f = $('[data-wform]');
        bindGamePicker(f, t === 'post' ? 1 : 8);
        var catSel = $('[data-cat]', f), pf = $('[data-poll-fields]', f);
        if (catSel && pf) {
          catSel.addEventListener('change', function () {
            var isPoll = catSel.value === 'poll';
            pf.hidden = !isPoll;
            f.body.required = !isPoll; f.body.rows = isPoll ? 4 : 12;
            $('[data-body-label]', f).textContent = isPoll ? '설명 (선택)' : '내용';
          });
          $('[data-add-opt]', f).addEventListener('click', function (ev) {
            var rows = $('.opt-rows', f), n = $$('[data-opt]', rows).length;
            if (n >= 6) { ev.target.disabled = true; return; }
            rows.insertAdjacentHTML('beforeend', '<input data-opt maxlength="40" placeholder="보기 ' + (n + 1) + ' (선택)">');
            if (n + 1 >= 6) ev.target.disabled = true;
          });
        }
        var kp = $('[data-kindpick]', f);
        if (kp) $$('[data-k]', kp).forEach(function (c) { c.addEventListener('click', function () { f.kind.value = c.dataset.k; $$('[data-k]', kp).forEach(function (x) { x.setAttribute('aria-checked', String(x === c)); }); }); });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var m = $('.form-msg', f), btn = $('button[type=submit]', f);
          var body = {};
          Array.prototype.forEach.call(f.elements, function (el) { if (el.name) body[el.name] = el.value; });
          if (t === 'post') body.game = body.game || '';
          if (t === 'post' && body.cat === 'poll' && !id) {
            body.options = $$('[data-opt]', f).map(function (x) { return x.value.trim(); }).filter(Boolean);
            if (body.options.length < 2) { msg(m, '투표 보기를 두 개 이상 적어 주세요.', true); return; }
          }
          btn.disabled = true; msg(m, '올리는 중이에요');
          var path = (t === 'post' ? 'posts' : t === 'club' ? 'clubs' : 'events') + (id ? '/' + id : '');
          api(path, { method: 'POST', body: body }).then(function (j) {
            btn.disabled = false;
            if (!j.ok) { msg(m, j.message || '올리지 못했어요.', true); if (j._status === 401) setTimeout(function () { location.href = loginLink(); }, 800); return; }
            gainLater(j.gain);
            location.href = (t === 'post' ? '/community/post/?id=' : t === 'club' ? '/community/club/?id=' : '/community/event/?id=') + j.id;
          });
        });
      });
    });
  }

  // ---------- 페이지: 로그인, 회원가입, 내 정보 ----------
  function pageAccount() {
    var next = params.get('next');
    if (!next || next.charAt(0) !== '/' || next.charAt(1) === '/') next = '/community/';
    getMe(true).then(function (me) {
      if (me) { myPage(me); return; }
      var mode = params.get('mode') === 'signup' ? 'signup' : 'login';
      setTitle(mode === 'signup' ? '회원가입' : '로그인');
      render('<div class="auth">' +
        '<div class="tabs auth-tabs" role="tablist"><button role="tab" aria-selected="' + (mode === 'login') + '" data-mode="login">로그인</button><button role="tab" aria-selected="' + (mode === 'signup') + '" data-mode="signup">회원가입</button></div>' +
        '<form class="cm-form" data-login' + (mode === 'login' ? '' : ' hidden') + '><h1 class="cm-title">로그인</h1>' +
        '<label class="field"><span>아이디</span><input name="login" autocomplete="username" autocapitalize="none" required maxlength="20"></label>' +
        '<label class="field"><span>비밀번호</span><input type="password" name="password" autocomplete="current-password" required maxlength="64"></label>' +
        '<p class="form-msg" role="status" aria-live="polite"></p><button class="btn btn-main btn-block" type="submit">로그인</button>' +
        '<p class="muted small">비밀번호를 잊었다면 <a href="/contact/?kind=etc">문의하기</a>로 아이디와 닉네임을 알려 주세요. 확인한 뒤 임시 비밀번호를 드려요.</p></form>' +
        '<form class="cm-form" data-signup' + (mode === 'signup' ? '' : ' hidden') + '><h1 class="cm-title">회원가입</h1>' +
        '<p class="muted">이메일이나 전화번호 없이 아이디와 닉네임만으로 가입해요.</p>' +
        '<label class="field"><span>아이디 (영문 소문자, 숫자, 밑줄 4~20자)</span><input name="login" autocomplete="username" autocapitalize="none" required minlength="4" maxlength="20" pattern="[a-z0-9_]{4,20}"></label>' +
        '<label class="field"><span>닉네임 (한글, 영문, 숫자 2~12자)</span><input name="nick" required minlength="2" maxlength="12"></label>' +
        '<label class="field"><span>비밀번호 (영문과 숫자를 섞어 8자 이상)</span><input type="password" name="password" autocomplete="new-password" required minlength="8" maxlength="64"></label>' +
        '<label class="field"><span>비밀번호 확인</span><input type="password" name="password2" autocomplete="new-password" required maxlength="64"></label>' +
        '<label class="field"><span>주로 활동하는 지역 (선택)</span><select name="region">' + regionOptions('', '고르지 않음') + '</select></label>' +
        '<div class="consent"><label class="check"><input type="checkbox" name="all" data-all><span><b>모두 동의해요</b></span></label>' +
        '<label class="check"><input type="checkbox" name="age14" data-agree><span>만 14세 이상이에요 (필수)</span></label>' +
        '<label class="check"><input type="checkbox" name="terms" data-agree><span><a href="/terms/" target="_blank">이용약관</a>과 <a href="/community/rules/" target="_blank">커뮤니티 이용 규칙</a>에 동의해요 (필수)</span></label>' +
        '<label class="check"><input type="checkbox" name="privacy" data-agree><span>개인정보 수집·이용에 동의해요 (필수)<small>아이디, 닉네임, 비밀번호(암호화), 지역(선택)을 회원 확인과 커뮤니티 이용에 쓰고, 탈퇴하면 바로 지워요. <a href="/privacy/" target="_blank">자세히</a></small></span></label></div>' +
        '<label class="hp" aria-hidden="true">비워 두세요<input name="website" tabindex="-1" autocomplete="off"></label>' +
        '<p class="form-msg" role="status" aria-live="polite"></p><button class="btn btn-main btn-block" type="submit">가입하기</button></form></div>');
      var b = bodyEl(), lf = $('[data-login]', b), sf = $('[data-signup]', b);
      $$('[data-mode]', b).forEach(function (t) {
        t.addEventListener('click', function () {
          var on = t.dataset.mode;
          $$('[data-mode]', b).forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); });
          lf.hidden = on !== 'login'; sf.hidden = on !== 'signup';
          setTitle(on === 'signup' ? '회원가입' : '로그인');
        });
      });
      var all = $('[data-all]', sf);
      all.addEventListener('change', function () { $$('[data-agree]', sf).forEach(function (c) { c.checked = all.checked; }); });
      $$('[data-agree]', sf).forEach(function (c) { c.addEventListener('change', function () { all.checked = $$('[data-agree]', sf).every(function (x) { return x.checked; }); }); });
      lf.addEventListener('submit', function (e) {
        e.preventDefault();
        var m = $('.form-msg', lf);
        msg(m, '확인하는 중이에요');
        api('auth/login', { method: 'POST', body: { login: lf.login.value.trim(), password: lf.password.value } }).then(function (j) {
          if (!j.ok) { msg(m, j.message, true); return; }
          setMe(j.user); location.href = next;
        });
      });
      sf.addEventListener('submit', function (e) {
        e.preventDefault();
        var m = $('.form-msg', sf);
        if (sf.password.value !== sf.password2.value) { msg(m, '비밀번호 확인이 달라요.', true); return; }
        msg(m, '가입하는 중이에요');
        api('auth/signup', { method: 'POST', body: { login: sf.login.value.trim().toLowerCase(), nick: sf.nick.value.trim(), password: sf.password.value, region: sf.region.value, age14: sf.age14.checked, terms: sf.terms.checked, privacy: sf.privacy.checked, website: sf.website.value } }).then(function (j) {
          if (!j.ok) { msg(m, j.message, true); return; }
          setMe(j.user); gainLater(j.gain || { pts: 0, badges: [] }); RS.toast('가입을 환영해요!'); location.href = next;
        });
      });
    });
  }
  function myPage(me) {
    setTitle('내 정보');
    Promise.all([api('my'), loadGames()]).then(function (r) {
      var j = r[0] || {};
      render('<h1 class="cm-title">' + esc(me.nick) + '님의 정보</h1>' +
        '<div class="my-growth" data-growth></div>' +
        '<p style="margin:14px 0 24px"><a class="btn btn-sub btn-sm" href="/community/user/?n=' + encodeURIComponent(me.nick) + '">다른 사람에게 보이는 내 프로필</a> <a class="btn btn-ghost btn-sm" href="/saved/">저장한 게임</a></p>' +
        '<div class="my-grid"><section class="my-box"><h2 class="h3">내 모임</h2>' + ((j.clubs || []).length ? '<ul class="list">' + j.clubs.map(function (c) { return '<li><a href="/community/club/?id=' + c.id + '">' + esc(c.name) + '</a> <span class="muted small">' + esc(c.region) + ' · ' + c.member_count + '명' + (c.role === 'owner' ? ' · 모임장' : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">가입한 모임이 없어요. <a href="/community/clubs/">모임 찾기</a></p>') + '</section>' +
        '<section class="my-box"><h2 class="h3">참여할 일정</h2>' + ((j.events || []).length ? '<ul class="list">' + j.events.map(function (e) { return '<li><a href="/community/event/?id=' + e.id + '">' + esc(e.title) + '</a> <span class="muted small">' + whenText(e.starts_at) + ' · ' + KIND[e.kind] + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">참여 신청한 일정이 없어요. <a href="/community/events/">일정 보기</a></p>') + '</section>' +
        '<section class="my-box"><h2 class="h3">내가 쓴 글</h2>' + ((j.posts || []).length ? '<ul class="list">' + j.posts.map(function (p) { return '<li><a href="/community/post/?id=' + p.id + '">' + esc(p.title) + '</a> <span class="muted small">' + ago(p.created_at) + (p.comments ? ' · 댓글 ' + p.comments : '') + (p.hidden ? ' · 가려짐' : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">아직 쓴 글이 없어요.</p>') + '</section></div>' +
        '<form class="cm-form my-form" data-profile><h2 class="h3">프로필 고치기</h2><p class="muted small">아이디: ' + esc(me.login) + '</p>' +
        '<label class="field"><span>닉네임</span><input name="nick" maxlength="12" required value="' + esc(me.nick) + '"></label>' +
        '<label class="field"><span>주로 활동하는 지역</span><select name="region">' + regionOptions(me.region, '고르지 않음') + '</select></label>' +
        '<label class="field"><span>한 줄 소개 (선택)</span><input name="bio" maxlength="80" value="' + esc(me.bio || '') + '" placeholder="예: 협력 게임을 좋아해요"></label>' +
        '<p class="form-msg" role="status"></p><button class="btn btn-sub" type="submit">저장</button></form>' +
        '<form class="cm-form my-form" data-pw><h2 class="h3">비밀번호 바꾸기</h2>' +
        '<label class="field"><span>지금 비밀번호</span><input type="password" name="current" autocomplete="current-password" required></label>' +
        '<label class="field"><span>새 비밀번호 (영문과 숫자를 섞어 8자 이상)</span><input type="password" name="next" autocomplete="new-password" required minlength="8"></label>' +
        '<p class="form-msg" role="status"></p><button class="btn btn-sub" type="submit">바꾸기</button></form>' +
        '<div class="row-btns my-end"><button type="button" class="btn btn-sub" data-logout>로그아웃</button><button type="button" class="btn btn-ghost" data-quit>회원 탈퇴</button></div>' +
        '<form class="cm-form my-form" data-quitform hidden><h2 class="h3">회원 탈퇴</h2><p>탈퇴하면 계정 정보는 바로 지워지고 되돌릴 수 없어요. 내가 만든 모임과 일정은 함께 지워지고, 쓴 글과 댓글은 ‘탈퇴한 회원’ 이름으로 남아요. 지우고 싶은 글은 먼저 지워 주세요.</p>' +
        '<label class="field"><span>비밀번호를 한 번 더 입력해 주세요</span><input type="password" name="password" autocomplete="current-password" required></label>' +
        '<p class="form-msg" role="status"></p><button class="btn btn-main" type="submit">탈퇴하기</button></form>');
      var b = bodyEl();
      if (RRS) RRS.renderGrowth($('[data-growth]', b), me);
      var pf = $('[data-profile]', b);
      pf.addEventListener('submit', function (e) {
        e.preventDefault();
        api('auth/profile', { method: 'POST', body: { nick: pf.nick.value.trim(), region: pf.region.value, bio: pf.bio.value, badge: me.badge || '' } }).then(function (x) {
          if (x.ok) { setMe(x.user); msg($('.form-msg', pf), '저장했어요.'); } else msg($('.form-msg', pf), x.message, true);
        });
      });
      var pw = $('[data-pw]', b);
      pw.addEventListener('submit', function (e) {
        e.preventDefault();
        api('auth/password', { method: 'POST', body: { current: pw.current.value, next: pw.next.value } }).then(function (x) {
          if (x.ok) { pw.reset(); msg($('.form-msg', pw), '비밀번호를 바꿨어요. 다른 기기에서는 다시 로그인해야 해요.'); } else msg($('.form-msg', pw), x.message, true);
        });
      });
      $('[data-logout]', b).addEventListener('click', function () { api('auth/logout', { method: 'POST' }).then(function () { setMe(null); location.href = '/community/'; }); });
      var qf = $('[data-quitform]', b);
      $('[data-quit]', b).addEventListener('click', function () { qf.hidden = !qf.hidden; });
      qf.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!confirm('정말 탈퇴할까요? 되돌릴 수 없어요.')) return;
        api('auth/delete', { method: 'POST', body: { password: qf.password.value } }).then(function (x) {
          if (x.ok) { setMe(null); alert('탈퇴했어요. 그동안 고마웠어요.'); location.href = '/'; } else msg($('.form-msg', qf), x.message, true);
        });
      });
    });
  }

  // ---------- 제휴·문의 ----------
  var cf = $('[data-contact]');
  if (cf) {
    var k = params.get('kind');
    if (k && cf.kind.querySelector('option[value="' + k + '"]')) cf.kind.value = k;
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = $('.form-msg', cf), btn = $('button[type=submit]', cf);
      if (!cf.kind.value) { msg(m, '문의 종류를 골라 주세요.', true); cf.kind.focus(); return; }
      if (!cf.agree.checked) { msg(m, '개인정보 수집·이용에 동의해 주세요.', true); return; }
      btn.disabled = true; msg(m, '보내는 중이에요');
      var body = { page: location.pathname };
      Array.prototype.forEach.call(cf.elements, function (el) { if (el.name) body[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
      api('contact', { method: 'POST', body: body }).then(function (j) {
        btn.disabled = false;
        if (!j.ok) { msg(m, j.message || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.', true); return; }
        cf.innerHTML = '<div class="cm-done"><h2 class="h2">문의를 받았어요</h2><p>남겨 주신 이메일로 답을 드릴게요. 보통 영업일 기준 2~3일 안에 연락드려요.</p><p><a class="btn btn-sub" href="/">처음 화면으로</a></p></div>';
        window.scrollTo({ top: cf.getBoundingClientRect().top + window.scrollY - 120 });
      });
    });
  }

  // ---------- 시작 ----------
  var root = $('[data-cm]');
  if (!root) return;
  var PAGES = { hub: pageHub, events: pageEvents, event: pageEvent, clubs: pageClubs, club: pageClub, board: pageBoard, post: pagePost, write: pageWrite, account: pageAccount };
  var fn = PAGES[root.dataset.cm];
  if (fn) fn();
})();
