const { execSync } = require('child_process');
const fs = require('fs');

// Run playwright with JSON reporter writing to file
try {
  execSync(
    'npx playwright test --config playwright.config.ts --reporter=json',
    {
      cwd: __dirname,
      stdio: ['pipe', fs.openSync('test-report.json', 'w'), 'pipe'],
      timeout: 300000,
      env: { ...process.env }
    }
  );
} catch (e) {
  // Tests may fail but still produce JSON output
}

// Parse and display results
try {
  const raw = fs.readFileSync('test-report.json', 'utf8');
  const j = JSON.parse(raw);
  
  const stats = j.stats || {};
  console.log('\n===== PLAYWRIGHT TEST RESULTS =====\n');
  console.log(`Duration: ${Math.round((stats.duration || 0) / 1000)}s`);
  console.log(`Expected: ${stats.expected || 0}`);
  console.log(`Unexpected: ${stats.unexpected || 0}`);
  console.log(`Flaky: ${stats.flaky || 0}`);
  console.log(`Skipped: ${stats.skipped || 0}`);
  console.log('');

  function walkSuites(suite, depth = 0) {
    if (suite.title) {
      console.log('  '.repeat(depth) + '=== ' + suite.title + ' ===');
    }
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const result = (test.results || [])[0] || {};
        const status = result.status || 'unknown';
        const icon = status === 'passed' ? 'PASS' : status === 'failed' ? 'FAIL' : status.toUpperCase();
        const dur = result.duration ? ` (${Math.round(result.duration / 1000)}s)` : '';
        console.log('  '.repeat(depth + 1) + `[${icon}] ${spec.title}${dur}`);
        if (status === 'failed' && result.error) {
          const msg = result.error.message || '';
          const shortMsg = msg.split('\n')[0].substring(0, 120);
          console.log('  '.repeat(depth + 2) + `Error: ${shortMsg}`);
        }
      }
    }
    for (const child of (suite.suites || [])) {
      walkSuites(child, depth + 1);
    }
  }
  
  for (const suite of (j.suites || [])) {
    walkSuites(suite);
  }
  
  console.log('\n===== SUMMARY =====');
  console.log(`Total: ${(stats.expected||0) + (stats.unexpected||0) + (stats.flaky||0) + (stats.skipped||0)}`);
  console.log(`Passed: ${stats.expected || 0}`);
  console.log(`Failed: ${stats.unexpected || 0}`);
  console.log(`Flaky: ${stats.flaky || 0}`);
  console.log(`Skipped: ${stats.skipped || 0}`);
} catch(e) {
  console.error('Could not parse report:', e.message);
}
