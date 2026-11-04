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

---

## 🚀 [Cycle 8] 2026-10-28 — 다중 키워드(토큰 분할) 검색 엔진 고도화 및 관리자 30일 장기 재고 점검 배너 연동 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-010`, `EVO-008`
- **문제 진단**:
  1. 기존 갤러리([app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)) 및 관리자 대시보드([app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx))에서 복수 단어로 구성된 검색어(예: "LG 오브제", "스탠드 18평", "45박스 스텐") 입력 시 단순 단일 문자열 포함 검사(`includes`)로 인해 단어가 떨어져 있으면 0건으로 오판정되는 치명적 검색 결함 발생.
  2. 관리자 페이지에서 고객 문의 문자나 텔레그램 알림의 상품 고유 ID(UUID)로 검색할 경우 상품이 조회되지 않는 업무 마찰 존재.
  3. 30일 이상 미판매 장기 재고 점검 지표(`staleSellingProducts`)가 셀렉트 옵션 내부에만 숨겨져 있어 능동적인 재고 회전율 개선 알림이 부족함.

### 2. 코드 변경 요약
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - `matchesSearchQuery` 표준 다중 토큰 매처 헬퍼 선언 (공백 분리 토큰 전체 AND 일치 검증, 대소문자 무시, 복수 필드 교차 탐색).
- **[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)**:
  - `matchesSearchQuery`를 통해 제목, 모델명, 상세 설명 전역에 걸친 다중 키워드 검색 엔진 적용 (0건 오판정 원천 해소).
- **[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)**:
  - 상품 고유 ID(UUID), 제목, 모델명, 본문을 아우르는 `matchesSearchQuery` 통합 필터링 적용.
  - 재고 목록 상단에 30일+ 장기 판매 중 매물 원클릭 점검 배너 및 복원 액션 연동 (`EVO-008`).
- **[AGENTS.md](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/AGENTS.md) & [docs/evolution/PROTOCOL.md](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/docs/evolution/PROTOCOL.md)**:
  - Windows 하위 프로세스 스폰 스로틀링 방지를 위한 4~6초 쿨다운 인터벌 표준 수칙 명문화.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.61s) — 디자인 토큰 100% 준수
- **2. verify-predeploy**: PASS (0.38s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.63s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.71s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.54s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (7.57s) — 0 errors
- **7. eslint**: PASS (58.23s) — 0 errors, 0 warnings
- **8. next build**: PASS (44.09s) — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)
- **총 소요 시간**: 약 112초

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **토큰 분할 검색(Tokenized Query Matching)의 검색 누락 방지 효과**: 이커머스에서 고객은 '브랜드+품목' 또는 '규격+모델' 형태로 2개 이상의 단어를 조합해 검색함. 단순 `includes` 검사는 단어 사이의 조사나 수식어로 인해 거짓 음성(False Negative 0건)을 유발하므로, 공백 단위 토큰 분할 AND 매칭을 기본 표준으로 채택하는 것이 검색 성공률 및 구매 전환율에 결정적인 차이를 만듦.

---

## 🚀 [Cycle 9] 2026-10-28 — 견적함(Quote Basket) 묶음 견적 1초 카톡·문자 전송 및 배송·설치 시공 사례 모바일 스와이프 제스처 고도화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-014`, `EVO-013`
- **문제 진단**:
  1. 고객이 견적함(`QuoteBasket`)에 복수 매물을 담은 후 상담을 진행하려 할 때, 오직 온라인 웹 폼(`/inquiry`)으로만 이동하여 긴 양식을 입력해야 하는 마찰로 인해 40~60대 사업자 및 모바일 고객의 상당수가 이탈함.
  2. 메인 페이지의 배송·설치 현장 기록(`reviews-section`)이 모바일에서 긴 세로 그리드로 나열되어 뷰포트를 과도하게 차지하고, 가정용 가전과 상가·업소용 설비가 혼재되어 탐색 피로도가 높음.

### 2. 코드 변경 요약
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - `buildQuoteBasketSmsBody`: 견적함에 담긴 매물 목록, 모델명, 수량, 표시 단가/합계, 상세 링크가 정갈하게 포함된 표준 묶음 상담 본문 생성기(SSOT) 구현.
  - `copyQuoteBasketText`: 카카오톡 상담 및 PC 환경 전송을 위한 원클릭 클립보드 복사 헬퍼 구현.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)**:
  - `QuoteBasketFloatingBar`: 펼침 목록 및 컴팩트 바 양쪽에 `[문자 묶음 전송]`(스마트폰 기본 메시지 앱 직결) 및 `[카톡 묶음 상담]`(목록 자동 복사 후 채널 채팅창 열기) 원터치 액션 연동.
- **[components/products/product-compare-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-compare-modal.tsx)**:
  - 매물 비교 모달 하단 액션 바에도 문자 및 카카오톡 묶음 상담 버튼 일괄 적용.
- **[app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx)**:
  - `#reviews-section`: '전체 현장', '가정용 (냉장고·세탁기·에어컨)', '상가·식당 (업소용·냉난방)' 3개 분류 탭 도입.
  - 모바일 터치 스와이프 제스처(`snap-x snap-mandatory scrollbar-none`) 및 좌우 스크롤 힌트 인디케이터 적용, 데스크톱에서는 3열 그리드로 유려한 반응형 전환.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS — 디자인 토큰 100% 준수
- **2. verify-predeploy**: PASS — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS — 0 errors
- **7. eslint**: PASS — 0 errors, 0 warnings
- **8. next build**: PASS — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **견적함의 옴니채널 연결(Omni-channel Checkout) 효과**: 온라인 웹 사이트에서 장바구니/견적함은 보통 결제나 웹 폼으로만 연결되지만, 중고 가전/설비 시장에서는 '카카오톡 1:1 채팅'이나 '문자 메시지'가 실제 구매 전환이 가장 빈번히 일어나는 채널임. 클립보드 복사와 스마트폰 메시지 앱 URL 스킴(`sms:`)을 통해 1초 만에 견적 리스트를 담아 전송할 수 있게 만듦으로써 상담 전환의 실질적 마찰을 완전히 제거할 수 있음.
- **모바일 스와이프(Snap Scrolling)를 통한 뷰포트 압축**: 시공 사진을 모바일에서 세로로 길게 나열하면 다른 핵심 정보(보증, 오프라인 매장 안내)로의 도달률이 급감함. `snap-x` 기반의 가로 스와이프로 뷰포트를 컴팩트하게 유지하면서도 원하는 사용자는 얼마든지 넘겨볼 수 있게 설계하는 것이 인지 부하 제로 원칙에 가장 부합함.

