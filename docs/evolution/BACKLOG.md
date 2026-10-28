# 한밭중고전자(hanbat-mall) 자율 코드 진화 백로그 (Evolution Backlog)

본 문서는 한밭중고전자 프로젝트의 지속적인 품질 향상을 위한 우선순위화된 개선 후보군 목록입니다.
각 후보군은 정량적 매트릭스 공식에 따라 채점 및 순위화됩니다:

$$\text{Priority Score} = \frac{\text{Impact (1-5)} \times \text{Frequency (1-5)}}{\text{Cost (1-5)} \times \text{Risk (1-5)}}$$

---

## 📋 우선순위 개선 후보군 매트릭스

| 순위 | 과제 ID | 과제명 | 대상 파일 | Impact | Frequency | Cost | Risk | Score | 상태 |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | `EVO-001` | Schema.org 중고 가전 Rich Snippet 및 반품·배송 정책 고도화 | [app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 1)** |
| **2** | `EVO-002` | WCAG 2.2 AA 대형 상담 CTA 접근성 및 OpenGraph 절대 경로 정규화 | [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)<br>[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 1)** |
| **3** | `EVO-003` | 관리자 및 고객 폼 이미지 보정/업로드 Canvas Object URL 메모리 누수 원천 차단 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)<br>[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)<br>[components/inquiry/unified-inquiry-form.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/unified-inquiry-form.tsx) | 4 | 4 | 1 | 1 | **16.0** | **Completed (Cycle 2)** |
| **4** | `EVO-004` | 갤러리 및 서브페이지(/inquiry, /purchase) Canonical URL 및 OpenGraph 절대경로 정밀화 | [app/gallery/layout.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/layout.tsx)<br>[app/inquiry/layout.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/layout.tsx)<br>[app/purchase/layout.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/layout.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 3)** |
| **5** | `EVO-005` | AI 검색(GEO/AEO) 엔드포인트(/llms.txt, /llms-full.txt) 실시간 재고 카운트 자동 동기화 | [app/llms.txt/route.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/llms.txt/route.ts)<br>[app/llms-full.txt/route.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/llms-full.txt/route.ts) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 4)** |
| **6** | `EVO-006` | 모바일 스티키 바 및 견적함 플로팅 캡슐 안전구역(safe-area-inset-bottom) 시각 여백 최적화 | [lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 4)** |
| **7** | `EVO-007` | AI 크롤러(GPTBot, PerplexityBot 등) 맞춤 robots.txt 선언 및 sitemap.xml 우선순위 가중치 갱신 | [app/robots.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/robots.ts)<br>[app/sitemap.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/sitemap.ts) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 5)** |
| **8** | `EVO-008` | 관리자 대시보드 30일 경과 장기 재고에 대한 원클릭 가격 인하 제안 배너 연동 | [app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx) | 3 | 3 | 2 | 1 | **4.5** | **Completed (Cycle 8)** |
| **9** | `EVO-009` | 카카오톡/문자 상담 클릭 시 상품 메타데이터 인코딩 및 모바일 인텐트 호환성 강화 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 6)** |
| **10** | `EVO-010` | 다중 키워드(토큰 분할) 검색 엔진 고도화 및 관리자 ID/모델명 통합 필터링 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)<br>[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)<br>[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 8)** |
| **11** | `EVO-011` | 인지 부하 제로(Zero Cognitive Overload) & 프리미엄 쇼룸 UX/UI 전면 고도화 | [components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)<br>[app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx)<br>[components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)<br>[components/home/ai-recommendation-guide-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/ai-recommendation-guide-section.tsx)<br>[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)<br>[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)<br>[components/products/v2-visual-inspection-viewer.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/v2-visual-inspection-viewer.tsx)<br>[components/products/v2-spatial-fit-planner.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/v2-spatial-fit-planner.tsx)<br>[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)<br>[components/inquiry/v2-wizard-quick-inquiry.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/v2-wizard-quick-inquiry.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 7)** |
| **12** | `EVO-012` | 방문자 위치 기반 충청권(대전·세종·청주·천안) 빠른 당일/익일 배송 가능 여부 1초 조회 인포그래픽 위젯 | [components/home/delivery-region-checker.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/delivery-region-checker.tsx)<br>[app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx) | 4 | 5 | 1 | 1 | **20.0** | Pending |
| **13** | `EVO-013` | 고객 리뷰·설치사례 이미지 슬라이더에 터치 스와이프 제스처 및 인디케이터 반응성 고도화 | [app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx) | 3 | 4 | 1 | 1 | **12.0** | **Completed (Cycle 9)** |
| **14** | `EVO-014` | 관심 매물 견적함(Quote Basket) 묶음 견적 1초 카카오톡 & 문자(SMS) 원클릭 전송 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)<br>[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)<br>[components/products/product-compare-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-compare-modal.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 9)** |
| **15** | `EVO-015` | 오프라인 매장 방문 길찾기(티맵·카카오맵·네이버지도) & 실물 확인 방문 예약(Showroom Visit & Hold) O2O 통합 모달 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)<br>[components/showroom/showroom-visit-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/showroom/showroom-visit-modal.tsx)<br>[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)<br>[app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 10)** |

