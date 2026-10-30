import { addDays, diffDays, isoWeekday, monthKey, type DayKey } from './dates.ts';
import type { Course, Difficulty, Domain, Exam, GameEvent, Hero, Project, Quest, Slot, State, Step } from './types.ts';
import { DYES, ITEMS, RARITIES, SHOP, STAGE_ITEMS } from './items.ts';
import { awardTrophies } from './trophies.ts';
import { DIFFICULTIES, HALTES_PER_MONTH, HOMELANDS, PEOPLES, STAGES } from './world.ts';
import { grant, maxHp, rollLoot } from './xp.ts';
import { uid } from './rng.ts';

export type Result = { state: State; events: GameEvent[] };
const clone = (s: State) => structuredClone(s);
const ok = (state: State, events: GameEvent[] = []): Result => ({ state, events });

export const EMPTY_COUNTERS: State['counters'] = {
  questsDone: 0, ritualsDone: 0, choresDone: 0, stepsDone: 0, projectsDone: 0, coursesAttended: 0, coursesReviewed: 0,
  prepsDone: 0, examsWon: 0, examsBest: 0, provisionRuns: 0, purchases: 0, goldSpent: 0, lootFound: 0, legendaryFound: 0,
  perfectDays: 0, bestPerfectStreak: 0, falls: 0, nazgulDefeated: 0, haltesUsed: 0, potionsDrunk: 0,
};

export function blankState(today: DayKey): State {
  return {
    version: 1, hero: null, level: 1, xp: 0, totalXp: 0, journeyXp: 0, age: 0, stage: 0,
    gold: 0, hp: 100, hope: 0, shadow: 0,
    stats: { savoir: 0, vigueur: 0, foyer: 0, forge: 0, intendance: 0 },
    quests: [], projects: [], courses: [], exams: [], attendance: {}, provisions: [], rewards: [], purchases: [],
    inventory: [], equipped: {}, consumables: { potion: 1, lembas: 0, halte: 0 },
    haltes: { month: monthKey(today), used: 0 }, frozenDays: [], rest: null,
    lastProcessed: addDays(today, -1), perfectStreak: 0, nazgul: { active: false, progress: 0 },
    journal: [], trophies: {}, counters: { ...EMPTY_COUNTERS }, dailyXp: {}, shadowLog: {},
    settings: { dayStartHour: 4, sound: true, clockOffset: 0 },
  };
}

const q = (title: string, kind: Quest['kind'], domain: Domain, difficulty: Difficulty, today: DayKey, extra: Partial<Quest> = {}): Quest =>
  ({ id: uid('q'), kind, title, domain, difficulty, createdAt: today, doneOn: [], streak: 0, best: 0, ...extra });

/** Le paquetage de départ : des quêtes typiques des quatre domaines, toutes modifiables. */
export function starterPack(today: DayKey): Pick<State, 'quests' | 'rewards' | 'provisions'> {
  return {
    quests: [
      q('Boire 1,5 L d’eau', 'rituel', 'vigueur', 'facile', today),
      q('Réviser 30 min', 'rituel', 'savoir', 'moyen', today, { days: [1, 2, 3, 4, 5] }),
      q('Ranger 10 min', 'rituel', 'foyer', 'facile', today),
      q('Sport 30 min', 'rituel', 'vigueur', 'moyen', today, { days: [1, 3, 5] }),
      q('Se coucher avant minuit', 'rituel', 'vigueur', 'facile', today),
      // Échéances étalées sur la semaine, pour ne pas tout avoir à faire le premier jour.
      q('Lessive', 'corvee', 'foyer', 'moyen', today, { every: 7, lastDone: addDays(today, -5) }),
      q('Faire les courses', 'corvee', 'foyer', 'moyen', today, { every: 7, lastDone: addDays(today, -6) }),
      q('Passer l’aspirateur', 'corvee', 'foyer', 'moyen', today, { every: 7, lastDone: addDays(today, -3) }),
      q('Faire le point sur mes comptes', 'corvee', 'intendance', 'facile', today, { every: 7, lastDone: addDays(today, -1) }),
      q('Vérifier l’ENT et mes mails de la fac', 'corvee', 'savoir', 'facile', today, { every: 2 }),
    ],
    rewards: [
      { id: uid('r'), title: 'Un épisode de série', cost: 40 },
      { id: uid('r'), title: 'Une soirée jeux vidéo', cost: 120 },
      { id: uid('r'), title: 'Commander à manger', cost: 250 },
      { id: uid('r'), title: 'Une sortie resto', cost: 400 },
    ],
    provisions: ['Pâtes', 'Œufs', 'Lait', 'Fruits', 'Légumes'].map(label => ({ id: uid('p'), label, checked: false })),
  };
}