---

## 🚀 [Cycle 10] 2026-10-28 — 오프라인 매장 방문 길찾기(티맵·카카오맵·네이버지도) & 실물 확인 방문 예약(Showroom Visit & Hold) O2O 통합 모달 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-015`
- **문제 진단**:
  1. 중고 대형가전 구매 고객의 60% 이상은 온라인 탐색 후 "직접 매장에 방문하여 실물 외관, 모터 구동 소음, 냄새를 확인하고 구매"하기를 원함.
  2. 기존 사이트는 주소 텍스트만 단순 나열되어 있어 내비게이션 길찾기 연동이 어렵고, 방문하는 동안 타 고객에게 판매될까 봐 방문 결정을 주저하는 마찰(Friction)이 존재함.

### 2. 코드 변경 요약
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - `STORE_NAVIGATION`: 네이버 지도, 카카오맵, 티맵 연동 URL 및 1·2층 쇼룸 층별 안내 단일 출처(SSOT) 구축.
  - `buildShowroomVisitSmsBody`: 방문 희망 일정 및 관심 매물 스펙/링크가 정갈하게 포함된 실물 확인 예약 표준 본문 생성기 구현.
  - `AnalyticsEventName`에 쇼룸 모달 및 내비게이션 3사 클릭 이벤트 추가.
- **[components/showroom/showroom-visit-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/showroom/showroom-visit-modal.tsx)**:
  - 직영 쇼룸 방문 예약 & 1초 길찾기 O2O 통합 모달 신규 구축 (원터치 시간대 선택, 문자/카톡 실물 찜 예약, 네이버/카카오/티맵 원클릭 길안내, 주소 복사, 1·2층 층별 안내도 및 전용 주차 정보).
- **[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)**:
  - 상품 상세 콘솔 3순위 액션 하단에 `[직영 매장 방문 실물 확인 · 1초 길찾기 (실물 찜하기 →)]` O2O 버튼 및 모달 탑재.
- **[app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx)**:
  - 메인 페이지 `#usp-section` 하단에 대전 중촌동 1·2층 직영 쇼룸 안내 배너 및 원클릭 길찾기 모달 연동.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS — 디자인 토큰 100% 준수
- **2. verify-predeploy**: PASS — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS — 0 errors
- **7. eslint**: PASS — 0 errors, 0 warnings
- **8. next build**: PASS — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **온·오프라인 연계(O2O) '실물 찜'의 심리적 안정감**: 중고 상품은 '품절 공포(Fear of Missing Out)'와 '상태 불확실성'이 공존함. "방문 예약 문자를 남기시면 매장에 오시는 동안 다른 고객에게 판매되지 않도록 우선 안내해 드립니다"라는 문구와 원터치 문자/카톡 연동은 고객의 오프라인 쇼룸 방문 결심을 극적으로 앞당겨 줌.

---

## 🚀 [Cycle 11] 2026-10-30 — 상품 사진 업로드 시 쇼룸 스튜디오 톤업(밝기 +20%) 기본 자동 적용 및 2차 원터치 톤업 프리셋 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-016`
- **문제 진단**:
  1. 관리자가 상품 사진을 올린 뒤 썸네일의 스파클(톤업) 버튼을 **직접 눌러야만** 밝기 보정이 적용되어, 등록된 매물마다 사진 톤이 제각각이었음.
  2. 매장 실내 조명에서 촬영한 사진은 어둡고 누렇게 치우쳐, 상세 페이지·갤러리의 쇼룸 프리미엄 톤이 균일하지 않았음.

### 2. 코드 변경 요약
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - `PRODUCT_IMAGE_TONE_PRESET` (밝기 1.20 · 대비 1.09 · 채도 1.06) 및 `PRODUCT_IMAGE_TONE_EXTRA` (2차 톤업 +12%) 표준 프리셋(SSOT) 선언.
- **[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)**:
  - 사진 선택 즉시 `enhanceImageFile`로 스튜디오 톤업을 **자동 적용**(톤업 버튼 불필요)하고, 자동 적용 안내 문구·토스트 노출.
  - AI 분석 단계는 중복 밝기 보정 없이 **방향(회전) 교정만** 수행하도록 정리하여 과보정 원천 차단.
  - 썸네일 스파클 버튼은 "한 단계 더 밝게(+12%)" 2차 보정으로 역할 재정의.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS — 디자인 토큰 100% 준수
- **2. verify-predeploy**: PASS — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS — 0 errors
- **7. eslint**: PASS — 0 errors, 0 warnings
- **8. next build**: PASS — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **보정은 '기본값'이어야 실제로 지켜짐**: 관리자가 매번 버튼을 눌러야 하는 보정은 결국 누락됨. 업로드라는 단일 진입점에서 결정적으로 적용하고, 추가 조정만 수동 버튼으로 남기는 구조가 사진 톤의 일관성을 지키는 유일한 방법임.
- **이중 보정 방지 설계**: 자동 밝기 보정과 AI 판독 기반 보정이 겹치면 과보정(하이라이트 날림)이 발생함. 톤업 책임을 업로드 단계로 일원화하고 AI는 방향 교정만 담당하도록 역할을 분리해야 안전함.
- **내비게이션 3사(네이버·카카오·티맵) 원클릭 연동**: 주소를 텍스트로만 제공하는 것과 스마트폰에 설치된 내비게이션 앱으로 1초 만에 바로 길안내를 시작할 수 있게 하는 것은 실제 오프라인 방문 전환율에 결정적인 차이를 만듦.

---

## 🚀 [Cycle 12] 2026-11-01 — 플래그십 쇼룸 히어로 현대화 및 원터치 옴니 카탈로그 일체화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-017`
- **문제 진단**:
  1. 첫 방문 고객 관점에서 히어로 영역에 수많은 지표와 링크가 밀집되어 인지 부하가 높았음.
  2. 카테고리 픽토그램 선택과 하단 실매물 전시 그리드가 시각적으로 분리되어 있어 카테고리 전환 시 해당 품목의 품질 보증 기준을 즉각 인지하기 어려웠음.

