// Réglages, offres « fausse porte » et premier lancement. Rien n'est envoyé : tout reste dans ce navigateur.
import { h, clear } from '../dom.js';
import { t, LANGS } from '../i18n.js';
import { ROLES, PACKS } from '../model.js';
import { PROVIDERS } from '../providers.js';
import { emptyWorkspace, exportJson, importJson } from '../store.js';

/** Adresse de la liste d'attente : vide tant que Mo n'a pas choisi d'en publier une. */
export const CONTACT_EMAIL = '';
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const segmented = (label, options, value, onPick) => h('div', { class: 'field' }, h('span', { class: 'field-label' }, label),
  h('div', { class: 'seg-ctl', role: 'group', 'aria-label': label }, options.map(([v, text]) =>
    h('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => onPick(v) }, text))));

function downloadJson(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name, hidden: true });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function renderSettings(app, main) {
  const ws = app.ws;
  const set = (patch) => { app.update((w) => ({ ...w, ...patch })); app.render(); };
  const msg = h('p', { class: 'form-msg', role: 'status' });
  const file = h('input', { type: 'file', class: 'visually-hidden', onchange: async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // taille vérifiée avant toute lecture : un fichier énorme ne doit pas figer l'onglet
    const r = f.size > MAX_IMPORT_BYTES ? { ok: false, error: 'too-large' } : importJson(await f.text());
    if (!r.ok) { msg.className = 'form-msg err'; msg.textContent = t('settings.importError', { reason: t(`import.${r.error}`) }); return; }
    app.update(() => ({ ...r.workspace, onboarded: true }));
    app.render();
    app.toast(t('settings.imported'));
  } });
  file.setAttribute('accept', 'application/json,.json');
  let armed = false;
  const reset = h('button', { type: 'button', class: 'btn danger', onclick: () => {
    if (!armed) { armed = true; reset.textContent = t('settings.resetConfirm'); return; }
    app.update(() => ({ ...emptyWorkspace(), onboarded: true, lang: ws.lang }));
    app.navigate('#/');
  } }, t('settings.reset'));

  const vetoRoles = ROLES.filter((r) => r !== 'moderator' && r !== 'free');
  const rule = ws.rule;
  const threshold = h('input', { type: 'number', min: 1, max: 100, step: 1, value: Math.round(rule.threshold * 100), 'aria-label': t('settings.threshold'),
    onchange: (e) => { const v = Math.min(100, Math.max(1, Number(e.target.value) || 64)); app.update((w) => ({ ...w, rule: { ...w.rule, threshold: v / 100 } })); } });

  clear(main).append(h('section', { class: 'page page--wide' },
    h('p', { class: 'kicker' }, t('nav.settings')), h('h1', { class: 'page-title' }, t('settings.title')),
    h('div', { class: 'settings' },
      h('div', { class: 'set-block' },
        segmented(t('settings.lang'), LANGS.map((l) => [l, l.toUpperCase()]), ws.lang, (v) => set({ lang: v })),
        segmented(t('settings.theme'), [['dark', t('settings.theme.dark')], ['light', t('settings.theme.light')]], ws.theme, (v) => set({ theme: v })),
        segmented(t('settings.motion'), [['auto', t('motion.auto')], ['reduced', t('motion.reduced')], ['full', t('motion.full')]], ws.motion, (v) => set({ motion: v })),
        segmented(t('settings.speed'), [[0.5, '× 0,5'], [1, '× 1'], [2, '× 2'], [4, '× 4']], ws.speed, (v) => set({ speed: v }))),
      h('div', { class: 'set-block' }, h('h2', {}, t('settings.rule')),
        h('label', { class: 'field' }, h('span', { class: 'field-label' }, `${t('settings.threshold')} (%)`), threshold),
        h('fieldset', { class: 'checks' }, h('legend', {}, t('settings.veto')), vetoRoles.map((r) => h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: rule.vetoRoles.includes(r), onchange: (e) => app.update((w) => ({ ...w,
            rule: { ...w.rule, vetoRoles: e.target.checked ? [...new Set([...w.rule.vetoRoles, r])] : w.rule.vetoRoles.filter((x) => x !== r) } })) }),
          t(`role.${r}`)))),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: rule.devilVotes,
          onchange: (e) => app.update((w) => ({ ...w, rule: { ...w.rule, devilVotes: e.target.checked } })) }), t('settings.devilVotes'))),
      h('div', { class: 'set-block' }, h('h2', {}, t('settings.data')),
        h('div', { class: 'toolbar' },
          h('button', { type: 'button', class: 'btn', onclick: () => downloadJson('aidvisors-espace.json', exportJson(app.ws)) }, t('settings.export')),
          h('label', { class: 'btn' }, t('settings.import'), file), reset),
        msg),
      h('div', { class: 'set-block' }, h('h2', {}, t('settings.real')), h('p', { class: 'muted' }, t('settings.real.body')),
        h('ul', { class: 'providers' }, PROVIDERS.map((p) => h('li', {}, h('span', {}, p.label), h('span', { class: 'soon' }, t('common.soon')))))))));
}

