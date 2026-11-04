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
| **16** | `EVO-016` | 상품 사진 업로드 시 쇼룸 스튜디오 톤업(밝기 +20%) 기본 자동 적용 및 2차 원터치 톤업 프리셋 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)<br>[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 11)** |
| **17** | `EVO-017` | 플래그십 쇼룸 히어로 현대화(Option A) 및 원터치 옴니 쇼룸 카탈로그 일체화(Option B) | [components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)<br>[components/home/category-pictogram-bar.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/category-pictogram-bar.tsx)<br>[components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 12)** |
| **18** | `EVO-018` | 상품 카드 2.5D 마이크로 뎁스 틸트 및 스튜디오 메탈릭 스펙큘러 라이팅(순수 시각 효과) | [components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 13)** |
| **19** | `EVO-019` | 토스(TDS)·애플(HIG)·당근(SEED) 하이브리드 디자인 시스템 및 고객 전 화면 UI/UX 전면 개편 | [app/globals.css](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/globals.css)<br>[tailwind.config.js](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/tailwind.config.js)<br>[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)<br>[components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)<br>[components/products/product-structured-description.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-structured-description.tsx)<br>[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)<br>[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)<br>[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 14)** |
| **20** | `EVO-020` | 대기업(애플·토스·카카오·당근) 벤치마크 5대 주안점 심화 폴리싱 (De-boxing 2단계·0.5초 스캔 위계·한글 마이크로카피·BuyBox 독 통합) | [components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)<br>[components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)<br>[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx)<br>[components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)<br>[components/home/ai-recommendation-guide-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/ai-recommendation-guide-section.tsx)<br>[components/home/featured-products-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/featured-products-section.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 15)** |
| **21** | `EVO-021` | 2차 웹 디자인 폴리싱 (매장 위치 섹션 2열 도크화, 모바일 견적함/푸터 슬림화, 갤러리 헤더 컴팩트화) | [components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)<br>[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)<br>[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 16)** |
| **22** | `EVO-022` | 3차 웹 디자인 폴리싱 (타임라인 단계 워터마크 비주얼, 토스 스타일 클린 입력 인풋, macOS 플로팅 아일랜드 윙 독) | [components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)<br>[components/inquiry/unified-inquiry-form.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/inquiry/unified-inquiry-form.tsx)<br>[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 17)** |
| **23** | `EVO-023` | 서브 페이지(가전 매입 / 문의 게시판) 디자인 토큰 100% 쿨그레이 통일 | [app/purchase/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/page.tsx)<br>[app/inquiry/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/page.tsx) | 4 | 4 | 1 | 1 | **16.0** | **Completed (Cycle 18)** |
| **24** | `EVO-024` | 추천 프로모션 & 기획전 큐레이션 및 AI 3D 스튜디오 배너 구축 | [components/home/promotion-showcase-section.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/promotion-showcase-section.tsx) | 3 | 3 | 2 | 1 | **4.5** | **Completed (Cycle 19)** |
| **25** | `EVO-025` | 웹그래픽 자산 최적화(~15MB 래스터 정리), LCP 고속 로딩, 모바일 스냅 스크롤 & 서브페이지 색상 톤 전면 통일 | [components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)<br>[app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx)<br>[app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx)<br>[lib/ui.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/ui.tsx)<br>[public/](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/public/) | 5 | 5 | 1 | 1 | **25.0** | **Completed (Cycle 20)** |
| **26** | `EVO-026` | 추천 프로모션 & 기획전 섹션 영구 삭제 및 순수 쇼룸 집중화 | [components/home/home-page-client.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/home/home-page-client.tsx)<br>[lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts) | 4 | 4 | 1 | 1 | **16.0** | **Completed (Cycle 21)** |

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

### EVO-016: 상품 사진 업로드 시 쇼룸 스튜디오 톤업(밝기 +20%) 기본 자동 적용 및 2차 원터치 톤업 프리셋
- **문제 진단**:
  - 기존에는 관리자가 [사진 업로드] 후 썸네일의 스파클(톤업) 버튼을 직접 눌러야만 밝기가 보정되었고, AI 분석이 반환한 광도 보정값에만 의존하여 업로드 결과의 밝기가 매번 달라짐.
  - 매장 실내 조명에서 촬영한 중고 가전 사진은 색온도가 누렇게 치우치고 어둡게 나와, 상품 상세·갤러리의 쇼룸 프리미엄 톤이 균일하지 않았음.
