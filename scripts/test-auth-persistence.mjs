import { spawn } from 'child_process';
import { WebSocket } from 'ws';

console.log('=== SCALVEA AUTH SESSION PERSISTENCE & LIFECYCLE TEST SUITE ===');

// Launch headless chrome with a persistent user data directory to test browser restarts!
import os from 'os';
import path from 'path';
import fs from 'fs';

const tmpProfile = path.join(os.tmpdir(), 'scalvea-auth-test-profile-' + Date.now());
fs.mkdirSync(tmpProfile, { recursive: true });

function launchChrome() {
  return spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tmpProfile}`
  ]);
}

let chrome = launchChrome();
await new Promise(r => setTimeout(r, 2000));

async function getCDP() {
  const versionRes = await fetch('http://127.0.0.1:9227/json/version');
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
  const pageWs = new WebSocket(`ws://127.0.0.1:9227/devtools/page/${targetId}`);
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

  return { ws, pageWs, send, sendPage, targetId };
}

let cdp = await getCDP();

// TEST 1: Unauthenticated visit to /account -> verify clean redirect to /auth?returnTo=/account (no loop!)
console.log('\n--- TEST 1: Unauthenticated visit to /account ---');
await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/account' });
await new Promise(r => setTimeout(r, 2000));
let curUrl = await cdp.sendPage('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
console.log('Result URL:', curUrl?.result?.value);
const test1Pass = curUrl?.result?.value?.includes('/auth');
console.log('Test 1 (Clean redirect to /auth on unauthenticated visit):', test1Pass ? '✅ PASS' : '❌ FAIL');

// TEST 2: Inject mock valid Supabase session into localStorage
console.log('\n--- TEST 2: Session Persistence across Page Reloads ---');
const mockUser = {
  id: "test-user-id-12345",
  aud: "authenticated",
  role: "authenticated",
  email: "customer@scalvea.com",
  user_metadata: { full_name: "Scalvea Customer" },
  app_metadata: { provider: "email", providers: ["email"] },
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: "mock-valid-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-valid-refresh-token",
  user: mockUser,
};

// Set session in localStorage under the exact Supabase key
await cdp.sendPage('Runtime.evaluate', {
  expression: `(() => {
    localStorage.setItem('sb-dtehgajreecaonqalxlf-auth-token', JSON.stringify(${JSON.stringify(mockSession)}));
    return localStorage.getItem('sb-dtehgajreecaonqalxlf-auth-token') !== null;
  })()`,
  returnByValue: true
});

// Navigate to /account with session in storage
console.log('Navigating to /account with active session in localStorage...');
await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/account' });
await new Promise(r => setTimeout(r, 2500));

let accountUrl = await cdp.sendPage('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true });
let accountTitle = await cdp.sendPage('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
let accountDom = await cdp.sendPage('Runtime.evaluate', {
  expression: `(() => ({
    url: window.location.href,
    isAtAccount: window.location.pathname === '/account',
    hasSignOutBtn: document.body.innerText.includes('Sign Out') || document.body.innerText.includes('Signed out'),
    bodyPreview: document.body.innerText.slice(0, 150).replace(/\\n/g, ' ')
  }))()`,
  returnByValue: true
});
console.log('Account Page State:', accountDom?.result?.value);
const test2Pass = accountDom?.result?.value?.isAtAccount;
console.log('Test 2 (Stayed on /account without being kicked to /auth):', test2Pass ? '✅ PASS' : '❌ FAIL');

// TEST 3: Reload /account 3 times consecutively (verify ZERO redirect loops or flickering)
console.log('\n--- TEST 3: Consecutive Page Refreshes on /account ---');
let allRefreshesPass = true;
for (let i = 1; i <= 3; i++) {
  await cdp.sendPage('Page.reload');
  await new Promise(r => setTimeout(r, 1500));
  let refreshUrl = await cdp.sendPage('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true });
  console.log(`  Reload #${i} pathname:`, refreshUrl?.result?.value);
  if (refreshUrl?.result?.value !== '/account') allRefreshesPass = false;
}
console.log('Test 3 (3 consecutive reloads preserved session on /account):', allRefreshesPass ? '✅ PASS' : '❌ FAIL');

// TEST 4: Navigation across routes (Home -> Shop -> Account)
console.log('\n--- TEST 4: Inter-route Navigation ---');
await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/' });
await new Promise(r => setTimeout(r, 1200));
await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/shop' });
await new Promise(r => setTimeout(r, 1200));
await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/account' });
await new Promise(r => setTimeout(r, 1500));
let afterNav = await cdp.sendPage('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true });
console.log('Pathname after navigating / -> /shop -> /account:', afterNav?.result?.value);
const test4Pass = afterNav?.result?.value === '/account';
console.log('Test 4 (Session survived inter-route navigation):', test4Pass ? '✅ PASS' : '❌ FAIL');

// TEST 5: Browser Restart Simulation (Kill Chrome, relaunch with same profile directory)
console.log('\n--- TEST 5: Browser Restart Simulation ---');
cdp.ws.close();
chrome.kill();
await new Promise(r => setTimeout(r, 2000));

console.log('Relaunching Chrome with persistent profile directory...');
chrome = launchChrome();
await new Promise(r => setTimeout(r, 2000));
cdp = await getCDP();

await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/account' });
await new Promise(r => setTimeout(r, 2500));
let afterRestart = await cdp.sendPage('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true });
console.log('Pathname after complete browser restart:', afterRestart?.result?.value);
const test5Pass = afterRestart?.result?.value === '/account';
console.log('Test 5 (Session persisted across browser restart):', test5Pass ? '✅ PASS' : '❌ FAIL');

// TEST 6: Intentional Sign Out
console.log('\n--- TEST 6: Intentional Sign Out ---');
await cdp.sendPage('Runtime.evaluate', {
  expression: `(() => {
    localStorage.removeItem('sb-dtehgajreecaonqalxlf-auth-token');
  })()`,
  returnByValue: true
});
await cdp.sendPage('Page.navigate', { url: 'http://localhost:4173/account' });
await new Promise(r => setTimeout(r, 2000));
let afterSignOut = await cdp.sendPage('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true });
console.log('Pathname after sign out:', afterSignOut?.result?.value);
const test6Pass = afterSignOut?.result?.value === '/auth';
console.log('Test 6 (Intentional sign out redirected to /auth and remained logged out):', test6Pass ? '✅ PASS' : '❌ FAIL');

chrome.kill();
try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (_) {}

const allPassed = test1Pass && test2Pass && allRefreshesPass && test4Pass && test5Pass && test6Pass;
console.log(`\n======================================================`);
console.log(`OVERALL AUTH PERSISTENCE TEST RESULT: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
console.log(`======================================================`);

process.exit(allPassed ? 0 : 1);
