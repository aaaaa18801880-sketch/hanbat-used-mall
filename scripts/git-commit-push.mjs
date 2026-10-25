import { execSync } from "node:child_process";

const gitPath = 'C:\\Program Files\\Git\\cmd\\git.exe';
const commitMsg = "feat(design): implement 6 visual reform blueprints (product card, 2-tier showroom deck, hero podium, VIP guarantee, price ticket, materiality)";

console.log("Staging changes...");
execSync(`"${gitPath}" add -A`, { stdio: "inherit" });

console.log("Committing changes...");
execSync(`"${gitPath}" commit -m "${commitMsg}"`, { stdio: "inherit" });

console.log("Pushing to origin main...");
execSync(`"${gitPath}" push origin main`, { stdio: "inherit" });

console.log("Done!");
