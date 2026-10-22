import { execSync } from 'child_process';

const gitPath = 'C:\\Program Files\\Git\\cmd\\git.exe';
function run(cmd) {
  console.log(`> ${cmd}`);
  const out = execSync(`"${gitPath}" ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  console.log(out);
  return out;
}

try {
  console.log('=== Staging all changes ===');
  run('add -A');

  console.log('=== Committing ===');
  run('commit -m "fix: resolve prefix duplication, sold sms branching, form title cleanup, and script assertions"');

  console.log('=== Waiting 5 seconds before push ===');
  execSync('node -e "setTimeout(() => {}, 5000)"');

  console.log('=== Pushing to origin main ===');
  run('push origin main');

  console.log('=== Verifying git log -1 and status ===');
  run('log -1 --oneline');
  run('status');
  console.log('=== Git operations completed successfully ===');
} catch (err) {
  console.error('Git execution failed:');
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.error('STDERR:', err.stderr.toString());
  console.error(err.message);
  process.exit(1);
}