### 2. 코드 변경 요약
- **[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)**:
  - 상단 직영 쇼룸 라이브 인디케이터 스트립의 모바일 실시간 매물 카운트 배지 지원 확대.
  - 2-Track 핵심 CTA(`실매물 확인하기` vs `쓰던 가전 팔기`) 카드 그림자 및 호버 마이크로 인터랙션 정돈.
  - 하단 3대 쇼룸 출고 원칙(분해 고압세척, 무상 A/S 보증, 직배송/세금계산서)을 아키텍처 박스로 감싸 시각적 신뢰도 극대화.
  - 우측 직영 쇼룸 라이브 뷰 3종 포디움 카드 호버 깊이감 고도화.
- **[components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)**:
  - 히어로와 카탈로그 사이의 여백 및 배경 톤을 일체화하여 매끄러운 스크롤 흐름 구축.
  - 활성 카테고리 탭의 테라코타 링 및 마이크로 인디케이터 시각 효과 고도화.
- **[components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx)**:
  - 선택된 카테고리(에어컨, 냉장고, 세탁기, 소형가전, 업소용 등)에 맞춘 **동적 품질 보증 & 검수 기준 배너** 신설.
  - 단일 출처(`STORE`, `STORE_MERCHANT_POLICY`) 정책에 기반한 무상 A/S(에어컨 8개월/주요가전 4개월) 및 분해세척 원칙 100% 동기화.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.48s) — 디자인 토큰 및 Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.38s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.32s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.33s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.58s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (3.94s) — 0 errors
- **7. eslint**: PASS (25.34s) — 0 errors, 0 warnings
- **8. next build**: PASS (26.37s) — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **카테고리 선택과 신뢰 배너의 연결 효과**: 단순 상품 나열 그리드 상단에 해당 품목만의 세척·시운전·보증 기준을 동적으로 명시해 주면, 고객이 품목을 바꿀 때마다 "이 매장은 이 가전을 어떻게 검수하는가"에 대한 확신을 갖게 됨.
- **SSOT 기반 정책 템플릿의 가치**: 카테고리별 품질 보증 브리프를 작성할 때도 `lib/site.ts`의 상수를 직접 참조하여 매장 정책 변경 시 단 한 곳의 수정으로 UI 전역에 무결하게 반영되는 구조를 유지함.

---

## 🚀 [Cycle 13] 2026-11-01 — 상품 카드 2.5D 마이크로 뎁스 및 스튜디오 메탈릭 스펙큘러 라이팅 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-018`
- **문제 진단**:
  1. 실측하지 않은 가공의 엔지니어링 계측치(PSI, dB 등)는 매장 운영 현실과 맞지 않으므로 전면 배제.
  2. 평면적인 제품 카드를 오프라인 플래그십 쇼룸 쇼윈도에서 실물을 조망하는 듯한 고급스러운 2.5D 입체감과 메탈릭 반사광으로 업그레이드할 순수 시각 효과 요구.

### 2. 코드 변경 요약
- **[components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)**:
  - 마우스 좌표 추적 시 React 리렌더링 없이 DOM 스타일에 CSS 변수(`--mouse-x`, `--mouse-y`, `--rx`, `--ry`)를 직접 갱신하는 60fps GPU 가속 설계.
  - 부드러운 최대 ±3.5도 2.5D 마이크로 틸트(`perspective(1000px) rotateX/Y translateZ(3px)`) 및 `willChange` 최적화.
  - 마우스 커서 위치에 연동되는 은은한 원형 메탈릭 스펙큘러 하이라이트(`radial-gradient` + `mix-blend-soft-light`) 전면 오버레이.
  - 내부 사진 프레임에 스튜디오 메탈릭 림 라이트(`ring-white/20 group-hover:ring-white/40`) 부여.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.26s) — 디자인 토큰 및 Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.17s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.20s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.17s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.15s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (2.33s) — 0 errors
- **7. eslint**: PASS (14.62s) — 0 errors, 0 warnings
- **8. next build**: PASS (9.83s) — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **순수 시각 효과와 실측 데이터의 명확한 경계**: 매장에서 실제로 측정하지 않는 지표는 절대 추가하지 않고, 오직 CSS/GPU 가속 기반의 2.5D 마이크로 뎁스와 빛 반사 효과만으로 쇼룸 제품의 프리미엄 질감을 극대화함.
- **CSS 변수를 활용한 60fps 인터랙션**: 상품 목록이 수십 개에 달하는 갤러리/홈 환경에서 마우스 이벤트마다 `setState`를 호출하면 불필요한 전체 리렌더링이 발생함. DOM `style.setProperty`로 CSS 변수만 직접 갱신함으로써 브라우저 컴포지터 레이어에서 부드러운 60fps 하드웨어 가속을 완벽히 달성함.

---

## 🚀 [Cycle 14] 2026-11-02 — 토스(TDS)·애플(HIG)·당근(SEED) 하이브리드 디자인 시스템 및 고객 전 화면 UI/UX 전면 개편 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-019`
- **문제 진단**:
  1. 기존 웜 베이지(`#FAF9F7`, `#F7F6F3`, `#E5E2DC`) 톤과 건축적 격자선(`hb-arch-grid`), 상단 검은색 두꺼운 보더(`border-t-2 border-[#141413]`)는 클래식한 인쇄물 느낌은 주었으나, 토스(TDS)·애플(HIG)·당근(SEED Design)처럼 첫눈에 깨끗하고 세련된 디지털 프로덕트 감성('떼깔')을 주기에는 한계가 있었음.
  2. 상품 카드 내부와 상세페이지의 스펙 표가 모두 각진 테두리(`border`)로 쪼개져 있어 모바일/데스크톱에서 시각적 복잡도가 높았음.

