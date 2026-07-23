// ShareCard.jsx — "Deel je fabriek" (REVENUE.md §5 virality). Ouder-getriggerde
// flow (bereikt via de home-menu-knop, net als Dashboard/Records/Friends): tekent
// de fabriekstaat als canvas-plaatje en laat de ouder 'm lokaal downloaden.
//
// Child-safety: de naam staat standaard UIT. De canvas hieronder is altijd de
// EXACTE kaart die gedownload wordt — er is geen verborgen inhoud — dus de ouder
// ziet precies wat er gedeeld wordt vóórdat hij op downloaden drukt, mét of zonder
// naam. Geen netwerk-call, geen account nodig (zie shareCard.js).

import { useEffect, useRef, useState } from 'react';
import { buildShareData, drawShareCard, downloadCard, CARD_W, CARD_H } from './shareCard.js';
import { gt } from './strings.js';

export default function ShareCard({ game, onBack }) {
  const canvasRef = useRef(null);
  const [includeNaam, setIncludeNaam] = useState(false); // PII-gate: expliciet aanzetten
  const [saved, setSaved] = useState(false);

  const data = buildShareData(game.tycoon, game.profile, includeNaam);
  const machineKey = data.machines.map((m) => `${m.id}:${m.level}`).join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    drawShareCard(canvas, data); // meteen tekenen, ook vóór de webfont klaar is
    let cancelled = false;
    // Lilita One is al zelf-gehost via game.css @font-face; canvas-tekst wacht niet
    // vanzelf op een lettertype dat nog niet elders op de pagina gebruikt is, dus
    // wachten we 'm expliciet af en tekenen dan opnieuw (voorkomt een systeemfont-flits).
    document.fonts?.load('400 56px "Lilita One"')
      .catch(() => {})
      .then(() => { if (!cancelled) drawShareCard(canvas, data); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.naam, data.coins, data.cps, data.streak, data.rebirths, machineKey]);

  const download = () => {
    downloadCard(canvasRef.current);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title dash-title">{gt('share.title')}</h1>
        <p className="home-tagline">{gt('share.sub')}</p>
      </div>

      <div className="home-card share-card-panel">
        <canvas ref={canvasRef} width={CARD_W} height={CARD_H} className="share-canvas" />

        <label className="acc-check">
          <input type="checkbox" checked={includeNaam} onChange={(e) => setIncludeNaam(e.target.checked)} />
          {gt('share.includeName', { naam: game.profile.naam })}
        </label>
        <p className="acc-hint">{gt('share.privacyNote')}</p>

        <button className="btn btn-big" onClick={download}>{saved ? gt('share.saved') : gt('share.download')}</button>
      </div>

      <button className="btn-ghost" onClick={onBack}>{gt('dash.back')}</button>
    </div>
  );
}
