import { spawn } from "child_process";
import http from "http";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9223;
const TARGET_URL = "http://localhost:4173/";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("=== SCALVEA E-COMMERCE & TRACKING VERIFICATION SUITE ===");
  console.log("Starting Chrome with DevTools Protocol...");

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--user-data-dir=" + process.env.TEMP + "\\chrome_test_profile_" + Date.now(),
    TARGET_URL,
  ]);

  try {
    // Wait for CDP to be available
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (tabs && tabs.length > 0) break;
      } catch {
        await sleep(500);
      }
    }

    if (!tabs || tabs.length === 0) {
      throw new Error("Could not connect to Chrome DevTools port");
    }

    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const wsUrl = pageTab.webSocketDebuggerUrl;
    console.log("Connected to page tab via WebSocket:", wsUrl);

    // Dynamically import ws or create simple WS client
    // Since Node 22+ or native WebSocket might be available:
    const WebSocketClient = globalThis.WebSocket;
    if (!WebSocketClient) {
      throw new Error("Native WebSocket not available in this Node runtime");
    }

    const ws = new WebSocketClient(wsUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand("Runtime.enable");
    await sendCommand("Page.enable");

    // Wait for hydration and scripts to initialize
    console.log("Waiting 3s for page hydration and tracking scripts...");
    await sleep(3000);

    // 1. Verify GTM dataLayer
    const dataLayerRes = await sendCommand("Runtime.evaluate", {
      expression: `JSON.stringify(window.dataLayer || [])`,
      returnByValue: true,
    });
    const dataLayer = JSON.parse(dataLayerRes.result.value || "[]");
    console.log(`\n[GTM VERIFICATION]`);
    console.log(`Total dataLayer items recorded: ${dataLayer.length}`);
    const gtmEvents = dataLayer.map((d) => d.event || "generic_push");
    console.log("dataLayer events caught:", gtmEvents);

    // 2. Verify Meta Pixel fbq
    const fbqRes = await sendCommand("Runtime.evaluate", {
      expression: `JSON.stringify({
        fbqExists: typeof window.fbq === 'function',
        fbqLoaded: window.fbq ? window.fbq.loaded : false,
        fbqVersion: window.fbq ? window.fbq.version : null,
        queueLength: (window.fbq && window.fbq.queue) ? window.fbq.queue.length : 0
      })`,
      returnByValue: true,
    });
    const fbqStatus = JSON.parse(fbqRes.result.value);
    console.log(`\n[META PIXEL VERIFICATION]`);
    console.log("Meta Pixel status:", fbqStatus);

    // 3. Verify Microsoft Clarity
    const clarityRes = await sendCommand("Runtime.evaluate", {
      expression: `JSON.stringify({
        clarityExists: typeof window.clarity === 'function',
        clarityScriptTags: Array.from(document.querySelectorAll('script[src*="clarity"]')).map(s => s.src)
      })`,
      returnByValue: true,
    });
    const clarityStatus = JSON.parse(clarityRes.result.value);
    console.log(`\n[MICROSOFT CLARITY VERIFICATION]`);
    console.log("Clarity status:", clarityStatus);

    // 4. Test E-Commerce Events in dataLayer and Meta Pixel
    console.log(`\n[TESTING E-COMMERCE TRACKING CALLS]`);
    const triggerRes = await sendCommand("Runtime.evaluate", {
      expression: `(function() {
        const results = [];
        
        // Test GA4 view_item event
        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: "view_item",
            ecommerce: {
              currency: "AUD",
              value: 89.00,
              items: [{
                item_id: "follicle-8",
                item_name: "Follicle 8 Serum",
                price: 89.00,
                quantity: 1
              }]
            }
          });
          results.push("Pushed view_item to dataLayer");
        }

        // Test Meta Pixel ViewContent event
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'ViewContent', {
            content_name: 'Follicle 8 Serum',
            content_ids: ['follicle-8'],
            content_type: 'product',
            value: 89.00,
            currency: 'AUD'
          });
          results.push("Fired fbq ViewContent");
        }

        // Test GA4 add_to_cart event
        if (typeof window.dataLayer !== 'undefined') {
          window.dataLayer.push({ ecommerce: null });
          window.dataLayer.push({
            event: "add_to_cart",
            ecommerce: {
              currency: "AUD",
              value: 89.00,
              items: [{
                item_id: "follicle-8",
                item_name: "Follicle 8 Serum",
                price: 89.00,
                quantity: 1
              }]
            }
          });
          results.push("Pushed add_to_cart to dataLayer");
        }

        // Test Meta Pixel AddToCart event
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'AddToCart', {
            content_name: 'Follicle 8 Serum',
            content_ids: ['follicle-8'],
            content_type: 'product',
            value: 89.00,
            currency: 'AUD'
          });
          results.push("Fired fbq AddToCart");
        }

        return results;
      })()`,
      returnByValue: true,
    });
    console.log("Trigger test results:", triggerRes.result.value);

    // 5. Test Country Detection State & Persistence
    const geoRes = await sendCommand("Runtime.evaluate", {
      expression: `JSON.stringify({
        scalveaCountry: localStorage.getItem('scalvea-country'),
        scalveaMarket: localStorage.getItem('scalvea-market'),
        scalveaManual: localStorage.getItem('scalvea-country-manual'),
        popupInDom: !!document.querySelector('.fixed.bottom-4.right-4'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })`,
      returnByValue: true,
    });
    const geoStatus = JSON.parse(geoRes.result.value);
    console.log(`\n[COUNTRY DETECTION & POPUP VERIFICATION]`);
    console.log("Country state:", geoStatus);

    ws.close();
    console.log("\nAll tracking and country tests completed successfully!");
  } finally {
    chromeProc.kill();
  }
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
