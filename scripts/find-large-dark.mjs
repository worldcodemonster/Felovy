import { readFileSync } from 'node:fs';

function bboxFromPath(d) {
  const nums = d.match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
  if (nums.length < 2) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]);
    maxX = Math.max(maxX, nums[i]);
    minY = Math.min(minY, nums[i + 1]);
    maxY = Math.max(maxY, nums[i + 1]);
  }
  return { minX, minY, maxX, maxY, area: (maxX - minX) * (maxY - minY) };
}

for (const f of ['dev-04-apply-jobs', 'emp-04-review-applicants', 'dev-01-verify-email']) {
  const svg = readFileSync(`public/illustrations/storyset/workflows/${f}.svg`, 'utf8');
  console.log(`\n=== ${f} ===`);
  const paths = [...svg.matchAll(/<path d="([^"]+)" style="fill:([^"]+)"/g)];
  const darkLarge = paths
    .map((m) => ({ d: m[1], fill: m[2], bbox: bboxFromPath(m[1]) }))
    .filter((p) => p.bbox && p.bbox.area > 15000 && /263238|#000|630f0f/i.test(p.fill))
    .sort((a, b) => b.bbox.area - a.bbox.area);
  console.log('large dark paths:', darkLarge.length);
  for (const p of darkLarge.slice(0, 5)) {
    console.log(`  fill=${p.fill} area=${Math.round(p.bbox.area)} d=${p.d.slice(0, 80)}...`);
  }
}
