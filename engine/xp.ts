import type { DayKey } from './dates.ts';
import type { Difficulty, Domain, State } from './types.ts';
import { ITEMS, LOOT_POOL, RARITIES, type Bonus } from './items.ts';
import { DIFFICULTIES, PEOPLES, STAGES, stageFor } from './world.ts';
import { random } from './rng.ts';

export const MAX_LEVEL = 100;
export const xpToNext = (level: number) => Math.round(60 * Math.pow(level, 1.35));
/** Niveau d'un attribut à partir de l'XP accumulée dans son domaine. */
export const statLevel = (xp: number) => Math.floor(Math.sqrt(xp / 20)) + 1;
export const statProgress = (xp: number) => { const l = statLevel(xp); const from = 20 * (l - 1) ** 2, to = 20 * l ** 2; return (xp - from) / (to - from); };

export function maxHp(s: State) { return s.hero ? PEOPLES[s.hero.people].maxHp : 100; }

export function equippedBonuses(s: State): Bonus[] {
  return Object.values(s.equipped).flatMap(uid => {
    const owned = s.inventory.find(i => i.uid === uid);
    const b = owned && ITEMS[owned.itemId]?.bonus;
    return b ? [b] : [];
  });
}
export const damageCut = (s: State) => Math.min(0.5, equippedBonuses(s).reduce((a, b) => a + (b.damageCut ?? 0), 0));

export function multipliers(s: State, domain: Domain) {
  const people = s.hero ? PEOPLES[s.hero.people] : null;
  let xp = 1, gold = 1;
  if (people?.domain === domain) xp += 0.2;
  if (s.hero?.people === 'nain') gold += 0.15;
  xp += Math.min(0.3, s.perfectStreak * 0.02);
  for (const b of equippedBonuses(s)) {
    if (b.xpPct && (!b.domain || b.domain === domain)) xp += b.xpPct;
    if (b.goldPct) gold += b.goldPct;
  }
  xp *= 1 + 0.25 * s.age;
  if (s.nazgul.active) xp *= 0.5;
  return { xp, gold };
}

export type Gain = { xp: number; gold: number; levelUp: number; stage?: number; tags: string[] };

/** Ajoute XP + or, gère montées de niveau et étapes du Voyage. Mute `s`. */
export function grant(s: State, day: DayKey, domain: Domain, difficulty: Difficulty, scale = 1): Gain {
  const base = DIFFICULTIES[difficulty];
  const m = multipliers(s, domain);
  const xp = Math.max(1, Math.round(base.xp * scale * m.xp));
  const gold = Math.max(0, Math.round(base.gold * scale * m.gold));
  s.gold += gold; s.totalXp += xp; s.journeyXp += xp; s.stats[domain] += xp;
  const d = (s.dailyXp[day] ??= {}); d[domain] = (d[domain] ?? 0) + xp;
  let levelUp = 0;
  if (s.level < MAX_LEVEL) {
    s.xp += xp;
    while (s.level < MAX_LEVEL && s.xp >= xpToNext(s.level)) { s.xp -= xpToNext(s.level); s.level++; levelUp++; }
    if (s.level >= MAX_LEVEL) s.xp = 0;
  }
  const before = s.stage; const now = stageFor(s.journeyXp);
  const tags = [`+${xp} XP`, `+${gold} or`, `+${DOMAIN_SHORT[domain]}`];
  if (now > before) { s.stage = now; return { xp, gold, levelUp, stage: now, tags }; }
  return { xp, gold, levelUp, tags };
}
const DOMAIN_SHORT: Record<Domain, string> = { savoir: 'Savoir', vigueur: 'Vigueur', foyer: 'Foyer', forge: 'Forge', intendance: 'Intendance' };

/** Tirage de butin déterministe : même graine ⇒ même objet. */
export function rollLoot(s: State, seed: string, chance: number, minRarity?: 'rare'): string | null {
  const rnd = random(seed);
  if (!minRarity && rnd() >= chance) return null;
  const istar = s.hero?.people === 'istar' ? 1.5 : 1;
  const pool = LOOT_POOL.filter(id => !minRarity || ['rare', 'legendaire'].includes(ITEMS[id].rarity));
  const weights = pool.map(id => { const r = ITEMS[id].rarity; return RARITIES[r].weight * (r === 'rare' || r === 'legendaire' ? istar : 1); });
  let roll = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { roll -= weights[i]; if (roll < 0) return pool[i]; }
  return pool[pool.length - 1];
}

export function journeyProgress(s: State) {
  const next = STAGES[s.stage + 1];
  if (!next) return 1;
  const from = STAGES[s.stage].xp;
  return Math.min(1, (s.journeyXp - from) / (next.xp - from));
}