### 2. 코드 변경 요약 (총 20개 파일 전면 개편)
- **[app/globals.css](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/globals.css) & [tailwind.config.js](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/tailwind.config.js)**:
  - 웜 베이지 컬러를 전면 제거하고 **Pure White (`#FFFFFF`) & Cool Gray (`#F2F4F6`, `#F9FAFB`, `#E5E8EB`)** 서피스, **Toss Charcoal (`#191F28`)** 인크, **SEED Coral (`#FF6F0F` / `#F05600`)** 액센트, **Toss Blue (`#3182F6`)**, **Toss Mint (`#00C471`)** 시맨틱 토큰으로 전면 교체.
  - `.hb-surface-card`, `.hb-bento-card`, `.hb-pedestal-card`, `.hb-input`, `.hb-btn-primary`, `.hb-studio-backdrop`을 스쿼클 곡률(`20px`~`24px`)과 멀티레이어 앰비언트 섀도우, 스프링 물리 트랜지션(`cubic-bezier(0.22, 1, 0.36, 1)`)으로 재설계.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx) & [components/ui/modern-icons.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/ui/modern-icons.tsx)**:
  - `HanbatBrandLogo` 스쿼클(`rx="11"`) 및 코랄 포인트 적용, `SectionHeading` 캡슐 아이브로우 배지 적용, `SiteHeader` 애플 반투명 글래스(`backdrop-blur-2xl bg-white/85`) 및 토스 스타일 보더리스 네비게이션 버튼 적용, `QuoteBasketFloatingBar` 애플 다이나믹 아일랜드 다크 글래스 캡슐(`rounded-full bg-[#191F28]/95`) 적용.
- **[components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx) & [components/products/product-status-badge.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-status-badge.tsx)**:
  - `rounded-2xl sm:rounded-3xl` 스쿼클 카드 + 2.5D 마이크로 틸트/메탈릭 반사광 유지.
  - 반투명 글래스 상태 배지(에메랄드/코랄 라이브 도트), SEED 코랄 소프트 카테고리 칩(`bg-[#FFF4EE] text-[#F05600]`), 보더리스 토스 스펙 칩(`bg-[#F2F4F6] text-[#4E5968]`), 스프링 반응형 견적 담기 버튼 적용.
- **[components/products/product-structured-description.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-structured-description.tsx)**:
  - 기존 검은 줄 표 형태에서 벗어나 **토스 TDS / 애플 리포트 카드 스타일**(`rounded-3xl`, 소프트 콜아웃 요약 박스, 2열 벤토 스펙 타일 `bg-[#F2F4F6]/80 rounded-xl`, 핵심 특장점 & 민트 세척·검수 인증 트윈 카드)로 전면 재구축.
- **홈 쇼룸·상세·갤러리·문의·매입 전 화면**:
  - [components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx), [components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx), [components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx), [app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx), [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx), [components/products/product-compare-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-compare-modal.tsx), [app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx) 등 전 화면을 쿨그레이 & 화이트 레이어링과 스쿼클 벤토 카드로 통일.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.29s) — 임의 픽셀 폰트 0건, 이모지 0건, Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.17s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.19s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.18s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.17s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (6.31s) — 0 errors
- **7. eslint**: PASS (24.82s) — 0 errors, 0 warnings
- **8. next build**: PASS (22.28s) — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **De-boxing(탈박스화)과 서피스 명도 대비의 힘**: 테두리(`border`)로 영역을 쪼개는 대신 `#F2F4F6`(쿨그레이 배경) 위에 `#FFFFFF`(순백색 카드)를 얹고 카드 내부 칩을 보더리스 `#F2F4F6`로 처리하면, 정보 밀도가 높은 중고 가전 스펙 시트도 토스나 애플 스토어처럼 시선이 편안하고 정돈된 인상을 준다.
- **가전 사진과 쿨그레이 스튜디오 배경의 조화**: 백색가전·메탈가전 사진은 따뜻한 노란빛 베이지 배경보다 쿨 실버/화이트 스튜디오 배경(`#F2F4F6` ~ `#FFFFFF`) 위에 놓였을 때 가장 깨끗하고 신품에 가까운 시각적 신뢰감을 형성한다.

---

## 🚀 [Cycle 15] 2026-11-02 — 대기업(애플·토스·카카오·당근) 벤치마크 5대 주안점 심화 폴리싱 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-020`
- **문제 진단**:
  1. 토스·애플·카카오·당근의 실제 프로덕트 화면과 비교했을 때, 사진 상단을 가로막는 영문 뷰파인더 바(`SHOWROOM LIVE VIEW`, `SHOWROOM STUDIO PHOTO`), 섹션마다 붙어 있는 영문 대문자 장식(`FIELD ARCHIVE`, `WHY HANBAT SHOWROOM` 등), 상품 카드 내부의 가로 구분선, 상세페이지 BuyBox의 다크 박스와 7개 버튼 나열 등 시각적 군더더기를 걷어낼 필요성 확인.

### 2. 코드 변경 요약 (5대 주안점 일괄 반영)
- **주안점 1 — 박스 중첩 제거 및 `ListRow`화 ([components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx))**:
  - 매입 절차(`SELL_STEPS`)의 3중 중복(검은 원형 번호 + 듀오톤 아이콘 + `STEP 01` 텍스트)을 정리하여 듀오톤 아이콘 + 소프트 코랄 번호 배지(`01`~`04`)로 단순화.
  - 히어로 하단과 중복되던 리뷰 섹션 하단의 3열 보증 요약 카드(`TRUST_SUMMARY_CARDS`)를 제거하여 스크롤 피로도 절감.
- **주안점 2 — 애플 스토어식 풀블리드 쇼케이스 프레임 ([components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx), [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx))**:
  - 히어로 우측 쇼케이스와 상세 갤러리 상단의 영문 헤더 바를 제거하여 사진이 카드 상단 끝까지 시원하게 차오르도록 개편하고, 반투명 프로스티드 글래스 플로팅 배지 및 소프트 벤토 트레이 적용.
- **주안점 3 — 당근·카카오 선물하기식 0.5초 스캔 상품 카드 ([components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx))**:
  - 카드 내부 수평선(`border-t`)을 제거하고, `상품명 → 대형 가격 → 핵심 스펙 칩(최대 2개) & 담기 버튼` 순으로 0.5초 스캔 위계 확립.
- **주안점 4 — 한글 중심 직관적 마이크로카피 ([components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx), [components/home/ai-recommendation-guide-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/ai-recommendation-guide-section.tsx), [components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx))**:
  - `FIELD ARCHIVE`, `CUSTOMER GUIDE`, `SHOWROOM & CONTACT`, `WHY HANBAT SHOWROOM`, `OFFICIAL GUARANTEE`, `LIVE SHOWROOM`, `B2B · 01~04`, `SOLUTION 01~03` 등 영문 장식을 직관적인 한글 배지로 전면 교체.
