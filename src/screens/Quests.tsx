import { useState } from 'react';
import { attendanceKey, choreNextDue, completePrep, completeStep, finishProvisions, newQuest, newStep, removeCourse, removeExam, removeProject, resolveExam, setProvisions, upsertCourse, upsertExam, upsertProject } from '../../engine/actions.ts';
import { diffDays, isoWeekday, shortDate, WEEKDAYS } from '../../engine/dates.ts';
import { DOMAINS, DOMAIN_IDS } from '../../engine/world.ts';
import { hash, uid } from '../../engine/rng.ts';
import type { Course, Exam, Project, Quest, Step } from '../../engine/types.ts';
import { useGame } from '../store.tsx';
import { Boss, ItemIcon } from '../pixel/Sprite.tsx';
import { BOSSES, BOSS_IDS } from '../pixel/sprites.ts';
import { Bar, Choices, Field, Modal } from '../ui/ui.tsx';
import { QuestForm, QuestRow } from '../ui/quests.tsx';

export const bossFor = (id: string) => BOSS_IDS[hash(id) % BOSS_IDS.length];
const TABS = [['rituels', 'Rituels'], ['quetes', 'Quêtes'], ['corvees', 'Corvées'], ['projets', 'Grandes Quêtes'], ['fac', 'Fac'], ['provisions', 'Provisions']] as const;

export function Quests({ sub, setSub }: { sub: string; setSub: (s: string) => void }) {
  return (
    <>
      <div className="tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={sub === id} className={sub === id ? 'active' : ''} onClick={() => setSub(id)}>{label}</button>)}</div>
      {sub === 'rituels' && <QuestKind kind="rituel" />}
      {sub === 'quetes' && <QuestKind kind="quete" />}
      {sub === 'corvees' && <QuestKind kind="corvee" />}
      {sub === 'projets' && <Projects />}
      {sub === 'fac' && <Fac />}
      {sub === 'provisions' && <Provisions />}
    </>
  );
}

const KIND_INFO = {
  rituel: { title: 'Rituels', add: '+ Rituel', text: 'Tes habitudes. Chaque rituel oublié coûte des PV à la fin de la journée (4 h du matin).' },
  quete: { title: 'Quêtes', add: '+ Quête', text: 'Tâches ponctuelles. En retard : −5 PV par nuit et l’Ombre avance.' },
  corvee: { title: 'Corvées', add: '+ Corvée', text: 'Elles reviennent seules. Deux jours de grâce, puis −8 PV par nuit.' },
};

