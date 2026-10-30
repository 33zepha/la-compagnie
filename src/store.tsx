import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GameEvent, State } from '../engine/types.ts';
import { blankState, type Result } from '../engine/actions.ts';
import { processDays } from '../engine/day.ts';
import { dayKey, type DayKey } from '../engine/dates.ts';
import { load, save, wipe } from './persist.ts';
import { playFor } from './sound.ts';

type Action = (s: State, today: DayKey) => Result;
type Game = {
  s: State; today: DayKey; ready: boolean;
  run: (action: Action, undoable?: boolean) => void;
  events: GameEvent[]; shift: () => void;
  undo: (() => void) | null;
  replace: (s: State) => void; reset: () => Promise<void>;
};
const Ctx = createContext<Game | null>(null);
export const useGame = () => { const g = useContext(Ctx); if (!g) throw new Error('useGame hors du GameProvider'); return g; };

const computeToday = (s: State | null) => dayKey(new Date(Date.now() + (s?.settings.clockOffset ?? 0) * 86400_000), s?.settings.dayStartHour ?? 4);

export function GameProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State | null>(null);
  const [today, setToday] = useState(() => computeToday(null));
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [undoState, setUndoState] = useState<State | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const ref = useRef<State | null>(null); ref.current = s;

  const push = useCallback((evs: GameEvent[]) => {
    const visible = evs.filter(e => e.type !== 'night' || e.damage > 0 || e.entries.some(j => j.tone !== 'evenement'));
    if (visible.length) { setEvents(q => [...q, ...visible]); playFor(visible, ref.current?.settings.sound ?? true); }
  }, []);

  // Chargement, puis clôture des journées passées.
  useEffect(() => {
    (async () => {
      const t = computeToday(null);
      const loaded = await load(t) ?? blankState(t);
      const t2 = computeToday(loaded);
      const r = processDays(loaded, t2);
      setToday(t2); setS(r.state); push(r.events);
    })();
  }, [push]);

  // Bascule de jour pendant que l'app est ouverte (ou au retour sur l'onglet).
  useEffect(() => {
    const tick = () => {
      const cur = ref.current; if (!cur) return;
      const t = computeToday(cur);
      setToday(prev => prev === t ? prev : t);
      const r = processDays(cur, t);
      if (r.state !== cur) { setS(r.state); push(r.events); }
    };
    const id = window.setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [push]);

  // Sauvegarde différée.
  useEffect(() => { if (!s) return; const id = setTimeout(() => save(s), 250); return () => clearTimeout(id); }, [s]);

  const run = useCallback((action: Action, undoable = false) => {
    const cur = ref.current; if (!cur) return;
    const t = computeToday(cur);
    let r = action(cur, t);
    // Un changement d'horloge (réglages) peut rendre des journées à clôturer.
    const t2 = computeToday(r.state);
    if (t2 !== t) { const n = processDays(r.state, t2); r = { state: n.state, events: [...r.events, ...n.events] }; }
    setToday(t2);
    if (r.state === cur) { push(r.events); return; }
    setS(r.state); push(r.events);
    clearTimeout(undoTimer.current);
    if (undoable) { setUndoState(cur); undoTimer.current = window.setTimeout(() => setUndoState(null), 8000); }
    else setUndoState(null);
  }, [push]);

  const game = useMemo<Game | null>(() => s && ({
    s, today, ready: true, run, events,
    shift: () => setEvents(q => q.slice(1)),
    undo: undoState ? () => { setS(undoState); setUndoState(null); setEvents(q => q.filter(e => e.type !== 'reward' && e.type !== 'trophy')); } : null,
    replace: (n: State) => { setS(n); setEvents([]); },
    reset: async () => { await wipe(); const t = computeToday(null); setS(blankState(t)); setEvents([]); setToday(t); },
  }), [s, today, run, events, undoState]);

  if (!game) return <div className="boot"><span>Chargement de la Compagnie…</span></div>;
  return <Ctx.Provider value={game}>{children}</Ctx.Provider>;
}
