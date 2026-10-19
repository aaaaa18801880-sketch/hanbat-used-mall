import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const GIT_PATHS = [
  "git",
  "C:\\Program Files\\Git\\cmd\\git.exe",
  "C:\\Program Files\\Git\\mingw64\\bin\\git.exe",
  "C:\\Users\\ABC\\AppData\\Local\\Programs\\Git\\cmd\\git.exe"
];

let gitExe = "git";
for (const p of GIT_PATHS) {
  if (p === "git") {
    const res = spawnSync("where", ["git"], { encoding: "utf-8" });
    if (res.status === 0 && res.stdout.trim()) {
      gitExe = res.stdout.trim().split("\r\n")[0].trim();
      break;
    }
  } else if (fs.existsSync(p)) {
    gitExe = p;
    break;
  }
}

console.log("Using git executable:", gitExe);

const cleanEnv = { ...process.env };
delete cleanEnv.GIT_ASKPASS;
delete cleanEnv.SSH_ASKPASS;
delete cleanEnv.VSCODE_GIT_ASKPASS_NODE;
delete cleanEnv.VSCODE_GIT_ASKPASS_EXTRA_ARGS;
delete cleanEnv.VSCODE_GIT_ASKPASS_MAIN;
delete cleanEnv.VSCODE_GIT_IPC_HANDLE;

function runGit(args) {
  console.log(`> git ${args.join(" ")}`);
  const res = spawnSync(gitExe, args, {
    cwd: process.cwd(),
    env: cleanEnv,
    encoding: "utf-8",
    stdio: "inherit"
  });
  if (res.status !== 0) {
    console.error(`Git command failed with status ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

// 1. git add .
runGit(["add", "-A"]);

// 2. git status
runGit(["status", "--short"]);

// 3. git commit
const commitMsg = "feat(aircon): integrate air conditioner indoor-outdoor set guide banner across product detail, gallery, inquiry, and FAQ";
runGit(["commit", "-m", commitMsg]);

// 4. git push origin main
console.log("Pushing to origin main...");
runGit(["push", "origin", "main"]);

console.log("Deployment push complete!");