export function createHero(s0: State, hero: Hero, starter: boolean): Result {
  const s = clone(s0);
  s.hero = hero; s.hp = PEOPLES[hero.people].maxHp;
  if (starter) Object.assign(s, starterPack(hero.createdAt));
  note(s, hero.createdAt, 'Le registre est signé', `${hero.name}, ${PEOPLES[hero.people].label.toLowerCase()} de ${HOMELANDS[hero.homeland].label}, quitte Cul-de-Sac. Le chemin commence ici.`, 'evenement');
  return ok(s);
}

export function note(s: State, day: DayKey, title: string, text: string, tone: 'gain' | 'perte' | 'evenement', tags?: string[]) {
  s.journal.unshift({ id: uid('j'), day, title, text, tone, tags });
  if (s.journal.length > 500) s.journal.length = 500;
}

// —— Récompenses ————————————————————————————————————————————————

function addItem(s: State, day: DayKey, itemId: string) {
  s.inventory.push({ uid: uid('o'), itemId, gotOn: day });
  s.counters.lootFound++;
  if (ITEMS[itemId].rarity === 'legendaire') s.counters.legendaryFound++;
}

type RewardOpts = { title: string; text: string; domain: Domain; difficulty: Difficulty; seed: string; scale?: number; hope?: number; guaranteedRare?: boolean };
/** Accorde XP/or/espoir/butin, gère les étapes du Voyage et les trophées. Mute `s`. */
function reward(s: State, day: DayKey, o: RewardOpts): GameEvent[] {
  const gain = grant(s, day, o.domain, o.difficulty, o.scale);
  const tags = [...gain.tags];
  const events: GameEvent[] = [];
  let loot = rollLoot(s, o.seed, DIFFICULTIES[o.difficulty].loot, o.guaranteedRare ? 'rare' : undefined);
  if (o.hope) {
    s.hope += Math.round(o.hope * (s.hero?.people === 'elfe' ? 1.5 : 1));
    if (s.hope >= 100) {
      s.hope -= 100; tags.push('Espoir plein');
      const extra = rollLoot(s, `${o.seed}:espoir`, 1, 'rare');
      if (extra) { if (loot) addItem(s, day, loot); loot = extra; }
    }
  }
  if (loot) { addItem(s, day, loot); tags.push(`Butin : ${RARITIES[ITEMS[loot].rarity].label}`); }
  if (gain.levelUp) note(s, day, `Niveau ${s.level}`, `Tu passes niveau ${s.level}.`, 'gain');
  if (gain.stage !== undefined) {
    const st = STAGES[gain.stage];
    note(s, day, `Étape : ${st.name}`, st.text, 'evenement');
    const it = STAGE_ITEMS[gain.stage];
    if (it) { addItem(s, day, it); tags.push(`Objet d’étape`); }
  }
  events.push({ type: 'reward', title: o.title, text: o.text, tags, loot: loot ?? undefined, levelUp: gain.levelUp || undefined, stage: gain.stage });
  for (const id of awardTrophies(s, day)) events.push({ type: 'trophy', id });
  return events;
}

// —— Quêtes, rituels, corvées ————————————————————————————————————————

