import { execFileSync } from 'child_process';

const gitExe = 'C:\\Program Files\\Git\\mingw64\\bin\\git.exe';
const cwd = 'c:\\Users\\ABC\\Desktop\\한밭중고전자\\hanbat-mall';
const env = {
  ...process.env,
  PATH: `C:\\Program Files\\Git\\mingw64\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Windows\\System32;${process.env.PATH}`,
};

try {
  console.log('1. Git status:');
  const status = execFileSync(gitExe, ['status', '-s'], { cwd, env, encoding: 'utf8' });
  console.log(status || '(Clean)');

  console.log('2. Git add:');
  execFileSync(gitExe, ['add', '-A'], { cwd, env, encoding: 'utf8' });

  console.log('3. Git commit:');
  const commit = execFileSync(gitExe, ['commit', '-m', 'feat(gallery): add auto-rotation detection and manual 90-degree image rotation'], { cwd, env, encoding: 'utf8' });
  console.log(commit);

  console.log('4. Git push origin main:');
  const push = execFileSync(gitExe, ['push', 'origin', 'main'], { cwd, env, encoding: 'utf8' });
  console.log(push || '(Push OK)');
  console.log('✅ Deployment push succeeded!');
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout);
  if (e.stderr) console.log('stderr:', e.stderr);
}
