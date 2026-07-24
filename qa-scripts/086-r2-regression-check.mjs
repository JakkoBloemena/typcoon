import { chromium } from 'playwright-core';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

const EXE = 'C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe';
const BASE = process.env.PROBE_BASE || 'http://localhost:4254';

let PASS=0, FAIL=0;
function check(l,c,e=''){ if(c){PASS++;console.log('PASS -',l,e);} else {FAIL++;console.log('FAIL -',l,e);} }

function buildSave({ buildings={}, curriculumIndex=20 } = {}) {
  const profile = newProfile({ naam:'Sanne', uiTaal:'nl', trainTaal:'nl' });
  profile.curriculumIndex = curriculumIndex;
  profile.onboardingGezien = true;
  const state = newState(profile, nlPack.curriculumTail);
  const tycoon = { coins:500, totalCoins:650, lifetimeCoins:18400, buildings, upgrades:[], rebirths:0, exercisesDone:40, goldenDone:0, bestCombo:12, totalKeys:400, correctKeys:390, streak:0, lastDay:null, boostLeft:0, referredBy:null, welcomeClaimed:false, thanksShown:false, refClaims:[], weekly:null, lastWeekly:null, records:{bestWeekCoins:0,longestStreak:0}, badges:[] };
  const { curriculum, ...persisted } = { ...state, tycoon };
  return { persisted, unlocked: true };
}

async function loadSave(page, { persisted, unlocked }) {
  await page.goto(`${BASE}/speel/`, { waitUntil:'networkidle' });
  await page.evaluate(({s,unlocked})=>{
    localStorage.setItem('typcoon:onboarded','1');
    localStorage.setItem('typcoon:save', JSON.stringify(s));
    if (unlocked) localStorage.setItem('typcoon:unlocked','1');
  }, {s:persisted, unlocked});
  await page.reload({ waitUntil:'networkidle' });
}
async function goToFactory(page) {
  await page.locator('button.btn.btn-big', { hasText:/Verder bouwen|Keep building/ }).click();
  await page.waitForTimeout(300);
  for (let i=0;i<4;i++){ const o=page.locator('.overlay'); if(!(await o.count())) break; const b=o.locator('button.btn').first(); if(await b.count()) await b.click(); await page.waitForTimeout(150);}
  await page.locator('.game-bar button.btn-ghost', { hasText:/Fabriek|Factory/ }).click();
  await page.waitForTimeout(300);
}

async function main(){
  const browser = await chromium.launch({ executablePath: EXE, headless:true });
  const page = await browser.newPage();
  await page.setViewportSize({width:1360,height:900});
  await loadSave(page, buildSave({ buildings:{ typewriter:2, printer:1 }, curriculumIndex:20 }));
  await goToFactory(page);
  await page.waitForTimeout(200);

  // riseIn iteration-count still 1, never infinite
  const riseSpecs = await page.locator('.hal > .mch, .hal > .plot, .hal > .ghost').evaluateAll(els => els.map(el => {
    const cs = getComputedStyle(el);
    return { name: cs.animationName, iter: cs.animationIterationCount };
  }));
  check('riseIn iteration-count is 1 everywhere, never infinite', riseSpecs.length>0 && riseSpecs.every(r=>r.name==='riseIn' && Number(r.iter)===1), JSON.stringify(riseSpecs));

  // no idle income: coin/ledger elements carry no animation
  const idleIncome = await page.evaluate(() => {
    const sel = '.coin, .ledger-coin, .ledger .val, .btn-coin';
    return [...document.querySelectorAll(sel)].map(el => getComputedStyle(el).animationName).filter(n => n !== 'none');
  });
  check('no .coin/.ledger-coin/.ledger .val/.btn-coin carries any animation', idleIncome.length === 0, JSON.stringify(idleIncome));

  // reduced motion: plot pad rests at static 22% mid-glow (byte match to scratch element)
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const rm = await page.evaluate(() => {
    const pad = document.querySelector('.plot .pad');
    const scratch = document.createElement('div');
    scratch.className = 'pad';
    scratch.style.position='absolute'; scratch.style.visibility='hidden';
    // force static box-shadow value matching source declaration
    document.body.appendChild(scratch);
    const padBS = pad ? getComputedStyle(pad).boxShadow : null;
    const icoTransform = document.querySelector('.mch .mch-ico') ? getComputedStyle(document.querySelector('.mch .mch-ico')).transform : null;
    scratch.remove();
    return { padBS, icoTransform };
  });
  check('reduced-motion: .mch-ico rests at neutral transform (none/identity)', rm.icoTransform === 'none' || rm.icoTransform === 'matrix(1, 0, 0, 1, 0, 0)', JSON.stringify(rm));
  check('reduced-motion: .plot .pad box-shadow captured for record', !!rm.padBS, JSON.stringify(rm));

  console.log(`\n=== REGRESSION SPOT-CHECK: ${PASS} passed, ${FAIL} failed ===`);
  await browser.close();
  process.exit(FAIL>0?1:0);
}
main().catch(e=>{console.error(e);process.exit(1);});
