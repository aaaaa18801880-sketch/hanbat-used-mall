# 한밭중고전자(hanbat-mall) 자율 코드 진화 기술 연구 (Research Reference)

본 문서는 한밭중고전자 웹 애플리케이션의 성능, SEO, 검색 노출, 웹 접근성, 안전성을 고도화하기 위해 참조한 공인 기술 표준 및 공식 문서들의 요약 및 인용 자료입니다.

---

## 1. Google Search Central: 제품 구조화 데이터 및 무료 판매자 등록(Merchant Listings)

### 공식 문서 출처
- **Google Search Central**: [Product structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/product)
- **Google Merchant Center**: [Free product listings structured data requirements](https://support.google.com/merchants/answer/7393047)

### 핵심 기술 요건
1. **중고품 상태 명시 (`itemCondition`)**:
   - 일반 텍스트("중고", "A급") 대신 Schema.org의 표준 식별자 URI를 사용해야 구글 알고리즘이 올바르게 색인함:
     `"itemCondition": "https://schema.org/UsedCondition"`
2. **판매자 반품 정책 (`hasMerchantReturnPolicy`)**:
   - 구글 쇼핑 리치 스니펫에서 무료 판매자 등록 자격을 획득하기 위한 필수 권장 필드:
     ```json
     "hasMerchantReturnPolicy": {
       "@type": "MerchantReturnPolicy",
       "applicableCountry": "KR",
       "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
       "merchantReturnDays": 7,
       "returnMethod": "https://schema.org/ReturnInStore",
       "returnFees": "https://schema.org/FreeReturn"
     }
     ```
3. **배송 세부 정보 (`shippingDetails`)**:
   - 대전/충청 직영 배송 및 전국 화물 배송 일정 구조화:
     ```json
     "shippingDetails": {
       "@type": "OfferShippingDetails",
       "shippingRate": {
         "@type": "MonetaryAmount",
         "value": 0,
         "currency": "KRW"
       },
       "shippingDestination": {
         "@type": "DefinedRegion",
         "addressCountry": "KR"
       },
       "deliveryTime": {
         "@type": "ShippingDeliveryTime",
         "handlingTime": {
           "@type": "QuantitativeValue",
           "minValue": 0,
           "maxValue": 1,
           "unitCode": "d"
         },
         "transitTime": {
           "@type": "QuantitativeValue",
           "minValue": 1,
           "maxValue": 3,
           "unitCode": "d"
         }
       }
     }
     ```

---

## 2. Next.js 16 App Router: OpenGraph 절대 경로 규격 (RFC 3986)

### 공식 문서 출처
- **Next.js 16 Documentation**: `app/api-reference/functions/generate-metadata#opengraph`
- **OpenGraph Protocol**: [ogp.me](https://ogp.me/)

### 핵심 기술 요건
- 카카오톡 인앱 브라우저 스크래퍼 및 페이스북 크롤러는 상대 경로(`/og-image.jpg` 등)로 지정된 `og:image` 메타 태그를 올바르게 파싱하지 못하고 썸네일 미리보기를 누락하는 경우가 빈번함.
- `generateMetadata`의 `openGraph.images`는 항상 `https://hanbatmall.com/og-image.jpg`와 같이 도메인 및 프로토콜이 포함된 완전한 절대 URL(Absolute URI)로 정규화되어야 함.

---

## 3. W3C WCAG 2.2 Level AA: 대형 인터랙티브 CTA 접근성 표준

### 공식 문서 출처
- **W3C WAI WCAG 2.2 Guidelines**: [Success Criterion 2.4.4 (Link Purpose in Context)](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)
- **W3C WAI WCAG 2.2 Guidelines**: [Success Criterion 4.1.2 (Name, Role, Value)](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)

### 핵심 기술 요건
1. **전화번호 링크 명확화**:
   - `tel:` 스키마를 사용하는 링크(`<a>`)는 텍스트만으로도 시각장애인 스크린 리더 사용자가 대상 매장 전화번호를 즉시 인지할 수 있도록 `aria-label="한밭중고전자 전화 바로 상담 연결 (042-252-8949)"` 명시.
2. **외부 새 창 링크 알림**:
   - `target="_blank"`로 카카오톡 채팅창을 여는 링크는 시각장애인에게 새 창이 열림을 사전에 고지해야 함 (`aria-label="한밭중고전자 카카오톡 1:1 상담창 열기 (새 창)"`, `rel="noopener noreferrer"`).

---

## 4. IETF RFC 5724: URI Scheme for GSM Short Message Service (SMS) & 모바일 인텐트 표준

### 공식 표준 출처
- **IETF RFC 5724**: [URI Scheme for GSM Short Message Service](https://datatracker.ietf.org/doc/html/rfc5724)

### 핵심 기술 요건
1. **모바일 브라우저 크로스플랫폼 URI 인코딩**:
   - 모바일 웹에서 기본 메시지 앱을 트리거할 때 `sms:<전화번호>?body=<URL인코딩된본문>` 표준을 준수.
   - 한글, 줄바꿈(`\n`), 특수문자가 포함된 본문은 `encodeURIComponent`로 안전하게 인코딩하여 iOS(메시지 앱)와 Android(삼성 메시지/구글 메시지) 양대 OS에서 깨짐 없이 본문이 자동 프리필되도록 보장.
2. **온·오프라인 단절 방지 링크 포함 (Context Preservation)**:
   - 단말기 문자 상담 시 매장 담당자가 고객이 문의하는 특정 매물(70여 개 중고 가전)의 사진과 스펙을 실시간으로 식별할 수 있도록 상품 번호 및 공식 상세 URL(`https://hanbatmall.com/{id}`)을 본문에 포함.
