import { execSync } from "node:child_process";

try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "feat: complete Step A, B, C prompt requirements and polish UI linkages"', { stdio: "inherit" });
  execSync("git push origin main", { stdio: "inherit" });
  console.log("Push completed successfully!");
} catch (err) {
  console.error("Git error:", err.message);
}