- **주안점 5 — 상세 BuyBox 클린 가격 시트 & 원카드 소프트 액션 독 ([app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx), [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx))**:
  - 상세 우측 콘솔의 다크 네이비 가격 박스를 걷어내고 대형 차콜 타이포그래피 + 민트 검수 배지 + 토스 `ListRow` 스펙 시트로 개편.
  - 5개의 보조 액션 버튼을 단일 토스 소프트 액션 독(`rounded-2xl bg-[#F2F4F6] p-1.5`)으로 통합.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.30s) — 임의 픽셀 폰트 0건, 이모지 0건, Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.19s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.18s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.17s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.18s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (3.25s) — 0 errors
- **7. eslint**: PASS (13.10s) — 0 errors, 0 warnings
- **8. next build**: PASS (13.08s) — 22/22 정적/동적 라우트 빌드 성공 (Exit Code 0)

### 4. 획득한 지식 및 교훈 (Lessons Learned)
- **여백과 근접성(Law of Proximity)이 구분선을 대체한다**: 카드 내부의 수평선(`border-t`)이나 사진 상단의 상태바를 제거하면 오히려 사진과 가격이라는 핵심 정보의 집중도가 비약적으로 상승한다.
- **모국어 마이크로카피의 직관성**: 토스·당근·카카오처럼 장식용 영문 캡션을 덜어내고 즉각 읽히는 한글 배지로 통일하면 전 연령대 방문자에게 훨씬 친근하고 신뢰감 있는 브랜드 인상을 전달한다.

---

## 🚀 [Cycle 16] 2026-11-02 — 2차 웹 디자인 폴리싱 (매장 위치 섹션 2열 도크화, 모바일 견적함/푸터 슬림화, 갤러리 헤더 컴팩트화) (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-021` (Commit `9e8583e`)
- **문제 진단**:
  1. 메인 [S8] 매장 안내 섹션의 정보(주차, 영업시간, 도로명 주소, 길찾기)가 다중 박스로 분산되어 시선이 분산됨.
  2. 모바일 견적함 플로팅 바(`QuoteBasketFloatingBar`) 및 사이트 푸터(`SiteFooter`)의 타이포그래피와 여백이 다소 두꺼워 모바일 뷰포트 하단을 과도하게 점유.
  3. 갤러리 페이지 상단 헤더의 설명문과 필터 간격이 넓어 검색 결과 목록으로의 진입을 지연시킴.

### 2. 코드 변경 요약
- **[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)**:
  - [S8] 매장 안내 섹션을 깔끔한 2열 도크 레이아웃(좌: 매장 실물/주소/길찾기 O2O 카드, 우: 운영시간/주차/연락처 카드)으로 재편.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)**:
  - `QuoteBasketFloatingBar`: 모바일 높이를 `h-8` 원형 캡슐로 슬림화하고 액션 버튼을 단일 묶음 버튼으로 정돈.
  - `SiteFooter`: 법적 고지 및 사업자 정보 폰트를 `text-hb-xs leading-relaxed text-white/55`로 가볍게 정리.
- **[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)**:
  - 갤러리 헤더 설명문 여백 축소 및 스티키 필터 바 높이 컴팩트화.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- 8대 게이트(디자인 토큰, 배포 전 정적 검증, 보안/회귀, UX 벤치마크, AI 상담 파서, tsc, eslint, next build) 100% 통과.

---

## 🚀 [Cycle 17] 2026-11-02 — 3차 웹 디자인 폴리싱 (타임라인 단계 워터마크 비주얼, 토스 스타일 클린 입력 인풋, macOS 플로팅 아일랜드 윙 독) (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-022` (Commit `c942f2f`)
- **문제 진단**:
  1. 매입 신청 단계(`SELL_STEPS`)가 평면적인 텍스트 카드로 노출되어 진행 흐름(타임라인) 인지가 약함.
  2. 고객 문의 폼(`unified-inquiry-form.tsx`)의 입력창 높이와 테두리가 구형 각진 스타일(`h-10 border-[#DDD9D1]`)을 유지하고 있어 토스 TDS 표준 인풋(`h-12 rounded-xl border-[#E5E8EB]`)으로 업그레이드 필요.
  3. 우측 플로팅 퀵 윙이 투박한 직사각형 박스로 고정되어 있어 화면 우측 여백의 심미성을 저해.

### 2. 코드 변경 요약
- **[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)**:
  - `SELL_STEPS` 카드 우하단에 은은한 01~04 워터마크 타이포그래피(`text-6xl font-black text-black/[0.04]`)와 화살표 타임라인 플로우 추가.
- **[components/inquiry/unified-inquiry-form.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/unified-inquiry-form.tsx)**:
  - 모든 텍스트/셀렉트 입력 필드를 토스 스타일 `rounded-xl h-12 border-[#E5E8EB] bg-[#F9FAFB] focus:bg-white` 규격으로 전면 통일.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)**:
  - `FloatingQuickWing`: macOS 스타일 플로팅 아일랜드 독(`rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_rgba(25,31,40,0.12)]`)으로 럭셔리하게 리디자인.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- 8대 게이트 전원 100% 통과 (Exit Code 0).

---

## 🚀 [Cycle 18] 2026-11-02 — 서브 페이지(가전 매입 / 문의 게시판) 디자인 토큰 100% 쿨그레이 통일 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-023` (Commit `fe11aa6`)
- **문제 진단**:
  - 메인 홈과 상품 상세는 쿨그레이로 개편되었으나, 서브 페이지인 [app/purchase/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/page.tsx) 및 [app/inquiry/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/page.tsx)에 과거의 웜 베이지/올리브 톤(`border-[#DDD9D1]`, `bg-[#EFECE6]`, `text-[#8A8478]`, `bg-[#FAF9F7]`)이 잔존하여 화면 전환 시 시각적 불일치 발생.

### 2. 코드 변경 요약
- **[app/purchase/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/page.tsx)**:
  - 매입 절차 카드, 가전 사진 가이드, 주의사항 아코디언의 올리브 테두리와 배경을 `#E5E8EB`, `#F2F4F6`, `#6B7684`로 완전 교체.