export const isRitualDue = (x: Quest, day: DayKey) => x.kind === 'rituel' && !x.archived && x.createdAt <= day && (!x.days?.length || x.days.includes(isoWeekday(day)));
export const choreNextDue = (x: Quest) => x.lastDone ? addDays(x.lastDone, x.every ?? 7) : x.createdAt;
export const choreLate = (x: Quest, day: DayKey) => diffDays(day, choreNextDue(x));
export const questLate = (x: Quest, day: DayKey) => x.kind === 'quete' && !x.completedAt && !x.archived && x.due ? diffDays(day, x.due) : -Infinity;

export function completeQuest(s0: State, id: string, day: DayKey): Result {
  const s = clone(s0); const x = s.quests.find(k => k.id === id);
  if (!x || x.archived) return ok(s0);
  if (x.kind === 'quete' && x.completedAt) return ok(s0);
  if (x.kind !== 'quete' && x.doneOn.includes(day)) return ok(s0);
  x.doneOn.push(day);
  let text = '';
  if (x.kind === 'rituel') {
    x.streak = (x.streak ?? 0) + 1; x.best = Math.max(x.best ?? 0, x.streak); s.counters.ritualsDone++;
    text = x.streak > 1 ? `Série de ${x.streak}. L’habitude creuse son sillon.` : 'Le rituel est accompli.';
  } else if (x.kind === 'corvee') {
    x.lastDone = day; s.counters.choresDone++;
    text = `Prochaine fois dans ${x.every ?? 7} jour${(x.every ?? 7) > 1 ? 's' : ''}.`;
  } else {
    x.completedAt = day; s.counters.questsDone++;
    text = questLate(s0.quests.find(k => k.id === id)!, day) > 0 ? 'En retard, mais accomplie. C’est ce qui compte.' : 'Quête accomplie.';
  }
  return ok(s, reward(s, day, { title: x.title, text, domain: x.domain, difficulty: x.difficulty, seed: `${day}:${x.id}:${x.doneOn.length}`, hope: x.kind === 'rituel' ? 8 : 3 }));
}

export function upsertQuest(s0: State, quest: Quest): Result {
  const s = clone(s0); const i = s.quests.findIndex(k => k.id === quest.id);
  if (i >= 0) s.quests[i] = quest; else s.quests.push(quest);
  return ok(s);
}
export function removeQuest(s0: State, id: string): Result { const s = clone(s0); s.quests = s.quests.filter(k => k.id !== id); return ok(s); }
export function newQuest(kind: Quest['kind'], today: DayKey): Quest { return q('', kind, 'foyer', 'moyen', today, kind === 'corvee' ? { every: 7 } : kind === 'quete' ? { due: null } : {}); }

// —— Grandes Quêtes ——————————————————————————————————————————————————

export function upsertProject(s0: State, p: Project): Result { const s = clone(s0); const i = s.projects.findIndex(k => k.id === p.id); if (i >= 0) s.projects[i] = p; else s.projects.push(p); return ok(s); }
export function removeProject(s0: State, id: string): Result { const s = clone(s0); s.projects = s.projects.filter(k => k.id !== id); return ok(s); }

export function completeStep(s0: State, projectId: string, stepId: string, day: DayKey): Result {
  const s = clone(s0); const p = s.projects.find(k => k.id === projectId); const st = p?.steps.find(k => k.id === stepId);
  if (!p || !st || st.done || p.completedAt) return ok(s0);
  st.done = true; st.doneOn = day; s.counters.stepsDone++;
  const left = p.steps.filter(k => !k.done).length;
  if (left > 0) return ok(s, reward(s, day, { title: st.title, text: `${p.boss} perd un point de vie. Encore ${left} coup${left > 1 ? 's' : ''}.`, domain: p.domain, difficulty: 'moyen', seed: `${day}:${st.id}` }));
  p.completedAt = day; s.counters.projectsDone++;
  note(s, day, `${p.boss} est vaincu`, `La Grande Quête « ${p.title} » est terminée.`, 'gain');
  return ok(s, reward(s, day, { title: `${p.boss} est vaincu !`, text: `« ${p.title} » : Grande Quête accomplie.`, domain: p.domain, difficulty: 'epique', scale: 1 + p.steps.length * 0.1, seed: `${day}:${p.id}:boss`, guaranteedRare: true }));
}

