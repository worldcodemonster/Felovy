import { readFileSync } from 'node:fs';

function extractGroup(svg, id) {
  const re = new RegExp(`<g id="${id}"[^>]*>([\\s\\S]*?)</g>`);
  const m = svg.match(re);
  return m ? m[1] : null;
}

for (const f of ['dev-04-apply-jobs', 'emp-04-review-applicants']) {
  const svg = readFileSync(`public/illustrations/storyset/workflows/${f}.svg`, 'utf8');
  console.log(`\n=== ${f} ===`);
  const largeRects = [...svg.matchAll(/<rect[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*>/g)]
    .filter((m) => Number(m[1]) > 100 && Number(m[2]) > 100);
  console.log('large rects:', largeRects.length);
  for (const m of largeRects.slice(0, 5)) {
    console.log(' ', m[0].slice(0, 120));
  }

  for (const id of ['list-of-people', 'Briefcases', 'Character', 'path']) {
    const chunk = extractGroup(svg, id);
    if (!chunk) continue;
    const dark = (chunk.match(/263238/g) || []).length;
    if (dark) console.log(`${id}: ${dark} x #263238`);
  }
}
