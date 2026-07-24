// 095-diff.mjs — pixel-diffs the 095-before-streak5.png / 095-after-streak5.png
// evidence pair (company/assignments/095-sharecard-streak-colors-stale-vs-brass-tokens.md)
// and reports the bounding box + a handful of sampled colours inside it, to confirm
// the only change is the streak pill (warm orange -> brass) and nothing else moved.
// Not part of pass/fail verification; throwaway evidence-checking script.
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
    return {
      w, h, diffCount,
      bbox: diffCount ? { minX, minY, maxX, maxY } : null,
      centerSample: diffCount ? sample(Math.floor((minX + maxX) / 2), Math.floor((minY + maxY) / 2)) : null,
    };
  }, {
    beforeUrl: dataUrl('095-before-streak5.png'),
    afterUrl: dataUrl('095-after-streak5.png'),
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
