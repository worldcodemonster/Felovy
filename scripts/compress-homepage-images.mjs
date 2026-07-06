/**
 * Resize and compress homepage JPGs in public/ for smaller files at display size.
 * Run: npm run homepage-images:compress
 */

import { readdir, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();

/** [folder, maxWidth, jpegQuality] */
const TARGETS = [
  ['public/contract', 960, 72],
  ['public/interview-inperson', 960, 72],
  ['public/interview-remote', 960, 72],
  ['public/team-meeting', 960, 72],
  ['public/dev', 480, 72],
  ['public/clients', 200, 75],
];

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function compressFile(filePath, maxWidth, quality) {
  const before = (await stat(filePath)).size;
  const meta = await sharp(filePath).metadata();
  const tmpPath = `${filePath}.tmp`;

  let pipeline = sharp(filePath);
  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  await pipeline.jpeg({ quality, mozjpeg: true }).toFile(tmpPath);

  const after = (await stat(tmpPath)).size;
  if (after >= before) {
    await unlink(tmpPath);
    console.log(`  · ${path.basename(filePath)} ${fmt(before)} (unchanged)`);
    return;
  }

  await unlink(filePath);
  await rename(tmpPath, filePath);
  console.log(`  ✓ ${path.basename(filePath)} ${fmt(before)} → ${fmt(after)}`);
}

for (const [folder, maxWidth, quality] of TARGETS) {
  const dir = path.join(ROOT, folder);
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    console.log(`\n[skip] ${folder} (not found)`);
    continue;
  }

  const jpgs = entries.filter((f) => /\.jpe?g$/i.test(f));
  if (!jpgs.length) continue;

  console.log(`\n[${folder}] max ${maxWidth}px, q${quality}`);
  for (const file of jpgs) {
    await compressFile(path.join(dir, file), maxWidth, quality);
  }
}

console.log('\nDone — homepage JPGs compressed.');
