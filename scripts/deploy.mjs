import { execSync, spawnSync } from 'child_process';

const tests = [
  { name: 'cmd /c git --version', fn: () => execSync('git --version', { shell: 'cmd.exe', encoding: 'utf-8' }) },
  { name: 'full cmd git --version', fn: () => execSync('"C:\\Program Files\\Git\\cmd\\git.exe" --version', { shell: 'cmd.exe', encoding: 'utf-8' }) },
  { name: 'bin git --version', fn: () => execSync('"C:\\Program Files\\Git\\bin\\git.exe" --version', { shell: 'cmd.exe', encoding: 'utf-8' }) },
  { name: 'mingw64 git --version', fn: () => execSync('"C:\\Program Files\\Git\\mingw64\\bin\\git.exe" --version', { shell: 'cmd.exe', encoding: 'utf-8' }) },
];

for (const t of tests) {
  try {
    const out = t.fn();
    console.log(`SUCCESS [${t.name}]:`, out.trim());
  } catch (e) {
    console.log(`FAIL [${t.name}]:`, e.message);
  }
}
