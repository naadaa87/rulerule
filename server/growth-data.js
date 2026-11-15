// 룰룰 성장 규칙: 등급, 활동 점수, 배지
// 서버(점수 주기)와 빌드(안내 페이지, 화면용 growth.js)가 함께 써요.
// 아래 함수들은 바깥 변수를 쓰지 않아야 해요. 빌드가 함수 글자 그대로 화면용 파일에 옮겨 적어요.

export const LEVELS = [
  { lv: 1, name: '첫 판', min: 0, color: '#9AA3B2', icon: 'pawn', line: '룰룰에 처음 앉았어요. 한 판 해 볼까요?' },
  { lv: 2, name: '주사위 굴림꾼', min: 30, color: '#55B9A7', icon: 'die', line: '주사위가 손에 익기 시작했어요.' },
  { lv: 3, name: '카드 수집가', min: 90, color: '#3E9C8B', icon: 'cards', line: '해 본 게임이 차곡차곡 쌓여요.' },
  { lv: 4, name: '룰 탐험가', min: 200, color: '#E8A93A', icon: 'compass', line: '처음 보는 게임도 겁나지 않아요.' },
  { lv: 5, name: '보드게이머', min: 380, color: '#F08A3E', icon: 'meeple', line: '모임에서 게임을 고르는 사람이에요.' },
  { lv: 6, name: '전략가', min: 650, color: '#F05B48', icon: 'rook', line: '한 수 앞을 내다봐요.' },
  { lv: 7, name: '테이블 마스터', min: 1000, color: '#D9435F', icon: 'table', line: '판을 깔면 사람이 모여요.' },
  { lv: 8, name: '룰 마스터', min: 1500, color: '#7A5AC8', icon: 'book', line: '헷갈리는 규칙은 이 사람에게 물어봐요.' },
  { lv: 9, name: '보드게임 장인', min: 2200, color: '#233552', icon: 'medal', line: '룰룰을 함께 만들어 가는 사람이에요.' },
  { lv: 10, name: '룰룰 레전드', min: 3200, color: '#C99A1E', icon: 'crown', line: '룰룰의 전설로 남았어요.' },
];

// act: [점수, 하루에 점수를 받는 최대 횟수(0이면 제한 없음), 설명]
export const RULES = {
  welcome: [10, 0, '회원가입'],
  checkin: [2, 1, '출석 체크'],
  streak7: [10, 1, '7일 연속 출석 보너스'],
  rate: [5, 0, '게임 별점 남기기 (게임마다 한 번)'],
  review: [5, 0, '후기 20자 이상 쓰기 (게임마다 한 번)'],
  played: [1, 10, '해 봤어요 체크 (게임마다 한 번)'],
  post: [5, 4, '게시판 글쓰기'],
  comment: [2, 10, '댓글 쓰기'],
  vote: [1, 10, '투표 참여'],
  liked: [2, 20, '내 글이 좋아요를 받음'],
  helpful: [2, 20, '내 후기가 도움돼요를 받음'],
  adopted: [15, 0, '내 댓글이 답변으로 채택됨'],
  adopt: [2, 5, '규칙 질문에 답변 채택하기'],
  club: [10, 1, '모임 만들기'],
  event: [5, 2, '정모·번개 열기'],
  join: [3, 3, '정모·번개 참여 신청'],
  manner: [1, 10, '함께한 사람 매너 평가하기'],
};

