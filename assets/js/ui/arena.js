// Arène : les sièges en demi-cercle autour de la table, un projecteur sur celui qui parle.
// Plus : frise des phases, jauge de votes et graphe des accords et désaccords.
import { h, render, SVG_NS } from '../dom.js';
import { t } from '../i18n.js';
import { avatarTree } from '../avatar.js';

export function renderArena(profiles, { onSeat } = {}) {
  const active = profiles.filter((p) => p.enabled).sort((a, b) => a.order - b.order);
  const moderator = active.find((p) => p.role === 'moderator');
  const ring = active.filter((p) => p !== moderator);
  const spot = h('div', { class: 'spot', 'aria-hidden': 'true' });
  const seats = new Map();
  const stage = h('div', { class: 'arena', role: 'group', 'aria-label': t('nav.home') }, spot, h('div', { class: 'table', 'aria-hidden': 'true' }));

  const place = (p, x, y, front) => {
    const avatar = h('span', { class: 'seat-av' }, render(avatarTree(p.avatar, { state: 'idle', mood: null, size: 64 })));
    const vote = h('span', { class: 'seat-vote', 'aria-live': 'off' });
    const seat = h('button', { type: 'button', class: `seat${front ? ' seat--front' : ''}`, title: `${p.name} · ${p.title}`,
      style: { left: `${x}%`, top: `${y}%` }, onclick: () => onSeat?.(p) }, avatar, h('span', { class: 'seat-name' }, p.name), vote);
    seats.set(p.id, { seat, avatar, vote, p, x });
    stage.append(seat);
  };
  ring.forEach((p, i) => {
    // abscisses régulières sur une ellipse : même écart horizontal entre voisins, aucun chevauchement aux extrémités
    const x = ring.length === 1 ? 50 : 7 + (86 * i) / (ring.length - 1);
    const k = (x - 50) / 45;
    place(p, x, 76 - 58 * Math.sqrt(Math.max(0, 1 - k * k)), false);
  });
  if (moderator) place(moderator, 50, 86, true);

  return {
    el: stage,
    speak(id) {
      for (const [pid, s] of seats) {
        const on = pid === id;
        s.seat.classList.toggle('is-speaking', on);
        s.avatar.firstChild?.classList.toggle('av-speaking', on);
      }
      const s = seats.get(id);
      spot.classList.toggle('is-on', Boolean(s));
      if (s) { spot.style.left = `${s.x}%`; spot.style.setProperty('--spot-y', s.seat.style.top); }
    },
    vote(id, v) {
      const s = seats.get(id);
      if (!s || !v) return;
      s.vote.textContent = t(`votes.${v}`);
      s.vote.className = `seat-vote vote-${v}`;
      const svg = s.avatar.firstChild;
      svg?.classList.remove('av-mood-go', 'av-mood-cond', 'av-mood-nogo');
      svg?.classList.add({ GO: 'av-mood-go', GO_SOUS_CONDITION: 'av-mood-cond', NO_GO: 'av-mood-nogo' }[v]);
    },
  };
}

export function renderTimeline(phases, currentIndex) {
  const items = [];
  for (const ph of phases) if (!items.length || items[items.length - 1].id !== ph.id) items.push({ id: ph.id, count: ph.turns.length });
  let seen = 0;
  const flat = phases.map((ph) => { const r = { id: ph.id, from: seen, to: seen + ph.turns.length }; seen += ph.turns.length; return r; });
  const current = flat.find((f) => currentIndex >= f.from && currentIndex < f.to)?.id;
  const done = new Set(flat.filter((f) => f.to <= currentIndex).map((f) => f.id));
  return h('ol', { class: 'phases', 'aria-label': t('debate.phases') },
    items.map((it) => h('li', { class: `ph${it.id === current ? ' is-current' : done.has(it.id) && it.id !== current ? ' is-done' : ''}` }, t(`debate.phase.${it.id}`))));
}

export function renderMeter(tally, decision) {
  const total = Math.max(1, decision.voters);
  const seg = (k) => h('span', { class: `seg seg-${k}`, style: { width: `${(100 * tally[k]) / total}%` } });
  const favorable = tally.GO + tally.GO_SOUS_CONDITION;
  return h('div', { class: 'meter' },
    h('div', { class: 'meter-head' }, h('span', {}, t('meter.title')),
      h('span', { class: 'meter-num' }, t('conclusion.tally', { f: favorable, v: decision.voters, n: decision.needed }))),
    h('div', { class: 'meter-bar', role: 'img', 'aria-label': `${tally.GO} GO, ${tally.GO_SOUS_CONDITION} ${t('votes.GO_SOUS_CONDITION')}, ${tally.NO_GO} NO GO` },
      seg('GO'), seg('GO_SOUS_CONDITION'), seg('NO_GO'),
      h('span', { class: 'meter-mark', style: { left: `${(100 * decision.needed) / total}%` } })));
}

const svgEl = (tag, attrs) => {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

export function renderGraph(edges, profiles) {
  const nodes = profiles.filter((p) => p.enabled && p.role !== 'moderator');
  if (edges.some((e) => e.from === 'founder' || e.to === 'founder')) nodes.push({ id: 'founder', name: t('debate.you') });
  const pos = new Map(nodes.map((p, i) => {
    const a = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return [p.id, { x: 120 + 92 * Math.cos(a), y: 120 + 92 * Math.sin(a), p }];
  }));
  const svg = svgEl('svg', { viewBox: '0 0 240 240', class: 'graph', role: 'img', 'aria-label': t('graph.title') });
  for (const e of edges) {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) continue;
    svg.append(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: `edge edge-${e.kind}`, 'stroke-width': 1.2 + 1.4 * e.weight }));
  }
  for (const { x, y, p } of pos.values()) {
    const g = svgEl('g', { class: 'node' });
    g.append(svgEl('circle', { cx: x, cy: y, r: 9 }));
    const label = svgEl('text', { x, y: y > 120 ? y + 21 : y - 14, 'text-anchor': 'middle' });
    label.textContent = p.name.split(' ')[0];
    g.append(label);
    svg.append(g);
  }
  return h('figure', { class: 'graph-wrap' }, h('figcaption', {}, t('graph.title'),
    h('span', { class: 'legend' }, h('i', { class: 'lg lg-agree' }), t('graph.agree'), h('i', { class: 'lg lg-oppose' }), t('graph.oppose'))), svg);
}
