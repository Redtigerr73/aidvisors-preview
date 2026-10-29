// Écran d'une séance (direction B « Salle du conseil ») : le conseil | la table et le fil | en direct.
// Tout tient dans la fenêtre ; chaque colonne défile seule. Sous 760 px : onglets Sièges / Débat / Conclusion.
import { h, clear } from '../dom.js';
import { t } from '../i18n.js';
import { flatTurns, pause, resume, skipToEnd, interject, dig, liveTally, agreementEdges, validatePoint, decideAsFounder } from '../engine.js';
import { renderBoard, renderTimeline, renderGraph } from './arena.js';
import { turnCard, typeInto } from './thread.js';
import { renderConclusion } from './conclusion.js';
import { player } from './player.js';

const SEVERITY_RANK = { critique: 0, forte: 1, mineure: 2 };

/** Séance limitée aux tours déjà joués : l'évolution affichée suit la lecture. */
function played(conv) {
  let left = conv.cursor;
  const phases = conv.debate.phases.map((ph) => { const turns = ph.turns.slice(0, Math.max(0, left)); left -= ph.turns.length; return { ...ph, turns }; });
  return { ...conv, debate: { ...conv.debate, phases } };
}

/** Trouve le siège interpellé : le nom le plus long qui suit un « @ ». */
export function findMention(text, profiles) {
  const lower = text.toLowerCase();
  return [...profiles].filter((p) => p.enabled).sort((a, b) => b.name.length - a.name.length)
    .find((p) => lower.includes(`@${p.name.toLowerCase()}`))?.id ?? null;
}

