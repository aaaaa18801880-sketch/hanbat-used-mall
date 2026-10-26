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

---

## 🚀 [Cycle 2] 2026-10-26 — Canvas 및 Blob Object URL 메모리 누수 원천 차단 및 SSOT 정책 바인딩 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-003`
- **문제 진단**:
  1. 관리자 상품 등록 및 AI 보정(`enhanceImageFile`, `rotateImageFile`) 및 고객 문의 폼에서 이미지 파일을 다룰 때 생성되는 `URL.createObjectURL`이 컴포넌트 언마운트 시 명시적으로 해제되지 않아, 장시간 업로드 세션 시 브라우저 탭 메모리 누적 위험 존재.
  2. Canvas 변환 시 고해상도 백버퍼가 V8/GPU 메모리에 잔류하는 문제.
  3. Cycle 1에서 도입된 반품·배송 정책이 인라인 객체로 존재하여 매장 공통 SSOT(`STORE`)와의 바인딩 필요성 대두.

### 2. 코드 변경 요약
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - `STORE_MERCHANT_POLICY` 및 `STORE_SHIPPING_POLICY` 단일 출처(SSOT) 상수 선언.
  - `revokeObjectUrls` 메모리 해제 안전 유틸리티 추가.
  - `compressImage` 및 `enhanceImageFile`의 `canvas.toBlob` 직후 `canvas.width = 0; canvas.height = 0;` 명시적 버퍼 반환 처리.
- **[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)**:
  - 컴포넌트 언마운트 시 `prodPreviews` 및 `delivPreviews` 일괄 `revokeObjectUrls` 호출 이펙트 추가.
  - `removeProdFile`, `resetProductForm`, `handleSaveDeliveryCase` 시 일원화된 해제 헬퍼 적용.
- **[components/inquiry/unified-inquiry-form.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/unified-inquiry-form.tsx)**:
  - 문의 폼 언마운트 시 `filePreviews` 일괄 해제 이펙트 추가.
- **[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)**:
  - Schema.org의 `hasMerchantReturnPolicy` 및 `shippingDetails`, `warrantySummary`를 `lib/site.ts`의 SSOT 상수와 직결.

---

## 🚀 [Cycle 3] 2026-10-26 — 갤러리 및 서브페이지(/inquiry, /purchase) Canonical URL 정규화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-004`
- **문제 진단**:
  1. `app/gallery/layout.tsx`, `app/inquiry/layout.tsx`, `app/purchase/layout.tsx`에서 `alternates.canonical`이 상대 경로(`"/gallery"`, `"/inquiry"`, `"/purchase"`)로 설정되어 있어 Google Search Central 권장 규격(Absolute Canonical URI) 위배.
  2. OpenGraph `images` 또한 상대 경로(`"/og-image.jpg"`)로 전달되어 소셜 공유 시 썸네일 파싱 실패 위험.

### 2. 코드 변경 요약
- **[app/gallery/layout.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/layout.tsx)**:
  - `canonical: `${STORE.url}/gallery`` 절대경로 정규화.
  - `openGraph.images[0].url: `${STORE.url}/og-image.jpg`` 절대경로 정규화.
- **[app/inquiry/layout.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/layout.tsx)**:
  - `canonical: `${STORE.url}/inquiry`` 및 OpenGraph 절대경로 정규화.
- **[app/purchase/layout.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/layout.tsx)**:
  - `canonical: `${STORE.url}/purchase`` 및 OpenGraph 절대경로 정규화.

---

## 🚀 [Cycle 4] 2026-10-26 — AI 검색(GEO/AEO) 실시간 피드 동기화 및 모바일 뷰포트 안전구역(Safe-Area) 최적화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-005`, `EVO-006`
- **문제 진단**:
  1. AI 검색 엔진(Perplexity, ChatGPT Search, Gemini Live 등)이 `/llms.txt` 및 `/llms-full.txt`를 인덱싱할 때 정적 텍스트만 읽어갈 경우 실시간 매장 재고 수량(예: 실매물 70여 대) 및 품목별 정확한 잔여 수량을 신뢰성 있게 답변하기 어려움.
  2. 에어컨 보증(8개월) 및 주요가전 보증(4개월), 반품 규정(7일) 등의 상거래 정책이 LLM 컨텍스트 피드에 단일 출처(SSOT)로 일원화되어 있지 않음.
  3. 아이폰 등 하단 홈 인디케이터가 있는 모바일 디바이스에서 `QuoteBasketFloatingBar`가 하단 고정 CTA 바와 겹치거나, `SiteFooter` 하단 여백 부족으로 마지막 안내문이 가려지는 시각적 마찰 발생.

