# 한밭중고전자(hanbat-mall) 자율 코드 진화 변경 이력 (Evolution Changelog)

본 문서는 자율 코드 진화 프로토콜에 따라 수행된 모든 진화 사이클의 상세 기록, 측정 결과, 파일 변경 내역 및 교훈을 보존합니다.

---

## 📌 [Cycle 0] 2026-10-26 — 자율 코드 진화 프로토콜 수립 및 정량 베이스라인 측정

### 1. 목표
- 프로젝트 진화 프로토콜 정의 및 지속 가능한 4대 문서 체계(`PROTOCOL.md`, `RESEARCH.md`, `BACKLOG.md`, `CHANGELOG.md`) 구축.
- 현재 코드베이스(Commit `68b17fe`)의 8대 정적·동적 게이트 베이스라인 상태를 독립적으로 측정하여 기록.

### 2. 조사 및 베이스라인 측정 결과
- **측정 도구 8종 실행 결과**:
  1. `node scripts/check-design-tokens.mjs`: **PASS (0 violations)**
  2. `node scripts/verify-predeploy.mjs`: **PASS (10/10 items passed)**
  3. `node scripts/verify-security-and-regression.mjs`: **PASS (17/17 items passed)**
  4. `node scripts/verify-ux-benchmark-upgrade.mjs`: **PASS (7/7 items passed)**
  5. `node scripts/test-analyze-inquiry.mjs`: **PASS (3/3 items passed)**
  6. `node ./node_modules/typescript/lib/tsc.js --noEmit`: **PASS (0 errors)**
  7. `node ./node_modules/eslint/bin/eslint.js .`: **PASS (0 errors, 0 warnings)**
  8. `node ./node_modules/next/dist/bin/next build`: **PASS (Next.js 16.3.5 Turbopack, 22/22 routes prerendered, 8.9s compile)**

### 3. 주요 발견점 및 배운 교훈 (Lessons Learned)
- **Windows 실행 환경 특성**: Windows 환경에서 `run_command` 실행 시 인자를 중복 따옴표로 감싸면 프로세스 실행 권한 오류(`Access is denied`)가 발생할 수 있으므로, Node 진입점을 직접 지정(`node ./node_modules/...`)하여 안정적으로 구동해야 함.
- **Git 실행 파일 경로**: Git 호출 시 `scripts/run-git.mjs`에 명시된 `C:\Program Files\Git\mingw64\bin\git.exe`를 활용하면 하위 프로세스 스폰 에러 없이 완벽히 동작함.

---

## 🚀 [Cycle 1] 2026-10-26 — Schema.org Rich Snippet 고도화 및 WCAG AA CTA 접근성 강화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-001`, `EVO-002`
- **문제 진단**:
  1. `app/[id]/page.tsx`의 `Product` JSON-LD에 Google Merchant Center Free Listings의 핵심 권장 속성(`hasMerchantReturnPolicy`, `shippingDetails`)이 누락되어 있어 구글 쇼핑 리치 스니펫 획득 기회가 제한됨.
  2. `components/products/product-detail-gallery.tsx`의 대형 전화 문의 및 카카오톡 1:1 상담 링크에 명시적인 `aria-label`이 부재하여 시각장애인 스크린 리더에서 목적지(전화번호, 새 창 열림) 인지가 불명확함.
  3. `app/[id]/page.tsx`의 `generateMetadata`에서 OpenGraph 대표 이미지 URL이 상대 경로로 지정될 경우 카카오톡 인앱 브라우저 크롤러 등에서 썸네일 누락 가능성 존재.

### 2. 코드 변경 요약
- **[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)**:
  - `generateMetadata`: `openGraph.images` URL을 절대 URI(`https://...`)로 엄격 정규화.
  - `Product` JSON-LD 스키마: `offers` 하위에 7일 무상교환 반품 정책(`hasMerchantReturnPolicy`) 및 대전/충청 직영 배송(`shippingDetails`) Schema.org 표준 객체 추가.
- **[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)**:
  - 특대형 전화 상담 링크에 `aria-label="한밭중고전자 직영 매장 전화 문의 연결 (042-252-8949)"` 명시.
  - 특대형 카카오톡 1:1 상담 링크에 `aria-label="한밭중고전자 카카오톡 1:1 실시간 상담창 열기 (새 창)"` 명시.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.40s) — 임의 폰트 0건, 이모지 0건, Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.57s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.42s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.38s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.28s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (3.85s) — 0 errors
- **7. eslint**: PASS (13.65s) — 0 errors, 0 warnings
- **8. next build**: PASS (20.08s) — 22/22 정적/동적 라우트 프리렌더링 완료 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **Schema.org Rich Snippet 효용성**: UI 컴포넌트나 레이아웃 스타일을 전혀 건드리지 않고 순수 메타데이터와 JSON-LD 스키마 보강만으로 Google Merchant Free Listings 적격성을 획득할 수 있어 시각적 회귀 위험(Risk) 0으로 최대 비즈니스 가치(ROI) 달성.
- **단일 러너 스크립트 효율성**: 8대 검증 게이트를 순차적인 하위 프로세스 스폰 단일 러너(`scratch/run-all-verifications.mjs`)로 묶어 실행함으로써 Windows PowerShell 프로세스 경합 및 스폰 스로틀링을 원천 해소하고 40초 이내에 8대 테스트 전체를 통과시킴.

### 5. 다음 사이클 우선순위 (Cycle 2 계획)
- `EVO-003`: 관리자 대량 상품 등록 및 이미지 보정 세션 시 Canvas Object URL 명시적 해제(`URL.revokeObjectURL`) 가드레일 추가.
- `EVO-004`: 갤러리 파라미터별(`?category=...&price=...`) 정규화된 Canonical URL 태그 정밀화.

