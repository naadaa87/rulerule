# 룰룰 | 보드게임 룰 하는법 설명서

보드게임과 전통놀이 하는 법을 1분 요약, 따라하기, 자세한 규칙 순서로 알려 주는 웹사이트예요. 게임 중에 휴대폰을 테이블에 두고 쓰는 테이블 모드와, 보드게임카페나 파티룸에서 쓰는 매장 QR 기능이 들어 있어요.

- 게임 60가지: 보드게임 46가지, 전통놀이 14가지
- 게임 찾기: 인원, 시간, 난이도, 종류, 분위기로 거르기와 초성 검색(예: ㅎㄹㄱㄹ)
- 게임 페이지: 1분 요약, 따라하기(구성물 확인, 준비, 예시), 자세한 규칙, 헷갈리는 상황, 우리 집 규칙 정하기
- 테이블 모드: 단계별 안내, 화면 켜 두기, 밤 화면, 글씨 크기, 점수판, 타이머, 주사위, 누가 먼저, 팀 나누기, 윷 던지기, 역할 나누기(마피아, 아발론), 제시어 나누기(라이어 게임)
- 매장 QR: 매장 이름과 게임을 고르면 매장 페이지, QR 이미지, 인쇄용 안내문과 게임별 QR 스티커가 만들어져요. 매장 정보는 주소 안에만 담기고 서버에 저장되지 않아요.
- 틀린 곳 알려 주기, 운영 관리 화면(신고함, 이용 기록, 원고 관리)
- 한 번 본 페이지는 인터넷이 끊겨도 열려요(PWA).

원고 상태는 세 가지예요. **검수 중(draft)**, 참고 자료와 견줘 본 **자료 대조 완료(reviewed)**, 실제 게임으로 확인한 **검수 완료(checked)**. 지금은 17개가 자료 대조 완료이고 나머지는 검수 중이에요. 실제 게임으로 확인한 뒤 하나씩 검수 완료로 바꿔 주세요. 방법은 아래 ‘원고 고치기’에 있어요.

---

## 1. Cloudflare에 배포하기

모두 브라우저에서 할 수 있어요. 터미널은 필요 없어요.

### 1-1. Pages 프로젝트 만들기

