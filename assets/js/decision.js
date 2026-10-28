// Règle de décision du conseil : seuil proportionnel aux sièges actifs et veto par rôle (comme /board).
const FAVORABLE = new Set(['GO', 'GO_SOUS_CONDITION']);

export function decide(votes, profiles, rule) {
  const voters = profiles.filter((p) => p.enabled && p.role !== 'moderator' && (rule.devilVotes || p.role !== 'devil'));
  const count = voters.length;
  if (count === 0) return { outcome: 'RETRAVAILLER', favorable: 0, voters: 0, needed: 0, vetoedBy: [] };

  const needed = Math.ceil(rule.threshold * count - 1e-9);
  const favorableSeats = voters.filter((p) => FAVORABLE.has(votes[p.id]));
  const favorable = favorableSeats.length;
  const vetoedBy = voters.filter((p) => rule.vetoRoles.includes(p.role) && votes[p.id] === 'NO_GO').map((p) => p.id);

  let outcome;
  if (vetoedBy.length) outcome = 'NO_GO';
  else if (favorable >= needed) outcome = favorableSeats.every((p) => votes[p.id] === 'GO') ? 'GO' : 'GO_SOUS_CONDITION';
  else outcome = favorable >= Math.ceil(count / 2) ? 'RETRAVAILLER' : 'NO_GO';
  return { outcome, favorable, voters: count, needed, vetoedBy };
}
