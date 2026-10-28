// Fil du débat : une carte par tour, écrite lettre à lettre pendant la lecture.
import { h, render } from '../dom.js';
import { t } from '../i18n.js';
import { avatarTree } from '../avatar.js';

export function founderBadge(size = 44) {
  return h('span', { class: 'founder-badge', style: { width: `${size}px`, height: `${size}px` }, 'aria-hidden': 'true' }, t('debate.you').slice(0, 2));
}

export function voteChip(vote) {
  return h('span', { class: `chip vote vote-${vote}` }, t(`votes.${vote}`));
}

export function turnCard(turn, conv, profiles, { typing = false } = {}) {
  const p = profiles.find((x) => x.id === turn.profileId);
  const isFounder = turn.profileId === 'founder';
  const name = isFounder ? t('debate.you') : p?.name ?? '?';
  const target = turn.replyTo && (turn.replyTo === 'founder' ? t('debate.you') : profiles.find((x) => x.id === turn.replyTo)?.name);
  const text = h('p', { class: 'turn-text' }, typing ? '' : turn.text);
  const card = h('article', { class: `turn turn--${turn.phase}${isFounder ? ' turn--founder' : ''}${turn.vote ? ` has-vote vote-${turn.vote}` : ''}`,
    'data-testid': 'turn', 'data-conv': conv.id, 'data-turn': turn.id },
  h('div', { class: 'turn-who' },
    isFounder ? founderBadge() : render(avatarTree(p?.avatar, { state: 'idle', mood: turn.vote ?? null, size: 44 })),
    h('div', { class: 'turn-id' },
      h('span', { class: 'turn-name' }, name),
      h('span', { class: 'turn-role' }, isFounder ? '' : p?.title ?? ''))),
  h('div', { class: 'turn-body' },
    h('div', { class: 'turn-meta' },
      h('span', { class: 'chip phase' }, t(`debate.phase.${turn.phase}`)),
      target ? h('span', { class: `reply reply-${turn.stance ?? 'agree'}` }, `↳ ${target}`) : null,
      turn.vote ? (turn.changed ? h('span', { class: 'changed' }, `${t('debate.changed')} → `, voteChip(turn.vote)) : voteChip(turn.vote)) : null),
    text,
    turn.objections?.length ? h('ul', { class: 'objections', 'aria-label': t('debate.objections') },
      turn.objections.map((o) => h('li', { class: `objection sev-${o.severity}` }, h('span', { class: 'sev' }, t(`severity.${o.severity}`)), o.text))) : null,
    turn.evidence?.length ? h('p', { class: 'evidence' }, h('span', {}, `${t('debate.evidence')} : `), turn.evidence.join(' · ')) : null));
  return { card, text };
}

/** Écrit le texte progressivement ; s'arrête dès que la lecture change (alive() faux). */
export function typeInto(el, full, cps, alive) {
  if (!Number.isFinite(cps) || cps <= 0) { el.textContent = full; return 0; }
  const total = Math.ceil((full.length / cps) * 1000);
  const start = performance.now();
  const frame = (now) => {
    if (!alive()) { el.textContent = full; return; }
    const n = Math.min(full.length, Math.ceil(((now - start) / 1000) * cps));
    el.textContent = full.slice(0, n);
    if (n < full.length) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return total;
}
