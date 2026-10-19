import { execFileSync } from 'child_process';
import fs from 'fs';

const bashExe = 'C:\\Program Files\\Git\\bin\\bash.exe';
const cwd = 'c:/Users/ABC/Desktop/한밭중고전자/hanbat-mall';

try {
  ['scripts/test-cmd-git.mjs', 'scripts/test-bash-git.mjs', 'scripts/git-push.bat', 'scripts/check-git.mjs', 'scripts/clean-temp.mjs'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  console.log('Deploying via single bash invocation...');
  const cmd = 'git add -A && git commit -m "feat(seo): update search snippet favicon to brand logo and og:image to store exterior banner" && git push origin main';
  const out = execFileSync(bashExe, ['-c', cmd], { cwd, encoding: 'utf8' });
  console.log(out);
  console.log('✅ Deployment push succeeded!');
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout);
  if (e.stderr) console.log('stderr:', e.stderr);
}
