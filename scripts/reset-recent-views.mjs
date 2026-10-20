import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
let url = "";
let serviceRoleKey = "";
let anonKey = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      url = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceRoleKey = trimmed.split("=")[1].trim();
    } else if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      anonKey = trimmed.split("=")[1].trim();
    }
  }
}

async function run() {
  console.log("================================================================================");
  console.log("🔍 Supabase Product View Inspector & Reset Tool");
  console.log("================================================================================");
  console.log(`- Supabase URL: ${url ? "Configured" : "MISSING"}`);
  console.log(`- Service Role Key: ${serviceRoleKey ? "Configured (" + serviceRoleKey.slice(0, 15) + "...)" : "NOT CONFIGURED in .env.local"}`);
  console.log(`- Anon Key: ${anonKey ? "Configured (" + anonKey.slice(0, 15) + "...)" : "MISSING"}`);
  console.log("--------------------------------------------------------------------------------");

  if (!url) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL is missing.");
    process.exit(1);
  }

  const client = createClient(url, serviceRoleKey || anonKey);

  // 1. Fetch all products with views > 0
  const { data: allProducts, error } = await client
    .from("products")
    .select("id, title, views, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Failed to query products:", error);
    process.exit(1);
  }

  const oct19 = new Date("2026-10-19T00:00:00Z");
  const recentWithViews = [];
  const olderWithViews = [];
  const allRecent = [];

  for (const p of allProducts) {
    const d = new Date(p.created_at);
    const views = p.views ?? 0;
    const isRecent = d >= oct19;

    if (isRecent) {
      allRecent.push(p);
      if (views > 0) recentWithViews.push(p);
    } else {
      if (views > 0) olderWithViews.push(p);
    }
  }

  console.log(`\n[Group 1] Registered on or after Oct 19 with views > 0 (${recentWithViews.length} products):`);
  recentWithViews.forEach((p, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, " ")}. [${p.id}] views: ${p.views} | created: ${p.created_at} | ${p.title}`);
  });

  console.log(`\n[Group 2] Registered BEFORE Oct 19 with views > 0 (${olderWithViews.length} products):`);
  olderWithViews.forEach((p, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, " ")}. [${p.id}] views: ${p.views} | created: ${p.created_at} | ${p.title}`);
  });

  console.log(`\nTotal registered on/after Oct 19: ${allRecent.length} (views > 0: ${recentWithViews.length}, views == 0: ${allRecent.length - recentWithViews.length})`);

  if (!serviceRoleKey) {
    console.log("\n⚠️ [NOTICE] SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.");
    console.log("  Supabase Row-Level Security (RLS) restricts UPDATE operations on `products`.");
    console.log("  Anonymous client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) cannot update rows directly.");
    console.log("  To perform the reset, please add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run.");
    return;
  }

  console.log(`\n🔄 Resetting views to 0 for ${recentWithViews.length} products registered on/after Oct 19...`);
  const updatedProducts = [];

  for (const item of recentWithViews) {
    const { data, error: updateErr } = await client
      .from("products")
      .update({ views: 0 })
      .eq("id", item.id)
      .select("id, title, views, created_at")
      .single();

    if (updateErr) {
      console.error(`❌ Failed to update ${item.id} (${item.title}):`, updateErr);
    } else {
      updatedProducts.push(data);
    }
  }

  console.log(`\n✅ Successfully reset ${updatedProducts.length} products to views: 0.`);
  updatedProducts.forEach((p, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, " ")}. [${p.id}] new views: ${p.views} | ${p.title}`);
  });

  // Verification step
  const { data: verifiedRecent } = await client
    .from("products")
    .select("id, title, views, created_at")
    .gte("created_at", "2026-10-19T00:00:00Z")
    .order("created_at", { ascending: false });

  const nonZero = (verifiedRecent || []).filter((p) => (p.views ?? 0) > 0);
  console.log("\n=== VERIFICATION RESULT ===");
  if (nonZero.length === 0) {
    console.log(`✅ All ${verifiedRecent?.length ?? 0} products registered on/after Oct 19 now have views = 0!`);
  } else {
    console.warn(`⚠️ Warning: ${nonZero.length} products still have views > 0:`, nonZero);
  }
}

run();
