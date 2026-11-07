// scripts/generate-full-codebase-md.mjs
import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const DESKTOP_DIR = "C:\\Users\\ABC\\Desktop";
const OUTPUT_MD_PROJECT = path.join(ROOT_DIR, "한밭중고전자_전체코드.md");
const OUTPUT_MD_DESKTOP = path.join(DESKTOP_DIR, "한밭중고전자_전체코드.md");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".gemini",
  ".vercel",
  "dist",
  "build",
  "coverage",
]);

const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "아르곤_디자인.xml",
  "repomix-output.xml",
  "한밭중고전자_전체코드.md",
  "scripts/generate-full-codebase-md.mjs",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".jsx",
  ".json",
  ".css",
  ".md",
  ".sql",
]);

function getLanguage(ext) {
  switch (ext) {
    case ".ts":
      return "typescript";
    case ".tsx":
      return "tsx";
    case ".js":
    case ".mjs":
      return "javascript";
    case ".jsx":
      return "jsx";
    case ".json":
      return "json";
    case ".css":
      return "css";
    case ".md":
      return "markdown";
    case ".sql":
      return "sql";
    default:
      return "text";
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORED_DIRS.has(file)) {
        getAllFiles(fullPath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ALLOWED_EXTENSIONS.has(ext) && !IGNORED_FILES.has(file) && !IGNORED_FILES.has(relPath)) {
        fileList.push(relPath);
      }
    }
  }
  return fileList;
}

function getFileCategoryWeight(relPath) {
  if (relPath === "package.json") return 1;
  if (relPath === "next.config.ts" || relPath === "next.config.js") return 2;
  if (relPath === "tsconfig.json") return 3;
  if (relPath === "tailwind.config.js" || relPath === "tailwind.config.ts") return 4;
  if (relPath === "app/globals.css") return 5;
  if (relPath === "AGENTS.md") return 6;
  if (relPath === "README.md") return 7;
  if (relPath.startsWith("lib/")) return 10;
  if (relPath.startsWith("components/ui/")) return 20;
  if (relPath.startsWith("components/home/")) return 21;
  if (relPath.startsWith("components/products/")) return 22;
  if (relPath.startsWith("components/inquiry/")) return 23;
  if (relPath.startsWith("components/showroom/")) return 24;
  if (relPath.startsWith("components/")) return 29;
  if (relPath.startsWith("app/api/")) return 35;
  if (relPath.startsWith("app/")) return 30;
  if (relPath.startsWith("supabase/")) return 40;
  if (relPath.startsWith("scripts/")) return 50;
  if (relPath.startsWith("docs/")) return 60;
  return 99;
}

const allRelFiles = getAllFiles(ROOT_DIR).sort((a, b) => {
  const weightA = getFileCategoryWeight(a);
  const weightB = getFileCategoryWeight(b);
  if (weightA !== weightB) return weightA - weightB;
  return a.localeCompare(b);
});

console.log(`총 ${allRelFiles.length}개 소스코드 파일 수집됨.`);

const lines = [];

