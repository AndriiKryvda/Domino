const fs = require('fs');
try {
  const j = JSON.parse(fs.readFileSync('test-report.json', 'utf8'));
  const st = j.stats;
  let out = '';
  out += `PASSED: ${st.expected} | FAILED: ${st.unexpected} | DURATION: ${Math.round(st.duration/1000)}s\n\n`;

  function walk(suite, depth) {
    if (suite.title) out += '  '.repeat(depth) + '[' + suite.title + ']\n';
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const r = (test.results || [])[0] || {};
        const icon = r.status === 'passed' ? 'PASS' : 'FAIL';
        out += '  '.repeat(depth + 1) + icon + ': ' + spec.title + '\n';
        if (r.status !== 'passed' && r.error) {
          const msg = (r.error.message || '').split('\n')[0].substring(0, 150);
          out += '  '.repeat(depth + 2) + '> ' + msg + '\n';
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

  fs.writeFileSync('test-summary.txt', out, 'utf8');
  console.log('Written to test-summary.txt');
} catch(e) {
  console.log('Error:', e.message);
}
