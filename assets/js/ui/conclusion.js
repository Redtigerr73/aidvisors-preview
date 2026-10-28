// Conclusion du conseil : décision, points à valider ou rejeter, « creuser », décision du fondateur, export.
import { h } from '../dom.js';
import { t, formatDate } from '../i18n.js';
import { toMarkdown } from '../summary.js';

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'seance';

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = h('a', { href: url, download: name, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** actions : { validate(pointId, status), comment(pointId, text), dig(pointId), decide(decision) } */
export function renderConclusion(conv, profiles, actions) {
  const { decision, points } = conv.debate.conclusion;
  const vetoNames = decision.vetoedBy.map((id) => profiles.find((p) => p.id === id)?.name).filter(Boolean);
  const kindLabel = { decision: t('conclusion.decision'), objection: t('conclusion.objections'), experiment: t('conclusion.experiments') };

  const pointItem = (pt) => {
    const v = conv.validations[pt.id] ?? { status: null, comment: '' };
    const author = pt.author && profiles.find((p) => p.id === pt.author)?.name;
    const toggle = (status, label, cls) => h('button', { type: 'button', class: `btn-v ${cls}`, 'aria-pressed': String(v.status === status),
      onclick: () => actions.validate(pt.id, v.status === status ? null : status) }, label);
    const comment = h('textarea', { class: 'pt-comment', rows: 1, maxlength: 2000, 'aria-label': t('conclusion.comment'),
      placeholder: t('conclusion.comment'), value: v.comment ?? '', onchange: (e) => actions.comment(pt.id, e.target.value) });
    return h('li', { class: `point point--${pt.kind}${pt.severity ? ` sev-${pt.severity}` : ''}${v.status ? ` is-${v.status}` : ''}`, 'data-testid': 'point' },
      h('div', { class: 'pt-head' }, h('span', { class: 'pt-kind' }, kindLabel[pt.kind]),
        pt.severity ? h('span', { class: `sev sev-${pt.severity}` }, t(`severity.${pt.severity}`)) : null,
        author ? h('span', { class: 'pt-author' }, author) : null),
      h('p', { class: 'pt-text' }, pt.text),
      h('div', { class: 'pt-actions' }, toggle('accepted', t('conclusion.accept'), 'ok'), toggle('rejected', t('conclusion.reject'), 'ko'),
        pt.kind !== 'decision' ? h('button', { type: 'button', class: 'btn-link', onclick: () => actions.dig(pt.id) }, t('conclusion.dig')) : null),
      comment);
  };

  const founder = h('div', { class: 'founder', 'data-testid': 'founder', role: 'group', 'aria-label': t('conclusion.founder') },
    h('h3', {}, t('conclusion.founder')),
    h('div', { class: 'founder-btns' }, ['GO', 'NO_GO', 'CREUSER'].map((d) => h('button', { type: 'button',
      class: `btn-founder f-${d}`, 'aria-pressed': String(conv.founderDecision === d), onclick: () => actions.decide(d) }, t(`founder.${d}`)))),
    conv.decidedAt ? h('p', { class: 'decided' }, t('conclusion.decided', { date: formatDate(conv.decidedAt) })) : null);

  return h('section', { class: 'conclusion', 'data-testid': 'conclusion', 'aria-label': t('conclusion.title') },
    h('p', { class: 'kicker' }, t('conclusion.title')),
    h('div', { class: `verdict out-${decision.outcome}` },
      h('span', { class: 'verdict-label' }, t('conclusion.decision')),
      h('strong', { class: 'verdict-value display' }, t(`votes.${decision.outcome}`)),
      h('span', { class: 'verdict-tally' }, t('conclusion.tally', { f: decision.favorable, v: decision.voters, n: decision.needed })),
      vetoNames.length ? h('span', { class: 'verdict-veto' }, t('conclusion.veto', { names: vetoNames.join(', ') })) : null),
    h('h3', { class: 'pts-title' }, t('conclusion.points')),
    h('ol', { class: 'points' }, points.map(pointItem)),
    founder,
    h('button', { type: 'button', class: 'btn btn-primary btn-export', onclick: () => download(`aidvisors-${slug(conv.title)}.md`, toMarkdown(conv, profiles)) }, t('conclusion.export')));
}
