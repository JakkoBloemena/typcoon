import { chromium } from 'playwright-core';
const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';

async function check(url) {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  const thirdParty = [];
  page.on('request', (r) => {
    try {
      const u = new URL(r.url());
      if (!u.hostname.endsWith('typcoon.com')) thirdParty.push(u.hostname);
    } catch {}
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  const cookies = await page.context().cookies();
  console.log(url, 'THIRD_PARTY_HOSTS', JSON.stringify([...new Set(thirdParty)]), 'COOKIES', JSON.stringify(cookies.map((c) => c.name)));
  await browser.close();
}

for (const url of ['https://typcoon.com/', 'https://typcoon.com/speel/', 'https://typcoon.com/blog/gratis-leren-typen-kind/', 'https://typcoon.com/voor-scholen/']) {
  await check(url);
}
