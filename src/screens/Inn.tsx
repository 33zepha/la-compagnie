import { useState } from 'react';
import { buyDye, buyReward, buyShopItem, drink, removeReward, upsertReward } from '../../engine/actions.ts';
import { shortDate } from '../../engine/dates.ts';
import { DYES, SHOP } from '../../engine/items.ts';
import { maxHp } from '../../engine/xp.ts';
import { uid } from '../../engine/rng.ts';
import type { Reward } from '../../engine/types.ts';
import { useGame } from '../store.tsx';
import { ItemIcon } from '../pixel/Sprite.tsx';
import { Field, Gold, Modal } from '../ui/ui.tsx';

export function Inn() {
  const { s, run } = useGame();
  const [editing, setEditing] = useState<Reward | null>(null);
  return (
    <>
      <div className="panel dark" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <ItemIcon sprite="campfire" scale={4} />
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: '#f2d36b' }}>Bree · au Poney Fringant</div>
          <h2 style={{ fontSize: 36 }}>L’Auberge</h2>
          <p style={{ fontSize: 14, color: '#c9b78a' }}>Ici, l’or gagné à la sueur de tes rituels s’échange contre de vraies récompenses.</p>
        </div>
        <div style={{ font: '700 20px var(--mono)', color: '#f2d36b' }}><Gold n={s.gold} /></div>
      </div>

      <div className="section-title"><h2>Tes récompenses</h2><button className="btn small" onClick={() => setEditing({ id: uid('r'), title: '', cost: 50 })}>+ Récompense</button></div>
      <div className="grid-cards">
        {s.rewards.map(r => (
          <div key={r.id} className="panel card">
            <ItemIcon sprite="chest" scale={3} />
            <h3>{r.title}</h3>
            <Gold n={r.cost} />
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn gold small" disabled={s.gold < r.cost} onClick={() => { if (confirm(`Dépenser ${r.cost} or pour « ${r.title} » ?`)) run((x, t) => buyReward(x, r.id, t)); }}>S’offrir</button>
              <button className="icon-btn" aria-label={`Modifier ${r.title}`} onClick={() => setEditing(r)}>✎</button>
            </div>
          </div>
        ))}
      </div>
      {!s.rewards.length && <div className="panel"><p className="empty">Crée tes propres récompenses : un épisode, un resto, un jeu…</p></div>}

      <div className="section-title"><h2>Comptoir</h2><span className="mono muted">PV {s.hp}/{maxHp(s)}</span></div>
      <div className="grid-cards">
        {SHOP.map(it => (
          <div key={it.id} className="panel card">
            <ItemIcon sprite={it.sprite} tint={it.tint} scale={3} />
            <h3>{it.title}</h3><p>{it.text}</p>
            <div className="mono muted">Dans le sac : {s.consumables[it.id as keyof typeof s.consumables]}</div>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn small" disabled={s.gold < it.cost} onClick={() => run(x => buyShopItem(x, it.id))}>Acheter · {it.cost}</button>
              {(it.id === 'potion' || it.id === 'lembas') && <button className="btn ghost small" disabled={!s.consumables[it.id]} onClick={() => run((x, t) => drink(x, it.id as 'potion' | 'lembas', t))}>Utiliser</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="section-title"><h2>Teintures de cape</h2></div>
      <div className="grid-cards">
        {DYES.map(d => (
          <div key={d.id} className="panel card">
            <span className="dot" style={{ ['--c' as string]: d.color, width: 34, height: 34, boxShadow: '0 0 0 3px var(--frame)' }} />
            <h3>{d.title}</h3>
            <button className="btn ghost small" disabled={s.gold < d.cost || s.hero?.look.cape === d.color} onClick={() => run(x => buyDye(x, d.id))}>{s.hero?.look.cape === d.color ? 'Portée' : `${d.cost} or`}</button>
          </div>
        ))}
      </div>

      {s.purchases.length > 0 && (
        <>
          <div className="section-title"><h2>Ardoise de l’Auberge</h2><span className="mono muted">{s.counters.goldSpent} or dépensés</span></div>
          <div className="panel">
            {s.purchases.slice(0, 30).map(p => <div key={p.id} className="stage-row" style={{ gridTemplateColumns: '70px 1fr auto' }}><span className="mono muted">{shortDate(p.day)}</span><span>{p.title}</span><Gold n={p.cost} /></div>)}
          </div>
        </>
      )}
      {editing && <RewardForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function RewardForm({ initial, onClose }: { initial: Reward; onClose: () => void }) {
  const { s, run } = useGame();
  const [r, setR] = useState(initial);
  const isNew = !s.rewards.some(k => k.id === r.id);
  return (
    <Modal title={isNew ? 'Nouvelle récompense' : 'Récompense'} onClose={onClose}>
      <Field label="Récompense réelle"><input value={r.title} onChange={e => setR({ ...r, title: e.target.value })} placeholder="Ex. Une soirée cinéma" autoFocus /></Field>
      <Field label="Prix en or"><input type="number" min={1} value={r.cost} onChange={e => setR({ ...r, cost: Math.max(1, Number(e.target.value) || 1) })} /></Field>
      <p className="muted" style={{ fontSize: 12 }}>Repère : une journée bien remplie rapporte environ 30 à 60 or.</p>
      <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        {!isNew ? <button className="text-btn" onClick={() => { run(x => removeReward(x, r.id)); onClose(); }}>Supprimer</button> : <span />}
        <button className="btn" disabled={!r.title.trim()} onClick={() => { run(x => upsertReward(x, { ...r, title: r.title.trim() })); onClose(); }}>Enregistrer</button>
      </div>
    </Modal>
  );
}
