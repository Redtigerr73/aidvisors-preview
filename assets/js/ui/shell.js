// Coquille : barre du haut, bandeau IA, barre latérale (navigation, projets, conversations).
import { h, clear } from '../dom.js';
import { t } from '../i18n.js';

const NAV = [['#/', 'nav.home'], ['#/profiles', 'nav.profiles'], ['#/skills', 'nav.skills'], ['#/packs', 'nav.packs'],
  ['#/pricing', 'nav.pricing'], ['#/settings', 'nav.settings']];
const COLORS = ['#E6B85C', '#6FCF97', '#5CB8E6', '#F29A4E', '#FF8A80', '#D9B26B'];

/** Édition en place d'un libellé (pas de boîte de dialogue). */
function inlineEdit(label, value, onSave) {
  const input = h('input', { type: 'text', class: 'inline-edit', value, maxlength: 60, 'aria-label': t('common.rename') });
  const done = (ok) => { const v = input.value.trim(); input.replaceWith(label); if (ok && v) onSave(v); };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
  input.addEventListener('blur', () => done(true));
  label.replaceWith(input);
  input.select();
}

function confirmButton(label, onConfirm) {
  const btn = h('button', { type: 'button', class: 'mini danger' }, label);
  let armed = false, timer;
  btn.addEventListener('click', () => {
    if (armed) { clearTimeout(timer); onConfirm(); return; }
    armed = true; btn.textContent = t('common.confirmDelete'); btn.classList.add('armed');
    timer = setTimeout(() => { armed = false; btn.textContent = label; btn.classList.remove('armed'); }, 4000);
  });
  return btn;
}

export function renderSidebar(app, nav, route) {
  const projects = app.ws.projects;
  const active = (href) => (href === '#/' ? route.name === 'home' : `#/${route.name}` === href);
  const projectBlock = (p) => {
    const convs = app.ws.conversations.filter((c) => c.projectId === p.id && !c.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const name = h('a', { href: `#/p/${p.id}`, class: 'proj-name' }, p.name);
    return h('li', { class: `proj${p.id === app.ws.currentProjectId ? ' is-current' : ''}` },
      h('div', { class: 'proj-head' }, h('span', { class: 'dot', style: { background: p.color } }), name,
        h('span', { class: 'proj-tools' },
          h('button', { type: 'button', class: 'mini', title: t('common.rename'), onclick: () => inlineEdit(name, p.name, (v) => app.renameProject(p.id, v)) }, '✎'),
          h('button', { type: 'button', class: 'mini', title: t('common.archive'), onclick: () => app.archiveProject(p.id) }, '⌂'),
          confirmButton('✕', () => app.deleteProject(p.id)))),
      h('ul', { class: 'convs' }, convs.map((c) => {
        const title = h('a', { href: `#/c/${c.id}`, class: `conv-link${route.id === c.id ? ' is-active' : ''}` },
          h('span', { class: `st st-${c.status}` }), c.title);
        return h('li', {}, title, h('span', { class: 'conv-tools' },
          h('button', { type: 'button', class: 'mini', title: t('common.rename'), onclick: () => inlineEdit(title, c.title, (v) => app.renameConversation(c.id, v)) }, '✎'),
          h('button', { type: 'button', class: 'mini', title: t('common.archive'), onclick: () => app.archiveConversation(c.id) }, '⌂'),
          confirmButton('✕', () => app.deleteConversation(c.id))));
      })),
      h('button', { type: 'button', class: 'btn-link new-q', onclick: () => { app.setCurrentProject(p.id); app.navigate('#/'); } }, `+ ${t('nav.newConversation')}`));
  };
  const archivedConvs = app.ws.conversations.filter((c) => c.archived);
  clear(nav).append(
    h('nav', { class: 'nav', 'aria-label': t('nav.menu') }, NAV.map(([href, key]) => h('a', { href, class: `nav-link${active(href) ? ' is-active' : ''}` }, t(key)))),
    h('div', { class: 'projects' },
      h('div', { class: 'projects-head' }, h('span', {}, t('nav.projects')),
        h('button', { type: 'button', class: 'mini', onclick: () => app.createProject(COLORS[projects.length % COLORS.length]) }, `+ ${t('nav.newProject')}`)),
      h('ul', { class: 'proj-list' }, projects.filter((p) => !p.archived).map(projectBlock)),
      (projects.some((p) => p.archived) || archivedConvs.length) ? h('details', { class: 'archived' }, h('summary', {}, t('nav.archived')),
        h('ul', {}, [...projects.filter((p) => p.archived).map((p) => h('li', {}, p.name, ' ',
          h('button', { type: 'button', class: 'mini', onclick: () => app.archiveProject(p.id, false) }, t('common.unarchive')))),
        ...archivedConvs.map((c) => h('li', {}, c.title, ' ',
          h('button', { type: 'button', class: 'mini', onclick: () => app.archiveConversation(c.id, false) }, t('common.unarchive'))))])) : null));
}

export function renderShell(app, root, route) {
  const sidebar = h('aside', { class: 'sidebar', id: 'sidebar' });
  const main = h('main', { class: 'main', id: 'main', tabindex: '-1' });
  const toggle = h('button', { type: 'button', class: 'menu-btn', 'aria-controls': 'sidebar', 'aria-expanded': 'false',
    onclick: () => { const open = !root.classList.contains('nav-open'); root.classList.toggle('nav-open', open); toggle.setAttribute('aria-expanded', String(open)); } },
  h('span', { class: 'bars', 'aria-hidden': 'true' }), h('span', { class: 'visually-hidden' }, t('nav.menu')));
  clear(root).append(
    h('header', { class: 'topbar' }, toggle,
      h('a', { href: '#/', class: 'brand' }, h('span', { class: 'brand-mark', 'aria-hidden': 'true' }), h('span', { class: 'brand-name display' }, t('app.name'))),
      h('span', { class: 'ai-pill' }, t('ai.short'))),
    h('div', { class: 'body' }, sidebar,
      h('div', { class: 'content' }, h('p', { class: 'ai-banner', role: 'note' }, t('ai.notice')), main)),
    h('div', { class: 'toasts', 'aria-live': 'polite' }));
  renderSidebar(app, sidebar, route);
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a')) root.classList.remove('nav-open'); });
  return { main, sidebar };
}
