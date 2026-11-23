#!/usr/bin/env node
/**
 * 정적 이미지(public/images/**, public/main-bg2.png, public/store-exterior.jpg) 무손실급 경량화 스크립트
 * - 파일명·확장자·해상도를 100% 보존하여 기존 코드·테스트·SEO 스키마 호환성 유지
 * - 멱등성 & 재개 가능:
 *   1) 최소 절감률(10% & 8KB 이상) 미만이면 원본 유지(재실행 시 자동 스킵)
 *   2) 임시 파일 쓰기 + sharp 메타데이터 검증 후 원자적 교체(중단 시 파일 손상 방지)
 *   3) OS 임시 디렉터리 체크포인트에 완료 해시 기록(--reset으로 초기화 가능)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const TARGET_DIRS = [path.join(ROOT, "public", "images")];
const EXTRA_FILES = [
  path.join(ROOT, "public", "main-bg2.png"),
  path.join(ROOT, "public", "store-exterior.jpg"),
];

const DRY_RUN = process.argv.includes("--dry-run");
const RESET_STATE = process.argv.includes("--reset");
const MIN_SAVINGS_RATIO = 0.1;
const MIN_SAVINGS_BYTES = 8 * 1024;
const BATCH_SIZE = 10;

const STATE_FILE = path.join(
  os.tmpdir(),
  `hanbat-optimize-images-${crypto.createHash("sha1").update(ROOT).digest("hex").slice(0, 10)}.json`
);

function loadState() {
  if (RESET_STATE || !fs.existsSync(STATE_FILE)) return { done: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return parsed && typeof parsed.done === "object" ? parsed : { done: {} };
  } catch {
    return { done: {} };
  }
}

function saveState(state) {
  if (DRY_RUN) return;
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function walkImages(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkImages(full));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function optimizeOne(filePath, state) {
  const rel = path.relative(ROOT, filePath);
  const originalBuf = fs.readFileSync(filePath);
  const origSize = originalBuf.length;
  const origHash = sha256(originalBuf);

  if (state.done[rel] === origHash) {
    return { rel, status: "cached", origSize, newSize: origSize };
  }

  const origMeta = await sharp(originalBuf).metadata();
  const ext = path.extname(filePath).toLowerCase();

  let outBuf;
  if (ext === ".jpg" || ext === ".jpeg") {
    outBuf = await sharp(originalBuf)
      .rotate()
      .jpeg({
        quality: 82,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: "4:2:0",
      })
      .toBuffer();
  } else if (ext === ".png") {
    outBuf = await sharp(originalBuf)
      .png({
        compressionLevel: 9,
        palette: true,
        quality: 85,
        effort: 8,
      })
      .toBuffer();
  } else {
    return { rel, status: "skipped", origSize, newSize: origSize };
  }

  const savedBytes = origSize - outBuf.length;
  const savedRatio = origSize > 0 ? savedBytes / origSize : 0;

  if (savedBytes < MIN_SAVINGS_BYTES || savedRatio < MIN_SAVINGS_RATIO) {
    state.done[rel] = origHash;
    return { rel, status: "kept", origSize, newSize: origSize };
  }

  // 결과 이미지 무결성 검증 (0바이트·크기 변형 방지)
  const outMeta = await sharp(outBuf).metadata();
  if (
    !outMeta.width ||
    !outMeta.height ||
    outMeta.width !== origMeta.width ||
    outMeta.height !== origMeta.height
  ) {
    throw new Error(
      `Dimension mismatch for ${rel}: ${origMeta.width}x${origMeta.height} -> ${outMeta.width}x${outMeta.height}`
    );
  }

  if (!DRY_RUN) {
    const tmpPath = `${filePath}.opt.tmp`;
    fs.writeFileSync(tmpPath, outBuf);
    fs.renameSync(tmpPath, filePath);
    state.done[rel] = sha256(outBuf);
  }

  return {
    rel,
    status: DRY_RUN ? "would-optimize" : "optimized",
    origSize,
    newSize: outBuf.length,
    width: outMeta.width,
    height: outMeta.height,
  };
}

async function main() {
  const files = [
    ...TARGET_DIRS.flatMap(walkImages),
    ...EXTRA_FILES.filter((f) => fs.existsSync(f)),
  ].sort();

  const state = loadState();
  let totalOrig = 0;
  let totalNew = 0;
  let optimizedCount = 0;
  let keptCount = 0;
  let cachedCount = 0;
  const topSavings = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((f) => optimizeOne(f, state)));
    for (const r of results) {
      totalOrig += r.origSize;
      totalNew += r.newSize;
      if (r.status === "optimized" || r.status === "would-optimize") {
        optimizedCount++;
        topSavings.push({
          rel: r.rel,
          savedKb: Math.round((r.origSize - r.newSize) / 1024),
          fromKb: Math.round(r.origSize / 1024),
          toKb: Math.round(r.newSize / 1024),
        });
      } else if (r.status === "cached") {
        cachedCount++;
      } else {
        keptCount++;
      }
    }
    saveState(state);
  }

  topSavings.sort((a, b) => b.savedKb - a.savedKb);
  const totalSavedMb = ((totalOrig - totalNew) / (1024 * 1024)).toFixed(2);
  const pct = totalOrig > 0 ? (((totalOrig - totalNew) / totalOrig) * 100).toFixed(1) : "0.0";

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        totalFiles: files.length,
        optimizedCount,
        keptCount,
        cachedCount,
        beforeMB: Number((totalOrig / (1024 * 1024)).toFixed(2)),
        afterMB: Number((totalNew / (1024 * 1024)).toFixed(2)),
        savedMB: Number(totalSavedMb),
        savedPercent: Number(pct),
        topSavings: topSavings.slice(0, 10),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("[optimize-static-images] failed:", err);
  process.exit(1);
});
