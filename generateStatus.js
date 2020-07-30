const path = require('path');
const {execSync} = require('child_process');
const fs = require('fs');

console.log(
  JSON.stringify({
    tests: {
      chromium: testsForBrowser('chromium'),
      firefox: testsForBrowser('firefox'),
      webkit: testsForBrowser('webkit'),
    },
  })
);

function testsForBrowser(browserName) {
  const testMap = new Map();
  for (const platform of ['linux', 'darwin', 'win32']) {
    const pwDir = path.join(__dirname, 'playwright');
    fs.writeFileSync(path.join(pwDir, 'jest-report.json'), '', 'utf8');
    try {
      console.error('Running for ' + browserName + ' ' + platform);
      execSync(`npm run jest`, { cwd: pwDir, stdio: 'pipe', env: { ...process.env, 'BROWSER': browserName, 'REPORT_ONLY_PLATFORM': platform } });
    } catch (e) {
    }
    const report = JSON.parse(fs.readFileSync(path.join(pwDir, 'jest-report.json'), 'utf8'));
    for (const file of report.testResults) {
      for (const test of file.testResults) {
        const markedAsFailing = test.failureMessages[0] && test.failureMessages[0].startsWith('Error: fail');
        const skipped = !markedAsFailing && test.status === 'pending';
        const id = file.testFilePath + ':' + test.fullName;
        let description = testMap.get(id);
        if (!description) {
          description = {
            name: test.title,
            suite: test.ancestorTitles.join(' '),
            skipped: [],
            markedAsFailing: [],
            fileName: path.basename(file.testFilePath),
            filePath: path.relative(pwDir, file.testFilePath),
          };
          testMap.set(id, description);
        }
        if (skipped)
          description.skipped.push(platform);
        if (!skipped && markedAsFailing)
          description.markedAsFailing.push(platform);
      }
    }
  }
  return Array.from(testMap.values());
}