export function renderConversation(app, main, id) {
  const conv0 = app.conv(id);
  if (!conv0) { app.navigate('#/'); return; }
  const profiles = () => app.ws.profiles;
  const project = app.ws.projects.find((p) => p.id === conv0.projectId);
  const narrow = () => matchMedia('(max-width: 759px)').matches;

  const input = h('input', { type: 'text', class: 'dock-input', maxlength: 2000, autocomplete: 'off', 'aria-label': t('debate.interject'), placeholder: t('debate.interject') });
  const board = renderBoard(profiles(), { onSeat: (p) => { input.value = `${input.value.trim()} @${p.name} `.trimStart(); input.focus(); } });
  const head = h('header', { class: 'conv-head' });
  const feed = h('div', { class: 'feed' });
  const live = h('div', { class: 'live-body' });
  const announcer = h('p', { class: 'visually-hidden', 'aria-live': 'polite', 'data-testid': 'announcer' });
  const menu = h('ul', { class: 'mentions', role: 'listbox', hidden: true });
  const playBtn = h('button', { type: 'button', class: 'btn' });
  const skipBtn = h('button', { type: 'button', class: 'btn', 'aria-label': t('debate.skip'), onclick: () => { player.stop(); app.updateConv(id, skipToEnd); refresh(); showTab('live'); live.querySelector('.verdict')?.focus(); } },
    h('span', { class: 'lbl-long' }, t('debate.skip')), h('span', { class: 'lbl-short', 'aria-hidden': 'true' }, '⏭'));
  const dock = h('form', { class: 'dock', onsubmit: (e) => { e.preventDefault(); send(); } },
    playBtn, h('div', { class: 'dock-field' }, input, menu), h('button', { type: 'submit', class: 'btn btn-primary' }, t('debate.send')), skipBtn);

  const cols = {
    council: h('section', { class: 'col col-council', 'data-testid': 'col-council', id: 'col-council', role: 'tabpanel', 'aria-label': t('col.council') },
      h('h2', { class: 'col-title display' }, t('col.council')), board.roster),
    debate: h('section', { class: 'col col-debate', 'data-testid': 'col-debate', id: 'col-debate', role: 'tabpanel', 'aria-label': t('tab.debate') },
      board.table, feed),
    live: h('section', { class: 'col col-live', 'data-testid': 'col-live', id: 'col-live', role: 'tabpanel', 'aria-label': t('col.live') },
      h('h2', { class: 'col-title display' }, t('col.live')), live),
  };
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': t('tab.list') });
  const order = ['council', 'debate', 'live'];
  tabs.addEventListener('keydown', (e) => {
    const cur = order.findIndex((k) => tabBtn[k] === document.activeElement);
    if (cur < 0) return;
    const next = { ArrowRight: (cur + 1) % 3, ArrowLeft: (cur + 2) % 3, Home: 0, End: 2 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    showTab(order[next]);
    tabBtn[order[next]].focus();
  });
  const tabBtn = {};
  for (const [key, label] of [['council', 'tab.council'], ['debate', 'tab.debate'], ['live', 'tab.live']]) {
    tabBtn[key] = h('button', { type: 'button', role: 'tab', id: `tab-${key}`, 'aria-controls': `col-${key}`, onclick: () => showTab(key) }, t(label));
    tabs.append(tabBtn[key]);
  }
  function showTab(key) {
    for (const k of Object.keys(cols)) {
      cols[k].classList.toggle('is-tab', k === key);
      tabBtn[k].setAttribute('aria-selected', String(k === key));
      tabBtn[k].tabIndex = k === key ? 0 : -1;
    }
  }

  const cps = () => (app.reducedMotion() ? Infinity : 42 * app.speed());
  const gap = () => Math.round(650 / app.speed());

  function renderHead(conv) {
    clear(head).append(
      h('div', { class: 'conv-title-row' },
        h('h1', { class: 'conv-title display', title: conv.title }, conv.title),
        h('span', { class: 'conv-meta-line' }, project?.name ?? '', ' · ', h('span', { class: 'ai-pill' }, t('debate.simulated')))),
      conv.preparedId ? h('p', { class: 'conv-q', title: conv.question }, conv.question) : null,
      renderTimeline(conv.debate.phases, conv.cursor));
  }

  function liveTallyBlock(conv) {
    const tally = liveTally(played(conv), profiles(), app.ws.rule);
    const d = conv.debate.conclusion.decision;
    const favorable = tally.GO + tally.GO_SOUS_CONDITION;
    const total = Math.max(1, d.voters);
    const seg = (k) => h('span', { class: `seg seg-${k}`, style: { width: `${(100 * tally[k]) / total}%` } });
    return h('div', { class: 'tally' },
      h('div', { class: 'tally-num display' }, `${favorable}/${d.voters}`),
      h('p', { class: 'tally-sub' }, t('conclusion.tally', { f: favorable, v: d.voters, n: d.needed })),
      h('div', { class: 'stack', role: 'img', 'aria-label': `${tally.GO} GO, ${tally.GO_SOUS_CONDITION} ${t('votes.GO_SOUS_CONDITION')}, ${tally.NO_GO} NO GO` },
        seg('GO'), seg('GO_SOUS_CONDITION'), seg('NO_GO'), h('span', { class: 'stack-mark', style: { left: `${(100 * d.needed) / total}%` } })),
      h('p', { class: 'legend-line' }, h('span', { class: 'vote-GO' }, `${tally.GO} GO`), h('span', { class: 'vote-GO_SOUS_CONDITION' }, `${tally.GO_SOUS_CONDITION} ${t('votes.GO_SOUS_CONDITION')}`),
        h('span', { class: 'vote-NO_GO' }, `${tally.NO_GO} NO GO`)));
  }

  function renderLive(conv, focusKey = null) {
    const ended = conv.cursor >= flatTurns(conv).length;
    clear(live);
    if (!ended) live.append(liveTallyBlock(conv)); // à la fin, le verdict porte déjà le décompte
    if (ended) {
      live.append(renderConclusion(conv, profiles(), {
        validate: (pid, status) => { app.updateConv(id, (c) => validatePoint(c, pid, status)); renderLive(app.conv(id), `${pid}:${status ?? 'accepted'}`); },
        comment: (pid, text) => app.updateConv(id, (c) => validatePoint(c, pid, undefined, text)),
        dig: (pid) => { app.updateConv(id, (c) => dig(c, pid, profiles(), app.ws.skills, app.ws.rule)); play(); renderLive(app.conv(id)); showTab('debate'); },
        decide: (dd) => { app.updateConv(id, (c) => decideAsFounder(c, dd)); renderLive(app.conv(id), `founder:${dd}`); app.refreshSidebar(); },
      }));
    } else {
      const raised = flatTurns(played(conv)).flatMap((tt) => tt.objections.map((o) => ({ ...o, who: tt.profileId })))
        .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 5);
      live.append(h('p', { class: 'live-wait' }, t('live.waiting')),
        h('h3', { class: 'live-h' }, t('live.raised')),
        raised.length ? h('ol', { class: 'raised' }, raised.map((o) => h('li', {},
          h('span', { class: `sev sev-${o.severity}` }, t(`severity.${o.severity}`)), ' ', o.text,
          h('span', { class: 'raised-who' }, ` — ${profiles().find((p) => p.id === o.who)?.name ?? ''}`)))) : h('p', { class: 'muted' }, '—'));
    }
    live.append(renderGraph(agreementEdges(played(conv)), profiles()));
    if (focusKey) [...live.querySelectorAll('[data-focus]')].find((el) => el.dataset.focus === focusKey)?.focus();
  }

  function syncBoard(conv) {
    for (const turn of flatTurns(played(conv))) if (turn.vote) board.vote(turn.profileId, turn.vote);
  }

  function renderFeed(conv) {
    clear(feed);
    for (const turn of flatTurns(conv).slice(0, conv.cursor).reverse()) feed.append(turnCard(turn, conv, profiles()).card);
  }

  function setPlayButton(conv) {
    const playing = conv.status === 'playing';
    const ended = conv.cursor >= flatTurns(conv).length;
    const label = playing ? t('debate.pause') : t('debate.resume');
    playBtn.setAttribute('aria-label', label);
    clear(playBtn).append(h('span', { class: 'lbl-long' }, label), h('span', { class: 'lbl-short', 'aria-hidden': 'true' }, playing ? '❚❚' : '▶'));
    playBtn.hidden = ended || !(playing || conv.status === 'paused');
    skipBtn.hidden = ended;
    playBtn.onclick = () => {
      const c = app.conv(id);
      if (c.status === 'playing') { player.stop(); app.updateConv(id, pause); setPlayButton(app.conv(id)); }
      else if (c.status === 'paused') { app.updateConv(id, resume); play(); }
    };
  }

  function play() {
    const conv = app.conv(id);
    setPlayButton(conv);
    if (conv.status !== 'playing') return;
    player.start({
      getConv: () => app.conv(id),
      setConv: (c) => app.updateConv(id, () => c),
      onTurn: (turn, c, mine) => {
        const { card, text } = turnCard(turn, c, profiles(), { typing: true });
        const atTop = feed.scrollTop < 40;
        feed.prepend(card);
        if (atTop) feed.scrollTop = 0;
        const who = turn.profileId === 'founder' ? t('debate.you') : profiles().find((p) => p.id === turn.profileId)?.name ?? '';
        announcer.textContent = t('debate.announce', { name: who, text: turn.text });
        board.speak(turn.profileId);
        if (turn.vote) board.vote(turn.profileId, turn.vote);
        renderHead(c);
        renderLive(c);
        return typeInto(text, turn.text, cps(), () => player.alive(mine)) + gap();
      },
      onEnd: (c) => { board.speak(null); renderHead(c); renderLive(c); setPlayButton(c); app.refreshSidebar(); if (narrow()) showTab('live'); },
      delay: Math.round(400 / app.speed()),
    });
  }

  function refresh() {
    const conv = app.conv(id);
    renderHead(conv); renderFeed(conv); syncBoard(conv); renderLive(conv); setPlayButton(conv);
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    player.stop();
    app.updateConv(id, (c) => interject(c, { text, mentionId: findMention(text, profiles()) }, profiles(), app.ws.skills));
    input.value = '';
    menu.hidden = true;
    renderLive(app.conv(id));
    showTab('debate');
    play();
  }

  input.addEventListener('input', () => {
    const m = /@([^@]*)$/.exec(input.value);
    clear(menu);
    if (!m) { menu.hidden = true; return; }
    const q = m[1].toLowerCase();
    const found = profiles().filter((p) => p.enabled && p.name.toLowerCase().startsWith(q)).slice(0, 6);
    menu.hidden = !found.length;
    for (const p of found) {
      menu.append(h('li', { role: 'option' }, h('button', { type: 'button', onclick: () => {
        input.value = `${input.value.slice(0, m.index)}@${p.name} `; menu.hidden = true; input.focus();
      } }, p.name, h('small', {}, ` · ${p.title}`))));
    }
  });

  clear(main).append(h('section', { class: 'conv' }, head, tabs,
    h('div', { class: 'conv-grid' }, cols.council, cols.debate, cols.live), dock, announcer));
  const c0 = app.conv(id);
  showTab(narrow() && c0.cursor >= flatTurns(c0).length ? 'live' : 'debate');
  refresh();
  play();
}
