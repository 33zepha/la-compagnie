import type { GameEvent } from '../engine/types.ts';

// Petits sons 8-bit générés à la volée (onde carrée), aucun fichier audio.
let ctx: AudioContext | null = null;
function tone(seq: [number, number][], type: OscillatorType = 'square', gain = 0.05) {
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of seq) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur); t += dur * 0.9;
    }
  } catch { /* audio indisponible */ }
}
export const SOUNDS = {
  quest: () => tone([[523, 0.07], [659, 0.07], [784, 0.12]]),
  level: () => tone([[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.25]]),
  loot: () => tone([[880, 0.06], [1175, 0.06], [1568, 0.15]], 'triangle', 0.07),
  hurt: () => tone([[220, 0.1], [165, 0.18]], 'sawtooth', 0.04),
  doom: () => tone([[110, 0.3], [104, 0.3], [98, 0.5]], 'sawtooth', 0.05),
  click: () => tone([[660, 0.03]], 'square', 0.025),
};
export function playFor(events: GameEvent[], enabled: boolean) {
  if (!enabled || !events.length) return;
  const e = events[0];
  if (e.type === 'reward') (e.levelUp ? SOUNDS.level : e.loot ? SOUNDS.loot : SOUNDS.quest)();
  else if (e.type === 'fallen' || (e.type === 'nazgul' && e.summoned)) SOUNDS.doom();
  else if (e.type === 'night' && e.damage > 0) SOUNDS.hurt();
  else if (e.type === 'trophy') SOUNDS.loot();
}