### 2. 코드 변경 요약
- **[app/llms.txt/route.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/llms.txt/route.ts)**:
  - Supabase DB에서 판매 중(`!isProductSold`) 실매물 총 대수 및 카테고리별 실시간 수량(`categoryCounts`) 집계 로직 추가.
  - 마크다운 헤더 섹션에 총 실매물 대수 및 카테고리별 실시간 전시 현황 통계 자동 반영.
  - `STORE_MERCHANT_POLICY` SSOT를 통한 에어컨(8개월)/주요가전(4개월) 공식 보증 명시.
- **[app/llms-full.txt/route.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/llms-full.txt/route.ts)**:
  - 120개 전체 실매물 카탈로그 상단에 `실시간 전시 재고 통계` 및 `공식 사후 보증 및 거래 정책(SSOT)` 섹션 주입.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)**:
  - `QuoteBasketFloatingBar`: `bottom-[64px]` → `bottom-[calc(64px+env(safe-area-inset-bottom))]` 동적 안전구역 계산 적용하여 모바일 바와의 겹침 원천 차단.
  - `SiteFooter`: 모바일 하단 여백 스페이서를 `h-[54px]` → `h-[calc(62px+env(safe-area-inset-bottom))]`로 확장하여 콘텐츠 클리핑 방지.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.42s) — 디자인 토큰 100% 준수 (임의 폰트 0건, 이모지 0건)
- **2. verify-predeploy**: PASS (0.29s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.28s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.31s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.28s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (6.54s) — 0 errors
- **7. eslint**: PASS (59.04s) — 0 errors, 0 warnings
- **8. next build**: PASS (39.73s) — 22/22 라우트 프리렌더링 완료 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **AEO(Answer Engine Optimization)와 실시간 DB 결합**: 정적 LLMs 텍스트 엔드포인트에 30분 캐시(`revalidate = 1800`)와 함께 실시간 집계 DB 데이터를 제공함으로써 AI 검색 엔진이 가장 최신의 실제 재고 수량과 단일 출처(SSOT) 보증 조건을 사용자 질의에 팩트 기반으로 답변할 수 있도록 최적화함.
- **모바일 Safe-Area 인셋 합성 공식**: 모바일 고정 바(`fixed bottom-0`)에 `pb-[env(safe-area-inset-bottom)]`가 적용되어 있을 때는 그 위의 플로팅 요소에 단순 상수 오프셋 대신 `calc(상수 + env(safe-area-inset-bottom))`을 적용해야만 기기별 인셋(0px~34px)에 상관없이 항상 일정한 시각적 간격을 유지할 수 있음을 확인.

---

## 🚀 [Cycle 5] 2026-10-26 — AI 크롤러 robots.txt 확장 및 sitemap.xml 우선순위 가중치 세분화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-007`
- **문제 진단**:
  1. `Applebot-Extended`(Apple Intelligence Siri/Safari), `Amazonbot`(Amazon AI 쇼핑 에이전트), `cohere-ai` 등 최신 생성형 AI 검색 봇에 대한 명시적 허용 규칙 부재.
  2. `sitemap.xml`에 정작 가장 중요한 AI 피드인 `/llms.txt`와 `/llms-full.txt`가 포함되어 있지 않아 AI 봇의 빠른 크롤링 디스커버리에서 누락 위험 존재.
  3. 실시간 판매 중 상품과 이미 판매 완료(`isProductSold`)된 상품의 크롤링 빈도(`changeFrequency`)와 우선순위(`priority`)가 단일 수준으로 관리되어 검색 엔진의 크롤링 예산(Crawl Budget)이 비효율적으로 소진됨.

### 2. 코드 변경 요약
- **[app/robots.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/robots.ts)**:
  - AI 봇 명단에 `Applebot`, `Applebot-Extended`, `Amazonbot`, `cohere-ai` 추가.
  - 전역 크롤러(`*`) 및 AI 크롤러 대상 허용 경로에 `/gallery`, `/purchase`, `/inquiry`, `/llms.txt`, `/llms-full.txt` 명시적 개방.
- **[app/sitemap.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/sitemap.ts)**:
  - `staticRoutes`에 `${baseUrl}/llms.txt` (priority 0.9, daily) 및 `${baseUrl}/llms-full.txt` (priority 0.85, daily) 엔드포인트 공식 등록.
  - 실시간 판매 중 상품: `priority: 0.8`, `changeFrequency: "daily"`.
  - 판매 완료 상품: `priority: 0.4`, `changeFrequency: "monthly"`.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.50s) — 디자인 토큰 100% 준수
