import { addDays, longDate, type DayKey } from './dates.ts';
import type { GameEvent, Slot, State } from './types.ts';
import { ITEMS } from './items.ts';
import { awardTrophies } from './trophies.ts';
import { choreLate, isRitualDue, note, questLate, type Result } from './actions.ts';
import { DIFFICULTIES } from './world.ts';
import { damageCut, equippedBonuses, maxHp } from './xp.ts';
import { random } from './rng.ts';

// Règles hardcore (voir le plan) : dégâts par jour clos, chute à 0 PV, Nazgûl quand l'Ombre atteint 100.
export const PENALTY = { questLatePerDay: 5, choreLatePerDay: 8, choreGrace: 2, examNoPrep: 20, shadowRitual: 3, shadowQuest: 2, shadowChore: 2, shadowFall: 15, perfectShadow: -3, perfectHeal: 5, hopeLoss: 10, fallGold: 0.3, respawnHp: 50, nazgulDays: 7 } as const;

export const isFrozen = (s: State, day: DayKey) => s.frozenDays.includes(day) || (!!s.rest && day >= s.rest.from && day <= s.rest.to);

/** Ce qui menace une journée donnée (pour l'affichage du Camp et la clôture). */
export function threats(s: State, day: DayKey) {
  const rituals = s.quests.filter(x => isRitualDue(x, day));
  const missed = rituals.filter(x => !x.doneOn.includes(day));
  const late = s.quests.filter(x => questLate(x, day) >= 0);
  const chores = s.quests.filter(x => x.kind === 'corvee' && !x.archived && choreLate(x, day) > PENALTY.choreGrace && !x.doneOn.includes(day));
  const exams = s.exams.filter(e => !e.resolvedOn && e.date === addDays(day, 1) && !e.prep.some(p => p.done));
  return { rituals, missed, late, chores, exams };
}

/** Clôt une journée. Mute `s`, renvoie les dégâts subis et les événements. */
function closeDay(s: State, day: DayKey, events: GameEvent[]): number {
  for (const b of equippedBonuses(s)) if (b.shadowPerDay) s.shadow = Math.min(100, s.shadow + b.shadowPerDay);
  const xpOfDay = Object.values(s.dailyXp[day] ?? {}).reduce((a, b) => a + (b ?? 0), 0);

  if (isFrozen(s, day)) {
    s.shadowLog[day] = s.shadow;
    note(s, day, 'Journée gelée', xpOfDay ? `Pas de sanction, et quand même +${xpOfDay} XP.` : 'Pas de sanction. Le chemin attendra.', 'evenement');
    return 0;
  }
  const t = threats(s, day);
  const cut = 1 - damageCut(s);
  let raw = 0; let shadow = 0; const lines: string[] = [];
  for (const x of t.missed) { raw += DIFFICULTIES[x.difficulty].damage; shadow += PENALTY.shadowRitual; x.streak = 0; lines.push(`rituel manqué : ${x.title}`); }
  for (const x of t.late) { raw += PENALTY.questLatePerDay; shadow += PENALTY.shadowQuest; lines.push(`quête en retard : ${x.title}`); }
  for (const x of t.chores) { raw += PENALTY.choreLatePerDay; shadow += PENALTY.shadowChore; lines.push(`corvée en souffrance : ${x.title}`); }
  for (const e of t.exams) { raw += PENALTY.examNoPrep; lines.push(`aucune préparation pour ${e.subject}`); }
  const damage = Math.round(raw * cut);
  const perfect = damage === 0 && (t.rituals.length > 0 || xpOfDay > 0);

  if (perfect) {
    s.perfectStreak++; s.counters.perfectDays++; s.counters.bestPerfectStreak = Math.max(s.counters.bestPerfectStreak, s.perfectStreak);
    s.shadow = Math.max(0, s.shadow + PENALTY.perfectShadow); s.hp = Math.min(maxHp(s), s.hp + PENALTY.perfectHeal);
    note(s, day, 'Une journée sans ombre', `${longDate(day)} : tout est fait. +${xpOfDay} XP, +${PENALTY.perfectHeal} PV, l’Ombre recule.`, 'gain');
  } else if (damage > 0) {
    s.perfectStreak = 0; s.hope = Math.max(0, s.hope - PENALTY.hopeLoss);
    s.hp -= damage; s.shadow = Math.min(100, s.shadow + shadow);
    note(s, day, `−${damage} PV`, `${longDate(day)} : ${lines.join(' · ')}.`, 'perte');
  } else {
    s.perfectStreak = 0;
  }

  if (s.nazgul.active) {
    s.nazgul.progress = perfect ? s.nazgul.progress + 1 : 0;
    if (s.nazgul.progress >= PENALTY.nazgulDays) {
      s.nazgul = { active: false, progress: 0 }; s.shadow = 50; s.counters.nazgulDefeated++;
      note(s, day, 'Le Nazgûl est repoussé', `${PENALTY.nazgulDays} jours parfaits. L’Œil se détourne, l’Ombre retombe à 50.`, 'gain');
      events.push({ type: 'nazgul', summoned: false });
    }
  }
  if (s.hp <= 0) fall(s, day, events);
  if (s.shadow >= 100 && !s.nazgul.active) {
    s.nazgul = { active: true, progress: 0 };
    note(s, day, 'L’Œil s’est posé sur toi', `Un Nazgûl te traque. ${PENALTY.nazgulDays} journées parfaites d’affilée pour le repousser ; d’ici là, l’XP est divisée par deux.`, 'perte');
    events.push({ type: 'nazgul', summoned: true });
  }
  s.shadowLog[day] = s.shadow;
  return damage;
}

