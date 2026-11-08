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
   - `tel:` 스키마를 사용하는 링크(`<a>`)는 텍스트만으로도 시각장애인 스크린 리더 사용자가 대상 매장 전화번호를 즉시 인지할 수 있도록 `aria-label="한밭중고전자 전화 바로 상담 연결 (042-523-8179)"` 명시.
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

---

## 5. Web Vitals & W3C HTML Priority Hints: LCP(Largest Contentful Paint) 이미지 조기 렌더링 표준

### 공식 표준 출처
- **web.dev (Google Chrome)**: [Optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- **W3C Priority Hints Specification**: [W3C Priority Hints](https://wicg.github.io/priority-hints/)

### 핵심 기술 요건
1. **뷰포트 초기 렌더링 매물 이미지 우선권 부여**:
   - 첫 화면 뷰포트 내에 즉시 노출되는 대표 매물(1~2순위 카드 이미지)에 `loading="lazy"`가 걸려있을 경우, 브라우저가 스크롤 감지 및 레이아웃 연산 완료 시점까지 이미지 다운로드를 지연시켜 LCP 점수가 크게 저하됨.
   - 첫 화면 상단 1~2개 카드 이미지에는 `loading="eager"` 및 `fetchPriority="high"` 속성을 주입하여 네트워크 디스패처가 HTML 파싱 즉시 최고 우선순위로 이미지 바이너리를 스트리밍하도록 보장.
2. **하단 카드 지연 로딩(`loading="lazy"`)과의 분리 원칙**:
   - 뷰포트 밖의 3순위 이후 매물 카드들은 기본 `loading="lazy"` 및 `decoding="async"`를 유지하여 초기 메인 스레드 블로킹 및 대역폭 낭비를 원천 차단.

---

## 6. W3C CSS Scroll Snap Module & 수평 오버플로우 시각 인디케이터(Affordance)

### 공식 표준 출처
- **W3C CSS Scroll Snap Module Level 1**: [W3C Candidate Recommendation Snapshot](https://www.w3.org/TR/css-scroll-snap-1/)
- **Nielsen Norman Group (NN/g)**: [Horizontal Attention Leanings & Scroll Affordance](https://www.nngroup.com/articles/horizontal-scrolling/)

### 핵심 기술 요건
1. **모바일 칩/카테고리 바 컷오프(Cut-off) 인지 부하 해소**:
   - 모바일 뷰포트 폭(360~430px)에서 수평 나열 칩들이 우측 화면 경계선에 딱 맞물려 잘릴 경우, 사용자는 우측에 추가 카테고리가 존재함을 인지하지 못하고 스크롤을 중단하는 '페이크 엔드(False Floor)' 현상이 발생함.
   - 컨테이너 우측에 `pointer-events-none`을 적용한 화이트 페이드 그라디언트 오버레이(`bg-gradient-to-l from-white/95 to-transparent`)를 배치하여 추가 콘텐츠가 존재함을 직관적으로 암시.
2. **반응형 랩탑 해상도(1280px+) 퀵 윙 접근성 확장**:
   - 1440px 이상의 대형 모니터뿐만 아니라 대다수 랩탑(1280px, 1366px 해상도)에서도 우측 퀵 내비게이션 및 견적 상담 도크가 안정적으로 노출되도록 브레이크포인트를 `xl:flex (1280px+)`로 최적화.

---

## 7. 정적 번들 풋프린트 다이어트: 래스터 비트맵 폐기 및 벡터 듀오톤 표준화

### 공식 지침 출처
- **Google Lighthouse**: [Efficiently encode images & Avoid enormous network payloads](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/)

### 핵심 기술 요건
1. **미사용 래스터 자산(~15MB) 전량 제거**:
   - 실제 렌더링에 사용되지 않는 일러스트레이션 JPG/PNG(약 15MB)를 번들에서 영구 제거하여 정적 파일 전송 오버헤드, Git 리포지토리 부하 및 CDN 전송 비용 절감.
2. **해상도 독립적 듀오톤 벡터 아이콘 시스템**:
   - 고용량 래스터 그래픽 대신 고해상도 레티나 디스플레이에서도 픽셀 깨짐이 전혀 없는 경량 SVG 듀오톤 패스(`ICON` 객체)를 단일 출처로 유지.
