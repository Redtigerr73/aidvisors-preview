import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../assets/js/decision.js';
import { defaultProfiles, defaultRule, applyPreset } from '../assets/js/model.js';

const P = defaultProfiles();
const voters = P.filter((p) => p.role !== 'moderator');
const all = (vote, over = {}) => Object.fromEntries(voters.map((p) => [p.id, over[p.role] ?? vote]));

test('10 conditional GO and a devil NO_GO give GO_SOUS_CONDITION (the AIdvisors board itself)', () => {
  const r = decide(all('GO_SOUS_CONDITION', { devil: 'NO_GO' }), P, defaultRule());
  assert.deepEqual(r, { outcome: 'GO_SOUS_CONDITION', favorable: 10, voters: 11, needed: 7, vetoedBy: [] });
});

test('a legal NO_GO is a veto', () => {
  const r = decide(all('GO', { legal: 'NO_GO' }), P, defaultRule());
  assert.equal(r.outcome, 'NO_GO');
  assert.deepEqual(r.vetoedBy, ['p-legal']);
});

test('the threshold scales with active seats (restricted board: 4 of 5)', () => {
  const restricted = applyPreset(P, 'restricted');
  assert.equal(decide(all('GO'), restricted, defaultRule()).needed, 4);
});

test('unanimous GO is GO', () => {
  assert.equal(decide(all('GO'), P, defaultRule()).outcome, 'GO');
});

test('6 of 11 in favour is RETRAVAILLER, 3 of 11 is NO_GO', () => {
  const votes = (n) => Object.fromEntries(voters.map((p, i) => [p.id, i < n ? 'GO' : 'NO_GO'])
    .map(([id, v]) => [id, ['p-legal', 'p-security'].includes(id) ? 'GO' : v]));
  // les deux vetos votent GO pour isoler la règle de seuil : 6 et 3 favorables au total
  const six = { ...votes(4) }, three = { ...votes(1) };
  assert.equal(Object.values(six).filter((v) => v === 'GO').length, 6);
  assert.equal(decide(six, P, defaultRule()).outcome, 'RETRAVAILLER');
  assert.equal(Object.values(three).filter((v) => v === 'GO').length, 3);
  assert.equal(decide(three, P, defaultRule()).outcome, 'NO_GO');
});

test('no active seat at all stays computable', () => {
  const none = P.map((p) => ({ ...p, enabled: false }));
  assert.deepEqual(decide({}, none, defaultRule()), { outcome: 'RETRAVAILLER', favorable: 0, voters: 0, needed: 0, vetoedBy: [] });
});

test('the devil can be excluded from the vote', () => {
  assert.equal(decide(all('GO'), P, { ...defaultRule(), devilVotes: false }).voters, 10);
});

test('a missing vote counts as not favourable', () => {
  const r = decide({}, P, defaultRule());
  assert.equal(r.favorable, 0);
  assert.equal(r.outcome, 'NO_GO');
});
