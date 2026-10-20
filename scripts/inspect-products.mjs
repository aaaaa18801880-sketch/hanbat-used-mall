import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

const key = serviceRoleKey || anonKey;
const supabase = createClient(url, key);

async function inspect() {
  const { data: allProducts, error } = await supabase
    .from("products")
    .select("id, title, views, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error querying products:", error);
    process.exit(1);
  }

  const oct19 = new Date("2026-10-19T00:00:00Z");

  const recentWithViews = [];
  const recentZeroViews = [];
  const olderWithViews = [];
  const olderZeroViews = [];

  for (const p of allProducts) {
    const d = new Date(p.created_at);
    const views = p.views ?? 0;
    const isRecent = d >= oct19;

    if (isRecent) {
      if (views > 0) recentWithViews.push(p);
      else recentZeroViews.push(p);
    } else {
      if (views > 0) olderWithViews.push(p);
      else olderZeroViews.push(p);
    }
  }

  console.log("================================================================================");
  console.log(`[Group 1] Registered on or after Oct 19 with views > 0 (${recentWithViews.length} products)`);
  console.log("================================================================================");
  recentWithViews.forEach((p, idx) => {
    console.log(`${String(idx + 1).padStart(2, " ")}. [${p.id}] views: ${p.views} | created: ${p.created_at} | ${p.title}`);
  });

  console.log("\n================================================================================");
  console.log(`[Group 2] Registered BEFORE Oct 19 with views > 0 (${olderWithViews.length} products)`);
  console.log("================================================================================");
  olderWithViews.forEach((p, idx) => {
    console.log(`${String(idx + 1).padStart(2, " ")}. [${p.id}] views: ${p.views} | created: ${p.created_at} | ${p.title}`);
  });

  console.log("\n================================================================================");
  console.log(`[Summary] Total: ${allProducts.length} | Oct 19+ (views>0: ${recentWithViews.length}, views==0: ${recentZeroViews.length}, total: ${recentWithViews.length + recentZeroViews.length}) | Before Oct 19 (views>0: ${olderWithViews.length}, views==0: ${olderZeroViews.length}, total: ${olderWithViews.length + olderZeroViews.length})`);
  console.log("================================================================================");
}

inspect();
