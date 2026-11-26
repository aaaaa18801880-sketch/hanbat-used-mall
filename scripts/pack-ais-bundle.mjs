// 파일 경로: scripts/pack-ais-bundle.mjs
// 실행: npm run pack:ais [--ui-only] [--with-diff] [--with-tests] [--with-diagrams]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const args = new Set(process.argv.slice(2));
const uiOnly = args.has("--ui-only");
const withDiff = args.has("--with-diff");
const withTests = args.has("--with-tests");
const withDiagrams = args.has("--with-diagrams");

const OUTPUT_FILENAME = uiOnly ? "audit-ais-ui.txt" : "audit-ais-bundle.txt";
const OUTPUT_DIR = path.join(ROOT_DIR, "AIS");
const OUTPUT_PATH = path.join(OUTPUT_DIR, OUTPUT_FILENAME);
const GEMINI_CONTEXT_LIMIT = 1_048_576;

const IGNORED_DIRS = new Set([
  "AIS",
  "node_modules",
  ".next",
  ".git",
  ".gemini",
  ".vercel",
  "dist",
  "build",
  "coverage",
  "public",
  "photos",
  "mockups",
  "docs",
  "supabase/.temp",
]);

const ROOT_CONFIG_FILES = uiOnly
  ? ["package.json", "tailwind.config.js"]
  : [
      "package.json",
      "next.config.ts",
      "tailwind.config.js",
      "tsconfig.json",
      "eslint.config.mjs",
    ];

const SOURCE_DIRS = uiOnly
  ? ["app", "components"]
  : ["app", "components", "lib", "supabase", "tests"];

const ALLOWED_EXT_BY_ROOT = {
  app: new Set([".ts", ".tsx", ".css"]),
  components: new Set([".ts", ".tsx"]),
  lib: new Set([".ts", ".tsx"]),
  supabase: new Set([".sql"]),
  tests: new Set([".ts"]),
};

const ANTIGRAVITY_SKILL_DIGEST = `
- Next.js 16 & React 19:
  - App Router Server Components 우선, 'use client'는 상호작용 리프 경계에만 최소 배치.
  - params, searchParams, cookies(), headers(), draftMode()는 반드시 await.
  - useEffect로 파생 상태 계산이나 동기 이벤트 대체 금지(no-restricted-syntax 린트 규칙 준수).
  - 실험적 'use cache' 등 미활성 API 임의 도입 금지.
- Tailwind CSS v3.4:
  - v4 문법(outline-hidden, x.5 스페이싱 예: p-4.5, @theme) 사용 금지.
  - 불투명도는 v3 5단위(/5, /10, /15 ... /95)만 사용.
  - text-[13px] 등 임의 픽셀 폰트 금지 → text-hb-xs ~ text-hb-3xl 토큰 사용.
- Supabase & 서버 보안:
  - 서버 인가 판정은 auth.getSession() 신뢰 금지 → auth.getUser() 또는 getClaims() 검증.
  - SERVICE_ROLE_KEY 등 서버 비밀키 클라이언트 노출 금지, RLS 및 소유권 검증 필수.
  - 다중 DB 쓰기 원자성 확보 및 입력값 경계 검증(Zod/명시적 파서).
- Modern Web Guidance & 접근성(WCAG AA):
  - 일반 텍스트 대비 4.5:1 이상, 대형 텍스트·UI 경계선/아이콘 3:1 이상 유지.
  - 모달/드로어는 네이티브 <dialog> + showModal() + @starting-style / prefers-reduced-motion 준수.
  - CSS 그라디언트 color space 보간(var(--in-oklab)) 사용 시 비어 있지 않은 방향 프리앰블 필수(예: linear-gradient(180deg var(--in-oklab), ...)).
  - @media (forced-colors: active)에서 다크 카드/활성 탭 경계선이 사라지지 않도록 시스템 컬러 폴백 유지.
- 도구·스킬 경계 (AIS -> .task.md 태그 위임):
  - AIS 웹 플레이그라운드에서는 MCP/브라우저/라이브 DB 실행이 불가능하므로 추측하지 말고,
    .task.md의 "5. Verification Criteria"에 아래 태그를 남겨 Antigravity가 실행 시 점검하게 한다:
    - [Antigravity 스킬 확인: modern-web-guidance 대조] (최신 CSS/HTML/DOM/접근성 변경 시)
    - [Antigravity 실측: chrome-devtools 확인] (LCP/CLS/레이아웃/콘솔 오류 확인 필요 시)
    - [Antigravity 선조회 필요: supabase_mcp 확인] (라이브 DB 스키마·RLS·로그 확인 필요 시)
`.trim();

