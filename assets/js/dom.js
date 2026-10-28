// Construction du DOM sans jamais interpréter de HTML : tout texte devient un nœud texte.
export const SVG_NS = 'http://www.w3.org/2000/svg';

const PLAIN = new Set(['id', 'class', 'role', 'type', 'value', 'title', 'name', 'for', 'tabindex', 'placeholder',
  'maxlength', 'rows', 'min', 'max', 'step', 'autocomplete', 'lang', 'dir', 'download', 'hidden', 'disabled',
  'checked', 'selected', 'draggable', 'spellcheck', 'inputmode', 'enterkeyhint']);

function safeHref(value) {
  const v = String(value);
  return v.startsWith('#') || v.startsWith('mailto:') || v.startsWith('blob:') ? v : '#';
}

function setAttr(el, key, value) {
  if (value === null || value === undefined || value === false) return;
  if (key.startsWith('on')) {
    if (typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    return;
  }
  if (key === 'style' && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) k.startsWith('--') ? el.style.setProperty(k, v) : (el.style[k] = v);
    return;
  }
  if (key === 'href') { el.setAttribute('href', safeHref(value)); return; }
  if (key === 'value' && 'value' in el) { el.value = value; return; }
  if (key === 'checked' && 'checked' in el) { el.checked = Boolean(value); return; }
  if (PLAIN.has(key) || key.startsWith('data-') || key.startsWith('aria-')) {
    el.setAttribute(key, value === true ? '' : String(value));
  }
}

function append(el, child) {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) { child.forEach((c) => append(el, c)); return; }
  el.append(child instanceof Node ? child : document.createTextNode(String(child)));
}

/** Élément HTML : h('button', { class: 'x', onclick }, 'Texte'). */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) setAttr(el, k, v);
  append(el, children);
  return el;
}

/** Rend un arbre { tag, ns?, attrs, children } (avatars) ; les feuilles chaînes sont du texte. */
export function render(tree) {
  if (typeof tree === 'string' || typeof tree === 'number') return document.createTextNode(String(tree));
  const svg = tree.ns === 'svg';
  const el = svg ? document.createElementNS(SVG_NS, tree.tag) : document.createElement(tree.tag);
  for (const [k, v] of Object.entries(tree.attrs || {})) {
    if (k.startsWith('on') || v === null || v === undefined) continue;
    el.setAttribute(k, String(v));
  }
  for (const c of tree.children || []) el.append(render(typeof c === 'object' ? { ns: tree.ns, ...c } : c));
  return el;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}
