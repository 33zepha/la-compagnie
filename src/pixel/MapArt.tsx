import { useMemo } from 'react';
import { STAGES } from '../../engine/world.ts';
import { random } from '../../engine/rng.ts';
import { rasterize } from './Sprite.tsx';
import { AVATARS } from './sprites.ts';
import type { Hero } from '../../engine/types.ts';

// Carte pixel de la Terre du Milieu, générée en code (64×40), sans image extérieure.
const W = 64, H = 40;
const C = {
  sea: '#3f6383', sea2: '#4a7092', land: '#9db564', land2: '#a8bf6c', shire: '#86b25a', plain: '#c4b868', plain2: '#cfc274',
  forest: '#4f7a3a', forest2: '#3d6430', gold: '#d4a72c', gold2: '#b88f22', mount: '#8a8478', peak: '#e6e2d6', river: '#5b8fc0',
  mordor: '#4a3b36', mordor2: '#3a2d2a', ash: '#2a2024', lava: '#e0412a', doom: '#7a2a20',
};

function line(a: [number, number], b: [number, number]) {
  const pts: [number, number][] = []; let [x0, y0] = a; const [x1, y1] = b;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (;;) { pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  return pts;
}
const poly = (pts: [number, number][]) => pts.slice(1).flatMap((p, i) => line(pts[i], p));

function buildTerrain(): string[][] {
  const rnd = random('terre-du-milieu');
  const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => (rnd() < 0.18 ? C.land2 : C.land)));
  const set = (x: number, y: number, c: string) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const blob = (cx: number, cy: number, rx: number, ry: number, a: string, b: string, jitter = 0.25) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d < 1 + (rnd() - 0.5) * jitter) set(x, y, rnd() < 0.3 ? b : a); }
  };
  // Mers à l'ouest et baie au sud.
  for (let y = 0; y < H; y++) { const coast = 4 + Math.round(Math.sin(y / 4) * 1.5 + rnd() * 1.4) + (y > 26 ? Math.round((y - 26) * 0.7) : 0); for (let x = 0; x < coast; x++) set(x, y, rnd() < 0.15 ? C.sea2 : C.sea); }
  blob(30, 40, 10, 4, C.sea, C.sea2, 0.4);
  // Comté, plaines du Rohan.
  blob(10, 13, 4, 3, C.shire, C.land2);
  blob(31, 28, 6, 3, C.plain, C.plain2);
  // Forêts.
  blob(13, 16, 2, 1.6, C.forest, C.forest2);
  blob(38, 11, 4, 7, C.forest, C.forest2);
  blob(26, 25, 1.8, 1.6, C.forest, C.forest2);
  blob(30, 21, 1.8, 1.4, C.gold, C.gold2);
  blob(44, 27, 1.4, 2.2, C.forest, C.forest2);
  // Rivières.
  for (const [x, y] of poly([[36, 1], [35, 9], [34, 16], [33, 22], [36, 27], [39, 30], [42, 33], [41, 37], [38, 40]])) set(x, y, C.river);
  for (const [x, y] of poly([[13, 5], [12, 11], [13, 17], [15, 24]])) set(x, y, C.river);
  // Mordor.
  for (let y = 24; y < H; y++) for (let x = 46; x < W; x++) set(x, y, rnd() < 0.3 ? C.mordor2 : C.mordor);
  for (let y = 24; y < H; y++) { set(46, y, C.ash); set(47, y, rnd() < 0.5 ? C.ash : C.mount); }
  for (let x = 46; x < W; x++) { set(x, 24, C.ash); set(x, 25, rnd() < 0.5 ? C.ash : C.mount); }
  // Montagnes de Brume et Montagnes Blanches.
  for (let y = 1; y < 25; y++) { const x = 24 + Math.round(Math.sin(y / 3)); set(x, y, C.mount); set(x + 1, y, rnd() < 0.4 ? C.peak : C.mount); }
  for (let x = 23; x < 39; x++) { const y = 32 + Math.round(Math.sin(x / 2) * 0.6); set(x, y, C.mount); set(x, y - 1, rnd() < 0.4 ? C.peak : C.mount); }
  for (let x = 30; x < 45; x++) if (rnd() < 0.6) set(x, 2, C.mount);
  // Montagne du Destin.
  const [dx, dy] = [STAGES[11].x, STAGES[11].y];
  for (const [x, y] of [[dx - 1, dy + 1], [dx, dy + 1], [dx + 1, dy + 1], [dx - 2, dy + 2], [dx - 1, dy + 2], [dx, dy + 2], [dx + 1, dy + 2], [dx + 2, dy + 2], [dx, dy]]) set(x, y, C.doom);
  set(dx, dy - 1, C.lava);
  return g;
}

export function MapArt({ stage, progress, hero, className }: { stage: number; progress: number; hero: Hero | null; className?: string }) {
  const terrain = useMemo(buildTerrain, []);
  const path = useMemo(() => STAGES.slice(1).map((s, i) => line([STAGES[i].x, STAGES[i].y], [s.x, s.y])), []);
  const avatar = useMemo(() => hero ? rasterize(AVATARS[hero.people], { look: hero.look }) : null, [hero]);
  const cur = STAGES[stage], next = STAGES[stage + 1];
  const pos: [number, number] = next ? [cur.x + (next.x - cur.x) * progress, cur.y + (next.y - cur.y) * progress] : [cur.x, cur.y];

  const rects: React.ReactElement[] = [];
  terrain.forEach((row, y) => { let x = 0; while (x < W) { let run = 1; while (row[x + run] === row[x]) run++; rects.push(<rect key={`t${x}-${y}`} x={x} y={y} width={run} height={1} fill={row[x]} />); x += run; } });

  return (
    <svg className={`middle-earth ${className ?? ''}`} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" role="img" aria-label={`Carte du Voyage : tu es entre ${cur.name}${next ? ` et ${next.name}` : ''}.`}>
      {rects}
      {path.map((seg, i) => seg.map(([x, y], k) => k % 2 === 0 && <rect key={`p${i}-${k}`} x={x} y={y} width={1} height={1} fill={i < stage ? '#a33b2b' : i === stage ? '#f2d36b' : '#2b1d14'} opacity={i <= stage ? 1 : 0.55} />))}
      {STAGES.map((s, i) => (
        <g key={s.id}>
          <rect x={s.x - 0.5} y={s.y - 0.5} width={2} height={2} fill={i <= stage ? '#f2d36b' : '#e8d9b0'} stroke="#2b1d14" strokeWidth={0.35} />
          {i === STAGES.length - 1 && <rect x={s.x - 0.25} y={s.y - 2.5} width={1.5} height={1.5} fill="#e0412a" className="lava" />}
        </g>
      ))}
      {avatar && (
        <g transform={`translate(${pos[0] - 2.5} ${pos[1] - 6.5}) scale(0.28)`}>
          {/* L'animation CSS remplacerait l'attribut transform : elle vit sur un groupe interne. */}
          <g className="map-hero">{avatar.map((row, y) => row.map((c, x) => c && <rect key={`a${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />))}</g>
        </g>
      )}
    </svg>
  );
}
