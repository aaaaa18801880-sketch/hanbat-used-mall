---
name: systematic-refactor
description: >-
  한밭중고전자(hanbat-mall) 전용 체계적 리팩토링·AI 슬롭 제거(Deslopping) 방법론 스킬.
  대형 파일(God File) 분리, 중복 로직 제거, useEffect/setTimeout 경고 해소, 과장 문구·비주얼 슬롭
  차단 시 사용합니다. 기능 추가와 구조 개선을 분리하고, 테스트·타입·디자인 토큰 게이트가 통과하는
  원자적(Atomic) 단위로만 리팩토링합니다.
---

# 체계적 리팩토링 & AI 슬롭 제거 프로토콜 (hanbat-mall)

본 스킬은 `obra/superpowers`(TDD·검증 우선), `andrej-karpathy-skills`(단순성·외과적 수정),
`115dkk/ground-stone-skills`(근본 원인 디버깅), Anthropic `code-simplifier`(행위 보존 단순화)의
핵심 원칙을 한밭중고전자 코드베이스에 맞게 통합한 운영 절차입니다.

## 1. 4대 절대 원칙 (Golden Rules)

1. **행위 변경과 구조 개선의 엄격한 분리**
   - 리팩토링 커밋/작업에서는 외부 동작·URL·API 스키마·필수 검증 문구를 바꾸지 않습니다.
   - 기능 추가 중 인접 코드를 즉흥적으로 갈아엎지 않습니다(Surgical Changes).
2. **그린 베이스라인 우선 (Green Baseline First)**
   - 코드를 건드리기 전에 반드시 `npm run typecheck`, `npm test`, `node scripts/check-design-tokens.mjs`가
     통과하는지 확인합니다.
   - 순수 로직을 분리할 때는 먼저 단위 테스트(`tests/*.test.ts`)로 기존 동작을 고정합니다.
3. **단순성 우선 & 과잉 추상화 금지 (Simplicity First / YAGNI)**
   - 1회성 UI를 위해 불필요한 제네릭 팩토리·과도한 Context·중첩 래퍼를 만들지 않습니다.
   - 거대 컴포넌트에서 분리할 1순위는 **순수 데이터/파서/계산 함수(`lib/*.ts`)**이며, 2순위가
     독립적인 뷰 섹션(`components/*`)입니다.
4. **지시문 비대화 방지 (Progressive Disclosure)**
   - 루트 `AGENTS.md`는 50줄 내외의 핵심 불변 규칙만 유지하고, 세부 리팩토링·진단 절차는
     `.agents/skills/*/SKILL.md`에 분리 보관해 컨텍스트 오염(Context Pollution)을 막습니다.

## 2. 3단계 실행 절차

### Phase 1. 진단 (Assessment — 수정 전 실측)
- 대상 파일의 줄 수, 중복 로직, ESLint 경고(`useEffect` 상태 동기화 / `setTimeout` 우회),
  AI 슬롭 패턴(과장 문구·`border-l-4`·장식용 펄스 점·쿨그레이 `#FAFBFD`/`#E2E6EC` 혼입)을
  `grep`과 스크립트로 먼저 수치화합니다.
- 변경 대상이 `scripts/check-design-tokens.mjs` 또는 `scripts/verify-ux-benchmark-upgrade.mjs`의
  필수 문자열에 걸려 있는지 사전 확인합니다.

### Phase 2. 원자적 리팩토링 (Atomic Slices)
- 한 번의 작업 단위에서는 **1~2개의 명확한 책임**만 분리합니다.
- 우선순위:
  1. **도메인 SSOT & 과장 문구 제거**: 매장 정보·보증 정책·공정 설명은 `lib/site.ts`,
     `lib/refurbish-process.ts`, `lib/product-inspection.ts`, `lib/seo-schema.ts` 단일 출처로 집중.
  2. **순수 로직 분리 (`lib/`)**: UI 컴포넌트 내부의 필터링·정렬·포맷팅·배지 계산을 순수 함수로 추출 후 `node:test` 작성.
  3. **React 안티패턴 정리**: 파생 상태로 계산 가능한 `useEffect` 제거, 비동기 타이밍 우회용 `setTimeout` 제거.
  4. **Warm Editorial Stone 톤 정합성**: 잔여 쿨그레이(`#FAFBFD`, `#E2E6EC`) 및 `border-l-4` 콜아웃을
     `#FAF9F6` / `#E2DDD3` 헤어라인 카드로 통일.

### Phase 3. 완료 전 검증 (Verification Before Completion)
- 마지막 수정 직후 아래 4개 게이트를 모두 통과해야 완료로 보고합니다.
  1. `node scripts/check-design-tokens.mjs && node scripts/verify-ux-benchmark-upgrade.mjs`
  2. `npm run typecheck` (`tsc --noEmit`)
  3. `npm test` (기존 단위 테스트 + `tests/anti-slop-guard.test.ts`)
  4. `npm run lint` (에러 0건, 신규 경고 0건) 및 프로덕션 빌드(`next build`)

## 3. 한밭중고전자 단계별 리팩토링 백로그 (God Files & Tech Debt)

대형 파일은 한 번에 갈아엎지 말고 아래 순서로 순수 함수와 하위 뷰를 단계적으로 분리합니다.

| 우선순위 | 대상 파일 | 현재 규모 | 권장 원자적 분리 단위 |
| :--- | :--- | :--- | :--- |
| 1 | `app/gallery/page.tsx` | ~2,726줄 | 필터·정렬 순수 함수(`lib/gallery-filter.ts`) → 상단 컨트롤 바 → 라이트박스/모달 분리 |
| 2 | `lib/site.ts` | ~2,420줄 | `STORE` 상수 유지 + 전화/포맷터/모델명 파서/견적함 로직 하위 모듈 분할 후 `lib/site.ts`에서 re-export |
| 3 | `components/home/home-page-client.tsx` | ~1,904줄 | 히어로 섹션 / 매장 안내·문의 현황 섹션 / 배송사례 라이트박스 독립 컴포넌트화 |
| 4 | `components/inquiry/unified-inquiry-form.tsx` | ~1,939줄 | 폼 검증·프리필 파서(`lib/inquiry-form.ts`) 추출 및 단계별 입력 섹션 분리 |
| 5 | ESLint 경고 39건 (`no-restricted-syntax`) | 12개 파일 | 파생 상태·이벤트 핸들러 전환 및 불필요한 `setTimeout` 정리 (파일별 1건씩 검증) |
