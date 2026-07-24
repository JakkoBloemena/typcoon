// _085-layout-unit.mjs — isolation test for Shop.jsx's `layoutDiorama` placement
// rule (W2c). economy.js's BUILDINGS is fixed at 5 and is read-only for this
// assignment, so a real 6th-machine save cannot be constructed; this script copies
// the LITERAL (pure-JS, no-JSX) FRONT_LANE_CAP/LANE/layoutDiorama source verbatim
// from src/game/Shop.jsx and feeds it a synthetic 6-item roster, to prove the
// roster-growth rule (an earliest-built station recedes to the back lane once the
// front lane exceeds its cap) actually fires and positions items sanely, without
// hand-waving "the code looks like it should work".
const FRONT_LANE_CAP = 5;
const LANE = { front: { top: 60 }, back: { top: 22 } };

function layoutDiorama(items) {
  const front = items.filter((it) => it.lane === 'front');
  const back = items.filter((it) => it.lane === 'back');
  while (front.length > FRONT_LANE_CAP) {
    const oldest = front.shift();
    back.unshift({ ...oldest, lane: 'back', established: true });
  }
  const place = (lane, list) => list.map((it, i) => ({
    ...it, x: ((i + 1) / (list.length + 1)) * 100, y: LANE[lane].top,
  }));
  return [...place('back', back), ...place('front', front)];
}

let PASS = 0, FAIL = 0;
function check(label, cond, extra = '') {
  if (cond) { PASS++; console.log('PASS -', label, extra); }
  else { FAIL++; console.log('FAIL -', label, extra); }
}

// -------- today's real 5-machine roster, all built (the actual max reachable
// front-lane load with the current BUILDINGS array) — must NOT trigger overflow.
{
  const items = ['typewriter', 'printer', 'robotarm', 'assembly', 'megafab']
    .map((id) => ({ kind: 'built', id, lane: 'front' }));
  const out = layoutDiorama(items);
  const front = out.filter((i) => i.lane === 'front');
  const back = out.filter((i) => i.lane === 'back');
  check('5/5 built (todays max): all 5 stay in front lane, none established', front.length === 5 && back.length === 0);
  check('5/5 built: x spread evenly by index (20/40/60/80... within (0,100))', front.every((i) => i.x > 0 && i.x < 100));
}

// -------- a hypothetical 6th premium machine, all 6 built: front lane now
// exceeds FRONT_LANE_CAP (5) -> the OLDEST (first / cheapest, since BUILDINGS'
// own order is cost order) recedes to an established back-cluster.
{
  const items = ['typewriter', 'printer', 'robotarm', 'assembly', 'megafab', 'hypothetical6th']
    .map((id) => ({ kind: 'built', id, lane: 'front' }));
  const out = layoutDiorama(items);
  const front = out.filter((i) => i.lane === 'front');
  const back = out.filter((i) => i.lane === 'back');
  check('W2c roster-growth: a 6th machine slots in WITHOUT code changes (front capped at 5)', front.length === 5, `front=${front.length}`);
  check('W2c roster-growth: exactly one station recedes to the back lane, flagged established', back.length === 1 && back[0].established === true, JSON.stringify(back));
  check('W2c roster-growth: the RECEDED station is the earliest/cheapest (typewriter), not an arbitrary one', back[0].id === 'typewriter', `receded=${back[0].id}`);
  check('W2c roster-growth: the live edge (newest built) stays in front', front.some((i) => i.id === 'hypothetical6th'));
  check('W2c roster-growth: no x/y is a per-machine constant — recomputed purely from (index, lane count)', back[0].x === 50 && back[0].y === LANE.back.top);
}

console.log(`\n=== RESULT: ${PASS} passed, ${FAIL} failed ===`);
process.exit(FAIL > 0 ? 1 : 0);