// —— Fac : cours et épreuves ——————————————————————————————————————————

export const attendanceKey = (courseId: string, day: DayKey) => `${courseId}@${day}`;
export function upsertCourse(s0: State, c: Course): Result { const s = clone(s0); const i = s.courses.findIndex(k => k.id === c.id); if (i >= 0) s.courses[i] = c; else s.courses.push(c); return ok(s); }
export function removeCourse(s0: State, id: string): Result { const s = clone(s0); s.courses = s.courses.filter(k => k.id !== id); return ok(s); }

export function attendCourse(s0: State, courseId: string, day: DayKey, mode: 'present' | 'relu'): Result {
  const s = clone(s0); const c = s.courses.find(k => k.id === courseId); const key = attendanceKey(courseId, day);
  if (!c) return ok(s0);
  const cur = s.attendance[key];
  if (mode === 'present' && cur) return ok(s0);
  if (mode === 'relu' && cur !== 'present') return ok(s0);
  s.attendance[key] = mode;
  if (mode === 'present') { s.counters.coursesAttended++; return ok(s, reward(s, day, { title: `${c.type} ${c.subject}`, text: 'Présent à l’appel. Le savoir entre par les oreilles.', domain: 'savoir', difficulty: 'moyen', seed: `${key}:p` })); }
  s.counters.coursesReviewed++;
  return ok(s, reward(s, day, { title: `Relire ${c.subject}`, text: 'Relu le jour même : ce qui est relu reste.', domain: 'savoir', difficulty: 'facile', seed: `${key}:r` }));
}

export function upsertExam(s0: State, e: Exam): Result { const s = clone(s0); const i = s.exams.findIndex(k => k.id === e.id); if (i >= 0) s.exams[i] = e; else s.exams.push(e); return ok(s); }
export function removeExam(s0: State, id: string): Result { const s = clone(s0); s.exams = s.exams.filter(k => k.id !== id); return ok(s); }

export function completePrep(s0: State, examId: string, stepId: string, day: DayKey): Result {
  const s = clone(s0); const e = s.exams.find(k => k.id === examId); const st = e?.prep.find(k => k.id === stepId);
  if (!e || !st || st.done || e.resolvedOn) return ok(s0);
  st.done = true; st.doneOn = day; s.counters.prepsDone++;
  const left = e.prep.filter(k => !k.done).length;
  return ok(s, reward(s, day, { title: st.title, text: left ? `L’épreuve de ${e.subject} faiblit. Encore ${left} préparation${left > 1 ? 's' : ''}.` : `Tu es prêt pour ${e.subject}.`, domain: 'savoir', difficulty: 'moyen', seed: `${day}:${st.id}` }));
}

export function resolveExam(s0: State, examId: string, grade: number, day: DayKey): Result {
  const s = clone(s0); const e = s.exams.find(k => k.id === examId);
  if (!e || e.resolvedOn) return ok(s0);
  e.grade = grade; e.resolvedOn = day;
  s.counters.examsBest = Math.max(s.counters.examsBest, grade);
  if (grade >= 10) {
    s.counters.examsWon++;
    note(s, day, `Épreuve franchie : ${e.subject}`, `${grade}/20.`, 'gain');
    return ok(s, reward(s, day, { title: `${e.subject} : ${grade}/20`, text: grade >= 16 ? 'Les Sages eux-mêmes hochent la tête.' : grade >= 14 ? 'Une victoire nette.' : 'L’épreuve est franchie.', domain: 'savoir', difficulty: 'epique', scale: 1 + (grade - 10) / 10, seed: `${e.id}:note`, guaranteedRare: grade >= 14 }));
  }
  note(s, day, `Épreuve perdue : ${e.subject}`, `${grade}/20. Il y aura un rattrapage, et tu y seras mieux armé.`, 'perte');
  return ok(s, reward(s, day, { title: `${e.subject} : ${grade}/20`, text: 'Tu as tenu jusqu’au bout. On se relève et on prépare le rattrapage.', domain: 'savoir', difficulty: 'facile', seed: `${e.id}:note` }));
}

