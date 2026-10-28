// Résumés d'une séance et d'un projet, et export Markdown (tout texte dynamique est échappé).
import { formatDate } from './i18n.js';

const md = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\|/g, '\\|');

export function conversationSummary(conv, profiles) {
  const points = conv.debate.conclusion.points;
  const status = (p) => conv.validations[p.id]?.status ?? null;
  const d = conv.debate.conclusion.decision;
  return {
    title: conv.title,
    question: conv.question,
    date: formatDate(conv.createdAt),
    outcome: d.outcome,
    tally: { favorable: d.favorable, voters: d.voters, needed: d.needed },
    votes: profiles.filter((p) => p.id in conv.debate.votes).map((p) => ({ name: p.name, title: p.title, vote: conv.debate.votes[p.id] })),
    accepted: points.filter((p) => status(p) === 'accepted').map((p) => p.text),
    rejected: points.filter((p) => status(p) === 'rejected').map((p) => p.text),
    comments: points.map((p) => conv.validations[p.id]?.comment).filter(Boolean),
    founderDecision: conv.founderDecision,
    decidedAt: conv.decidedAt,
    next: points.filter((p) => p.kind === 'experiment' && status(p) !== 'rejected').map((p) => p.text),
  };
}

export function toMarkdown(conv, profiles) {
  const s = conversationSummary(conv, profiles);
  const comment = (text) => {
    const point = conv.debate.conclusion.points.find((p) => p.text === text);
    const c = point && conv.validations[point.id]?.comment;
    return c ? ` — ${md(c)}` : '';
  };
  return [
    `# ${md(s.title)}`, '',
    `Date : ${s.date}  `, `Question : ${md(s.question)}`, '',
    `## Décision du conseil : ${s.outcome}`, '',
    `${s.tally.favorable} favorables sur ${s.tally.voters} · seuil ${s.tally.needed}`, '',
    '| Siège | Rôle | Vote |', '| --- | --- | --- |',
    ...s.votes.map((v) => `| ${md(v.name)} | ${md(v.title)} | ${v.vote} |`), '',
    '## Points validés', ...(s.accepted.length ? s.accepted.map((t) => `- ✓ ${md(t)}${comment(t)}`) : ['- aucun']), '',
    '## Points rejetés', ...(s.rejected.length ? s.rejected.map((t) => `- ✗ ${md(t)}${comment(t)}`) : ['- aucun']), '',
    '## Prochaines étapes', ...s.next.map((t) => `- ${md(t)}`), '',
    `## Ta décision : ${s.founderDecision ?? 'en attente'}${s.decidedAt ? ` (${formatDate(s.decidedAt)})` : ''}`, '',
    '_Démo AIdvisors : personnages fictifs, réponses simulées. Ceci n’est pas un conseil juridique, fiscal ou financier._', '',
  ].join('\n');
}

export function projectSummary(project, convs) {
  const decisions = convs.filter((c) => c.projectId === project.id && c.founderDecision && c.decidedAt)
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
    .map((c) => ({ id: c.id, title: c.title, founderDecision: c.founderDecision, date: formatDate(c.decidedAt),
      outcome: c.debate.conclusion.decision.outcome }));
  return { name: project.name, decisions };
}
