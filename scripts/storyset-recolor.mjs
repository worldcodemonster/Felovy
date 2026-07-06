/**
 * Recolor Storyset Rafiki SVGs to Felovy brand red (#e11d48).
 * Run: node scripts/storyset-recolor.mjs
 * Applied automatically after fetch-storyset-illustrations.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Felovy primary brand color */
export const STORYSET_PINK = '#e11d48';
export const STORYSET_MAGENTA = '#be123c';
/** Primary accent — Felovy red */
export const STORYSET_BRAND_PRIMARY = '#e11d48';
/** Darker accent for shadows / depth */
export const STORYSET_BRAND_PRIMARY_DARK = '#be123c';

/** Storyset default blues/reds and prior recolor hex → Felovy brand */
export const STORYSET_RECOLOR_MAP = [
  ['#407BFF', STORYSET_BRAND_PRIMARY],
  ['#407bff', STORYSET_BRAND_PRIMARY],
  ['#2C6BDB', STORYSET_BRAND_PRIMARY_DARK],
  ['#2c6bdb', STORYSET_BRAND_PRIMARY_DARK],
  ['#EC65C7', STORYSET_BRAND_PRIMARY],
  ['#ec65c7', STORYSET_BRAND_PRIMARY],
  ['#E647B3', STORYSET_BRAND_PRIMARY_DARK],
  ['#e647b3', STORYSET_BRAND_PRIMARY_DARK],
  ['#F472B6', STORYSET_BRAND_PRIMARY],
  ['#f472b6', STORYSET_BRAND_PRIMARY],
  ['#D946EF', STORYSET_BRAND_PRIMARY_DARK],
  ['#d946ef', STORYSET_BRAND_PRIMARY_DARK],
  ['#A855F7', STORYSET_BRAND_PRIMARY_DARK],
  ['#a855f7', STORYSET_BRAND_PRIMARY_DARK],
  ['#E11D48', STORYSET_BRAND_PRIMARY],
  ['#e11d48', STORYSET_BRAND_PRIMARY],
  ['#BE123C', STORYSET_BRAND_PRIMARY_DARK],
  ['#be123c', STORYSET_BRAND_PRIMARY_DARK],
];

export function recolorStorysetSvg(svg) {
  let out = svg;
  for (const [from, to] of STORYSET_RECOLOR_MAP) {
    out = out.split(from).join(to);
  }
  return out;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith('.svg')) files.push(full);
  }
  return files;
}

const ROOT = path.join(process.cwd(), 'public', 'illustrations', 'storyset');

const files = await walk(ROOT);
let changed = 0;

for (const file of files) {
  const original = await readFile(file, 'utf8');
  const recolored = recolorStorysetSvg(original);
  if (recolored !== original) {
    await writeFile(file, recolored, 'utf8');
    changed++;
  }
}

console.log(`Recolored ${changed}/${files.length} Storyset SVGs to Felovy red (${STORYSET_BRAND_PRIMARY}).`);
