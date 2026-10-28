// Moteur de séance : fonctions pures sur une conversation (lecture, pause, interventions, « creuser », évolution).
import { seedFrom, pick } from './rng.js';
import { simulateDebate, makeContext, buildConclusion, PREPARED, MAX_QUESTION } from './simulator.js';
import { INTERJECTION, DIG, SYNTHESIS, OUTCOME_LABEL } from './banks.js';

const FAVORABLE = new Set(['GO', 'GO_SOUS_CONDITION']);
const endStatus = (conv) => (conv.founderDecision ? 'decided' : 'awaiting-validation');

export function newConversation({ projectId, question = '', preparedId = null, profiles, skills, rule, now = new Date(), seed }) {
  const s = (seed ?? seedFrom(`${now.toISOString()}|${question}|${preparedId ?? ''}`)) >>> 0;
  const debate = simulateDebate({ question, profiles, skills, rule, seed: s, preparedId });
  const title = preparedId ? PREPARED[preparedId].title
    : debate.question.length > 70 ? `${debate.question.slice(0, 69)}…` : debate.question;
  return { id: `c-${s.toString(36)}-${now.getTime().toString(36)}`, projectId, title, question: debate.question,
    createdAt: now.toISOString(), seed: s, preparedId, debate, cursor: 0, status: 'playing', validations: {},
    founderDecision: null, archived: false, decidedAt: null };
}

export function flatTurns(conv) {
  return conv.debate.phases.flatMap((ph) => ph.turns.map((t) => ({ ...t, phase: ph.id })));
}

export function advance(conv) {
  if (conv.status !== 'playing') return { conv, turn: null };
  const turns = flatTurns(conv);
  if (conv.cursor >= turns.length) return { conv: { ...conv, status: endStatus(conv) }, turn: null };
  const cursor = conv.cursor + 1;
  return { conv: { ...conv, cursor, status: cursor >= turns.length ? endStatus(conv) : 'playing' }, turn: turns[conv.cursor] };
}

export const pause = (conv) => (conv.status === 'playing' ? { ...conv, status: 'paused' } : conv);
export const resume = (conv) => (conv.status === 'paused' ? { ...conv, status: 'playing' } : conv);
export const skipToEnd = (conv) => ({ ...conv, cursor: flatTurns(conv).length, status: endStatus(conv) });

/** Insère une phase juste après le tour en cours : la phase en cours est coupée en deux si besoin. */
function insertAtCursor(phases, cursor, phase) {
  const out = [];
  let seen = 0, inserted = false;
  for (const ph of phases) {
    const n = ph.turns.length;
    if (!inserted && cursor < seen + n) {
      const k = cursor - seen;
      if (k > 0) out.push({ ...ph, turns: ph.turns.slice(0, k) });
      out.push(phase);
      out.push({ ...ph, turns: ph.turns.slice(k) });
      inserted = true;
    } else out.push(ph);
    seen += n;
  }
  if (!inserted) out.push(phase);
  return out;
}

const countPhases = (conv, id) => conv.debate.phases.filter((p) => p.id === id).length;

export function interject(conv, { text, mentionId = null }, profiles, skills) {
  const remark = String(text ?? '').trim().slice(0, MAX_QUESTION);
  if (!remark) return conv;
  const k = countPhases(conv, 'interjection');
  const ctx = makeContext({ question: conv.debate.question, profiles, skills, seed: conv.seed + 101 * (k + 1) });
  const replier = ctx.active.find((p) => p.id === mentionId) ?? ctx.byRole('moderator') ?? ctx.active[0];
  const turns = [{ id: `int${k}-0`, profileId: 'founder', text: remark, objections: [], evidence: [] }];
  if (replier) {
    const short = remark.length > 80 ? `${remark.slice(0, 79)}…` : remark;
    turns.push({ id: `int${k}-1`, profileId: replier.id, replyTo: 'founder', stance: 'agree', objections: [], evidence: [],
      text: ctx.fill(pick(ctx.rand, INTERJECTION.reply), { remarque: short, angle: replier.lens }) });
    const others = ctx.active.filter((p) => p.id !== replier.id && p.role !== 'moderator');
    const count = Math.min(others.length, ctx.rand() < 0.5 ? 1 : 2);
    for (let i = 0; i < count; i++) {
      const p = others.splice(Math.floor(ctx.rand() * others.length), 1)[0];
      const textR = pick(ctx.rand, INTERJECTION.react);
      turns.push({ id: `int${k}-${i + 2}`, profileId: p.id, replyTo: replier.id, objections: [], evidence: [],
        stance: /pas tout à fait|Attention/.test(textR) ? 'oppose' : 'agree', text: textR });
    }
  }
  const phases = insertAtCursor(conv.debate.phases, conv.cursor, { id: 'interjection', turns });
  return { ...conv, debate: { ...conv.debate, phases }, status: 'playing' };
}

