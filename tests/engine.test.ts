import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dayKey, diffDays, isoWeekday } from '../engine/dates.ts';
import { attendCourse, blankState, completeQuest, completeStep, createHero, finishProvisions, newStep, resolveExam, startRest, upsertQuest, useHalte, newQuest, upsertProject, upsertCourse, buyReward } from '../engine/actions.ts';
import { processDays, PENALTY } from '../engine/day.ts';
import { rollLoot, xpToNext } from '../engine/xp.ts';
import { STAGES } from '../engine/world.ts';
import type { State } from '../engine/types.ts';

const D0 = '2026-11-02'; // un lundi
const hero = (people: 'hobbit' | 'elfe' | 'nain' | 'homme' | 'istar' = 'hobbit', starter = false) =>
  createHero(blankState(D0), { name: 'Test', people, homeland: 'comte', look: { hair: '#5a3a1e', cape: '#4f7a3a', skin: '#e8b98f' }, createdAt: D0 }, starter).state;
const ritual = (s: State, difficulty: 'facile' | 'moyen' | 'difficile' | 'epique' = 'moyen') => {
  const r = { ...newQuest('rituel', D0), title: 'Rituel', difficulty, domain: 'savoir' as const };
  return { s: upsertQuest(s, r).state, id: r.id };
};

test('dates : bascule à 4 h, jours ISO, différences', () => {
  assert.equal(dayKey(new Date(2026, 10, 3, 2, 30)), '2026-11-02');
  assert.equal(dayKey(new Date(2026, 10, 3, 4, 1)), '2026-11-03');
  assert.equal(isoWeekday(D0), 1);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(diffDays('2026-11-05', D0), 3);
});

test('courbe d’XP croissante et montée de niveau', () => {
  assert.equal(xpToNext(1), 60);
  assert.ok(xpToNext(10) > xpToNext(9));
  let { s, id } = ritual(hero('elfe'), 'epique');
  s = completeQuest(s, id, D0).state;
  assert.equal(s.level, 2); // 100 × 1,2 (bonus elfe sur Savoir) = 120 XP ≥ 60
  assert.equal(s.stats.savoir, 120);
});

test('un rituel ne se valide qu’une fois par jour', () => {
  let { s, id } = ritual(hero());
  s = completeQuest(s, id, D0).state;
  const again = completeQuest(s, id, D0);
  assert.equal(again.state, s);
  assert.equal(again.events.length, 0);
});

test('3 jours d’absence : dégâts cumulés, série cassée', () => {
  let { s, id } = ritual(hero('homme'), 'difficile');
  s = completeQuest(s, id, D0).state;
  const r = processDays(s, addDays(D0, 4)); // clôt D0 (parfait), D0+1..D0+3 (ratés)
  assert.equal(r.state.hp, 100 - 3 * 15);
  assert.equal(r.state.quests.find(q => q.id === id)!.streak, 0);
  assert.equal(r.state.lastProcessed, addDays(D0, 3));
  assert.equal(r.state.shadow, 3 * PENALTY.shadowRitual);
  const night = r.events.find(e => e.type === 'night');
  assert.ok(night && night.type === 'night' && night.days === 4 && night.damage === 45);
});

test('une Halte gèle la journée', () => {
  let { s } = ritual(hero(), 'epique');
  s = useHalte(s, D0, D0).state;
  const r = processDays(s, addDays(D0, 1));
  assert.equal(r.state.hp, 110);
  assert.equal(r.state.haltes.used, 1);
});

test('le mode repos suspend les sanctions et ne se relance pas avant 30 jours', () => {
  let { s } = ritual(hero(), 'epique');
  s = startRest(s, D0, 3).state;
  assert.equal(processDays(s, addDays(D0, 3)).state.hp, 110);
  assert.equal(processDays(s, addDays(D0, 4)).state.hp, 110 - 25);
  assert.equal(startRest(s, addDays(D0, 5), 2).state, s);
});