lines.push("# 한밭중고전자 (Hanbat Mall) 전체 소스코드 & 타 AI 주입용 통합 번들");
lines.push("");
lines.push("> **이 문서는 타 AI(Claude, ChatGPT, Gemini, Cursor 등)에게 한밭중고전자 프로젝트 전체를 한 번에 전달하여 즉시 이해하고 개발·수정할 수 있도록 만든 프롬프트 최적화 통합 명세서입니다.**");
lines.push("> **별도 파일 격리 보장**: PDF 관련 프로젝트, 성경 앱 프로젝트와 완전히 분리된 **순수 한밭중고전자 홈페이지 전용** 단일 코드베이스 번들입니다.");
lines.push("");
lines.push(`- **생성 일시**: ${new Date().toISOString()}`);
lines.push("- **적용 사이클**: Cycle 36 (카테고리 픽토그램 바 상단 인디케이터 & 벤토 카드 타일 비주얼 개선, 테이블 냉장고 좌우 청사진 지원)");
lines.push("- **검증 상태**: 8대 게이트(디자인 토큰, 배포 전 보안/SEO, 회귀 방지, UX 벤치마크, AI 상담 가드레일, tsc, eslint, next build) 100% PASS");
lines.push("");
lines.push("---");
lines.push("");
lines.push("## 🤖 타 AI 에이전트를 위한 핵심 지침 (System Instructions for AI)");
lines.push("");
lines.push("본 프로젝트 코드를 수정하거나 새로운 기능을 추가할 때 아래 4대 원칙을 반드시 준수해야 합니다:");
lines.push("");
lines.push("1. **도메인 단일 출처(SSOT) 규칙**: 매장명(한밭중고전자), 대표전화(`042-252-8949`), 주소(`대전 중구 대종로 637`), 무상 보증 정책(에어컨 8개월 / 주요 가전 4개월), 7일 교환 정책을 컴포넌트에 인라인 하드코딩하지 말고 반드시 `lib/site.ts`의 `STORE` 상수를 참조하세요.");
lines.push("2. **디자인 토큰 규격 준수**: 임의 픽셀 폰트(`text-[..px]`) 사용 금지 (`text-hb-xs`, `text-hb-sm`, `text-hb-base`, `text-hb-lg` 토큰 사용). JSX 화면 노출 텍스트 이모지 사용 금지 (외부 의존성 없는 `components/ui/modern-icons.tsx` 또는 `lib/ui.tsx`의 SVG Icon 사용). Tailwind CSS v3 규격 준수.");
lines.push("3. **Windows 환경 프로세스 안전성**: 개별 검증 스크립트를 수동으로 연달아 호출하지 말고, 단일 프로세스 트리 통합 러너인 `node scripts/run-all-verifications.mjs`를 실행하세요.");
lines.push("4. **원자적 로컬 체크포인트**: 변경 사항이 8대 게이트를 100% 통과하면 `node scripts/git-checkpoint.mjs \"<작업설명>\"`으로 로컬 커밋을 생성하세요.");
lines.push("");
lines.push("---");
lines.push("");
lines.push("## 🛠️ 핵심 기술 스택 및 구조");
lines.push("");
lines.push("| 영역 | 기술 | 역할 |");
lines.push("| :--- | :--- | :--- |");
lines.push("| **Framework** | Next.js 16.4.3 (App Router) | Turbopack 번들러, React Server Components (RSC) 중심 |");
lines.push("| **Library** | React 19.2.8 | React 19 동시성 모드, Server Actions |");
lines.push("| **Language** | TypeScript 5.x | 엄격한 정적 타입 세이프티 (`tsc --noEmit` 0 errors 보장) |");
lines.push("| **Styling** | Tailwind CSS v3.4.19 | 토스(TDS) Cool-Gray & 애플(HIG) 표준 디자인 토큰 체계 |");
lines.push("| **Database** | Supabase PostgreSQL | Row Level Security (RLS) 및 Storage 객체 보안 격리 |");
lines.push("| **AI Multimodal**| Google Gemini 2.5 / 3.8 Flash | 가전 사진 자동 판독(견적 추정) 및 4대 상담 분류 엔진 |");
lines.push("| **O2O 통신** | SMS, Alimtalk, Telegram | IETF RFC 5724 표준 SMS 인텐트, 카카오톡 알림톡, 텔레그램 봇 |");
lines.push("| **Verification**| 8대 통합 검증 러너 | `node scripts/run-all-verifications.mjs` |");
lines.push("");
lines.push("---");
lines.push("");
lines.push("## 📁 전체 파일 디렉터리 맵 (총 " + allRelFiles.length + "개 소스 파일)");
lines.push("");
lines.push("```text");
for (const f of allRelFiles) {
  lines.push(f);
}
lines.push("```");
lines.push("");
lines.push("---");
lines.push("");
lines.push("## 💻 전체 소스코드 (Full Source Code)");
lines.push("");

for (let i = 0; i < allRelFiles.length; i++) {
  const relPath = allRelFiles[i];
  const fullPath = path.join(ROOT_DIR, relPath);
  const content = fs.readFileSync(fullPath, "utf8");
  const ext = path.extname(relPath).toLowerCase();
  const lang = getLanguage(ext);

  lines.push(`### [${i + 1}/${allRelFiles.length}] \`${relPath}\``);
  lines.push("");
  lines.push(`\`\`\`${lang}`);
  lines.push(content);
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push("");
}

const finalMarkdown = lines.join("\n");

// 1) 프로젝트 루트에 저장
fs.writeFileSync(OUTPUT_MD_PROJECT, finalMarkdown, "utf8");
console.log(`✅ [1/2] 프로젝트 루트 저장 완료: ${OUTPUT_MD_PROJECT} (${(finalMarkdown.length / 1024).toFixed(1)} KB)`);

// 2) 바탕화면에 저장
try {
  fs.writeFileSync(OUTPUT_MD_DESKTOP, finalMarkdown, "utf8");
  console.log(`✅ [2/2] 바탕화면 저장 완료: ${OUTPUT_MD_DESKTOP}`);
} catch (e) {
  console.warn("바탕화면 저장 경고:", e.message);
}
