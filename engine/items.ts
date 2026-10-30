import type { Domain, Rarity, Slot } from './types.ts';

export type Bonus = { domain?: Domain; xpPct?: number; goldPct?: number; damageCut?: number; shadowPerDay?: number };
export type Item = { title: string; sprite: string; tint?: string; rarity: Rarity; slot?: Slot; bonus?: Bonus; story: string };

export const RARITIES: Record<Rarity, { label: string; weight: number; color: string }> = {
  commun: { label: 'Commun', weight: 60, color: '#8a7f6a' },
  'peu-commun': { label: 'Peu commun', weight: 27, color: '#4f7a3a' },
  rare: { label: 'Rare', weight: 10, color: '#5b7fa8' },
  legendaire: { label: 'Légendaire', weight: 3, color: '#d4a72c' },
};

// Format repris d'EXISTENCES (engine/objects.ts) : titre, catégorie visuelle, rareté, petite histoire.
export const ITEMS: Record<string, Item> = {
  // Communs
  galet: { title: 'Un galet du Brandevin', sprite: 'gem', tint: '#9a9486', rarity: 'commun', story: 'Lisse et froid. On le serre dans la poche avant un examen.' },
  gland: { title: 'Un gland de la Vieille Forêt', sprite: 'acorn', rarity: 'commun', story: 'Il ne poussera jamais dans un studio, mais il rappelle d’où l’on vient.' },
  champignon: { title: 'Champignons du fermier Maggot', sprite: 'mushroom', rarity: 'commun', story: 'Chapardés, évidemment. Le meilleur goût du monde.' },
  corde: { title: 'Une corde elfique', sprite: 'rope', rarity: 'commun', story: 'Légère, solide, et elle revient quand on l’appelle. Presque.' },
  carte: { title: 'Une carte griffonnée', sprite: 'map', rarity: 'commun', story: 'Le chemin y est faux, mais la direction est juste.' },
  pipe: { title: 'Une pipe en bruyère', sprite: 'pipe', rarity: 'commun', story: 'Pour les pauses méritées, pas pour les autres.' },
  lanterne: { title: 'Une lanterne de mineur', sprite: 'lantern', rarity: 'commun', story: 'Elle éclaire juste assez pour faire le pas suivant.' },
  cle: { title: 'Une clé sans serrure', sprite: 'key', rarity: 'commun', story: 'Un jour, une porte s’ouvrira avec. Peut-être une salle de cours.' },
  bottes: { title: 'Des bottes ressemelées', sprite: 'boots', rarity: 'commun', slot: 'armure', bonus: { domain: 'vigueur', xpPct: 0.03 }, story: 'Elles ont fait le tour du quartier cent fois.' },
  dague: { title: 'Une dague de Bree', sprite: 'dagger', rarity: 'commun', slot: 'arme', bonus: { domain: 'foyer', xpPct: 0.03 }, story: 'Plus utile pour couper le pain que pour se battre.' },
  plume: { title: 'Une plume de scribe', sprite: 'scroll', tint: '#e8d9b0', rarity: 'commun', slot: 'talisman', bonus: { domain: 'savoir', xpPct: 0.03 }, story: 'Elle ne fait pas de fautes. Celui qui la tient, si.' },
  piece: { title: 'Une pièce de cuivre du Gondor', sprite: 'coin', tint: '#c2762e', rarity: 'commun', slot: 'talisman', bonus: { goldPct: 0.03 }, story: 'Usée par mille marchés.' },
  // Peu communs
  cape: { title: 'Une cape grise de voyage', sprite: 'cloak', tint: '#7d7f78', rarity: 'peu-commun', slot: 'armure', bonus: { damageCut: 0.05 }, story: 'On s’y enroule les jours de pluie et de doute.' },
  arc: { title: 'Un arc de la Forêt Noire', sprite: 'bow', rarity: 'peu-commun', slot: 'arme', bonus: { domain: 'vigueur', xpPct: 0.06 }, story: 'Il demande un bras fort et un souffle calme.' },
  hache: { title: 'Une hache de forge naine', sprite: 'axe', rarity: 'peu-commun', slot: 'arme', bonus: { domain: 'forge', xpPct: 0.06 }, story: 'Elle a fendu plus de bûches que de casques.' },
  grimoire: { title: 'Un traité de géographie ancienne', sprite: 'book', tint: '#5b7fa8', rarity: 'peu-commun', slot: 'talisman', bonus: { domain: 'savoir', xpPct: 0.06 }, story: 'Les rivières y portent d’autres noms, mais coulent au même endroit.' },
  registre: { title: 'Un registre de comptes', sprite: 'book', tint: '#8a6db0', rarity: 'peu-commun', slot: 'talisman', bonus: { domain: 'intendance', xpPct: 0.06 }, story: 'Chaque ligne en ordre est une petite victoire.' },
  tablier: { title: 'Un tablier de l’Auberge', sprite: 'cloak', tint: '#4f7a3a', rarity: 'peu-commun', slot: 'armure', bonus: { domain: 'foyer', xpPct: 0.06 }, story: 'Taché de sauce et de fierté.' },
  heaume: { title: 'Un heaume cabossé', sprite: 'helm', rarity: 'peu-commun', slot: 'armure', bonus: { damageCut: 0.06 }, story: 'Il a reçu le coup à ta place.' },
  emeraude: { title: 'Une émeraude brute', sprite: 'gem', tint: '#4f9a5a', rarity: 'peu-commun', slot: 'talisman', bonus: { goldPct: 0.06 }, story: 'Trouvée au fond d’une poche, comme toutes les bonnes choses.' },
  champignons2: { title: 'Un panier du marché de Bree', sprite: 'mushroom', tint: '#c2762e', rarity: 'peu-commun', story: 'Les provisions d’une semaine entière, bien rangées.' },
  // Rares
  epee: { title: 'Une épée elfique qui luit', sprite: 'sword', tint: '#9fc3e6', rarity: 'rare', slot: 'arme', bonus: { damageCut: 0.1 }, story: 'Sa lame bleuit quand le danger approche. Ou quand un partiel approche.' },
  baton: { title: 'Un bâton de mage gris', sprite: 'staff', rarity: 'rare', slot: 'arme', bonus: { domain: 'intendance', xpPct: 0.1 }, story: 'Il frappe le sol et les papiers se rangent tout seuls.' },
  cotte: { title: 'Une cotte de mailles légère', sprite: 'mail', rarity: 'rare', slot: 'armure', bonus: { damageCut: 0.12 }, story: 'Fine comme une chemise, dure comme la pierre.' },
  broche: { title: 'Une broche-feuille', sprite: 'brooch', rarity: 'rare', slot: 'talisman', bonus: { domain: 'savoir', xpPct: 0.1 }, story: 'Une feuille verte veinée d’argent. Elle retient ce qu’on apprend.' },
  corne: { title: 'Une corne de guerre', sprite: 'horn', rarity: 'rare', slot: 'talisman', bonus: { domain: 'vigueur', xpPct: 0.1 }, story: 'Souffle dedans le matin du sport. Les voisins adorent.' },
  marteau: { title: 'Un marteau à runes', sprite: 'axe', tint: '#d4a72c', rarity: 'rare', slot: 'arme', bonus: { domain: 'forge', xpPct: 0.1 }, story: 'Chaque coup grave une rune de plus dans le projet.' },
  bouclier: { title: 'Un bouclier au cheval blanc', sprite: 'shield', rarity: 'rare', slot: 'armure', bonus: { domain: 'foyer', xpPct: 0.08, damageCut: 0.05 }, story: 'Il protège le foyer, littéralement.' },
  // Légendaires
  mithril: { title: 'Une chemise de mithril', sprite: 'mail', tint: '#e6eef2', rarity: 'legendaire', slot: 'armure', bonus: { damageCut: 0.25 }, story: 'Elle vaut plus que la Comté entière. Elle t’a été donnée quand même.' },
  fiole: { title: 'Une fiole de lumière', sprite: 'vial', rarity: 'legendaire', slot: 'talisman', bonus: { xpPct: 0.12 }, story: 'Une lumière pour les lieux sombres, quand toutes les autres s’éteignent.' },
  lame: { title: 'Une lame reforgée', sprite: 'sword', tint: '#f2e3a0', rarity: 'legendaire', slot: 'arme', bonus: { xpPct: 0.1, damageCut: 0.1 }, story: 'Brisée autrefois, entière à nouveau. Comme toi après un mauvais semestre.' },
  anneau: { title: 'Un anneau d’or tout simple', sprite: 'ring', rarity: 'legendaire', slot: 'talisman', bonus: { xpPct: 0.25, shadowPerDay: 2 }, story: 'Il est si léger. Il te rend plus fort. L’Ombre monte un peu chaque nuit où tu le portes.' },
  // Objets d'étape (offerts par le Voyage)
  'st-bree': { title: 'Une pinte du Poney Fringant', sprite: 'potion', tint: '#c2762e', rarity: 'commun', story: 'Elle ne vaut qu’une pinte, et c’est assez.' },
  'st-venteux': { title: 'Une pierre de la tour en ruine', sprite: 'gem', tint: '#6b6f66', rarity: 'peu-commun', story: 'Ramassée au sommet, sous le vent.' },
  'st-fondcombe': { title: 'Une lettre de conseil', sprite: 'scroll', rarity: 'peu-commun', slot: 'talisman', bonus: { xpPct: 0.05 }, story: 'Trois lignes, toutes justes.' },
  'st-moria': { title: 'Une lanterne de la Moria', sprite: 'lantern', tint: '#9fc3e6', rarity: 'rare', slot: 'talisman', bonus: { damageCut: 0.08 }, story: 'Elle n’a jamais vu le soleil, et brille quand même.' },
  'st-rohan': { title: 'Un fer à cheval d’argent', sprite: 'coin', tint: '#e6eef2', rarity: 'rare', slot: 'talisman', bonus: { goldPct: 0.1 }, story: 'D’un cheval rapide comme le vent.' },
  'st-gondor': { title: 'Une fleur d’arbre blanc', sprite: 'brooch', tint: '#f4f1e6', rarity: 'rare', slot: 'talisman', bonus: { xpPct: 0.08 }, story: 'Elle refleurit quand on n’y croit plus.' },
  'st-destin': { title: 'Une couronne d’étoiles', sprite: 'ring', tint: '#f2e3a0', rarity: 'legendaire', slot: 'talisman', bonus: { xpPct: 0.15, damageCut: 0.1 }, story: 'Pour celui ou celle qui est allé au bout du chemin.' },
};

