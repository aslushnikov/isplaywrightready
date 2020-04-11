const path = require('path');
const collect = require('./playwright/test/test');
const utils = require('./playwright/test/utils');

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
    utils.setPlatform(platform);
    const testRunner = collect([browserName]);
    for (const test of testRunner.collector().tests()) {
      let skipped = test.skipped();
      let markedAsFailing = test.expectation() === test.Expectations.Fail;
      for (let suite = test.suite(); suite; suite = suite.parentSuite()) {
        skipped = skipped || suite.skipped();
        markedAsFailing = markedAsFailing || (suite.expectation() === test.Expectations.Fail);
      }
      const id = test.location().toDetailedString();
      let description = testMap.get(id);
      if (!description) {
        description = {
          name: test.name(),
          suite: test.suite().fullName(),
          skipped: [],
          markedAsFailing: [],
          fileName: test.location().fileName(),
          filePath: path.relative(__dirname + '/playwright', test.location().filePath()),
          lineNumber: test.location().lineNumber(),
        };
        testMap.set(id, description);
      }
      if (skipped)
        description.skipped.push(platform);
      if (!skipped && markedAsFailing)
        description.markedAsFailing.push(platform);
    }
  }
  return Array.from(testMap.values());
}
