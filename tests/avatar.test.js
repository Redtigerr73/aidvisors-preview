import test from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR_OPTIONS, avatarTree } from '../assets/js/avatar.js';
import { defaultProfiles, PACKS } from '../assets/js/model.js';

const find = (tree, pred, out = []) => {
  if (tree && typeof tree === 'object') { if (pred(tree)) out.push(tree); (tree.children || []).forEach((c) => find(c, pred, out)); }
  return out;
};
const cls = (tree) => String(tree.attrs?.class || '').split(/\s+/);

test('every default and pack profile renders an SVG on a 120 grid', () => {
  const all = [...defaultProfiles(), ...Object.values(PACKS).flatMap((p) => p.profiles)];
  for (const p of all) {
    const t = avatarTree(p.avatar, { state: 'idle', mood: null, size: 96 });
    assert.equal(t.tag, 'svg', p.name);
    assert.equal(t.ns, 'svg');
    assert.equal(t.attrs.viewBox, '0 0 120 120');
    assert.ok(cls(t).includes('av-idle'));
  }
});

test('round glasses are two circles', () => {
  const p = defaultProfiles().find((x) => x.avatar.glasses === 'round');
  const glasses = find(avatarTree(p.avatar, { state: 'idle', mood: null, size: 64 }), (n) => cls(n).includes('av-glasses'));
  assert.equal(glasses.length, 2);
  assert.ok(glasses.every((g) => g.tag === 'circle'));
});

test('speaking and mood are visible as classes', () => {
  const a = defaultProfiles()[1].avatar;
  const t = avatarTree(a, { state: 'speaking', mood: 'NO_GO', size: 64 });
  assert.ok(cls(t).includes('av-speaking'));
  assert.ok(cls(t).includes('av-mood-nogo'));
  assert.ok(cls(avatarTree(a, { state: 'idle', mood: 'GO_SOUS_CONDITION' })).includes('av-mood-cond'));
});

test('no two default seats look the same', () => {
  const looks = defaultProfiles().map((p) => JSON.stringify(p.avatar));
  assert.equal(new Set(looks).size, looks.length);
});

test('options cover every trait used by the defaults', () => {
  for (const p of [...defaultProfiles(), ...Object.values(PACKS).flatMap((x) => x.profiles)]) {
    for (const k of ['skin', 'hair', 'hairColor', 'glasses', 'beard', 'outfit', 'idle']) {
      assert.ok(AVATAR_OPTIONS[k].includes(p.avatar[k]), `${p.name}.${k}=${p.avatar[k]}`);
    }
  }
  assert.equal(AVATAR_OPTIONS.skin.length, 6);
  assert.equal(AVATAR_OPTIONS.hairColor.length, 8);
});

test('unknown traits fall back instead of crashing', () => {
  const t = avatarTree({ skin: 'x', hair: 'mohawk', hairColor: 'y', glasses: '?', beard: '?', outfit: '?', accent: 'red;', idle: '?' }, {});
  assert.equal(t.tag, 'svg');
  assert.doesNotMatch(JSON.stringify(t), /red;|mohawk/);
});