test('PV à 0 : chute, perte d’or, XP de niveau remise à zéro', () => {
  let { s } = ritual(hero('nain'), 'epique');
  s = { ...s, hp: 20, gold: 100, xp: 30, inventory: [{ uid: 'a', itemId: 'galet', gotOn: D0 }, { uid: 'b', itemId: 'mithril', gotOn: D0 }] };
  const r = processDays(s, addDays(D0, 1));
  assert.equal(r.state.hp, PENALTY.respawnHp);
  assert.equal(r.state.gold, 70);
  assert.equal(r.state.xp, 0);
  assert.equal(r.state.counters.falls, 1);
  assert.deepEqual(r.state.inventory.map(i => i.itemId), ['mithril']); // le légendaire est épargné
  assert.ok(r.events.some(e => e.type === 'fallen'));
});

test('Ombre à 100 : un Nazgûl, repoussé après 7 journées parfaites', () => {
  let { s, id } = ritual(hero());
  s = { ...s, shadow: 99 };
  s = processDays(s, addDays(D0, 1)).state;
  assert.equal(s.nazgul.active, true);
  for (let i = 1; i <= 7; i++) { s = completeQuest(s, id, addDays(D0, i)).state; s = processDays(s, addDays(D0, i + 1)).state; }
  assert.equal(s.nazgul.active, false);
  assert.equal(s.counters.nazgulDefeated, 1);
  assert.equal(s.shadow, 50);
});

test('le butin est déterministe pour une même graine', () => {
  const s = hero();
  for (const seed of ['a', 'b', 'c', '2026-11-02:q-1:1']) assert.equal(rollLoot(s, seed, 0.5), rollLoot(s, seed, 0.5));
  const rare = rollLoot(s, 'x', 0, 'rare');
  assert.ok(rare);
});

test('Grande Quête : chaque étape frappe le boss, la dernière le terrasse', () => {
  let s = hero();
  const p = { id: 'p', title: 'Mémoire', domain: 'forge' as const, boss: 'Le Troll', steps: [newStep('Plan'), newStep('Rédaction')], createdAt: D0 };
  s = upsertProject(s, p).state;
  s = completeStep(s, 'p', p.steps[0].id, D0).state;
  assert.equal(s.projects[0].completedAt, undefined);
  const r = completeStep(s, 'p', p.steps[1].id, D0);
  assert.equal(r.state.projects[0].completedAt, D0);
  assert.equal(r.state.counters.projectsDone, 1);
  assert.ok(r.state.inventory.length >= 1); // butin rare garanti
});

test('cours, épreuve, provisions et auberge', () => {
  let s = hero('hobbit', true);
  s = upsertCourse(s, { id: 'c', subject: 'Cartographie', type: 'TD', weekday: 1, start: '08:30', end: '10:30', room: 'B200' }).state;
  s = attendCourse(s, 'c', D0, 'present').state;
  s = attendCourse(s, 'c', D0, 'relu').state;
  assert.equal(s.counters.coursesAttended, 1);
  assert.equal(s.counters.coursesReviewed, 1);
  s = { ...s, exams: [{ id: 'e', subject: 'Géo physique', date: D0, prep: [] }] };
  s = resolveExam(s, 'e', 15, D0).state;
  assert.equal(s.counters.examsWon, 1);
  s = { ...s, provisions: s.provisions.map((p, i) => ({ ...p, checked: i < 3 })) };
  s = finishProvisions(s, D0).state;
  assert.equal(s.provisions.length, 2);
  const gold = s.gold;
  const cheap = s.rewards[0];
  s = buyReward(s, cheap.id, D0).state;
  assert.equal(s.gold, gold >= cheap.cost ? gold - cheap.cost : gold);
});

test('le Voyage compte 12 étapes croissantes', () => {
  assert.equal(STAGES.length, 12);
  for (let i = 1; i < STAGES.length; i++) assert.ok(STAGES[i].xp > STAGES[i - 1].xp);
});
