// Accueil (question, débats préparés, dernières séances) et résumé d'un projet.
import { h, render, clear } from '../dom.js';
import { t, formatDate } from '../i18n.js';
import { PREPARED } from '../simulator.js';
import { projectSummary } from '../summary.js';
import { avatarTree } from '../avatar.js';

export function renderHome(app, main) {
  const area = h('textarea', { id: 'q', rows: 3, maxlength: 2000, 'aria-label': t('home.label'), placeholder: t('home.placeholder') });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const form = h('form', { class: 'composer', onsubmit: (e) => {
    e.preventDefault();
    const q = area.value.trim();
    if (!q) { error.textContent = t('home.empty'); area.focus(); return; }
    app.startConversation({ question: q });
  } }, area, h('div', { class: 'composer-foot' }, error, h('button', { type: 'submit', class: 'btn btn-primary btn-lg' }, t('home.ask'))));
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });

  const seats = app.ws.profiles.filter((p) => p.enabled && p.role !== 'moderator').sort((a, b) => a.order - b.order);
  const cast = h('div', { class: 'cast', 'aria-hidden': 'true' }, seats.slice(0, 12).map((p, i) =>
    h('span', { class: 'cast-av', style: { '--i': i } }, render(avatarTree(p.avatar, { state: 'idle', mood: null, size: 56 })))));

  const prepared = Object.values(PREPARED).map((d) => h('button', { type: 'button', class: 'prep', onclick: () => app.startConversation({ preparedId: d.id }) },
    h('span', { class: 'prep-title display' }, d.title), h('span', { class: 'prep-q' }, d.question)));

  const recent = [...app.ws.conversations].filter((c) => !c.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  clear(main).append(
    h('section', { class: 'hero' },
      h('p', { class: 'kicker' }, t('home.kicker')),
      h('h1', { class: 'hero-title' }, t('home.title')),
      h('p', { class: 'hero-sub' }, t('home.sub')),
      cast, form),
    h('section', { class: 'block' }, h('h2', { class: 'block-title' }, t('home.prepared')), h('div', { class: 'preps' }, prepared)),
    recent.length ? h('section', { class: 'block' }, h('h2', { class: 'block-title' }, t('home.recent')),
      h('ul', { class: 'recent' }, recent.map((c) => h('li', {}, h('a', { href: `#/c/${c.id}` },
        h('span', { class: 'recent-title' }, c.title), h('span', { class: 'recent-meta' }, formatDate(c.createdAt), ' · ',
          c.founderDecision ? t(`founder.${c.founderDecision}`) : t(`votes.${c.debate.conclusion.decision.outcome}`))))))) : null);
  area.focus({ preventScroll: true });
}

export function renderProject(app, main, id) {
  const project = app.ws.projects.find((p) => p.id === id);
  if (!project) { app.navigate('#/'); return; }
  const convs = app.ws.conversations.filter((c) => c.projectId === id);
  const s = projectSummary(project, convs);
  clear(main).append(h('section', { class: 'page' },
    h('p', { class: 'kicker' }, t('project.summary')),
    h('h1', { class: 'page-title' }, s.name),
    s.decisions.length
      ? h('ol', { class: 'decisions' }, s.decisions.map((d) => h('li', {}, h('a', { href: `#/c/${d.id}` },
        h('span', { class: `chip founder-chip f-${d.founderDecision}` }, t(`founder.${d.founderDecision}`)),
        h('span', { class: 'dec-title' }, d.title), h('span', { class: 'dec-meta' }, `${d.date} · ${t(`votes.${d.outcome}`)}`)))))
      : h('p', { class: 'muted' }, t('project.none')),
    h('ul', { class: 'recent' }, convs.map((c) => h('li', {}, h('a', { href: `#/c/${c.id}` }, h('span', { class: 'recent-title' }, c.title),
      h('span', { class: 'recent-meta' }, formatDate(c.createdAt))))))));
}
