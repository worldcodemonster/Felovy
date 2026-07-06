import { readFileSync } from 'node:fs';

for (const f of [
  'dev-01-verify-email',
  'dev-02-complete-profile',
  'dev-03-get-verified',
  'dev-04-apply-jobs',
  'emp-03-post-job',
  'emp-04-review-applicants',
]) {
  const svg = readFileSync(`public/illustrations/storyset/workflows/${f}.svg`, 'utf8');
  const noFillOpacity = [...svg.matchAll(/<path[^>]*style="opacity:[^"]*"[^>]*>/g)].filter(
    (m) => !m[0].includes('fill:'),
  );
  const noFillOpacity2 = [...svg.matchAll(/<path[^>]*style="opacity:[^"]*"[^>]*>/g)].filter(
    (m) => !/fill[:#]/.test(m[0]),
  );
  console.log(f, 'opacity-only paths:', noFillOpacity.length);
}
