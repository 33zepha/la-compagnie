import { useState } from 'react';
import { createHero } from '../../engine/actions.ts';
import { HOMELANDS, HOMELAND_IDS, PEOPLES, PEOPLE_IDS } from '../../engine/world.ts';
import type { HomelandId, Look, PeopleId } from '../../engine/types.ts';
import { useGame } from '../store.tsx';
import { Avatar } from '../pixel/Sprite.tsx';
import { Choices, Field } from '../ui/ui.tsx';

const HAIR = ['#2b1d14', '#5a3a1e', '#8a5a2b', '#c99a4a', '#e8d9a0', '#d8d4cc', '#a33b2b'];
const SKIN = ['#f2cfa8', '#e8b98f', '#c98f62', '#9a6440', '#6b4428'];
const CAPE = ['#4f7a3a', '#7d7f78', '#a33b2b', '#5b7fa8', '#7a4a2a', '#5a3f6e'];
const DEFAULT_LOOK: Record<PeopleId, Look> = {
  hobbit: { hair: '#8a5a2b', skin: '#e8b98f', cape: '#4f7a3a' }, elfe: { hair: '#e8d9a0', skin: '#f2cfa8', cape: '#5b7fa8' },
  nain: { hair: '#a33b2b', skin: '#e8b98f', cape: '#7a4a2a' }, homme: { hair: '#2b1d14', skin: '#c98f62', cape: '#a33b2b' },
  istar: { hair: '#d8d4cc', skin: '#e8b98f', cape: '#7d7f78' },
};

export function Creation() {
  const { run, today } = useGame();
  const [name, setName] = useState('');
  const [people, setPeople] = useState<PeopleId>('hobbit');
  const [homeland, setHomeland] = useState<HomelandId>('comte');
  const [look, setLook] = useState<Look>(DEFAULT_LOOK.hobbit);
  const [starter, setStarter] = useState(true);
  const pickPeople = (p: PeopleId) => { setPeople(p); setLook(DEFAULT_LOOK[p]); if (p === 'nain') setHomeland('erebor'); if (p === 'elfe') setHomeland('lorien'); if (p === 'hobbit') setHomeland('comte'); };

  const swatches = (key: keyof Look, list: string[], label: string) => (
    <Field label={label}>
      <div className="swatches">{list.map(c => <button type="button" key={c} aria-label={`${label} ${c}`} className={look[key] === c ? 'on' : ''} style={{ ['--c' as string]: c }} onClick={() => setLook({ ...look, [key]: c })} />)}</div>
    </Field>
  );

  return (
    <div className="creation">
      <div className="intro">
        <div className="eyebrow red">Registre de la Compagnie · {today.split('-').reverse().join('/')}</div>
        <h1>La Compagnie</h1>
        <p>Chaque cours suivi, chaque lessive, chaque séance de sport te rapproche de la Montagne du Destin. Chaque rituel oublié laisse l’Ombre avancer.</p>
      </div>

      <div className="panel parchment" style={{ padding: 20 }}>
        <div className="seal">Sceau<br />de la<br />Compagnie</div>
        <div className="registry">
          <div className="portrait">
            <div className="stage"><Avatar people={people} look={look} scale={7} /></div>
            <div className="mono" style={{ textAlign: 'center' }}>{PEOPLES[people].label} · {HOMELANDS[homeland].label}</div>
            {swatches('hair', HAIR, people === 'nain' ? 'Cheveux et barbe' : 'Cheveux')}
            {swatches('skin', SKIN, 'Peau')}
            {swatches('cape', CAPE, people === 'istar' ? 'Robe et chapeau' : 'Cape')}
          </div>
          <div>
            <Field label="Ton nom dans la Compagnie">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Drix Pied-Léger" maxLength={32} autoFocus />
            </Field>
            <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Ton peuple</div>
            <div className="choices five people-pick">
              {PEOPLE_IDS.map(id => (
                <button type="button" key={id} className={`choice stacked ${people === id ? 'selected' : ''}`} onClick={() => pickPeople(id)} aria-pressed={people === id}>
                  <Avatar people={id} look={people === id ? look : DEFAULT_LOOK[id]} scale={3} />
                  <span><strong>{PEOPLES[id].label}</strong></span>
                </button>
              ))}
            </div>
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="eyebrow">{PEOPLES[people].bonus}</div>
              <p style={{ marginTop: 6, fontSize: 14 }}>{PEOPLES[people].blurb}</p>
            </div>
            <div className="eyebrow" style={{ margin: '18px 0 8px' }}>Ta terre natale</div>
            <Choices cols="two" value={homeland} onChange={setHomeland} options={HOMELAND_IDS.map(id => ({ id, label: HOMELANDS[id].label, hint: HOMELANDS[id].blurb }))} />
            <label className="choice" style={{ marginTop: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={starter} onChange={e => setStarter(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#4f7a3a' }} />
              <span><strong>Paquetage de départ</strong><small>Rituels, corvées et récompenses de base pour les quatre domaines. Tout reste modifiable.</small></span>
            </label>
            <button className="btn gold wide" style={{ marginTop: 18, minHeight: 52, fontSize: 16 }} disabled={!name.trim()}
              onClick={() => { run((s, t) => createHero(s, { name: name.trim(), people, homeland, look, createdAt: t }, starter)); window.scrollTo(0, 0); }}>
              Signer le registre et partir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
