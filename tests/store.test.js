import test from 'node:test';
import assert from 'node:assert/strict';
import { KEY, SCHEMA, emptyWorkspace, load, save, exportJson, importJson } from '../assets/js/store.js';

const memory = (init = {}) => {
  const data = { ...init };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
};

test('storage key is namespaced and the schema is versioned', () => {
  assert.equal(KEY, 'aidvisors:workspace');
  assert.equal(emptyWorkspace().schema, SCHEMA);
  assert.equal(emptyWorkspace().profiles.length, 12);
});

test('an empty storage gives the defaults without warning', () => {
  const { workspace, warning } = load(memory());
  assert.equal(warning, null);
  assert.equal(workspace.lang, 'fr');
  assert.equal(workspace.theme, 'dark');
});

test('a corrupt storage gives the defaults and a warning', () => {
  const { workspace, warning } = load(memory({ [KEY]: '{' }));
  assert.equal(warning, 'corrupt');
  assert.equal(workspace.profiles.length, 12);
});

test('an unavailable storage gives the defaults and a warning', () => {
  const broken = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('SecurityError'); } };
  assert.equal(load(broken).warning, 'unavailable');
  assert.equal(save(broken, emptyWorkspace()).error, 'unavailable');
});

test('a full storage reports quota', () => {
  const full = { getItem: () => null, setItem: () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } };
  assert.deepEqual(save(full, emptyWorkspace()), { ok: false, error: 'quota' });
});

test('save then load round-trips', () => {
  const m = memory();
  const ws = { ...emptyWorkspace(), lang: 'nl', projects: [{ id: 'p1', name: 'Café', color: '#E6B85C', archived: false }] };
  assert.deepEqual(save(m, ws), { ok: true, error: null });
  assert.deepEqual(load(m).workspace, ws);
});

test('export then import round-trips', () => {
  const ws = { ...emptyWorkspace(), businessCore: 'horeca' };
  const r = importJson(exportJson(ws));
  assert.equal(r.ok, true);
  assert.deepEqual(r.workspace, ws);
});

test('import rejects oversized, invalid and wrongly shaped files', () => {
  assert.equal(importJson('x'.repeat(2 * 1024 * 1024 + 1)).error, 'too-large');
  assert.equal(importJson('{oops').error, 'invalid-json');
  assert.equal(importJson('[]').error, 'invalid-shape');
  assert.equal(importJson('42').error, 'invalid-shape');
});

test('import keeps markup as plain text, truncates long strings and drops unknown keys', () => {
  const ws = emptyWorkspace();
  ws.profiles[1].name = '<img src=x onerror=alert(1)>';
  ws.profiles[1].prompt = 'a'.repeat(6000);
  const raw = { ...ws, evil: 'x', profiles: ws.profiles.map((p, i) => (i === 1 ? { ...p, hack: 1 } : p)) };
  const r = importJson(JSON.stringify(raw));
  assert.equal(r.ok, true);
  assert.equal(r.workspace.profiles[1].name, '<img src=x onerror=alert(1)>'.slice(0, 60));
  assert.equal(r.workspace.profiles[1].prompt.length, 5000);
  assert.equal('evil' in r.workspace, false);
  assert.equal('hack' in r.workspace.profiles[1], false);
});

test('import drops conversations with a broken shape and repairs profiles', () => {
  const ws = emptyWorkspace();
  const raw = { ...ws, lang: 'xx', theme: 'neon', motion: 'wild',
    projects: [{ id: 'p' }, { id: 'q', name: 5 }],
    conversations: [{ id: 'a', projectId: 'p' }, { id: 'b', projectId: 'p', createdAt: '2026-10-28T09:00:00.000Z', debate: { phases: 'x' } }],
    profiles: ws.profiles.map((p, i) => (i === 1 ? { ...p, avatar: null, skills: 'x', name: 5, enabled: 'yes', order: 'z' } : p)),
    skills: ws.skills.map((s, i) => (i === 0 ? { ...s, objections: 'nope' } : s)) };
  const r = importJson(JSON.stringify(raw));
  assert.equal(r.ok, true);
  const w = r.workspace;
  assert.deepEqual(w.conversations, []);
  assert.equal(w.lang, 'fr'); assert.equal(w.theme, 'dark'); assert.equal(w.motion, 'auto');
  assert.ok(w.projects.every((p) => typeof p.name === 'string' && p.name.length > 0));
  const p = w.profiles[1];
  assert.equal(typeof p.name, 'string'); assert.ok(p.name.length > 0);
  assert.deepEqual(p.skills, []);
  assert.equal(typeof p.avatar.skin, 'string');
  assert.equal(typeof p.enabled, 'boolean');
  assert.equal(typeof p.order, 'number');
  assert.deepEqual(w.skills[0].objections, []);
});

test('a valid conversation survives the shape check', () => {
  const r = importJson(exportJson({ ...emptyWorkspace() }));
  assert.equal(r.ok, true);
});

test('__proto__ keys never reach an object prototype, even deep inside a debate', async () => {
  const { newConversation } = await import('../assets/js/engine.js');
  const ws = emptyWorkspace();
  const c = newConversation({ projectId: 'p', question: 'Faut-il ouvrir ?', profiles: ws.profiles, skills: ws.skills, rule: ws.rule, now: new Date(2026, 9, 28) });
  const text = exportJson({ ...ws, conversations: [c] }).replace('"debate": {', '"debate": { "__proto__": { "polluted": 1 },');
  assert.match(text, /"__proto__"/);
  const r = importJson(text);
  assert.equal(r.ok, true);
  assert.equal(r.workspace.conversations.length, 1);
  const debate = r.workspace.conversations[0].debate;
  assert.equal(debate.polluted, undefined);
  assert.equal(Object.getPrototypeOf(debate), Object.prototype);
});
