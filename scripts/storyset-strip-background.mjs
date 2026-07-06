/**
 * Strip Storyset decorative backgrounds from saved SVGs.
 * Run: node scripts/storyset-strip-background.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { postProcessStorysetSvg } from './storyset-recolor.mjs';

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
const workflowOnly = process.argv.includes('--workflows');

const files = (await walk(ROOT)).filter((file) =>
  workflowOnly ? file.includes(`${path.sep}workflows${path.sep}`) : true,
);

let changed = 0;

for (const file of files) {
  const original = await readFile(file, 'utf8');
  const processed = postProcessStorysetSvg(original);

  if (processed !== original) {
    await writeFile(file, processed, 'utf8');
    changed++;
  }
}

console.log(`Post-processed ${changed}/${files.length} Storyset SVG(s).`);