// 배지: key, 이름, 받는 조건, 아이콘, 색
export const BADGES = [
  { key: 'welcome', name: '첫 발자국', desc: '룰룰에 가입했어요', icon: 'flag', color: '#55B9A7' },
  { key: 'checkin7', name: '일주일 개근', desc: '7일 연속 출석했어요', icon: 'fire', color: '#F05B48' },
  { key: 'checkin30', name: '단골손님', desc: '출석을 30번 했어요', icon: 'cal', color: '#E8A93A' },
  { key: 'review1', name: '첫 후기', desc: '게임 후기를 처음 남겼어요', icon: 'pen', color: '#55B9A7' },
  { key: 'review10', name: '후기 장인', desc: '후기를 10개 남겼어요', icon: 'pen', color: '#7A5AC8' },
  { key: 'played10', name: '도감 10', desc: '해 본 게임이 10개가 됐어요', icon: 'cards', color: '#3E9C8B' },
  { key: 'played30', name: '도감 30', desc: '해 본 게임이 30개가 됐어요', icon: 'cards', color: '#F08A3E' },
  { key: 'playedall', name: '도감 완성', desc: '룰룰의 모든 게임을 해 봤어요', icon: 'crown', color: '#C99A1E' },
  { key: 'trad5', name: '전통놀이 지킴이', desc: '전통놀이를 5가지 해 봤어요', icon: 'yut', color: '#D9435F' },
  { key: 'solver1', name: '규칙 해결사', desc: '답변이 처음 채택됐어요', icon: 'check', color: '#55B9A7' },
  { key: 'solver5', name: '룰 박사', desc: '답변이 5번 채택됐어요', icon: 'book', color: '#233552' },
  { key: 'vote1', name: '한 표', desc: '투표에 처음 참여했어요', icon: 'vote', color: '#E8A93A' },
  { key: 'post10', name: '이야기꾼', desc: '게시판에 글을 10개 썼어요', icon: 'chat', color: '#F08A3E' },
  { key: 'star50', name: '인기쟁이', desc: '받은 별이 50개가 됐어요', icon: 'star', color: '#F05B48' },
  { key: 'host', name: '모임장', desc: '보드게임 모임을 만들었어요', icon: 'people', color: '#233552' },
  { key: 'meet5', name: '모임 단골', desc: '정모·번개에 5번 참여했어요', icon: 'meeple', color: '#3E9C8B' },
  { key: 'manner', name: '매너 플레이어', desc: '매너 별점 4.5 이상 (평가 5개 이상)', icon: 'heart', color: '#D9435F' },
];

export function levelOf(xp, LEVELS) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) cur = l;
  const next = LEVELS.find((l) => l.min > xp) || null;
  const pct = next ? Math.max(0, Math.min(100, Math.round(((xp - cur.min) / (next.min - cur.min)) * 100))) : 100;
  return { lv: cur.lv, name: cur.name, color: cur.color, icon: cur.icon, line: cur.line, min: cur.min, next: next ? next.min : null, nextName: next ? next.name : '', pct, need: next ? next.min - xp : 0 };
}

// 그림 조각 (24×24 안에 그리는 간단한 선 그림)
export function glyph(name) {
  const s = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const f = 'fill="currentColor"';
  const G = {
    pawn: `<circle cx="12" cy="7" r="3.2" ${s}/><path d="M8.5 19.5c.3-3.5 1.5-6 3.5-7.5 2 1.5 3.2 4 3.5 7.5z" ${s}/><path d="M7 19.5h10" ${s}/>`,
    die: `<rect x="4" y="4" width="16" height="16" rx="4" ${s}/><circle cx="9" cy="9" r="1.4" ${f}/><circle cx="15" cy="15" r="1.4" ${f}/><circle cx="12" cy="12" r="1.4" ${f}/>`,
    cards: `<rect x="3.5" y="6" width="10" height="13.5" rx="2" transform="rotate(-10 8.5 12.7)" ${s}/><rect x="10" y="4.5" width="10" height="13.5" rx="2" transform="rotate(8 15 11.2)" ${s}/>`,
    compass: `<circle cx="12" cy="12" r="8.5" ${s}/><path d="m15.5 8.5-2 5-5 2 2-5z" ${s}/>`,
    meeple: `<path d="M12 4a2.6 2.6 0 0 1 2.6 2.6c0 1 .5 1.7 1.4 2.1l3.3 1.4c.9.4.7 1.8-.3 1.9l-2.4.3 2.2 6.2c.2.6-.2 1.2-.9 1.2h-3l-2.9-4-2.9 4h-3c-.7 0-1.1-.6-.9-1.2l2.2-6.2-2.4-.3c-1-.1-1.2-1.5-.3-1.9L8 8.7c.9-.4 1.4-1.1 1.4-2.1A2.6 2.6 0 0 1 12 4z" ${s}/>`,
    rook: `<path d="M6.5 20h11M8 20l1-8h6l1 8M7 7V4h2v1.5h2V4h2v1.5h2V4h2v3l-2 2H9z" ${s}/>`,
    table: `<ellipse cx="12" cy="10" rx="8.5" ry="3.5" ${s}/><path d="M7 12.5V19M17 12.5V19M12 13.5v6" ${s}/>`,
    book: `<path d="M4 5.5C6.5 4.3 9.5 4.3 12 6c2.5-1.7 5.5-1.7 8-.5v13c-2.5-1.2-5.5-1.2-8 .5-2.5-1.7-5.5-1.7-8-.5z" ${s}/><path d="M12 6v13" ${s}/>`,
    medal: `<path d="M8 3.5h8l-2 6h-4z" ${s}/><circle cx="12" cy="15" r="5" ${s}/><path d="m12 12.5.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z" ${f}/>`,
    crown: `<path d="M4 8l4 4 4-6 4 6 4-4-1.5 10.5h-13z" ${s}/><path d="M5.5 20.5h13" ${s}/>`,
    flag: `<path d="M6 21V4M6 4.5c3-1.5 5 1.5 8 0s4-.5 4-.5v8s-1-1-4 .5-5-1.5-8 0" ${s}/>`,
    fire: `<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.2 3.6-7.6.4 1.5 1.2 2.6 2.4 3.2C11.6 7.4 13 5 15 3.5c-.3 3 1.3 4.5 2.4 6.2.8 1.3 1.1 2.6 1.1 4.1 0 4-2.7 7.2-6.5 7.2z" ${s}/>`,
    cal: `<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" ${s}/><path d="M3.5 10h17M8 3v4M16 3v4" ${s}/><path d="m9 15 2 2 4-4" ${s}/>`,
    pen: `<path d="M5 19l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L9 18z" ${s}/><path d="M13.5 7.5l3 3" ${s}/>`,
    yut: `<rect x="3" y="5" width="4" height="14" rx="2" ${s}/><rect x="10" y="5" width="4" height="14" rx="2" ${s}/><rect x="17" y="5" width="4" height="14" rx="2" ${s}/>`,
    check: `<circle cx="12" cy="12" r="8.5" ${s}/><path d="m8 12.5 2.7 2.7L16.5 9" ${s}/>`,
    vote: `<path d="M4 13h16v7H4z" ${s}/><path d="M8 13V6.5A1.5 1.5 0 0 1 9.5 5h5A1.5 1.5 0 0 1 16 6.5V13" ${s}/><path d="m9.8 9 1.6 1.6L14.4 7.6" ${s}/>`,
    chat: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z" ${s}/>`,
    star: `<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" ${s}/>`,
    people: `<circle cx="9" cy="8" r="3.2" ${s}/><path d="M3 19.5c.5-3.4 2.9-5.5 6-5.5s5.5 2.1 6 5.5" ${s}/><circle cx="16.5" cy="9" r="2.6" ${s}/><path d="M16 14c2.6.1 4.4 1.9 5 5" ${s}/>`,
    heart: `<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" ${s}/>`,
    lock: `<rect x="5" y="10.5" width="14" height="10" rx="2.5" ${s}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${s}/>`,
  };
  return G[name] || G.star;
}

