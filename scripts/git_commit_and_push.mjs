import { execSync } from "node:child_process";

try {
  console.log("Staging changes...");
  execSync("git add -A", { stdio: "inherit" });

  console.log("Committing changes...");
  execSync(
    'git commit -m "feat: complete 7-point audit enhancements (views tracking, AI guide section, gallery quick view, admin deep-link, wizard AI, SEO FAQ schema, token unification)"',
    { stdio: "inherit" }
  );

  console.log("Pushing to origin main...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("Successfully pushed!");
} catch (err) {
  console.error("Git operation failed:", err.message);
  process.exit(1);
}
