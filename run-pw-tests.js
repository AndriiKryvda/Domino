const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportFile = path.join(__dirname, 'test-report.json');

// Remove old report
try { fs.unlinkSync(reportFile); } catch {}

console.log('Starting Playwright tests...\n');

try {
  execSync('npx playwright test --config playwright.config.ts', {
    cwd: __dirname,
    stdio: 'inherit',
    timeout: 300000,
    env: { ...process.env }
  });
  console.log('\nAll tests passed!');
} catch (e) {
  console.log('\nSome tests failed (exit code:', e.status, ')');
}

// Parse and display JSON results
console.log('\n===== DETAILED RESULTS =====\n');
try {
  const raw = fs.readFileSync(reportFile, 'utf8');
  const j = JSON.parse(raw);
  const stats = j.stats || {};

  function walk(suite, depth) {
    if (suite.title) {
      console.log('  '.repeat(depth) + '--- ' + suite.title + ' ---');
    }
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const r = (test.results || [])[0] || {};
        const status = r.status || 'unknown';
        const icon = status === 'passed' ? 'PASS' : status === 'failed' ? 'FAIL' : status.toUpperCase();
        const dur = r.duration ? ' (' + Math.round(r.duration / 1000) + 's)' : '';
        console.log('  '.repeat(depth + 1) + '[' + icon + '] ' + spec.title + dur);
        if (status !== 'passed' && r.error) {
          const msg = (r.error.message || '').split('\n')[0].substring(0, 150);
          console.log('  '.repeat(depth + 2) + '  -> ' + msg);
        }
      }
    }
    for (const child of (suite.suites || [])) {
      walk(child, depth + 1);
    }
  }

  for (const suite of (j.suites || [])) {
    walk(suite, 0);
  }

  console.log('\n===== SUMMARY =====');
  console.log('Passed:  ' + (stats.expected || 0));
  console.log('Failed:  ' + (stats.unexpected || 0));
  console.log('Flaky:   ' + (stats.flaky || 0));
  console.log('Skipped: ' + (stats.skipped || 0));
  console.log('Total:   ' + ((stats.expected||0) + (stats.unexpected||0) + (stats.flaky||0) + (stats.skipped||0)));
  console.log('Duration: ' + Math.round((stats.duration || 0) / 1000) + 's');
} catch(e) {
  console.log('Could not parse report:', e.message);
}
