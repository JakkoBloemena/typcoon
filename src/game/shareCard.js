// shareCard.js — "Deel je fabriek" (REVENUE.md §5, virality-item uit het charter).
// Tekent de fabriekstaat (machines, munten, streak) als canvas-plaatje dat de ouder
// lokaal kan downloaden. Volledig client-side: geen netwerk, geen account nodig, geen
// social-SDK (guardrail 1). Geen kind-PII: de naam komt er alleen op als de ouder dat
// expliciet aanzet in ShareCard.jsx, ná het zien van de exacte kaart (child-safety-eis
// van assignment 024) — buildShareData() hieronder is de enige plek die dat beslist.
//
// De kleuren/fonts hieronder zijn 1-op-1 gekopieerd uit game.css (:root-tokens +
// .coin-pill/.cps-pill/.streak-pill/.dash-tile/.home-title) — canvas kan geen CSS
// custom properties lezen, dus dit is de enige plek waar die waarden letterlijk
// terugkomen. Wijzig hier mee als het thema in game.css verandert.

import { BUILDINGS, coinsPerSecond } from './economy.js';
import { fmt } from './format.js';
import { gt } from './strings.js';

export const CARD_W = 1000;
export const CARD_H = 620;

// game.css :root
const NIGHT = '#101a3d';
const PANEL = '#1b2650';
const PANEL_2 = '#16204a';
const LINE = '#33407c';
const BRASS = '#ffb915';
const BRASS_HI = '#ffd25e';
const BRASS_DEEP = '#c67f00';
const MINT = '#33e6a0';
const PAPER = '#f4f7ff';
const INK_DIM = '#93a2d8';
const INK_ON_BRASS = '#3d2c00';  // .btn color
const STREAK_TEXT = '#5a2a00';   // .streak-pill color
const STREAK_HI = '#ffd0a0';     // .streak-pill gradient stop
const STREAK_LO = '#ff9f43';
const STREAK_SHADOW = '#b5651d';
const PANEL_SHADOW = '#0c1430';

