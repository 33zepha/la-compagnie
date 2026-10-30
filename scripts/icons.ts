// Génère les icônes PWA (PNG) et le favicon (SVG) à partir de l'avatar hobbit en pixel art.
// Usage : npm run icons
import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { AVATARS, FIXED } from '../src/pixel/sprites.ts';

const look: Record<string, string> = { H: '#8a5a2b', C: '#4f7a3a', c: '#375a27', S: '#e8b98f' };
const def = AVATARS.hobbit;
const rows = def.rows.map(r => r + [...r].reverse().join(''));
const art = rows.map(r => [...r].map(ch => ch === '.' ? null : look[ch] ?? FIXED[ch]));
// Contour sombre automatique, comme <Sprite>.
const h = art.length, w = art[0].length;
const sprite: (string | null)[][] = Array.from({ length: h + 2 }, (_, y) => Array.from({ length: w + 2 }, (_, x) => art[y - 1]?.[x - 1] ?? null));
for (let y = 0; y < h + 2; y++) for (let x = 0; x < w + 2; x++) if (!sprite[y][x] && [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => art[y + dy - 1]?.[x + dx - 1])) sprite[y][x] = FIXED.D;

const GRID = 28; // icône = 28×28 pixels logiques
const bg = '#2b1d14', frame = '#d4a72c', sky = '#3a5f86', grass = '#5f8f45';
function pixel(x: number, y: number) {
  if (x < 1 || y < 1 || x >= GRID - 1 || y >= GRID - 1) return bg;
  if (x === 1 || y === 1 || x === GRID - 2 || y === GRID - 2) return frame;
  const ox = Math.floor((GRID - sprite[0].length) / 2), oy = GRID - 3 - sprite.length;
  const c = sprite[y - oy]?.[x - ox];
  if (c) return c;
  return y > 18 ? grass : sky;
}

function png(size: number) {
  const scale = size / GRID;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const hex = pixel(Math.floor(x / scale), Math.floor(y / scale));
      const n = parseInt(hex.slice(1), 16), o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = (n >> 16) & 255; raw[o + 1] = (n >> 8) & 255; raw[o + 2] = n & 255;
    }
  }
  const chunk = (type: string, data: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync('public/icon-192.png', png(192));
writeFileSync('public/icon-512.png', png(512));
writeFileSync('public/apple-touch-icon.png', png(180));
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}" shape-rendering="crispEdges">`;
for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pixel(x, y)}"/>`;
writeFileSync('public/icon.svg', svg + '</svg>');
console.log('Icônes générées dans public/.');
