// scripts/run-all-verifications.mjs
// 한밭중고전자 8대 게이트 통합 검증 러너
import { spawnSync } from "child_process";

const rootDir = process.cwd();
const nodeExe = process.execPath;

const tasks = [
  {
    name: "1. check-design-tokens",
    cmd: nodeExe,
    args: ["scripts/check-design-tokens.mjs"],
  },
  {
    name: "2. verify-predeploy",
    cmd: nodeExe,
    args: ["scripts/verify-predeploy.mjs"],
  },
  {
    name: "3. verify-security-and-regression",
    cmd: nodeExe,
    args: ["scripts/verify-security-and-regression.mjs"],
  },
  {
    name: "4. verify-ux-benchmark-upgrade",
    cmd: nodeExe,
    args: ["scripts/verify-ux-benchmark-upgrade.mjs"],
  },
  {
    name: "5. test-analyze-inquiry",
    cmd: nodeExe,
    args: ["scripts/test-analyze-inquiry.mjs"],
  },
  {
    name: "6. tsc --noEmit",
    cmd: nodeExe,
    args: ["node_modules/typescript/lib/tsc.js", "--noEmit"],
  },
  {
    name: "7. eslint",
    cmd: nodeExe,
    args: ["node_modules/eslint/bin/eslint.js", "."],
  },
  {
    name: "8. next build",
    cmd: nodeExe,
    args: ["node_modules/next/dist/bin/next", "build"],
  },
];

console.log("=================================================");
console.log("🚀 Hanbat Mall Autonomous Evolution 8-Gate Suite");
console.log("=================================================");

let allPassed = true;
const summary = [];

for (const t of tasks) {
  console.log(`\n▶ Running: ${t.name}...`);
  const start = Date.now();
  const res = spawnSync(t.cmd, t.args, {
    cwd: rootDir,
    encoding: "utf8",
    env: process.env,
    stdio: "pipe",
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);

  if (res.status === 0) {
    console.log(`✅ [PASS] ${t.name} (${elapsed}s)`);
    summary.push({ name: t.name, status: "PASS", elapsed: `${elapsed}s` });
  } else {
    console.log(`❌ [FAIL] ${t.name} exited with code ${res.status}`);
    summary.push({ name: t.name, status: "FAIL", code: res.status });
    allPassed = false;
    break;
  }
}

console.log("\n=================================================");
console.log("📊 Final Gate Summary");
console.log("=================================================");
for (const s of summary) {
  console.log(`${s.status === "PASS" ? "✅" : "❌"} ${s.name}: ${s.status} ${s.elapsed || ""}`);
}
console.log("=================================================");

if (!allPassed) {
  process.exit(1);
} else {
  console.log("🎉 ALL 8 GATES PASSED PERFECTLY (100%)");
  process.exit(0);
}
