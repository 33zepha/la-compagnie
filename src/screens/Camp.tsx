import { useState } from 'react';
import { attendanceKey, attendCourse, choreLate, isRitualDue, newQuest, questLate } from '../../engine/actions.ts';
import { diffDays, isoWeekday, longDate, shortDate } from '../../engine/dates.ts';
import { isFrozen, PENALTY, threats } from '../../engine/day.ts';
import { DIFFICULTIES, heroTitle, PEOPLES, STAGES } from '../../engine/world.ts';
import { damageCut, xpToNext } from '../../engine/xp.ts';
import type { Quest } from '../../engine/types.ts';
import { useGame } from '../store.tsx';
import { Avatar, Boss, ItemIcon } from '../pixel/Sprite.tsx';
import { Bar } from '../ui/ui.tsx';
import { QuestForm, QuestRow } from '../ui/quests.tsx';
import { bossFor } from './Quests.tsx';

export function Camp({ go }: { go: (tab: string, sub?: string) => void }) {
  const { s, today, run } = useGame();
  const [editing, setEditing] = useState<Quest | null>(null);
  const hero = s.hero!;
  const frozen = isFrozen(s, today);
  const th = threats(s, today);
  const pending = Math.round((th.missed.reduce((a, x) => a + DIFFICULTIES[x.difficulty].damage, 0) + th.late.length * PENALTY.questLatePerDay + th.chores.length * PENALTY.choreLatePerDay + th.exams.length * PENALTY.examNoPrep) * (1 - damageCut(s)));
  const rituals = s.quests.filter(x => isRitualDue(x, today));
  const urgent = s.quests.filter(x => !x.archived && ((x.kind === 'quete' && questLate(x, today) >= -1) || (x.kind === 'corvee' && choreLate(x, today) >= 0 && !x.doneOn.includes(today))));
  const courses = s.courses.filter(c => c.weekday === isoWeekday(today)).sort((a, b) => a.start.localeCompare(b.start));
  const exam = s.exams.filter(e => !e.resolvedOn && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const projects = s.projects.filter(p => !p.completedAt);
  const hour = new Date().getHours();
  const scene = s.shadow >= 75 ? 'mordor' : hour >= 20 || hour < 7 ? 'night' : '';

  return (
    <>
      <div className="camp-grid">
        <div>
          <div className="panel hero-card">
            <div className={`stage ${scene}`}><Avatar people={hero.people} look={hero.look} scale={5} /></div>
            <div>
              <div className="title">{heroTitle(hero.people, s.level)}</div>
              <h2>{hero.name}</h2>
              <div className="level">Niveau {s.level}{s.age > 0 && ` · ${s.age + 1}e Âge`}</div>
              <Bar label="Expérience" value={s.xp} max={xpToNext(s.level)} color="var(--xp)" />
              <div className="mono muted" style={{ marginTop: 6 }}>{PEOPLES[hero.people].label} · en route vers {STAGES[Math.min(s.stage + 1, 11)].name}</div>
            </div>
          </div>

          <div className="panel">
            <div className="today-head"><h2>{longDate(today)}</h2><span className="mono muted">jour de jeu</span></div>
            {frozen ? <div className="threat ok"><ItemIcon sprite="campfire" scale={2} />Journée gelée{ s.rest ? ` (repos jusqu’au ${shortDate(s.rest.to)})` : ' (Halte)'} : aucune sanction ce soir.</div>
              : pending > 0 ? <div className="threat"><ItemIcon sprite="skull" scale={2} /><span>Si rien ne change, <b>−{pending} PV</b> cette nuit{s.hp - pending <= 0 ? ' : tu tomberas.' : '.'}</span></div>
              : <div className="threat ok"><ItemIcon sprite="star" scale={2} /><span>Rien ne te menace ce soir.{rituals.length > 0 ? ' Journée parfaite en vue.' : ''}</span></div>}
            {s.nazgul.active && <div className="threat"><Boss id="nazgul" scale={1.5} /><span>Le Nazgûl te traque : {s.nazgul.progress}/{PENALTY.nazgulDays} journées parfaites. XP divisée par deux.</span></div>}

            <div className="section-title" style={{ margin: '16px 0 4px' }}><h2 style={{ fontSize: 24 }}>Rituels du jour</h2><button className="text-btn" onClick={() => setEditing(newQuest('rituel', today))}>+ Rituel</button></div>
            <div className="quest-list">
              {rituals.length ? rituals.map(q => <QuestRow key={q.id} q={q} onEdit={setEditing} />) : <p className="empty">Aucun rituel aujourd’hui.</p>}
            </div>
          </div>

          <div className="panel">
            <div className="section-title" style={{ margin: '4px 0' }}><h2 style={{ fontSize: 24 }}>Quêtes et corvées urgentes</h2><button className="text-btn" onClick={() => setEditing(newQuest('quete', today))}>+ Quête</button></div>
            <div className="quest-list">
              {urgent.length ? urgent.map(q => <QuestRow key={q.id} q={q} onEdit={setEditing} />) : <p className="empty">Rien d’urgent. Profite, ou avance une Grande Quête.</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="section-title" style={{ margin: '4px 0' }}><h2 style={{ fontSize: 24 }}>À la fac aujourd’hui</h2><button className="text-btn" onClick={() => go('quetes', 'fac')}>Emploi du temps</button></div>
            {courses.length ? courses.map(c => {
              const st = s.attendance[attendanceKey(c.id, today)];
              return (
                <div className="quest" key={c.id}>
                  <ItemIcon sprite="book" tint="#5b7fa8" scale={2.2} />
                  <div><strong>{c.type} {c.subject}</strong><div className="meta"><span>{c.start}–{c.end}</span>{c.room && <span>salle {c.room}</span>}</div></div>
                  <div className="side">
                    {!st && <button className="btn small" onClick={() => run((x, t) => attendCourse(x, c.id, t, 'present'), true)}>Présent</button>}
                    {st === 'present' && <button className="btn small ghost" onClick={() => run((x, t) => attendCourse(x, c.id, t, 'relu'), true)}>Relu</button>}
                    {st === 'relu' && <span className="mono" style={{ color: 'var(--green)' }}>Relu ✓</span>}
                  </div>
                </div>
              );
            }) : <p className="empty">Pas de cours aujourd’hui{s.courses.length ? '' : ' : ajoute ton emploi du temps dans Quêtes › Fac'}.</p>}
          </div>

          {exam && (
            <button className="panel boss-card" style={{ width: 'calc(100% - 8px)', textAlign: 'left' }} onClick={() => go('quetes', 'fac')}>
              <div className="arena"><Boss id={bossFor(exam.id)} scale={4} /></div>
              <div>
                <div className="eyebrow red">Prochaine épreuve</div>
                <h3>{exam.subject}</h3>
                <div className="countdown">{diffDays(exam.date, today) === 0 ? 'Aujourd’hui' : `J−${diffDays(exam.date, today)}`}</div>
                <Bar label="Préparation" value={exam.prep.filter(p => p.done).length} max={Math.max(1, exam.prep.length)} color="var(--blue)" right={exam.prep.length ? undefined : 'aucune'} />
              </div>
            </button>
          )}

          {projects.slice(0, 3).map(p => {
            const left = p.steps.filter(x => !x.done).length;
            return (
              <button key={p.id} className="panel boss-card" style={{ width: 'calc(100% - 8px)', textAlign: 'left' }} onClick={() => go('quetes', 'projets')}>
                <div className="arena"><Boss id={bossFor(p.id)} scale={4} /></div>
                <div>
                  <div className="eyebrow">Grande Quête · {p.title}</div>
                  <h3>{p.boss}</h3>
                  <div className="boss-hp"><Bar label="PV du boss" value={left} max={Math.max(1, p.steps.length)} color="var(--brick)" /></div>
                </div>
              </button>
            );
          })}

          <div className="panel">
            <div className="eyebrow">Le Voyage</div>
            <p style={{ fontSize: 14, margin: '4px 0 2px' }}>{STAGES[s.stage].name} → {STAGES[Math.min(s.stage + 1, 11)].name}</p>
            <Bar value={s.journeyXp - STAGES[s.stage].xp} max={(STAGES[s.stage + 1]?.xp ?? s.journeyXp) - STAGES[s.stage].xp || 1} color="var(--gold)" thin />
            <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => go('carte')}>Voir la carte</button>
          </div>
        </div>
      </div>
      {editing && <QuestForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
