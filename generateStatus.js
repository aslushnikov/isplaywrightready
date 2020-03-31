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
  testRunner.testModifier('skip', (t, condition) => condition && t.setSkipped(true));
  testRunner.suiteModifier('skip', (s, condition) => condition && s.setSkipped(true));
  testRunner.testModifier('fail', (t, condition) => condition && t.setExpectation(t.Expectations.Fail));
  testRunner.suiteModifier('fail', (s, condition) => condition && s.setExpectation(s.Expectations.Fail));
  testRunner.testModifier('slow', (t, condition) => condition && t.setTimeout(t.timeout() * 3));
  testRunner.testModifier('repeat', (t, count) => t.setRepeat(count));
  testRunner.suiteModifier('repeat', (s, count) => s.setRepeat(count));

  describe({
    product,
    playwrightPath: path.join(__dirname, 'playwright', 'index.js'),
    testRunner
  });

  return testRunner.tests().map(test => {
    let skipped = test.skipped();
    let markedAsFailing = test.expectation() === test.Expectations.Fail;
    for (let suite = test.suite(); suite; suite = suite.parentSuite()) {
      skipped = skipped || suite.skipped();
      markedAsFailing = markedAsFailing || (suite.expectation() === test.Expectations.Fail);
    }
    return {
      name: test.name(),
      suite: test.suite().fullName(),
      skipped,
      markedAsFailing,
      fileName: test.location().fileName(),
      filePath: path.relative(__dirname + '/playwright', test.location().filePath()),
      lineNumber: test.location().lineNumber(),
    };
  });
}
