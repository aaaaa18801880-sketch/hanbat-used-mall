import { spawnSync } from 'child_process';
import fs from 'fs';

const gitExe = 'C:\\Program Files\\Git\\mingw64\\bin\\git.exe';

function git(...args) {
  console.log(`\n> git ${args.join(' ')}`);
  const res = spawnSync(gitExe, args, { encoding: 'utf8' });
  if (res.error) console.error('Spawn error:', res.error);
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) {
    throw new Error(`git ${args[0]} failed with code ${res.status}`);
  }
  return res.stdout;
}

try {
  console.log('--- Step 8: Git Stage, Commit & Push ---');
  git('add', '-A');
  git('commit', '-m', 'fix: resolve prefix duplication, sold sms branching, form title cleanup, and script assertions');
  
  console.log('\n--- Waiting 5 seconds before push ---');
  const end = Date.now() + 5000;
  while (Date.now() < end) {}

  console.log('\n--- Pushing to origin main ---');
  git('push', 'origin', 'main');

  console.log('\n--- Verifying git log and status ---');
  git('log', '-1', '--oneline');
  git('status');

  console.log('\n=== Git Stage, Commit & Push SUCCESS ===');
} catch (e) {
  console.error('\n❌ Execution error:', e.message);
  process.exit(1);
}
