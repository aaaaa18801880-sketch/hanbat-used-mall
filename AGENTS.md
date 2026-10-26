<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 한밭중고전자(hanbat-mall) 엔지니어링 에이전트 자율 진화 수칙

## 1. 8대 게이트 통합 검증 표준 절차 (Unified Verification Runner)
- Windows 환경의 자식 프로세스 연속 생성 권한 제한(`Access is denied`)을 방지하기 위해 개별 검증 스크립트를 연속 수동 호출하지 않는다.
- 모든 코드 변경 후에는 반드시 단일 프로세스 트리 통합 러너인 `node scripts/run-all-verifications.mjs`를 실행한다.
- 게이트 순서는 빠른 실패(Fast-Fail) 구조로 유지된다:
  1. `check-design-tokens.mjs` (0.4s)
  2. `verify-predeploy.mjs` (0.5s)
  3. `verify-security-and-regression.mjs` (0.4s)
  4. `verify-ux-benchmark-upgrade.mjs` (0.4s)
  5. `test-analyze-inquiry.mjs` (0.3s)
  6. `tsc --noEmit` (2.5s)
  7. `eslint` (15s)
  8. `next build` (15s)

## 2. 도메인 정책 단일 출처(SSOT) 준수 규칙
- 매장명, 대표 전화, 도로명 주소, 보증 정책(에어컨 8개월/주요가전 4개월), 반품 규정(7일 이내 기능 불량 무상교환), 배송비 정책 등 비즈니스 정책 문자열을 UI 컴포넌트나 메타데이터(Schema.org 등)에 인라인 하드코딩하는 것을 엄격히 금지한다.
- 모든 비즈니스 정책은 반드시 `lib/site.ts`의 `STORE` 상수 및 표준 보증 헬퍼를 참조하여 작성한다.
- 상품 SMS/카카오톡 등 외부 고객 상담 본문 역시 컴포넌트별로 임의 문자열을 합성하지 않고, 반드시 `lib/site.ts`의 표준 헬퍼(`buildProductInquirySmsBody` 등)를 통해 링크와 스펙이 포함된 단일 출처 템플릿을 생성한다.

## 3. 사이클 간 원자적 체크포인트 격리 및 롤백 경계선 (Local Checkpoint Isolation)
- 개선 사이클이 8대 게이트를 100% 통과할 때마다 원격 push 없이 `node scripts/git-checkpoint.mjs "<cycle description>"`를 실행하여 로컬 체크포인트 커밋을 생성한다.
- 원격 저장소(`origin/main`) 임의 `git push`는 엄격히 금지된다.
- 다음 사이클 작업 중 회복 불가능한 오류나 테스트 실패 발생 시, 직전 체크포인트 커밋으로 안전하게 롤백(`git reset --hard HEAD`)하여 이전 사이클의 성과를 완벽히 보존한다.

## 4. 절대 불변 안전 가드레일 (Immutable Guardrails)
- 기존 검증 스크립트(`scripts/check-*.mjs`, `scripts/verify-*.mjs`) 및 핵심 운영 인프라 스크립트(`scripts/run-all-verifications.mjs`, `scripts/git-checkpoint.mjs`) 임의 수정, 검증 로직 완화 또는 우회 절대 금지 (Immutable Files).
- Supabase RLS 정책 및 거래/문의 데이터 무결성 보존.
- 디자인 토큰 시스템 준수: 임의 픽셀 폰트 크기(`text-[..px]`) 금지, JSX 화면 노출 텍스트 이모지 금지, Tailwind v3 규격 준수.