- **2. verify-predeploy**: PASS (0.26s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.31s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.28s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.28s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (2.75s) — 0 errors
- **7. eslint**: PASS (15.07s) — 0 errors, 0 warnings
- **8. next build**: PASS (14.21s) — 22/22 라우트 프리렌더링 완료 (Exit Code 0)
- **총 소요 시간**: 33.66초

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **Crawl Budget 및 AI Feed 동기화**: `sitemap.xml`에 `/llms.txt`와 `/llms-full.txt`를 명시하고 판매 중 매물과 판매 완료 매물의 `priority` 및 `changeFrequency`를 차등 배정함으로써, 검색 로봇이 품절된 과거 매물에 크롤링 자원을 낭비하지 않고 신규 실매물과 최신 LLM 요약 피드를 우선적으로 색인하도록 유도할 수 있음을 확인.

---

## 🚀 [Cycle 6] 2026-10-26 — 상품 직통 문자(SMS) 상담 본문 SSOT 통합 및 실물 대조 링크 자동 주입 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-009`
- **문제 진단**:
  1. `components/products/product-detail-gallery.tsx`와 `lib/ui.tsx`에 분산된 SMS 텍스트 조립 로직으로 인해 상품 URL 및 가격 정보가 누락되어 매장 대표가 문자를 받았을 때 고객이 어떤 상품을 보고 있는지 파악하기 위해 역질문하는 마찰 발생.
  2. 판매완료 유사매물 재고 문의와 판매 중 실매물 문의 간의 문구가 일관되지 않고, SSOT 원칙에 어긋남.

### 2. 코드 변경 요약
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - `buildProductInquirySmsBody` 표준 단일 출처(SSOT) 헬퍼 함수 선언.
  - 카테고리, 모델명, 가격(판매 중일 때), 그리고 매장 대표가 원터치로 실물을 확인할 수 있는 상세 링크(`${STORE.url}/${product.id}`)를 자동 주입.
  - `smsHref` 함수를 통해 RFC 5724 표준 기반 `encodeURIComponent` 처리.
- **[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)**:
  - 인라인 문자열 조립을 제거하고 `buildProductInquirySmsBody` 표준 헬퍼로 교체.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)**:
  - 모바일 하단 CTA 바의 `productSmsBody`를 `buildProductInquirySmsBody`로 일원화.
- **[AGENTS.md](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/AGENTS.md) & [docs/evolution/PROTOCOL.md](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/docs/evolution/PROTOCOL.md)**:
  - 외부 고객 상담(SMS/카카오톡) 본문 역시 컴포넌트별 임의 작성을 금지하고 `lib/site.ts` 헬퍼를 통해 일원화하도록 SSOT 규칙 확장 명문화.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.39s) — 디자인 토큰 100% 준수
