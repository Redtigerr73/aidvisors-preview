// Espace de travail dans le localStorage : versionné, assaini à chaque lecture et à chaque import.
import { ROLES, defaultProfiles, defaultSkills, defaultRule } from './model.js';

export const KEY = 'aidvisors:workspace';
export const SCHEMA = 1;
const MAX_IMPORT = 2 * 1024 * 1024;
const MAX_TEXT = 5000;
const MAX_NAME = 60;

export function emptyWorkspace() {
  return { schema: SCHEMA, lang: 'fr', theme: 'dark', motion: 'auto', speed: 1, businessCore: null, onboarded: false, currentProjectId: null,
    projects: [], conversations: [], profiles: defaultProfiles(), skills: defaultSkills(), rule: defaultRule(), addedPacks: [] };
}

const FIELDS = {
  profile: ['id', 'role', 'name', 'title', 'inspiredBy', 'lens', 'style', 'prompt', 'skills', 'enabled', 'order', 'avatar', 'pack'],
  skill: ['id', 'name', 'description', 'content', 'objections', 'pack'],
  project: ['id', 'name', 'color', 'archived', 'createdAt'],
  conversation: ['id', 'projectId', 'title', 'question', 'createdAt', 'seed', 'preparedId', 'debate', 'cursor', 'status',
    'validations', 'founderDecision', 'archived', 'decidedAt'],
};
const SHORT = new Set(['name', 'title']);
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const HEX = /^#[0-9a-fA-F]{6}$/;
const LANG_SET = ['fr', 'nl', 'en'], THEMES = ['dark', 'light'], MOTIONS = ['auto', 'reduced', 'full'];
const STATUSES = ['playing', 'paused', 'awaiting-validation', 'decided'];
const DEFAULT_AVATAR = { skin: '#E0B48C', hair: 'short', hairColor: '#2B2420', glasses: 'none', beard: 'none', outfit: 'blazer', accent: '#E6B85C', idle: 'calm' };
const str = (v, d = '') => (typeof v === 'string' ? v : d);
const nonEmpty = (v, d) => (typeof v === 'string' && v.trim() ? v : d);
const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function fixProject(p) {
  return { ...p, name: nonEmpty(p.name, 'Projet'), color: HEX.test(p.color) ? p.color : '#E6B85C', archived: p.archived === true };
}

function fixProfile(p, i) {
  const a = isObj(p.avatar) ? p.avatar : {};
  const avatar = Object.fromEntries(Object.entries(DEFAULT_AVATAR).map(([k, d]) => [k, typeof a[k] === 'string' ? a[k] : d]));
  const inspiredBy = isObj(p.inspiredBy) && typeof p.inspiredBy.person === 'string' && p.inspiredBy.person
    ? { person: p.inspiredBy.person, known: str(p.inspiredBy.known) } : null;
  return { ...p, name: nonEmpty(p.name, 'Siège'), title: str(p.title), lens: nonEmpty(p.lens, '—'), style: str(p.style), prompt: str(p.prompt),
    skills: strings(p.skills), enabled: typeof p.enabled === 'boolean' ? p.enabled : true, order: isNum(p.order) ? p.order : i, avatar, inspiredBy };
}

function fixSkill(s) {
  return { ...s, name: nonEmpty(s.name, 'Compétence'), description: str(s.description), content: str(s.content), objections: strings(s.objections) };
}

const validTurn = (t) => isObj(t) && typeof t.id === 'string' && typeof t.profileId === 'string' && typeof t.text === 'string'
  && Array.isArray(t.objections) && t.objections.every((o) => isObj(o) && typeof o.text === 'string')
  && (t.evidence === undefined || Array.isArray(t.evidence));

/** Une séance n'est gardée que si l'interface peut la lire sans planter. */
function validConversation(c) {
  const d = c.debate;
  const decision = d?.conclusion?.decision;
  return typeof c.createdAt === 'string' && !Number.isNaN(Date.parse(c.createdAt)) && typeof c.title === 'string' && typeof c.question === 'string'
    && isNum(c.seed) && isNum(c.cursor) && STATUSES.includes(c.status) && isObj(d) && isObj(d.votes)
    && Array.isArray(d.phases) && d.phases.every((ph) => isObj(ph) && typeof ph.id === 'string' && Array.isArray(ph.turns) && ph.turns.every(validTurn))
    && isObj(d.conclusion) && isObj(decision) && typeof decision.outcome === 'string'
    && ['favorable', 'voters', 'needed'].every((k) => isNum(decision[k])) && Array.isArray(decision.vetoedBy)
    && Array.isArray(d.conclusion.points) && d.conclusion.points.every((pt) => isObj(pt) && typeof pt.id === 'string' && typeof pt.kind === 'string' && typeof pt.text === 'string');
}