// —— Provisions ————————————————————————————————————————————————————

export function setProvisions(s0: State, list: State['provisions']): Result { const s = clone(s0); s.provisions = list; return ok(s); }
export function finishProvisions(s0: State, day: DayKey): Result {
  const n = s0.provisions.filter(p => p.checked).length; if (!n) return ok(s0);
  const s = clone(s0); s.provisions = s.provisions.filter(p => !p.checked); s.counters.provisionRuns++;
  return ok(s, reward(s, day, { title: 'Le garde-manger est plein', text: `${n} provision${n > 1 ? 's' : ''} rapportée${n > 1 ? 's' : ''} du marché.`, domain: 'foyer', difficulty: n <= 5 ? 'facile' : n <= 12 ? 'moyen' : 'difficile', seed: `${day}:provisions:${s.counters.provisionRuns}`, hope: 3 }));
}

// —— Auberge, sac, soins ——————————————————————————————————————————————

const spend = (s: State, cost: number) => { if (s.gold < cost) return false; s.gold -= cost; s.counters.goldSpent += cost; return true; };

export function buyReward(s0: State, rewardId: string, day: DayKey): Result {
  const s = clone(s0); const r = s.rewards.find(k => k.id === rewardId);
  if (!r || !spend(s, r.cost)) return ok(s0, [{ type: 'info', text: 'Pas assez d’or.' }]);
  s.purchases.unshift({ id: uid('a'), title: r.title, cost: r.cost, day }); s.counters.purchases++;
  note(s, day, 'Une tournée au Poney Fringant', `${r.title} (−${r.cost} or). Profites-en, tu l’as gagné.`, 'evenement');
  return ok(s, [{ type: 'info', text: `${r.title} : profite, c’est mérité.` }, ...awardTrophies(s, day).map(id => ({ type: 'trophy', id }) as GameEvent)]);
}
export function upsertReward(s0: State, r: State['rewards'][number]): Result { const s = clone(s0); const i = s.rewards.findIndex(k => k.id === r.id); if (i >= 0) s.rewards[i] = r; else s.rewards.push(r); return ok(s); }
export function removeReward(s0: State, id: string): Result { const s = clone(s0); s.rewards = s.rewards.filter(k => k.id !== id); return ok(s); }

export function buyShopItem(s0: State, id: string): Result {
  const s = clone(s0); const it = SHOP.find(k => k.id === id);
  if (!it || !spend(s, it.cost)) return ok(s0, [{ type: 'info', text: 'Pas assez d’or.' }]);
  s.consumables[id as keyof State['consumables']]++;
  return ok(s, [{ type: 'info', text: `${it.title} ajouté au sac.` }]);
}
export function buyDye(s0: State, dyeId: string): Result {
  const s = clone(s0); const d = DYES.find(k => k.id === dyeId);
  if (!d || !s.hero || !spend(s, d.cost)) return ok(s0, [{ type: 'info', text: 'Pas assez d’or.' }]);
  s.hero.look.cape = d.color;
  return ok(s, [{ type: 'info', text: `Ta cape est désormais teinte : ${d.title.replace('Teinture ', '')}.` }]);
}
export function drink(s0: State, kind: 'potion' | 'lembas', day: DayKey): Result {
  if (s0.consumables[kind] < 1) return ok(s0);
  const s = clone(s0); const heal = kind === 'potion' ? 30 : 60; const max = maxHp(s);
  if (s.hp >= max) return ok(s0, [{ type: 'info', text: 'Tes PV sont déjà au maximum.' }]);
  s.consumables[kind]--; s.counters.potionsDrunk++; s.hp = Math.min(max, s.hp + heal);
  note(s, day, kind === 'potion' ? 'Une potion bue' : 'Un morceau de lembas', `+${heal} PV.`, 'gain');
  return ok(s, [{ type: 'info', text: `+${heal} PV` }]);
}
export function equip(s0: State, itemUid: string | null, slot: Slot): Result {
  const s = clone(s0);
  if (!itemUid) { delete s.equipped[slot]; return ok(s); }
  const owned = s.inventory.find(i => i.uid === itemUid); if (!owned || ITEMS[owned.itemId].slot !== slot) return ok(s0);
  s.equipped[slot] = itemUid;
  return ok(s, awardTrophies(s, s.lastProcessed).map(id => ({ type: 'trophy', id }) as GameEvent));
}
export const SELL_PRICE: Record<string, number> = { commun: 5, 'peu-commun': 15, rare: 40, legendaire: 100 };
export function sellItem(s0: State, itemUid: string): Result {
  const s = clone(s0); const owned = s.inventory.find(i => i.uid === itemUid); if (!owned) return ok(s0);
  const price = SELL_PRICE[ITEMS[owned.itemId].rarity];
  s.inventory = s.inventory.filter(i => i.uid !== itemUid);
  for (const k of Object.keys(s.equipped) as Slot[]) if (s.equipped[k] === itemUid) delete s.equipped[k];
  s.gold += price;
  return ok(s, [{ type: 'info', text: `Vendu pour ${price} or.` }]);
}

