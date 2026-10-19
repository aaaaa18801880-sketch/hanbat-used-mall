import { execSync } from 'child_process';

const run = (cmd) => {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`Command failed: ${cmd}`, err.message);
    return false;
  }
};

run('git add -A');
run('git status -s');
run('git commit -m "feat(seo): implement AI search (GEO/AEO) feeds, crawler rules, comparison guide, and CTR metadata"');
run('git push origin main');
