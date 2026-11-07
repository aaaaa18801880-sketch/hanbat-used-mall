# 한밭중고전자 (Hanbat Used Electronics Mall)

> **SINCE 1997 대전 중촌동 1·2층 직영 대형 쇼룸 기반 온·오프라인 연동(O2O) 중고 가전 전문 웹 플랫폼**  
> 냉장고, 세탁기, 에어컨, 김치냉장고, TV 등 70여 종의 엄선된 실매물 카탈로그를 투명하게 제공합니다.  
> 5단계 기능 정밀 점검, 전용 약품 분해 고압 세척, 에어컨 8개월 / 주요 가전 4개월 무상 보증, 대전·세종·충청권 당일/익일 직영 배송을 지원합니다.

---

## 🛠️ 핵심 기술 스택 (Tech Stack)

| 영역 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.4.3 (App Router)** | Turbopack 기반 고속 번들링, Server Components 중심 아키텍처 |
| **Library** | **React 19.2.8** | 최신 React 19 동시성 및 Server Actions 지원 |
| **Language** | **TypeScript 5.x** | 엄격한 타입 세이프티 (`tsc --noEmit` 0 errors 보장) |
| **Design System** | **Tailwind CSS v3.4.19** | 토스(TDS) Cool-Gray & 애플(HIG) 기반 표준 디자인 토큰 체계 |
| **Database** | **Supabase PostgreSQL** | Row Level Security (RLS) 및 Storage Buckets 안전 데이터 격리 |
| **AI Engine** | **Google Gemini 2.5 / 3.8 Flash** | 멀티모달 가전 사진 자동 판독(견적 추정) 및 4대 상담 분류 엔진 |
| **Notification** | **SMS, Alimtalk, Telegram** | IETF RFC 5724 표준 SMS 인텐트, 카카오톡 알림톡, 텔레그램 봇 연동 |
| **Icons** | **Pure Inline SVG Duotone** | 외부 패키지 없는 0-overhead 해상도 독립적 벡터 아이콘 시스템 |

---

## 🛡️ 8대 게이트 통합 검증 시스템 (Unified Verification Runner)

본 프로젝트는 안전하고 무결한 자율 코드 진화를 위해 단일 프로세스 트리 통합 검증 러너를 운영합니다.  
Windows 환경의 자식 프로세스 스폰 스로틀링(`Access is denied`)을 방지하며 빠른 실패(Fast-Fail) 구조로 실행됩니다.

```bash
# 8대 게이트 전체 검증 실행 (최소 4~6초 쿨다운 유지)
node scripts/run-all-verifications.mjs
```

### 8대 검증 게이트 순서 및 역할
1. `check-design-tokens.mjs` (0.4s) — 임의 픽셀 폰트(`text-[..px]`), JSX 화면 노출 이모지, Tailwind v3 미지원 클래스 0건 검증
2. `verify-predeploy.mjs` (0.5s) — API 라우트 동적 옵션, Gemini API 키 폴백, 메타데이터/클라이언트 분리 점검
3. `verify-security-and-regression.mjs` (0.4s) — 관리자 인증 보안(RLS, `verifyAdminRequest`), 올리브/웜톤 컬러 회귀 차단
4. `verify-ux-benchmark-upgrade.mjs` (0.4s) — 갤러리 프리셋, 매물 상태 등급, 묶음 견적함, O2O 상담 연동 무결성 검증
5. `test-analyze-inquiry.mjs` (0.3s) — AI 상담 분석 4대 유형 가드레일 및 과잉 추론 차단 테스트
6. `tsc --noEmit` (2.5s) — TypeScript 정적 타입 분석 (0 errors)
7. `eslint .` (15s) — Next.js 핵심 룰 정적 린트 분석 (0 errors, 0 warnings)
8. `next build` (15s) — Next.js Turbopack 22개 전체 정적/동적 라우트 컴파일 및 번들 검증

---

## ✨ 주요 기능 및 UX 특징 (Key Features)

- **품목별 쇼룸 카탈로그 벤토 독 (Bento Catalog Dock)**:
  - 8열 반응형 벤토 카드 타일, 동심원 곡률 디자인 및 Zero CLS 시그널 오렌지 활성 인디케이터 바.
  - 전 품목 실시간 재고 대수 및 B2B 전용 배지 지원.
- **다도어·테이블 냉장고 실물 청사진 다이어그램 (Refrigerator Blueprint Diagram)**:
  - 25~65박스 업소용 냉장고(상하/좌우 분할) 및 테이블 냉장고의 냉동/냉장 구역, 적정 온도, 직냉/간냉식 스펙을 시각적으로 즉시 파악하는 실물 청사진 모형 위젯.
- **충청권 6대 권역 직배송 & 당일 방문매입 1초 조회 원장 (Delivery Region Checker)**:
  - 대전 핵심구, 대전 동부, 세종/청주, 충남 인접, 천안/아산, 전국 화물 권역별 배송/설치 및 당일 현금 매입 기준 1초 안내 원장 위젯.
- **2.5D 스튜디오 조명 매물 카드 (Studio Specular Lighting)**:
  - 뎁스 틸트 및 정밀한 스펙큘러 하이라이트 효과를 통해 실물 가전의 질감과 상태를 생생하게 전달.
