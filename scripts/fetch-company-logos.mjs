/**
 * Download company logo SVGs with brand colors into public/companies/
 * Run: npm run company-logos:fetch
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION = '11.14.0';
const ROOT = path.join(process.cwd(), 'public', 'companies');

/** [slug, display name] */
export const COMPANY_SLUGS = [
  ['google', 'Google'],
  ['microsoft', 'Microsoft'],
  ['amazon', 'Amazon'],
  ['apple', 'Apple'],
  ['meta', 'Meta'],
  ['intel', 'Intel'],
  ['ibm', 'IBM'],
  ['oracle', 'Oracle'],
  ['salesforce', 'Salesforce'],
  ['adobe', 'Adobe'],
  ['stripe', 'Stripe'],
  ['paypal', 'PayPal'],
  ['shopify', 'Shopify'],
  ['uber', 'Uber'],
  ['airbnb', 'Airbnb'],
  ['spotify', 'Spotify'],
  ['github', 'GitHub'],
  ['slack', 'Slack'],
  ['zoom', 'Zoom'],
  ['atlassian', 'Atlassian'],
  ['dropbox', 'Dropbox'],
  ['coinbase', 'Coinbase'],
  ['cisco', 'Cisco'],
  ['sap', 'SAP'],
  ['walmart', 'Walmart'],
  ['openai', 'OpenAI'],
  ['anthropic', 'Anthropic'],
  ['huggingface', 'Hugging Face'],
  ['deepmind', 'DeepMind'],
  ['perplexity', 'Perplexity'],
  ['replicate', 'Replicate'],
  ['langchain', 'LangChain'],
  ['weightsandbiases', 'Weights & Biases'],
  ['databricks', 'Databricks'],
  ['snowflake', 'Snowflake'],
  ['palantir', 'Palantir'],
  ['datadog', 'Datadog'],
  ['cloudflare', 'Cloudflare'],
  ['docker', 'Docker'],
  ['mongodb', 'MongoDB'],
  ['redis', 'Redis'],
  ['vercel', 'Vercel'],
  ['supabase', 'Supabase'],
  ['googlecloud', 'Google Cloud'],
  ['metaai', 'Meta AI'],
  // Software development & AI training (+20)
  ['jetbrains', 'JetBrains'],
  ['gitlab', 'GitLab'],
  ['figma', 'Figma'],
  ['twilio', 'Twilio'],
  ['hashicorp', 'HashiCorp'],
  ['elastic', 'Elastic'],
  ['digitalocean', 'DigitalOcean'],
  ['netlify', 'Netlify'],
  ['postman', 'Postman'],
  ['prisma', 'Prisma'],
  ['unity', 'Unity'],
  ['coursera', 'Coursera'],
  ['udemy', 'Udemy'],
  ['edx', 'edX'],
  ['datacamp', 'DataCamp'],
  ['codecademy', 'Codecademy'],
  ['freecodecamp', 'freeCodeCamp'],
  ['kaggle', 'Kaggle'],
  ['pluralsight', 'Pluralsight'],
  ['anaconda', 'Anaconda'],
  // Job boards & software outsourcing (+30)
  ['indeed', 'Indeed'],
  ['glassdoor', 'Glassdoor'],
  ['monster', 'Monster'],
  ['wellfound', 'Wellfound'],
  ['angellist', 'AngelList'],
  ['upwork', 'Upwork'],
  ['fiverr', 'Fiverr'],
  ['freelancer', 'Freelancer'],
  ['toptal', 'Toptal'],
  ['malt', 'Malt'],
  ['hackerrank', 'HackerRank'],
  ['leetcode', 'LeetCode'],
  ['codewars', 'Codewars'],
  ['andela', 'Andela'],
  ['arc', 'Arc.dev'],
  ['xing', 'Xing'],
  ['braintrust', 'Braintrust'],
  ['greenhouse', 'Greenhouse'],
  ['99designs', '99designs'],
  ['polywork', 'Polywork'],
  ['accenture', 'Accenture'],
  ['cognizant', 'Cognizant'],
  ['infosys', 'Infosys'],
  ['wipro', 'Wipro'],
  ['hcl', 'HCL'],
  ['tcs', 'Tata Consultancy Services'],
  ['persistent', 'Persistent'],
  ['fujitsu', 'Fujitsu'],
  ['zensar', 'Zensar'],
];

/** Slugs / titles missing from v11 metadata, or need visibility fix on white cards */
const HEX_OVERRIDES = {
  cocacola: 'F40009',
  mercedes: '242424',
  sony: '000000',
  huggingface: 'FFD21E',
  deepmind: '4285F4',
  langchain: '1C3C3C',
  replicate: '000000',
  metaai: '0081FB',
  unity: '000000',
  angellist: '000000',
  braintrust: '142042',
  arc: '5B6EE1',
};

const iconsRes = await fetch(
  `https://cdn.jsdelivr.net/npm/simple-icons@${VERSION}/_data/simple-icons.json`,
  { headers: { 'User-Agent': 'Felovy/1.0' } },
);
if (!iconsRes.ok) throw new Error(`Failed to load simple-icons metadata: ${iconsRes.status}`);
const { icons } = await iconsRes.json();
const hexByTitle = Object.fromEntries(icons.map((i) => [i.title, i.hex]));

function resolveHex(slug, name) {
  if (HEX_OVERRIDES[slug]) return HEX_OVERRIDES[slug];
  return hexByTitle[name] ?? null;
}

function applyBrandColor(svg, hex) {
  const color = `#${hex.replace(/^#/, '')}`;
  let out = svg.replace(/\sfill="[^"]*"/gi, '');
  out = out.replace(/<path /gi, `<path fill="${color}" `);
  return out.replace(/<svg /i, '<svg fill="none" ');
}

async function fetchSvg(slug) {
  const urls = [
    `https://cdn.jsdelivr.net/npm/simple-icons@${VERSION}/icons/${slug}.svg`,
    `https://cdn.jsdelivr.net/npm/simple-icons/icons/${slug}.svg`,
    `https://cdn.simpleicons.org/${slug}`,
  ];
  for (const url of urls) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Felovy/1.0' } });
    if (res.ok) return res.text();
  }
  throw new Error(`No SVG for slug: ${slug}`);
}

await mkdir(ROOT, { recursive: true });

for (const [slug, name] of COMPANY_SLUGS) {
  const hex = resolveHex(slug, name);
  if (!hex) throw new Error(`No brand color for ${slug} (${name})`);

  const raw = await fetchSvg(slug);
  const colored = raw.includes('fill="#') || raw.includes("fill='")
    ? raw
    : applyBrandColor(raw, hex);

  await writeFile(path.join(ROOT, `${slug}.svg`), colored, 'utf8');
  console.log(`${slug}.svg (#${hex})`);
}

console.log(`Done — ${COMPANY_SLUGS.length} colored logos in public/companies/`);
