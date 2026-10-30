// Repris d'EXISTENCES (engine/world.ts) : hachage FNV-1a et générateur déterministe.
export function hash(text: string) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function random(seed: string) { let a = hash(seed); return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function pick<T>(rnd: () => number, list: readonly T[]) { return list[Math.floor(rnd() * list.length)]; }
export function uid(prefix = 'id') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
