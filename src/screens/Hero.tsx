import { useRef, useState } from 'react';
import { canRest, endRest, equip, haltesLeft, REST_COOLDOWN, SELL_PRICE, sellItem, startRest, useHalte } from '../../engine/actions.ts';
import { addDays, diffDays, shortDate, WEEKDAYS_SHORT, isoWeekday } from '../../engine/dates.ts';
import { PENALTY } from '../../engine/day.ts';
import { ITEMS, RARITIES, type Bonus } from '../../engine/items.ts';
import { TROPHIES } from '../../engine/trophies.ts';
import { DOMAINS, DOMAIN_IDS, PEOPLES } from '../../engine/world.ts';
import { damageCut, maxHp, statLevel, statProgress } from '../../engine/xp.ts';
import type { OwnedItem, Slot } from '../../engine/types.ts';
import { useGame } from '../store.tsx';
import { exportFile, importFile } from '../persist.ts';
import { ItemIcon } from '../pixel/Sprite.tsx';
import { Bar, Field, Modal } from '../ui/ui.tsx';

const TABS = [['attributs', 'Attributs'], ['sac', 'Sac'], ['hauts-faits', 'Hauts faits'], ['chronique', 'Chronique'], ['reglages', 'Réglages']] as const;
const SLOT_LABEL: Record<Slot, string> = { arme: 'Arme', armure: 'Armure', talisman: 'Talisman' };

export function bonusText(b?: Bonus) {
  if (!b) return 'Souvenir, sans effet.';
  const parts: string[] = [];
  if (b.xpPct) parts.push(`+${Math.round(b.xpPct * 100)} % XP${b.domain ? ` ${DOMAINS[b.domain].label}` : ''}`);
  if (b.goldPct) parts.push(`+${Math.round(b.goldPct * 100)} % or`);
  if (b.damageCut) parts.push(`−${Math.round(b.damageCut * 100)} % dégâts`);
  if (b.shadowPerDay) parts.push(`+${b.shadowPerDay} Ombre par nuit`);
  return parts.join(' · ');
}

export function Hero({ sub, setSub }: { sub: string; setSub: (s: string) => void }) {
  return (
    <>
      <div className="tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={sub === id} className={sub === id ? 'active' : ''} onClick={() => setSub(id)}>{label}</button>)}</div>
      {sub === 'attributs' && <Attributes />}
      {sub === 'sac' && <Bag />}
      {sub === 'hauts-faits' && <Trophies />}
      {sub === 'chronique' && <Chronicle />}
      {sub === 'reglages' && <Settings />}
    </>
  );
}

