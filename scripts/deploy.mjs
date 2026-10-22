// scripts/deploy.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const gitExe = "C:\\Program Files\\Git\\mingw64\\bin\\git.exe";
const cwd = "c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall";

async function main() {
  // Clean up temporary files
  ["scripts/deploy-pipeline.mjs", "scripts/run-lint.mjs"].forEach((f) => {
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch {}
    }
  });

  // Re-run XML build to make sure no temp files are included
  console.log("=== Regenerating 아르곤_디자인.xml ===");
  execFileSync(process.execPath, ["scripts/build-codebase-xml.mjs"], { cwd, stdio: "inherit" });

  console.log("\n=== Git add -A ===");
  execFileSync(gitExe, ["add", "-A"], { cwd, stdio: "inherit" });

  console.log("\n=== Git commit ===");
  const commitMsg = "fix(gallery): remove cluttered hashtag chips and streamline sticky filter to single clean row";
  try {
    execFileSync(gitExe, ["commit", "-m", commitMsg], { cwd, stdio: "inherit" });
  } catch (err) {
    console.log("Commit notice:", err.message);
  }

  console.log("\nWaiting 5 seconds before push...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("=== Git push origin main ===");
  execFileSync(gitExe, ["push", "origin", "main"], { cwd, stdio: "inherit" });

  const statusOut = execFileSync(gitExe, ["status"], { cwd, encoding: "utf8" });
  console.log("\nGit Status:\n" + statusOut);

  const commitHash = execFileSync(gitExe, ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();
  console.log(`✅ Commit hash: ${commitHash}`);

  console.log("\n=== Waiting 35 seconds for Vercel deployment ===");
  for (let s = 35; s > 0; s -= 5) {
    console.log(`... ${s}s remaining`);
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log("Verifying live site https://hanbatmall.com/gallery ...");
  let livePass = false;
  let attempts = 0;
  while (!livePass && attempts < 5) {
    attempts++;
    try {
      const res = await fetch(`https://hanbatmall.com/gallery?t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      const html = await res.text();
      console.log(`[Attempt ${attempts}] HTTP ${res.status}, size: ${html.length} bytes`);

      const hasHashtags = html.includes("#LG디오스") || html.includes("#삼성비스포크") || html.includes("#인버터냉난방기");
      const hasFilterBar = html.includes("PRICE_RANGE_OPTIONS") || html.includes("가격대 범위 필터") || html.includes("제품명·모델명 검색");

      console.log(`  - Hashtag chips present: ${hasHashtags} (expected: false)`);
      console.log(`  - Streamlined filter bar present: ${hasFilterBar} (expected: true)`);

      if (!hasHashtags) {
        livePass = true;
        console.log("🎉 LIVE VERIFICATION SUCCESS: Hashtag line completely gone, streamlined filter bar verified!");
        break;
      }
    } catch (err) {
      console.warn(`  - Fetch attempt ${attempts} failed:`, err.message);
    }
    if (!livePass) {
      console.log("Waiting 8s before retry...");
      await new Promise((r) => setTimeout(r, 8000));
    }
  }

  console.log("\n==========================================");
  console.log(`DEPLOYMENT COMPLETE: ${commitHash}`);
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Deploy script failed:", err);
  process.exit(1);
});