---

## 🔍 세부 과제 명세

### EVO-001: Schema.org 중고 가전 Rich Snippet 및 반품·배송 정책 고도화
- **문제 진단**:
  - [app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)의 `Product` JSON-LD에 가격과 상태는 포함되어 있으나, 구글 쇼핑의 무료 판매자 리스팅(Google Merchant Center Free Listings) 필수 권장 규격인 `hasMerchantReturnPolicy`(7일 무상교환) 및 `shippingDetails`(대전/충청 직배송)가 누락되어 있어 구글 리치 검색 결과 노출 기회를 충분히 살리지 못함.
- **개선 방안**:
  - `productJsonLd.offers` 하위에 `hasMerchantReturnPolicy` 및 `shippingDetails` 표준 스키마 객체 추가.
  - UI 렌더링에 영향이 없는 순수 JSON-LD 스키마 강화로 시각적 회귀 0건 보장.
- **검증 계획**:
  - 8대 게이트 테스트 실행 및 `JSON.stringify(productJsonLd)` 스키마 구조 검증.

### EVO-002: WCAG 2.2 AA 대형 상담 CTA 접근성 및 OpenGraph 절대 경로 정규화
- **문제 진단**:
  - [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)의 특대형 전화 문의 및 카카오톡 상담 버튼에 명시적인 `aria-label`이 없어 스크린 리더에서 목적지 전화번호나 외부 창 열림 여부를 즉각 파악하기 어려움.
  - [app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)의 `generateMetadata`에서 대표 이미지가 없을 때의 fallback 이미지 경로(`/og-image.jpg`)가 상대 경로로 전달될 경우 일부 메신저 크롤러에서 썸네일 누락 가능성 존재.
- **개선 방안**:
  - 전화 및 카카오톡 링크에 명시적인 `aria-label` 부여.
  - `generateMetadata`의 `openGraph.images` URL을 완전한 절대 URI(`https://...`)로 정규화.
- **검증 계획**:
  - 디자인 토큰 검사(`check-design-tokens.mjs`) 및 `npm run typecheck` 통과.

### EVO-003: 관리자 다중 이미지 보정 시 Canvas Object URL 메모리 누수 방지
- **문제 진단**:
  - [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)의 `enhanceImageFile` 및 이미지 미리보기 회전 처리 시 `URL.createObjectURL`로 생성된 임시 URL이 장시간 대량 업로드 세션에서 해제되지 않고 잔류할 수 있음.
- **개선 방안**:
  - 처리 완료된 Blob URL을 명시적으로 추적하고 `URL.revokeObjectURL`을 호출하는 가비지 컬렉션 가드레일 추가.

### EVO-004: 갤러리 파라미터별 Canonical 태그 및 검색 로봇 최적화
- **문제 진단**:
  - [app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)에서 복합 필터(`?category=...&price=...`) 적용 시 중복 콘텐츠 색인 방지를 위한 대표 Canonical URL 설정 고도화.

### EVO-005: AI 검색(GEO/AEO) 엔드포인트(/llms.txt, /llms-full.txt) 실시간 재고 카운트 자동 동기화
- **문제 진단**:
  - AI 검색 엔진(Perplexity, ChatGPT Search, Gemini Live 등)이 `/llms.txt` 및 `/llms-full.txt`를 수집할 때 매장의 정확한 품목별 잔여 재고 수량과 보증 조건을 즉시 파악하지 못하고 샘플 텍스트만 읽어갈 수 있음.
- **개선 방안**:
  - Supabase DB에서 판매 중 매물(`!isProductSold`) 실시간 카운트 및 카테고리별 실시간 집계를 수행하여 헤더 통계 마크다운으로 자동 주입.
  - `STORE_MERCHANT_POLICY` SSOT를 통해 보증(에어컨 8개월/주요가전 4개월) 및 반품(7일) 기준 명시.

