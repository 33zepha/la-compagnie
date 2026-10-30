import { useEffect } from 'react';
import { ITEMS, RARITIES } from '../../engine/items.ts';
import { trophy } from '../../engine/trophies.ts';
import { STAGES } from '../../engine/world.ts';
import { PENALTY } from '../../engine/day.ts';
import { useGame } from '../store.tsx';
import { Avatar, Boss, ItemIcon } from '../pixel/Sprite.tsx';

/** File des parchemins : récompense, nuit écoulée, chute, Nazgûl, haut fait. */
export function Events() {
  const { s, events, shift, undo } = useGame();
  const e = events[0];
  useEffect(() => { if (e?.type === 'info') { const id = setTimeout(shift, 2600); return () => clearTimeout(id); } }, [e, shift]);
  if (!e) return undo ? <div className="toast" role="status">Action enregistrée.<button onClick={undo}>Annuler</button></div> : null;
  if (e.type === 'info') return <div className="toast" role="status">{e.text}</div>;

  const close = <button className="btn gold" style={{ marginTop: 22 }} onClick={shift} autoFocus>Continuer</button>;
  let body: React.ReactNode;
  let dark = false;
  if (e.type === 'reward') {
    const loot = e.loot ? ITEMS[e.loot] : null;
    body = (
      <>
        <div className="kicker">Quête accomplie</div>
        <h2>{e.title}</h2>
        <p>{e.text}</p>
        <div className="effect-tags">{e.tags.map(t => <span key={t}>{t}</span>)}</div>
        {e.levelUp && <div className="level-up">★ Niveau {s.level} ★</div>}
        {e.stage !== undefined && <div className="level-up">Étape atteinte : {STAGES[e.stage].name}</div>}
        {loot && (
          <div className="loot">
            <ItemIcon sprite={loot.sprite} tint={loot.tint} scale={5} />
            <span className="rarity" style={{ ['--c' as string]: RARITIES[loot.rarity].color }}>{RARITIES[loot.rarity].label}</span>
            <strong>{loot.title}</strong>
            <p style={{ fontSize: 14 }}>{loot.story}</p>
          </div>
        )}
      </>
    );
  } else if (e.type === 'night') {
    dark = e.damage > 0;
    body = (
      <>
        <div className="kicker">{e.days > 1 ? `${e.days} nuits ont passé` : 'La nuit a passé'}</div>
        <h2>{e.damage > 0 ? `−${e.damage} PV` : 'Une nuit paisible'}</h2>
        <div style={{ textAlign: 'left', display: 'grid', gap: 8, marginTop: 10 }}>
          {e.entries.slice(0, 8).map(j => <p key={j.id} style={{ fontSize: 14, margin: 0, maxWidth: 'none' }}><b>{j.title}.</b> {j.text}</p>)}
        </div>
        <div className="effect-tags"><span className={e.damage ? 'bad' : ''}>PV {s.hp}</span><span className="bad">Ombre {s.shadow}</span></div>
      </>
    );
  } else if (e.type === 'fallen') {
    dark = true;
    body = (
      <>
        <div className="figure">{s.hero && <span style={{ transform: 'rotate(90deg)', display: 'block' }}><Avatar people={s.hero.people} look={s.hero.look} scale={4} /></span>}</div>
        <div className="kicker">Hardcore</div>
        <h2>Tu es tombé</h2>
        <p>Tes forces t’ont quitté. Tu te réveilles à Fondcombe, avec {PENALTY.respawnHp} PV.</p>
        <div className="effect-tags"><span className="bad">−{e.goldLost} or</span>{e.lostItem && <span className="bad">{ITEMS[e.lostItem].title} perdu</span>}<span className="bad">Barre de niveau à zéro</span><span className="bad">+{PENALTY.shadowFall} Ombre</span></div>
      </>
    );
  } else if (e.type === 'nazgul') {
    dark = e.summoned;
    body = (
      <>
        <div className="figure"><Boss id="nazgul" scale={6} /></div>
        <div className="kicker">{e.summoned ? 'L’Ombre est à 100' : 'Victoire'}</div>
        <h2>{e.summoned ? 'L’Œil s’est posé sur toi' : 'Le Nazgûl est repoussé'}</h2>
        <p>{e.summoned ? `Un Nazgûl te traque. Enchaîne ${PENALTY.nazgulDays} journées parfaites pour le chasser ; jusque-là, toute l’XP est divisée par deux.` : 'Sept journées parfaites. L’Œil se détourne et l’Ombre retombe à 50.'}</p>
      </>
    );
  } else {
    const t = trophy(e.id);
    body = (
      <>
        <div className="figure"><ItemIcon sprite="star" scale={6} /></div>
        <div className="kicker">Haut fait</div>
        <h2>{t.title}</h2>
        <p>{t.description}</p>
      </>
    );
  }
  return (
    <div className="modal-back" onClick={ev => ev.target === ev.currentTarget && shift()}>
      <div className="modal" role="dialog" aria-modal="true" style={{ padding: '10px 14px' }}>
        <div className={`scroll ${dark ? 'dark' : ''}`}>{body}{close}</div>
      </div>
    </div>
  );
}
