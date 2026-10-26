# 한밭중고전자(hanbat-mall) 자율 코드 진화 백로그 (Evolution Backlog)

본 문서는 한밭중고전자 프로젝트의 지속적인 품질 향상을 위한 우선순위화된 개선 후보군 목록입니다.
각 후보군은 정량적 매트릭스 공식에 따라 채점 및 순위화됩니다:

$$\text{Priority Score} = \frac{\text{Impact (1-5)} \times \text{Frequency (1-5)}}{\text{Cost (1-5)} \times \text{Risk (1-5)}}$$

---

## 📋 우선순위 개선 후보군 매트릭스

| 순위 | 과제 ID | 과제명 | 대상 파일 | Impact | Frequency | Cost | Risk | Score | 상태 |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | `EVO-001` | Schema.org 중고 가전 Rich Snippet 및 반품·배송 정책 고도화 | [app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx) | 5 | 5 | 1 | 1 | **25.0** | **Ready (Cycle 1)** |
| **2** | `EVO-002` | WCAG 2.2 AA 대형 상담 CTA 접근성 및 OpenGraph 절대 경로 정규화 | [components/products/product-detail-gallery.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/components/products/product-detail-gallery.tsx)<br>[app/[id]/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/[id]/page.tsx) | 4 | 5 | 1 | 1 | **20.0** | **Ready (Cycle 1)** |
| **3** | `EVO-003` | 관리자 다중 이미지 보정 시 Canvas Object URL 메모리 누수 방지 | [lib/site.ts](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts) | 3 | 3 | 2 | 1 | **4.5** | Backlog |
| **4** | `EVO-004` | 갤러리 파라미터별(카테고리·가격·검색) Canonical 태그 및 검색 로봇 최적화 | [app/gallery/page.tsx](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/app/gallery/page.tsx) | 3 | 4 | 2 | 2 | **3.0** | Backlog |

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