// 등급 엠블럼: 둥근 육각형 안에 그림과 숫자
export function emblemSVG(info, size, glyphFn) {
  const c = info.color;
  const hex = 'M24 3.5c1.4 0 2.8.4 4 1.1l12.6 7.3c2.5 1.4 4 4.1 4 6.9v14.4c0 2.9-1.5 5.5-4 6.9L28 47.4c-2.5 1.4-5.5 1.4-8 0L7.4 40.1c-2.5-1.4-4-4.1-4-6.9V18.8c0-2.9 1.5-5.5 4-6.9L20 4.6c1.2-.7 2.6-1.1 4-1.1z';
  return `<svg class="emblem" width="${size}" height="${size}" viewBox="0 0 48 52" aria-hidden="true"><path d="${hex}" transform="translate(0 2)" fill="#233552" opacity=".18"/><path d="${hex}" fill="${c}"/><path d="${hex}" fill="none" stroke="#233552" stroke-width="2.4"/><g transform="translate(12 9) scale(1)" color="#fff">${glyphFn(info.icon)}</g><rect x="14" y="34" width="20" height="11" rx="5.5" fill="#fff" stroke="#233552" stroke-width="1.8"/><text x="24" y="42.6" text-anchor="middle" font-size="9" font-weight="800" fill="#233552" font-family="Pretendard, sans-serif">${info.lv}</text></svg>`;
}

// 배지 그림: 동그란 메달
export function badgeSVG(b, size, locked, glyphFn) {
  const c = locked ? '#C9CDD6' : b.color;
  return `<svg class="badge-ico${locked ? ' locked' : ''}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="26" r="20" fill="#233552" opacity="${locked ? 0.08 : 0.16}"/><circle cx="24" cy="24" r="20" fill="${locked ? '#F1F2F5' : '#FFF9EF'}" stroke="${locked ? '#C9CDD6' : '#233552'}" stroke-width="2.2"/><circle cx="24" cy="24" r="14.5" fill="${c}"/><g transform="translate(12 12)" color="#fff">${glyphFn(locked ? 'lock' : b.icon)}</g></svg>`;
}
