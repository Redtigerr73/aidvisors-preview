// AIdvisors — état, persistance et routage. Aucun appel réseau : tout reste dans ce navigateur.
import { load, save } from './store.js';
import { setLang, t } from './i18n.js';
import { h } from './dom.js';
import { newConversation } from './engine.js';
import { renderShell, renderSidebar } from './ui/shell.js';
import { renderHome, renderProject } from './ui/home.js';
import { renderConversation } from './ui/conversation.js';
import { player } from './ui/player.js';
import { renderProfiles, renderSkills, renderPacks } from './ui/editors.js';
import { renderSettings, renderPricing, showOnboarding } from './ui/settings.js';

const root = document.getElementById('app');
const storage = (() => { try { return window.localStorage; } catch { return { getItem() { throw new Error('unavailable'); }, setItem() { throw new Error('unavailable'); } }; } })();
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const views = { home: renderHome, profiles: renderProfiles, skills: renderSkills, packs: renderPacks, settings: renderSettings, pricing: renderPricing };
let current = { name: 'home' };
let sidebarEl = null;
let saveWarned = false;

const loaded = load(storage);

export const app = {
  ws: loaded.workspace,
  views,

  persist() {
    const r = save(storage, this.ws);
    if (!r.ok && !saveWarned) { saveWarned = true; this.toast(t(`store.${r.error}`)); }
  },
  update(fn) { this.ws = fn(this.ws); this.persist(); },
  conv(id) { return this.ws.conversations.find((c) => c.id === id); },
  updateConv(id, fn) {
    this.update((ws) => ({ ...ws, conversations: ws.conversations.map((c) => (c.id === id ? fn(c) : c)) }));
  },

  speed() {
    const q = Number(new URLSearchParams(location.search).get('speed'));
    return q > 0 && q <= 20 ? q : this.ws.speed || 1;
  },
  reducedMotion() {
    return this.ws.motion === 'reduced' || (this.ws.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  ensureProject() {
    if (!this.ws.projects.some((p) => p.id === this.ws.currentProjectId && !p.archived)) {
      const existing = this.ws.projects.find((p) => !p.archived);
      if (existing) this.update((ws) => ({ ...ws, currentProjectId: existing.id }));
      else this.createProject('#E6B85C', t('project.default'), false);
    }
    return this.ws.currentProjectId;
  },
  createProject(color, name, rerender = true) {
    const id = uid('pr');
    const n = this.ws.projects.length + 1;
    this.update((ws) => ({ ...ws, currentProjectId: id,
      projects: [...ws.projects, { id, name: name ?? `${t('nav.projects')} ${n}`, color, archived: false, createdAt: new Date().toISOString() }] }));
    if (rerender) this.refreshSidebar();
  },
  setCurrentProject(id) { this.update((ws) => ({ ...ws, currentProjectId: id })); },
  renameProject(id, name) { this.update((ws) => ({ ...ws, projects: ws.projects.map((p) => (p.id === id ? { ...p, name: name.slice(0, 60) } : p)) })); this.refreshSidebar(); },
  archiveProject(id, archived = true) { this.update((ws) => ({ ...ws, projects: ws.projects.map((p) => (p.id === id ? { ...p, archived } : p)) })); this.refreshSidebar(); },
  deleteProject(id) {
    this.update((ws) => ({ ...ws, projects: ws.projects.filter((p) => p.id !== id), conversations: ws.conversations.filter((c) => c.projectId !== id),
      currentProjectId: ws.currentProjectId === id ? null : ws.currentProjectId }));
    if (current.id === id || (current.name === 'c' && !this.conv(current.id))) this.navigate('#/'); else this.refreshSidebar();
  },
  renameConversation(id, title) { this.updateConv(id, (c) => ({ ...c, title: title.slice(0, 120) })); this.render(); },
  archiveConversation(id, archived = true) { this.updateConv(id, (c) => ({ ...c, archived })); this.refreshSidebar(); },
  deleteConversation(id) {
    this.update((ws) => ({ ...ws, conversations: ws.conversations.filter((c) => c.id !== id) }));
    if (current.id === id) this.navigate('#/'); else this.refreshSidebar();
  },

  startConversation({ question = '', preparedId = null }) {
    const projectId = this.ensureProject();
    const conv = newConversation({ projectId, question, preparedId, profiles: this.ws.profiles, skills: this.ws.skills, rule: this.ws.rule, now: new Date() });
    this.update((ws) => ({ ...ws, conversations: [...ws.conversations, conv] }));
    this.navigate(`#/c/${conv.id}`);
  },

  navigate(hash) { if (location.hash === hash) this.render(); else location.hash = hash; },
  refreshSidebar() { if (sidebarEl) renderSidebar(this, sidebarEl, current); },
  toast(message) {
    const box = document.querySelector('.toasts');
    if (!box) return;
    const item = h('p', { class: 'toast' }, message);
    box.append(item);
    setTimeout(() => item.remove(), 5000);
  },

  applyPrefs() {
    setLang(this.ws.lang);
    const html = document.documentElement;
    html.lang = this.ws.lang;
    html.dataset.theme = this.ws.theme;
    html.dataset.motion = this.reducedMotion() ? 'reduced' : 'full';
  },

  render() {
    player.stop();
    this.applyPrefs();
    const [, name = '', id] = (location.hash || '#/').split('/');
    const next = { name: name || 'home', id };
    const moved = next.name !== current.name || next.id !== current.id;
    current = next;
    const { main, sidebar } = renderShell(this, root, current);
    sidebarEl = sidebar;
    try {
      if (current.name === 'c') renderConversation(this, main, id);
      else if (current.name === 'p') renderProject(this, main, id);
      else (views[current.name] ?? renderHome)(this, main, id);
    } catch (err) {
      // filet de sécurité : l'écran reste utilisable et mène aux réglages (import, réinitialisation)
      console.warn(err);
      main.replaceChildren(h('section', { class: 'page' }, h('h1', { class: 'page-title' }, t('store.corrupt')),
        h('a', { href: '#/settings', class: 'btn btn-primary' }, t('nav.settings'))));
    }
    if (!this.ws.onboarded) showOnboarding(this, root);
    if (moved) { window.scrollTo(0, 0); main.scrollTop = 0; }
  },
};

window.addEventListener('hashchange', () => app.render());
app.render();
if (loaded.warning) app.toast(t(`store.${loaded.warning}`));
