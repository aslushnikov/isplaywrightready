const path = require('path');

const TestRunner = require('./playwright/utils/testrunner/');
console.log(
  JSON.stringify({
    tests: {
      chromium: testsForProduct('Chromium'),
      firefox: testsForProduct('Firefox'),
      webkit: testsForProduct('WebKit'),
    },
  })
);

function testsForProduct(product) {
  const testMap = new Map();

  for (const platform of ['linux', 'darwin', 'win32']) {
    const testRunner = new TestRunner();
    require('./playwright/test/utils.js').setupTestRunner(testRunner);
    for (const [key, value] of Object.entries(testRunner.api()))
      global[key] = value;
    require('./playwright/test/playwright.spec.js').addPlaywrightTests({
      playwrightPath: path.join(__dirname, 'playwright', 'index.js'),
      products: [{ product }],
      platform,
      testRunner,
      headless: true,
      slowMo: 0,
      dumpProtocolOnFailure: false,
      coverage: false,
    });

    for (const test of testRunner._collector.tests()) {
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
