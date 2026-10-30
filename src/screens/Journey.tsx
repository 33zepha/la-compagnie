import { newAge } from '../../engine/actions.ts';
import { STAGES } from '../../engine/world.ts';
import { STAGE_ITEMS, ITEMS } from '../../engine/items.ts';
import { journeyProgress } from '../../engine/xp.ts';
import { useGame } from '../store.tsx';
import { MapArt } from '../pixel/MapArt.tsx';
import { ItemIcon } from '../pixel/Sprite.tsx';
import { Bar } from '../ui/ui.tsx';

export function Journey() {
  const { s, run } = useGame();
  const next = STAGES[s.stage + 1];
  const atEnd = !next;
  return (
    <>
      <div className="section-title"><h2>Le Voyage</h2><span className="mono muted">{s.journeyXp.toLocaleString('fr-FR')} XP de voyage</span></div>
      <div className="map-frame"><MapArt stage={s.stage} progress={journeyProgress(s)} hero={s.hero} /></div>
      <div className="panel parchment">
        {atEnd ? (
          <div style={{ textAlign: 'center' }}>
            <div className="eyebrow red">Le fardeau est tombé</div>
            <h2 style={{ fontSize: 40, margin: '8px 0' }}>Tu es allé au bout</h2>
            <p className="muted">Commence un Nouvel Âge : retour à Cul-de-Sac avec tout ce que tu as gagné, et +25 % d’XP en plus pour chaque âge.</p>
            <button className="btn gold" style={{ marginTop: 12 }} onClick={() => { if (confirm('Commencer un Nouvel Âge ?')) run((x, t) => newAge(x, t)); }}>Commencer le {s.age + 2}e Âge</button>
          </div>
        ) : (
          <>
            <div className="eyebrow">Prochaine étape</div>
            <h2 style={{ fontSize: 34, margin: '6px 0' }}>{next.name}</h2>
            <Bar label={`${STAGES[s.stage].name} → ${next.name}`} value={s.journeyXp - STAGES[s.stage].xp} max={next.xp - STAGES[s.stage].xp} color="var(--gold)" right={`encore ${next.xp - s.journeyXp} XP`} />
          </>
        )}
      </div>
      <div className="panel">
        <div className="stage-list">
          {STAGES.map((st, i) => {
            const item = STAGE_ITEMS[i];
            return (
              <div key={st.id} className={`stage-row ${i < s.stage ? 'reached' : i === s.stage ? 'current' : ''}`}>
                <span className="num">{i + 1}</span>
                <div>
                  <h3>{st.name}</h3>
                  <p>{i <= s.stage ? st.text : `À ${st.xp.toLocaleString('fr-FR')} XP de voyage.`}</p>
                </div>
                {item && <span title={ITEMS[item].title} style={{ opacity: i <= s.stage ? 1 : 0.3 }}><ItemIcon sprite={ITEMS[item].sprite} tint={ITEMS[item].tint} scale={2.2} label={ITEMS[item].title} /></span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