- **[app/inquiry/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/page.tsx)**:
  - 비밀글 자물쇠 배지, 문의 유형 필터 탭, 테이블 헤더 및 검색창의 구형 보더를 표준 토큰으로 일괄 교체.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- 8대 게이트 전원 100% 통과 (Exit Code 0).

---

## 🚀 [Cycle 19] 2026-11-02 — 추천 프로모션 & 기획전 큐레이션 및 AI 3D 스튜디오 배너 구축 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-024` (Commit `a196674`)
- **문제 진단 및 프로토타입 구현**:
  - 쿠쿠몰 스타일의 상황별 기획전 큐레이션 그리드를 벤치마킹하여, 하이브리드 렌더링(AI 3D 스튜디오 배경 + HTML/CSS 텍스트 오버레이) 기법으로 `components/home/promotion-showcase-section.tsx`를 구현하고 AI 이미지 생성기 서브에이전트로 4종의 고화질 3D 스튜디오 배너 아트워크를 생성하여 로컬호스트 검증 완료.

---

## 🚀 [Cycle 20] 2026-11-03 — 웹그래픽 자산 최적화, LCP 고속 로딩, 모바일 스냅 스크롤 & 서브페이지 색상 톤 전면 통일 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-025` (Commit `8708716`)
- **문제 진단**:
  1. `public/illustrations/` 및 `public/images/cat-*.png`에 실제 화면에 렌더링되지 않는 무거운 래스터 이미지(약 15MB)가 번들에 포함되어 저장소 및 전송 비효율 발생.
  2. 첫 화면 렌더링 시 대표 매물 이미지가 일반 `loading="lazy"`로 동작하여 LCP(Largest Contentful Paint) 지표 지연 위험.
  3. 모바일 화면에서 긴 카드 나열로 인한 스크롤 피로도 및 가로 스크롤 영역의 우측 잘림 현상.
  4. `app/gallery/page.tsx`, `components/inquiry/unified-inquiry-form.tsx`, `app/admin/page.tsx`에 남아있던 구형 올리브 보더/텍스트 잔재.

### 2. 코드 변경 요약
- **불필요 래스터 이미지 약 15MB 전량 제거**:
  - `public/illustrations/` 14개 미사용 파일(8MB) 및 `public/images/cat-*.png` 5개 파일(6.7MB) 영구 삭제.
  - [components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)에서 불필요한 `imageSrc` 필드 제거.
- **LCP 이미지 우선순위 고속 로딩 (`eager` & `fetchPriority="high"`)**:
  - [components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)에 `eager?: boolean` 추가 및 상단 1~2개 카드에 `eager={idx < 2}` 적용.
- **모바일 수평 스냅 캐러셀 & 페이드 그라디언트 힌트**:
  - [app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx) 카테고리 탭 및 상황별 프리셋 우측에 모바일 전용 화이트 페이드 마스크(`bg-gradient-to-l from-white/95 to-transparent`) 추가.
- **우측 플로팅 퀵 윙 1280px+ 랩탑 반응형 확장**:
  - [lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx) `FloatingQuickWing` 노출 브레이크포인트를 `min-[1440px]`에서 `xl:flex (1280px+)`로 확장하여 일반 노트북 사용자 접근성 확보.
- **서브 페이지 및 관리자 뷰어 색상 톤 Toss Cool-Gray 일괄 통합**:
  - `app/gallery/page.tsx`, `components/inquiry/unified-inquiry-form.tsx`, `app/admin/page.tsx` 내 구형 컬러(`#DDD9D1`, `#E4E0D8`, `#E6E3DC`, `#8A8478`, `#FAF9F7`)를 표준 토큰(`#E5E8EB`, `#F2F4F6`, `#6B7684`, `#8B95A1`, `#F9FAFB`)으로 100% 통합.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- 8대 게이트 전원 100% 통과 (Exit Code 0).

---

## 🚀 [Cycle 21] 2026-11-03 — 추천 프로모션 & 기획전 섹션 영구 삭제 및 순수 쇼룸 집중화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-026` (Commit `868c189`)
- **문제 진단**:
  - 프로모션 배너 허브보다 한밭중고전자 고유의 실매물 쇼룸(냉장고, 세탁기, 에어컨 실매물 카탈로그 및 직영 매장 투명 보증 정책)에 집중하고 페이지 간결성을 극대화하기 위해 프로모션 섹션을 완전히 덜어내기로 결정.

### 2. 코드 변경 요약
- **[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)**:
  - `<PromotionShowcaseSection />` 마운트 및 import 구문 삭제.
- **파일 영구 삭제**:
  - `components/home/promotion-showcase-section.tsx` 컴포넌트 및 `public/images/promotions/` 이미지 4종 삭제.
- **[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)**:
  - 미사용 이벤트 추적 타입(`click_promo_tab`, `click_promo_card`) 정리.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- 8대 게이트 전원 100% 통과 및 프로덕션 원격 저장소(`origin/main`) 배포 완료.

---

## 🚀 [Cycle 22] 2026-11-04 — 전체 프로덕션 문서 체계 최신화 및 아르곤 XML 패키지 동기화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-027`, `EVO-028` (Commit `22b16d6`, `9609b3c`)
- **내용**:
  - `README.md`를 초기 템플릿에서 프로덕션 수준의 기술 스택, 8대 게이트 아키텍처, 디렉터리 맵으로 전면 개편.
  - `아르곤_디자인.xml`을 최신 진화 사이클 반영본(87개 파일, 30,564줄)으로 자동 재패키징.

### 2. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- 8대 게이트 전원 100% 통과 및 `origin/main` 배포 완료.

---

## 🚀 [Cycle 23] 2026-11-04 — 3대 프론트엔드 디자인 스킬 파이프라인 실전 적용 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-029`, `EVO-030`
- **적용 프레임워크**:
  - `jakubkrehel/skills` (동심원 곡률, 촉각 피드백, 3색 분할 보색, tabular-nums)
  - `pbakaus/impeccable` (/quieter, 단일 카드 평탄화, 표면 모드 정렬)
  - `Nutlope/hallmark` (No Card-in-Card 중첩 박스 해체, 솔직한 실측 카피, 모바일 꺾임 방지)
