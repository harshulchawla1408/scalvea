import { spawn } from 'child_process';
import { WebSocket } from 'ws';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--disable-gpu',
  '--no-sandbox'
]);

await new Promise(r => setTimeout(r, 1500));

const versionRes = await fetch('http://127.0.0.1:9226/json/version');
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

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const pageWs = new WebSocket(`ws://127.0.0.1:9226/devtools/page/${targetId}`);
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

await sendPage('Page.enable');
await sendPage('Runtime.enable');

console.log('=== SCALVEA E-COMMERCE FLOW VERIFICATION ===');

// 1. Test Homepage load
await sendPage('Page.navigate', { url: 'http://localhost:4173/' });
await new Promise(r => setTimeout(r, 2000));

// 2. Test Currency & Country Context
const countryCheck = await sendPage('Runtime.evaluate', {
  expression: `(() => {
    const stored = localStorage.getItem('scalvea_country');
    return { storedCountry: stored, inrElements: document.body.innerText.includes('₹') || document.body.innerText.includes('INR'), audElements: document.body.innerText.includes('A$') || document.body.innerText.includes('AUD') };
  })()`,
  returnByValue: true
});
console.log('1. Country & Currency check:', countryCheck?.result?.value);

// 3. Test Dynamic PDF Import on Demand
const pdfDynamicCheck = await sendPage('Runtime.evaluate', {
  expression: `(async () => {
    try {
      const { generateInvoicePDF } = await import('/assets/generateInvoicePDF-meeFIUG7.js');
      return { dynamicImportSuccess: typeof generateInvoicePDF === 'function' };
    } catch (e) {
      // Find current asset path dynamically
      const script = document.querySelector('script[type="module"]');
      return { error: e.message };
    }
  })()`,
  awaitPromise: true,
  returnByValue: true
});
console.log('2. Dynamic PDF Module check:', pdfDynamicCheck?.result?.value);

// 4. Test Cart Drawer lazy import
const cartDrawerCheck = await sendPage('Runtime.evaluate', {
  expression: `(async () => {
    try {
      // Find all loaded scripts
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
      const cartScriptsBefore = scripts.filter(s => s.includes('CartDrawer'));
      return { cartLoadedBeforeClick: cartScriptsBefore.length > 0 };
    } catch (e) {
      return { error: e.message };
    }
  })()`,
  awaitPromise: true,
  returnByValue: true
});
console.log('3. Cart Drawer lazy isolation check:', cartDrawerCheck?.result?.value);

// 5. Test Admin route load
await sendPage('Page.navigate', { url: 'http://localhost:4173/admin' });
await new Promise(r => setTimeout(r, 2000));
const adminCheck = await sendPage('Runtime.evaluate', {
  expression: `({ title: document.title, hasAdminAuth: document.body.innerText.includes('Admin') || document.body.innerText.includes('Sign') || document.body.innerText.includes('Login') })`,
  returnByValue: true
});
console.log('4. Admin Route check:', adminCheck?.result?.value);

chrome.kill();
process.exit(0);
