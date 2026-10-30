import { useState } from 'react';
import { choreLate, choreNextDue, completeQuest, newQuest, questLate, removeQuest, upsertQuest } from '../../engine/actions.ts';
import { diffDays, shortDate, WEEKDAYS_SHORT, type DayKey } from '../../engine/dates.ts';
import { DIFFICULTIES, DIFFICULTY_IDS, DOMAINS, DOMAIN_IDS } from '../../engine/world.ts';
import { PENALTY } from '../../engine/day.ts';
import type { Quest } from '../../engine/types.ts';
import { useGame } from '../store.tsx';
import { ItemIcon } from '../pixel/Sprite.tsx';
import { Choices, DomainDot, Field, Modal } from './ui.tsx';

export const KIND_LABEL: Record<Quest['kind'], string> = { rituel: 'Rituel', quete: 'Quête', corvee: 'Corvée' };
export const isDoneToday = (q: Quest, today: DayKey) => q.kind === 'quete' ? !!q.completedAt : q.doneOn.includes(today);

function dueText(q: Quest, today: DayKey) {
  if (q.kind === 'quete') {
    if (q.completedAt) return { text: `faite le ${shortDate(q.completedAt)}` };
    if (!q.due) return { text: 'sans échéance' };
    const late = questLate(q, today);
    if (late > 0) return { text: `en retard de ${late} j · −${PENALTY.questLatePerDay} PV/nuit`, late: true };
    if (late === 0) return { text: 'pour aujourd’hui', late: true };
    return { text: `dans ${-late} j (${shortDate(q.due)})` };
  }
  if (q.kind === 'corvee') {
    if (q.doneOn.includes(today)) return { text: `refaite dans ${q.every} j` };
    const late = choreLate(q, today);
    if (late > PENALTY.choreGrace) return { text: `en souffrance depuis ${late} j · −${PENALTY.choreLatePerDay} PV/nuit`, late: true };
    if (late >= 0) return { text: late === 0 ? 'à faire aujourd’hui' : `à faire depuis ${late} j (grâce : ${PENALTY.choreGrace + 1 - late} j)`, late: late > 0 };
    return { text: `dans ${-late} j (${shortDate(choreNextDue(q))})` };
  }
  const days = q.days?.length ? q.days.map(d => WEEKDAYS_SHORT[d - 1]).join('') : 'chaque jour';
  return { text: `${days} · −${DIFFICULTIES[q.difficulty].damage} PV si oublié` };
}

export function QuestRow({ q, onEdit }: { q: Quest; onEdit?: (q: Quest) => void }) {
  const { run, today } = useGame();
  const done = isDoneToday(q, today);
  const due = dueText(q, today);
  return (
    <div className={`quest ${done ? 'done' : ''}`}>
      <button className="check" disabled={done} aria-label={done ? `${q.title} : fait` : `Accomplir ${q.title}`} onClick={() => run((s, t) => completeQuest(s, q.id, t), true)}>
        {done && <ItemIcon sprite="star" tint="#f2d36b" scale={1.6} />}
      </button>
      <div>
        <strong>{q.title}</strong>
        <div className="meta">
          <span><DomainDot d={q.domain} />{DOMAINS[q.domain].label}</span>
          <span>{DIFFICULTIES[q.difficulty].label} · {DIFFICULTIES[q.difficulty].xp} XP</span>
          {q.kind === 'rituel' && (q.streak ?? 0) > 0 && <span className="streak">série {q.streak}</span>}
          <span className={due.late ? 'late' : ''}>{due.text}</span>
        </div>
      </div>
      <div className="side">{onEdit && <button className="icon-btn" aria-label={`Modifier ${q.title}`} onClick={() => onEdit(q)}>✎</button>}</div>
    </div>
  );
}

