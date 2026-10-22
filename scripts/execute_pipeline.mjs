import { spawnSync } from "child_process";
import fs from "fs";

const GIT_EXE = "C:\\Program Files\\Git\\mingw64\\bin\\git.exe";
const CWD = process.cwd();

// Remove any temporary scripts before staging
const tempFiles = [
  "scripts/check_git.mjs",
  "scripts/git_runner.mjs",
  "scripts/patch_all_improvements.mjs",
];

for (const tf of tempFiles) {
  if (fs.existsSync(tf)) {
    try {
      fs.unlinkSync(tf);
      console.log(`Cleaned up temporary script: ${tf}`);
    } catch (e) {
      console.warn(`Could not unlink ${tf}:`, e.message);
    }
  }
}

function runGit(args, retries = 3) {
  console.log(`\n========================================`);
  console.log(`Executing: git ${args.join(" ")}`);
  console.log(`========================================`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = spawnSync(GIT_EXE, args, {
        cwd: CWD,
        shell: false,
        encoding: "utf-8",
        env: {
          ...process.env,
          GIT_EXEC_PATH: "C:\\Program Files\\Git\\mingw64\\libexec\\git-core",
          PATH: `C:\\Program Files\\Git\\mingw64\\bin;C:\\Program Files\\Git\\usr\\bin;${process.env.PATH || ""}`,
        },
      });

      if (res.stdout) process.stdout.write(res.stdout);
      if (res.stderr) process.stderr.write(res.stderr);

      if (res.status === 0) {
        return true;
      }
      console.warn(`Command returned status ${res.status} (attempt ${attempt}/${retries})`);
    } catch (err) {
      console.warn(`Error on attempt ${attempt}/${retries}:`, err.message);
    }
    // Small wait between retries
    const waitTill = new Date(new Date().getTime() + 1000);
    while (waitTill > new Date()) {}
  }
  return false;
}

async function main() {
  console.log("=== STEP 8: Git Stage, Commit & Push ===");

  // 1. Git add -A
  const addOk = runGit(["add", "-A"]);
  if (!addOk) {
    console.error("Git add failed!");
    process.exit(1);
  }

  // 2. Git commit
  const commitMsg = "feat: apply audit report fixes (model extraction robustness, small appliance categorization, detail metadata, and UI token unification)";
  const commitOk = runGit(["commit", "-m", commitMsg]);
  if (!commitOk) {
    console.warn("Git commit may have nothing to commit or failed. Checking status...");
  }

  // 3. Git push
  console.log("\nPushing to origin main...");
  const pushOk = runGit(["push", "origin", "main"]);
  if (!pushOk) {
    console.error("Git push failed!");
    process.exit(1);
  }

  // 4. Git log -1 and status
  runGit(["log", "-1", "--oneline"]);
  runGit(["status"]);

  console.log("\n=== STEP 9: Production Deployment Verification ===");
  console.log("Waiting 40 seconds for Vercel production deployment...");
  await new Promise((resolve) => setTimeout(resolve, 40000));

  const urlsToCheck = [
    {
      url: "https://hanbatmall.com",
      checkDom: true,
      selectors: ["id=\"category-section\"", "id=\"usp-section\"", "id=\"inquiry-section\""],
    },
    {
      url: "https://hanbatmall.com/gallery",
      checkDom: false,
    },
    {
      url: "https://hanbatmall.com/inquiry",
      checkDom: false,
    },
    {
      url: "https://hanbatmall.com/0401ff3d-0802-4620-a603-461484bba136",
      checkDom: false,
    },
  ];

  let allPassed = true;
  const results = [];

  for (const item of urlsToCheck) {
    try {
      console.log(`\nFetching ${item.url}...`);
      const resp = await fetch(item.url, {
        headers: {
          "User-Agent": "HanbatMallDeployVerifier/1.0",
        },
      });

      console.log(`HTTP Status: ${resp.status} ${resp.statusText}`);
      const is200 = resp.status === 200;
      let domOk = true;
      const domDetails = [];

      if (is200 && item.checkDom) {
        const text = await resp.text();
        for (const sel of item.selectors) {
          const found = text.includes(sel);
          domDetails.push({ selector: sel, found });
          if (!found) {
            domOk = false;
            console.error(`❌ Missing selector in DOM: ${sel}`);
          } else {
            console.log(`✅ Verified in DOM: ${sel}`);
          }
        }
      }

      const passed = is200 && domOk;
      if (!passed) allPassed = false;

      results.push({
        url: item.url,
        status: resp.status,
        passed,
        domDetails: item.checkDom ? domDetails : undefined,
      });
    } catch (err) {
      console.error(`Error requesting ${item.url}:`, err.message);
      results.push({
        url: item.url,
        status: "ERROR",
        error: err.message,
        passed: false,
      });
      allPassed = false;
    }
  }

  console.log("\n==========================================");
  console.log("📊 Deployment Verification Summary:");
  console.log("==========================================");
  for (const r of results) {
    console.log(`${r.passed ? "✅ [PASS]" : "❌ [FAIL]"} ${r.url} (Status: ${r.status})`);
  }

  // Save report to pipeline_result.json
  fs.writeFileSync(
    "scripts/pipeline_result.json",
    JSON.stringify({ allPassed, results, timestamp: new Date().toISOString() }, null, 2),
    "utf-8"
  );

  // Clean up this pipeline script itself if all passed
  if (fs.existsSync("scripts/execute_pipeline.mjs")) {
    try {
      fs.unlinkSync("scripts/execute_pipeline.mjs");
      console.log("\nCleaned up scripts/execute_pipeline.mjs");
    } catch (_) {}
  }

  if (allPassed) {
    console.log("\n🎉 ALL PIPELINE AND DEPLOYMENT CHECKS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("\n❌ Some deployment checks failed.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
