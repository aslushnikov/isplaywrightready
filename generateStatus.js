const path = require('path');

const {TestRunner} = require('./playwright/utils/testrunner/');
const utils = require('./playwright/test/utils');
const {describe} = require('./playwright/test/playwright.spec.js');

const chromiumTests = testsForProduct('Chromium');
const firefoxTests = testsForProduct('Firefox');
const webkitTests = testsForProduct('WebKit');

const goalSuite = intersectSets(firefoxTests.all, chromiumTests.all, webkitTests.all);
const goalChromiumTests = {
  all: intersectSets(chromiumTests.all, goalSuite),
  skipped: intersectSets(chromiumTests.skipped, goalSuite)
};
const goalFirefoxTests = {
  all: intersectSets(firefoxTests.all, goalSuite),
  skipped: intersectSets(firefoxTests.skipped, goalSuite)
};
const goalWebkitTests = {
  all: intersectSets(webkitTests.all, goalSuite),
  skipped: intersectSets(webkitTests.skipped, goalSuite)
};

const skippedSuite = intersectSets(goalSuite, joinSets(goalFirefoxTests.skipped, goalChromiumTests.skipped, goalWebkitTests.skipped));

console.log(JSON.stringify({
  tests: {
    chromium: {
      total: chromiumTests.all.size,
      pass: chromiumTests.all.size - chromiumTests.skipped.size,
      goalTotal: goalChromiumTests.all.size,
      goalPass: goalChromiumTests.all.size - goalChromiumTests.skipped.size,
      goalSkipped: [...goalChromiumTests.skipped]
    },
    firefox: {
      total: firefoxTests.all.size,
      pass: firefoxTests.all.size - firefoxTests.skipped.size,
      goalTotal: goalFirefoxTests.all.size,
      goalPass: goalFirefoxTests.all.size - goalFirefoxTests.skipped.size,
      goalSkipped: [...goalFirefoxTests.skipped]
    },
    webkit: {
      total: webkitTests.all.size,
      pass: webkitTests.all.size - webkitTests.skipped.size,
      goalTotal: goalWebkitTests.all.size,
      goalPass: goalWebkitTests.all.size - goalWebkitTests.skipped.size,
      goalSkipped: [...goalWebkitTests.skipped]
    },
    all: {
      total: goalSuite.size,
      pass: goalSuite.size - skippedSuite.size,
    }
  },
}));

/**
 * @param {string} product
 */
function testsForProduct(product) {
  const testRunner = new TestRunner();
  describe({
    product,
    playwrightPath: path.join(__dirname, 'playwright', 'index.js'),
    testRunner
  });
  const all = new Set(testRunner.tests().map(test => test.fullName));
  const skipped = new Set(testRunner.tests().filter(test => test.declaredMode === 'skip').map(test => test.fullName));
  return {
    all,
    skipped,
  }
}

/**
 * @param  {...Set} sets
 */
function intersectSets(...sets) {
  if (!sets.length)
    return new Set();
  const intersect = new Set();
  const [first, ...rest] = sets;
  outer: for (const item of first) {
    for (const set of rest)
      if (!set.has(item))
        continue outer;
    intersect.add(item);
  }
  return intersect;
}

function joinSets(...sets) {
  const joined = new Set();
  for (const set of sets)
    for (const item of set)
      joined.add(item);
  return joined;
}