export function renderPricing(app, main) {
  const box = h('div', { class: 'waitlist', 'data-testid': 'waitlist', hidden: true });
  const join = (offer) => {
    const params = `subject=${encodeURIComponent(t('pricing.subject', { offer }))}&body=${encodeURIComponent(t('pricing.body', { offer }))}`;
    clear(box).append(h('p', { class: 'form-msg' }, t('pricing.mail')), h('a', { href: `mailto:${CONTACT_EMAIL}?${params}` }, t('pricing.join')));
    box.hidden = false;
    box.scrollIntoView({ block: 'nearest' });
  };
  const offer = (key, extra = '') => h('article', { class: `offer offer--${key}${extra}`, 'data-testid': `offer-${key}` },
    h('h2', { class: 'offer-name' }, t(`pricing.${key}`)),
    h('p', { class: 'offer-price' }, t(`pricing.${key}.price`), ' ', h('small', {}, t('pricing.month'))),
    h('p', { class: 'muted' }, t(`pricing.${key}.body`)),
    h('button', { type: 'button', class: `btn ${key === 'pro' ? 'btn-primary' : ''}`, onclick: () => join(t(`pricing.${key}`)) }, t('pricing.join')));
  clear(main).append(h('section', { class: 'page page--wide' },
    h('p', { class: 'kicker' }, t('nav.pricing')), h('h1', { class: 'page-title' }, t('pricing.title')), h('p', { class: 'muted lead' }, t('pricing.sub')),
    h('div', { class: 'offers' }, offer('free'), offer('pro'), offer('team')), box));
}

/** Premier lancement : ce que c'est, la mention IA, puis le cœur de métier. */
export function showOnboarding(app, root) {
  let core = null;
  const cores = h('div', { class: 'cores', role: 'group', 'aria-label': t('onboard.core') }, Object.values(PACKS).map((p) =>
    h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => {
      core = core === p.id ? null : p.id;
      cores.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget && core !== null)));
    } }, t(`packs.label.${p.id}`))));
  const close = () => {
    app.update((w) => ({ ...w, onboarded: true, businessCore: core }));
    overlay.remove();
    if (core) app.navigate('#/packs'); else app.render();
  };
  const overlay = h('div', { class: 'onboard' },
    h('div', { class: 'onboard-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'onboard-title' },
      h('p', { class: 'kicker' }, t('app.tagline')),
      h('h2', { id: 'onboard-title' }, t('onboard.title')),
      h('p', {}, t('onboard.body')),
      h('p', { class: 'onboard-note', role: 'note' }, t('onboard.ai'), ' ', t('ai.notice')),
      h('h3', { class: 'field-label' }, t('onboard.core')), cores,
      h('div', { class: 'toolbar' }, h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: close }, t('onboard.start')))));
  root.append(overlay);
  overlay.querySelector('.btn-primary').focus();
}
