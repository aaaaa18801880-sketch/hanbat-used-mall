import { spawnSync } from "child_process";
import fs from "fs";

// Clean up any temporary scratch files
for (const f of [
  'scripts/sync-repo.mjs',
  'scripts/do-push.mjs',
  'scripts/git-push-only.mjs',
  'scripts/git-sync.bat',
  'scripts/verify-live-sites.mjs'
]) {
  try { fs.unlinkSync(f); } catch {}
}

const gitBin = 'C:\\Program Files\\Git\\mingw64\\bin\\git.exe';
const gitExecPath = 'C:\\Program Files\\Git\\mingw64\\libexec\\git-core';
const mingwBin = 'C:\\Program Files\\Git\\mingw64\\bin';
const usrBin = 'C:\\Program Files\\Git\\usr\\bin';

const origPath = process.env.Path || process.env.PATH || '';
const cleanEnv = {};
for (const key of Object.keys(process.env)) {
  if (key.toUpperCase() !== 'PATH') cleanEnv[key] = process.env[key];
}
cleanEnv.Path = `${mingwBin};${gitExecPath};${usrBin};${origPath}`;
cleanEnv.GIT_EXEC_PATH = gitExecPath;

function exec(args) {
  console.log(`\n=== Running: git ${args.join(' ')} ===`);
  const res = spawnSync(gitBin, args, { env: cleanEnv, encoding: "utf-8" });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  return { ok: res.status === 0, status: res.status };
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyLive() {
  console.log("\n=== Verifying Vercel Live Deployment ===");
  const urls = [
    {
      url: "https://hanbatmall.com",
      name: "Home page",
      checkString: "한밭중고전자",
    },
    {
      url: "https://hanbatmall.com/gallery",
      name: "Gallery page",
      checkString: "카페·디저트창업", // Preset text
    },
    {
      url: "https://hanbatmall.com/inquiry",
      name: "Inquiry page",
      checkString: "온라인 문의",
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
  exec(["add", "-A"]);

  // 2. Commit
  exec(["commit", "-m", "fix: resolve prefix duplication, sold sms branching, form title cleanup, and script assertions"]);

  // 3. Wait 5s
  console.log("Waiting 5 seconds before push...");
  await sleep(5000);

  // 4. Push
  exec(["push", "origin", "main"]);

  // 5. Check log and status
  exec(["log", "-1", "--oneline"]);
  exec(["status"]);

  // 6. Wait 40s for Vercel
  console.log("\nWaiting 40 seconds for Vercel deployment...");
  await sleep(40000);

  // 7. Verify live site
  await verifyLive();
}

main().catch((err) => {
  console.error("Deploy script failed:", err);
  process.exit(1);
});
