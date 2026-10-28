import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGS, STRINGS, t, setLang, getLang, formatDate } from '../assets/js/i18n.js';

test('FR, NL and EN expose exactly the same keys', () => {
  const keys = (l) => Object.keys(STRINGS[l]).sort();
  assert.deepEqual(LANGS, ['fr', 'nl', 'en']);
  assert.deepEqual(keys('nl'), keys('fr'));
  assert.deepEqual(keys('en'), keys('fr'));
});

test('dates are dd/MM/yyyy in every language', () => {
  for (const l of LANGS) {
    setLang(l);
    assert.equal(formatDate(new Date(2026, 9, 28)), '28/10/2026');
  }
  setLang('fr');
});

test('the AI notice exists in every language', () => {
  for (const l of LANGS) {
    setLang(l);
    assert.ok(t('ai.notice').length > 20);
  }
  setLang('fr');
  assert.equal(getLang(), 'fr');
});

test('t() fills placeholders and falls back to the key', () => {
  assert.equal(t('test.count', { n: 3 }), '3 sièges');
  assert.equal(t('missing.key'), 'missing.key');
});

test('every business pack and UI label has a translation', async () => {
  const { PACKS } = await import('../assets/js/model.js');
  for (const l of LANGS) {
    for (const id of Object.keys(PACKS)) assert.ok(STRINGS[l][`packs.label.${id}`], `${l} packs.label.${id}`);
    for (const k of ['home.label', 'debate.phases', 'profiles.defaultLens', 'profiles.defaultStyle']) assert.ok(STRINGS[l][k], `${l} ${k}`);
  }
});

test('no French aria-label is hard-coded in the interface code', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../assets/js/ui/', import.meta.url);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    assert.doesNotMatch(src, /'aria-label':\s*'[^']*'/, f);
  }
});
