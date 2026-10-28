import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateDebate, detectTopics, PREPARED } from '../assets/js/simulator.js';
import { decide } from '../assets/js/decision.js';
import { defaultProfiles, defaultSkills, defaultRule } from '../assets/js/model.js';

const base = (over = {}) => ({ question: 'Faut-il passer mon abonnement de 29 € à 49 € ?', profiles: defaultProfiles(),
  skills: defaultSkills(), rule: defaultRule(), seed: 42, ...over });
const turns = (d) => d.phases.flatMap((p) => p.turns);

test('same seed, same debate; another seed changes at least one line', () => {
  assert.deepEqual(simulateDebate(base()), simulateDebate(base()));
  const a = turns(simulateDebate(base())).map((t) => t.text).join('|');
  const b = turns(simulateDebate(base({ seed: 7 }))).map((t) => t.text).join('|');
  assert.notEqual(a, b);
});

test('phases come in board order and the devil votes', () => {
  const d = simulateDebate(base());
  assert.deepEqual(d.phases.map((p) => p.id), ['framing', 'opinions', 'devil', 'rebuttal', 'synthesis']);
  assert.ok(d.votes['p-devil']);
  assert.equal(d.phases[2].turns[0].profileId, 'p-devil');
});

test('a disabled seat never speaks', () => {
  const profiles = defaultProfiles().map((p) => (p.role === 'devil' ? { ...p, enabled: false } : p));
  const d = simulateDebate(base({ profiles }));
  assert.ok(turns(d).every((t) => t.profileId !== 'p-devil'));
  assert.equal(d.phases[2].turns.length, 0);
});

test('a free seat speaks through its own lens', () => {
  const zoe = { ...defaultProfiles()[1], id: 'p-zoe', role: 'free', name: 'Zoé', lens: 'écologie', inspiredBy: null, skills: [], order: 50 };
  const d = simulateDebate(base({ profiles: [...defaultProfiles(), zoe] }));
  const t = d.phases[1].turns.find((x) => x.profileId === 'p-zoe');
  assert.ok(t, 'Zoé parle en phase avis');
  assert.match(t.text, /écologie/);
});

test('an attached skill brings its typical objection', () => {
  const skills = [...defaultSkills(), { id: 's-afsca', name: 'Hygiène', description: '', content: '', objections: ['Vérifier l’AFSCA'] }];
  const profiles = defaultProfiles().map((p) => (p.role === 'ops' ? { ...p, skills: ['s-afsca'] } : p));
  const t = simulateDebate(base({ profiles, skills })).phases[1].turns.find((x) => x.profileId === 'p-ops');
  assert.ok(t.objections.some((o) => o.text === 'Vérifier l’AFSCA'));
  assert.ok(t.objections.length <= 3);
});

test('topics are detected in French, Dutch and English', () => {
  assert.ok(detectTopics('Quel prijs voor mijn SaaS?').includes('pricing'));
  assert.ok(detectTopics('Should I launch in Ghent?').includes('launch'));
  assert.ok(detectTopics('Dois-je placer 200 € en ETF ?').includes('invest'));
});

test('a prepared debate follows the current seat names', () => {
  const profiles = defaultProfiles().map((p) => (p.role === 'capital' ? { ...p, name: 'W. B.' } : p));
  const d = simulateDebate(base({ profiles, preparedId: 'cafe-velo', question: '' }));
  assert.match(d.phases[0].turns[0].text, /W\. B\./);
  assert.equal(Object.keys(PREPARED).length, 3);
  assert.deepEqual(Object.keys(PREPARED).sort(), ['cafe-velo', 'halal-etf', 'saas-prix']);
});

test('the conclusion is the decision rule applied to the final votes, with three measurable experiments', () => {
  for (const preparedId of [undefined, 'cafe-velo', 'saas-prix', 'halal-etf']) {
    const d = simulateDebate(base({ preparedId, question: preparedId ? '' : 'Ouvrir une deuxième boutique à Liège ?' }));
    assert.deepEqual(d.conclusion.decision, decide(d.votes, defaultProfiles(), defaultRule()));
    const exps = d.conclusion.points.filter((p) => p.kind === 'experiment');
    assert.equal(exps.length, 3);
    assert.ok(exps.every((e) => /\d/.test(e.text)), 'chaque expérience a un critère chiffré');
    assert.equal(d.conclusion.points.filter((p) => p.kind === 'decision').length, 1);
    assert.ok(turns(d).every((t) => t.objections.length <= 3));
  }
});

test('empty questions are refused and long ones truncated', () => {
  assert.throws(() => simulateDebate(base({ question: '   ' })), /empty-question/);
  assert.equal(simulateDebate(base({ question: 'x'.repeat(2500) })).question.length, 2000);
});
