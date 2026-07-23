# Retro — the month-long silent backend outage, and the first day of autonomous ticks

Written for a reader in another company. Four lessons, ranked by cost.

## 1. Silent degradation hid a total backend outage for a month

The product's deliberate design — every backend feature degrades silently so the
game never breaks for a child — meant that when the production Vercel project was
recreated ~2026-07-09 with only the Telegram env vars, NOTHING visibly failed:
signups returned a clean error path, analytics 204'd into the void, parent emails
just didn't send, and the Telegram bot (correctly configured!) went quiet because
the events it reports on could no longer occur. Last real signup: 2026-06-23. The
outage was found on 2026-07-23 only because the Shareholder asked why Telegram was
quiet. **Lesson: every silent-degradation path needs exactly one loud liveness
signal.** Ours is now a daily Telegram digest that must send even when all counts
are zero (assignment 036) — silence becomes signal, not ambiguity.

## 2. An adoption survey must verify production behavior, not code existence

The adoption gap survey (2026-07-22) recorded "Telegram new-account alert already
fires" — true of the code, false of production, already false for two weeks at
adoption. The charter inherited the claim. **Lesson: adoption/verification passes
must probe the live system (send a test event, check the row) — reading code
proves capability, not operation.** A one-command probe would have surfaced this
a day earlier than the Shareholder's question did.

## 3. Headless harness limits are production constraints

The scheduled loop's first day found two: (a) the print-mode 600s background-task
ceiling killed an acceptance-QA lane mid-flight; the chained wrapper then
crash-retried the same doomed QA (fix: CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0 in
the wrapper); (b) the headless session wrote a wrong wall-clock timestamp in the
ledger (19:35 for a 14:17 open), which degrades the stale-vs-live heuristic the
whole one-dispatcher protocol rests on. **Lesson: treat the harness's headless
mode as a different runtime and shake it down deliberately — and prefer commit
timestamps (git, trustworthy) over model-written clock strings in ledgers.**

## 4. A decision executed but recorded late WILL be re-litigated

The CEO channel applied the licenses migration at ~14:56 but could not record it
on the board while a dispatcher was live; at 16:35 the next dispatcher re-claimed
the already-done work (its `supabase db push` would have been a harmless no-op,
but only by luck of idempotence). Separately, killing the stuck chain required
knowing that `schtasks /End` kills the wrapper but NOT the claude child process —
the dispatcher survived the first kill. **Lessons: (a) the record-before-the-turn-
ends rule exists precisely for this; when a live dispatcher blocks the write,
queue it on a close-watcher — and make the pending action visible in the ledger
if possible; (b) when ending a chain, kill the claude process, then reconcile the
ledger by hand before restarting.**
