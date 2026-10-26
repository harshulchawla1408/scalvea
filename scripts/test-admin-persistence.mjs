import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import os from 'os';
import path from 'path';
import fs from 'fs';

console.log('=== SCALVEA ADMIN AUTH PERSISTENCE & ACCESS CONTROL TEST ===');

const tmpProfile = path.join(os.tmpdir(), 'scalvea-admin-test-profile-' + Date.now());
fs.mkdirSync(tmpProfile, { recursive: true });

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9228',
  '--disable-gpu',
  '--no-sandbox',
  `--user-data-dir=${tmpProfile}`
]);

await new Promise(r => setTimeout(r, 2000));

const versionRes = await fetch('http://127.0.0.1:9228/json/version');
const versionData = await versionRes.json();
const ws = new WebSocket(versionData.webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));

let id = 1;
const send = (method, params = {}) => new Promise((resolve) => {
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

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const pageWs = new WebSocket(`ws://127.0.0.1:9228/devtools/page/${targetId}`);
await new Promise(r => pageWs.on('open', r));

let pid = 1;
const sendPage = (method, params = {}) => new Promise((resolve) => {
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

await sendPage('Page.enable');
await sendPage('Runtime.enable');

// SCENARIO 1: Unauthenticated user visits /admin -> must redirect to /auth?returnTo=/admin
console.log('\n--- SCENARIO 1: Unauthenticated visit to /admin ---');
await sendPage('Page.navigate', { url: 'http://localhost:4173/admin' });
await new Promise(r => setTimeout(r, 2000));
let curUrl = await sendPage('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
console.log('Redirect URL:', curUrl?.result?.value);
const scenario1Pass = curUrl?.result?.value?.includes('/auth?returnTo=/admin') || curUrl?.result?.value?.includes('returnTo=%2Fadmin');
console.log('Scenario 1 (Unauthenticated redirected to /auth with returnTo=/admin):', scenario1Pass ? '✅ PASS' : '❌ FAIL');

// SCENARIO 2: Non-admin customer visits /admin -> must redirect to / with access denied
console.log('\n--- SCENARIO 2: Non-admin customer visit to /admin ---');
const customerSession = {
  access_token: "mock-customer-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-customer-refresh",
  user: {
    id: "regular-customer-uuid",
    aud: "authenticated",
    role: "authenticated",
    email: "customer@scalvea.com",
  },
};

await sendPage('Runtime.evaluate', {
  expression: `(() => {
    localStorage.setItem('sb-dtehgajreecaonqalxlf-auth-token', JSON.stringify(${JSON.stringify(customerSession)}));
  })()`,
  returnByValue: true
});

await sendPage('Page.navigate', { url: 'http://localhost:4173/admin' });
await new Promise(r => setTimeout(r, 2500));
let customerAdminUrl = await sendPage('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true });
console.log('Resulting pathname for regular customer:', customerAdminUrl?.result?.value);
const scenario2Pass = customerAdminUrl?.result?.value === '/';
console.log('Scenario 2 (Non-admin customer denied access and redirected to /):', scenario2Pass ? '✅ PASS' : '❌ FAIL');

chrome.kill();
try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}

const allPassed = scenario1Pass && scenario2Pass;
console.log(`\nOVERALL ADMIN AUTH TEST RESULT: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
process.exit(allPassed ? 0 : 1);
