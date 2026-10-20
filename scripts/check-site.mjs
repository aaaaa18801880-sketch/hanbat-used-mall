const res = await fetch('https://hanbatmall.com?t=' + Date.now());
const text = await res.text();
console.log('Has space-y-1.5?', text.includes('space-y-1.5'));
console.log('Has flex-col xl:flex-row?', text.includes('flex flex-col xl:flex-row xl:items-center justify-between'));
const heroSnippet = text.match(/대전광역시 중구 대전천서로[\s\S]{1,300}/);
if (heroSnippet) {
  console.log('Snippet:', heroSnippet[0].slice(0, 300));
}
