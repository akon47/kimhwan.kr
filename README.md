# kimhwan.kr

<p>
  <a href="https://kimhwan.kr/"><img alt="Hits" src="https://counter.kimhwan.kr/?key=github-akon47-kimhwan.kr" /></a>
</p>

개인 홈페이지 프론트엔드 프로젝트.

## 🚀 홈페이지
https://kimhwan.kr/

## 🛠 기술 스택
- Vue 3 + TypeScript (`<script setup>`)
- Vue Router 5
- Vite 8
- Docker + Nginx (Jenkins 파이프라인으로 배포)

## 📂 구조
```
src/
├── components/   # 공통 레이아웃 및 목록 아이템 컴포넌트
├── composables/  # useTheme (라이트/다크 테마 상태)
├── css/          # reset, 공통 스타일 및 테마 변수
├── data/         # 화면에 표시되는 메뉴/프로젝트/서버 정보 데이터
├── router/       # 라우트 정의
└── views/        # 페이지 단위 컴포넌트
```

오픈소스 프로젝트 목록이나 서버 정보를 갱신할 때는 `src/data/` 아래 파일만 수정하면 됩니다.

## 💻 개발
```bash
npm ci
npm run dev        # 개발 서버
npm run build      # 타입 검사 후 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 미리보기
npm run lint       # ESLint
```
