import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getBuyerConcernItems,
  INSPECTION_SUMMARY_SUBTITLE,
} from "../lib/product-inspection";
import { INFO_GUIDE_ARTICLES } from "../lib/info-guides";
import { getCategoryWarrantyInfo, STORE } from "../lib/site";

const BANNED_STORE_CLAIM_REGEX =
  /완전\s*분해|120bar|고온\s*스팀|스팀\s*살균|UV\s*살균|메거|절연\s*저항|24시간\s*(?:부하|실부하|연속)\s*시운전|실부하\s*시운전|연속\s*시운전|분해\s*고압\s*살균|디지털\s*매니폴드|담당\s*엔지니어|전문\s*엔지니어/;

const VALID_GUIDE_SLUGS = new Set(INFO_GUIDE_ARTICLES.map((a) => a.slug));

function collectSourceFiles(relDir: string): string[] {
  const absDir = path.join(process.cwd(), relDir);
  if (!fs.existsSync(absDir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(path.join(relDir, entry.name)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(path.join(relDir, entry.name));
    }
  }
  return results;
}

test("getBuyerConcernItems returns 4 authentic SSOT concern cards with valid guide slugs across categories", () => {
  const airconItems = getBuyerConcernItems("에어컨/냉난방기");
  const bizItems = getBuyerConcernItems("업소용기기");
  const homeItems = getBuyerConcernItems("냉장고");

  assert.equal(airconItems.length, 4);
  assert.equal(bizItems.length, 4);
  assert.equal(homeItems.length, 4);

  assert.ok(
    airconItems.some((item) =>
      item.badge.includes(getCategoryWarrantyInfo("에어컨/냉난방기").compactLabel)
    )
  );
  assert.ok(
    homeItems.some((item) =>
      item.badge.includes(getCategoryWarrantyInfo("냉장고").compactLabel)
    )
  );
  assert.ok(bizItems.some((item) => item.desc.includes(STORE.name)));

  const allText = [
    INSPECTION_SUMMARY_SUBTITLE,
    ...[...airconItems, ...bizItems, ...homeItems].flatMap((item) => [
      item.question,
      item.answerTitle,
      item.badge,
      item.desc,
      item.guide.label,
    ]),
  ].join("\n");

  assert.equal(
    BANNED_STORE_CLAIM_REGEX.test(allText),
    false,
    "Product inspection copy must not contain fabricated refurbishment claims"
  );

  for (const item of [...airconItems, ...bizItems, ...homeItems]) {
    assert.ok(
      VALID_GUIDE_SLUGS.has(item.guide.slug),
      `Referenced guide slug must exist: ${item.guide.slug}`
    );
  }
});

test("customer-facing components and AI search feeds contain zero banned AI-slop store claims or border-l-4 callouts", () => {
  const guardedPaths = [
    ...collectSourceFiles("components/home"),
    ...collectSourceFiles("components/products"),
    ...collectSourceFiles("components/showroom"),
    ...collectSourceFiles("components/inquiry"),
    "app/llms.txt/route.ts",
    "app/llms-full.txt/route.ts",
    "app/[id]/page.tsx",
    "app/guide/[slug]/page.tsx",
    "lib/refurbish-process.ts",
    "lib/product-inspection.ts",
    "lib/seo-schema.ts",
  ];

  const violations: string[] = [];

  for (const relPath of guardedPaths) {
    const absPath = path.join(process.cwd(), relPath);
    const content = fs.readFileSync(absPath, "utf8");
    const slopMatch = content.match(BANNED_STORE_CLAIM_REGEX);
    if (slopMatch) {
      violations.push(`${relPath}: banned claim "${slopMatch[0]}"`);
    }
    if (/\bborder-l-4\b/.test(content)) {
      violations.push(`${relPath}: AI-slop thick left border "border-l-4"`);
    }
  }

  assert.deepEqual(violations, []);
});