/** Butin aléatoire : tout sauf les objets d'étape. */
export const LOOT_POOL = Object.keys(ITEMS).filter(id => !id.startsWith('st-'));
export const STAGE_ITEMS: Record<number, string> = { 1: 'st-bree', 2: 'st-venteux', 3: 'st-fondcombe', 4: 'st-moria', 7: 'st-rohan', 8: 'st-gondor', 11: 'st-destin' };

export type ShopItem = { id: 'potion' | 'lembas' | 'halte' | string; title: string; cost: number; text: string; sprite: string; tint?: string };
export const SHOP: ShopItem[] = [
  { id: 'potion', title: 'Potion de soin', cost: 40, text: '+30 PV', sprite: 'potion' },
  { id: 'lembas', title: 'Lembas', cost: 70, text: '+60 PV · une bouchée suffit', sprite: 'lembas' },
  { id: 'halte', title: 'Jeton de Halte', cost: 150, text: 'Gèle une journée de plus', sprite: 'coin', tint: '#9fc3e6' },
];
export const DYES = [
  { id: 'vert', title: 'Teinture vert Comté', color: '#4f7a3a', cost: 60 },
  { id: 'gris', title: 'Teinture gris mage', color: '#7d7f78', cost: 60 },
  { id: 'rouge', title: 'Teinture rouge Gondor', color: '#a33b2b', cost: 60 },
  { id: 'bleu', title: 'Teinture bleu elfique', color: '#5b7fa8', cost: 60 },
  { id: 'or', title: 'Teinture or du Rohan', color: '#c99a26', cost: 120 },
  { id: 'blanc', title: 'Teinture blanc pur', color: '#ece6d6', cost: 200 },
  { id: 'noir', title: 'Teinture noir de l’Ombre', color: '#2a2530', cost: 200 },
];
