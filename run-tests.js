const { execSync } = require('child_process');
const fs = require('fs');

try {
  const out = execSync('npx playwright test --config playwright.config.ts --reporter=line', {
    stdio: 'pipe',
    timeout: 300000,
    encoding: 'utf8',
    cwd: __dirname,
    env: { ...process.env }
  });
  fs.writeFileSync('test-results-final.txt', out, 'utf8');
  console.log(out);
} catch(e) {
  const output = (e.stdout || '') + '\n---STDERR---\n' + (e.stderr || '') + '\nEXIT: ' + e.status;
  fs.writeFileSync('test-results-final.txt', output, 'utf8');
  console.log(output);
}