function fall(s: State, day: DayKey, events: GameEvent[]) {
  const goldLost = Math.floor(s.gold * PENALTY.fallGold); s.gold -= goldLost;
  const candidates = s.inventory.filter(i => ITEMS[i.itemId].rarity !== 'legendaire');
  let lostItem: string | undefined;
  if (candidates.length) {
    const victim = candidates[Math.floor(random(`chute:${day}`)() * candidates.length)];
    lostItem = victim.itemId;
    s.inventory = s.inventory.filter(i => i.uid !== victim.uid);
    for (const k of Object.keys(s.equipped) as Slot[]) if (s.equipped[k] === victim.uid) delete s.equipped[k];
  }
  s.shadow = Math.min(100, s.shadow + PENALTY.shadowFall); s.xp = 0; s.hp = PENALTY.respawnHp; s.counters.falls++;
  note(s, day, 'Tu es tombé', `Tu te réveilles à Fondcombe. −${goldLost} or${lostItem ? `, ${ITEMS[lostItem].title.toLowerCase()} perdu` : ''}, barre de niveau remise à zéro.`, 'perte');
  events.push({ type: 'fallen', day, lostItem, goldLost });
}

/** Clôt toutes les journées entre `lastProcessed` et hier. Appelé à l'ouverture et à chaque bascule de jour. */
export function processDays(s0: State, today: DayKey): Result {
  if (!s0.hero || s0.lastProcessed >= addDays(today, -1)) return { state: s0, events: [] };
  const s = structuredClone(s0); const events: GameEvent[] = [];
  let day = addDays(s.lastProcessed, 1); let total = 0; let n = 0;
  const known = new Set(s.journal.map(j => j.id));
  while (day < today) { total += closeDay(s, day, events); s.lastProcessed = day; day = addDays(day, 1); n++; }
  for (const k of Object.keys(s.dailyXp)) if (k < addDays(today, -120)) delete s.dailyXp[k];
  const entries = s.journal.filter(j => !known.has(j.id));
  const nightly: GameEvent[] = [{ type: 'night', days: n, damage: total, entries }];
  return { state: s, events: [...nightly, ...events, ...awardTrophies(s, today).map(id => ({ type: 'trophy', id }) as GameEvent)] };
}
