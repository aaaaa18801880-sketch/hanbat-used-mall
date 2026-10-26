// scripts/git-checkpoint.mjs
// 안전한 로컬 체크포인트 커밋 전용 스크립트 (원격 push 절대 불가)
import { spawnSync } from "child_process";

const gitExe = "C:\\Program Files\\Git\\mingw64\\bin\\git.exe";
const message = process.argv[2] || "chore(evolution): local checkpoint commit";

function git(...args) {
  console.log(`\n> git ${args.join(" ")}`);
  const res = spawnSync(gitExe, args, { encoding: "utf8" });
  if (res.error) console.error("Spawn error:", res.error);
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) {
    throw new Error(`git ${args[0]} failed with code ${res.status}`);
  }
  return res.stdout;
}

try {
  console.log("==========================================");
  console.log("🔒 Creating Local Evolution Checkpoint Commit");
  console.log("   (Remote push is strictly prohibited)");
  console.log("==========================================");

  git("add", "-A");
  git("commit", "-m", message);
  git("log", "-1", "--oneline");
  git("status", "--short");

  console.log("\n✅ Local checkpoint commit created successfully.");
} catch (e) {
  console.error("\n❌ Checkpoint commit failed:", e.message);
  process.exit(1);
}
