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

## 4. Modern Web Guidance 및 Chrome DevTools MCP 적용 수칙
- **웹 UI·HTML·CSS·클라이언트 JS 작업 전**: 반드시 `modern-web-guidance` 스킬을 우선 적용하여 `search` → `retrieve`로 최신 웹 표준(타이포그래피, 반응형 표, 탭, 다이얼로그, 폼, 접근성)을 확인한 뒤 구현하고, 응답 끝에 `### Modern Web Guidance` 출처를 남깁니다.
- **브라우저 실측·성능·접근성 점검 시**: 설치된 `chrome-devtools-plugin` 및 `chrome-devtools` MCP 서버(`chrome-devtools`, `debug-optimize-lcp`, `a11y-debugging`, `cookie-debugging`, `memory-leak-debugging`)를 활용해 실제 렌더링(LCP/CLS/콘솔·네트워크 오류/접근성)을 점검합니다.

## 5. 권장 Agent Skills & 실운영 문구 가드레일
- **로컬 개발 환경 권장 스킬 조합**:
  - SEO · AI 검색(GEO) · Schema · 전환율(CRO): `npx skills add coreyhaines31/marketingskills --skill seo-audit ai-seo schema cro copy-editing`
  - Next.js 16 · React 성능 · 접근성: `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices web-design-guidelines` 및 `npx skills add vercel/next.js`
  - Supabase RLS · 보안 · 쿼리: `npx skills add supabase/agent-skills`
  - 시각 마감 · AI 슬롭 검수: `npx skills add pbakaus/impeccable`
  - 체계적 리팩토링 · 디버깅 · AI 슬롭 차단:
    - 프로젝트 내장 프로토콜: `.agents/skills/systematic-refactor/SKILL.md` (대형 파일 분리·행위 보존·테스트 우선 검증 절차)
    - 검증된 외부 방법론 스킬: `obra/superpowers`(TDD·체계적 디버깅·완료 전 검증), `multica-ai/andrej-karpathy-skills`(단순성 우선·외과적 수정·목표 기반 실행), `115dkk/ground-stone-skills`(근본 원인 디버깅), Anthropic `code-simplifier`(행위 보존 단순화)
  - **외부 생성형 디자인 스킬 운용 원칙**:
    - `leonxlnx/taste-skill`, `nutlope/hallmark`의 전체 리디자인(`/hallmark redesign`)은 기존 Warm Editorial Stone 팔레트·`text-hb-*` 토큰·페이지 간 통일성을 깨뜨리고 지시 충돌(Context Pollution)을 유발하므로 **도입하지 않습니다**.
    - 필요 시 `hallmark`는 코드 비변경 진단(`/hallmark audit`) 용도로만, `Nutlope/inspo`는 새 섹션 기획 시 레이아웃 구조 참고용 MCP로만 제한적으로 활용하며 외부 JSX·팔레트·폰트 직복사를 금지합니다.
  - 주의: 본 프로젝트는 **Tailwind CSS v3.4** 기반이므로 Tailwind v4 전용 스킬은 설치하지 않습니다.
- **실제 운영 사실 외 과장 문구 금지**: `완전 분해`, `고온 스팀/UV 살균`, `24시간 부하 시운전`, `연속 시운전`, `절연저항/전류 계측`, `계약조건별`, `담당 엔지니어` 등의 과장 표현을 UI·메타데이터·`llms.txt`·JSON-LD에 작성하지 말고, `lib/refurbish-process.ts`·`lib/product-inspection.ts`·`lib/seo-schema.ts`의 SSOT를 사용합니다(`tests/anti-slop-guard.test.ts`로 자동 검증).

