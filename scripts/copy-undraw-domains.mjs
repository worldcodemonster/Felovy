import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const srcDir = process.env.UNDRAW_SRC ?? join(process.env.TEMP ?? '/tmp', 'undraw-fetch', 'svgs');
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'illustrations', 'domains');
mkdirSync(outDir, { recursive: true });

/** Fresh unDraw set — different scenes + baked accent colors */
const MAP = {
  'ai-ml': { file: 'robotics.svg', accent: '#7c3aed' },
  'data-science': { file: 'data-processing.svg', accent: '#0891b2' },
  'web-dev': { file: 'pair-programming.svg', accent: '#dc2626' },
  'mobile': { file: 'mobile-apps.svg', accent: '#059669' },
  'ar-vr': { file: 'virtual-reality.svg', accent: '#db2777' },
  'cloud-devops': { file: 'server-cluster.svg', accent: '#4f46e5' },
  'cybersecurity': { file: 'security-on.svg', accent: '#ca8a04' },
  'blockchain': { file: 'ethereum.svg', accent: '#0d9488' },
  'game-dev': { file: 'game-world.svg', accent: '#9333ea' },
  'ui-ux': { file: 'design-inspiration.svg', accent: '#ea580c' },
  'api-integrations': { file: 'synchronize.svg', accent: '#2563eb' },
  'ai-agents': { file: 'chat-bot.svg', accent: '#be185d' },
};

function tintSvg(raw, accent) {
  return raw
    .replace(/var\(--primary-svg-color\)/g, accent)
    .replace(/#6[Cc]63[Ff][Ff]/g, accent)
    .replace(/#6c63ff/g, accent);
}

for (const [id, { file, accent }] of Object.entries(MAP)) {
  const src = join(srcDir, file);
  const dest = join(outDir, `${id}.svg`);
  const raw = readFileSync(src, 'utf8');
  writeFileSync(dest, tintSvg(raw, accent), 'utf8');
  console.log('copied', id, '<-', file, accent);
}