1. [Cloudflare 대시보드](https://dash.cloudflare.com)에 들어가 왼쪽 메뉴에서 **Workers & Pages**를 눌러요.
2. **Create**(만들기)를 누르고 **Pages** 탭에서 **Connect to Git**(Git에 연결)을 골라요.
   Pages 탭이 보이지 않으면 화면 아래쪽 ‘Looking to deploy Pages?’ 링크를 누르세요.
3. GitHub 계정을 연결하고 이 저장소(`naadaa87/rulerule`)를 골라요.
4. 빌드 설정을 이렇게 넣어요.

   | 항목 | 값 |
   | --- | --- |
   | 프로젝트 이름 | `rulerule` (사이트 주소가 `rulerule.pages.dev`가 돼요) |
   | 프로덕션 브랜치 | `main` |
   | 프레임워크 프리셋 | None (없음) |
   | 빌드 명령 | `npm run build` |
   | 빌드 출력 디렉터리 | `public` |

5. **Save and Deploy**(저장 및 배포)를 누르면 1~2분 뒤 사이트가 열려요.

> 프로젝트 이름을 `rulerule`로 쓸 수 없어 다른 이름을 썼다면, 이 저장소의 `site.config.json`에서 `siteUrl`을 실제 주소로 바꿔 주세요. 검색 노출용 주소와 공유 이미지 주소가 여기서 정해져요.

### 1-2. 신고함과 이용 기록용 데이터베이스(D1) 연결하기

사이트는 이 단계 없이도 열려요. 틀린 곳 알려 주기, 이용 기록, 운영 관리 화면을 쓰려면 연결해 주세요.

1. 대시보드 왼쪽 메뉴에서 **Storage & Databases → D1 SQL Database**(또는 **Workers & Pages → D1**)로 가서 **Create**(만들기)를 눌러요. 이름은 `rulerule-db`로 해요.
2. **Workers & Pages → rulerule → Settings(설정) → Bindings(바인딩)**에서 **Add**(추가) → **D1 database**를 골라요.
   - Variable name(변수 이름): `DB` (대문자 그대로)
   - D1 database: `rulerule-db`
3. 같은 설정 화면의 **Variables and Secrets**(변수 및 비밀)에서 **Add**(추가)를 눌러요.
   - Type(유형): **Secret**(비밀)
   - Variable name: `ADMIN_PASSWORD`
   - Value: 운영 관리 화면에 쓸 비밀번호 (길고 남이 짐작하기 어렵게)
4. 설정은 다음 배포부터 적용돼요. **Deployments**(배포) 탭에서 가장 최근 배포 오른쪽 메뉴(…)를 눌러 **Retry deployment**(배포 다시 시도)를 해 주세요.
5. 확인: 브라우저에서 `https://rulerule.pages.dev/api/health`를 열어 `"db":true,"admin":true`가 보이면 끝이에요.

표(테이블)는 처음 쓸 때 저절로 만들어져요. SQL을 따로 실행하지 않아도 돼요.

### 1-3. 운영 관리 화면

`https://rulerule.pages.dev/admin/`에서 위 비밀번호로 들어가요.

- **신고함**: 방문자가 보낸 ‘틀린 곳 알려 주기’를 보고 처리 완료로 옮기거나 지워요. ‘원고 고치기’를 누르면 그 게임의 원고 파일이 GitHub 편집 화면으로 열려요.
- **이용 기록**: 게임 페이지 열람, 테이블 모드, QR로 들어온 수를 날짜별로 봐요. 이름, 연락처 같은 개인 정보는 기록하지 않아요.
- **원고 관리**: 게임별 검수 상태와 고치기 링크, 새 게임 원고 만들기.

---

## 2. 원고 고치기 (GitHub 웹에서)

게임 설명은 `content/games` 폴더에 게임마다 JSON 파일 하나로 들어 있어요. 파일을 열고 연필 모양(Edit)을 눌러 고친 뒤 **Commit changes**를 누르면 Cloudflare가 1~2분 안에 사이트를 다시 만들어요.

### 원고 항목

| 항목 | 뜻 |
| --- | --- |
| `slug` | 주소에 쓰는 영문 이름. 파일 이름과 같아야 해요 (`halli-galli.json` → `halli-galli`) |
| `code` | 매장 QR 주소에 쓰는 영문 소문자, 숫자 2~3자. 다른 게임과 겹치면 안 돼요 |
| `name`, `original`, `aliases` | 한국어 이름, 원래 이름, 검색에 쓸 다른 이름 |
| `kind` | `board`(보드게임) 또는 `traditional`(전통놀이) |
| `group` | `family`, `party`, `strategy`, `traditional` 가운데 하나 |
| `players`, `minutes` | `[최소, 최대]`. 인원에 99를 쓰면 ‘n명 이상’으로 보여요 |
| `age`, `level` | 나이, 난이도(1 쉬움, 2 보통, 3 어려움) |
| `tags` | 분위기 거르기에 쓰는 말 |
| `oneLine`, `intro`, `compare` | 한 줄 소개, 소개 문단, 비슷한 게임과 비교 |
| `summary` | 1분 요약: `goal`(이기는 법), `turn`(내 차례, 목록), `end`(끝나는 때) |
| `components`, `setup` | 구성물, 준비하기 |
| `examples`, `scoring` | 따라 해 보기 예시, 끝내기와 점수 |
| `rules` | 자세한 규칙: `{ "title": "...", "items": ["...", "..."] }` 목록 |
| `tricky`, `faq` | 헷갈리는 상황, 자주 묻는 질문: `{ "q": "...", "a": "..." }` 목록 |
| `variants` | 인원별 규칙이나 다른 방법 |
| `houseRules` | 우리 집 규칙 정하기에 나오는 하우스룰: `{ "id": "영문", "title": "...", "text": "..." }` |
| `tools` | 테이블 모드에 먼저 보일 도구: `score`, `timer`, `dice`, `first`, `team`, `yut`, `roles` |
| `related` | 비슷한 게임의 `slug` 목록 |
| `diagram` | 그림: `yut-board`, `umul-gonu`, `chilgyo` 가운데 하나 (없으면 빈칸) |
| `status`, `checked` | 검수 상태. 아래를 보세요 |

- 문장 안에서 `**두 별표**`로 감싼 부분은 굵게 보여요.
- JSON은 쉼표와 따옴표에 민감해요. 고친 뒤 배포가 실패하면 Cloudflare의 배포 기록을 열어 보세요. 어느 파일의 어느 항목이 문제인지 한국어로 적혀 있어요.

### 검수 완료로 바꾸기

실제로 게임을 해 보며 확인했다면 두 줄을 이렇게 바꿔요.

```json
"status": "checked",
"checked": { "date": "2026-12-01", "by": "확인한 사람" },
```

게임 페이지의 ‘검수 중’ 안내가 ‘검수 완료 (날짜, 확인한 사람)’로 바뀌어요.

### 새 게임 넣기

운영 관리 화면의 **원고 관리 → 새 게임 원고 만들기**를 누르면 빈 원고가 채워진 GitHub 새 파일 화면이 열려요. 파일 이름과 `slug`를 같은 영문 이름으로 바꾸고, `code`를 겹치지 않게 정한 뒤 저장해요. 비슷한 게임 파일을 복사해서 고쳐도 돼요.

### 그 밖의 원고

- `content/collections.json`: 처음 화면의 ‘요즘 많이 여는 게임’(`popular`)과 ‘이런 자리라면’ 묶음
- `content/glossary.json`: ‘처음이라면’ 페이지의 용어 풀이
- `content/venues.json` (선택): 매장 전용 고정 페이지. 만들면 `/space/매장영문이름/` 주소가 생겨요. `view`는 쓸 수 없어요.

  ```json
  [
    { "slug": "plation-2", "name": "신촌 플레이션 2호점", "message": "게임은 선반 위 칸에 있어요.", "contact": "https://pf.kakao.com/...", "games": ["halli-galli", "rummikub", "jenga"] }
  ]
  ```

---

## 3. 사이트 설정 (`site.config.json`)

| 항목 | 뜻 |
| --- | --- |
| `siteName`, `tagline` | 서비스 이름(룰룰)과 이름 옆에 붙는 설명 문구(보드게임 룰 하는법 설명서) |
| `siteTitle`, `description` | 첫 화면 제목, 검색 설명 |
| `siteUrl` | 실제 사이트 주소. 도메인을 연결하면 바꿔 주세요 |
| `githubRepo`, `githubBranch` | 운영 관리 화면의 ‘고치기’ 링크에 쓰여요 |
| `contactEmail` | 소개 페이지에 보일 문의 메일 (비워 두면 안 보여요) |
| `naverSiteVerification`, `googleSiteVerification` | 네이버 서치어드바이저, 구글 서치 콘솔 소유 확인 값 |

도메인을 연결하려면 Pages 프로젝트의 **Custom domains**(사용자 지정 도메인)에서 추가하고 `siteUrl`을 바꿔요. 검색 등록은 사이트맵 주소 `https://(주소)/sitemap.xml`을 네이버와 구글에 제출하면 돼요.

---

## 4. 폴더 구조

```
content/            원고 (게임 JSON, 묶음, 용어)
scripts/build.mjs   원고를 읽어 public/에 페이지를 만드는 스크립트 (Node 18 이상, 설치할 것 없음)
src/static/         화면 스타일(css), 스크립트(js), 이미지(img), 서비스 워커, 헤더 설정
functions/api/      서버 기능 (Cloudflare Pages Functions): 신고, 이용 기록, 운영 관리
public/             빌드 결과물 (저장소에는 올리지 않고, Cloudflare가 배포할 때 만들어요)
```

컴퓨터에서 직접 빌드해 보려면 `npm run build`를 실행하면 돼요. 따로 설치할 패키지는 없어요.

---

## 5. 개인 정보와 저작권

- 이용 기록은 날짜, 종류, 게임, 매장 이름별 숫자만 세요. 방문자를 알아볼 수 있는 값은 저장하지 않아요.
- 틀린 곳 알려 주기는 방문자가 직접 적은 내용과 선택으로 남긴 연락처만 저장해요. 같은 사람이 짧은 시간에 너무 많이 보내지 못하게, 접속 주소를 그날만 쓰는 값으로 바꿔(해시) 함께 저장해요.
- 게임 설명은 직접 해 보고 우리 말로 다시 쓴 것이에요. 룰북 문장, 그림, 상자 이미지는 쓰지 않아요. 게임 이름과 상표는 각 권리자의 것이에요.
- QR 코드 생성에는 Kazuhiko Arase의 qrcode-generator(MIT 라이선스)를 썼어요. 글꼴은 Pretendard와 Black Han Sans(SIL Open Font License)를 CDN으로 불러와요.
