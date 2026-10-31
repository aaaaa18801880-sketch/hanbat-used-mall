// 파일 경로: scripts/check-design-tokens.mjs
// 실행: node scripts/check-design-tokens.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCOPED = [
  "app/page.tsx",
  "components/home/home-page-client.tsx",
  "app/gallery/page.tsx",
  "app/[id]/page.tsx",
  "app/inquiry/page.tsx",
  "app/purchase/page.tsx",
  "app/not-found.tsx",
  "app/error.tsx",
  "app/privacy/page.tsx",
  "lib/ui.tsx",
  "components/home/ai-recommendation-guide-section.tsx",
  "components/home/category-pictogram-bar.tsx",
  "components/home/featured-products-section.tsx",
  "components/products/product-card.tsx",
  "components/products/product-status-badge.tsx",
  "components/products/product-detail-gallery.tsx",
  "components/products/product-compare-modal.tsx",
  "components/products/product-structured-description.tsx",
  "components/products/aircon-set-guide-banner.tsx",
  "components/products/v2-visual-inspection-viewer.tsx",
  "components/products/v2-spatial-fit-planner.tsx",
  "components/inquiry/quick-inquiry-modal.tsx",
  "components/inquiry/v2-wizard-quick-inquiry.tsx",
  "components/inquiry/unified-inquiry-form.tsx",
];
const GLOBAL_DIRS = ["app", "components", "lib"];
const IGNORE_MARK = "design-token-ignore";
const OPACITY_OK = new Set([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return /\.(tsx|ts)$/.test(d.name) ? [p] : [];
  });

const errors = [];
const report = (file, line, msg) =>
  errors.push(`${path.relative(ROOT, file)}:${line}  ${msg}`);

// 1) 전역: Tailwind v3에서 무효인 클래스
const invalidRules = [
  [
    /\b(?:h|w|min-h|min-w|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|top|bottom|left|right|inset)-(?:4|5|6|7|8|9|10|11|12|14|16)\.5\b/g,
    "v3 스케일에 없는 x.5 값",
  ],
  [/\b(?:p|px|py|pt|pb|m|mt|mb)-0\.2\b/g, "v3 스케일에 없는 0.2 값"],
  [/\boutline-hidden\b/g, "v4 전용 클래스(outline-hidden) → focus:outline-none 사용"],
];

for (const dir of GLOBAL_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((ln, i) => {
      if (ln.includes(IGNORE_MARK)) return;
      for (const [re, msg] of invalidRules) {
        for (const m of ln.matchAll(re)) report(file, i + 1, `${msg}: ${m[0]}`);
      }
      for (const m of ln.matchAll(
        /\b(?:bg|text|border|ring|divide|from|via|to|fill|stroke|placeholder)-[\w#\[\]-]+\/(\d+)\b/g
      )) {
        if (!OPACITY_OK.has(Number(m[1]))) {
          report(
            file,
            i + 1,
            `v3 불투명도 스케일 밖: ${m[0]} (예: /10, /15 또는 /[0.12])`
          );
        }
      }
    });
  }
}

// 2) 적용 범위: 임의 글자 크기·이모지 금지
for (const rel of SCOPED) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((ln, i) => {
    if (ln.includes(IGNORE_MARK)) return;
    for (const m of ln.matchAll(/\btext-\[\d+(?:\.\d+)?px\]/g)) {
      report(file, i + 1, `임의 글자 크기 → text-hb-* 토큰 사용: ${m[0]}`);
    }
    const trimmed = ln.trim();
    const isSmsOrComment =
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      /smsHref\(|`\[한밭중고전자/.test(ln);
    if (!isSmsOrComment && /\p{Extended_Pictographic}/u.test(ln)) {
      report(file, i + 1, "화면 텍스트 이모지 → Icon SVG 사용");
    }
  });
}

if (errors.length) {
  console.error(`❌ 디자인 토큰 위반 ${errors.length}건`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("✅ 디자인 토큰 검사 통과");
