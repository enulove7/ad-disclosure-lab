// 전체 흐름 E2E 스모크 테스트. 개발 서버(npm run dev)를 띄운 뒤: node scripts/e2e/flow.mjs
// 환경변수: ADMIN_PASSWORD, BASE_URL(선택, 기본 localhost:3000), CHROME_PATH(선택), SHOTS_DIR(선택), E2E_SLUG(선택), E2E_LOCALE=ja|ko(선택)
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? "scripts/e2e/shots";
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
// 배포 환경은 콜드 스타트가 있어 여유 있게 기다린다
const TIMEOUT = Number(process.env.E2E_TIMEOUT_MS ?? 90000);
ctx.setDefaultTimeout(TIMEOUT);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text()); });

// 1. admin login
await page.goto(`${BASE}/admin`);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "change-me");
await page.click('form:has(input[name="password"]) button[type="submit"]');
await page.waitForURL(`${BASE}/admin`);
console.log("login ok");
// 관리자 언어 토글: 실험 언어와 같은 언어로 관리자 화면 전환
await page.click(`form:has(input[name="locale"][value="${process.env.E2E_LOCALE ?? "ja"}"]) button`);
await page.waitForURL(`${BASE}/admin`);

// 2. create experiment with presets
await page.click('a[href="/admin/new"]');
await page.fill('input[name="title"]', `E2E ${process.env.E2E_LOCALE ?? 'ja'}`);
const SLUG = process.env.E2E_SLUG ?? `e2e-${Date.now().toString(36)}`;
  await page.fill('input[name="slug"]', SLUG);
await page.selectOption('select[name="locale"]', process.env.E2E_LOCALE ?? 'ja');
await page.click('form:has(input[name="title"]) button');
await page.waitForURL(/\/admin\/[0-9a-f-]+$/);
const expUrl = page.url();
console.log("created", expUrl);
await page.screenshot({ path: `${SHOTS}/01-overview.png`, fullPage: true });

// 3. set active + min exposure 2s
await page.selectOption('select[name="status"]', "active");
await page.fill('input[name="min_exposure_seconds"]', "2");
await page.click('form:has(select[name="status"]) button');
await page.waitForSelector('p.text-green-700');
console.log("activated");

// 4. preview tab screenshot
await page.goto(`${expUrl}/preview`);
await page.waitForSelector('text=C3');
await page.screenshot({ path: `${SHOTS}/02-preview.png`, fullPage: true });
await page.goto(`${expUrl}/conditions`);
await page.screenshot({ path: `${SHOTS}/03-conditions.png`, fullPage: true });
await page.goto(`${expUrl}/survey`);
await page.screenshot({ path: `${SHOTS}/04-survey.png`, fullPage: false });

// 5. participant flow (new context = new participant)
async function runParticipant(n) {
  const pctx = await browser.newContext({ viewport: { width: 420, height: 860 }, isMobile: true });
  pctx.setDefaultTimeout(TIMEOUT);
  const p = await pctx.newPage();
  p.on("pageerror", (e) => console.log("P PAGEERROR", e.message));
  await p.goto(`${BASE}/p/${SLUG}`);
  if (n === 1) await p.screenshot({ path: `${SHOTS}/10-consent.png`, fullPage: true });
  await p.click('button[type="submit"]');
  await p.waitForURL(`${BASE}/p/${SLUG}/pre`);
  // try submitting empty to check validation
  if (n === 1) {
    await p.click('button[type="submit"]');
    await p.waitForSelector('[data-survey-error]');
    console.log("validation ok");
  }
  // fill pre
  for (const fs of await p.$$("fieldset")) {
    const radios = await fs.$$('input[type="radio"]');
    if (radios.length) await radios[Math.floor(Math.random() * radios.length)].check();
  }
  if (n === 1) await p.screenshot({ path: `${SHOTS}/11-pre.png`, fullPage: true });
  await p.click('button[type="submit"]');
  await p.waitForURL(new RegExp(`/p/${SLUG}/ad/1$`));
  // ads
  for (let i = 1; i <= 2; i++) {
    await p.waitForURL(new RegExp(`/p/${SLUG}/ad/${i}$`));
    if (n === 1 && i === 1) await p.screenshot({ path: `${SHOTS}/12-ad-waiting.png`, fullPage: true });
    await p.waitForSelector('form fieldset', { timeout: 10000 });
    for (const fs of await p.$$("fieldset")) {
      const radios = await fs.$$('input[type="radio"]');
      if (radios.length) await radios[Math.floor(Math.random() * radios.length)].check();
    }
    if (n === 1 && i === 1) await p.screenshot({ path: `${SHOTS}/13-ad-survey.png`, fullPage: true });
    await p.click('button[type="submit"]');
    await p.waitForURL((u) => !u.pathname.endsWith(`/ad/${i}`));
  }
  await p.waitForURL(`${BASE}/p/${SLUG}/final`);
  for (const fs of await p.$$("fieldset")) {
    const radios = await fs.$$('input[type="radio"]');
    if (radios.length) await radios[0].check();
    const ta = await fs.$("textarea");
    if (ta) await ta.fill("テスト, 自由記述 \"引用\"");
  }
  await p.click('button[type="submit"]');
  await p.waitForURL(`${BASE}/p/${SLUG}/done`);
  if (n === 1) await p.screenshot({ path: `${SHOTS}/14-done.png`, fullPage: true });
  // revisiting consent should go to done
  await p.goto(`${BASE}/p/${SLUG}`);
  await p.waitForURL(`${BASE}/p/${SLUG}/done`);
  await pctx.close();
  console.log(`participant ${n} done`);
}
for (let i = 1; i <= 5; i++) await runParticipant(i);

// 6. admin participants + export
await page.goto(`${expUrl}/participants`);
await page.screenshot({ path: `${SHOTS}/20-participants.png`, fullPage: true });
await page.goto(expUrl);
await page.screenshot({ path: `${SHOTS}/21-overview-after.png`, fullPage: true });
const cookies = await ctx.cookies();
const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
for (const f of ["long", "wide"]) {
  const res = await fetch(`${expUrl}/export?format=${f}`, { headers: { cookie: cookieHeader } });
  const text = await res.text();
  const lines = text.split("\r\n");
  console.log(`export ${f}: status ${res.status}, rows ${lines.length - 1}, cols ${lines[0].split(",").length}`);
  console.log("  header:", lines[0].slice(0, 200));
  console.log("  row1:", lines[1].slice(0, 200));
}
const unauth = await fetch(`${expUrl}/export?format=long`, { redirect: "manual" });
console.log("export without cookie:", unauth.status);
await browser.close();
