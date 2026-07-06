/**
 * Download contextually correct workplace photos into public/workplace/
 * All IDs pre-verified as returning HTTP 200.
 * Run: npm run workplace-images:fetch
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public', 'workplace');

/** [slug, unsplash photo id, description] — every ID pre-verified 200 */
const IMAGES = [
  // ── Group 1: Business contracts (Felovy <-> companies) ──────────────────
  // Contract docs / paperwork close-up
  ['contract-signing',      'photo-1554224155-6726b3ff858f'],
  // Business handshake after deal
  ['contract-handshake',    'photo-1560179707-f14e90ef3623'],
  // People reviewing contract documents at desk
  ['contract-review',       'photo-1450101499163-c8848c66ca85'],
  // Business people in a meeting room, corporate setting
  ['contract-partnership',  'photo-1564069114553-7215e1ff1890'],

  // ── Group 2: Onsite developer interviews (interviewer + candidate) ───────
  // Professional Q&A / one-on-one interview across desk
  ['interview-one-on-one',  'photo-1434626881859-194d67b2b86f'],
  // Hiring manager led discussion in office setting
  ['interview-manager',     'photo-1553877522-43269d4ea984'],
  // Panel / team interview meeting
  ['interview-panel',       'photo-1556761175-b413da4baf72'],
  // Office discussion with documents, candidate presenting
  ['interview-discussion',  'photo-1551434678-e076c223a692'],

  // ── Group 3: Remote hiring — recruiters on laptop, devs with headset ────
  // Recruiter / hiring manager on laptop conducting remote interview
  ['remote-recruiter',      'photo-1522202176988-66273c2fd55f'],
  // Developer being interviewed remotely, laptop/screen visible
  ['remote-developer',      'photo-1552664730-d307ca884978'],
  // Person with headset on video call — developer side
  ['remote-headset',        'photo-1486312338219-ce68d2c6f44d'],
  // Team meeting / video conference in open office
  ['remote-team-meeting',   'photo-1522071820081-009f0129c71c'],
];

async function fetchPhoto(slug, photoId) {
  const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&h=800&q=85`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${slug} (${photoId}): HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(ROOT, `${slug}.jpg`), buf);
  console.log(`  ✓ ${slug}.jpg`);
}

await mkdir(ROOT, { recursive: true });

const groups = ['contract', 'interview', 'remote'];
let current = null;
for (const [slug, photoId] of IMAGES) {
  const grp = slug.split('-')[0];
  if (grp !== current) { current = grp; console.log(`\n[${grp}]`); }
  await fetchPhoto(slug, photoId);
}

console.log(`\nDone — ${IMAGES.length} images saved to public/workplace/`);
