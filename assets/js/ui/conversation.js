// Écran d'une séance : en-tête, arène, fil, panneau (graphe, conclusion) et barre d'intervention.
import { h, clear } from '../dom.js';
import { t } from '../i18n.js';
import { flatTurns, pause, resume, skipToEnd, interject, dig, liveTally, agreementEdges, validatePoint, decideAsFounder } from '../engine.js';
import { renderArena, renderTimeline, renderMeter, renderGraph } from './arena.js';
import { turnCard, typeInto } from './thread.js';
import { renderConclusion } from './conclusion.js';
import { player } from './player.js';

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

  const arena = renderArena(profiles(), { onSeat: (p) => { input.value = `${input.value.trim()} @${p.name} `.trimStart(); input.focus(); } });
  const head = h('header', { class: 'conv-head' });
  const thread = h('div', { class: 'thread' });
  // une annonce par tour pour les lecteurs d'écran (le fil, lui, s'écrit lettre à lettre)
  const announcer = h('p', { class: 'visually-hidden', 'aria-live': 'polite', 'data-testid': 'announcer' });
  const side = h('aside', { class: 'side' });
  const input = h('input', { type: 'text', class: 'dock-input', maxlength: 2000, autocomplete: 'off', 'aria-label': t('debate.interject'), placeholder: t('debate.interject') });
  const menu = h('ul', { class: 'mentions', role: 'listbox', hidden: true });
  const playBtn = h('button', { type: 'button', class: 'btn btn-ghost' });
  const skipBtn = h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { player.stop(); app.updateConv(id, skipToEnd); refresh(); } }, t('debate.skip'));
  const dock = h('form', { class: 'dock', onsubmit: (e) => { e.preventDefault(); send(); } },
    playBtn, h('div', { class: 'dock-field' }, input, menu), h('button', { type: 'submit', class: 'btn btn-primary' }, t('debate.send')), skipBtn);

  const cps = () => (app.reducedMotion() ? Infinity : 42 * app.speed());
  const gap = () => Math.round(650 / app.speed());

  function renderHead(conv) {
    const tally = liveTally(played(conv), profiles(), app.ws.rule);
    clear(head).append(
      h('p', { class: 'kicker' }, project?.name ?? '', ' · ', h('span', { class: 'ai-pill' }, t('debate.simulated'))),
      h('h1', { class: 'conv-title' }, conv.title),
      conv.preparedId ? h('p', { class: 'conv-q' }, conv.question) : null,
      h('div', { class: 'conv-meta' }, renderTimeline(conv.debate.phases, conv.cursor), renderMeter(tally, conv.debate.conclusion.decision)));
  }

  function renderSide(conv) {
    const v = played(conv);
    clear(side).append(renderGraph(agreementEdges(v), profiles()));
    const ended = conv.cursor >= flatTurns(conv).length;
    if (ended) {
      side.append(renderConclusion(conv, profiles(), {
        validate: (pid, status) => { app.updateConv(id, (c) => validatePoint(c, pid, status)); renderSide(app.conv(id)); },
        comment: (pid, text) => app.updateConv(id, (c) => validatePoint(c, pid, undefined, text)),
        dig: (pid) => { app.updateConv(id, (c) => dig(c, pid, profiles(), app.ws.skills, app.ws.rule)); play(); renderSide(app.conv(id)); },
        decide: (d) => { app.updateConv(id, (c) => decideAsFounder(c, d)); renderSide(app.conv(id)); app.refreshSidebar(); },
      }));
    }
  }

  function syncArena(conv) {
    const v = played(conv);
    for (const turn of flatTurns(v)) if (turn.vote) arena.vote(turn.profileId, turn.vote);
  }

  function renderThread(conv) {
    clear(thread);
    for (const turn of flatTurns(conv).slice(0, conv.cursor)) thread.append(turnCard(turn, conv, profiles()).card);
  }

  function setPlayButton(conv) {
    const playing = conv.status === 'playing';
    playBtn.textContent = playing ? t('debate.pause') : t('debate.resume');
    const ended = conv.cursor >= flatTurns(conv).length;
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
        // on suit le fil seulement si l'utilisateur est déjà en bas : sinon l'arène reste à l'écran
        const following = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
        thread.append(card);
        if (following) card.scrollIntoView({ block: 'nearest', behavior: app.reducedMotion() ? 'auto' : 'smooth' });
        const who = turn.profileId === 'founder' ? t('debate.you') : profiles().find((p) => p.id === turn.profileId)?.name ?? '';
        announcer.textContent = t('debate.announce', { name: who, text: turn.text });
        arena.speak(turn.profileId);
        if (turn.vote) arena.vote(turn.profileId, turn.vote);
        renderHead(c);
        const ms = typeInto(text, turn.text, cps(), () => player.alive(mine));
        if (turn.phase === 'devil' || turn.phase === 'synthesis' || turn.phase === 'dig' || turn.phase === 'interjection') renderSide(c);
        return ms + gap();
      },
      onEnd: (c) => { arena.speak(null); renderHead(c); renderSide(c); setPlayButton(c); app.refreshSidebar(); },
      delay: Math.round(400 / app.speed()),
    });
  }

  function refresh() {
    const conv = app.conv(id);
    renderHead(conv); renderThread(conv); syncArena(conv); renderSide(conv); setPlayButton(conv);
  }

  function send() {
    const text = input.value.trim();
    if (!text) return;
    player.stop();
    app.updateConv(id, (c) => interject(c, { text, mentionId: findMention(text, profiles()) }, profiles(), app.ws.skills));
    input.value = '';
    menu.hidden = true;
    renderSide(app.conv(id));
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

  clear(main).append(h('section', { class: 'conv' }, head, h('div', { class: 'stage' }, arena.el),
    h('div', { class: 'conv-body' }, thread, side), dock, announcer));
  refresh();
  play();
}
