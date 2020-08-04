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
    const filesMap = new Map();
    for (const test of allTests) {
      let file = filesMap.get(test.filePath);
      if (!file) {
        file = {
          name: test.fileName,
          path: test.filePath,
          allTests: [],
          failingTests: [],
        };
        filesMap.set(test.filePath, file);
      }
      file.allTests.push(test);
      if (isFailingTest(test))
        file.failingTests.push(test);
    }
    const failingFiles = [...filesMap.values()].filter(file => !!file.failingTests.length);
    failingFiles.sort((a, b) => a.name.localeCompare(b.name));
    $('.details').appendChild(html`
      <div class="browser-name">${name}</div>
      ${failingFiles.map(file => html`
        <div>
          <a href="https://github.com/microsoft/playwright/blob/master/${file.path}">${file.name}</a>
          (<span style="color: red">${file.failingTests.length}</span> /  ${file.allTests.length} tests)
        </div>
        <div class="test-list">${file.failingTests.map(test => html`
          <div title=${test.name}>
            <span>${test.name}</span>
            <span class="platforms">${test.markedAsFailing.length < 3 ? '(' + test.markedAsFailing.map(toPlatform).join(', ') + ')' : null}</span>
          </div>`)}
        </div>
      `)}
    `);
  }
}, false);
