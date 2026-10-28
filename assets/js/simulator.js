// Simulateur de débat : compose un débat plausible et reproductible à partir des profils, des compétences et de la question.
import { rng, seedFrom, pick } from './rng.js';
import { decide } from './decision.js';
import * as B from './banks.js';
import { PREPARED } from './prepared.js';

export { PREPARED };
export const MAX_QUESTION = 2000;
const SEVERITY_RANK = { critique: 0, forte: 1, mineure: 2 };
const FAVORABLE = new Set(['GO', 'GO_SOUS_CONDITION']);
const VOTES = ['GO', 'GO_SOUS_CONDITION', 'NO_GO'];

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function detectTopics(question) {
  const raw = norm(question);
  const words = new Set(raw.split(/[^a-z0-9]+/).filter(Boolean));
  return Object.entries(B.TOPIC_WORDS)
    .filter(([, list]) => list.some((w) => (w === '€' ? raw.includes('€') : words.has(w))))
    .map(([topic]) => topic);
}

const LEAD = /^(faut-il|dois-je|devrais-je|est-ce qu[e’']\s*(je dois|il faut)?|puis-je|vaut-il mieux|should i|do i|shall i|moet ik|zal ik|kan ik)\s+/iu;
const ALIASES = ['ce projet', 'ce choix', 'ce plan', 'ce pari']; // masculins : les modèles accordent en « -t-il »

function subject(q) {
  const stripped = q.replace(LEAD, '').trim();
  const s = (stripped || q).replace(/[\s?!.]+$/u, '');
  if (s.length <= 90) return s;
  return s.slice(0, s.lastIndexOf(' ', 88) > 40 ? s.lastIndexOf(' ', 88) : 88) + '…';
}

function shuffle(rand, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function weighted(rand, weights) {
  const total = weights.reduce((x, y) => x + y, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return VOTES[i]; }
  return VOTES[VOTES.length - 1];
}

/** Contexte commun aux générateurs : aléa, noms par rôle, remplissage des modèles. */
export function makeContext({ question, profiles, skills = [], seed }) {
  const rand = rng((seed ^ seedFrom(question)) >>> 0);
  const active = profiles.filter((p) => p.enabled).sort((a, b) => a.order - b.order);
  const byRole = (role) => active.find((p) => p.role === role);
  const nameOf = (role) => byRole(role)?.name ?? B.FALLBACK_NAMES[role] ?? 'un siège';
  const base = { sujet: subject(question) };
  const fill = (tpl, extra = {}) => tpl
    .replace(/\{@(\w+)\}/g, (m, role) => nameOf(role))
    .replace(/\{(\w+)\}/g, (m, k) => (k in extra ? String(extra[k]) : k in base ? String(base[k]) : m))
    .replace(/(^|[.!?]\s+)(\p{Ll})/gu, (m, a, c) => a + c.toUpperCase());
  /** Évite de répéter la question entière à chaque réplique. */
  const vary = (tpl) => (rand() < 0.7 ? tpl.replace('« {sujet} »', pick(rand, ALIASES)) : tpl);
  const skillById = new Map(skills.map((s) => [s.id, s]));
  return { rand, active, byRole, nameOf, fill, vary, skillById };
}

const bankOf = (role) => (role in B.OPINIONS ? role : 'free');

function skillObjections(ctx, profile) {
  return profile.skills.map((id) => ctx.skillById.get(id)).filter((s) => s && s.objections?.length)
    .slice(0, 2).map((s) => ['forte', pick(ctx.rand, s.objections)]);
}

const asObjections = (turnId, list) => list.slice(0, 3).map(([severity, text], k) => ({ id: `${turnId}-o${k}`, severity, text }));

function opinionTurn(ctx, profile, prep, id) {
  const bank = bankOf(profile.role);
  const own = prep?.byRole?.[profile.role];
  const extra = { angle: profile.lens, nom: profile.name };
  const skillObjs = skillObjections(ctx, profile);
  if (own) {
    return { id, profileId: profile.id, text: ctx.fill(own.text, extra), objections: asObjections(id, [...own.objections, ...skillObjs].map(([s, t]) => [s, ctx.fill(t, extra)])),
      evidence: own.evidence.map((e) => ctx.fill(e, extra)), vote: own.vote };
  }
  const roleObjs = shuffle(ctx.rand, B.OBJECTIONS[bank]).slice(0, Math.max(1, 3 - skillObjs.length));
  return {
    id, profileId: profile.id,
    text: ctx.fill(ctx.vary(pick(ctx.rand, B.OPINIONS[bank])), extra),
    objections: asObjections(id, [...skillObjs, ...roleObjs].map(([s, t]) => [s, ctx.fill(t, extra)])),
    evidence: [ctx.fill(pick(ctx.rand, B.EVIDENCE[bank]), extra)],
    vote: weighted(ctx.rand, B.VOTE_WEIGHTS[bank]),
  };
}

/** Points de conclusion : décision, 3 objections les plus graves, 3 expériences. */
export function buildConclusion({ votes, turns, profiles, rule, experiments }) {
  const decision = decide(votes, profiles, rule);
  const label = B.OUTCOME_LABEL[decision.outcome];
  const seen = new Set();
  const objections = turns.flatMap((t) => t.objections.map((o) => ({ ...o, author: t.profileId })))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .filter((o) => (seen.has(o.text) ? false : seen.add(o.text)))
    .slice(0, 3);
  return {
    decision,
    points: [
      { id: 'pt-decision', kind: 'decision', text: `Décision du conseil : ${label} (${decision.favorable}/${decision.voters}, seuil ${decision.needed})` },
      // identifiant tiré du texte : une validation reste attachée à son objection après un recalcul
      ...objections.map((o) => ({ id: `pt-obj-${seedFrom(o.text).toString(36)}`, kind: 'objection', text: o.text, severity: o.severity, author: o.author })),
      ...experiments.map((text, k) => ({ id: `pt-exp-${k}`, kind: 'experiment', text })),
    ],
  };
}

function pickExperiments(rand, topics) {
  const out = [];
  for (const topic of topics) {
    const options = (B.EXPERIMENTS[topic] || []).filter((e) => !out.includes(e));
    if (options.length && out.length < 3) out.push(pick(rand, options));
  }
  for (const e of shuffle(rand, B.EXPERIMENTS.generic)) if (out.length < 3 && !out.includes(e)) out.push(e);
  return out.slice(0, 3);
}

export function simulateDebate({ question = '', profiles, skills = [], rule, seed = 1, preparedId = null }) {
  const prep = preparedId ? PREPARED[preparedId] : null;
  if (preparedId && !prep) throw new Error('unknown-prepared');
  const q = (prep && !question.trim() ? prep.question : question).trim().slice(0, MAX_QUESTION);
  if (!q) throw new Error('empty-question');

  const ctx = makeContext({ question: q, profiles, skills, seed });
  const moderator = ctx.byRole('moderator');
  const devil = ctx.byRole('devil');
  const speakers = ctx.active.filter((p) => p.role !== 'moderator' && p.role !== 'devil');
  const topics = prep ? prep.topics : detectTopics(q);
  let n = 0;
  const nextId = (phase) => `${phase}-${n++}`;
  const votes = {};
  const ordre = [...speakers, ...(devil ? [devil] : [])].map((p) => p.name).join(', ');

  const framing = { id: 'framing', turns: moderator ? [{ id: nextId('framing'), profileId: moderator.id,
    text: ctx.fill(prep ? prep.framing : pick(ctx.rand, B.FRAMING), { ordre }), objections: [], evidence: [] }] : [] };

  const opinions = { id: 'opinions', turns: [] };
  for (const p of speakers) {
    const turn = opinionTurn(ctx, p, prep, nextId('opinions'));
    const prev = opinions.turns[opinions.turns.length - 1];
    if (prev && ctx.rand() < 0.45) {
      turn.replyTo = prev.profileId;
      turn.stance = FAVORABLE.has(turn.vote) === FAVORABLE.has(prev.vote) ? 'agree' : 'oppose';
    }
    votes[p.id] = turn.vote;
    opinions.turns.push(turn);
  }

  const favorableCount = speakers.filter((p) => FAVORABLE.has(votes[p.id])).length;
  const devilPhase = { id: 'devil', turns: [] };
  if (devil) {
    const id = nextId('devil');
    const consensus = `${favorableCount} sièges sur ${speakers.length} votent pour, presque tous « sous condition ».`;
    const target = speakers.find((p) => FAVORABLE.has(votes[p.id])) ?? speakers[0];
    const own = prep?.devil;
    const vote = own ? own.vote : favorableCount >= speakers.length / 2 ? 'NO_GO' : 'GO_SOUS_CONDITION';
    devilPhase.turns.push({ id, profileId: devil.id, replyTo: target?.id, stance: 'oppose', vote,
      text: ctx.fill(own ? own.text : pick(ctx.rand, B.DEVIL), { consensus }),
      objections: asObjections(id, own ? own.objections : shuffle(ctx.rand, B.DEVIL_OBJECTIONS).slice(0, 2)),
      evidence: own ? own.evidence : [] });
    votes[devil.id] = vote;
  }

  const rebuttal = { id: 'rebuttal', turns: [] };
  if (devil && speakers.length) {
    const plan = prep
      ? prep.rebuttals.map((r) => ({ p: ctx.byRole(r.role), ...r })).filter((r) => r.p && r.p.role !== 'devil')
      : shuffle(ctx.rand, speakers).slice(0, Math.min(3, speakers.length)).map((p) => {
        const stance = ctx.rand() < 0.4 ? 'agree' : 'oppose';
        const old = votes[p.id];
        const harder = { GO: 'GO_SOUS_CONDITION', GO_SOUS_CONDITION: 'NO_GO', NO_GO: 'NO_GO' };
        return { p, stance, vote: stance === 'agree' ? harder[old] : old, text: pick(ctx.rand, B.REBUTTAL[stance]) };
      });
    for (const r of plan) {
      const old = votes[r.p.id];
      rebuttal.turns.push({ id: nextId('rebuttal'), profileId: r.p.id, replyTo: devil.id, stance: r.stance,
        text: ctx.fill(r.text, { diable: devil.name }), objections: [], evidence: [], vote: r.vote, changed: r.vote !== old });
      votes[r.p.id] = r.vote;
    }
  }

  const experiments = prep ? prep.experiments : pickExperiments(ctx.rand, topics);
  const allTurns = [...opinions.turns, ...devilPhase.turns, ...rebuttal.turns];
  const conclusion = buildConclusion({ votes, turns: allTurns, profiles, rule, experiments });
  const d = conclusion.decision;
  const synthesis = { id: 'synthesis', turns: moderator ? [{ id: nextId('synthesis'), profileId: moderator.id, objections: [], evidence: [],
    text: ctx.fill(pick(ctx.rand, B.SYNTHESIS), { f: d.favorable, v: d.voters, n: d.needed, outcome: B.OUTCOME_LABEL[d.outcome] }) }] : [] };

  return { question: q, topics, experiments, phases: [framing, opinions, devilPhase, rebuttal, synthesis], votes, conclusion };
}
