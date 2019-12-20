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

  const columns = [
    {name: 'Chromium', testCoverage: tests.chromium},
    {name: 'Firefox', testCoverage: tests.firefox},
    {name: 'WebKit', testCoverage: tests.webkit},
  ];
  console.log(tests);

  const allTestCoverage = Math.round(tests.all.pass / tests.all.total * 100);
  document.body.append(html`
    <section class=content>
      <div style='text-align: center'>
        <img class=logo src='./pptrwk.png'></img>
      </div>
      <div class=title>
        Is <a target=_blank href="https://github.com/microsoft/playwright">PlayWright</a> Ready?
      </div>
      <div style="display:flex; align-items: center; justify-content: center">
        <ul>
          <li>Last updated: <b>${time}</b></li>
          <li>Tests passing in all browsers: <b>${allTestCoverage}%</b> (${tests.all.pass}/${tests.all.total})</li>
        </ul>
      </div>
      <div class=apidiff>
      </div>
    </section>
  `);

  for (const column of columns) {
    const {name, testCoverage} = column;
    const testPercentage = Math.round(testCoverage.pass / testCoverage.total * 100);
    const goalSkipped = testCoverage.goalTotal - testCoverage.goalPass;
    const testStatus = goalSkipped ? html`<b style="color: red">${goalSkipped}</b> skipped (${testCoverage.goalPass}/${testCoverage.goalTotal})` : html`<b style="color: green">OK</b> (${testCoverage.goalTotal})`;
    $('.apidiff').appendChild(html`
      <api-status>
        <browser-name>${name}</browser-name>
        <ul>
          <li>Tests: ${testStatus}</li>
          <li>All Tests: <b>${testPercentage}%</b> (${testCoverage.pass}/${testCoverage.total})</li>
        </ul>
        <ul>${testCoverage.goalSkipped.map(test => html`<li title=${test}>${trim(test)}</li>`)}</ul>
      </api-status>
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
