// scripts/check-supabase-live.mjs
// 운영 DB를 전혀 변경하지 않고 현재 Supabase 상태를 읽기 전용으로 진단하는 스크립트

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// .env.local 직접 읽기
const envPath = path.resolve(process.cwd(), ".env.local");
let url = "";
let anonKey = "";
let serviceRoleKey = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      url = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      anonKey = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceRoleKey = trimmed.split("=")[1].trim();
    }
  }
}

console.log("=========================================");
console.log("🔍 Supabase 실시간 연결 및 상태 진단");
console.log("=========================================");
console.log(`- Supabase URL: ${url ? "설정됨 (" + url + ")" : "누락"}`);
console.log(`- Anon Key: ${anonKey ? "설정됨 (앞자리 " + anonKey.slice(0, 15) + "...)" : "누락"}`);
console.log(`- Service Role Key: ${serviceRoleKey ? "설정됨" : "미설정 (서버 마스터 권한 없음)"}`);
console.log("-----------------------------------------");

if (!url || !anonKey) {
  console.error("❌ 필수 Supabase URL 또는 Anon Key가 없습니다.");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function runDiagnostics() {
  // 1. products 테이블 검사
  try {
    const { data, error, count } = await supabase
      .from("products")
      .select("id, title, category, price, status, views, condition_grade", { count: "exact" })
      .limit(1);

    if (error) {
      console.log(`❌ products 테이블 컬럼 검사 실패: [${error.code}] ${error.message}`);
    } else {
      console.log(`✅ products 테이블 정상 (views, condition_grade 컬럼 포함 확인, 총 ${count}건)`);
    }
  } catch (e) {
    console.log(`❌ products 예외: ${e.message}`);
  }

  // 2. purchase_requests 테이블 신규 컬럼 검사
  try {
    const { data, error, count } = await supabase
      .from("purchase_requests")
      .select("id, inquiry_type, category, status, is_notice, model, condition_grade, region, admin_reply", { count: "exact" })
      .limit(1);

    if (error) {
      console.log(`⚠️ purchase_requests 컬럼 검사 실패: [${error.code}] ${error.message}`);
    } else {
      console.log(`✅ purchase_requests 테이블 정상 (model, condition_grade, region, admin_reply, is_notice 모두 존재, 총 ${count}건)`);
    }
  } catch (e) {
    console.log(`⚠️ purchase_requests 예외: ${e.message}`);
  }

  // 3. Storage 버킷 검사
  try {
    const { data: files, error } = await supabase.storage.from("inquiries").list("", { limit: 3 });
    if (error) {
      console.log(`❌ Storage 'inquiries' 버킷 검사 실패: ${error.message}`);
    } else {
      console.log(`✅ Storage 'inquiries' 버킷 정상 접근 가능 (${files?.length ?? 0}개 파일 목록 확인)`);
    }
  } catch (e) {
    console.log(`❌ Storage 예외: ${e.message}`);
  }

  console.log("=========================================");
}

runDiagnostics();