// —— Haltes et repos ————————————————————————————————————————————————

export function haltesLeft(s: State, day: DayKey) {
  const used = s.haltes.month === monthKey(day) ? s.haltes.used : 0;
  const monthly = HALTES_PER_MONTH + (s.hero?.people === 'homme' ? 1 : 0);
  return { monthly: Math.max(0, monthly - used), tokens: s.consumables.halte };
}
/** Gèle une journée (aujourd'hui ou demain) : aucune sanction ce jour-là. */
export function useHalte(s0: State, target: DayKey, today: DayKey): Result {
  if (target < today || s0.frozenDays.includes(target)) return ok(s0);
  const s = clone(s0); const left = haltesLeft(s, today);
  if (left.monthly > 0) { if (s.haltes.month !== monthKey(today)) s.haltes = { month: monthKey(today), used: 0 }; s.haltes.used++; }
  else if (left.tokens > 0) s.consumables.halte--;
  else return ok(s0, [{ type: 'info', text: 'Plus de Halte disponible ce mois-ci.' }]);
  s.frozenDays.push(target); s.counters.haltesUsed++;
  note(s, today, 'Halte', `La journée du ${target.split('-').reverse().slice(0, 2).join('/')} est gelée. Repose-toi.`, 'evenement');
  return ok(s, [{ type: 'info', text: 'Journée gelée : aucune sanction.' }]);
}
export const REST_COOLDOWN = 30;
export function canRest(s: State, today: DayKey) { return !s.rest && (!s.lastRestStart || diffDays(today, s.lastRestStart) >= REST_COOLDOWN); }
export function startRest(s0: State, today: DayKey, days: number): Result {
  if (!canRest(s0, today)) return ok(s0, [{ type: 'info', text: `Un repos par période de ${REST_COOLDOWN} jours.` }]);
  const s = clone(s0); const n = Math.max(1, Math.min(7, Math.round(days)));
  s.rest = { from: today, to: addDays(today, n - 1) }; s.lastRestStart = today;
  note(s, today, 'Mode repos', `${n} jour${n > 1 ? 's' : ''} sans sanction. Soigne-toi.`, 'evenement');
  return ok(s);
}
export function endRest(s0: State, today: DayKey): Result { if (!s0.rest) return ok(s0); const s = clone(s0); s.rest = { ...s.rest!, to: addDays(today, -1) }; if (s.rest.to < s.rest.from) s.rest = null; return ok(s); }

// —— Voyage ————————————————————————————————————————————————————————

export function newAge(s0: State, day: DayKey): Result {
  if (s0.stage < STAGES.length - 1) return ok(s0);
  const s = clone(s0); s.age++; s.stage = 0; s.journeyXp = 0;
  note(s, day, `Le ${s.age + 1}e Âge commence`, `Tu repars de Cul-de-Sac, plus fort : +${s.age * 25} % d’XP.`, 'evenement');
  return ok(s, awardTrophies(s, day).map(id => ({ type: 'trophy', id }) as GameEvent));
}

export function newStep(title: string): Step { return { id: uid('e'), title, done: false }; }
