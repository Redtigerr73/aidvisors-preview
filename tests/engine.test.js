import test from 'node:test';
import assert from 'node:assert/strict';
import { newConversation, flatTurns, advance, pause, resume, skipToEnd, interject, dig, voteTimeline,
  agreementEdges, validatePoint, decideAsFounder, liveTally } from '../assets/js/engine.js';
import { decide } from '../assets/js/decision.js';
import { defaultProfiles, defaultSkills, defaultRule } from '../assets/js/model.js';

const P = defaultProfiles(), K = defaultSkills(), R = defaultRule();
const NOW = new Date(2026, 9, 28, 10, 0);
const conv = (over = {}) => newConversation({ projectId: 'pr1', question: 'Faut-il ouvrir une deuxième boutique à Liège ?',
  profiles: P, skills: K, rule: R, now: NOW, ...over });
const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v)); return Object.freeze(o); };
const playAll = (c) => { let x = c; for (;;) { const r = advance(x); x = r.conv; if (!r.turn) return x; } };

test('a new conversation starts playing at turn 0 with a readable title', () => {
  const c = conv();
  assert.equal(c.status, 'playing');
  assert.equal(c.cursor, 0);
  assert.equal(c.projectId, 'pr1');
  assert.match(c.title, /deuxième boutique/);
  assert.equal(conv({ preparedId: 'saas-prix', question: '' }).title, 'Passer mon SaaS de 29 € à 49 €/mois');
});

test('advancing to the end awaits validation', () => {
  const c = playAll(conv());
  assert.equal(c.status, 'awaiting-validation');
  assert.equal(c.cursor, flatTurns(c).length);
  assert.ok(flatTurns(c).every((t) => typeof t.phase === 'string'));
});

test('a paused session does not advance until resumed', () => {
  const p = pause(advance(conv()).conv);
  assert.equal(advance(p).turn, null);
  assert.equal(p.status, 'paused');
  assert.ok(advance(resume(p)).turn);
});

test('skipping goes straight to the conclusion', () => {
  const c = skipToEnd(conv());
  assert.equal(c.cursor, flatTurns(c).length);
  assert.equal(c.status, 'awaiting-validation');
});

test('mentioning a seat makes it answer first, right after the turn being played', () => {
  const c0 = advance(advance(conv()).conv).conv;
  const c = interject(c0, { text: 'Et si on testait d’abord un pop-up ?', mentionId: 'p-devil' }, P, K);
  const next = flatTurns(c).slice(c.cursor, c.cursor + 2);
  assert.equal(next[0].profileId, 'founder');
  assert.equal(next[0].text, 'Et si on testait d’abord un pop-up ?');
  assert.equal(next[1].profileId, 'p-devil');
  assert.equal(next[0].phase, 'interjection');
  assert.equal(interject(c0, { text: '   ', mentionId: null }, P, K), c0);
});

test('digging into an objection adds a round that can change votes and the decision', () => {
  const played = playAll(conv());
  const point = played.debate.conclusion.points.find((p) => p.kind === 'objection');
  const votes = { ...played.debate.votes, [point.author]: 'NO_GO' };
  const before = { ...played, debate: { ...played.debate, votes } };
  const after = dig(before, point.id, P, K, R);
  const phase = after.debate.phases[after.debate.phases.length - 1];
  assert.equal(phase.id, 'dig');
  assert.ok(phase.turns.length >= 3);
  assert.equal(after.debate.votes[point.author], 'GO_SOUS_CONDITION');
  assert.ok(after.debate.conclusion.decision.favorable > decide(votes, P, R).favorable);
  assert.ok(voteTimeline(after).length > voteTimeline(before).length);
  assert.equal(after.status, 'playing');
});

test('objection point ids survive a recomputation', () => {
  const played = playAll(conv());
  const ids = played.debate.conclusion.points.map((p) => p.id);
  const point = played.debate.conclusion.points.find((p) => p.kind === 'objection');
  const after = dig(played, point.id, P, K, R);
  assert.ok(ids.every((id) => /^pt-(decision|obj-[a-z0-9]+|exp-\d)$/.test(id)));
  const byText = new Map(played.debate.conclusion.points.map((p) => [p.text, p.id]));
  const shared = after.debate.conclusion.points.filter((p) => p.kind !== 'decision' && byText.has(p.text));
  assert.ok(shared.length >= 3, 'au moins les 3 expériences sont communes');
  for (const p of shared) assert.equal(p.id, byText.get(p.text), p.text);
});

test('the devil opposes someone in the agreement graph', () => {
  const edges = agreementEdges(playAll(conv()));
  assert.ok(edges.some((e) => e.from === 'p-devil' && e.kind === 'oppose' && e.weight >= 1));
});

test('validating points then deciding records the founder decision', () => {
  const c = playAll(conv());
  const id = c.debate.conclusion.points[1].id;
  const v = validatePoint(c, id, 'rejected', 'Trop prudent');
  assert.deepEqual(v.validations[id], { status: 'rejected', comment: 'Trop prudent' });
  const d = decideAsFounder(v, 'CREUSER', NOW);
  assert.equal(d.founderDecision, 'CREUSER');
  assert.equal(d.status, 'decided');
  assert.equal(d.decidedAt, NOW.toISOString());
});

test('no function mutates its input', () => {
  const c = deepFreeze(playAll(conv()));
  const point = c.debate.conclusion.points.find((p) => p.kind === 'objection');
  assert.doesNotThrow(() => {
    advance(c); pause(c); resume(c); skipToEnd(c); voteTimeline(c); agreementEdges(c);
    interject(c, { text: 'Question ?', mentionId: null }, P, K);
    dig(c, point.id, P, K, R); validatePoint(c, point.id, 'accepted'); decideAsFounder(c, 'GO', NOW);
  });
});

test('a board with a single active seat still debates, takes interjections and digs', () => {
  const one = P.map((p) => ({ ...p, enabled: p.role === 'finance' }));
  const c = playAll(newConversation({ projectId: 'p', question: 'Faut-il investir ?', profiles: one, skills: K, rule: R, now: NOW }));
  assert.equal(c.status, 'awaiting-validation');
  assert.equal(c.debate.conclusion.decision.voters, 1);
  const i = interject(c, { text: 'Et alors ?', mentionId: null }, one, K);
  assert.ok(flatTurns(i).length > flatTurns(c).length);
  const pt = c.debate.conclusion.points.find((p) => p.kind === 'objection');
  assert.ok(dig(c, pt.id, one, K, R).debate.phases.at(-1).turns.length >= 1);
});

test('with every veto seat disabled the decision is still computed', () => {
  const noVeto = P.map((p) => ({ ...p, enabled: !['legal', 'security'].includes(p.role) }));
  const c = playAll(newConversation({ projectId: 'p', question: 'Faut-il ouvrir ?', profiles: noVeto, skills: K, rule: R, now: NOW }));
  assert.deepEqual(c.debate.conclusion.decision.vetoedBy, []);
  assert.equal(c.debate.conclusion.decision.voters, 9);
});

test('the live tally only counts seats that vote', () => {
  const c = playAll(conv());
  const t = liveTally(c, P, { ...R, devilVotes: false });
  assert.equal(t.GO + t.GO_SOUS_CONDITION + t.NO_GO, 10);
  const all = liveTally(c, P, R);
  assert.equal(all.GO + all.GO_SOUS_CONDITION + all.NO_GO, 11);
});