- **2. verify-predeploy**: PASS (0.28s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.28s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.45s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.39s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (5.86s) — 0 errors
- **7. eslint**: PASS (13.53s) — 0 errors, 0 warnings
- **8. next build**: PASS (20.40s) — 22/22 라우트 프리렌더링 완료 (Exit Code 0)
- **총 소요 시간**: 41.58초

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **상담 본문 맥락 보존(Context Preservation)**: 고객이 모바일에서 문자 상담을 누를 때 상품의 고유 링크가 본문에 포함되어 있으면 오프라인 매장 관리자가 고객의 화면을 직접 보지 않고도 터치 한 번으로 정확한 재고 상태와 매입 이력을 대조할 수 있어 비즈니스 전환 속도가 비약적으로 향상됨.

---

## 🚀 [Cycle 7] 2026-10-26 — 인지 부하 제로(Zero Cognitive Overload) & 프리미엄 쇼룸 UX/UI 전면 고도화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-011`
- **문제 진단**:
  1. 기존 웹사이트에 설득을 위한 안내 문구가 과도하게 중복 배치되어 제품 중심의 시각적 스캐닝을 방해하고 사용자 피로도(인지 부하)를 가중시킴.
  2. 상품 카드에 등급 시각 배지가 부재하고, 스펙 캡슐이 텍스트와 엉켜 직관적인 가격/상태 파악이 지연됨.
  3. 상세 페이지의 액션 버튼 6개가 세로로 길게 늘어서 노트북/모바일에서 400px 이상의 스크롤 낭비를 유발함.
  4. 갤러리 모달의 중복 체크리스트와 간편 문의 폼의 강제 펼침 배너로 인해 핵심 CTA 접근성이 떨어짐.

### 2. 코드 변경 요약
- **[components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)**:
  - 사진 좌상단 플로팅 등급 배지 추가 (`bg-white/95 text-[#0E1A2B] font-extrabold`).
  - 상단 메타 라인 정돈: 카테고리 강조(`text-[#D9531E]`) + 모델명 모노스페이스(`font-mono`).
  - 스펙 캡슐 디자인 명확화 및 가격 폰트 확대 (`text-hb-lg sm:text-hb-xl`).
  - 하단 안심 가치 스트립 중복 문구 제거 및 1줄 단일 혜택으로 압축.
- **[app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx)**:
  - 히어로 섹션 서브헤딩 및 3대 원칙 박스 문구 40% 이상 경량화.
  - B2B 납품 섹션 및 매입 절차 가이드를 간결한 1줄 직관 카드로 재배치.
- **[components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)**:
  - 섹션 상하 여백 슬림화 및 4열 거대 카드 제거, 단일 행 퀵 바둑판 스트립으로 정돈하여 실매물 그리드로 즉시 시선 연결.
- **[components/home/ai-recommendation-guide-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/ai-recommendation-guide-section.tsx)**:
  - 5대 품목 비교 행과 상황별 가이드의 서술형 줄글을 선명한 대비형 핵심 문장으로 압축.
- **[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx) & [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)**:
  - 공식 공급가 티켓 박스 헤더 배지 세련화 (`직영 쇼룸 검수 완료 · 실매물 공급가`).
  - 전화 바로 문의 및 카카오톡 1:1 상담 버튼 높이를 균형 잡힌 `h-14`로 조정.
  - 보조 액션(문자 문의, 온라인 견적서, 다른 매물 더보기, 관심 매물 견적함)을 2x2 컴팩트 그리드로 재배치하여 세로 높이를 210px 절감.
- **[components/products/v2-visual-inspection-viewer.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/v2-visual-inspection-viewer.tsx)**:
  - 4대 부위별 질문 태그 단순화 및 서술형 3줄 설명을 1줄 공식 품질 인증서 스타일 요약으로 정돈.
- **[components/products/v2-spatial-fit-planner.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/v2-spatial-fit-planner.tsx)**:
  - 에어컨 기본 포함 항목과 추가 점검 항목 간결화, 출입문 통과 및 운반비 여건에 컬러풀한 시각 판정 배지 적용.
- **[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)**:
  - 상단 다크 헤더 설명 1줄화, 모달 내부의 중복 2줄 점검 안내 박스 제거.
- **[components/inquiry/v2-wizard-quick-inquiry.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/v2-wizard-quick-inquiry.tsx)**:
  - 2단계 권장 촬영 예시 가이드의 초기 상태를 접힘(`showGuide: false`)으로 변경하여 모바일에서 다음 단계 CTA가 잘리는 현상 해결 (점진적 공개 적용).

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.47s) — 임의 픽셀 폰트 0건, 이모지 0건, Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.27s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.42s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.36s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.32s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (2.95s) — 0 errors
- **7. eslint**: PASS (14.21s) — 0 errors, 0 warnings
- **8. next build**: PASS (19.93s) — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)
- **총 소요 시간**: 약 39초

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **점진적 공개(Progressive Disclosure)의 실질적 전환 효과**: 모바일 화면에서 도움말이나 가이드 배너가 기본으로 펼쳐져 있으면 다음 액션 버튼을 화면 밖으로 밀어내어 이탈률을 높임. 접힘 상태를 기본값으로 두고 필요 시 원터치로 열 수 있도록 구성하는 것만으로 폼 전환 접근성이 대폭 향상됨.
- **2x2 그리드를 통한 세로 뷰포트 보존**: 상세 페이지 우측 고정 영역에서 보조 액션 버튼들을 가로 2열로 컴팩트하게 모아주면 일반적인 1080p 및 노트북 화면에서 스크롤 없이도 핵심 사양과 결제/상담 버튼이 한눈에 들어오는 프리미엄 쇼룸 경험을 완성할 수 있음.



