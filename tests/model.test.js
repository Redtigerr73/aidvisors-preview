import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, defaultProfiles, defaultSkills, PACKS, defaultRule, RESTRICTED_ROLES, applyPreset } from '../assets/js/model.js';
import { rng, seedFrom, pick } from '../assets/js/rng.js';

test('the default board has 12 profiles with unique ids and one per role (except free)', () => {
  const ps = defaultProfiles();
  assert.equal(ps.length, 12);
  assert.equal(new Set(ps.map((p) => p.id)).size, 12);
  assert.deepEqual(ps.map((p) => p.role).sort(), ROLES.filter((r) => r !== 'free').sort());
  assert.ok(ps.every((p) => p.enabled && p.name && p.title && p.lens && p.avatar));
});

test('exactly the five seats modelled on public figures carry an inspiration', () => {
  const inspired = defaultProfiles().filter((p) => p.inspiredBy?.person).map((p) => p.name).sort();
  assert.deepEqual(inspired, ['Charlie Mangeur', 'Paul Grammont', 'Seth Goodwin', 'Stève Jobard', 'Warren Buffo']);
});

test('default skills carry typical objections and point to existing profiles', () => {
  const skills = defaultSkills();
  assert.deepEqual(skills.map((s) => s.name), ['Juridique belge', 'Prix SaaS', 'Halal / RULES', 'Marketing FR/NL']);
  const ids = new Set(skills.map((s) => s.id));
  for (const p of defaultProfiles()) for (const s of p.skills) assert.ok(ids.has(s), `${p.name} → ${s}`);
  assert.ok(skills.every((s) => s.objections.length >= 2));
});

test('the seven business packs only use known roles and never recruitment', () => {
  assert.equal(Object.keys(PACKS).length, 7);
  for (const pack of Object.values(PACKS)) {
    assert.ok(pack.profiles.length >= 2 && pack.skills.length >= 1, pack.id);
    for (const p of pack.profiles) assert.ok(ROLES.includes(p.role), p.name);
    assert.doesNotMatch(JSON.stringify(pack), /recrut|recruit|wervin/i);
  }
});

test('the restricted preset keeps the moderator and five seats', () => {
  const on = applyPreset(defaultProfiles(), 'restricted').filter((p) => p.enabled).map((p) => p.role).sort();
  assert.deepEqual(on, ['moderator', ...RESTRICTED_ROLES].sort());
  assert.equal(applyPreset(defaultProfiles(), 'full').filter((p) => p.enabled).length, 12);
});

test('the default rule mirrors /board', () => {
  assert.deepEqual(defaultRule(), { threshold: 7 / 11, vetoRoles: ['legal', 'security'], devilVotes: true });
});

test('seeded random numbers are deterministic', () => {
  const a = rng(seedFrom('a')), b = rng(seedFrom('a'));
  const xs = [a(), a(), a(), a(), a()];
  assert.deepEqual([b(), b(), b(), b(), b()], xs);
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.notEqual(seedFrom('a'), seedFrom('b'));
  assert.ok(['x', 'y'].includes(pick(rng(1), ['x', 'y'])));
});
