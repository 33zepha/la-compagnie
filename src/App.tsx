import { useState } from 'react';
import { heroTitle } from '../engine/world.ts';
import { maxHp } from '../engine/xp.ts';
import { useGame } from './store.tsx';
import { Avatar, Eye, ItemIcon } from './pixel/Sprite.tsx';
import { Bar, Gold } from './ui/ui.tsx';
import { Events } from './ui/Events.tsx';
import { Creation } from './screens/Creation.tsx';
import { Camp } from './screens/Camp.tsx';
import { Quests } from './screens/Quests.tsx';
import { Journey } from './screens/Journey.tsx';
import { Inn } from './screens/Inn.tsx';
import { Hero } from './screens/Hero.tsx';
import { SOUNDS } from './sound.ts';

const NAV = [
  { id: 'camp', label: 'Camp', sprite: 'campfire' },
  { id: 'quetes', label: 'Quêtes', sprite: 'scroll' },
  { id: 'carte', label: 'Carte', sprite: 'map' },
  { id: 'auberge', label: 'Auberge', sprite: 'chest' },
  { id: 'heros', label: 'Héros', sprite: 'sword' },
] as const;

export function App() {
  const { s } = useGame();
  const [tab, setTab] = useState('camp');
  const [subs, setSubs] = useState<Record<string, string>>({ quetes: 'rituels', heros: 'attributs' });
  const go = (t: string, sub?: string) => { setTab(t); if (sub) setSubs(x => ({ ...x, [t]: sub })); window.scrollTo(0, 0); };

  if (!s.hero) return <><Creation /><Events /></>;
  const hero = s.hero;
  // Plus l'Ombre monte, plus le monde se désature et s'assombrit.
  const sh = s.shadow / 100;
  const style = { ['--sat' as string]: 1 - sh * 0.65, ['--bri' as string]: 1 - sh * 0.22, ['--veil' as string]: Math.max(0, sh - 0.3) * 1.2 };

  return (
    <>
      <div className="world" style={style}>
        <div className="app">
          <header className="panel topbar">
            <Avatar people={hero.people} look={hero.look} scale={2.5} />
            <div className="who">
              <h1>{hero.name}</h1>
              <div className="mono">Niv. {s.level} · {heroTitle(hero.people, s.level)}</div>
            </div>
            <div className="purse"><Gold n={s.gold} /></div>
            <div className="bars">
              <Bar label="PV" value={s.hp} max={maxHp(s)} color="var(--hp)" />
              <Bar label="Espoir" value={s.hope} max={100} color="var(--hope)" />
              <Bar label="Ombre" value={s.shadow} max={100} color="var(--shadow)" />
            </div>
          </header>
          <main>
            {tab === 'camp' && <Camp go={go} />}
            {tab === 'quetes' && <Quests sub={subs.quetes} setSub={v => setSubs(x => ({ ...x, quetes: v }))} />}
            {tab === 'carte' && <Journey />}
            {tab === 'auberge' && <Inn />}
            {tab === 'heros' && <Hero sub={subs.heros} setSub={v => setSubs(x => ({ ...x, heros: v }))} />}
          </main>
        </div>
      </div>
      <div className="shadow-veil" style={style} />
      {s.shadow >= 75 && <Eye scale={3} className="eye-watch" />}
      <div className="bottom-nav">
        <nav aria-label="Navigation principale">
          {NAV.map(n => (
            <button key={n.id} className={tab === n.id ? 'active' : ''} aria-current={tab === n.id ? 'page' : undefined} onClick={() => { if (s.settings.sound) SOUNDS.click(); go(n.id); }}>
              <ItemIcon sprite={n.sprite} scale={2.2} />{n.label}
            </button>
          ))}
        </nav>
      </div>
      <Events />
    </>
  );
}
