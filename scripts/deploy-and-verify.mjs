import { execSync } from "child_process";

function exec(cmd) {
  console.log(`\n=== Running: ${cmd} ===`);
  try {
    const out = execSync(cmd, { encoding: "utf-8", stdio: ["inherit", "pipe", "pipe"] });
    if (out) console.log(out.trim());
    return { ok: true, out };
  } catch (err) {
    const out = (err.stdout ? err.stdout.toString() : "") + (err.stderr ? err.stderr.toString() : "");
    console.error(`Error (${err.status}): ${out}`);
    return { ok: false, out, status: err.status };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyLive() {
  console.log("\n=== Verifying Vercel Live Deployment ===");
  const urls = [
    {
      url: "https://hanbatmall.com/gallery",
      name: "Gallery page",
      checkString: "카페·디저트창업", // Preset text
    },
    {
      url: "https://hanbatmall.com/0401ff3d-0802-4620-a603-461484bba136",
      name: "Product Detail page",
      checkString: "설치 환경", // Interactive checklist
    },
  ];

  let allPassed = false;
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n--- Verification Attempt ${attempt}/${maxAttempts} ---`);
    let passCount = 0;

    for (const item of urls) {
      try {
        const res = await fetch(item.url, {
          headers: { "User-Agent": "hanbat-mall-deploy-verifier/1.0" },
          cache: "no-store",
        });
        const text = await res.text();
        const statusOk = res.status === 200;
        const hasContent = text.includes(item.checkString);

        console.log(`[${item.name}] URL: ${item.url}`);
        console.log(`  - Status: ${res.status} (OK: ${statusOk})`);
        console.log(`  - Contains '${item.checkString}': ${hasContent}`);

        if (statusOk && hasContent) {
          passCount++;
        }
      } catch (e) {
        console.error(`  - Fetch error for ${item.url}:`, e.message);
      }
    }

    if (passCount === urls.length) {
      allPassed = true;
      console.log("\n✅ All live site verification checks PASSED successfully!");
      break;
    } else {
      if (attempt < maxAttempts) {
        console.log("⏳ Vercel build still deploying or propagating cache. Waiting 10s before retry...");
        await sleep(10000);
      }
    }
  }

  if (!allPassed) {
    console.warn("\n⚠️ Note: Vercel deployment may still be finalizing. Please re-check shortly.");
  }
}

async function main() {
  // 1. Stage files
  const filesToStage = [
    "app/[id]/page.tsx",
    "app/admin/page.tsx",
    "app/gallery/page.tsx",
    "app/inquiry/page.tsx",
    "app/page.tsx",
    "components/inquiry/unified-inquiry-form.tsx",
    "components/products/product-compare-modal.tsx",
    "components/products/product-detail-gallery.tsx",
    "lib/site.ts",
    "package.json",
    "scripts/verify-ux-benchmark-upgrade.mjs",
    "아르곤_디자인.xml",
  ];

  exec(`git add ${filesToStage.map((f) => `"${f}"`).join(" ")}`);

  // 2. Commit
  const commitMsg = "feat(synergy): complete SME benchmarked feature synergy linkages (presets, envNote, interactive checklist, width guide, lightbox cta)";
  exec(`git commit -m "${commitMsg}"`);

  // 3. Wait 5s
  console.log("Waiting 5 seconds before push...");
  await sleep(5000);

  // 4. Push
  exec("git push origin main");

  // 5. Check log and status
  exec("git log -1 --oneline");
  exec("git status");

  // 6. Wait 35s for Vercel
  console.log("\nWaiting 35 seconds for Vercel deployment...");
  await sleep(35000);

  // 7. Verify live site
  await verifyLive();
}

main().catch((err) => {
  console.error("Deploy script failed:", err);
  process.exit(1);
});
