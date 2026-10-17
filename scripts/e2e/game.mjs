// 게임 E2E: 관리자에서 게임·카드 만들기 → 참가자 플레이 → 결과 → 관리자 통계
// 환경변수: ADMIN_PASSWORD, BASE_URL(선택), CHROME_PATH(선택), SHOTS_DIR(선택), E2E_LOCALE=ja|ko(선택)
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? "scripts/e2e/shots-game";
const LOCALE = process.env.E2E_LOCALE ?? "ko";
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
ctx.setDefaultTimeout(Number(process.env.E2E_TIMEOUT_MS ?? 90000));
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

await page.goto(`${BASE}/admin`);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD ?? "change-me");
await page.click('form:has(input[name="password"]) button[type="submit"]');
await page.waitForURL(`${BASE}/admin`);
await page.click(`form:has(input[name="locale"][value="${LOCALE}"]) button`);
await page.waitForURL(`${BASE}/admin`);
await page.goto(`${BASE}/admin/games`);
const slug = `game-${Date.now().toString(36)}`;
await page.fill('input[name="title"]', LOCALE === "ja" ? "AIか人か？広告クイズ" : "AI일까 사람일까? 광고 퀴즈");
await page.fill('input[name="slug"]', slug);
await page.selectOption('select[name="locale"]', LOCALE);
await page.click('form:has(input[name="title"]) button');
await page.waitForURL(/\/admin\/games\/[0-9a-f-]+$/);
const gameUrl = page.url();
console.log("game", gameUrl);

// 카드 4장: 2장 사람(플레이스홀더 URL), 2장 AI(생성)
const addCard = async (brand, isAi, url) => {
  const form = page.locator("form").filter({ has: page.locator('input[name="brand_name"]') }).last();
  await form.locator('input[name="brand_name"]').fill(brand);
  await form.locator('input[name="headline"]').fill(`${brand} headline`);
  await form.locator('select[name="is_ai"]').selectOption(String(isAi));
  await form.locator('input[name="image_url"]').fill(url);
  await form.locator('input[name="source_note"]').fill(isAi ? "" : "test placeholder");
  await form.locator("button").click();
  await page.waitForTimeout(1500);
};
await addCard("HUMAN-A", false, "/demo/ad-outerwear.svg");
await addCard("HUMAN-B", false, "/demo/ad-basics.svg");
await addCard("AI-A", true, "");
await addCard("AI-B", true, "");
// AI 카드 2장 생성
for (let i = 0; i < 2; i++) {
  const gens = page.locator('form:has(textarea[name="prompt"])');
  const n = await gens.count();
  const g = gens.nth(n - 2 + i);
  await g.locator("button").click();
  await g.locator("p.text-green-700, p.text-red-600").first().waitFor();
  console.log(`gen ${i + 1}:`, await g.locator("p.text-green-700, p.text-red-600").first().textContent());
}
// 공개 + 4장
await page.selectOption('select[name="status"]', "active");
await page.fill('input[name="cards_per_round"]', "4");
await page.click('form:has(select[name="status"]) button');
await page.waitForSelector("p.text-green-700");
await page.screenshot({ path: `${SHOTS}/admin-game.png`, fullPage: true });

// 참가자 3명 플레이
async function play(n) {
  const pctx = await browser.newContext({ viewport: { width: 420, height: 860 }, isMobile: true });
  pctx.setDefaultTimeout(Number(process.env.E2E_TIMEOUT_MS ?? 90000));
  const p = await pctx.newPage();
  p.on("pageerror", (e) => console.log("P PAGEERROR", e.message));
  await p.goto(`${BASE}/g/${slug}`);
  if (n === 1) await p.screenshot({ path: `${SHOTS}/10-intro.png`, fullPage: true });
  await p.click('button[type="submit"]');
  await p.waitForURL(`${BASE}/g/${slug}/play`);
  for (let i = 0; i < 4; i++) {
    // 호감도(전)
    await p.locator("section button").nth(Math.floor(Math.random() * 7)).click();
    if (n === 1 && i === 0) await p.screenshot({ path: `${SHOTS}/11-guess.png`, fullPage: true });
    // 판정
    const btns = p.locator("section button");
    await btns.nth(Math.random() < 0.5 ? 0 : 1).click();
    if (n === 1 && i === 0) await p.screenshot({ path: `${SHOTS}/12-reveal.png`, fullPage: true });
    await p.locator("section button").first().click(); // 次へ → after
    await p.locator("section button").nth(Math.floor(Math.random() * 7)).click();
    if (n === 1 && i === 0) await p.screenshot({ path: `${SHOTS}/13-after.png`, fullPage: true });
    await p.locator("section button").last().click(); // 次へ / 結果
    await p.waitForTimeout(800);
  }
  await p.waitForURL(`${BASE}/g/${slug}/result`);
  if (n === 1) await p.screenshot({ path: `${SHOTS}/14-result.png`, fullPage: true });
  const body = await p.textContent("main");
  console.log(`player ${n}:`, body.replace(/\s+/g, " ").slice(0, 120));
  await pctx.close();
}
for (let i = 1; i <= 3; i++) await play(i);

await page.goto(gameUrl);
await page.screenshot({ path: `${SHOTS}/admin-game-stats.png`, fullPage: true });
console.log("stats:", (await page.textContent("main")).replace(/\s+/g, " ").slice(0, 200));
await browser.close();