// Fabriekstaat -> platte data voor de kaart (geen canvas/DOM erin — apart testbaar,
// zie test/shareCard.test.js). `includeNaam` is de expliciete ouder-keuze (default
// uit in ShareCard.jsx); zonder toestemming bevat de kaart geen enkel kind-veld.
export function buildShareData(tycoon, profile, includeNaam) {
  const buildings = (tycoon && tycoon.buildings) || {};
  const machines = BUILDINGS
    .map((b) => ({ id: b.id, icon: b.icon, level: buildings[b.id] || 0 }))
    .filter((m) => m.level > 0);
  return {
    naam: includeNaam ? (profile && profile.naam) || null : null,
    coins: Math.floor((tycoon && tycoon.coins) || 0),
    cps: Math.round(coinsPerSecond(tycoon || {})),
    streak: (tycoon && tycoon.streak) || 0,
    rebirths: (tycoon && tycoon.rebirths) || 0,
    machines,
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pill(ctx, x, y, w, h, { grad, shadow, border }) {
  ctx.save();
  ctx.fillStyle = shadow;
  roundRect(ctx, x, y + 4, w, h, h / 2);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, grad[0]);
  g.addColorStop(1, grad[1]);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
}

// Tekent de volledige kaart op een <canvas width=CARD_W height=CARD_H>. Enige
// neveneffect is canvas-tekenen; de input (data) komt uit buildShareData().
export function drawShareCard(canvas, data) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // achtergrond: zelfde blauwdruk-verloop + rasterlijntjes als html/body in game.css
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, PANEL);
  bg.addColorStop(1, NIGHT);
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 32);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 32);
  ctx.clip();
  ctx.strokeStyle = 'rgba(95, 128, 220, 0.10)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < CARD_W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CARD_H); ctx.stroke(); }
  for (let gy = 0; gy < CARD_H; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CARD_W, gy); ctx.stroke(); }
  ctx.restore();

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 6;
  roundRect(ctx, 3, 3, CARD_W - 6, CARD_H - 6, 30);
  ctx.stroke();

  // titel (messing-pers effect: schaduw + glans, net als .home-title)
  ctx.textAlign = 'center';
  ctx.font = '400 56px "Lilita One", sans-serif';
  ctx.fillStyle = BRASS_DEEP;
  ctx.fillText('Typcoon', CARD_W / 2, 96);
  ctx.fillStyle = BRASS;
  ctx.fillText('Typcoon', CARD_W / 2, 92);

  ctx.font = '800 26px Nunito, sans-serif';
  ctx.fillStyle = INK_DIM;
  const subtitle = data.naam ? gt('share.cardOwner', { naam: data.naam }) : gt('share.cardGeneric');
  ctx.fillText(subtitle, CARD_W / 2, 132);

  // statistiek-pillen (munten / per seconde / streak) — zelfde kleuren als de pillen
  // op het startscherm en in Dashboard/daily.js
  const pillY = 165;
  const pillH = 56;
  let px = 60;
  ctx.font = '900 26px Nunito, sans-serif';
  ctx.textAlign = 'left';

  const coinLabel = `🪙 ${fmt(data.coins)}`; // 🪙
  const coinW = ctx.measureText(coinLabel).width + 56;
  pill(ctx, px, pillY, coinW, pillH, { grad: [BRASS_HI, BRASS], shadow: BRASS_DEEP });
  ctx.fillStyle = INK_ON_BRASS;
  ctx.fillText(coinLabel, px + 28, pillY + 37);
  px += coinW + 18;

  const cpsLabel = `⚙️ ${fmt(data.cps)}/s`; // ⚙️
  const cpsW = ctx.measureText(cpsLabel).width + 56;
  pill(ctx, px, pillY, cpsW, pillH, { grad: [PANEL_2, PANEL_2], shadow: PANEL_SHADOW, border: LINE });
  ctx.fillStyle = MINT;
  ctx.fillText(cpsLabel, px + 28, pillY + 37);
  px += cpsW + 18;

  if (data.streak > 0) {
    const streakLabel = `🔥 ${data.streak}`; // 🔥
    const streakW = ctx.measureText(streakLabel).width + 56;
    pill(ctx, px, pillY, streakW, pillH, { grad: [STREAK_HI, STREAK_LO], shadow: STREAK_SHADOW });
    ctx.fillStyle = STREAK_TEXT;
    ctx.fillText(streakLabel, px + 28, pillY + 37);
  }

  // machine-tegels (dash-tile-stijl)
  const machines = data.machines.slice(0, 5);
  const tileW = 150, tileH = 140, gap = 18;
  const tileY = 260;
  ctx.textAlign = 'center';
  if (machines.length === 0) {
    ctx.font = '700 24px Nunito, sans-serif';
    ctx.fillStyle = INK_DIM;
    ctx.fillText(gt('share.noMachines'), CARD_W / 2, tileY + 70);
  } else {
    const totalW = machines.length * tileW + (machines.length - 1) * gap;
    let tx = (CARD_W - totalW) / 2;
    for (const m of machines) {
      ctx.fillStyle = PANEL_SHADOW;
      roundRect(ctx, tx + 2, tileY + 6, tileW, tileH, 20);
      ctx.fill();
      ctx.fillStyle = PANEL;
      roundRect(ctx, tx, tileY, tileW, tileH, 20);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3;
      roundRect(ctx, tx, tileY, tileW, tileH, 20);
      ctx.stroke();

      ctx.font = '46px sans-serif';
      ctx.fillStyle = PAPER;
      ctx.fillText(m.icon, tx + tileW / 2, tileY + 58);

      ctx.font = '400 30px "Lilita One", sans-serif';
      ctx.fillStyle = BRASS;
      ctx.fillText('Lv ' + m.level, tx + tileW / 2, tileY + 96);

      ctx.font = '700 15px Nunito, sans-serif';
      ctx.fillStyle = INK_DIM;
      ctx.fillText(gt('building.' + m.id), tx + tileW / 2, tileY + 120);

      tx += tileW + gap;
    }
  }

  // ster-rij (rebirths) — alleen tonen als er iets te vieren valt
  if (data.rebirths > 0) {
    ctx.font = '800 26px Nunito, sans-serif';
    ctx.fillStyle = BRASS;
    const stars = '⭐'.repeat(Math.min(data.rebirths, 10)); // ⭐
    ctx.fillText(`${stars} ×${data.rebirths}`, CARD_W / 2, 452);
  }

  // footer: merk, geen link nodig (dit is een plaatje, geen netwerk-claim)
  ctx.font = '800 20px Nunito, sans-serif';
  ctx.fillStyle = INK_DIM;
  ctx.fillText(gt('share.cardFooter'), CARD_W / 2, CARD_H - 34);
}

// Downloadt de canvas-inhoud als PNG. Volledig lokaal: data-URL, geen netwerk-call,
// geen account nodig.
export function downloadCard(canvas, filename = 'typcoon-fabriek.png') {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}
