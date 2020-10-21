const fs = require('fs');
const path = require('path');

const report = new Map();

const data = JSON.parse(fs.readFileSync('status.json'));
dumpTests(data);

function parametersString(parameters) {
  return `${parameters['browserName']}_${parameters['platform']}`;
}

function dumpTests(suite) {
  if (suite.suites) {
    for (const child of suite.suites)
      dumpTests(child);
  }
  for (const spec of suite.specs || []) {
    for (const test of spec.tests) {
      const configuration = parametersString(test.parameters);
      const key = path.basename(spec.file) + ' - ' + spec.title;
      for (const annotation of test.annotations) {
        if (annotation.type && annotation.type !== 'skip' && annotation.type !== 'slow') {
          let list = report.get(key);
          if (!list) {
            list = [];
            report.set(key, list);
          }
          list.push(configuration + '_' + annotation.type);
        }
      }
    }
  }
}

console.log('<style>');
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  for (const platform of ['win32', 'darwin', 'linux']) {
    console.log(`tr.${browserName}_${platform}_fail td.${browserName}_${platform} { background-color: #f44336; }`);
    console.log(`tr.${browserName}_${platform}_flaky td.${browserName}_${platform} { background-color: #ffa000; }`);
    console.log(`tr.${browserName}_${platform}_fixme td.${browserName}_${platform} { background-color: #f44336; }`);
  }
}
console.log('</style>');

console.log('<table>');

console.log('<tr>');
console.log('<th>Test</th>')
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  for (const platform of ['win32', 'darwin', 'linux'])
    console.log(`<th>${browserName}_${platform}</th>`);
}
console.log('</tr>');

const keys = [...report.keys()];
keys.sort();

for (const key of keys) {
  console.log(`<tr class="${report.get(key).join(' ')}">`);
  console.log(`<td class="title">${key}</td>`)
  for (const browserName of ['chromium', 'firefox', 'webkit']) {
    for (const platform of ['win32', 'darwin', 'linux'])
      console.log(`<td class="${browserName}_${platform}"></td>`);
  }
  console.log('</tr>');
}
console.log('</table>');
console.log(`<hr></hr>`);