const soften = { NO_GO: 'GO_SOUS_CONDITION', GO_SOUS_CONDITION: 'GO_SOUS_CONDITION', GO: 'GO' };

export function dig(conv, pointId, profiles, skills, rule) {
  const point = conv.debate.conclusion.points.find((p) => p.id === pointId);
  if (!point) return conv;
  const k = countPhases(conv, 'dig');
  const ctx = makeContext({ question: conv.debate.question, profiles, skills, seed: conv.seed + 977 * (k + 1) });
  const votes = { ...conv.debate.votes };
  const author = ctx.active.find((p) => p.id === point.author) ?? ctx.byRole('moderator') ?? ctx.active[0];
  const devil = ctx.byRole('devil');
  const allies = ctx.active.filter((p) => p !== author && p !== devil && p.role !== 'moderator');
  const ally = allies.length ? pick(ctx.rand, allies) : null;
  const objection = point.text;
  const turns = [];
  const say = (p, bank, extra = {}) => {
    const t = { id: `dig${k}-${turns.length}`, profileId: p.id, objections: [], evidence: [], text: ctx.fill(pick(ctx.rand, bank), { objection }), ...extra };
    if (p.id in votes && p.role !== 'moderator') {
      const next = extra.vote ?? votes[p.id];
      t.vote = next; t.changed = next !== votes[p.id]; votes[p.id] = next;
    }
    turns.push(t);
  };
  if (author) say(author, DIG.author, author.id in votes ? { vote: soften[votes[author.id]] } : {});
  if (devil) say(devil, DIG.devil, { replyTo: author?.id, stance: 'oppose' });
  if (ally) say(ally, DIG.ally, { replyTo: author?.id, stance: 'agree' });

  const allTurns = [...flatTurns(conv), ...turns];
  const conclusion = buildConclusion({ votes, turns: allTurns, profiles, rule, experiments: conv.debate.experiments });
  const moderator = ctx.byRole('moderator');
  const d = conclusion.decision;
  if (moderator) {
    turns.push({ id: `dig${k}-${turns.length}`, profileId: moderator.id, objections: [], evidence: [],
      text: ctx.fill(pick(ctx.rand, SYNTHESIS), { f: d.favorable, v: d.voters, n: d.needed, outcome: OUTCOME_LABEL[d.outcome] }) });
  }
  const phases = [...conv.debate.phases, { id: 'dig', point: pointId, turns }];
  return { ...conv, debate: { ...conv.debate, phases, votes, conclusion }, status: 'playing' };
}

export function voteTimeline(conv) {
  const current = {};
  const out = [];
  for (const t of flatTurns(conv)) {
    if (!t.vote) continue;
    current[t.profileId] = t.vote;
    const tally = { GO: 0, GO_SOUS_CONDITION: 0, NO_GO: 0 };
    for (const v of Object.values(current)) tally[v] += 1;
    out.push({ turnId: t.id, tally });
  }
  return out;
}

/** Votes actuels des seuls sièges votants (même périmètre que la règle de décision). */
export function liveTally(conv, profiles, rule) {
  const voters = new Set(profiles.filter((p) => p.enabled && p.role !== 'moderator' && (rule.devilVotes || p.role !== 'devil')).map((p) => p.id));
  const current = {};
  for (const t of flatTurns(conv)) if (t.vote && voters.has(t.profileId)) current[t.profileId] = t.vote;
  const tally = { GO: 0, GO_SOUS_CONDITION: 0, NO_GO: 0 };
  for (const v of Object.values(current)) tally[v] += 1;
  return tally;
}

export function agreementEdges(conv) {
  const map = new Map();
  for (const t of flatTurns(conv)) {
    if (!t.replyTo || !t.stance || t.replyTo === t.profileId) continue;
    const key = `${t.profileId}|${t.replyTo}|${t.stance}`;
    const e = map.get(key) ?? { from: t.profileId, to: t.replyTo, kind: t.stance, weight: 0 };
    map.set(key, { ...e, weight: e.weight + 1 });
  }
  return [...map.values()];
}

export function validatePoint(conv, pointId, status, comment) {
  const prev = conv.validations[pointId] ?? { status: null, comment: '' };
  const next = { status: status ?? prev.status, comment: String(comment ?? prev.comment ?? '').slice(0, MAX_QUESTION) };
  return { ...conv, validations: { ...conv.validations, [pointId]: next } };
}

export function decideAsFounder(conv, decision, now = new Date()) {
  return { ...conv, founderDecision: decision, status: 'decided', decidedAt: now.toISOString() };
}

export const isFavorable = (vote) => FAVORABLE.has(vote);