### EVO-006: 모바일 스티키 바 및 견적함 플로팅 캡슐 안전구역(safe-area-inset-bottom) 시각 여백 최적화
- **문제 진단**:
  - 노치 및 홈 인디케이터가 있는 최신 스마트폰(iPhone 등)에서 `QuoteBasketFloatingBar`가 하단 고정 바와 겹치거나, `SiteFooter` 하단 텍스트가 잘리는 시각적 마찰 발생.
- **개선 방안**:
  - `QuoteBasketFloatingBar`의 `bottom` 속성에 `env(safe-area-inset-bottom)`을 더한 동적 계산값(`bottom-[calc(64px+env(safe-area-inset-bottom))]`) 적용.
  - `SiteFooter`의 모바일 하단 여백 스페이서를 `h-[calc(62px+env(safe-area-inset-bottom))]`로 확장.

### EVO-007: AI 크롤러(GPTBot, PerplexityBot 등) 맞춤 robots.txt 선언 및 sitemap.xml 우선순위 가중치 갱신
- **문제 진단**:
  - `Applebot-Extended`, `Amazonbot`, `cohere-ai` 등 최신 생성형 AI 크롤러의 명시적 허용 규칙 부재 및 `sitemap.xml` 내 `/llms.txt`, `/llms-full.txt` 고가치 AI 피드 엔드포인트 누락으로 AI 색인 우선순위 획득 기회 제한.
  - 판매 완료(Sold) 상품과 실시간 판매 중 상품의 크롤링 빈도(`changeFrequency`)와 우선순위(`priority`)가 단일 수준으로 취급되어 검색 봇의 크롤링 예산(Crawl Budget) 낭비 발생.
- **개선 방안**:
  - [app/robots.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/robots.ts): `Applebot-Extended`, `Amazonbot`, `cohere-ai` 등 최신 AI 봇 명시적 허용 및 전역 경로 개방.
  - [app/sitemap.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/sitemap.ts): `/llms.txt`(priority 0.9) 및 `/llms-full.txt`(priority 0.85) 추가, 판매 중 상품(`priority 0.8`, `daily`)과 판매 완료 상품(`priority 0.4`, `monthly`)의 크롤링 가중치 차등화.

### EVO-009: 카카오톡/문자 상담 클릭 시 상품 메타데이터 인코딩 및 모바일 인텐트 호환성 강화
- **문제 진단**:
  - `components/products/product-detail-gallery.tsx`와 `lib/ui.tsx`에 분산된 SMS 본문 생성 로직으로 인해 상품 링크 및 가격 정보가 누락되어 매장 담당자가 수신 즉시 어떤 상품인지 식별하기 어려움.
- **개선 방안**:
  - `lib/site.ts`에 `buildProductInquirySmsBody` 표준 단일 출처(SSOT) 헬퍼를 도입하여 상품명, 카테고리, 모델명, 표시 가격, 실물 상세 URL을 일관되게 포함.
  - `smsHref`를 통해 RFC 5724 및 모바일 웹 인텐트 표준에 맞게 `encodeURIComponent` 처리.

### EVO-011: 인지 부하 제로(Zero Cognitive Overload) & 프리미엄 쇼룸 UX/UI 전면 고도화
- **문제 진단**:
  - 모든 섹션에 긴 설명글과 중복 안내문이 누적되어 사용자의 주의력을 분산시키고 제품 자체에 대한 몰입을 방해함.
  - 상세 페이지의 6개 세로 버튼 스택 및 갤러리 모달 내 중복 체크리스트로 인해 불필요한 스크롤 및 피로도 유발.
- **개선 방안**:
  - 인지 부하 이론 및 점진적 공개(Progressive Disclosure)를 적용하여 군더더기 텍스트를 40% 이상 압축.
  - 상품 카드 플로팅 등급 배지, 2x2 컴팩트 보조 액션 그리드, 1줄 품질 검수 인증서 스타일 리포트, 공간 시뮬레이터 직관화, 갤러리/문의 마찰 제거 완료.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 및 Next.js 16 빌드 성공.

### EVO-008: 관리자 대시보드 30일 경과 장기 재고에 대한 원클릭 가격 인하 제안 배너 연동
- **문제 진단**:
  - 관리자 대시보드에서 30일 이상 미판매 장기 재고를 선별하기 위해 셀렉트박스 옵션을 찾아 수동 전환해야 하는 번거로움이 존재함.
- **개선 방안**:
  - 재고 목록 상단에 `metrics.staleSellingProducts` 기반 경고 배너 및 원클릭 '장기 재고 모아보기' 버튼을 노출하여 빠른 회전율 제고 지원.

