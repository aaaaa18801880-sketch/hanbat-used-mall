// 파일 경로: scripts/migrate-inquiry-attachments.mjs
// 고객 첨부 사진을 공개 버킷(inquiries)에서 비공개 버킷(inquiry-attachments)으로 옮기고 문의 레코드의 사진 URL을 갱신합니다.
// 기본 실행은 점검만 합니다. 실제 이동은 --apply 옵션과 SUPABASE_SERVICE_ROLE_KEY 가 있을 때만 수행합니다.
// 상품·공지 사진은 옮기지 않습니다(상품 페이지가 공개 URL을 그대로 사용하기 때문).
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const FROM_BUCKET = "inquiries";
const TO_BUCKET = "inquiry-attachments";
const FROM_PREFIX = `/storage/v1/object/public/${FROM_BUCKET}/`;
const TO_PREFIX = `/storage/v1/object/public/${TO_BUCKET}/`;

function loadEnv() {
  const env = { ...process.env };
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && env[match[1]] === undefined) {
        env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  }
  return env;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string" && v.trim() !== "").map((v) => v.trim());
  }
  if (typeof value === "string") {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

function storagePathOf(url) {
  const index = url.indexOf(FROM_PREFIX);
  if (index < 0) return null;
  const encoded = url.slice(index + FROM_PREFIX.length).split(/[?#]/)[0];
  try {
    return decodeURIComponent(encoded) || null;
  } catch {
    return null;
  }
}

const env = loadEnv();
const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 이 설정되어 있지 않습니다.");
  process.exit(1);
}
if (APPLY && !serviceKey) {
  console.error("--apply 실행에는 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey || anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(
  `모드: ${APPLY ? "APPLY(실제 이동)" : "DRY-RUN(점검만)"} / 키: ${
    serviceKey ? "service_role" : "anon(조회 가능한 범위만 집계)"
  }`
);

const { data: rows, error: rowsError } = await supabase
  .from("purchase_requests")
  .select("id, is_notice, images, image_url")
  .not("is_notice", "is", true);
if (rowsError) {
  console.error("문의 목록 조회 실패:", rowsError.message);
  process.exit(1);
}

const { data: products, error: productsError } = await supabase
  .from("products")
  .select("image_url");
if (productsError) {
  console.error("상품 목록 조회 실패:", productsError.message);
  process.exit(1);
}
const productImages = new Set(products.flatMap((p) => toList(p.image_url)));

const targets = rows
  .map((row) => ({
    row,
    movable: [...toList(row.images), ...toList(row.image_url)].filter(
      (url) => url.includes(FROM_PREFIX) && !productImages.has(url)
    ),
  }))
  .filter((t) => t.movable.length > 0);

const uniquePaths = new Set();
for (const { movable } of targets) {
  for (const url of movable) {
    const p = storagePathOf(url);
    if (p) uniquePaths.add(p);
  }
}

console.log(`이전 대상: 문의 ${targets.length}건 / 사진 ${uniquePaths.size}장 (상품·공지 사진 제외)`);

if (!APPLY) {
  console.log("점검만 수행했습니다. 실제 이동은 service_role 키를 설정하고 --apply 옵션으로 실행하세요.");
  process.exit(0);
}

const { error: bucketError } = await supabase.storage.getBucket(TO_BUCKET);
if (bucketError) {
  console.error(`대상 버킷(${TO_BUCKET})을 찾을 수 없습니다. security-rls-policies.sql 1단계를 먼저 실행하세요.`);
  process.exit(1);
}

console.log("실행 전 문의 테이블(images, image_url) 백업을 권장합니다.");

const moveState = new Map();
for (const p of uniquePaths) {
  const { error } = await supabase.storage
    .from(FROM_BUCKET)
    .move(p, p, { destinationBucket: TO_BUCKET });
  if (!error) {
    moveState.set(p, "moved");
    continue;
  }
  const { error: alreadyError } = await supabase.storage
    .from(TO_BUCKET)
    .createSignedUrl(p, 60);
  if (!alreadyError) {
    moveState.set(p, "moved");
    continue;
  }
  moveState.set(p, "failed");
  console.warn(`이동 실패: ${p} (${error.message})`);
}

const rewrite = (url) => {
  const p = storagePathOf(url);
  if (!p || moveState.get(p) !== "moved") return url;
  return url.replace(FROM_PREFIX, TO_PREFIX);
};

let rowsUpdated = 0;
let rowsFailed = 0;
for (const { row, movable } of targets) {
  const movedHere = movable
    .map(storagePathOf)
    .filter((p) => p && moveState.get(p) === "moved");
  if (movedHere.length === 0) continue;

  const patch = {};
  if (Array.isArray(row.images)) {
    patch.images = row.images.map(rewrite);
  } else if (typeof row.images === "string" && row.images.trim() !== "") {
    patch.images = toList(row.images).map(rewrite).join(",");
  }
  if (Array.isArray(row.image_url)) {
    patch.image_url = row.image_url.map(rewrite);
  } else if (typeof row.image_url === "string" && row.image_url.trim() !== "") {
    patch.image_url = toList(row.image_url).map(rewrite).join(",");
  }

  const { error } = await supabase
    .from("purchase_requests")
    .update(patch)
    .eq("id", row.id);
  if (error) {
    rowsFailed += 1;
    console.warn(`문의 ${row.id} 갱신 실패 (${error.message}). 이 문의의 사진을 원래 버킷으로 되돌립니다.`);
    for (const p of movedHere) {
      await supabase.storage
        .from(TO_BUCKET)
        .move(p, p, { destinationBucket: FROM_BUCKET });
      moveState.set(p, "failed");
    }
  } else {
    rowsUpdated += 1;
  }
}

let verified = 0;
for (const [p, state] of moveState) {
  if (state !== "moved") continue;
  const { error } = await supabase.storage.from(TO_BUCKET).createSignedUrl(p, 60);
  if (!error) verified += 1;
}

const movedCount = [...moveState.values()].filter((s) => s === "moved").length;
const failedCount = [...moveState.values()].filter((s) => s === "failed").length;
console.log(
  `완료: 사진 이동 ${movedCount}장 / 실패 ${failedCount}장, 문의 갱신 ${rowsUpdated}건 / 실패 ${rowsFailed}건, 서명 URL 검증 ${verified}장`
);
console.log("다음 단계: 2단계 SQL 을 실행한 뒤 security-rls-verify.sql 로 익명 노출 0건을 확인하세요.");
