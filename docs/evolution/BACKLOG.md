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
| **8** | `EVO-008` | 관리자 대시보드 30일 경과 장기 재고에 대한 원클릭 가격 인하 제안 배너 연동 | [app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx) | 3 | 3 | 2 | 1 | **4.5** | Backlog |
| **9** | `EVO-009` | 카카오톡/문자 상담 클릭 시 상품 메타데이터 인코딩 및 모바일 인텐트 호환성 강화 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts) | 4 | 5 | 1 | 1 | **20.0** | **Completed (Cycle 6)** |
| **10** | `EVO-010` | 관리자 상품 목록 검색 시 모델명·스펙 통합 실시간 디바운스 필터링 고도화 | [app/admin/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/admin/page.tsx) | 3 | 4 | 1 | 1 | **12.0** | Backlog |

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
