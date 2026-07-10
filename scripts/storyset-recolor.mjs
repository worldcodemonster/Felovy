/**
 * Recolor Storyset Rafiki SVGs to Felovy brand green (#15803d).
 * Run: node scripts/storyset-recolor.mjs
 * Applied automatically after fetch-storyset-illustrations.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Felovy primary brand color */
export const STORYSET_PINK = '#15803d';
export const STORYSET_MAGENTA = '#166534';
/** Primary accent — Felovy green */
export const STORYSET_BRAND_PRIMARY = '#15803d';
/** Darker accent for shadows / depth */
export const STORYSET_BRAND_PRIMARY_DARK = '#166534';

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

/** Storyset decorative layers — not part of the character/scene artwork */
const STRIP_GROUP_IDS = ['background-complete', 'background-simple', 'Shadow'];

function removeTopLevelGroup(svg, id) {
  const open = `<g id="${id}"`;
  let idx = 0;

  while ((idx = svg.indexOf(open, idx)) !== -1) {
    let depth = 0;
    const start = idx;
    let i = idx;
    let removed = false;

    while (i < svg.length) {
      if (svg[i] === '<' && svg.slice(i, i + 2) === '<g') {
        depth++;
        i += 2;
        continue;
      }
      if (svg.slice(i, i + 4) === '</g>') {
        depth--;
        if (depth === 0) {
          svg = svg.slice(0, start) + svg.slice(i + 4);
          idx = start;
          removed = true;
          break;
        }
        i += 4;
        continue;
      }
      i++;
    }

    if (!removed) break;
  }

  return svg;
}

/** Remove Storyset backdrop blobs/scenery so illustrations sit on a transparent canvas */
export function stripStorysetBackground(svg) {
  let out = svg;
  for (const id of STRIP_GROUP_IDS) {
    out = removeTopLevelGroup(out, id);
  }
  return out;
}

/** Paths with only opacity default to black fill — drop these shadow layers */
export function removeOpacityOnlyPaths(svg) {
  return svg.replace(/<path\b[^>]*style="opacity:[^"]*"[^>]*><\/path>/g, (tag) =>
    /fill[:#]/i.test(tag) ? tag : '',
  );
}

/** Hiring illustration: drop solid #263238 caps on the applicant list clipboard */
export function fixHiringListShadows(svg) {
  const groupOpen = '<g id="list-of-people">';
  const start = svg.indexOf(groupOpen);
  if (start === -1) return svg;

  const end = svg.indexOf('</g>', start);
  if (end === -1) return svg;

  const head = svg.slice(0, start);
  const group = svg.slice(start, end + 4);
  const tail = svg.slice(end + 4);

  const cleaned = group.replace(/<path\b[^>]*style="fill:#263238"[^>]*><\/path>/g, '');
  return head + cleaned + tail;
}

export function postProcessStorysetSvg(svg) {
  return fixHiringListShadows(removeOpacityOnlyPaths(stripStorysetBackground(recolorStorysetSvg(svg))));
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

const isMain =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
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

  console.log(`Recolored ${changed}/${files.length} Storyset SVGs to Felovy green (${STORYSET_BRAND_PRIMARY}).`);
}
