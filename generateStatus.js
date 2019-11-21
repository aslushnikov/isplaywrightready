/**
 * This script is supposed to be run from the root of Puppeteer
 * repository.
 */

const chromeAPI = require('./playwright/lib/chromium/api.js');
const chromeEvents = require('./playwright/lib/chromium/events.js').Events;

const wkAPI = require('./playwright/lib/webkit/api.js');
const wkEvents = require('./playwright/lib/webkit/events.js').Events;

const ffAPI = require('./playwright/lib/firefox/api.js');
const ffEvents = require('./playwright/lib/firefox/events.js').Events;

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

console.log(JSON.stringify({
  webkitDiff: apiDiff(chromeAPI, chromeEvents, wkAPI, wkEvents),
  firefoxDiff: apiDiff(chromeAPI, chromeEvents, ffAPI, ffEvents),
}));