function Attributes() {
  const { s, run, today } = useGame();
  const [restDays, setRestDays] = useState(3);
  const h = haltesLeft(s, today);
  const tomorrow = addDays(today, 1);
  return (
    <div className="camp-grid">
      <div>
        <div className="panel">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>Attributs</h2>
          {DOMAIN_IDS.map(d => (
            <div key={d} className="stat-row">
              <ItemIcon sprite={DOMAINS[d].icon} tint={DOMAINS[d].color} scale={2.2} />
              <div>
                <strong>{DOMAINS[d].label}</strong> <small style={{ display: 'inline' }}>· {DOMAINS[d].life}{s.hero && PEOPLES[s.hero.people].domain === d ? ' · +20 %' : ''}</small>
                <Bar value={statProgress(s.stats[d]) * 100} max={100} color={DOMAINS[d].color} thin />
                <small>{s.stats[d].toLocaleString('fr-FR')} XP au total</small>
              </div>
              <span className="lv">Niv. {statLevel(s.stats[d])}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>Ressources</h2>
          <Bar label="PV" value={s.hp} max={maxHp(s)} color="var(--hp)" />
          <p className="muted" style={{ fontSize: 12 }}>À 0 : tu tombes (−30 % d’or, un objet perdu, barre de niveau à zéro). Une journée parfaite rend {PENALTY.perfectHeal} PV. Dégâts réduits de {Math.round(damageCut(s) * 100)} % par ton équipement.</p>
          <Bar label="Espoir" value={s.hope} max={100} color="var(--hope)" />
          <p className="muted" style={{ fontSize: 12 }}>Monte avec les rituels. À 100 : un butin rare garanti.</p>
          <Bar label="Ombre" value={s.shadow} max={100} color="var(--shadow)" />
          <p className="muted" style={{ fontSize: 12 }}>Monte avec chaque échec, recule de 3 par journée parfaite. À 100, un Nazgûl te traque.</p>
        </div>
      </div>
      <div>
        <div className="panel">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>Haltes et repos</h2>
          <p style={{ fontSize: 14 }}>Une Halte gèle une journée : aucune sanction, l’XP compte quand même. <b>{h.monthly}</b> Halte{h.monthly > 1 ? 's' : ''} ce mois-ci{h.tokens ? ` + ${h.tokens} jeton${h.tokens > 1 ? 's' : ''}` : ''}.</p>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button className="btn small" disabled={s.frozenDays.includes(today) || (!h.monthly && !h.tokens)} onClick={() => run((x, t) => useHalte(x, t, t))}>{s.frozenDays.includes(today) ? 'Aujourd’hui gelé' : 'Geler aujourd’hui'}</button>
            <button className="btn ghost small" disabled={s.frozenDays.includes(tomorrow) || (!h.monthly && !h.tokens)} onClick={() => run((x, t) => useHalte(x, addDays(t, 1), t))}>{s.frozenDays.includes(tomorrow) ? 'Demain gelé' : 'Geler demain'}</button>
          </div>
          <div className="eyebrow" style={{ marginTop: 16 }}>Mode repos (maladie, vacances)</div>
          {s.rest && s.rest.to >= today ? (
            <><p style={{ fontSize: 14 }}>Repos jusqu’au {shortDate(s.rest.to)} inclus.</p><button className="btn ghost small" onClick={() => run((x, t) => endRest(x, t))}>Reprendre la route</button></>
          ) : canRest(s, today) ? (
            <div className="btn-row">
              <select className="input" style={{ width: 120 }} value={restDays} onChange={e => setRestDays(Number(e.target.value))} aria-label="Durée du repos">{[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} jour{n > 1 ? 's' : ''}</option>)}</select>
              <button className="btn small" onClick={() => { if (confirm(`Se reposer ${restDays} jour(s) ? Pas d’autre repos avant ${REST_COOLDOWN} jours.`)) run((x, t) => startRest(x, t, restDays)); }}>Se reposer</button>
            </div>
          ) : <p className="muted" style={{ fontSize: 13 }}>Prochain repos possible dans {REST_COOLDOWN - diffDays(today, s.lastRestStart!)} j.</p>}
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>Registre</h2>
          {[
            ['Quêtes accomplies', s.counters.questsDone], ['Rituels tenus', s.counters.ritualsDone], ['Corvées faites', s.counters.choresDone],
            ['Cours suivis', s.counters.coursesAttended], ['Épreuves réussies', s.counters.examsWon], ['Boss vaincus', s.counters.projectsDone],
            ['Journées parfaites', s.counters.perfectDays], ['Meilleure série', s.counters.bestPerfectStreak], ['Chutes', s.counters.falls],
          ].map(([l, v]) => <div key={l} className="bar-label" style={{ fontSize: 11 }}><span>{l}</span><b>{v}</b></div>)}
        </div>
      </div>
    </div>
  );
}

function Bag() {
  const { s, run } = useGame();
  const [open, setOpen] = useState<OwnedItem | null>(null);
  const equippedUids = new Set(Object.values(s.equipped));
  const sorted = [...s.inventory].sort((a, b) => ['legendaire', 'rare', 'peu-commun', 'commun'].indexOf(ITEMS[a.itemId].rarity) - ['legendaire', 'rare', 'peu-commun', 'commun'].indexOf(ITEMS[b.itemId].rarity));
  const it = open && ITEMS[open.itemId];
  return (
    <>
      <div className="slots">
        {(['arme', 'armure', 'talisman'] as Slot[]).map(slot => {
          const o = s.inventory.find(i => i.uid === s.equipped[slot]);
          return (
            <button key={slot} className="panel slot" onClick={() => o && setOpen(o)}>
              <div className="eyebrow">{SLOT_LABEL[slot]}</div>
              {o ? <ItemIcon sprite={ITEMS[o.itemId].sprite} tint={ITEMS[o.itemId].tint} scale={3} /> : <span className="empty-slot" />}
              <span style={{ fontSize: 12 }}>{o ? ITEMS[o.itemId].title : 'vide'}</span>
            </button>
          );
        })}
      </div>
      <div className="section-title"><h2>Le sac</h2><span className="mono muted">{s.inventory.length} objet{s.inventory.length > 1 ? 's' : ''} · potions {s.consumables.potion} · lembas {s.consumables.lembas}</span></div>
      <div className="grid-cards">
        {sorted.map(o => {
          const x = ITEMS[o.itemId];
          return (
            <button key={o.uid} className={`panel card ${equippedUids.has(o.uid) ? 'equipped' : ''}`} onClick={() => setOpen(o)}>
              <ItemIcon sprite={x.sprite} tint={x.tint} scale={3} />
              <span className="rarity" style={{ ['--c' as string]: RARITIES[x.rarity].color }}>{RARITIES[x.rarity].label}{equippedUids.has(o.uid) ? ' · porté' : ''}</span>
              <h3>{x.title}</h3>
            </button>
          );
        })}
      </div>
      {!s.inventory.length && <div className="panel"><p className="empty">Ton sac est vide. Chaque quête peut laisser tomber un objet : plus elle est difficile, plus la chance est grande.</p></div>}
      {open && it && (
        <Modal title={it.title} onClose={() => setOpen(null)}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 8, textAlign: 'center' }}>
            <ItemIcon sprite={it.sprite} tint={it.tint} scale={6} />
            <span className="rarity" style={{ ['--c' as string]: RARITIES[it.rarity].color }}>{RARITIES[it.rarity].label}{it.slot ? ` · ${SLOT_LABEL[it.slot]}` : ''}</span>
            <p style={{ fontSize: 15 }}>{it.story}</p>
            <div className="effect-tags"><span className={it.bonus?.shadowPerDay ? 'bad' : ''}>{bonusText(it.bonus)}</span></div>
            <p className="mono muted">Trouvé le {shortDate(open.gotOn)}</p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              {it.slot && (s.equipped[it.slot] === open.uid
                ? <button className="btn ghost" onClick={() => { run(x => equip(x, null, it.slot!)); setOpen(null); }}>Retirer</button>
                : <button className="btn" onClick={() => { run(x => equip(x, open.uid, it.slot!)); setOpen(null); }}>Équiper</button>)}
              <button className="btn red small" onClick={() => { if (confirm(`Vendre pour ${SELL_PRICE[it.rarity]} or ?`)) { run(x => sellItem(x, open.uid)); setOpen(null); } }}>Vendre · {SELL_PRICE[it.rarity]} or</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Trophies() {
  const { s } = useGame();
  const groups = [...new Set(TROPHIES.map(t => t.group))];
  const got = Object.keys(s.trophies).length;
  return (
    <>
      <div className="section-title"><h2>Hauts faits</h2><span className="mono muted">{got}/{TROPHIES.length}</span></div>
      {groups.map(g => (
        <div key={g}>
          <div className="eyebrow" style={{ margin: '14px 6px 6px' }}>{g}</div>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {TROPHIES.filter(t => t.group === g).map(t => {
              const done = !!s.trophies[t.id]; const hidden = t.secret && !done;
              const p = Math.min(t.target, t.progress(s));
              return (
                <div key={t.id} className={`panel card trophy-card ${done ? '' : 'locked'}`}>
                  <ItemIcon sprite={done ? 'star' : 'skull'} tint={done ? '#f2d36b' : '#a8aca2'} scale={2.5} />
                  <div style={{ width: '100%' }}>
                    <h3>{hidden ? '???' : t.title}</h3>
                    <p>{hidden ? 'Haut fait secret.' : done ? `Obtenu le ${shortDate(s.trophies[t.id])}` : t.description}</p>
                    {!done && !hidden && t.target > 1 && <Bar value={p} max={t.target} color="var(--gold)" thin />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function Chronicle() {
  const { s, today } = useGame();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const totals = days.map(d => DOMAIN_IDS.reduce((a, k) => a + (s.dailyXp[d]?.[k] ?? 0), 0));
  const max = Math.max(50, ...totals);
  const week = DOMAIN_IDS.map(d => ({ d, xp: days.reduce((a, k) => a + (s.dailyXp[k]?.[d] ?? 0), 0) })).sort((a, b) => a.xp - b.xp);
  const total = totals.reduce((a, b) => a + b, 0);
  const shadowStart = s.shadowLog[addDays(today, -7)] ?? 0;
  const perfect = s.journal.filter(j => j.title === 'Une journée sans ombre' && j.day >= days[0]).length;
  return (
    <>
      <div className="panel parchment">
        <div className="eyebrow red">Le Conseil d’Elrond · 7 derniers jours</div>
        <h2 style={{ fontSize: 34, margin: '6px 0 4px' }}>{total.toLocaleString('fr-FR')} XP</h2>
        <div className="week-chart" aria-label="XP par jour, par domaine">
          {days.map((d, i) => (
            <div key={d} className="col" title={`${shortDate(d)} : ${totals[i]} XP`}>
              {DOMAIN_IDS.map(k => { const v = s.dailyXp[d]?.[k] ?? 0; return v ? <i key={k} style={{ height: `${(v / max) * 100}%`, ['--c' as string]: DOMAINS[k].color }} /> : null; })}
              <span>{WEEKDAYS_SHORT[isoWeekday(d) - 1]}</span>
            </div>
          ))}
        </div>
        <div className="btn-row" style={{ marginTop: 28, gap: 12, flexWrap: 'wrap' }}>
          {DOMAIN_IDS.map(k => <span key={k} className="mono"><span className="dot" style={{ ['--c' as string]: DOMAINS[k].color }} />{DOMAINS[k].label}</span>)}
        </div>
        <div style={{ display: 'grid', gap: 6, marginTop: 14, fontSize: 14 }}>
          <p>· <b>{perfect}</b> journée{perfect > 1 ? 's' : ''} parfaite{perfect > 1 ? 's' : ''} cette semaine.</p>
          <p>· Domaine le plus négligé : <b>{DOMAINS[week[0].d].label}</b> ({week[0].xp} XP). Le Conseil te conseille d’y planter un rituel.</p>
          <p>· L’Ombre est passée de {shadowStart} à {s.shadow} {s.shadow > shadowStart ? '— elle gagne du terrain.' : s.shadow < shadowStart ? '— elle recule.' : '.'}</p>
        </div>
      </div>
      <div className="section-title"><h2>Chronique</h2></div>
      <div className="panel">
        <div className="journal">
          {s.journal.slice(0, 120).map(j => (
            <div key={j.id} className="journal-entry">
              <span className="date">{shortDate(j.day)}</span>
              <span className="pip" style={{ ['--c' as string]: j.tone === 'gain' ? 'var(--gold)' : j.tone === 'perte' ? 'var(--brick)' : 'var(--green)' }} />
              <div><h3>{j.title}</h3><p>{j.text}</p></div>
            </div>
          ))}
          {!s.journal.length && <p className="empty">La chronique s’écrira au fil des jours.</p>}
        </div>
      </div>
    </>
  );
}

function Settings() {
  const { s, run, replace, reset, today } = useGame();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const set = (patch: Partial<typeof s.settings>) => run(x => ({ state: { ...x, settings: { ...x.settings, ...patch } }, events: [] }));
  const daysSinceBackup = s.lastBackup ? diffDays(today, s.lastBackup) : null;
  return (
    <div className="camp-grid">
      <div>
        <div className="panel">
          <h2 style={{ fontSize: 28 }}>Réglages</h2>
          <Field label="La journée se termine à">
            <select value={s.settings.dayStartHour} onChange={e => set({ dayStartHour: Number(e.target.value) })}>{[0, 1, 2, 3, 4, 5, 6].map(h => <option key={h} value={h}>{h} h du matin</option>)}</select>
          </Field>
          <label className="choice" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={s.settings.sound} onChange={e => set({ sound: e.target.checked })} style={{ width: 20, height: 20 }} />
            <span><strong>Sons 8-bit</strong><small>Quête accomplie, niveau gagné, dégâts.</small></span>
          </label>
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 28 }}>Sauvegarde</h2>
          <p style={{ fontSize: 14 }}>Tout est enregistré sur cet appareil. Exporte régulièrement pour ne rien perdre et pour passer d’un appareil à l’autre.</p>
          <p className="mono" style={{ margin: '8px 0', color: daysSinceBackup === null || daysSinceBackup > 7 ? 'var(--brick)' : 'var(--green)' }}>{daysSinceBackup === null ? 'Jamais exportée' : `Dernier export il y a ${daysSinceBackup} j`}</p>
          <div className="btn-row">
            <button className="btn" onClick={() => { exportFile(s); run((x, t) => ({ state: { ...x, lastBackup: t }, events: [] })); }}>Exporter</button>
            <button className="btn ghost" onClick={() => file.current?.click()}>Importer</button>
            <input ref={file} type="file" accept="application/json" hidden onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              try { const st = await importFile(f, today); if (confirm('Remplacer ta partie actuelle par cette sauvegarde ?')) { replace(st); setMsg('Sauvegarde importée.'); } }
              catch (err) { setMsg((err as Error).message); }
              e.target.value = '';
            }} />
          </div>
          {msg && <p className="mono" style={{ marginTop: 8 }}>{msg}</p>}
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 28 }}>Sur iPhone</h2>
          <p style={{ fontSize: 14 }}>Une fois l’app en ligne, ouvre-la dans Safari, touche Partager puis « Sur l’écran d’accueil ». Elle fonctionne ensuite hors connexion, comme une vraie app.</p>
        </div>
      </div>
      <div>
        <div className="panel">
          <h2 style={{ fontSize: 28 }}>Horloge de test</h2>
          <p style={{ fontSize: 14 }}>Pour voir les règles hardcore en action sans attendre. Avancer l’horloge clôt les journées comme si elles étaient passées.</p>
          <p className="mono" style={{ margin: '8px 0' }}>Décalage : {s.settings.clockOffset} jour{Math.abs(s.settings.clockOffset) > 1 ? 's' : ''}</p>
          <div className="btn-row">
            <button className="btn ghost small" onClick={() => set({ clockOffset: s.settings.clockOffset + 1 })}>+1 jour</button>
            <button className="btn ghost small" disabled={s.settings.clockOffset === 0} onClick={() => { if (confirm('Revenir à l’heure réelle ? Les journées déjà clôturées le restent.')) set({ clockOffset: 0 }); }}>Heure réelle</button>
          </div>
        </div>
        <div className="panel dark">
          <h2 style={{ fontSize: 28 }}>Recommencer</h2>
          <p style={{ fontSize: 14, color: '#c9b78a' }}>Efface définitivement le héros, les quêtes et la chronique de cet appareil. Exporte d’abord si tu veux garder une trace.</p>
          <button className="btn red" style={{ marginTop: 10 }} onClick={() => { if (confirm('Tout effacer ?') && confirm('Vraiment ? Cette action est définitive.')) reset(); }}>Tout effacer</button>
        </div>
      </div>
    </div>
  );
}
