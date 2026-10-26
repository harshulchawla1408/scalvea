import { spawn } from 'child_process';
import { WebSocket } from 'ws';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--no-sandbox'
]);

await new Promise(r => setTimeout(r, 1500));

const versionRes = await fetch('http://127.0.0.1:9225/json/version');
const versionData = await versionRes.json();
const ws = new WebSocket(versionData.webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));

let id = 1;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const curId = id++;
    const handler = (msg) => {
      const data = JSON.parse(msg);
      if (data.id === curId) {
        ws.off('message', handler);
        resolve(data.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

const routes = [
  '/',
  '/shop',
  '/product/follicle-8',
  '/cart',
  '/checkout',
  '/account',
  '/blogs',
  '/about',
  '/contact',
  '/faq'
];

console.log('=== RUNNING MULTI-ROUTE E2E SMOKE TESTS ===');

let allPassed = true;

for (const route of routes) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:9225/devtools/page/${targetId}`);
  await new Promise(r => pageWs.on('open', r));

  let pid = 1;
  function sendPage(method, params = {}) {
    return new Promise((resolve) => {
      const curId = pid++;
      const handler = (msg) => {
        const data = JSON.parse(msg);
        if (data.id === curId) {
          pageWs.off('message', handler);
          resolve(data.result);
        }
      };
      pageWs.on('message', handler);
      pageWs.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  const errors = [];
  pageWs.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text;
      errors.push(desc);
    }
  });

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');

  const navUrl = `http://localhost:4173${route}`;
  await sendPage('Page.navigate', { url: navUrl });
  await new Promise(r => setTimeout(r, 1200));

  const docRes = await sendPage('Runtime.evaluate', {
    expression: '({ title: document.title, rootChildren: document.getElementById("root")?.children.length || 0 })',
    returnByValue: true
  });

  const info = docRes?.result?.value || {};
  const status = errors.length === 0 && info.rootChildren > 0 ? '✅ PASS' : '❌ FAIL';
  if (status.includes('FAIL')) {
    allPassed = false;
    console.log(`  [Error details for ${route}]:`, errors);
  }

  console.log(`${status} Route: ${route.padEnd(20)} | Title: "${info.title?.slice(0, 35)}..." | Root Elements: ${info.rootChildren} | Errors: ${errors.length}`);

  await send('Target.closeTarget', { targetId });
}

console.log(`\nOverall E2E Smoke Test Result: ${allPassed ? 'ALL ROUTES PASSED ✅' : 'FAILURES DETECTED ❌'}`);
chrome.kill();
process.exit(allPassed ? 0 : 1);
