import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { postProcessStorysetSvg } from './storyset-recolor.mjs';

const STYLE = 'rafiki';
const ROOT = path.join(process.cwd(), 'public', 'illustrations', 'storyset');

/** filename → Storyset slug(s), first match wins */
const MAP = {
  // Shared (Illustration component)
  'auth-developer': ['programming', 'web-developer', 'developer'],
  'auth-employer': ['hiring', 'team', 'business-deal'],
  'mail-sent': ['email-capture', 'mail'],
  'celebrate': ['celebration', 'winner', 'award'],
  'empty-jobs': ['job-search', 'job-hunt', 'no-data'],
  'empty-applications': ['resume', 'job-offers', 'no-data'],
  'empty-developers': ['team', 'programming', 'no-data'],
  'empty-messages': ['no-chat', 'messaging', 'group-chat'],
  'remote-work': ['work-from-home', 'remote', 'online'],
  'team-hiring': ['hiring', 'team-work'],

  // How it works
  'workflows/dev-01-verify-email': ['email-capture'],
  'workflows/dev-02-complete-profile': ['resume'],
  'workflows/dev-03-get-verified': ['certification'],
  'workflows/dev-04-apply-jobs': ['job-hunt'],
  'workflows/emp-01-company-email': ['business-deal'],
  'workflows/emp-02-company-profile': ['company'],
  'workflows/emp-03-post-job': ['job-offers'],
  'workflows/emp-04-review-applicants': ['hiring'],

  // Domain gallery
  'domains/ai-ml': ['artificial-intelligence', 'robot', 'ai'],
  'domains/data-science': ['data-analysis', 'data-report', 'analytics'],
  'domains/web-dev': ['web-development', 'website-builder', 'programming'],
  'domains/mobile': ['mobile-development', 'mobile-marketing', 'smartphone'],
  'domains/ar-vr': ['virtual-reality', 'augmented-reality'],
  'domains/cloud-devops': ['cloud-hosting', 'server', 'cloud-storage'],
  'domains/cybersecurity': ['cybersecurity', 'security'],
  'domains/blockchain': ['blockchain', 'bitcoin'],
  'domains/game-dev': ['gaming', 'game-development', 'video-game'],
  'domains/ui-ux': ['ui-design', 'design-tools', 'design'],
  'domains/api-integrations': ['software-integration', 'cloud-computing', 'workflow', 'data-transfer'],
  'domains/ai-agents': ['robotics', 'robot', 'artificial-intelligence'],
};

async function fetchSvgUrl(slug) {
  const page = `https://storyset.com/illustration/${slug}/${STYLE}`;
  const res = await fetch(page, { headers: { 'User-Agent': 'Felovy/1.0' } });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/https:\/\/stories\.freepiklabs\.com\/storage\/\d+\/[^"']+\.svg/);
  return match ? { page, url: match[0], slug } : null;
}

async function resolve(slugs) {
  for (const slug of slugs) {
    const hit = await fetchSvgUrl(slug);
    if (hit) return hit;
  }
  throw new Error(`No SVG for: ${slugs.join(', ')}`);
}

await mkdir(path.join(ROOT, 'workflows'), { recursive: true });
await mkdir(path.join(ROOT, 'domains'), { recursive: true });

const manifest = {};

for (const [fileKey, slugs] of Object.entries(MAP)) {
  const hit = await resolve(slugs);
  const res = await fetch(hit.url, { headers: { 'User-Agent': 'Felovy/1.0' } });
  if (!res.ok) throw new Error(`Download failed ${fileKey}: ${res.status}`);
  const svg = postProcessStorysetSvg(await res.text());
  const dest = path.join(ROOT, `${fileKey}.svg`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, svg, 'utf8');
  manifest[fileKey] = { slug: hit.slug, style: STYLE, source: hit.page, url: hit.url };
  console.log(`${fileKey} <- ${hit.slug}`);
}

await writeFile(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Done — ${Object.keys(manifest).length} Storyset SVGs in public/illustrations/storyset/`);
