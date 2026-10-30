import { get, set, del } from 'idb-keyval';
import type { State } from '../engine/types.ts';
import { blankState, EMPTY_COUNTERS } from '../engine/actions.ts';
import { hash } from '../engine/rng.ts';

const KEY = 'la-compagnie:state';
const APP = 'la-compagnie';

/** Complète un état ancien ou importé avec les champs ajoutés depuis. */
function migrate(raw: State, today: string): State {
  const base = blankState(today);
  return { ...base, ...raw, counters: { ...EMPTY_COUNTERS, ...raw.counters }, settings: { ...base.settings, ...raw.settings }, consumables: { ...base.consumables, ...raw.consumables } };
}

export async function load(today: string): Promise<State | null> {
  try { const raw = await get<State>(KEY); return raw ? migrate(raw, today) : null; }
  catch { try { const raw = localStorage.getItem(KEY); return raw ? migrate(JSON.parse(raw), today) : null; } catch { return null; } }
}
export async function save(s: State) {
  try { await set(KEY, s); } catch { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ } }
}
export async function wipe() { try { await del(KEY); } catch { /* rien */ } try { localStorage.removeItem(KEY); } catch { /* rien */ } }

// Export/import vérifiés, comme les archives d'EXISTENCES : empreinte sur l'état sérialisé.
export function exportFile(s: State) {
  const body = JSON.stringify(s);
  const file = { app: APP, version: s.version, exportedAt: new Date().toISOString(), checksum: hash(body).toString(16), state: s };
  const blob = new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `la-compagnie-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export async function importFile(file: File, today: string): Promise<State> {
  const data = JSON.parse(await file.text());
  if (data?.app !== APP || !data.state) throw new Error('Ce fichier n’est pas une sauvegarde de La Compagnie.');
  if (hash(JSON.stringify(data.state)).toString(16) !== data.checksum) throw new Error('La sauvegarde est abîmée : son empreinte ne correspond pas.');
  return migrate(data.state, today);
}
