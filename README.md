# kimhwan.kr

<p>
  <a href="https://kimhwan.kr/"><img alt="Hits" src="https://counter.kimhwan.kr/?key=github-akon47-kimhwan.kr" /></a>
</p>

개인 홈페이지 프론트엔드 프로젝트.

## 🚀 홈페이지
https://kimhwan.kr/

## 🛠 기술 스택
- Vue 3.5 + TypeScript (`<script setup>`)
- Vue Router 5
- Vite 8, Vitest
- Pretendard (npm 패키지로 자체 호스팅)
- Docker + Nginx (Jenkins 파이프라인으로 배포)

## 📂 구조
```
src/
├── components/
│   ├── layout/    # AppHeader, AppFooter, PageHeader, ThemeToggle, LocaleToggle, CommandPalette(Ctrl+K)
│   ├── live/      # 실시간: 접속자 배지, 함께 보는 커서, 배포 피드·알림
│   ├── ui/        # 범용 부품: AppIcon(인라인 SVG), StatusDot, MeterBar, SparkLine
│   ├── home/      # 홈 화면 전용
│   ├── projects/  # ProjectCard
│   └── status/    # 상태 대시보드 (flow/ = 흐름도 좌표·그래프 계산, Vue 와 무관한 순수 함수)
├── composables/   # useTheme, useStatus, usePolling, useLive(웹소켓 상태), useTrafficPulse(SSE)
├── config/        # site.ts: 이름·내비게이션·소셜 링크
├── data/          # 프로젝트 목록, 홈랩 소개 문구 (한/영 문구를 항목 옆에 같이 둔다)
├── i18n/          # 한국어·영어 문구(ko.ts, en.ts)와 언어 감지·기억(index.ts)
├── router/        # 라우트 정의 (옛 주소 리다이렉트 포함)
├── services/      # statusApi.ts: /api/status 클라이언트, liveClient.ts: /api/live 웹소켓(자동 재연결)
├── styles/        # 전역 스타일 (아래 참고)
├── types/         # 상태 API 응답 타입
├── utils/         # format.ts(표시용 포매터), status.ts
└── views/         # 페이지 단위 컴포넌트
```

오픈소스 프로젝트 목록을 갱신할 때는 `src/data/projects.ts` 만, 이름·메뉴·링크는 `src/config/site.ts` 만 수정하면 됩니다.

## 🌐 언어 (한국어 · English)
- 화면 문구는 모두 `src/i18n/ko.ts` 와 `en.ts` 에 있습니다. `ko.ts` 가 모양(키)을 정하고 `en.ts` 는 타입으로 같은 키를 강제하므로, 한쪽에만 문구를 넣으면 빌드가 실패합니다.
- 컴포넌트에서는 `const { t, locale } = useI18n()` 으로 쓰고(`{{ t.nav.projects }}`), 값이 들어가는 문구는 함수입니다(`t.guestbook.total(3)`).
  프로젝트 설명처럼 데이터에 붙은 문구는 `{ en, ko }` 로 두고 `summary[locale]` 로 읽습니다.
- 처음 온 방문자: 브라우저 언어에 한국어가 있거나 시간대가 `Asia/Seoul` 이면 한국어, 아니면 영어입니다. 서버에 묻지 않고 알 수 있는 값이라 첫 화면부터 맞는 언어로 그려집니다.
- 헤더의 `EN`/`KO` 버튼(또는 Ctrl+K)으로 바꾸면 `localStorage` 의 `locale` 에 저장되고, 그 뒤로는 항상 그 언어입니다.
- `<html lang>` 은 `index.html` 의 인라인 스크립트가 먼저 맞추고(테마와 같은 방식), 이후는 `src/i18n/index.ts` 가 관리합니다. 둘의 감지 규칙은 같아야 합니다.
- 상태 페이지의 서비스 설명은 상태 API 가 `description`(한국어)과 `descriptionEn` 을 같이 내려 줍니다.

## ⚡ 실시간 기능
- 백엔드는 별도 저장소 [akon47/kimhwan-live](https://github.com/akon47/kimhwan-live)(Spring Boot + WebSocket + Redis)이며 관문이 `/api/live/` 로 넘겨 줍니다.
- 접속자 수(헤더), 같은 페이지를 보는 사람들의 커서와 한마디(`/` 키), 방명록의 새 글(`/guestbook`), 배포 알림·피드가 이 연결 하나를 같이 씁니다.
- 방명록은 로그인 없이 누구나 이름(선택)과 글을 남깁니다. 목록·글쓰기는 HTTP(`/api/live/guestbook`)라서 웹소켓이 끊겨도 쓸 수 있고, 연결돼 있으면 남의 글이 바로 나타납니다.
  새 글은 운영자에게 메일로 가고, 메일의 삭제 링크(`/guestbook?delete=<id>&key=<삭제 키>`)를 열면 그 글을 지울지 묻습니다. 자세한 것은 kimhwan-live 의 README.
- 흐름도의 움직이는 점은 상태 API 의 SSE(`/api/status/stream`)로 받은 "방금 들어온 요청"입니다.
- 백엔드가 내려가 있어도 사이트는 그대로 동작하고 실시간 요소만 숨겨집니다.
- 로컬 개발: kimhwan-live 를 `./gradlew bootRun --args='--spring.profiles.active=local'` 로 띄우면 Vite 가 `/api/live` 를 `localhost:8080` 으로 프록시합니다(운영 백엔드는 허용된 Origin 만 받습니다).

## 🎨 스타일 규칙
- 전역 CSS 는 캐스케이드 레이어로 순서를 고정합니다: `reset → tokens → base → components → utilities` (`src/styles/layers.css`).
- 색·간격·글자 크기·모서리·그림자는 모두 `src/styles/tokens.css` 의 CSS 변수(디자인 토큰)를 씁니다. 컴포넌트에 색상 값을 직접 쓰지 않습니다.
- 테마는 `<html data-theme="light|dark">` 로 바뀝니다. 첫 화면 깜빡임을 막으려고 `index.html` 의 인라인 스크립트가 먼저 적용하고, 이후는 `useTheme` 이 관리합니다.
- 여러 컴포넌트가 함께 쓰는 것(`.btn`, `.card`, `.tag`, `.container`)만 `components.css` 에 두고, 나머지는 각 SFC 의 `<style scoped>` 에 BEM 식 이름으로 둡니다.
- 아이콘은 `src/components/ui/icons.ts` 에 추가하면 `<AppIcon name="…">` 으로 바로 쓸 수 있습니다.

## 💻 개발
```bash
npm ci
npm run dev        # 개발 서버 (/api 는 운영 kimhwan.kr 로 프록시)
npm run build      # 타입 검사 후 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 미리보기
npm run lint       # ESLint (자동 수정)
npm test           # 단위 테스트 (Vitest)
```

`master` 브랜치에 푸시하면 Jenkins 가 바로 운영에 배포합니다.
