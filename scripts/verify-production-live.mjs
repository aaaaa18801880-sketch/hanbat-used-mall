// scripts/verify-production-live.mjs
const BASE_URL = 'https://hanbatmall.com';

async function verifyLiveSite() {
  console.log(`Checking production live site: ${BASE_URL} ...`);

  // 1. Home page
  console.log('\n--- 1. Testing Home (/) ---');
  const homeRes = await fetch(BASE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 HanbatBot/1.0' } });
  console.log(`Home status: ${homeRes.status}`);
  if (homeRes.status !== 200) throw new Error(`Home status is ${homeRes.status}`);
  const homeHtml = await homeRes.text();

  // Verify V2DualModeConcierge is NOT rendered
  const hasConcierge = homeHtml.includes('맞춤 가전 매칭') || homeHtml.includes('원스톱 패키지') || homeHtml.includes('v2-dual-mode-concierge');
  console.log(`Dual Mode Concierge text/elements found: ${hasConcierge ? 'YES (UNEXPECTED)' : 'NO (AS EXPECTED)'}`);

  // Verify category section & featured products section connect
  const hasCategorySection = homeHtml.includes('id="category-section"');
  const hasFeaturedSection = homeHtml.includes('id="featured-products-section"');
  console.log(`Category section present: ${hasCategorySection}`);
  console.log(`Featured products section present: ${hasFeaturedSection}`);

  if (hasConcierge) {
    console.warn('⚠️ Warning: Concierge elements still found. Vercel deployment might still be propagating or caching.');
  }

  // 2. Gallery page
  console.log('\n--- 2. Testing Gallery (/gallery) ---');
  const galleryRes = await fetch(`${BASE_URL}/gallery`, { headers: { 'User-Agent': 'Mozilla/5.0 HanbatBot/1.0' } });
  console.log(`Gallery status: ${galleryRes.status}`);
  if (galleryRes.status !== 200) throw new Error(`Gallery status is ${galleryRes.status}`);
  const galleryHtml = await galleryRes.text();
  const hasSticky = galleryHtml.includes('sticky top-');
  console.log(`Sticky filter bar present: ${hasSticky}`);

  // 3. Product detail page
  const sampleProductId = '0401ff3d-0802-4620-a603-461484bba136';
  console.log(`\n--- 3. Testing Product Detail (/${sampleProductId}) ---`);
  const productRes = await fetch(`${BASE_URL}/${sampleProductId}`, { headers: { 'User-Agent': 'Mozilla/5.0 HanbatBot/1.0' } });
  console.log(`Product page status: ${productRes.status}`);
  if (productRes.status === 200) {
    const productHtml = await productRes.text();
    const hasVisualViewer = productHtml.includes('한밭중고전자 4대 부위별 정밀 검수 리포트') || productHtml.includes('분해 고압 스팀 살균');
    const hasSpatialPlanner = productHtml.includes('설치 공간 시뮬레이터') || productHtml.includes('가구/가전 배치도');
    console.log(`Visual Inspection Viewer present: ${hasVisualViewer}`);
    console.log(`Spatial Fit Planner present: ${hasSpatialPlanner}`);
    return {
      homeStatus: homeRes.status,
      hasConcierge,
      hasCategorySection,
      hasFeaturedSection,
      galleryStatus: galleryRes.status,
      productStatus: productRes.status,
      hasVisualViewer,
      hasSpatialPlanner
    };
  }
}

verifyLiveSite().then(res => {
  console.log('\nFinal Verification Result:', JSON.stringify(res, null, 2));
}).catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
