import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.JOYRELAY_URL ?? "http://127.0.0.1:5173";
const OUT = process.env.JOYRELAY_SCENES ?? path.resolve("docs/scenes");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, type: "png" });
  console.log("saved", file);
  return file;
}

async function click(page, selector) {
  await page.waitForSelector(selector, { visible: true, timeout: 8000 });
  await page.click(selector);
}

async function waitText(page, text, timeout = 12000) {
  await page.waitForFunction(
    (value) => (document.body.innerText || "").includes(value),
    { timeout },
    text,
  );
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--window-size=1440,900", "--hide-scrollbars", "--disable-gpu"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

await mkdir(OUT, { recursive: true });
const page = await browser.newPage();
page.setDefaultTimeout(12000);

try {
  await page.goto(`${BASE}/?demo=true`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hero h1");
  await shot(page, "scene-01");

  await click(page, '[data-testid="search-from"]');
  await click(page, '[data-testid="origin-Singapore"]');
  await click(page, '[data-testid="destination-Tokyo"]');
  await click(page, '[data-testid="dates-next_week"]');
  await click(page, '[data-testid="budget-200"]');
  await click(page, '[data-testid="location-transit"]');
  await click(page, '[data-testid="arrival-late"]');
  await click(page, '[data-testid="style-balanced"]');
  await shot(page, "scene-02");

  await click(page, '[data-testid="handoff-cta"]');
  await new Promise((r) => setTimeout(r, 180));
  await shot(page, "scene-03");

  await waitText(page, "Mitsui Garden Hotel Kyobashi", 15000);
  await page.waitForSelector(".rejected", { timeout: 8000 });
  await shot(page, "scene-04");

  await click(page, '[data-testid="budget-150"]');
  await page.waitForSelector(".delta-card");
  await waitText(page, "$200 → $150");
  await shot(page, "scene-05");

  await click(page, '[data-testid="handoff-cta"]');
  await waitText(page, "Sotetsu Fresa Inn Kanda", 15000);
  await waitText(page, "$136");
  await shot(page, "scene-06");

  await page.goto(`${BASE}/?debug=true`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".debug");
  const debug = await page.$(".debug");
  await debug.screenshot({ path: path.join(OUT, "debug.png") });

  console.log("OK");
} catch (error) {
  console.error("FAIL", error);
  try {
    if (!page.isClosed()) await shot(page, "failure");
  } catch {
    // ignore secondary screenshot errors
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
