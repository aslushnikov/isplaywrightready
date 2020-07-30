import {html} from './zhtml.js';

const responsePromise = fetch('./status.json');
const dataPromise = responsePromise.then(response => response.json());
const $ = document.querySelector.bind(document);

window.addEventListener('DOMContentLoaded', async () => {
  const response = await responsePromise;
  const json = await dataPromise;
  const date = new Date(response.headers.get('last-modified'));
  const diff = Date.now() - date;
  let time = '';
  if (diff < 1000)
    time = 'Just Now';
  else if (1000 <= diff && diff <= 60 * 1000)
    time = `${Math.round(diff / 1000)} seconds ago`;
  else if (60 * 1000 <= diff && diff <= 60 * 60 * 1000)
    time = `${Math.round(diff / 60 / 1000)} minutes ago`;
  else if (60 * 60 * 1000 <= diff && diff <= 24 * 60 * 60 * 1000)
    time = `${Math.round(diff / 60 / 60 / 1000)} hours ago`;
  else if (24 * 60 * 60 * 1000 <= diff)
    time = `${Math.round(diff / 24 / 60 / 60 / 1000)} days ago`;

  const {tests} = json;

  function isSkippedTest(test) {
    return test.skipped.length === 3;
  }

  function isFailingTest(test) {
    return test.skipped.length < 3 && test.markedAsFailing.length > 0;
  }

  function toPlatform(platform) {
    return platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : 'linux';
  }

  const columns = [
    {name: 'Chromium', allTests: tests.chromium},
    {name: 'WebKit', allTests: tests.webkit},
    {name: 'Firefox', allTests: tests.firefox},
  ];

  document.body.append(html`
    <div class="header">
      <div class="title">
        is <a target=_blank href="https://github.com/microsoft/playwright">Playwright</a> ready?
      </div>
      <div class="info">last updated: ${time}</div>
    </div>
    <div class="toc">
    </div>
    <div class="details">
    </div>
  `);

  for (const column of columns) {
    const {name, allTests} = column;
    const skippedTests = allTests.filter(isSkippedTest);
    const failingTests = allTests.filter(isFailingTest);
    $('.toc').appendChild(html`
      <div class="toc-entry">
        <div class="browser-name">${name}</div>
        <div>
          <div class="number" style="color: green">${allTests.length - skippedTests.length - failingTests.length}</div>
          <div class="info">pass</div>
        </div>
        <div>
          <div class="number" style="color: red">${failingTests.length}</div>
          <div class="info">failing</div>
        </div>
      </div>
    `);
  }

  for (const column of columns) {
    const {name, allTests} = column;
    const suitesMap = new Map();
    for (const test of allTests) {
      let suite = suitesMap.get(test.suite);
      if (!suite) {
        suite = {
          name: test.suite,
          allTests: [],
          failingTests: [],
        };
        suitesMap.set(test.suite, suite);
      }
      suite.allTests.push(test);
      if (isFailingTest(test))
        suite.failingTests.push(test);
    }
    const failingSuites = [...suitesMap.values()].filter(suite => !!suite.failingTests.length);
    failingSuites.sort((a, b) => (b.failingTests.length / b.allTests.length - a.failingTests.length / a.allTests.length) || (b.failingTests.length - a.failingTests.length));
    $('.details').appendChild(html`
      <div class="browser-name">${name}</div>
      ${failingSuites.map(suite => html`
        <details>
          <summary>${suite.name} (<span style="color: red">${suite.failingTests.length}</span> /  ${suite.allTests.length} tests)</summary>
          <div class="test-list">${suite.failingTests.map(test => html`
            <div title=${test.name}>
              <span>${trim(test.name)}</span>
              <span class="platforms">${test.markedAsFailing.length < 3 ? '(' + test.markedAsFailing.map(toPlatform).join(', ') + ')' : null}</span>
              <a href="https://github.com/microsoft/playwright/blob/master/${test.filePath}">${test.fileName}</a>
            </div>`)}
          </div>
        </details>
      `)}
    `);
  }

  function trim(text) {
    if (text.startsWith('Browser Page '))
      return text.substring('Browser Page '.length);
    if (text.startsWith('Playwright '))
      return text.substring('Playwright '.length);
    return text;
  }
}, false);
