// 095-tester-diff.mjs — independent pixel-diff of the tester's own before/after
// native-resolution (1000x620) canvas buffers for streak=5, to confirm the delta is
// confined to the streak pill and matches the expected brass re-tint. Written
// independently of the developer's 095-diff.mjs (own harness, own save data).
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const DIR = path.resolve('company/assignments');

function dataUrl(file) {
  return `data:image/png;base64,${fs.readFileSync(path.join(DIR, file)).toString('base64')}`;
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const result = await page.evaluate(async ({ beforeUrl, afterUrl }) => {
    function load(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }
    const [imgB, imgA] = await Promise.all([load(beforeUrl), load(afterUrl)]);
    const w = imgB.width, h = imgB.height;
    const cb = document.createElement('canvas'); cb.width = w; cb.height = h;
    const ca = document.createElement('canvas'); ca.width = w; ca.height = h;
    const xb = cb.getContext('2d'); xb.drawImage(imgB, 0, 0);
    const xa = ca.getContext('2d'); xa.drawImage(imgA, 0, 0);
    const db = xb.getImageData(0, 0, w, h).data;
    const da = xa.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1, diffCount = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (db[i] !== da[i] || db[i + 1] !== da[i + 1] || db[i + 2] !== da[i + 2] || db[i + 3] !== da[i + 3]) {
          diffCount++;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    const sample = (x, y) => {
      const i = (y * w + x) * 4;
      return [db.slice(i, i + 4).join(','), da.slice(i, i + 4).join(',')];
    };
    // sample a few points inside the bbox: top (hi stop), mid, bottom (near shadow)
    const samples = diffCount ? {
      top: sample(Math.floor((minX + maxX) / 2), minY + 3),
      mid: sample(Math.floor((minX + maxX) / 2), Math.floor((minY + maxY) / 2)),
      bottom: sample(Math.floor((minX + maxX) / 2), maxY - 3),
    } : null;
    return { w, h, diffCount, bbox: diffCount ? { minX, minY, maxX, maxY } : null, samples };
  }, {
    beforeUrl: dataUrl('095-tester-before-streak5-native.png'),
    afterUrl: dataUrl('095-tester-after-streak5-native.png'),
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
