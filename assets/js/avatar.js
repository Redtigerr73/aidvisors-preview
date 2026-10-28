// Avatars SVG stylisés (jamais photographiques), décrits par des traits. Animations : classes CSS (app.css).
export const AVATAR_OPTIONS = {
  skin: ['#F2D3B1', '#E0B48C', '#C68E63', '#9E6B43', '#6E4A2E', '#4A3020'],
  hair: ['short', 'long', 'bald', 'curly', 'bun', 'swept'],
  hairColor: ['#F3F1EC', '#B9B4AA', '#D9B26B', '#A8642E', '#5A3A22', '#2B2420', '#1E1E24', '#8C2F39'],
  glasses: ['none', 'round', 'square'],
  beard: ['none', 'short', 'full'],
  outfit: ['suit', 'turtleneck', 'hoodie', 'blazer', 'robe'],
  idle: ['calm', 'curious', 'stern'],
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const MOOD = { GO: 'go', GO_SOUS_CONDITION: 'cond', NO_GO: 'nogo' };

const el = (tag, attrs, children = []) => ({ tag, attrs, children });
const oneOf = (value, key) => (AVATAR_OPTIONS[key].includes(value) ? value : AVATAR_OPTIONS[key][0]);

function outfit(kind, accent) {
  const body = 'M14 120 C16 96 34 86 60 86 C86 86 104 96 106 120 Z';
  switch (kind) {
    case 'turtleneck': return [el('path', { d: body, fill: '#15151A' }), el('path', { d: 'M46 84 Q60 92 74 84 L74 94 Q60 100 46 94 Z', fill: '#22222A' })];
    case 'hoodie': return [el('path', { d: body, fill: accent }), el('path', { d: 'M40 88 Q60 104 80 88', fill: 'none', stroke: '#0B0B0E', 'stroke-width': 3, opacity: 0.35 }),
      el('line', { x1: 54, y1: 98, x2: 53, y2: 112, stroke: '#F3F1EC', 'stroke-width': 2 }), el('line', { x1: 66, y1: 98, x2: 67, y2: 112, stroke: '#F3F1EC', 'stroke-width': 2 })];
    case 'blazer': return [el('path', { d: body, fill: '#2A2A33' }), el('path', { d: 'M50 88 L60 112 L70 88 Z', fill: '#F3F1EC' }),
      el('path', { d: 'M50 88 L44 104 L58 110 Z M70 88 L76 104 L62 110 Z', fill: accent })];
    case 'robe': return [el('path', { d: body, fill: '#0F0F13' }), el('path', { d: 'M52 88 L60 100 L68 88 L66 104 L54 104 Z', fill: '#F3F1EC' })];
    default: return [el('path', { d: body, fill: '#1C2230' }), el('path', { d: 'M50 88 L60 110 L70 88 Z', fill: '#F3F1EC' }),
      el('path', { d: 'M58 92 L62 92 L63 108 L60 112 L57 108 Z', fill: accent })];
  }
}

function hair(style, color) {
  switch (style) {
    case 'long': return [el('path', { d: 'M34 54 C30 22 90 22 86 54 L90 92 L78 90 L80 56 C70 38 50 38 40 56 L42 90 L30 92 Z', fill: color })];
    case 'bald': return [el('path', { d: 'M36 50 C36 44 38 40 40 38 L42 52 Z M84 50 C84 44 82 40 80 38 L78 52 Z', fill: color })];
    case 'curly': return [32, 42, 52, 62, 72, 82, 88].map((x, i) => el('circle', { cx: x, cy: 30 + (i % 2) * 5 + Math.abs(60 - x) / 4, r: 9, fill: color }));
    case 'bun': return [el('circle', { cx: 60, cy: 16, r: 10, fill: color }), el('path', { d: 'M35 48 C34 22 86 22 85 48 C76 34 44 34 35 48 Z', fill: color })];
    case 'swept': return [el('path', { d: 'M34 48 C30 18 84 14 88 40 C76 28 58 30 46 38 C42 40 38 44 34 48 Z', fill: color })];
    default: return [el('path', { d: 'M35 46 C34 22 86 22 85 46 C78 34 42 34 35 46 Z', fill: color })];
  }
}

function brows(idle) {
  const d = { stern: 'M44 41 L55 44 M65 44 L76 41', curious: 'M44 40 Q50 36 55 40 M65 40 Q70 36 76 40', calm: 'M44 42 L55 42 M65 42 L76 42' }[idle];
  return el('path', { d, stroke: '#1A1A1F', 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none', class: 'av-brows' });
}

function mouth(idle) {
  const d = { stern: 'M52 70 L68 70', curious: 'M52 68 Q60 74 68 68', calm: 'M52 69 Q60 72 68 69' }[idle];
  return el('path', { d, stroke: '#3A1E1A', 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none', class: 'av-mouth' });
}

function glasses(kind) {
  const frame = { stroke: '#101014', 'stroke-width': 2.2, fill: 'rgba(255,255,255,0.08)', class: 'av-glasses' };
  if (kind === 'round') return [el('circle', { cx: 50, cy: 51, r: 7, ...frame }), el('circle', { cx: 70, cy: 51, r: 7, ...frame }),
    el('line', { x1: 57, y1: 51, x2: 63, y2: 51, stroke: '#101014', 'stroke-width': 2 })];
  if (kind === 'square') return [el('rect', { x: 41, y: 45, width: 16, height: 12, rx: 2, ...frame }), el('rect', { x: 63, y: 45, width: 16, height: 12, rx: 2, ...frame }),
    el('line', { x1: 57, y1: 50, x2: 63, y2: 50, stroke: '#101014', 'stroke-width': 2 })];
  return [];
}

function beard(kind, color) {
  if (kind === 'short') return [el('path', { d: 'M38 60 C40 80 50 86 60 86 C70 86 80 80 82 60 C76 74 68 76 60 76 C52 76 44 74 38 60 Z', fill: color, opacity: 0.55 })];
  if (kind === 'full') return [el('path', { d: 'M36 56 C36 86 50 94 60 94 C70 94 84 86 84 56 C78 72 70 76 60 76 C50 76 42 72 36 56 Z', fill: color })];
  return [];
}

export function avatarTree(avatar = {}, { state = 'idle', mood = null, size = 96 } = {}) {
  const skin = HEX.test(avatar.skin) ? avatar.skin : AVATAR_OPTIONS.skin[1];
  const hairColor = HEX.test(avatar.hairColor) ? avatar.hairColor : AVATAR_OPTIONS.hairColor[5];
  const accent = HEX.test(avatar.accent) ? avatar.accent : '#E6B85C';
  const idle = oneOf(avatar.idle, 'idle');
  const classes = ['av', 'av-idle', `av-${idle}`];
  if (state === 'speaking') classes.push('av-speaking');
  if (MOOD[mood]) classes.push(`av-mood-${MOOD[mood]}`);
  return {
    tag: 'svg', ns: 'svg',
    attrs: { viewBox: '0 0 120 120', width: size, height: size, class: classes.join(' '), 'aria-hidden': 'true', focusable: 'false' },
    children: [
      el('circle', { cx: 60, cy: 60, r: 57, fill: 'none', stroke: accent, 'stroke-width': 3, class: 'av-ring' }),
      el('g', { class: 'av-body' }, [
        ...outfit(oneOf(avatar.outfit, 'outfit'), accent),
        el('rect', { x: 52, y: 74, width: 16, height: 14, rx: 6, fill: skin }),
        el('ellipse', { cx: 35, cy: 54, rx: 4, ry: 6, fill: skin }),
        el('ellipse', { cx: 85, cy: 54, rx: 4, ry: 6, fill: skin }),
        el('ellipse', { cx: 60, cy: 52, rx: 24, ry: 28, fill: skin }),
        ...beard(oneOf(avatar.beard, 'beard'), hairColor),
        ...hair(oneOf(avatar.hair, 'hair'), hairColor),
        el('g', { class: 'av-eyes' }, [el('ellipse', { cx: 50, cy: 51, rx: 2.6, ry: 3.2, fill: '#141418' }),
          el('ellipse', { cx: 70, cy: 51, rx: 2.6, ry: 3.2, fill: '#141418' })]),
        brows(idle),
        ...glasses(oneOf(avatar.glasses, 'glasses')),
        mouth(idle),
      ]),
    ],
  };
}
