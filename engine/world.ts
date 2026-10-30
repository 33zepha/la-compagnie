import type { Difficulty, Domain, HomelandId, PeopleId } from './types.ts';

export const DOMAINS: Record<Domain, { label: string; life: string; icon: string; color: string }> = {
  savoir: { label: 'Savoir', life: 'Fac · L1 Géo', icon: 'book', color: '#5b7fa8' },
  vigueur: { label: 'Vigueur', life: 'Sport & santé', icon: 'heart', color: '#a33b2b' },
  foyer: { label: 'Foyer', life: 'Courses & ménage', icon: 'pot', color: '#4f7a3a' },
  forge: { label: 'Forge', life: 'Projets perso', icon: 'hammer', color: '#c2762e' },
  intendance: { label: 'Intendance', life: 'Admin & finances', icon: 'scroll', color: '#8a6db0' },
};
export const DOMAIN_IDS = Object.keys(DOMAINS) as Domain[];

export const DIFFICULTIES: Record<Difficulty, { label: string; xp: number; gold: number; damage: number; loot: number }> = {
  facile: { label: 'Facile', xp: 10, gold: 2, damage: 5, loot: 0.05 },
  moyen: { label: 'Moyen', xp: 25, gold: 5, damage: 10, loot: 0.10 },
  difficile: { label: 'Difficile', xp: 50, gold: 10, damage: 15, loot: 0.20 },
  epique: { label: 'Épique', xp: 100, gold: 20, damage: 25, loot: 0.40 },
};
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

export type People = { id: PeopleId; label: string; plural: string; domain: Domain; bonus: string; maxHp: number; titles: string[]; blurb: string };
export const PEOPLES: Record<PeopleId, People> = {
  hobbit: { id: 'hobbit', label: 'Hobbit', plural: 'Hobbits', domain: 'foyer', maxHp: 110, bonus: '+20 % XP Foyer · +10 PV max',
    blurb: 'Petit, têtu, et bien plus résistant qu’il n’y paraît. Six repas par jour ne sont pas une faiblesse.',
    titles: ['Jardinier', 'Marcheur de la Comté', 'Porteur de lanterne', 'Compagnon de route', 'Gardien du sentier', 'Thain de la Comté', 'Porteur de l’espoir', 'Héros de la Comté'] },
  elfe: { id: 'elfe', label: 'Elfe', plural: 'Elfes', domain: 'savoir', maxHp: 100, bonus: '+20 % XP Savoir · Espoir +50 %',
    blurb: 'Patient comme les étoiles. L’étude n’est jamais une corvée quand on a l’éternité devant soi.',
    titles: ['Élève du chant', 'Veilleur des étoiles', 'Lettré de Fondcombe', 'Archer des marches', 'Gardien des archives', 'Seigneur des bois', 'Haut-Elfe', 'Étoile de l’Ouest'] },
  nain: { id: 'nain', label: 'Nain', plural: 'Nains', domain: 'forge', maxHp: 100, bonus: '+20 % XP Forge · +15 % d’or',
    blurb: 'Ce qui est commencé est fini, et bien fini. Chaque projet est une forge qui ne s’éteint pas.',
    titles: ['Apprenti mineur', 'Tailleur de pierre', 'Forgeron', 'Maître des galeries', 'Gardien de la porte', 'Seigneur des salles', 'Roi sous la Montagne', 'Légende d’Erebor'] },
  homme: { id: 'homme', label: 'Homme', plural: 'Hommes', domain: 'vigueur', maxHp: 100, bonus: '+20 % XP Vigueur · +1 Halte par mois',
    blurb: 'Mortel, donc pressé. Chaque matin est une chevauchée de plus vers ce qu’on veut devenir.',
    titles: ['Écuyer', 'Rôdeur du Nord', 'Cavalier du Rohan', 'Garde de la Citadelle', 'Capitaine', 'Maréchal', 'Seigneur des Hommes', 'Roi revenu'] },
  istar: { id: 'istar', label: 'Istar', plural: 'Istari', domain: 'intendance', maxHp: 100, bonus: '+20 % XP Intendance · butin rare ×1,5',
    blurb: 'Un mage n’est jamais en retard sur ses papiers. Il les rend précisément quand il le doit.',
    titles: ['Novice gris', 'Porteur de bâton', 'Conseiller', 'Mage errant', 'Gardien du feu', 'Mage blanc', 'Messager de l’Ouest', 'Istar accompli'] },
};
export const PEOPLE_IDS = Object.keys(PEOPLES) as PeopleId[];
export const TITLE_LEVELS = [1, 5, 10, 18, 28, 40, 60, 85];
export function heroTitle(people: PeopleId, level: number) {
  let i = 0; TITLE_LEVELS.forEach((l, k) => { if (level >= l) i = k; });
  return PEOPLES[people].titles[i];
}

