const path = require('path');

const {TestRunner} = require('./playwright/utils/testrunner/');
const {describe} = require('./playwright/test/playwright.spec.js');
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
  const testRunner = new TestRunner();

  describe({
    product,
    playwrightPath: path.join(__dirname, 'playwright', 'index.js'),
    testRunner
  });

  return testRunner.tests().map(test => {
    return {
      name: test.fullName,
      mode: test.declaredMode,
      fileName: test.location.fileName,
      filePath: path.relative(__dirname + '/playwright', test.location.filePath),
      lineNumber: test.location.lineNumber,
    };
  });
}