- **개선 방안**:
  - [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)에 `PRODUCT_IMAGE_TONE_PRESET`(밝기 1.20 · 대비 1.09 · 채도 1.06) 및 `PRODUCT_IMAGE_TONE_EXTRA`(2차 톤업) 표준 프리셋(SSOT) 선언.
  - [app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx): 사진 선택 즉시 `enhanceImageFile`로 스튜디오 톤업을 **자동 적용**(톤업 버튼 불필요)하고, 자동 적용 안내 문구 및 토스트 노출.
  - AI 분석 단계는 톤업이 이미 적용된 상태를 감안하여 중복 밝기 보정 없이 **방향(회전) 교정만** 수행하도록 정리(과보정 원천 차단).
  - 썸네일 스파클 버튼은 "한 단계 더 밝게(+12%)" 2차 보정으로 역할 재정의.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 및 업로드 자동 톤업 동작 확인.

### EVO-017: 플래그십 쇼룸 히어로 현대화 및 원터치 옴니 쇼룸 카탈로그 일체화
- **문제 진단**:
  - 첫 방문 고객 관점에서 메인 히어로 영역의 정보 밀도가 과밀하여 시선 분산 발생.
  - 카테고리 픽토그램 선택과 하단 실매물 전시 그리드 간의 유기적 품질 보증 연동이 부재하여 카테고리 전환 시 제품별 검수 신뢰 기준 파악이 어려움.
- **개선 방안**:
  - [Option A] `components/home/home-page-client.tsx`: 히어로 상단 라이브 인디케이터 모바일 지원 확대, 2-Track 핵심 CTA(실매물 확인하기 vs 쓰던 가전 팔기) 시각 위계 정돈, 하단 3대 쇼룸 출고 원칙 아키텍처 박스 적용.
  - [Option B] `components/home/category-pictogram-bar.tsx` 및 `components/home/featured-products-section.tsx`: 카테고리 선택부와 실매물 그리드 간의 간격과 톤을 매끄럽게 결합하고, 선택된 카테고리별 전문 품질 보증 기준(에어컨 8개월/주요가전 4개월, 분해세척, 상업용 설비 등) 안내 배너 동적 연동.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 확인.

### EVO-018: 상품 카드 2.5D 마이크로 뎁스 틸트 및 스튜디오 메탈릭 스펙큘러 라이팅(순수 시각 효과)
- **문제 진단**:
  - 실측하지 않은 계측치나 수치 다이얼(엔지니어링 게이지)은 사용자 및 매장 현실과 부합하지 않아 철회됨.
  - 가전제품 실매물 카드가 2차원 평면으로 단순 나열되어 있어, 오프라인 쇼룸 쇼윈도에서 실물을 바라보는 듯한 입체감과 쇼룸 스튜디오 조명 느낌을 시각적으로 구현할 필요성 제기.
- **개선 방안**:
  - [components/products/product-card.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-card.tsx)에 무(無) React 리렌더링 방식의 CSS 변수(`--mouse-x`, `--mouse-y`, `--rx`, `--ry`) 직접 주입 아키텍처 적용.
  - 마우스 호버 및 무브 시 최대 ±3.5도의 미세 2.5D 퍼스펙티브 틸트(`perspective(1000px) rotateX/Y translateZ(3px)`) 구현.
  - 커서 위치를 추적하는 은은한 방사형 스튜디오 메탈릭 스펙큘러 반사광(`mix-blend-soft-light`) 오버레이 연동.
  - 내부 사진 액자에 `ring-white/20 group-hover:ring-white/40` 메탈릭 림 라이트 헤어라인 부여.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 확인.

### EVO-020: 대기업(애플·토스·카카오·당근) 벤치마크 5대 주안점 심화 폴리싱
- **문제 진단**:
  - 컬러와 곡률 개편 이후에도 화면 곳곳에 ① 박스 안에 중첩된 박스(3중 번호/아이콘, 중복된 3대 보증 섹션), ② 사진 위를 누르는 영문 헤더 바(`SHOWROOM LIVE VIEW`, `SHOWROOM STUDIO PHOTO`), ③ 상품 카드 내부 수평 구분선, ④ 영문 장식 아이브로우(`FIELD ARCHIVE`, `CUSTOMER GUIDE` 등), ⑤ 상세페이지 우측 7개 버튼 박스 난립이 남아 있었음.
