// Lecture du débat : une seule minuterie active à la fois ; stop() est appelé à chaque changement d'écran.
import { advance } from '../engine.js';

let timer = null;
let token = 0;

export const player = {
  /** getConv/setConv lisent et enregistrent la séance ; onTurn rend un tour et renvoie sa durée en ms. */
  start({ getConv, setConv, onTurn, onEnd, delay = 300 }) {
    this.stop();
    const mine = ++token;
    const step = () => {
      if (mine !== token) return;
      const conv = getConv();
      if (!conv) return;
      const { conv: next, turn } = advance(conv);
      if (next !== conv) setConv(next);
      if (!turn) { if (next.status !== 'paused' && next.status !== 'playing') onEnd(next); return; }
      timer = setTimeout(step, Math.max(60, onTurn(turn, next, mine)));
    };
    timer = setTimeout(step, delay);
    return mine;
  },
  stop() { token += 1; clearTimeout(timer); timer = null; },
  alive(mine) { return mine === token; },
};
