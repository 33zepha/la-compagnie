import type { DayKey } from './dates.ts';

export type Domain = 'savoir' | 'vigueur' | 'foyer' | 'forge' | 'intendance';
export type Difficulty = 'facile' | 'moyen' | 'difficile' | 'epique';
export type PeopleId = 'hobbit' | 'elfe' | 'nain' | 'homme' | 'istar';
export type HomelandId = 'comte' | 'fondcombe' | 'erebor' | 'rohan' | 'gondor' | 'lorien';
export type Rarity = 'commun' | 'peu-commun' | 'rare' | 'legendaire';
export type Slot = 'arme' | 'armure' | 'talisman';

export type Look = { hair: string; cape: string; skin: string };
export type Hero = { name: string; people: PeopleId; homeland: HomelandId; look: Look; createdAt: DayKey };

/** Rituel : habitude sur certains jours (ISO 1-7, vide = tous les jours).
 *  Quête : tâche ponctuelle, échéance facultative.
 *  Corvée : revient tous les `every` jours après la dernière fois. */
export type Quest = {
  id: string; kind: 'rituel' | 'quete' | 'corvee'; title: string; domain: Domain; difficulty: Difficulty;
  createdAt: DayKey; notes?: string; archived?: boolean;
  days?: number[]; streak?: number; best?: number;
  due?: DayKey | null; completedAt?: DayKey;
  every?: number; lastDone?: DayKey;
  doneOn: DayKey[];
};
export type Step = { id: string; title: string; done: boolean; doneOn?: DayKey };
export type Project = { id: string; title: string; domain: Domain; boss: string; steps: Step[]; due?: DayKey | null; createdAt: DayKey; completedAt?: DayKey };
export type Course = { id: string; subject: string; type: 'CM' | 'TD' | 'TP' | 'Autre'; weekday: number; start: string; end: string; room: string };
export type Exam = { id: string; subject: string; date: DayKey; prep: Step[]; grade?: number; resolvedOn?: DayKey };
export type Provision = { id: string; label: string; checked: boolean };
export type Reward = { id: string; title: string; cost: number };
export type Purchase = { id: string; title: string; cost: number; day: DayKey };
export type OwnedItem = { uid: string; itemId: string; gotOn: DayKey };
export type JournalEntry = { id: string; day: DayKey; title: string; text: string; tone: 'gain' | 'perte' | 'evenement'; tags?: string[] };

export type Counters = {
  questsDone: number; ritualsDone: number; choresDone: number; stepsDone: number; projectsDone: number;
  coursesAttended: number; coursesReviewed: number; prepsDone: number; examsWon: number; examsBest: number;
  provisionRuns: number; purchases: number; goldSpent: number; lootFound: number; legendaryFound: number;
  perfectDays: number; bestPerfectStreak: number; falls: number; nazgulDefeated: number; haltesUsed: number; potionsDrunk: number;
};

export type State = {
  version: 1;
  hero: Hero | null;
  level: number; xp: number; totalXp: number; journeyXp: number; age: number; stage: number;
  gold: number; hp: number; hope: number; shadow: number;
  stats: Record<Domain, number>;
  quests: Quest[]; projects: Project[]; courses: Course[]; exams: Exam[];
  attendance: Record<string, 'present' | 'relu'>;
  provisions: Provision[]; rewards: Reward[]; purchases: Purchase[];
  inventory: OwnedItem[]; equipped: Partial<Record<Slot, string>>;
  consumables: { potion: number; lembas: number; halte: number };
  haltes: { month: string; used: number }; frozenDays: DayKey[];
  rest: { from: DayKey; to: DayKey } | null; lastRestStart?: DayKey;
  lastProcessed: DayKey; perfectStreak: number;
  nazgul: { active: boolean; progress: number };
  journal: JournalEntry[];
  trophies: Record<string, DayKey>;
  counters: Counters;
  dailyXp: Record<DayKey, Partial<Record<Domain, number>>>;
  shadowLog: Record<DayKey, number>;
  settings: { dayStartHour: number; sound: boolean; clockOffset: number };
  lastBackup?: DayKey;
};

/** Ce que le joueur voit après une action ou une nuit : le « parchemin » (repris du reçu d'EXISTENCES). */
export type GameEvent =
  | { type: 'reward'; title: string; text: string; tags: string[]; loot?: string; levelUp?: number; stage?: number }
  | { type: 'night'; days: number; damage: number; entries: JournalEntry[] }
  | { type: 'fallen'; day: DayKey; lostItem?: string; goldLost: number }
  | { type: 'nazgul'; summoned: boolean }
  | { type: 'trophy'; id: string }
  | { type: 'info'; text: string };
