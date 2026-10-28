import test from 'node:test';
import assert from 'node:assert/strict';
import { conversationSummary, projectSummary, toMarkdown } from '../assets/js/summary.js';
import { newConversation, skipToEnd, validatePoint, decideAsFounder } from '../assets/js/engine.js';
import { defaultProfiles, defaultSkills, defaultRule } from '../assets/js/model.js';

const P = defaultProfiles();
const base = () => skipToEnd(newConversation({ projectId: 'pr1', preparedId: 'cafe-velo', question: '', profiles: P,
  skills: defaultSkills(), rule: defaultRule(), now: new Date(2026, 9, 28, 9) }));

function decided() {
  let c = base();
  const pts = c.debate.conclusion.points;
  c = validatePoint(c, pts[1].id, 'accepted', 'Oui | vraiment <b>clé</b>');
  c = validatePoint(c, pts[2].id, 'rejected');
  return decideAsFounder(c, 'CREUSER', new Date(2026, 9, 28, 11));
}

test('the summary lists the decision, the tally and what was accepted or rejected', () => {
  const s = conversationSummary(decided(), P);
  assert.equal(s.title, 'Ouvrir un café-atelier vélo à Namur');
  assert.equal(s.date, '28/10/2026');
  assert.equal(s.founderDecision, 'CREUSER');
  assert.equal(s.accepted.length, 1);
  assert.equal(s.rejected.length, 1);
  assert.deepEqual(s.comments, ['Oui | vraiment <b>clé</b>']);
  assert.equal(s.next.length, 3);
  assert.equal(s.outcome, decided().debate.conclusion.decision.outcome);
});

test('the Markdown export is complete and safe', () => {
  const c = decided();
  const md = toMarkdown(c, P);
  assert.ok(md.startsWith('# Ouvrir un café-atelier vélo à Namur'));
  assert.match(md, new RegExp(`Décision du conseil : ${c.debate.conclusion.decision.outcome}`));
  assert.match(md, /Date : 28\/10\/2026/);
  assert.match(md, /Ta décision : CREUSER/);
  assert.match(md, /✓ /);
  assert.match(md, /✗ /);
  for (const p of P.filter((x) => x.role !== 'moderator')) assert.ok(md.includes(`| ${p.name} |`), p.name);
  assert.ok(md.includes('Oui \\| vraiment &lt;b&gt;clé&lt;/b&gt;'));
  assert.doesNotMatch(md, /<b>/);
});

test('the project summary lists decisions newest first', () => {
  const a = decided();
  const b = { ...decided(), id: 'c2', title: 'Autre', decidedAt: new Date(2026, 9, 29).toISOString() };
  const s = projectSummary({ id: 'pr1', name: 'Vélo' }, [a, b, { ...base(), id: 'c3' }]);
  assert.equal(s.name, 'Vélo');
  assert.deepEqual(s.decisions.map((d) => d.title), ['Autre', 'Ouvrir un café-atelier vélo à Namur']);
  assert.equal(s.decisions[0].date, '29/10/2026');
});