function isSensitiveOrNoise(relNorm) {
  const base = path.basename(relNorm);
  if (
    base.startsWith(".env") ||
    base.endsWith(".pem") ||
    base.endsWith(".key") ||
    relNorm.startsWith("supabase/.temp/")
  ) {
    return true;
  }
  if (
    base.startsWith("audit-ais-") ||
    base === ".task.md" ||
    base === "package-lock.json" ||
    base === "bun.lock" ||
    base.startsWith("아르곤_디자인.") ||
    base.startsWith("한밭중고전자_")
  ) {
    return true;
  }
  return false;
}

function shouldIncludeInDir(rootName, relNorm) {
  if (isSensitiveOrNoise(relNorm)) return false;

  const ext = path.extname(relNorm).toLowerCase();
  const allowedExts = ALLOWED_EXT_BY_ROOT[rootName];
  if (!allowedExts || !allowedExts.has(ext)) return false;

  if (uiOnly && rootName === "app") {
    const base = path.basename(relNorm);
    if (relNorm !== "app/globals.css" && base !== "page.tsx" && base !== "layout.tsx") {
      return false;
    }
  }

  return true;
}

const STATIC_DIAGRAM_FILES = new Set([
  "lib/guides/verification-sources.ts",
  "components/products/refrigerator-compartment-diagram.tsx",
  "components/showroom/directions-vector-svg.tsx",
  "components/showroom/directions-png-export.ts",
]);

function isOmittedForSize(rootName, relNorm) {
  if (rootName === "lib" && /^lib\/guides\/articles-.*\.ts$/i.test(relNorm)) {
    return "장문 가이드 콘텐츠 데이터(로직/메타 파일은 포함)";
  }
  if (!withDiagrams) {
    if (
      /^components\/guide\/diagrams\//i.test(relNorm) ||
      STATIC_DIAGRAM_FILES.has(relNorm)
    ) {
      return "정적 SVG 도면·출처 데이터(--with-diagrams로 포함 가능)";
    }
  }
  if (rootName === "tests" && !withTests) {
    if (relNorm !== "tests/anti-slop-guard.test.ts") {
      return "단위 테스트 파일(--with-tests 옵션으로 전체 포함 가능)";
    }
  }
  return null;
}

function walkSourceDir(rootName, currentDir, collected, omitted) {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relNorm = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || IGNORED_DIRS.has(relNorm)) continue;
      walkSourceDir(rootName, fullPath, collected, omitted);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!shouldIncludeInDir(rootName, relNorm)) continue;

    const omitReason = isOmittedForSize(rootName, relNorm);
    const stat = fs.statSync(fullPath);
    if (omitReason) {
      omitted.push({ relNorm, bytes: stat.size, reason: omitReason });
      continue;
    }

    collected.push({ rootName, fullPath, relNorm, bytes: stat.size });
  }
}

