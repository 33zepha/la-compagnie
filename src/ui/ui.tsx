import { useEffect, type ReactNode } from 'react';
import { DOMAINS } from '../../engine/world.ts';
import type { Domain } from '../../engine/types.ts';
import { ItemIcon } from '../pixel/Sprite.tsx';

export const LETTERS = 'ABCDEFGHIJ';

export function Bar({ value, max, color, label, right, thin }: { value: number; max: number; color: string; label?: string; right?: ReactNode; thin?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div>
      {label && <div className="bar-label"><span>{label}</span><b>{right ?? `${Math.round(value)}/${max}`}</b></div>}
      <div className={`bar ${thin ? 'thin' : ''}`} role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        <i style={{ width: `${pct}%`, ['--c' as string]: color }} />
      </div>
    </div>
  );
}

/** Cartes de choix à lettre, comme les décisions d'EXISTENCES. */
export function Choices<T extends string>({ options, value, onChange, cols, stacked }: {
  options: { id: T; label: ReactNode; hint?: ReactNode; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; cols?: 'two' | 'five'; stacked?: boolean;
}) {
  return (
    <div className={`choices ${cols ?? ''}`} role="radiogroup">
      {options.map((o, i) => (
        <button type="button" key={o.id} role="radio" aria-checked={value === o.id} className={`choice ${value === o.id ? 'selected' : ''} ${stacked ? 'stacked' : ''}`} onClick={() => onChange(o.id)}>
          {stacked ? o.icon : <span className="choice-letter">{LETTERS[i]}</span>}
          <span><strong>{o.label}</strong>{o.hint && <small>{o.hint}</small>}</span>
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title?: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal panel" role="dialog" aria-modal="true" style={wide ? { width: 'min(760px, 100%)' } : undefined}>
        {title && <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Fermer">✕</button></div>}
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }

export const DomainDot = ({ d }: { d: Domain }) => <span className="dot" style={{ ['--c' as string]: DOMAINS[d].color }} />;
export const Gold = ({ n }: { n: number }) => <span className="price"><ItemIcon sprite="coin" scale={1.5} />{n}</span>;
export const Section = ({ title, action, children }: { title: ReactNode; action?: ReactNode; children?: ReactNode }) => (
  <>
    <div className="section-title"><h2>{title}</h2>{action}</div>
    {children}
  </>
);
