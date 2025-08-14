const { spawn } = require('child_process');

console.log('Starting Jest...');

const jest = spawn('node', [
  './node_modules/.bin/jest',
  'tests/__tests__/simple.test.js',
  '--no-coverage',
  '--no-cache',
  '--forceExit',
  '--detectOpenHandles'
], {
  stdio: 'inherit',
  timeout: 5000
});

jest.on('close', (code) => {
  console.log(`Jest exited with code ${code}`);
  process.exit(code);
});

setTimeout(() => {
  console.log('Timeout reached, killing Jest...');
  jest.kill('SIGKILL');
  process.exit(1);
}, 5000);