export const HOMELANDS: Record<HomelandId, { label: string; blurb: string; stage: number }> = {
  comte: { label: 'La Comté', blurb: 'Collines vertes, portes rondes, potagers.', stage: 0 },
  fondcombe: { label: 'Fondcombe', blurb: 'La dernière maison simple à l’est de la mer.', stage: 3 },
  erebor: { label: 'Erebor', blurb: 'Une montagne seule, pleine de forges.', stage: 0 },
  rohan: { label: 'Le Rohan', blurb: 'Des plaines d’herbe et des chevaux à perte de vue.', stage: 7 },
  gondor: { label: 'Le Gondor', blurb: 'Une cité blanche adossée à la montagne.', stage: 8 },
  lorien: { label: 'La Lórien', blurb: 'Des arbres d’or où le temps ralentit.', stage: 5 },
};
export const HOMELAND_IDS = Object.keys(HOMELANDS) as HomelandId[];

/** Les 12 étapes du Voyage. `xp` = XP de voyage cumulée pour l'atteindre. x/y sur la carte 64×40. */
export const STAGES = [
  { id: 'cul-de-sac', name: 'Cul-de-Sac', xp: 0, x: 9, y: 13, text: 'La porte ronde se referme derrière toi. Le chemin commence ici, comme tous les chemins.' },
  { id: 'bree', name: 'Bree', xp: 300, x: 16, y: 13, text: 'Une auberge pleine de bruit, une pinte, et l’impression d’être observé.' },
  { id: 'mont-venteux', name: 'Mont Venteux', xp: 800, x: 21, y: 12, text: 'Au sommet, le vent tourne. Tu as tenu, même quand c’était froid.' },
  { id: 'fondcombe', name: 'Fondcombe', xp: 1600, x: 27, y: 11, text: 'Repos, musique et conseil. Ici, on décide de continuer.' },
  { id: 'moria', name: 'La Moria', xp: 2800, x: 25, y: 19, text: 'Sous la montagne, il faut avancer sans voir le bout. Tu l’as fait.' },
  { id: 'lorien', name: 'La Lórien', xp: 4500, x: 30, y: 21, text: 'Des feuilles d’or et une fiole de lumière pour les jours sombres.' },
  { id: 'rauros', name: 'Rauros', xp: 6800, x: 36, y: 27, text: 'Les chutes grondent. La Compagnie se sépare, mais toi, tu continues.' },
  { id: 'edoras', name: 'Le Rohan', xp: 9800, x: 29, y: 30, text: 'Les cavaliers t’ont vu passer. Ta discipline a désormais une réputation.' },
  { id: 'minas-tirith', name: 'Minas Tirith', xp: 13500, x: 38, y: 33, text: 'Les murs blancs tiennent bon. Les tiens aussi.' },
  { id: 'osgiliath', name: 'Osgiliath', xp: 18000, x: 42, y: 32, text: 'Une ville en ruine sur un fleuve. Il faut traverser quand même.' },
  { id: 'ithilien', name: 'L’Ithilien', xp: 23500, x: 44, y: 28, text: 'Un dernier jardin avant les terres noires. Respire.' },
  { id: 'montagne-du-destin', name: 'La Montagne du Destin', xp: 30000, x: 52, y: 29, text: 'Tu es allé au bout. Le fardeau est tombé. Un nouvel âge peut commencer.' },
] as const;
export function stageFor(journeyXp: number) { let s = 0; STAGES.forEach((st, i) => { if (journeyXp >= st.xp) s = i; }); return s; }

export const MAX_HP_BASE = 100;
export const HALTES_PER_MONTH = 2;
