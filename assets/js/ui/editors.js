// Éditeurs : sièges (profils), éditeur d'avatar, « Qui est-ce ? », compétences et packs métier.
import { h, render, clear } from '../dom.js';
import { t } from '../i18n.js';
import { ROLES, PACKS, applyPreset } from '../model.js';
import { AVATAR_OPTIONS, avatarTree } from '../avatar.js';

const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const sorted = (ps) => [...ps].sort((a, b) => a.order - b.order);
const renumber = (ps) => ps.map((p, i) => ({ ...p, order: i }));

function setProfiles(app, fn) { app.update((ws) => ({ ...ws, profiles: renumber(sorted(fn(ws.profiles))) })); }
function patchProfile(app, id, patch) { setProfiles(app, (ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))); }

function field(label, control) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), control);
}
const text = (value, onChange, opts = {}) => h('input', { type: 'text', value: value ?? '', maxlength: opts.max ?? 120, 'aria-label': opts.label,
  onchange: (e) => onChange(e.target.value.trim()) });
const area = (value, onChange, opts = {}) => h('textarea', { rows: opts.rows ?? 3, maxlength: 5000, value: value ?? '', 'aria-label': opts.label,
  onchange: (e) => onChange(e.target.value) });

export function whoIsCard(p) {
  return h('div', { class: 'who', 'data-testid': 'who' }, h('h3', {}, t('profiles.who')),
    h('p', {}, p.inspiredBy?.person ? t('who.notice', { person: p.inspiredBy.person, known: p.inspiredBy.known || '' }) : t('who.generic')));
}

/* --- Liste des sièges ------------------------------------------------------------------- */
export function renderProfiles(app, main, id) {
  if (id) { renderProfile(app, main, id); return; }
  const list = sorted(app.ws.profiles);
  const move = (p, dir) => setProfiles(app, (ps) => {
    const s = sorted(ps); const i = s.findIndex((x) => x.id === p.id); const j = i + dir;
    if (j < 0 || j >= s.length) return s;
    [s[i], s[j]] = [s[j], s[i]];
    return s.map((x, k) => ({ ...x, order: k }));
  });
  const row = (p, i) => h('li', { class: `prow${p.enabled ? '' : ' is-off'}` },
    h('span', { class: 'prow-av' }, render(avatarTree(p.avatar, { state: 'idle', mood: null, size: 52 }))),
    h('a', { href: `#/profiles/${p.id}`, class: 'prow-main' }, h('span', { class: 'prow-name' }, p.name), h('span', { class: 'prow-title' }, `${p.title} · ${t(`role.${p.role}`)}`)),
    h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: p.enabled, 'aria-label': `${t('profiles.enabled')} · ${p.name}`,
      onchange: (e) => { patchProfile(app, p.id, { enabled: e.target.checked }); app.render(); } }), h('span', { 'aria-hidden': 'true' }, t('profiles.enabled'))),
    h('span', { class: 'prow-move' },
      h('button', { type: 'button', class: 'mini', 'aria-label': `${t('profiles.up')} · ${p.name}`, disabled: i === 0, onclick: () => { move(p, -1); app.render(); } }, '↑'),
      h('button', { type: 'button', class: 'mini', 'aria-label': `${t('profiles.down')} · ${p.name}`, disabled: i === list.length - 1, onclick: () => { move(p, 1); app.render(); } }, '↓')));
  const add = () => {
    const pid = uid('p');
    setProfiles(app, (ps) => [...ps, { id: pid, role: 'free', name: t('profiles.add'), title: t('role.free'), inspiredBy: null, lens: t('profiles.defaultLens'),
      style: t('profiles.defaultStyle'), prompt: '', skills: [], enabled: true, order: ps.length, avatar: { skin: '#E0B48C', hair: 'short', hairColor: '#2B2420', glasses: 'none', beard: 'none', outfit: 'blazer', accent: '#E6B85C', idle: 'curious' } }]);
    app.navigate(`#/profiles/${pid}`);
  };
  clear(main).append(h('section', { class: 'page page--wide' },
    h('p', { class: 'kicker' }, t('nav.profiles')), h('h1', { class: 'page-title' }, t('profiles.title')), h('p', { class: 'muted lead' }, t('profiles.sub')),
    h('div', { class: 'toolbar' },
      h('button', { type: 'button', class: 'btn', onclick: () => { setProfiles(app, (ps) => applyPreset(ps, 'full')); app.render(); } }, t('profiles.preset.full')),
      h('button', { type: 'button', class: 'btn', onclick: () => { setProfiles(app, (ps) => applyPreset(ps, 'restricted')); app.render(); } }, t('profiles.preset.restricted')),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: add }, `+ ${t('profiles.add')}`)),
    h('ol', { class: 'plist' }, list.map(row))));
}

