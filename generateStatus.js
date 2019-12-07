const path = require('path');

const {TestRunner} = require('./playwright/utils/testrunner/');
const utils = require('./playwright/test/utils');
const {addTests} = require('./playwright/test/playwright.spec.js');

const chromeAPI = require('./playwright/lib/chromium/api.js');
const chromeEvents = require('./playwright/lib/chromium/events.js').Events;
const wkAPI = require('./playwright/lib/webkit/api.js');
const wkEvents = require('./playwright/lib/webkit/events.js').Events;
const ffAPI = require('./playwright/lib/firefox/api.js');
const ffEvents = require('./playwright/lib/firefox/events.js').Events;

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
  webkitDiff: apiDiff(chromeAPI, chromeEvents, wkAPI, wkEvents),
  firefoxDiff: apiDiff(chromeAPI, chromeEvents, ffAPI, ffEvents),
  tests: {
    chromium: {
      total: chromiumTests.all.size,
      pass: chromiumTests.all.size - chromiumTests.skipped.size,
      goalTotal: goalChromiumTests.all.size,
      goalPass: goalChromiumTests.all.size - goalChromiumTests.skipped.size,
    },
    firefox: {
      total: firefoxTests.all.size,
      pass: firefoxTests.all.size - firefoxTests.skipped.size,
      goalTotal: goalFirefoxTests.all.size,
      goalPass: goalFirefoxTests.all.size - goalFirefoxTests.skipped.size,
    },
    webkit: {
      total: webkitTests.all.size,
      pass: webkitTests.all.size - webkitTests.skipped.size,
      goalTotal: goalWebkitTests.all.size,
      goalPass: goalWebkitTests.all.size - goalWebkitTests.skipped.size,
    },
    all: {
      total: goalSuite.size,
      pass: goalSuite.size - skippedSuite.size,
    }
  },
}));

function apiDiff(chromeAPI, allChromeEvents, otherAPI, allOtherEvents) {
  const diff = {};
  for (const [className, chromeClass] of Object.entries(chromeAPI)) {
    diff[className] = {
      events: {},
      methods: {},
    };
    const chromeMethods = publicMethodNames(chromeClass);
    const otherMethods = new Set(otherAPI[className] ? publicMethodNames(otherAPI[className]) : []);
    for (const methodName of chromeMethods)
      diff[className].methods[methodName] = otherMethods.has(methodName);

    const chromeEvents = publicEventNames(allChromeEvents, className);
    const otherEvents = new Set(publicEventNames(allOtherEvents, className));
    for (const eventName of chromeEvents)
      diff[className].events[eventName] = otherEvents.has(eventName);
  }
  return diff;
}

function publicMethodNames(classType) {
  return Reflect.ownKeys(classType.prototype).filter(methodName => {
    const method = Reflect.get(classType.prototype, methodName);
    return methodName !== 'constructor' && typeof methodName === 'string' && !methodName.startsWith('_') && typeof method === 'function';
  });
}

function publicEventNames(events, className) {
  return Object.entries(events[className] || {}).filter(([name, value]) => typeof value === 'string').map(([name, value]) => value);
}


/**
 * @param {string} product
 */
function testsForProduct(product) {
  const testRunner = new TestRunner();
  addTests({
    product,
    playwrightPath: path.join(utils.projectRoot(), `${product.toLowerCase()}.js`),
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