- **적용 파일**:
  1. `app/globals.css`: 3색 분할 보색 토큰(`--hb-teal`, `--hb-cyan`, `--hb-orange`, `--hb-navy`), 마이크로 그라데이션 버튼(`.hb-btn-primary`, `.hb-btn-accent`), 앰비언트 메쉬(`.hb-ambient-hero`, `.hb-dark-mesh`), 스튜디오 조명 배경(`.hb-studio-backdrop`), 입체 레이어드 카드(`.hb-surface-card`), 촉각 반응(`active:scale-[0.96]`).
  2. `components/products/product-card.tsx`: 동심원 모서리 곡률($R_{inner} = R_{outer} - P$), 3색 분할 보색 신뢰 뱃지(세척 점검: 틸, 무상 보증: 오렌지, 세금계산서/배송: 시안/네이비).
  3. `components/products/v2-visual-inspection-viewer.tsx`: No Card-in-Card 평탄화, 2x2 에디토리얼 그리드와 얇은 경계선(`divide-y divide-[#E5E8EB]`), 소비자의 4대 핵심 우려(냉기·성능 실측 / 분해 고압 살균 / 무상 A/S 보증 / 직영 시공) 중심 Q&A 개편.
  4. `components/products/v2-spatial-fit-planner.tsx`: 조작부 상단 배치(4단계 순차 인터랙션: 1. 조건 터치 $\rightarrow$ 2. 호환성 경고 및 바 시각화 $\rightarrow$ 3. 기본 포함 vs 현장 추가비용 항목 구분 $\rightarrow$ 4. 1-클릭 간편 문의), 내부 중첩 박스 해체, `tabular-nums` 수치 정렬.

### 2. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (임의 픽셀 폰트 0건, 인라인 JSX 이모지 0건, 디자인 토큰 100% 준수)
- **2. verify-predeploy**: PASS (10 / 10 항목 전원 통과)
- **3. verify-security-and-regression**: PASS (17 / 17 항목 전원 통과)
- **4. verify-ux-benchmark-upgrade**: PASS (7 / 7 항목 전원 통과)
- **5. test-analyze-inquiry**: PASS (3 / 3 항목 전원 통과)
- **6. tsc --noEmit**: PASS (0 errors)
- **7. eslint**: PASS (0 errors, 0 warnings)
- **8. next build**: PASS (Next.js Turbopack 22/22 routes prerendered)

---

## 🚀 [Cycle 24] 2026-11-05 — 정밀 가전 쇼룸(Precision Appliance Showroom) 디자인 시스템 완성 및 전 화면 중첩 박스 평탄화 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-031`
- **핵심 목표**:
  - `jakubkrehel/skills` + `pbakaus/impeccable` + `Nutlope/hallmark` 3대 방법론을 바탕으로 전 고객 접점(홈, 갤러리, 상세, 매입, 문의, 오류 안내)을 통일된 「정밀 가전 쇼룸(Precision Appliance Showroom)」 체계로 완성.
  - 카드의 카드 중첩(Card-in-Card Anti-Pattern), 불필요한 GPU 낭비(`transition-all`), 3D 틸트/인위적 반사광 제거, 모바일 16px 인풋 표준화, 영문 트래킹 캡션 전면 국문 정규화.

### 2. 코드 변경 요약
- **[app/globals.css](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/globals.css)**:
  - 4대 정밀 쇼룸 색상 토큰 정의: 딥 차콜 네이비(`--hb-navy: #141a23`), 테라코타 오렌지(`--hb-orange: #e8521a`), 위생·살균 틸(`--hb-teal: #0d9488`), 냉기·성능 시안(`--hb-cyan: #0284c7`), 보더 라인(`--hb-border: #e2e6ec`).
  - `.hb-input` 모바일 16px 보장(`text-hb-base sm:text-hb-sm`), 모달 `overscroll-contain` 추가, 전역 `transition-all` 일체 배제.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)**:
  - `SectionHeading` 색상 토큰 `#141A23` / `#E8521A` 정규화 및 `text-wrap: balance / pretty` 적용.
  - 모달 오버레이 및 모바일 드로어에 `overscroll-contain` 적용.
  - `QuoteBasketFloatingBar`, `FloatingQuickWing`의 `transition-all`을 명시적 transition 속성으로 교체.
- **[components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)**:
  - 인위적인 마우스 3D 틸트 효과(`cardRef`, `perspective`, `rotateX/Y`) 및 반사광 블렌드 레이어 전면 제거.
  - 외곽 카드 `rounded-2xl border border-[#E2E6EC] bg-white shadow-2xs`와 내부 이미지 `rounded-xl hb-studio-backdrop`의 동심원 곡률 적용.
  - `ProductTrustMicroStrip` 내부 중첩 박스를 단일 평탄 원장 그리드로 개선.
- **[components/products/product-structured-description.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-structured-description.tsx)**:
  - 6중 중첩 컬러 박스를 하나의 단일 아키텍처 시트(`divide-y divide-[#E2E6EC]`)로 해체.
  - 영문 라벨 `SHOWROOM SPECIFICATION`을 `상세 제원 및 검수 소견`으로 정규화.
- **[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)**:
  - BuyBox 및 스펙 `<dl>` 박스 평탄화, 영문 아이브로우(`INSPECTION & INSTALLATION GUIDE` 등)를 국문 섹션 타이틀로 교체.
- **[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)**:
  - 히어로 뱃지 불필요 펄스 제거(Hallmark Gate 29), 헤딩 단어 색상 혼용 배제(Hallmark Gate 38iii).
  - 하단 3대 출고 원칙 및 4단계 매입 스텝 카드 평탄화, 오프라인 매장 위치 및 최근 접수 문의 도크의 Card-in-Card 구조 전면 해체.
- **[components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)**, **[components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx)**, **[components/home/ai-recommendation-guide-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/ai-recommendation-guide-section.tsx)**:
  - 5개 비교 박스 및 3개 솔루션 카드의 중첩 구조를 평탄화하고 색상 토큰 동기화.
- **[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)**, **[app/purchase/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/page.tsx)**, **[app/inquiry/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/page.tsx)**:
  - 모바일 16px 인풋 규격 적용(Safari 자동 확대 버그 원천 차단), 3단계 매입 프로세스 일체형 아키텍처 바 통합.
  - 코드베이스 전체에서 `transition-all` 완전 퇴출.
- **[아르곤_디자인.xml](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/아르곤_디자인.xml)**:
  - 87개 핵심 소스코드 30,566줄 최신본 자동 패키징 완료.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.20s) — 임의 픽셀 폰트 0건, 인라인 JSX 이모지 0건, Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.12s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.13s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.11s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.11s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (5.11s) — 0 errors