function runGitSafe(gitArgs) {
  try {
    return execFileSync("git", gitArgs, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function readOptionalText(relPath) {
  const full = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8").trim();
}

function estimateTokens(text) {
  let asciiCount = 0;
  let nonAsciiCount = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) <= 0x7f) asciiCount++;
    else nonAsciiCount++;
  }
  return Math.ceil(asciiCount / 3.8 + nonAsciiCount * 1.1);
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  const collected = [];
  const omitted = [];

  for (const rel of ROOT_CONFIG_FILES) {
    const fullPath = path.join(ROOT_DIR, rel);
    if (!fs.existsSync(fullPath)) continue;
    const stat = fs.statSync(fullPath);
    collected.push({
      rootName: "config",
      fullPath,
      relNorm: rel,
      bytes: stat.size,
    });
  }

  for (const dirName of SOURCE_DIRS) {
    walkSourceDir(dirName, path.join(ROOT_DIR, dirName), collected, omitted);
  }

  collected.sort((a, b) => a.relNorm.localeCompare(b.relNorm));
  omitted.sort((a, b) => a.relNorm.localeCompare(b.relNorm));

  const branch = runGitSafe(["rev-parse", "--abbrev-ref", "HEAD"]) || "unknown";
  const head = runGitSafe(["rev-parse", "--short", "HEAD"]) || "unknown";
  const recentLog = runGitSafe(["log", "-n", "8", "--oneline"]) || "(unavailable)";
  const agentsMd = readOptionalText("AGENTS.md");
  const refactorSkillMd = readOptionalText(".agents/skills/systematic-refactor/SKILL.md");

  const sections = [];
  sections.push(
    [
      `<project_bundle name="hanbat-mall" mode="${uiOnly ? "ui-only" : "full-core"}" generated_at="${new Date().toISOString()}">`,
      `  <stack>Next.js 16 (App Router) | React 19 | TypeScript | Tailwind CSS v3.4 | Supabase</stack>`,
      `  <file_count>${collected.length}</file_count>`,
      `</project_bundle>`,
    ].join("\n")
  );

  sections.push(
    [
      `<git_context branch="${branch}" head="${head}">`,
      recentLog,
      `</git_context>`,
    ].join("\n")
  );

  sections.push(
    [
      `<antigravity_rules_and_skills>`,
      `  <file path="AGENTS.md">`,
      agentsMd,
      `  </file>`,
      `  <file path=".agents/skills/systematic-refactor/SKILL.md">`,
      refactorSkillMd,
      `  </file>`,
      `  <antigravity_skill_digest>`,
      ANTIGRAVITY_SKILL_DIGEST,
      `  </antigravity_skill_digest>`,
      `</antigravity_rules_and_skills>`,
    ].join("\n")
  );

  if (omitted.length > 0) {
    const manifestLines = omitted.map(
      (item) => `- ${item.relNorm} (${formatKb(item.bytes)}) — ${item.reason}`
    );
    sections.push(
      [
        `<omitted_manifest count="${omitted.length}" note="토큰 절약을 위해 본문에서 제외된 파일 목록(실제 저장소에는 존재함)">`,
        ...manifestLines,
        `</omitted_manifest>`,
      ].join("\n")
    );
  }

  if (withDiff) {
    const recentDiff = runGitSafe(["diff", "HEAD~3..HEAD"]);
    const workingDiff = runGitSafe(["diff"]);
    sections.push(
      [
        `<git_diff>`,
        `### Recent 3 Commits (HEAD~3..HEAD)`,
        recentDiff || "(no diff)",
        ``,
        `### Uncommitted Working Tree`,
        workingDiff || "(clean)",
        `</git_diff>`,
      ].join("\n")
    );
  }

  const groupStats = new Map();
  const fileBlocks = [];

  for (const item of collected) {
    const content = fs.readFileSync(item.fullPath, "utf8");
    const lineCount = content.split(/\r?\n/).length;
    fileBlocks.push(
      `<file path="${item.relNorm}" lines="${lineCount}">\n${content}\n</file>`
    );

    const prev = groupStats.get(item.rootName) ?? { count: 0, bytes: 0 };
    groupStats.set(item.rootName, {
      count: prev.count + 1,
      bytes: prev.bytes + item.bytes,
    });
  }

  sections.push(`<source_files>\n${fileBlocks.join("\n\n")}\n</source_files>`);

  const bundleText = sections.join("\n\n") + "\n";
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, bundleText, "utf8");

  const totalBytes = Buffer.byteLength(bundleText, "utf8");
  const estimatedTokens = estimateTokens(bundleText);
  const ratioPct = ((estimatedTokens / GEMINI_CONTEXT_LIMIT) * 100).toFixed(1);

  console.log(`✅ AIS 번들 생성 완료: AIS/${OUTPUT_FILENAME}`);
  console.log(`   - 모드: ${uiOnly ? "UI 전용 (--ui-only)" : "전체 핵심 코드"}`);
  console.log(`   - 포함 파일: ${collected.length}개 (생략 ${omitted.length}개)`);
  for (const [group, stat] of groupStats.entries()) {
    console.log(`     · ${group}: ${stat.count}개 (${formatKb(stat.bytes)})`);
  }
  console.log(
    `   - 전체 용량: ${(totalBytes / 1024).toFixed(1)} KB (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)`
  );
  console.log(
    `   - 추정 토큰(보수적): 약 ${estimatedTokens.toLocaleString()} tokens (Gemini 4 Neon 1,048,576 대비 약 ${ratioPct}%)`
  );
}

main();
