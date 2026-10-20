import { execFileSync } from 'child_process';
import fs from 'fs';

const bashExe = 'C:\\Program Files\\Git\\bin\\bash.exe';
const cwd = 'c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall';

try {
  ['scripts/test-cmd-git.mjs', 'scripts/test-bash-git.mjs', 'scripts/git-push.bat', 'scripts/check-git.mjs', 'scripts/clean-temp.mjs', 'scripts/push.sh', 'scripts/run-commit.bat'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  console.log('Deploying via single bash invocation...');
  const cmd = 'git add -A && git commit -m "fix(layout): resolve hero headline line wraps, address footer structure, and balance sell section layout"';
  const out = execFileSync(bashExe, ['-c', cmd], { cwd, encoding: 'utf8' });
  console.log(out);
  console.log('✅ Commit succeeded!');
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout);
  if (e.stderr) console.log('stderr:', e.stderr);
}