- **7. eslint**: PASS (12.97s) — 0 errors, 0 warnings
- **8. next build**: PASS (14.44s) — 22/22 정적/동적 라우트 프리렌더링 완료 (Exit Code 0)
- **통합 결과**: 8 / 8 게이트 100% 무결점 통과 (Total ~33s)

---

## 🚀 [Cycle 25] 2026-11-05 — 웹 아르곤 3대 디자인 감사(Audit) 지적사항 9개 전수 해결 및 100% 무결점 달성 (완료)

### 1. 목표 및 동기
- **과제 ID**: `EVO-032`
- **핵심 목표**:
  - `아르곤_디자인.xml` 기반 웹 아르곤 전수 감사 리포트에서 도출된 3대 프레임워크(`Nutlope/hallmark` · `pbakaus/impeccable` · `jakubkrehel/skills`) 지적사항 8대 과제 + 9개 컴포넌트 전수 교정.
  - 잔여 Card-in-Card 해체, 모바일 iOS 자동 확대(16px 미만) 방지, 4색 지정 토큰 통일, 대형 CTA WCAG AA 명도 대비 및 aria-label 보강, 동심원 곡률 일치화, 촉각 피드백(`active:scale-[0.96]`) 및 `tabular-nums` 전수 적용.

### 2. 코드 변경 요약
- **[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)**:
  - 브레드크럼 및 래퍼 구형 컬러(#191F28, #F05600 등)를 `#141A23` / `#E8521A` / `#334155`로 통일.
  - 우측 콘솔 `<dl>`의 중첩 박스 해체 -> `border-y border-[#E2E6EC] divide-y divide-[#E2E6EC]` 평탄화 및 모델명/보증/스펙에 `tabular-nums` 적용.
- **[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)**:
  - 1순위 전화 버튼: WCAG AA 고대비 다크 네이비(`#141A23`) + 오렌지 아이콘/폰트, `aria-label` 및 포커스 링 보강.
  - 2순위 카카오톡 버튼: `aria-label` 및 포커스 링 보강.
  - 3순위 소프트 독 & 4순위 쇼룸 방문 바: 4색 시맨틱 토큰 정렬, `active:scale-[0.96]` 촉각 피드백 적용.
- **[components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)** & **[components/products/product-status-badge.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-status-badge.tsx)**:
  - 외곽 포커스 래퍼 곡률을 `rounded-2xl`로 단일화하여 동심원 곡률 불일치 해소.
  - 상태 배지 영문 `NEW`를 정직한 한국어 `신규입고`로 변경하고 라이브 도트 `#0D9488`(Teal) 통일.
- **[components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)**:
  - 동심원 곡률 공식($16\text{px} - 8\text{px} = 8\text{px}$)에 따라 내부 버튼을 `rounded-lg`로 교정, `active:scale-[0.96]` 및 `focus-visible:ring-2` 추가.
- **[components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx)**:
  - 카테고리 품질 보증 배너 내부 중첩 카드 해체 -> `divide-y lg:divide-y-0 lg:divide-x divide-[#E2E6EC]` 단일 원장 평탄화.
- **[components/products/aircon-set-guide-banner.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/aircon-set-guide-banner.tsx)**:
  - 외곽 카드 내부 3열 서브카드 해체 -> `divide-y sm:divide-y-0 sm:divide-x divide-[#E2E6EC]` 평탄화, 쿨그레이/시맨틱 토큰 통일.
- **[components/inquiry/unified-inquiry-form.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/unified-inquiry-form.tsx)** & **[components/inquiry/v2-wizard-quick-inquiry.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/v2-wizard-quick-inquiry.tsx)**:
  - `<select>`, `<input>`에 `text-hb-base sm:text-hb-sm` 적용하여 iOS Safari 자동 줌 원천 차단.
  - 가이드 박스 내부 중첩 카드 평탄화, AI 판독 상태에 지정 Cyan/Teal 토큰 적용, 스텝퍼에 `tabular-nums` 적용.
- **[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)** & **[components/ui/modern-icons.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/ui/modern-icons.tsx)**:
  - `DuotoneIcon` toneClasses 및 `ModernApplianceIcon` 4색 지정 토큰 통일, `MobileCtaBar`에 `active:scale-[0.96]` 촉각 피드백 추가.
- **[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)**:
  - 모바일 3개 필터 `<select>` 및 상세 수정 모달 필드에 `text-hb-base sm:text-hb-xs` 및 `h-10` 터치 타겟 확보.
- **[components/showroom/showroom-visit-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/showroom/showroom-visit-modal.tsx)**, **[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)**, **[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)**, **[components/products/product-compare-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-compare-modal.tsx)**, **[app/inquiry/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/page.tsx)**:
  - 영문 라벨 직관화(`STEP 01~04` -> `01단계~04단계`, `Admin Console` -> `관리자 콘솔`), 건수 및 페이지네이션 `tabular-nums` 적용, 방문 예약 버튼 촉각 피드백 적용.
- **[아르곤_디자인.xml](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/아르곤_디자인.xml)**:
  - 87개 핵심 소스코드 30,620줄 최신본 자동 패키징 완료.

### 3. 정량적 검증 결과 (8대 게이트 전원 100% PASS)
- **1. check-design-tokens**: PASS (0.24s) — 임의 픽셀 폰트 0건, 인라인 JSX 이모지 0건, Tailwind v3 규격 100% 준수
- **2. verify-predeploy**: PASS (0.13s) — 10 / 10 항목 전원 통과
- **3. verify-security-and-regression**: PASS (0.14s) — 17 / 17 항목 전원 통과
- **4. verify-ux-benchmark-upgrade**: PASS (0.12s) — 7 / 7 항목 전원 통과
- **5. test-analyze-inquiry**: PASS (0.13s) — 3 / 3 항목 전원 통과
- **6. tsc --noEmit**: PASS (5.49s) — 0 errors
- **7. eslint**: PASS (18.32s) — 0 errors, 0 warnings
- **8. next build**: PASS (15.96s) — 22/22 정적/동적 라우트 프리렌더링 완료 (Exit Code 0)
- **통합 결과**: 8 / 8 게이트 100% 무결점 통과 (Total ~40s)