/* --- Fiche d'un siège ------------------------------------------------------------------- */
function renderProfile(app, main, id) {
  const p = app.ws.profiles.find((x) => x.id === id);
  if (!p) { app.navigate('#/profiles'); return; }
  const save = (patch) => patchProfile(app, id, patch);
  const preview = h('div', { class: 'av-preview' });
  const paint = () => clear(preview).append(render(avatarTree(app.ws.profiles.find((x) => x.id === id).avatar, { state: 'speaking', mood: null, size: 160 })));
  const avatarSelect = (key) => h('select', { 'aria-label': t(`avatar.${key}`), onchange: (e) => {
    const cur = app.ws.profiles.find((x) => x.id === id);
    save({ avatar: { ...cur.avatar, [key]: e.target.value } }); paint();
  } }, AVATAR_OPTIONS[key].map((v) => h('option', { value: v, selected: p.avatar[key] === v }, t(`opt.${key}.${v}`))));
  const swatches = (key) => h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': t(`avatar.${key}`) }, AVATAR_OPTIONS[key].map((v) =>
    h('button', { type: 'button', class: 'swatch', role: 'radio', 'aria-checked': String(p.avatar[key] === v), 'aria-label': v, style: { background: v },
      onclick: (e) => { const cur = app.ws.profiles.find((x) => x.id === id); save({ avatar: { ...cur.avatar, [key]: v } });
        e.currentTarget.parentElement.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-checked', String(s === e.currentTarget))); paint(); } })));
  const accent = h('input', { type: 'color', value: p.avatar.accent, 'aria-label': t('avatar.accent'), onchange: (e) => {
    const cur = app.ws.profiles.find((x) => x.id === id); save({ avatar: { ...cur.avatar, accent: e.target.value.toUpperCase() } }); paint(); } });
  const skills = h('fieldset', { class: 'checks' }, h('legend', {}, t('profiles.skills')), app.ws.skills.map((s) => h('label', { class: 'check' },
    h('input', { type: 'checkbox', checked: p.skills.includes(s.id), onchange: (e) => {
      const cur = app.ws.profiles.find((x) => x.id === id);
      save({ skills: e.target.checked ? [...new Set([...cur.skills, s.id])] : cur.skills.filter((k) => k !== s.id) });
    } }), s.name)));
  const who = h('div', { class: 'who-box' }, whoIsCard(p));
  const refreshWho = () => clear(who).append(whoIsCard(app.ws.profiles.find((x) => x.id === id)));
  const duplicate = () => {
    const nid = uid('p');
    setProfiles(app, (ps) => [...ps, { ...p, ...app.ws.profiles.find((x) => x.id === id), id: nid, name: `${p.name} (2)`.slice(0, 60), order: ps.length }]);
    app.navigate(`#/profiles/${nid}`);
  };
  let armed = false;
  const del = h('button', { type: 'button', class: 'btn danger', onclick: () => {
    if (!armed) { armed = true; del.textContent = t('common.confirmDelete'); return; }
    setProfiles(app, (ps) => ps.filter((x) => x.id !== id)); app.navigate('#/profiles');
  } }, t('common.delete'));

  clear(main).append(h('section', { class: 'page page--wide editor' },
    h('a', { href: '#/profiles', class: 'back' }, `← ${t('common.back')}`),
    h('div', { class: 'editor-grid' },
      h('div', { class: 'editor-av' }, preview,
        h('div', { class: 'av-controls' },
          field(t('avatar.skin'), swatches('skin')), field(t('avatar.hairColor'), swatches('hairColor')),
          field(t('avatar.hair'), avatarSelect('hair')), field(t('avatar.glasses'), avatarSelect('glasses')),
          field(t('avatar.beard'), avatarSelect('beard')), field(t('avatar.outfit'), avatarSelect('outfit')),
          field(t('avatar.idle'), avatarSelect('idle')), field(t('avatar.accent'), accent))),
      h('div', { class: 'editor-form' },
        h('h1', { class: 'page-title' }, p.name),
        field(t('profiles.name'), text(p.name, (v) => v && save({ name: v.slice(0, 60) }), { max: 60, label: t('profiles.name') })),
        field(t('profiles.titleField'), text(p.title, (v) => save({ title: v.slice(0, 60) }), { max: 60, label: t('profiles.titleField') })),
        field(t('profiles.role'), h('select', { 'aria-label': t('profiles.role'), onchange: (e) => save({ role: e.target.value }) },
          ROLES.map((r) => h('option', { value: r, selected: p.role === r }, t(`role.${r}`))))),
        field(t('profiles.lens'), text(p.lens, (v) => save({ lens: v }), { max: 200, label: t('profiles.lens') })),
        field(t('profiles.style'), text(p.style, (v) => save({ style: v }), { max: 120, label: t('profiles.style') })),
        field(t('profiles.prompt'), area(p.prompt, (v) => save({ prompt: v.slice(0, 5000) }), { rows: 4, label: t('profiles.prompt') })),
        h('div', { class: 'two' },
          field(`${t('profiles.inspired')} · ${t('profiles.person')}`, text(p.inspiredBy?.person, (v) => { const cur = app.ws.profiles.find((x) => x.id === id); save({ inspiredBy: v ? { person: v, known: cur.inspiredBy?.known ?? '' } : null }); refreshWho(); }, { max: 80, label: t('profiles.person') })),
          field(t('profiles.known'), text(p.inspiredBy?.known, (v) => { const cur = app.ws.profiles.find((x) => x.id === id); if (cur.inspiredBy) save({ inspiredBy: { ...cur.inspiredBy, known: v } }); refreshWho(); }, { max: 80, label: t('profiles.known') }))),
        skills, who,
        h('div', { class: 'toolbar' }, h('button', { type: 'button', class: 'btn', onclick: duplicate }, t('profiles.duplicate')), del)))));
  paint();
}

/* --- Compétences ---------------------------------------------------------------------- */
export function renderSkills(app, main) {
  const setSkills = (fn) => app.update((ws) => ({ ...ws, skills: fn(ws.skills) }));
  const patch = (id, p) => setSkills((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const carriers = (s) => h('fieldset', { class: 'checks' }, h('legend', {}, t('skills.attach')), sorted(app.ws.profiles).map((p) => h('label', { class: 'check' },
    h('input', { type: 'checkbox', checked: p.skills.includes(s.id), onchange: (e) => setProfiles(app, (ps) => ps.map((x) => (x.id !== p.id ? x
      : { ...x, skills: e.target.checked ? [...new Set([...x.skills, s.id])] : x.skills.filter((k) => k !== s.id) }))) }), p.name)));
  const form = (s) => h('form', { class: 'skill', 'data-testid': 'skill-form', onsubmit: (e) => e.preventDefault() },
    h('div', { class: 'two' },
      field(t('skills.name'), text(s.name, (v) => v && patch(s.id, { name: v.slice(0, 60) }), { max: 60, label: t('skills.name') })),
      field(t('skills.description'), text(s.description, (v) => patch(s.id, { description: v }), { max: 200, label: t('skills.description') }))),
    field(t('skills.content'), area(s.content, (v) => patch(s.id, { content: v }), { rows: 2, label: t('skills.content') })),
    field(t('skills.objections'), area(s.objections.join('\n'), (v) => patch(s.id, { objections: v.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 20) }),
      { rows: 3, label: t('skills.objections') })),
    carriers(s),
    h('div', { class: 'toolbar' }, h('button', { type: 'button', class: 'btn danger', onclick: () => {
      setSkills((ss) => ss.filter((x) => x.id !== s.id));
      setProfiles(app, (ps) => ps.map((p) => ({ ...p, skills: p.skills.filter((k) => k !== s.id) })));
      app.render();
    } }, t('common.delete'))));
  const add = () => {
    setSkills((ss) => [...ss, { id: uid('s'), name: t('skills.add'), description: '', content: '', objections: [] }]);
    app.render();
    requestAnimationFrame(() => document.querySelectorAll('[data-testid="skill-form"]').item(app.ws.skills.length - 1)?.scrollIntoView({ block: 'center' }));
  };
  clear(main).append(h('section', { class: 'page page--wide' },
    h('p', { class: 'kicker' }, t('nav.skills')), h('h1', { class: 'page-title' }, t('skills.title')), h('p', { class: 'muted lead' }, t('skills.sub')),
    h('div', { class: 'toolbar' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: add }, t('skills.add'))),
    h('div', { class: 'skills' }, app.ws.skills.map(form))));
}

/* --- Packs métier ---------------------------------------------------------------------- */
export function addPack(app, packId) {
  const pack = PACKS[packId];
  if (!pack || app.ws.addedPacks.includes(packId)) return;
  app.update((ws) => {
    const have = new Set(ws.profiles.map((p) => p.id));
    const haveSkills = new Set(ws.skills.map((s) => s.id));
    const skills = [...ws.skills, ...pack.skills.filter((s) => !haveSkills.has(s.id)).map((s) => ({ ...s, pack: packId }))];
    const skillIds = pack.skills.map((s) => s.id);
    const profiles = [...ws.profiles, ...pack.profiles.filter((p) => !have.has(p.id))
      .map((p, i) => ({ ...p, skills: [...new Set([...p.skills, ...skillIds])], pack: packId, order: ws.profiles.length + i }))];
    return { ...ws, profiles, skills, addedPacks: [...ws.addedPacks, packId] };
  });
}

export function renderPacks(app, main) {
  const card = (pack) => {
    const added = app.ws.addedPacks.includes(pack.id);
    return h('article', { class: `pack${app.ws.businessCore === pack.id ? ' is-core' : ''}`, 'data-testid': `pack-${pack.id}` },
      h('h2', { class: 'pack-title display' }, t(`packs.label.${pack.id}`)),
      h('ul', { class: 'pack-seats' }, pack.profiles.map((p) => h('li', {}, render(avatarTree(p.avatar, { state: 'idle', mood: null, size: 40 })),
        h('span', {}, h('strong', {}, p.name), h('small', {}, p.title))))),
      h('p', { class: 'pack-skills' }, pack.skills.map((s) => s.name).join(' · ')),
      h('button', { type: 'button', class: `btn ${added ? '' : 'btn-primary'}`, disabled: added, onclick: () => { addPack(app, pack.id); app.render(); } },
        added ? t('packs.added') : t('packs.add')));
  };
  clear(main).append(h('section', { class: 'page page--wide' },
    h('p', { class: 'kicker' }, t('nav.packs')), h('h1', { class: 'page-title' }, t('packs.title')), h('p', { class: 'muted lead' }, t('packs.sub')),
    h('div', { class: 'packs' }, Object.values(PACKS).map(card))));
}
