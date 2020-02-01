const path = require('path');

const {TestRunner} = require('./playwright/utils/testrunner/');
const utils = require('./playwright/test/utils');
const {describe} = require('./playwright/test/playwright.spec.js');

const chromiumTests = testsForProduct('Chromium');
const firefoxTests = testsForProduct('Firefox');
const webkitTests = testsForProduct('WebKit');

const goalSuite = intersectMaps(firefoxTests.all, chromiumTests.all, webkitTests.all);
const goalChromiumTests = {
  all: intersectMaps(chromiumTests.all, goalSuite),
  skipped: intersectMaps(chromiumTests.skipped, goalSuite)
};
const goalFirefoxTests = {
  all: intersectMaps(firefoxTests.all, goalSuite),
  skipped: intersectMaps(firefoxTests.skipped, goalSuite)
};
const goalWebkitTests = {
  all: intersectMaps(webkitTests.all, goalSuite),
  skipped: intersectMaps(webkitTests.skipped, goalSuite)
};

const skippedSuite = intersectMaps(goalSuite, joinMaps(goalFirefoxTests.skipped, goalChromiumTests.skipped, goalWebkitTests.skipped));

console.log(JSON.stringify({
  tests: {
    chromium: {
      total: chromiumTests.all.size,
      pass: chromiumTests.all.size - chromiumTests.skipped.size,
      goalTotal: goalChromiumTests.all.size,
      goalPass: goalChromiumTests.all.size - goalChromiumTests.skipped.size,
      goalSkipped: [...goalChromiumTests.skipped.values()]
    },
    firefox: {
      total: firefoxTests.all.size,
      pass: firefoxTests.all.size - firefoxTests.skipped.size,
      goalTotal: goalFirefoxTests.all.size,
      goalPass: goalFirefoxTests.all.size - goalFirefoxTests.skipped.size,
      goalSkipped: [...goalFirefoxTests.skipped.values()]
    },
    webkit: {
      total: webkitTests.all.size,
      pass: webkitTests.all.size - webkitTests.skipped.size,
      goalTotal: goalWebkitTests.all.size,
      goalPass: goalWebkitTests.all.size - goalWebkitTests.skipped.size,
      goalSkipped: [...goalWebkitTests.skipped.values()]
    },
    all: {
      total: goalSuite.size,
      pass: goalSuite.size - skippedSuite.size,
    }
  },
}));

/**
 * @param {string} product
 * @return {Map<string, {name: string, relativePath: string, lineNumber: number}>}
 */
function testsForProduct(product) {
  const testRunner = new TestRunner();
  describe({
    product,
    playwrightPath: path.join(__dirname, 'playwright', 'index.js'),
    testRunner
  });
  const all = new Map(testRunner.tests().map(test => [test.fullName, serializeTest(test)]));
  const skipped = new Map(testRunner.tests().filter(test => test.declaredMode === 'skip').map(test => [test.fullName, serializeTest(test)]));
  return {
    all,
    skipped,
  }

  function serializeTest(test) {
    return ({
      name: test.fullName,
      fileName: test.location.fileName,
      filePath: path.relative(__dirname + '/playwright', test.location.filePath),
      lineNumber: test.location.lineNumber,
    });
  }
}

/**
 * @param  {...Map} maps
 */
function intersectMaps(...maps) {
  if (!maps.length)
    return new Map();
  const intersect = new Map();
  const [first, ...rest] = maps;
  outer: for (const [key, value] of first) {
    for (const map of rest)
      if (!map.has(key))
        continue outer;
    intersect.set(key, value);
  }
  return intersect;
}

function joinMaps(...maps) {
  const joined = new Map();
  for (const map of maps)
    for (const [key, value] of map)
      joined.set(key, value);
  return joined;
}