function fixConversation(c) {
  return { ...c, validations: isObj(c.validations) ? c.validations : {}, archived: c.archived === true,
    debate: { ...c.debate, experiments: strings(c.debate.experiments), topics: strings(c.debate.topics) } };
}

/** Copie profonde qui tronque les chaînes, borne les tableaux et ignore tout ce qui n'est pas une donnée. */
function clean(v, depth = 0, max = MAX_TEXT) {
  if (depth > 14) return null;
  if (typeof v === 'string') return v.slice(0, max);
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 2000).map((x) => clean(x, depth + 1));
  if (typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      if (UNSAFE_KEYS.has(k) || x === undefined || typeof x === 'function') continue; // jamais de prototype remplacé
      out[k] = clean(x, depth + 1);
    }
    return out;
  }
  return null;
}

function pickFields(obj, fields) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const out = {};
  for (const f of fields) if (f in obj) out[f] = clean(obj[f], 1, SHORT.has(f) ? MAX_NAME : MAX_TEXT);
  return typeof out.id === 'string' ? out : null;
}

const list = (arr, fields, max) => (Array.isArray(arr) ? arr.slice(0, max).map((x) => pickFields(x, fields)).filter(Boolean) : []);

export function migrate(raw) {
  const base = emptyWorkspace();
  const ws = { ...base };
  if (LANG_SET.includes(raw.lang)) ws.lang = raw.lang;
  if (THEMES.includes(raw.theme)) ws.theme = raw.theme;
  if (MOTIONS.includes(raw.motion)) ws.motion = raw.motion;
  if (typeof raw.businessCore === 'string') ws.businessCore = raw.businessCore.slice(0, 20);
  if (typeof raw.currentProjectId === 'string') ws.currentProjectId = raw.currentProjectId.slice(0, 80);
  if (typeof raw.onboarded === 'boolean') ws.onboarded = raw.onboarded;
  if (typeof raw.speed === 'number' && raw.speed > 0 && raw.speed <= 20) ws.speed = raw.speed;
  ws.projects = list(raw.projects, FIELDS.project, 200).map(fixProject);
  ws.conversations = list(raw.conversations, FIELDS.conversation, 500).filter(validConversation).map(fixConversation);
  if (Array.isArray(raw.profiles)) ws.profiles = list(raw.profiles, FIELDS.profile, 60).filter((p) => ROLES.includes(p.role)).map(fixProfile);
  if (Array.isArray(raw.skills)) ws.skills = list(raw.skills, FIELDS.skill, 100).map(fixSkill);
  if (Array.isArray(raw.addedPacks)) ws.addedPacks = raw.addedPacks.filter((x) => typeof x === 'string').slice(0, 20);
  if (raw.rule && typeof raw.rule === 'object') {
    const t = Number(raw.rule.threshold);
    ws.rule = {
      threshold: t > 0 && t <= 1 ? t : base.rule.threshold,
      vetoRoles: Array.isArray(raw.rule.vetoRoles) ? raw.rule.vetoRoles.filter((r) => ROLES.includes(r)) : base.rule.vetoRoles,
      devilVotes: typeof raw.rule.devilVotes === 'boolean' ? raw.rule.devilVotes : true,
    };
  }
  return ws;
}

export function load(storage) {
  let text;
  try { text = storage.getItem(KEY); } catch { return { workspace: emptyWorkspace(), warning: 'unavailable' }; }
  if (text === null || text === undefined) return { workspace: emptyWorkspace(), warning: null };
  try {
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('shape');
    return { workspace: migrate(raw), warning: null };
  } catch { return { workspace: emptyWorkspace(), warning: 'corrupt' }; }
}

export function save(storage, ws) {
  try { storage.setItem(KEY, JSON.stringify(ws)); return { ok: true, error: null }; }
  catch (e) { return { ok: false, error: e && e.name === 'QuotaExceededError' ? 'quota' : 'unavailable' }; }
}

export function exportJson(ws) {
  return JSON.stringify(ws, null, 2);
}

export function importJson(text) {
  if (typeof text !== 'string' || text.length > MAX_IMPORT) return { ok: false, error: 'too-large' };
  let raw;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'invalid-json' }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !(Array.isArray(raw.profiles) || raw.schema === SCHEMA)) {
    return { ok: false, error: 'invalid-shape' };
  }
  return { ok: true, workspace: migrate(raw) };
}
