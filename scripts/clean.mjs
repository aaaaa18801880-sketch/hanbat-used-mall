import fs from "fs";

for (const f of ["scripts/cleanup-temp.mjs", "scripts/reset-report.json", "scripts/test-auth-update.mjs"]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
