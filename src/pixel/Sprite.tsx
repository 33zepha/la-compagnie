import { memo } from 'react';
import { AVATARS, BOSSES, EYE, FIXED, ITEM_SPRITES, type People, type SpriteDef } from './sprites.ts';
import type { Look } from '../../engine/types.ts';

export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

type Colors = { tint?: string; look?: Look };
/** Grille de couleurs finale (avec reflet, surimpressions et contour automatique). */
export function rasterize(def: SpriteDef, { tint, look }: Colors, outline = true): (string | null)[][] {
  const rows = def.rows.map(r => def.mirror ? r + [...r].reverse().join('') : r);
  const grid = rows.map(r => [...r]);
  for (const [x, y, ch] of def.overlay ?? []) if (grid[y]) grid[y][x] = ch;
  const t = tint ?? def.tint ?? '#888888';
  const dyn: Record<string, string> = {
    T: t, L: shade(t, 0.35), t: shade(t, -0.3),
    H: look?.hair ?? '#5a3a1e', C: look?.cape ?? '#4f7a3a', c: shade(look?.cape ?? '#4f7a3a', -0.3), S: look?.skin ?? '#e8b98f',
  };
  const colors = grid.map(r => r.map(ch => ch === '.' ? null : dyn[ch] ?? FIXED[ch] ?? '#ff00ff'));
  if (!outline) return colors;
  const h = colors.length, w = Math.max(...colors.map(r => r.length));
  const out: (string | null)[][] = Array.from({ length: h + 2 }, () => Array(w + 2).fill(null));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y + 1][x + 1] = colors[y][x] ?? null;
  const line = def.outline ?? FIXED.D;
  for (let y = 0; y < h + 2; y++) for (let x = 0; x < w + 2; x++) {
    if (out[y][x]) continue;
    const near = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => { const yy = y + dy - 1, xx = x + dx - 1; return yy >= 0 && yy < h && xx >= 0 && xx < w && colors[yy][xx]; });
    if (near) out[y][x] = line;
  }
  return out;
}

/** SVG d'une grille, en fusionnant les pixels contigus d'une même ligne. */
export function GridSvg({ grid, scale = 3, className, label }: { grid: (string | null)[][]; scale?: number; className?: string; label?: string }) {
  const h = grid.length, w = Math.max(...grid.map(r => r.length));
  const rects: React.ReactElement[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const col = row[x]; if (!col) { x++; continue; }
      let run = 1; while (row[x + run] === col) run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={col} />);
      x += run;
    }
  });
  return (
    <svg className={`sprite ${className ?? ''}`} viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} shapeRendering="crispEdges" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {rects}
    </svg>
  );
}

export const Sprite = memo(function Sprite({ def, scale = 3, tint, look, outline = true, className, label }: { def: SpriteDef; scale?: number; tint?: string; look?: Look; outline?: boolean; className?: string; label?: string }) {
  return <GridSvg grid={rasterize(def, { tint, look }, outline)} scale={scale} className={className} label={label} />;
});

export const ItemIcon = ({ sprite, tint, scale = 3, label }: { sprite: string; tint?: string; scale?: number; label?: string }) =>
  <Sprite def={ITEM_SPRITES[sprite] ?? ITEM_SPRITES.gem} tint={tint} scale={scale} label={label} />;
export const Avatar = ({ people, look, scale = 4, className }: { people: People; look: Look; scale?: number; className?: string }) =>
  <Sprite def={AVATARS[people]} look={look} scale={scale} className={className} label={`Avatar ${people}`} />;
export const Boss = ({ id, scale = 4, className }: { id: string; scale?: number; className?: string }) =>
  <Sprite def={BOSSES[id] ?? BOSSES.troll} scale={scale} className={className} label={BOSSES[id]?.name} />;
export const Eye = ({ scale = 3, className }: { scale?: number; className?: string }) => <Sprite def={EYE} scale={scale} className={className} label="L’Œil" />;
