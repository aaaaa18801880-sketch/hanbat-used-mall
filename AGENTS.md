<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 한밭중고전자(hanbat-mall) 엔지니어링 에이전트 수칙 (고속 작업 모드)

## 1. 작업 속도 최적화 규칙 (Fast Iteration First)
- **일반 코드·디자인 수정 시 (기본값)**:
  - 사용자가 명시적으로 요청하지 않는 한 `docs/evolution/CHANGELOG.md`, `BACKLOG.md` 문서 업데이트, `build-codebase-xml.mjs` 실행, `git-checkpoint.mjs` 커밋을 매번 수행하지 마세요.
  - 거대 번들 파일(`아르곤_디자인.xml`, `한밭중고전자_전체코드.md`, `docs/evolution/CHANGELOG.md`)은 열람하거나 검색하지 마세요.
  - 빠른 검증을 위해 `node scripts/check-design-tokens.mjs` 및 `npm run typecheck` (`tsc --noEmit`)만 우선 실행하여 5초 이내에 검증을 마치세요.
- **최종 배포/마감 요청 시에만**:
  - 사용자가 "전체 검증해줘" 또는 "체크포인트 커밋해줘"라고 요청할 때만 `node scripts/run-all-verifications.mjs` (전체 8대 게이트) 및 `node scripts/git-checkpoint.mjs`를 실행하세요.

## 2. 도메인 정책 단일 출처(SSOT) 준수 규칙
- 매장명(한밭중고전자), 대표전화(`042-523-8179`), 휴대전화(`010-6631-8179`), 도로명 주소(`대전광역시 중구 대전천서로 691-62 1, 2층`), 보증 정책(에어컨 최대 8개월 / 주요가전 최대 4개월)은 하드코딩하지 말고 반드시 `lib/site.ts`의 `STORE` 상수를 참조하세요.

## 3. 디자인 토큰 및 가드레일
- 임의 픽셀 폰트 크기(`text-[..px]`) 사용 금지 (`text-hb-xs` ~ `text-hb-3xl` 사용).
- JSX 화면 노출 텍스트 이모지 사용 금지 (`lib/ui.tsx`의 `Icon` SVG 사용).
- 기존 검증 스크립트(`scripts/check-*.mjs`, `scripts/verify-*.mjs`) 임의 수정 금지.
