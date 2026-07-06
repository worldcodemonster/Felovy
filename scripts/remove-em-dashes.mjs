/**
 * Remove em dashes (—) from user-facing source strings.
 * Run: node scripts/remove-em-dashes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') walk(p, files);
    else if (/\.(tsx|ts)$/.test(e.name)) files.push(p);
  }
  return files;
}

const SKIP = new Set([
  'src/lib/company-logos.ts',
  'src/lib/devicon-stacks.ts',
  'src/lib/storyset.ts',
  'src/lib/illustrations.ts',
  'src/config/agent.config.ts',
  'src/server/controllers/developer.controller.ts',
  'src/server/routes/job.routes.ts',
  'src/server/routes/developer.routes.ts',
  'src/components/shared/AppOverlays.tsx',
  'src/components/shared/Breadcrumb.tsx',
  'src/components/shared/FlowerCanvas.tsx',
  'src/components/home/TestimonialCarousel.tsx',
]);

function transform(content) {
  let c = content;
  c = c.replace(/â€"/g, ', ');
  c = c.replace(/\u2014/g, 'EMDASH');
  c = c.replace(/FelovyEMDASHFor/g, 'Felovy | For');
  c = c.replace(/FeliEMDASH/g, 'Feli, ');
  c = c.replace(/'EMDASH'/g, "'-'");
  c = c.replace(/"EMDASH"/g, '"-"');
  c = c.replace(/\} EMDASH \{/g, '} to {');
  c = c.replace(/ EMDASH /g, ', ');
  const fixes = [
    ['risky, until', 'risky until'],
    ['came in, seamlessly', 'came in seamlessly'],
    ['call, that', 'call. That'],
    ['hire, it', 'hire. It'],
    ['design, I', 'design. I'],
    ['APIs, my', 'APIs. My'],
    ['trust, you', 'trust. You'],
    ['zones, our', 'zones. Our'],
    ['management, billing', 'management. Billing'],
    ['jobs, spanning', 'jobs spanning'],
    ['load jobs, database', 'load jobs. Database'],
    ['Server error, check', 'Server error. Check'],
    ['selected, click', 'selected. Click'],
    ['needed, no', 'needed, with no'],
  ];
  for (const [from, to] of fixes) c = c.replaceAll(from, to);
  return c;
}

let changed = 0;
for (const f of walk('src')) {
  const norm = f.replace(/\\/g, '/');
  if (SKIP.has(norm)) continue;
  const before = fs.readFileSync(f, 'utf8');
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(f, after, 'utf8');
    changed++;
    console.log('updated', norm);
  }
}
console.log(`Done - ${changed} files updated`);
