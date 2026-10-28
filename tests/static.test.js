import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSP = "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'";

function files(dir, ext) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

test('index.html carries the exact CSP and noindex', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`));
  assert.ok(html.includes('<meta name="robots" content="noindex">'));
});

test('robots.txt disallows everything', () => {
  assert.match(readFileSync(join(ROOT, 'robots.txt'), 'utf8'), /Disallow: \//);
});

test('no HTML-injection sink anywhere in the scripts', () => {
  for (const f of files(join(ROOT, 'assets', 'js'), '.js')) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, f);
  }
});

test('no remote URL in scripts or styles (no third-party code, no network)', () => {
  const all = [...files(join(ROOT, 'assets', 'js'), '.js'), ...files(join(ROOT, 'assets', 'css'), '.css')];
  for (const f of all) {
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replaceAll('http://www.w3.org/2000/svg', '');
    assert.doesNotMatch(code, /https?:\/\//, f);
  }
});

test('no API-key, password or token field in the scripts', () => {
  for (const f of files(join(ROOT, 'assets', 'js'), '.js')) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /type\s*:\s*['"]password['"]|['"](api[-_]?key|apiKey|token|secret)['"]/i, f);
  }
});

test('the real mode is only a placeholder: providers announced as soon, no network API used anywhere', async () => {
  const { PROVIDERS } = await import('../assets/js/providers.js');
  assert.deepEqual(PROVIDERS.map((p) => p.id), ['openrouter', 'gemini', 'anthropic']);
  assert.ok(PROVIDERS.every((p) => p.status === 'soon'));
  for (const f of files(join(ROOT, 'assets', 'js'), '.js')) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /\bfetch\s*\(|XMLHttpRequest|new WebSocket|sendBeacon|EventSource/, f);
  }
});