- **관심 매물 묶음 견적함 (Quote Basket)**:
  - 여러 가전을 플로팅 캡슐에 담아 카카오톡 및 SMS로 1초 만에 묶음 견적을 요청하는 O2O 연동.
- **AI 스마트 사진 분석 매입 신청**:
  - 고객이 가전 사진을 업로드하면 Gemini Flash AI가 모델명, 연식, 외관 등급, 예상 매입가를 즉시 분석.
- **오프라인 쇼룸 방문 길찾기 & 실물 확인 예약**:
  - 카카오맵, 네이버지도, 티맵 3대 내비게이션 원클릭 연동 및 매장 방문 홀드(Hold) 예약 지원.
- **단일 출처(SSOT) 비즈니스 정책 준수**:
  - 매장명, 연락처, 주소, 무상 보증 규정(에어컨 8개월/주요가전 4개월), 7일 교환 규정이 [`lib/site.ts`](file:///c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall/lib/site.ts)의 `STORE` 상수를 통해 UI, 메타데이터, SMS 본문 전체에 일관되게 주입.
- **LCP 고속 로딩 & 모바일 반응형 UX**:
  - 상단 주요 매물 `fetchPriority="high"` 및 `loading="eager"` 우선 로딩.
  - 모바일 카테고리 칩 바 페이드 그라디언트 마스크 및 랩탑(1280px+) 퀵 윙 독 지원.

---

## 📁 프로젝트 디렉터리 구조 (Directory Structure)

```
hanbat-mall/
├── app/                              # Next.js App Router
│   ├── [id]/                         # 상품 상세 페이지 (Schema.org JSON-LD, O2O CTA)
│   ├── admin/                        # 관리자 매물·문의 대시보드 (보안 RLS 연동)
│   ├── api/                          # 백엔드 API (AI 가전 분석, 문의 접수, 관리자)
│   ├── gallery/                      # 가전 실매물 전체 갤러리 (필터, 프리셋, 정렬)
│   ├── inquiry/                      # 고객 문의 게시판
│   ├── purchase/                     # 중고 가전 출장 매입 신청 안내
│   ├── llms.txt & llms-full.txt      # AI 검색 엔진(AEO/GEO) 실시간 재고 연동
│   ├── robots.ts & sitemap.ts        # 검색 엔진 최적화(SEO) 라우트
│   ├── layout.tsx & globals.css      # 전역 레이아웃 및 디자인 토큰 CSS
│   └── page.tsx                      # 메인 쇼룸 랜딩 페이지
├── components/                       # 모듈화된 UI 컴포넌트
│   ├── home/                         # 히어로, 카테고리 픽토그램 바, 추천 매물
│   ├── products/                     # 상품 카드, 상세 갤러리, 스펙 설명
│   ├── showroom/                     # 쇼룸 방문 길찾기 및 매장 안내 모달
│   └── inquiry/                      # 문의 및 매입 접수 폼
├── docs/evolution/                   # 자율 코드 진화 엔지니어링 문서 체계
│   ├── PROTOCOL.md                   # 자율 진화 프로토콜 및 운영 표준
│   ├── RESEARCH.md                   # 공인 기술 표준 및 공식 연구 자료
│   ├── BACKLOG.md                    # 우선순위 개선 후보군 매트릭스
│   └── CHANGELOG.md                  # 전체 진화 사이클 상세 변경 이력
├── lib/                              # 핵심 도메인 로직 및 단일 출처 (SSOT)
│   ├── site.ts                       # 매장 정보, 보증 정책, 통계, SMS 템플릿 SSOT
│   ├── ui.tsx                        # 헤더, 푸터, 플로팅 독, SVG 아이콘 모음
│   └── supabase.ts                   # Supabase 클라이언트 및 RLS 헬퍼
└── scripts/                          # 8대 게이트 검증 및 체크포인트 도구
    ├── run-all-verifications.mjs     # 8대 게이트 통합 러너
    └── git-checkpoint.mjs            # 원자적 로컬 체크포인트 커밋 도구
```

---

## 🚀 로컬 개발 환경 설정 (Getting Started)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example`을 복사하여 `.env.local`을 생성하고 필요한 키를 입력합니다 (`.env.local`은 Git 커밋 대상에서 제외됩니다):

```env
# 공개 Supabase 연결 (클라이언트/서버 공용)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# 서버 전용 비공개 키 (절대 NEXT_PUBLIC_ 접두사를 붙이지 마세요)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Google Gemini AI API 키 (가전 사진 자동 분석)
GEMINI_API_KEY="your-gemini-api-key"

# 문의 알림 연동 (선택 사항)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
ALIMTALK_API_KEY=""
ALIMTALK_USER_ID=""
```

### 3. 개발 서버 구동
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인합니다.

### 4. 로컬 체크포인트 격리 (Local Checkpoint Isolation)
모든 코드 수정 후 8대 게이트를 통과하면 로컬 체크포인트 커밋을 생성합니다:
```bash
node scripts/git-checkpoint.mjs "<사이클 설명>"
```

---

## 📄 라이선스 (License)

Copyright © 1997-2026 **한밭중고전자 (Hanbat Used Electronics Mall)**. All rights reserved.
