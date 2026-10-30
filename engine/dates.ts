// Un « jour de jeu » est une clé AAAA-MM-JJ. La journée bascule à `startHour` (4 h par défaut),
// pour qu'une tâche faite à 1 h du matin compte encore pour la veille.
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');
const toUtc = (key: DayKey) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromUtc = (ms: number): DayKey => { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };

export function dayKey(now: Date, startHour = 4): DayKey {
  const shifted = new Date(now.getTime() - startHour * 3600_000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}
export const addDays = (key: DayKey, n: number) => fromUtc(toUtc(key) + n * 86400_000);
export const diffDays = (a: DayKey, b: DayKey) => Math.round((toUtc(a) - toUtc(b)) / 86400_000);
/** 1 = lundi … 7 = dimanche */
export const isoWeekday = (key: DayKey) => { const d = new Date(toUtc(key)).getUTCDay(); return d === 0 ? 7 : d; };
export const monthKey = (key: DayKey) => key.slice(0, 7);

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export function longDate(key: DayKey) { const [, m, d] = key.split('-').map(Number); return `${WEEKDAYS[isoWeekday(key) - 1]} ${d === 1 ? '1er' : d} ${MONTHS[m - 1]}`; }
export function shortDate(key: DayKey) { const [, m, d] = key.split('-').map(Number); return `${d} ${MONTHS[m - 1].slice(0, 4)}${MONTHS[m - 1].length > 4 ? '.' : ''}`; }