- **개선 방안**:
  - **1. De-boxing 2단계 & 중복 제거**: 매입 스텝 카드의 3중 번호·아이콘 중복을 단일 토스 스텝 배지로 통합하고, 리뷰 섹션 하단의 중복 3열 보증 박스를 제거.
  - **2. 애플 스토어식 풀블리드 쇼케이스**: 히어로 우측 쇼케이스 및 상세 갤러리 상단 영문 바를 제거하고 반투명 글래스 플로팅 배지 + 소프트 벤토 트레이로 개편.
  - **3. 당근·카카오식 0.5초 스캔 상품 카드 위계**: 카드 내부 수평선을 제거하고 `제목 → 대형 가격 → 핵심 스펙 칩(최대 2개) + 담기 버튼`으로 위계 재편.
  - **4. 한글 중심 직관적 마이크로카피**: 전 섹션의 영문 장식 아이브로우를 직관적인 한글 캡슐 배지로 전면 교체.
  - **5. 상세 BuyBox 원카드 소프트 액션 독**: 상세페이지 우측의 다크 네이비 가격 박스를 클린 타이포그래피로 전환하고, 보조 버튼 5개를 단일 토스 소프트 독(`bg-[#F2F4F6] rounded-2xl p-1.5`)으로 통합.
- **검증 계획**:
  - 8대 통합 검증 러너(`run-all-verifications.mjs`) 100% 통과 확인.

### EVO-021: 2차 웹 디자인 폴리싱 (매장 위치 섹션 2열 도크화, 모바일 견적함/푸터 슬림화, 갤러리 헤더 컴팩트화)
- **문제 진단**:
  - 메인 [S8] 매장 안내 섹션의 텍스트와 박스가 분산되어 있어 모바일에서 가독성이 저하됨.
  - 모바일 견적함 플로팅 캡슐과 푸터의 마진이 커서 실제 상품 탐색 뷰포트를 방해함.
- **개선 방안**:
  - [S8] 매장 안내를 2열 도크(O2O 길찾기 카드 + 운영정보 카드)로 재편.
  - 견적함 바를 `h-8` 초슬림 원형 캡슐로 축소하고 푸터 폰트를 라이트하게 조정.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 확인.

### EVO-022: 3차 웹 디자인 폴리싱 (타임라인 단계 워터마크 비주얼, 토스 스타일 클린 입력 인풋, macOS 플로팅 아일랜드 윙 독)
- **문제 진단**:
  - 매입 절차 카드가 평면적이어서 프로세스 단계(01~04) 인지가 부족함.
  - 상담 폼의 인풋 디자인이 구형 각진 스타일로 머물러 있음.
- **개선 방안**:
  - `SELL_STEPS`에 대형 01~04 워터마크 타이포그래피 및 화살표 흐름 주입.
  - 상담 폼 입력창을 토스 표준 `rounded-xl h-12 border-[#E5E8EB]`로 전면 개편.
  - 우측 플로팅 윙을 macOS 아일랜드 글래스 독으로 리디자인.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 확인.

### EVO-023: 서브 페이지(가전 매입 / 문의 게시판) 디자인 토큰 100% 쿨그레이 통일
- **문제 진단**:
  - 메인 홈 개편 후 [app/purchase/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/purchase/page.tsx) 및 [app/inquiry/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/inquiry/page.tsx)에 남아있던 구형 올리브 보더/배경(`#DDD9D1`, `#EFECE6`, `#8A8478`).
- **개선 방안**:
  - 서브 페이지 전반의 보더와 텍스트를 Toss Cool-Gray(`#E5E8EB`, `#F2F4F6`, `#6B7684`)로 100% 일괄 교체.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 확인.

### EVO-024: 추천 프로모션 & 기획전 큐레이션 및 AI 3D 스튜디오 배너 구축
- **개선 방안**:
  - 쿠쿠몰 스타일의 큐레이션 허브(`components/home/promotion-showcase-section.tsx`) 및 AI 3D 스튜디오 배너 생성 프로토타입 구현 및 검증.

