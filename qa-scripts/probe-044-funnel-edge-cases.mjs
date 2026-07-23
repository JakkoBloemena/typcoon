// Probe (tester, assignment 044 verification): edge cases in funnel.js auth beyond
// the shipped tests — empty-string env + empty presented token, type coercion,
// query-param vs header precedence.
import assert from 'node:assert/strict';
const { funnelTokenValid, funnelAuthorized } = await import('../api/admin/funnel.js');

function req({ auth, token } = {}) {
  return { headers: auth ? { authorization: auth } : {}, query: token !== undefined ? { token } : {} };
}

// 1) empty-string FUNNEL_READ_TOKEN env + empty-string presented token (header)
assert.equal(funnelTokenValid('', 'realcronsecret', req({ auth: 'Bearer ' })), false, 'empty env token + empty bearer must not authorize');
// 2) empty-string FUNNEL_READ_TOKEN env + empty-string presented token (query)
assert.equal(funnelTokenValid('', 'realcronsecret', req({ token: '' })), false, 'empty env token + empty query token must not authorize');
// 3) undefined FUNNEL_READ_TOKEN (not set) + no token presented at all
assert.equal(funnelTokenValid(undefined, 'realcronsecret', req({})), false, 'unset env token + nothing presented must not authorize');
// 4) CRON_SECRET unset (undefined) + empty string presented -- matches() should reject
assert.equal(funnelAuthorized(req({ token: '' }), undefined, undefined), false, 'both secrets unset must never authorize');
// 5) CRON_SECRET empty string '' (edge misconfig) + presented empty string token
assert.equal(funnelAuthorized(req({ token: '' }), '', ''), false, 'empty-string CRON_SECRET must not be satisfied by an empty-string token');
// 6) query param token as array (Vercel/Node querystring can yield arrays for repeated params) -- type coercion check
assert.equal(funnelTokenValid('funnel-secret', 'cronsecret', req({ token: ['funnel-secret'] })), false, 'array-valued query token must not loosely-equal the string secret');
// 7) numeric-like token coercion: token '0' vs secret 0 (not realistic since env vars are always strings, but check strict equality across types)
assert.equal(funnelTokenValid('0', 'cronsecret', req({ token: 0 })), false, 'numeric 0 query value must not loosely match string "0" secret (strict === used)');
// 8) header takes precedence check: garbage header + correct query token -- OR-logic means either satisfies; presence of a bad header must not block a good query token
assert.equal(funnelTokenValid('funnel-secret', 'cronsecret', { headers: { authorization: 'Bearer garbage' }, query: { token: 'funnel-secret' } }), true, 'bad header must not block a correct query token (OR semantics)');
// 9) funnelToken === secret, both unset (both undefined) -- must not authorize via funnel branch (since funnelToken falsy)
assert.equal(funnelTokenValid(undefined, undefined, req({ auth: 'Bearer ' })), false, 'both secrets undefined, funnel branch must reject');
console.log('All funnel auth edge-case probes passed.');
