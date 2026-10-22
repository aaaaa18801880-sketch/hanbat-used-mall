// scripts/build-codebase-xml.mjs
import fs from "fs";
import path from "path";

try {
  if (fs.existsSync("scripts/apply_audit_package.mjs")) {
    fs.unlinkSync("scripts/apply_audit_package.mjs");
    console.log("Cleaned up scripts/apply_audit_package.mjs");
  }
  if (fs.existsSync("scripts/deploy-step.ps1")) {
    fs.unlinkSync("scripts/deploy-step.ps1");
    console.log("Cleaned up scripts/deploy-step.ps1");
  }
} catch (e) {
  console.warn("Could not remove temp scripts:", e.message);
}

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, "아르곤_디자인.xml");

// 제외할 디렉터리 및 파일 패턴
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".gemini",
  ".vercel",
  "dist",
  "build",
]);

const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "아르곤_디자인.xml",
  "repomix-output.xml",
  "scripts/build-codebase-xml.mjs",
  "scripts/execute_pipeline.mjs",
  "scripts/pipeline_result.json",
  "scripts/copy_user_image.mjs",
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
  ".html",
]);

function shouldIncludeFile(relPath) {
  const norm = relPath.replace(/\\/g, "/");
  const base = path.basename(norm);

  // 환경변수 파일 절대 포함 금지
  if (base.startsWith(".env")) return false;
  if (IGNORED_FILES.has(norm) || IGNORED_FILES.has(base)) return false;

  const ext = path.extname(base).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function collectFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        collectFiles(path.join(dir, entry.name), fileList);
      }
    } else if (entry.isFile()) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(ROOT_DIR, fullPath);
      if (shouldIncludeFile(relPath)) {
        fileList.push({ fullPath, relPath: relPath.replace(/\\/g, "/") });
      }
    }
  }
  return fileList;
}

function escapeCdata(content) {
  // CDATA 종료 태그 안전 이스케이프
  return content.replace(/\]\]>/g, "]]]]><![CDATA[>");
}

function generateXml() {
  console.log("📦 한밭중고전자 전체 소스코드 XML 패키징 시작...");
  const files = collectFiles(ROOT_DIR);
  files.sort((a, b) => a.relPath.localeCompare(b.relPath));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<project name="hanbat-mall" generated_at="${new Date().toISOString()}">\n`;
  xml += `  <summary>\n`;
  xml += `    <name>한밭중고전자(hanbat-mall)</name>\n`;
  xml += `    <tech_stack>Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase</tech_stack>\n`;
  xml += `    <file_count>${files.length}</file_count>\n`;
  xml += `  </summary>\n`;
  xml += `  <files>\n`;

  let totalLines = 0;

  for (const file of files) {
    const rawContent = fs.readFileSync(file.fullPath, "utf-8");
    const lines = rawContent.split("\n").length;
    totalLines += lines;

    xml += `    <file path="${file.relPath}" lines="${lines}">\n`;
    xml += `      <![CDATA[\n${escapeCdata(rawContent)}\n]]>\n`;
    xml += `    </file>\n`;
  }

  xml += `  </files>\n`;
  xml += `</project>\n`;

  fs.writeFileSync(OUTPUT_FILE, xml, "utf-8");
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`✅ 생성 완료: ${OUTPUT_FILE}`);
  console.log(`   - 포함된 파일 수: ${files.length}개`);
  console.log(`   - 총 코드 라인 수: ${totalLines.toLocaleString()}줄`);
  console.log(`   - 파일 용량: ${sizeMb} MB`);
}

generateXml();
