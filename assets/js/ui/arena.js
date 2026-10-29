// Arène : les sièges en demi-cercle autour de la table, un projecteur sur celui qui parle.
// Plus : frise des phases, jauge de votes et graphe des accords et désaccords.
import { h, render, SVG_NS } from '../dom.js';
import { t } from '../i18n.js';
import { avatarTree } from '../avatar.js';

/** Table vue de dessus + liste des sièges, pilotées ensemble (siège qui parle, votes). */
export function renderBoard(profiles, { onSeat } = {}) {
  const active = profiles.filter((p) => p.enabled).sort((a, b) => a.order - b.order);
  const label = h('div', { class: 'table-now', 'aria-hidden': 'true' });
  const table = h('div', { class: 'table', role: 'img', 'aria-label': t('col.council'), style: { '--per-row': String(Math.max(1, Math.ceil(active.length / 2))) } },
    h('div', { class: 'table-top', 'aria-hidden': 'true' }), label);
  const roster = h('ol', { class: 'roster' });
  const seats = new Map();
  // deux rangées autour d'une table ovale, abscisses régulières : aucun avatar ne se chevauche aux extrémités
  const topCount = Math.ceil(active.length / 2);
  const spot = (i) => {
    const row = i < topCount ? 0 : 1;
    const n = row === 0 ? topCount : active.length - topCount;
    const k = row === 0 ? i : i - topCount;
    const x = n === 1 ? 50 : 12 + (76 * k) / (n - 1);
    const dy = Math.min(32, Math.max(20, 40 * Math.sqrt(Math.max(0, 1 - ((x - 50) / 46) ** 2))));
    return { x, y: row === 0 ? 50 - dy : 50 + dy };
  };
  active.forEach((p, i) => {
    const { x, y } = spot(i);
    const tav = h('span', { class: 'tseat', style: { left: `${x}%`, top: `${y}%` }, title: p.name },
      render(avatarTree(p.avatar, { state: 'idle', mood: null, size: 44 })));
    const rav = h('span', { class: 'r-av' }, render(avatarTree(p.avatar, { state: 'idle', mood: null, size: 34 })));
    const vote = h('span', { class: 'r-vote' }, p.role === 'moderator' ? '' : '…');
    const row = h('li', { class: 'r' }, h('button', { type: 'button', class: 'r-btn', onclick: () => onSeat?.(p), title: `@${p.name}` },
      rav, h('span', { class: 'r-id' }, h('span', { class: 'r-name' }, p.name), h('span', { class: 'r-sub' }, h('span', { class: 'r-title' }, p.title), vote))));
    table.append(tav);
    roster.append(row);
    seats.set(p.id, { tav, rav, vote, row, p });
  });
  const svgs = (s) => [s.tav.firstChild, s.rav.firstChild].filter(Boolean);
  return {
    table, roster,
    speak(id) {
      for (const [pid, s] of seats) {
        const on = pid === id;
        s.row.classList.toggle('is-speaking', on);
        s.tav.classList.toggle('is-speaking', on);
        svgs(s).forEach((svg) => svg.classList.toggle('av-speaking', on));
      }
      const s = seats.get(id);
      label.textContent = s ? t('live.speaking', { name: s.p.name }) : (id === 'founder' ? t('live.speaking', { name: t('debate.you') }) : '');
    },
    vote(id, v) {
      const s = seats.get(id);
      if (!s || !v) return;
      s.vote.textContent = t(`votes.${v}`);
      s.vote.className = `r-vote vote-${v}`;
      for (const svg of svgs(s)) {
        svg.classList.remove('av-mood-go', 'av-mood-cond', 'av-mood-nogo');
        svg.classList.add({ GO: 'av-mood-go', GO_SOUS_CONDITION: 'av-mood-cond', NO_GO: 'av-mood-nogo' }[v]);
      }
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