function QuestKind({ kind }: { kind: Quest['kind'] }) {
  const { s, today } = useGame();
  const [editing, setEditing] = useState<Quest | null>(null);
  const info = KIND_INFO[kind];
  let list = s.quests.filter(q => q.kind === kind && !q.archived);
  if (kind === 'quete') list = list.filter(q => !q.completedAt).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  if (kind === 'corvee') list = list.sort((a, b) => choreNextDue(a).localeCompare(choreNextDue(b)));
  const done = kind === 'quete' ? s.quests.filter(q => q.kind === 'quete' && q.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!)).slice(0, 15) : [];
  const paused = s.quests.filter(q => q.kind === kind && q.archived);
  return (
    <div className="panel">
      <div className="section-title" style={{ margin: '4px 0 4px' }}><h2>{info.title}</h2><button className="btn small" onClick={() => setEditing(newQuest(kind, today))}>{info.add}</button></div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{info.text}</p>
      <div className="quest-list">{list.length ? list.map(q => <QuestRow key={q.id} q={q} onEdit={setEditing} />) : <p className="empty">Rien ici pour l’instant.</p>}</div>
      {done.length > 0 && <><div className="eyebrow" style={{ marginTop: 18 }}>Accomplies récemment</div><div className="quest-list">{done.map(q => <QuestRow key={q.id} q={q} onEdit={setEditing} />)}</div></>}
      {paused.length > 0 && <><div className="eyebrow" style={{ marginTop: 18 }}>En pause (aucune sanction)</div><div className="quest-list">{paused.map(q => <QuestRow key={q.id} q={q} onEdit={setEditing} />)}</div></>}
      {editing && <QuestForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

// —— Grandes Quêtes ——————————————————————————————————————————————————

function StepsEditor({ steps, onChange, placeholder }: { steps: Step[]; onChange: (s: Step[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const add = () => { if (draft.trim()) { onChange([...steps, newStep(draft.trim())]); setDraft(''); } };
  return (
    <div>
      {steps.map((st, i) => (
        <div key={st.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'center' }}>
          <input className="input" value={st.title} disabled={st.done} onChange={e => onChange(steps.map(x => x.id === st.id ? { ...x, title: e.target.value } : x))} aria-label={`Étape ${i + 1}`} />
          {!st.done && <button className="icon-btn" aria-label="Retirer l’étape" onClick={() => onChange(steps.filter(x => x.id !== st.id))}>✕</button>}
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <input className="input" value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button className="btn small" onClick={add} disabled={!draft.trim()}>+</button>
      </div>
    </div>
  );
}

function ProjectForm({ initial, onClose }: { initial: Project; onClose: () => void }) {
  const { s, run } = useGame();
  const [p, setP] = useState(initial);
  const isNew = !s.projects.some(k => k.id === p.id);
  return (
    <Modal title={isNew ? 'Nouvelle Grande Quête' : 'Grande Quête'} onClose={onClose}>
      <Field label="Le projet"><input value={p.title} onChange={e => setP({ ...p, title: e.target.value })} placeholder="Ex. Monter mon portfolio" autoFocus /></Field>
      <Field label="Le boss à abattre"><input value={p.boss} onChange={e => setP({ ...p, boss: e.target.value })} placeholder={BOSSES[bossFor(p.id)].name} /></Field>
      <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Domaine</div>
      <Choices cols="five" stacked value={p.domain} onChange={domain => setP({ ...p, domain })} options={DOMAIN_IDS.map(d => ({ id: d, label: DOMAINS[d].label, icon: <ItemIcon sprite={DOMAINS[d].icon} tint={DOMAINS[d].color} scale={2.2} /> }))} />
      <Field label="Échéance (facultative)"><input type="date" value={p.due ?? ''} onChange={e => setP({ ...p, due: e.target.value || null })} /></Field>
      <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Étapes : chacune retire un PV au boss, la dernière l’achève</div>
      <StepsEditor steps={p.steps} onChange={steps => setP({ ...p, steps })} placeholder="Ajouter une étape" />
      <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        {!isNew ? <button className="text-btn" onClick={() => { if (confirm('Abandonner cette Grande Quête ?')) { run(x => removeProject(x, p.id)); onClose(); } }}>Abandonner</button> : <span />}
        <button className="btn" disabled={!p.title.trim() || !p.steps.length} onClick={() => { run(x => upsertProject(x, { ...p, boss: p.boss.trim() || BOSSES[bossFor(p.id)].name })); onClose(); }}>{isNew ? 'Lancer la quête' : 'Enregistrer'}</button>
      </div>
    </Modal>
  );
}

function Projects() {
  const { s, run, today } = useGame();
  const [editing, setEditing] = useState<Project | null>(null);
  const blank = (): Project => ({ id: uid('g'), title: '', domain: 'forge', boss: '', steps: [], createdAt: today, due: null });
  const active = s.projects.filter(p => !p.completedAt), done = s.projects.filter(p => p.completedAt);
  const card = (p: Project) => {
    const left = p.steps.filter(x => !x.done).length;
    return (
      <div key={p.id} className={`panel boss-card ${p.completedAt ? 'defeated' : ''}`}>
        <div className="arena"><Boss id={bossFor(p.id)} scale={4} /></div>
        <div>
          <div className="eyebrow" style={{ color: DOMAINS[p.domain].color }}>{DOMAINS[p.domain].label}{p.due && ` · avant le ${shortDate(p.due)}`}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><h3>{p.title}</h3><button className="icon-btn" aria-label="Modifier" onClick={() => setEditing(p)}>✎</button></div>
          <div className="mono muted">{p.completedAt ? `${p.boss} vaincu le ${shortDate(p.completedAt)}` : `Boss : ${p.boss}`}</div>
          <div className="boss-hp"><Bar label="PV du boss" value={left} max={Math.max(1, p.steps.length)} color="var(--brick)" /></div>
          <div className="steps">
            {p.steps.map((st, i) => (
              <div key={st.id} className={`quest ${st.done ? 'done' : ''}`}>
                <button className="check" disabled={st.done} aria-label={`Accomplir ${st.title}`} onClick={() => run((x, t) => completeStep(x, p.id, st.id, t), true)}>{st.done && <ItemIcon sprite="star" scale={1.6} />}</button>
                <div><strong>{st.title}</strong><div className="meta"><span>{i === p.steps.length - 1 || left === 1 && !st.done ? 'coup final · épique' : 'étape · 25 XP'}</span>{st.doneOn && <span>{shortDate(st.doneOn)}</span>}</div></div>
                <span />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="section-title"><h2>Grandes Quêtes</h2><button className="btn small" onClick={() => setEditing(blank())}>+ Grande Quête</button></div>
      <p className="muted" style={{ fontSize: 13, margin: '0 4px 8px' }}>Un projet, un boss. Découpe-le en étapes : chaque étape le blesse, la dernière rapporte une récompense épique et un objet rare.</p>
      {active.length ? active.map(card) : <div className="panel"><p className="empty">Aucune Grande Quête en cours.</p></div>}
      {done.length > 0 && <><div className="section-title"><h2 style={{ fontSize: 24 }}>Boss vaincus</h2></div>{done.map(card)}</>}
      {editing && <ProjectForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

// —— Fac ——————————————————————————————————————————————————————————

function CourseForm({ initial, onClose }: { initial: Course; onClose: () => void }) {
  const { s, run } = useGame();
  const [c, setC] = useState(initial);
  const isNew = !s.courses.some(k => k.id === c.id);
  return (
    <Modal title={isNew ? 'Nouveau cours' : 'Cours'} onClose={onClose}>
      <Field label="Matière"><input value={c.subject} onChange={e => setC({ ...c, subject: e.target.value })} placeholder="Ex. Géographie physique" autoFocus /></Field>
      <Choices cols="two" value={c.type} onChange={type => setC({ ...c, type })} options={(['CM', 'TD', 'TP', 'Autre'] as const).map(t => ({ id: t, label: t }))} />
      <Field label="Jour"><select value={c.weekday} onChange={e => setC({ ...c, weekday: Number(e.target.value) })}>{WEEKDAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></Field>
      <div className="row">
        <Field label="Début"><input type="time" value={c.start} onChange={e => setC({ ...c, start: e.target.value })} /></Field>
        <Field label="Fin"><input type="time" value={c.end} onChange={e => setC({ ...c, end: e.target.value })} /></Field>
      </div>
      <Field label="Salle"><input value={c.room} onChange={e => setC({ ...c, room: e.target.value })} placeholder="Ex. Amphi B" /></Field>
      <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        {!isNew ? <button className="text-btn" onClick={() => { run(x => removeCourse(x, c.id)); onClose(); }}>Supprimer</button> : <span />}
        <div className="btn-row">
          {isNew && <button className="btn ghost small" disabled={!c.subject.trim()} onClick={() => { run(x => upsertCourse(x, { ...c, subject: c.subject.trim() })); setC({ ...c, id: uid('c') }); }}>Ajouter et continuer</button>}
          <button className="btn" disabled={!c.subject.trim()} onClick={() => { run(x => upsertCourse(x, { ...c, subject: c.subject.trim() })); onClose(); }}>Enregistrer</button>
        </div>
      </div>
    </Modal>
  );
}

function ExamForm({ initial, onClose }: { initial: Exam; onClose: () => void }) {
  const { s, run } = useGame();
  const [e, setE] = useState(initial);
  const isNew = !s.exams.some(k => k.id === e.id);
  return (
    <Modal title={isNew ? 'Nouvelle épreuve' : 'Épreuve'} onClose={onClose}>
      <Field label="Matière"><input value={e.subject} onChange={x => setE({ ...e, subject: x.target.value })} placeholder="Ex. Partiel de cartographie" autoFocus /></Field>
      <Field label="Date"><input type="date" value={e.date} onChange={x => setE({ ...e, date: x.target.value })} /></Field>
      <div className="eyebrow" style={{ margin: '14px 0 6px' }}>Préparations : sans aucune, −20 PV la veille</div>
      <StepsEditor steps={e.prep} onChange={prep => setE({ ...e, prep })} placeholder="Ex. Fiche chapitre 1" />
      <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        {!isNew ? <button className="text-btn" onClick={() => { run(x => removeExam(x, e.id)); onClose(); }}>Supprimer</button> : <span />}
        <button className="btn" disabled={!e.subject.trim() || !e.date} onClick={() => { run(x => upsertExam(x, { ...e, subject: e.subject.trim() })); onClose(); }}>Enregistrer</button>
      </div>
    </Modal>
  );
}

function ExamCard({ e, onEdit }: { e: Exam; onEdit: () => void }) {
  const { run, today } = useGame();
  const [grade, setGrade] = useState('');
  const left = e.prep.filter(p => !p.done).length;
  const d = diffDays(e.date, today);
  return (
    <div className={`panel boss-card ${e.resolvedOn ? 'defeated' : ''}`}>
      <div className="arena"><Boss id={bossFor(e.id)} scale={4} /></div>
      <div>
        <div className="eyebrow red">{e.resolvedOn ? `Résultat : ${e.grade}/20` : d > 0 ? `J−${d} · ${shortDate(e.date)}` : d === 0 ? 'Aujourd’hui' : `Passée le ${shortDate(e.date)}`}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><h3>{e.subject}</h3><button className="icon-btn" aria-label="Modifier" onClick={onEdit}>✎</button></div>
        {!e.resolvedOn && <Bar label="PV de l’épreuve" value={left} max={Math.max(1, e.prep.length)} color="var(--brick)" right={e.prep.length ? `${left}/${e.prep.length}` : 'ajoute des préparations'} />}
        <div className="steps">
          {e.prep.map(st => (
            <div key={st.id} className={`quest ${st.done ? 'done' : ''}`}>
              <button className="check" disabled={st.done || !!e.resolvedOn} aria-label={`Accomplir ${st.title}`} onClick={() => run((x, t) => completePrep(x, e.id, st.id, t), true)}>{st.done && <ItemIcon sprite="star" scale={1.6} />}</button>
              <div><strong>{st.title}</strong><div className="meta"><span>préparation · 25 XP</span></div></div><span />
            </div>
          ))}
        </div>
        {!e.resolvedOn && d <= 0 && (
          <div className="btn-row" style={{ marginTop: 10 }}>
            <input className="input" style={{ width: 90 }} type="number" min={0} max={20} step={0.25} value={grade} onChange={x => setGrade(x.target.value)} placeholder="/20" aria-label="Note sur 20" />
            <button className="btn gold small" disabled={grade === '' || Number(grade) < 0 || Number(grade) > 20} onClick={() => run((x, t) => resolveExam(x, e.id, Number(grade), t))}>Saisir la note</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Fac() {
  const { s, today } = useGame();
  const [course, setCourse] = useState<Course | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const blankCourse = (weekday = isoWeekday(today)): Course => ({ id: uid('c'), subject: '', type: 'CM', weekday, start: '08:30', end: '10:30', room: '' });
  const upcoming = s.exams.filter(e => !e.resolvedOn).sort((a, b) => a.date.localeCompare(b.date));
  const past = s.exams.filter(e => e.resolvedOn).sort((a, b) => b.date.localeCompare(a.date));
  const attended = Object.keys(s.attendance).length;
  return (
    <>
      <div className="section-title"><h2>Emploi du temps</h2><button className="btn small" onClick={() => setCourse(blankCourse())}>+ Cours</button></div>
      <div className="panel">
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Chaque séance donne « Présent » (25 XP Savoir) puis « Relu » (10 XP) au Camp. {attended} présences enregistrées.</p>
        <div className="course-week">
          {WEEKDAYS.map((d, i) => {
            const list = s.courses.filter(c => c.weekday === i + 1).sort((a, b) => a.start.localeCompare(b.start));
            return (
              <div key={d} className={`course-day ${isoWeekday(today) === i + 1 ? 'today' : ''}`}>
                <h3>{d}</h3>
                {list.map(c => (
                  <button key={c.id} className="course-chip" onClick={() => setCourse(c)}>
                    <b>{c.type} · {c.start}{s.attendance[attendanceKey(c.id, today)] ? ' ✓' : ''}</b>{c.subject}
                  </button>
                ))}
                {!list.length && <button className="course-chip muted" style={{ boxShadow: 'none', background: 'none' }} onClick={() => setCourse(blankCourse(i + 1))}>+</button>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="section-title"><h2>Épreuves</h2><button className="btn small red" onClick={() => setExam({ id: uid('x'), subject: '', date: today, prep: [] })}>+ Épreuve</button></div>
      <p className="muted" style={{ fontSize: 13, margin: '0 4px 8px' }}>Partiels et rattrapages sont des boss. Chaque préparation les affaiblit. 10/20 ou plus : récompense épique ; 14 ou plus : objet rare garanti.</p>
      {upcoming.length ? upcoming.map(e => <ExamCard key={e.id} e={e} onEdit={() => setExam(e)} />) : <div className="panel"><p className="empty">Aucune épreuve à venir.</p></div>}
      {past.length > 0 && <><div className="section-title"><h2 style={{ fontSize: 24 }}>Épreuves passées</h2></div>{past.map(e => <ExamCard key={e.id} e={e} onEdit={() => setExam(e)} />)}</>}
      {course && <CourseForm initial={course} onClose={() => setCourse(null)} />}
      {exam && <ExamForm initial={exam} onClose={() => setExam(null)} />}
    </>
  );
}

// —— Provisions ————————————————————————————————————————————————————

function Provisions() {
  const { s, run } = useGame();
  const [draft, setDraft] = useState('');
  const list = s.provisions;
  const add = () => { const items = draft.split(',').map(x => x.trim()).filter(Boolean); if (!items.length) return; run(x => setProvisions(x, [...x.provisions, ...items.map(label => ({ id: uid('p'), label, checked: false }))])); setDraft(''); };
  const n = list.filter(p => p.checked).length;
  return (
    <div className="panel parchment">
      <div className="section-title" style={{ margin: '4px 0' }}><h2>Liste de provisions</h2><ItemIcon sprite="lembas" scale={2.5} /></div>
      <p className="muted" style={{ fontSize: 13 }}>Coche au fil du marché, puis termine la sortie pour gagner l’XP Foyer. Plusieurs articles d’un coup : sépare-les par des virgules.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, alignItems: 'center', margin: '10px 0' }}>
        <input className="input" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ex. riz, tomates, savon" onKeyDown={e => e.key === 'Enter' && add()} aria-label="Ajouter des provisions" />
        <button className="btn small" onClick={add} disabled={!draft.trim()}>Ajouter</button>
      </div>
      <div className="quest-list">
        {list.map(p => (
          <div key={p.id} className={`quest ${p.checked ? 'done' : ''}`}>
            <button className="check" aria-pressed={p.checked} aria-label={p.label} onClick={() => run(x => setProvisions(x, x.provisions.map(k => k.id === p.id ? { ...k, checked: !k.checked } : k)))}>{p.checked && <ItemIcon sprite="star" scale={1.6} />}</button>
            <strong>{p.label}</strong>
            <button className="icon-btn" aria-label={`Retirer ${p.label}`} onClick={() => run(x => setProvisions(x, x.provisions.filter(k => k.id !== p.id)))}>✕</button>
          </div>
        ))}
        {!list.length && <p className="empty">La liste est vide. Le garde-manger, peut-être aussi.</p>}
      </div>
      <button className="btn gold wide" style={{ marginTop: 14 }} disabled={!n} onClick={() => run((x, t) => finishProvisions(x, t), true)}>Terminer la sortie ({n} article{n > 1 ? 's' : ''})</button>
    </div>
  );
}
