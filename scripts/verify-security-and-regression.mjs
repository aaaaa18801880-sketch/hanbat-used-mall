// scripts/verify-security-and-regression.mjs
import fs from 'fs';
import path from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    if (details) console.error(`   Details: ${details}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('🔍 한밭중고전자 보안 및 회귀 검증 스크립트 실행');
console.log('====================================================\n');

// 1. P0 보안: 하드코딩 평문 시크릿 전면 제거 확인
const fixTvPath = path.resolve('app/api/admin/fix-tv-categories/route.ts');
assert(!fs.existsSync(fixTvPath), '1-1. 일회성 fix-tv-categories 라우트 파일 완전 삭제');

const apiFiles = [];
function collectFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full);
    else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js')) {
      apiFiles.push(full);
    }
  }
}
if (fs.existsSync('app/api')) collectFiles('app/api');

let foundSecret = false;
for (const file of apiFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (
    content.includes('hanbat_maint_') ||
    content.includes('hanbat_view_reset_') ||
    /RESET_SECRET\s*=\s*['"][^'"]+['"]/.test(content)
  ) {
    foundSecret = true;
    console.error(`   하드코딩 시크릿 발견: ${file}`);
  }
}
assert(!foundSecret, '1-2. app/api 하위 모든 라우트에서 하드코딩된 평문 시크릿 부재 검증');

const resetViewsPath = path.resolve('app/api/admin/reset-views/route.ts');
if (fs.existsSync(resetViewsPath)) {
  const resetContent = fs.readFileSync(resetViewsPath, 'utf8');
  assert(
    resetContent.includes('verifyAdminRequest') && !resetContent.includes('RESET_SECRET'),
    '1-3. reset-views API가 정식 verifyAdminRequest 관리자 인증을 수행'
  );
}

// 2. P1 보안: 텔레그램 및 알림톡 API 인증/스팸 차단 검증
const telegramPath = path.resolve('app/api/telegram/route.ts');
if (fs.existsSync(telegramPath)) {
  const tgContent = fs.readFileSync(telegramPath, 'utf8');
  assert(
    tgContent.includes('verifyAdminRequest(req)') &&
    tgContent.includes('유효한 접수 번호(inquiryId)가 필요합니다') &&
    tgContent.includes('tenMinutesAgoMs') &&
    tgContent.includes('dbInquiry.is_notice'),
    '2-1. /api/telegram: forceRetry 관리자 인증, inquiryId 필수, 10분 이내 유효성, 비공지 검증'
  );
}

const alimtalkPath = path.resolve('app/api/alimtalk/route.ts');
if (fs.existsSync(alimtalkPath)) {
  const alimContent = fs.readFileSync(alimtalkPath, 'utf8');
  assert(
    alimContent.includes('verifyAdminRequest(req)') &&
    alimContent.indexOf('verifyAdminRequest') < alimContent.indexOf('checkRateLimit'),
    '2-2. /api/alimtalk: 핸들러 최상단에서 verifyAdminRequest(req) 필수 검증'
  );
}

const inquiryFormPath = path.resolve('components/inquiry/unified-inquiry-form.tsx');
if (fs.existsSync(inquiryFormPath)) {
  const formContent = fs.readFileSync(inquiryFormPath, 'utf8');
  assert(
    formContent.includes('!resJson.telegramNotified && newId'),
    '2-3. unified-inquiry-form: 서버 즉시 알림 실패 시에만 클라이언트 /api/telegram 폴백 호출'
  );
}

// 3. P2 의존성 및 CSS: Tailwind v3 스택 통일 및 중복 폰트 제거
const pkgPath = path.resolve('package.json');
if (fs.existsSync(pkgPath)) {
  const pkgContent = fs.readFileSync(pkgPath, 'utf8');
  assert(!pkgContent.includes('@tailwindcss/postcss'), '3-1. package.json에서 사용하지 않는 @tailwindcss/postcss 제거');
  assert(pkgContent.includes('"tailwindcss": "^3.'), '3-2. 순수 Tailwind v3 스택 유지');
}

const globalsCssPath = path.resolve('app/globals.css');
if (fs.existsSync(globalsCssPath)) {
  const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
  assert(!cssContent.includes('@import url') || !cssContent.includes('Pretendard'), '3-3. app/globals.css 렌더링 차단 중복 웹폰트 @import 부재 검증');
}

// 4. P1/P2 아키텍처: 공통 구조화 사양 뷰어 및 스토리지 Ops 추출
const structDescPath = path.resolve('components/products/product-structured-description.tsx');
assert(fs.existsSync(structDescPath), '4-1. ProductStructuredDescription 컴포넌트 생성 확인');

const prodOpsPath = path.resolve('lib/product-ops.ts');
assert(fs.existsSync(prodOpsPath), '4-2. lib/product-ops.ts 통합 모듈 생성 확인');

const idPagePath = path.resolve('app/[id]/page.tsx');
if (fs.existsSync(idPagePath)) {
  const idContent = fs.readFileSync(idPagePath, 'utf8');
  assert(idContent.includes('ProductStructuredDescription'), '4-3. app/[id]/page.tsx에서 ProductStructuredDescription 활용');
}

const galleryPath = path.resolve('app/gallery/page.tsx');
if (fs.existsSync(galleryPath)) {
  const galleryContent = fs.readFileSync(galleryPath, 'utf8');
  assert(
    galleryContent.includes('ProductStructuredDescription') &&
    galleryContent.includes('removeProductImagesFromStorage') &&
    galleryContent.includes('compressAndUploadProductImages'),
    '4-4. app/gallery/page.tsx에서 ProductStructuredDescription 및 product-ops 활용'
  );
}

const adminPath = path.resolve('app/admin/page.tsx');
if (fs.existsSync(adminPath)) {
  const adminContent = fs.readFileSync(adminPath, 'utf8');
  assert(
    adminContent.includes('removeStorageImagesSafe') &&
    adminContent.includes('compressAndUploadProductImages'),
    '4-5. app/admin/page.tsx에서 product-ops 헬퍼 활용'
  );
}

// 5. UX & 관리자 권한 제어
const detailGalleryPath = path.resolve('components/products/product-detail-gallery.tsx');
if (fs.existsSync(detailGalleryPath)) {
  const detailContent = fs.readFileSync(detailGalleryPath, 'utf8');
  assert(
    detailContent.includes('CopyPromoPostButton') &&
    detailContent.includes('isAuthorizedAdminUser') &&
    detailContent.includes('상품 링크 복사'),
    '5-1. CopyPromoPostButton: 관리자만 홍보글 복사 노출, 일반 방문자는 상품 링크 복사 제공'
  );
}

if (fs.existsSync(adminPath)) {
  const adminContent = fs.readFileSync(adminPath, 'utf8');
  assert(
    adminContent.includes('알림톡 연동 준비중') &&
    adminContent.includes('cursor-not-allowed'),
    '5-2. app/admin/page.tsx: 미연동 알림톡 버튼 시각적 비활성화 및 오류 토스트 방지'
  );
}

// 6. RLS 보안 정책 파일 검증
const rlsSqlPath = path.resolve('supabase/security-rls-policies.sql');
if (fs.existsSync(rlsSqlPath)) {
  const sqlContent = fs.readFileSync(rlsSqlPath, 'utf8');
  assert(
    sqlContent.includes('ALTER TABLE public.products ENABLE ROW LEVEL SECURITY') &&
    sqlContent.includes('ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY') &&
    sqlContent.includes('storage.objects'),
    '6-1. supabase/security-rls-policies.sql: products, purchase_requests, storage.objects RLS 작성 완료'
  );
} else {
  assert(false, '6-1. supabase/security-rls-policies.sql 파일 부재');
}

console.log('\n====================================================');
console.log(`📊 검증 결과: 통과 ${passedTests}개 / 실패 ${failedTests}개`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✨ 모든 보안 및 회귀 검증 항목이 성공적으로 통과되었습니다!\n');
  process.exit(0);
}
