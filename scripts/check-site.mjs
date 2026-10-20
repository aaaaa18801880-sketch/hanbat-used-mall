const res = await fetch('https://hanbatmall.com?t=' + Date.now());
const text = await res.text();
console.log('Has xl:text-[31px]?', text.includes('xl:text-[31px]'));
console.log('Has balanced description line 1?', text.includes('직영 쇼룸에서 실매물을 직접 확인하실 수 있으며,'));
const h1Match = text.match(/<h1 id="hero-title"[\s\S]{1,400}<\/h1>/);
if (h1Match) {
  console.log('H1:', h1Match[0]);
}
const pMatch = text.match(/<p class="mt-4 max-w-\[540px\][\s\S]{1,400}<\/p>/);
if (pMatch) {
  console.log('P:', pMatch[0]);
}
