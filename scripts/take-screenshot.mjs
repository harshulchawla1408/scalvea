import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9224;
const ARTIFACT_DIR = "C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\8466fe9a-889f-4534-bbfc-51e49707b20c";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function capture(url, width, height, filename) {
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    `--window-size=${width},${height}`,
    "--user-data-dir=" + process.env.TEMP + "\\chrome_shot_" + Date.now(),
    url,
  ]);

  try {
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (tabs && tabs.length > 0) break;
      } catch {
        await sleep(300);
      }
    }

    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        callbacks.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });

    // Wait for fonts to finish rendering
    await sleep(2500);

    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });

    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
    console.log(`Saved screenshot to ${outPath}`);
    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  console.log("Capturing desktop typography screenshot...");
  await capture("http://localhost:4173/", 1440, 950, "desktop_typography.png");
  await sleep(1000);
  console.log("Capturing mobile typography screenshot...");
  await capture("http://localhost:4173/", 390, 844, "mobile_typography.png");
  await sleep(1000);
  console.log("Capturing scrolled desktop showcase screenshot...");
  // Capture scrolled showcase
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1440,1100",
    "--user-data-dir=" + process.env.TEMP + "\\chrome_shot_scroll_" + Date.now(),
    "http://localhost:4173/",
  ]);

  try {
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        if (tabs && tabs.length > 0) break;
      } catch {
        await sleep(300);
      }
    }
    const pageTab = tabs.find((t) => t.type === "page") || tabs[0];
    const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    await new Promise((resolve) => (ws.onopen = resolve));
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        callbacks.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }
    await send("Page.enable");
    await send("Runtime.enable");
    await sleep(2500);
    // Scroll down to the showcase
    await send("Runtime.evaluate", {
      expression: "window.scrollTo(0, 750);"
    });
    await sleep(1000);
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(ARTIFACT_DIR, "desktop_showcase.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved desktop_showcase.png");
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
