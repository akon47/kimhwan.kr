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
│   ├── layout/    # AppHeader, AppFooter, PageHeader, ThemeToggle, CommandPalette(Ctrl+K)
│   ├── live/      # 실시간: 접속자 배지, 함께 보는 커서, 배포 피드·알림
│   ├── ui/        # 범용 부품: AppIcon(인라인 SVG), StatusDot, MeterBar, SparkLine
│   ├── home/      # 홈 화면 전용
│   ├── projects/  # ProjectCard
│   └── status/    # 상태 대시보드 (flow/ = 흐름도 좌표·그래프 계산, Vue 와 무관한 순수 함수)
├── composables/   # useTheme, useStatus, usePolling, useLive(웹소켓 상태), useTrafficPulse(SSE)
├── config/        # site.ts: 이름·내비게이션·소셜 링크
├── data/          # 프로젝트 목록, 홈랩 소개 문구
├── router/        # 라우트 정의 (옛 주소 리다이렉트 포함)
├── services/      # statusApi.ts: /api/status 클라이언트, liveClient.ts: /api/live 웹소켓(자동 재연결)
├── styles/        # 전역 스타일 (아래 참고)
├── types/         # 상태 API 응답 타입
├── utils/         # format.ts(표시용 포매터), status.ts
└── views/         # 페이지 단위 컴포넌트
```

오픈소스 프로젝트 목록을 갱신할 때는 `src/data/projects.ts` 만, 이름·메뉴·링크는 `src/config/site.ts` 만 수정하면 됩니다.

## ⚡ 실시간 기능
- 백엔드는 별도 저장소 [akon47/kimhwan-live](https://github.com/akon47/kimhwan-live)(Spring Boot + WebSocket + Redis)이며 관문이 `/api/live/` 로 넘겨 줍니다.
- 접속자 수(헤더), 같은 페이지를 보는 사람들의 커서와 한마디(`/` 키), 픽셀 방명록(`/guestbook`), 배포 알림·피드가 이 연결 하나를 같이 씁니다.
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