### EVO-025: 웹그래픽 자산 최적화(~15MB 래스터 정리), LCP 고속 로딩, 모바일 스냅 스크롤 & 서브페이지 색상 톤 전면 통일
- **문제 진단**:
  - `public/illustrations/` 및 `cat-*.png` 등 미사용 래스터 파일(약 15MB)이 번들 용량을 불필요하게 낭비.
  - 첫 화면 LCP 이미지 지연 로딩으로 인한 초기 렌더링 속도 지연.
  - 모바일 환경에서의 가로 스크롤 우측 잘림 및 퀵 윙 랩탑 미노출.
- **개선 방안**:
  - 미사용 래스터 이미지 19종(약 15MB) 전량 삭제 및 `category-pictogram-bar.tsx` 미사용 필드 정리.
  - 첫 화면 상단 매물 카드에 `eager={idx < 2}` 및 `fetchPriority="high"` 적용.
  - 갤러리 카테고리 탭 우측에 모바일 전용 화이트 페이드 그라디언트 마스크 추가.
  - `FloatingQuickWing` 노출 구간을 `1280px+(xl:)`로 확장하여 일반 노트북 해상도 지원.
  - `app/gallery/page.tsx`, `components/inquiry/unified-inquiry-form.tsx`, `app/admin/page.tsx` 잔여 구형 컬러를 표준 쿨그레이로 일괄 교체.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 확인.

### EVO-026: 추천 프로모션 & 기획전 섹션 영구 삭제 및 순수 쇼룸 집중화
- **문제 진단**:
  - 복잡한 배너 기획전보다 한밭중고전자 고유의 실매물 쇼룸(냉장고, 세탁기, 에어컨 실매물 카탈로그 및 직영 매장 투명 보증 정책)에 집중하고 페이지 간결성을 극대화하기 위해 프로모션 섹션을 완전히 덜어내기로 결정.
- **개선 방안**:
  - `<PromotionShowcaseSection />` 마운트 및 컴포넌트, 이미지 파일 전량 영구 삭제.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 및 원격 배포 완료.

### EVO-027: 전체 프로덕션 문서 체계 최신화 (README.md 전면 개편)
- **개선 방안**:
  - `README.md`를 초기 템플릿에서 프로덕션 수준의 기술 스택, 8대 게이트 아키텍처, 디렉터리 맵으로 전면 개편.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 및 원격 배포 완료.

### EVO-028: 아르곤 코드베이스 XML 패키징 동기화 (아르곤_디자인.xml)
- **개선 방안**:
  - `아르곤_디자인.xml`을 최신 진화 사이클 반영본(87개 파일, 30,564줄)으로 자동 재패키징.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 및 원격 배포 완료.

### EVO-029: 3대 프론트엔드 디자인 스킬 1단계 (De-boxing & Concentric Border Radius)
- **개선 방안**:
  - `jakubkrehel/skills` 동심원 곡률($R_{inner} = R_{outer} - P$) 및 촉각 피드백(`active:scale-[0.96]`) 적용.
  - `pbakaus/impeccable` & `Nutlope/hallmark` 중첩 박스 해체(No Card-in-Card) 적용.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 및 원격 배포 완료.

### EVO-030: 3대 프론트엔드 디자인 스킬 2단계 (3색 분할 보색 & 정밀 검수/설치 플래너 개편)
- **개선 방안**:
  - `app/globals.css`: 3색 분할 보색(`--hb-teal`, `--hb-cyan`, `--hb-orange`, `--hb-navy`), 마이크로 그라데이션 버튼, 스튜디오 조명 배경 토큰.
  - `components/products/product-card.tsx`: 동심원 모서리 곡률 및 3색 분할 신뢰 스트립.
  - `components/products/v2-visual-inspection-viewer.tsx`: 4대 구매자 우려 해소형 에디토리얼 그리드 및 No Card-in-Card.
  - `components/products/v2-spatial-fit-planner.tsx`: 조작부 상단 배치(4단계 인터랙션), 경고/공간 시각화, 비용 구분, tabular-nums.
- **검증 계획**:
  - 8대 통합 검증 러너 100% 통과 및 원격 배포 완료.
