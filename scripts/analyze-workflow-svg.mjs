import { readFileSync } from 'node:fs';

function extractGroup(svg, id) {
  const re = new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`);
  const m = svg.match(re);
  return m ? m[1] : null;
}

const files = [
  'dev-03-get-verified',
  'dev-04-apply-jobs',
  'emp-03-post-job',
  'emp-04-review-applicants',
];

for (const f of files) {
  const svg = readFileSync(`public/illustrations/storyset/workflows/${f}.svg`, 'utf8');
  console.log(`\n=== ${f} ===`);
  for (const g of ['background-complete', 'background-simple', 'Shadow', 'list-of-people', 'Briefcases']) {
    const chunk = extractGroup(svg, g);
    if (!chunk) continue;
    const fills = [...new Set([...chunk.matchAll(/fill:([^;"]+)/g)].map((m) => m[1]))];
    console.log(`${g}: len=${chunk.length}, fills=${fills.join(', ') || 'none'}`);
  }
}
