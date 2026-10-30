import type { DayKey } from './dates.ts';
import type { Domain, State } from './types.ts';
import { ITEMS } from './items.ts';
import { statLevel } from './xp.ts';

// Même motif que les trophées d'EXISTENCES : progression calculée, cible, groupe, secret éventuel.
export type Trophy = { id: string; title: string; description: string; group: string; secret?: boolean; target: number; progress: (s: State) => number };
const t = (id: string, title: string, description: string, group: string, progress: Trophy['progress'], target = 1, secret = false): Trophy => ({ id, title, description, group, progress, target, secret });
const c = (k: keyof State['counters']) => (s: State) => s.counters[k];
const stat = (d: Domain) => (s: State) => statLevel(s.stats[d]);
const bestStreak = (s: State) => Math.max(0, ...s.quests.filter(q => q.kind === 'rituel').map(q => q.best ?? 0));

export const TROPHIES: Trophy[] = [
  t('premier-pas', 'Le premier pas', 'Accomplir ta première quête.', 'Débuts', c('questsDone')),
  t('dix', 'En chemin', 'Accomplir 10 quêtes, rituels ou corvées.', 'Débuts', s => s.counters.questsDone + s.counters.ritualsDone + s.counters.choresDone, 10),
  t('cent', 'Cent foulées', 'Accomplir 100 quêtes, rituels ou corvées.', 'Débuts', s => s.counters.questsDone + s.counters.ritualsDone + s.counters.choresDone, 100),
  t('mille', 'Mille foulées', 'Accomplir 1 000 quêtes, rituels ou corvées.', 'Débuts', s => s.counters.questsDone + s.counters.ritualsDone + s.counters.choresDone, 1000),
  t('niveau-10', 'Plus tout à fait novice', 'Atteindre le niveau 10.', 'Niveaux', s => s.level, 10),
  t('niveau-25', 'Vétéran', 'Atteindre le niveau 25.', 'Niveaux', s => s.level, 25),
  t('niveau-50', 'Figure des légendes', 'Atteindre le niveau 50.', 'Niveaux', s => s.level, 50),

  t('parfait', 'Une journée sans ombre', 'Finir une journée parfaite.', 'Séries', c('perfectDays')),
  t('semaine', 'Sept soleils', '7 journées parfaites d’affilée.', 'Séries', c('bestPerfectStreak'), 7),
  t('mois', 'Une lune entière', '30 journées parfaites d’affilée.', 'Séries', c('bestPerfectStreak'), 30),
  t('rituel-21', 'L’habitude est prise', 'Tenir un rituel 21 fois d’affilée.', 'Séries', bestStreak, 21),
  t('rituel-66', 'Gravé dans la pierre', 'Tenir un rituel 66 fois d’affilée.', 'Séries', bestStreak, 66),
  t('second-dej', 'Seconde petit-déjeuner', 'Accomplir 50 rituels.', 'Séries', c('ritualsDone'), 50),

  t('savoir-10', 'Lettré de Fondcombe', 'Savoir niveau 10.', 'Domaines', stat('savoir'), 10),
  t('vigueur-10', 'Cœur de cavalier', 'Vigueur niveau 10.', 'Domaines', stat('vigueur'), 10),
  t('foyer-10', 'Une maison bien tenue', 'Foyer niveau 10.', 'Domaines', stat('foyer'), 10),
  t('forge-10', 'Le feu ne s’éteint pas', 'Forge niveau 10.', 'Domaines', stat('forge'), 10),
  t('intendance-10', 'Pas un papier qui dépasse', 'Intendance niveau 10.', 'Domaines', stat('intendance'), 10),
  t('equilibre', 'L’équilibre des cinq', 'Tous les attributs au niveau 5.', 'Domaines', s => Math.min(...(['savoir', 'vigueur', 'foyer', 'forge', 'intendance'] as Domain[]).map(d => statLevel(s.stats[d]))), 5),

  t('cours-1', 'Présent à l’appel', 'Assister à un premier cours.', 'Fac', c('coursesAttended')),
  t('cours-30', 'Archiviste de Bordeaux', 'Assister à 30 cours.', 'Fac', c('coursesAttended'), 30),
  t('cours-100', 'Pilier d’amphi', 'Assister à 100 cours.', 'Fac', c('coursesAttended'), 100),
  t('relu-20', 'Relire, c’est retenir', 'Relire 20 cours le jour même.', 'Fac', c('coursesReviewed'), 20),
  t('prepa-10', 'Préparé comme un rôdeur', 'Faire 10 préparations d’épreuve.', 'Fac', c('prepsDone'), 10),
  t('epreuve', 'L’épreuve franchie', 'Réussir une épreuve (10/20 ou plus).', 'Fac', c('examsWon')),
  t('epreuve-5', 'Le semestre tombe', 'Réussir 5 épreuves.', 'Fac', c('examsWon'), 5),
  t('mention', 'Mention des Sages', 'Obtenir 16/20 ou plus à une épreuve.', 'Fac', c('examsBest'), 16),

  t('projet', 'Le boss est tombé', 'Terminer une Grande Quête.', 'Projets', c('projectsDone')),
  t('projet-5', 'Bâtisseur', 'Terminer 5 Grandes Quêtes.', 'Projets', c('projectsDone'), 5),
  t('provisions', 'Le garde-manger est plein', 'Faire 10 sorties de courses.', 'Foyer', c('provisionRuns'), 10),
  t('corvees-30', 'Ni poussière ni linge sale', 'Accomplir 30 corvées.', 'Foyer', c('choresDone'), 30),

  t('etape-3', 'Le Conseil t’attend', 'Atteindre Fondcombe.', 'Voyage', s => s.stage + s.age * 12, 3),
  t('etape-5', 'Les arbres d’or', 'Atteindre la Lórien.', 'Voyage', s => s.stage + s.age * 12, 5),
  t('etape-8', 'La cité blanche', 'Atteindre Minas Tirith.', 'Voyage', s => s.stage + s.age * 12, 8),
  t('etape-11', 'Le fardeau est tombé', 'Atteindre la Montagne du Destin.', 'Voyage', s => s.stage + s.age * 12, 11),
  t('nouvel-age', 'Un nouvel âge', 'Commencer un Nouvel Âge.', 'Voyage', s => s.age),

  t('butin', 'Trouvaille', 'Trouver un premier objet.', 'Trésors', c('lootFound')),
  t('butin-25', 'Sac de dragon', 'Trouver 25 objets.', 'Trésors', c('lootFound'), 25),
  t('legende', 'Un objet de légende', 'Trouver un objet légendaire.', 'Trésors', c('legendaryFound')),
  t('auberge', 'Une tournée au Poney', 'Acheter une première récompense.', 'Trésors', c('purchases')),
  t('riche', 'Le trésor d’Erebor', 'Posséder 1 000 pièces d’or.', 'Trésors', s => s.gold, 1000),

  t('tombe', 'Se relever', 'Tomber une fois… et revenir.', 'Ombre', c('falls'), 1, true),
  t('nazgul', 'Pas même un Nazgûl', 'Vaincre l’Œil après qu’il s’est posé sur toi.', 'Ombre', c('nazgulDefeated'), 1, true),
  t('anneau', 'Le poids de l’or', 'Porter l’anneau d’or tout simple.', 'Ombre', s => Object.values(s.equipped).some(u => s.inventory.find(i => i.uid === u)?.itemId === 'anneau') ? 1 : 0, 1, true),
  t('lumiere', 'Plus aucune ombre', 'Faire redescendre l’Ombre à 0 après l’avoir vue au-dessus de 50.', 'Ombre', s => Object.values(s.shadowLog).some(v => v > 50) && s.shadow === 0 ? 1 : 0, 1, true),
];
export const trophy = (id: string) => TROPHIES.find(x => x.id === id)!;

/** Attribue les trophées nouvellement atteints, renvoie leurs ids. Mute `s`. */
export function awardTrophies(s: State, day: DayKey): string[] {
  const fresh: string[] = [];
  for (const tr of TROPHIES) if (!s.trophies[tr.id] && tr.progress(s) >= tr.target) { s.trophies[tr.id] = day; fresh.push(tr.id); }
  return fresh;
}
export const itemIsLegendary = (id: string) => ITEMS[id]?.rarity === 'legendaire';
