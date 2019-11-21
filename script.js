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

  const {webkitDiff, firefoxDiff} = json;
  const chromiumDiff = JSON.parse(JSON.stringify(webkitDiff));
  for (const [className, coverage] of Object.entries(chromiumDiff)) {
    for (const methodName of Object.keys(coverage.methods))
      coverage.methods[methodName] = true;
    for (const eventName of Object.keys(coverage.events))
      coverage.events[eventName] = true;
  }

  const excludedClasses = [
    'Coverage',
    'Geolocation',
    'PDF',
    'Accessibility',
    'Permissions',
    'Tracing',
    'Worker',
    'Workers',
    'CDPSession',
  ];

  for (const excludedClass of excludedClasses) {
    delete webkitDiff[excludedClass];
    delete chromiumDiff[excludedClass];
    delete firefoxDiff[excludedClass];
  }

  const excluded = new Map([
    ['Coverage', new Set([
      'startJSCoverage',
      'stopJSCoverage',
      'startCSSCoverage',
      'stopCSSCoverage',
    ])],
    ['CDPSession', new Set([
      'send',
      'detach',
    ])],
    ['Target', new Set([
      'createCDPSession',
    ])],
    ['Tracing', new Set([
      'start',
      'stop',
    ])],
  ]);

  const columns = [
    {name: 'Chromium', diff: chromiumDiff},
    {name: 'Firefox', diff: firefoxDiff},
    {name: 'WebKit', diff: webkitDiff},
  ];

  for (const column of columns) {
    const {name, diff} = column;
    let supportedAPI = 0;
    let totalAPI = 0;
    Object.entries(diff).forEach(([className, coverage]) => {
      Object.entries(coverage.methods).forEach(([methodName, status]) => {
        ++totalAPI;
        if (status)
          ++supportedAPI;
      });
      Object.values(coverage.events).forEach(status => {
        ++totalAPI;
        if (status)
          ++supportedAPI;
      });
    });
    const apiCoverage = Math.round(supportedAPI / totalAPI * 100);
    const testCoverage = Math.round(json.webkitTests / json.allTests * 100);
    $('.apidiff').appendChild(html`
      <api-status>
        <browser-name>${name}</browser-name>
        <ul>
          <li>Supported API: <b>${apiCoverage}%</b> (${supportedAPI}/${totalAPI})</li>
          <li>Last updated: <b>${time}</b></li>
        </ul>
        <h4>Implemented API</h4>
        <ul>${Object.entries(diff).map(([className, classCoverage]) => html`
          <li>class: ${className}</li>
          <ul>${Object.entries(classCoverage.events).map(([eventName, status]) => html`
            <li class=${status ? 'supported': 'missing'}>${lower(className)}.on('${eventName}')</li>
          `)}
          </ul>
          <ul>${Object.entries(classCoverage.methods).map(([methodName, status]) => {
            const cls = status ? 'supported' : 'missing';
            return html`
            <li class=${cls}>${lower(className)}.${methodName}()</li>
            `;
          })}
          </ul>
        `)}
        </ul>
      </api-status>
    `);

  }

  function lower(text) {
    if (text === 'CDPSession')
      return 'cdpSession';
    if (text === 'JSHandle')
      return 'jsHandle';
    if (text === 'PDF')
      return 'pdf';
    return text.substring(0, 1).toLowerCase() + text.substring(1);
  }
}, false);