export function QuestForm({ initial, onClose }: { initial: Quest; onClose: () => void }) {
  const { s, run, today } = useGame();
  const [q, setQ] = useState<Quest>(initial);
  const isNew = !s.quests.some(k => k.id === q.id);
  const set = (patch: Partial<Quest>) => setQ({ ...q, ...patch });
  const save = () => { run(st => upsertQuest(st, { ...q, title: q.title.trim() })); onClose(); };
  const toggleDay = (d: number) => { const cur = q.days ?? []; set({ days: cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort() }); };

  return (
    <Modal title={isNew ? `Nouvelle ${KIND_LABEL[q.kind].toLowerCase()}` : `Modifier`} onClose={onClose}>
      {isNew && <Choices cols="two" value={q.kind} onChange={kind => setQ({ ...newQuest(kind, today), id: q.id, title: q.title, domain: q.domain, difficulty: q.difficulty })}
        options={[{ id: 'rituel', label: 'Rituel', hint: 'Habitude, certains jours' }, { id: 'quete', label: 'Quête', hint: 'Une fois, échéance possible' }, { id: 'corvee', label: 'Corvée', hint: 'Revient tous les N jours' }]} />}
      <Field label="Intitulé"><input value={q.title} onChange={e => set({ title: e.target.value })} placeholder={q.kind === 'rituel' ? 'Ex. 20 pompes' : q.kind === 'corvee' ? 'Ex. Changer les draps' : 'Ex. Rendre le dossier de cartographie'} autoFocus /></Field>
      <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Domaine</div>
      <Choices cols="five" stacked value={q.domain} onChange={domain => set({ domain })}
        options={DOMAIN_IDS.map(d => ({ id: d, label: DOMAINS[d].label, hint: DOMAINS[d].life, icon: <ItemIcon sprite={DOMAINS[d].icon} tint={DOMAINS[d].color} scale={2.2} /> }))} />
      <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Difficulté</div>
      <Choices cols="two" value={q.difficulty} onChange={difficulty => set({ difficulty })}
        options={DIFFICULTY_IDS.map(d => ({ id: d, label: DIFFICULTIES[d].label, hint: `${DIFFICULTIES[d].xp} XP · ${DIFFICULTIES[d].gold} or${q.kind === 'rituel' ? ` · −${DIFFICULTIES[d].damage} PV si oublié` : ''}` }))} />
      {q.kind === 'rituel' && (
        <Field label="Jours (aucun = tous les jours)">
          <div className="days">{WEEKDAYS_SHORT.map((l, i) => <button type="button" key={i} className={q.days?.includes(i + 1) ? 'on' : ''} onClick={() => toggleDay(i + 1)} aria-pressed={q.days?.includes(i + 1)}>{l}</button>)}</div>
        </Field>
      )}
      {q.kind === 'quete' && <Field label="Échéance (facultative)"><input type="date" value={q.due ?? ''} onChange={e => set({ due: e.target.value || null })} /></Field>}
      {q.kind === 'corvee' && (
        <div className="row">
          <Field label="Tous les … jours"><input type="number" min={1} max={90} value={q.every ?? 7} onChange={e => set({ every: Math.max(1, Number(e.target.value) || 1) })} /></Field>
          <Field label="Dernière fois (facultatif)"><input type="date" max={today} value={q.lastDone ?? ''} onChange={e => set({ lastDone: e.target.value || undefined })} /></Field>
        </div>
      )}
      <Field label="Notes"><textarea value={q.notes ?? ''} onChange={e => set({ notes: e.target.value })} /></Field>
      <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        {!isNew ? <button className="text-btn" onClick={() => { if (confirm(`Supprimer « ${q.title} » ?`)) { run(st => removeQuest(st, q.id)); onClose(); } }}>Supprimer</button> : <span />}
        <div className="btn-row">
          {!isNew && q.kind !== 'quete' && <button className="btn ghost small" onClick={() => { run(st => upsertQuest(st, { ...q, archived: !q.archived })); onClose(); }}>{q.archived ? 'Réactiver' : 'Mettre en pause'}</button>}
          <button className="btn" disabled={!q.title.trim()} onClick={save}>{isNew ? 'Ajouter' : 'Enregistrer'}</button>
        </div>
      </div>
      {q.kind === 'corvee' && q.lastDone && <p className="muted" style={{ fontSize: 12 }}>Prochaine fois : {shortDate(choreNextDue(q))} ({diffDays(choreNextDue(q), today) >= 0 ? `dans ${diffDays(choreNextDue(q), today)} j` : 'déjà due'}).</p>}
    </Modal>
  );
}