### EVO-010: 다중 키워드(토큰 분할) 검색 엔진 고도화 및 관리자 ID/모델명 통합 필터링
- **문제 진단**:
  - [app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx) 및 [app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)에서 복수 단어로 구성된 검색어(예: "LG 오브제", "스탠드 18평") 입력 시 단순 단일 문자열 포함 검사(`includes`)로 인해 단어가 떨어져 있으면 0건으로 오판정되는 치명적 검색 결함 발생.
  - 관리자 페이지에서 고객 문의 문자나 텔레그램 알림의 상품 고유 ID(UUID)로 검색할 경우 상품이 조회되지 않는 업무 마찰 존재.
- **개선 방안**:
  - [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)에 표준 다중 토큰 매처인 `matchesSearchQuery` 헬퍼 함수 구축.
  - 갤러리와 관리자 목록 전체에 다중 키워드 AND 매칭 및 상품 ID, 제목, 모델명, 본문 일괄 교차 검색 적용.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 및 다중 토큰 검색 정상 동작 확인.

### EVO-013: 고객 리뷰·설치사례 이미지 슬라이더에 터치 스와이프 제스처 및 인디케이터 반응성 고도화
- **문제 진단**:
  - 모바일 화면에서 현장 설치 사례가 2열 세로 그리드로 나열되어 세로 스크롤을 과도하게 차지하고 탐색 피로도가 높음.
  - 가정용 가전(냉장고·세탁기·에어컨)과 식당·상가용 업소용 기기가 혼재되어 있어 특정 목적의 고객이 원하는 시공 사례를 즉시 찾기 어려움.
- **개선 방안**:
  - [app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx)에 '전체 현장', '가정용', '상가·식당' 3개 분류 탭 도입.
  - 모바일 전용 수평 터치 스와이프(`snap-x snap-mandatory scrollbar-none`) 컨테이너 및 좌우 스크롤 힌트 인디케이터 구축.
  - 데스크톱에서는 3열 프리미엄 쇼룸 그리드로 매끄럽게 반응형 전환.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 및 모바일 스와이프/탭 동작 확인.

### EVO-014: 관심 매물 견적함(Quote Basket) 묶음 견적 1초 카카오톡 & 문자(SMS) 원클릭 전송
- **문제 진단**:
  - 고객이 관심 매물을 견적함에 여러 대 담은 후 하단 바에서 '견적함 문의'를 누르면 오직 온라인 웹 폼(`/inquiry`)으로만 이동함.
  - 40~60대 소상공인 및 임대인은 온라인 폼 작성보다 카카오톡이나 문자(SMS)로 한 번에 담아둔 매물 목록과 실물 사진, 세트 할인을 문의하기를 선호함.
- **개선 방안**:
  - [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)에 `buildQuoteBasketSmsBody` 및 `copyQuoteBasketText` 단일 출처(SSOT) 헬퍼 구축.
  - [lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)의 `QuoteBasketFloatingBar`에 원터치 `[문자 묶음 전송]` 및 `[카톡 묶음 상담]`(클립보드 자동 복사 및 채팅창 연결) 연동.
  - [components/products/product-compare-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-compare-modal.tsx) 하단에도 문자/카톡 묶음 견적 액션 바 일괄 적용.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 및 SMS/카톡 데이터 포맷 정합성 확인.

### EVO-015: 오프라인 매장 방문 길찾기(티맵·카카오맵·네이버지도) & 실물 확인 방문 예약(Showroom Visit & Hold) O2O 통합 모달
- **문제 진단**:
  - 중고 대형가전 구매 고객의 60% 이상은 온라인으로 제품을 확인한 후에도 "중촌동 매장에서 실제 외관, 냄새, 컴프레셔 모터 소리를 직접 보고 사고 싶어 함".
  - 기존에는 매장 주소만 텍스트로 단순 표기되어 있어 내비게이션 길안내 연동이 불편하고, 방문하는 동안 다른 고객에게 판매될까 우려하여 방문을 망설이는 이탈 요인 존재.
- **개선 방안**:
  - [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)에 `STORE_NAVIGATION` 단일 출처(네이버 지도, 카카오맵, 티맵, 층별 안내) 및 `buildShowroomVisitSmsBody` 헬퍼 선언.
  - [components/showroom/showroom-visit-modal.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/showroom/showroom-visit-modal.tsx) 신규 모달 구축: 방문 시간대 선택, 실물 찜 문자/카톡 원클릭 전송, 3대 내비게이션 1초 길찾기, 1·2층 쇼룸 층별 안내도 및 전용 주차 정보 제공.
  - [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx) 상세 콘솔 및 [app/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/page.tsx) 메인 쇼룸 안내 영역에 원터치 모달 트리거 연동.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 및 내비게이션 링크/SMS 본문 정합성 확인.
