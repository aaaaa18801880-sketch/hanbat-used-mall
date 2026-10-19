import { spawn } from 'child_process';

const child = spawn('cmd.exe', ['/c', 'deploy.bat'], { stdio: 'inherit' });
child.on('exit', (code) => {
  console.log('Exit code:', code);
});
child.on('error', (err) => {
  console.error('Spawn error:', err);
});
