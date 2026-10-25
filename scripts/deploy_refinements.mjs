import { execSync } from "node:child_process";

try {
  console.log("Staging changes...");
  execSync("git add -A", { stdio: "inherit" });

  console.log("Committing changes...");
  execSync(
    'git commit -m "feat(refinement): align 7-point audit enhancements with master prompt specifications"',
    { stdio: "inherit" }
  );

  console.log("Pushing to origin main...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("Successfully pushed!");
} catch (err) {
  console.error("Git error:", err.message);
  process.exit(1);
}
