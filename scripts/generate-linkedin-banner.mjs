/**
 * Felovy LinkedIn cover — 1128 × 191 px
 * White theme · pink-purple · minimal text · no logo.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const W = 1128;
const H = 191;
const RX = 820;

const OUTPUT = path.resolve('public/linkedin-banner.png');
const OUTPUT_ASSETS = path.resolve('assets/felovy-linkedin-banner-1128x191.png');

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildNodes() {
  const rand = seededRandom(31);
  const palette = ['#e11d48', '#f472b6', '#ec4899', '#d946ef', '#a855f7', '#c084fc'];
  const nodes = [];
  for (let i = 0; i < 34; i++) {
    const x = 40 + rand() * (RX - 100);
    const y = 18 + rand() * (H - 36);
    const r = 2 + rand() * 4.5;
    const c = palette[Math.floor(rand() * palette.length)];
    nodes.push({ x, y, r, c, o: 0.35 + rand() * 0.5 });
  }
  return nodes;
}

function buildConnections(nodes) {
  const rand = seededRandom(99);
  let svg = '';
  for (let i = 0; i < 28; i++) {
    const a = nodes[Math.floor(rand() * nodes.length)];
    const b = nodes[Math.floor(rand() * nodes.length)];
    if (!a || !b || a === b) continue;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d < 28 || d > 190) continue;
    svg += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#c084fc" stroke-width="0.8" stroke-opacity="0.22"/>`;
  }
  return svg;
}

function buildNodeDots(nodes) {
  return nodes
    .map(
      (n) =>
        `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(n.r * 2.4).toFixed(1)}" fill="${n.c}" fill-opacity="${(n.o * 0.15).toFixed(2)}"/>
  <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="${n.c}" fill-opacity="${n.o.toFixed(2)}"/>`,
    )
    .join('\n  ');
}

function buildSvg() {
  const nodes = buildNodes();

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#faf5ff"/>
    </linearGradient>
    <linearGradient id="flow1" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#fb7185" stop-opacity="0.75"/>
      <stop offset="50%" stop-color="#e879f9" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#c084fc" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="flow2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="word" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e11d48"/>
      <stop offset="45%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>
    <linearGradient id="accentBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
    <filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="b3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="0.6" fill="#e9d5ff" fill-opacity="0.55"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- pink-purple light pools -->
  <ellipse cx="170" cy="118" rx="200" ry="82" fill="#fda4af" fill-opacity="0.55" filter="url(#b1)"/>
  <ellipse cx="330" cy="42" rx="150" ry="62" fill="#f0abfc" fill-opacity="0.5" filter="url(#b2)"/>
  <ellipse cx="500" cy="148" rx="175" ry="55" fill="#d8b4fe" fill-opacity="0.42" filter="url(#b2)"/>
  <ellipse cx="410" cy="92" rx="110" ry="110" fill="#f9a8d4" fill-opacity="0.28" filter="url(#b1)"/>

  <!-- flowing ribbons -->
  <path d="M-20 138 C170 36, 350 172, 540 68 S810 18, 960 92" fill="none" stroke="url(#flow1)" stroke-width="34" stroke-linecap="round" opacity="0.62" filter="url(#b3)"/>
  <path d="M50 168 C230 88, 390 158, 570 108 S750 58, 920 126" fill="none" stroke="url(#flow2)" stroke-width="20" stroke-linecap="round" opacity="0.5" filter="url(#b3)"/>

  <!-- delicate contour lines -->
  <path d="M0 94 C130 38, 270 148, 410 78 S690 28, 880 94" fill="none" stroke="#f472b6" stroke-width="0.7" stroke-opacity="0.2"/>
  <path d="M0 118 C150 168, 310 48, 470 128 S710 168, 890 58" fill="none" stroke="#c084fc" stroke-width="0.6" stroke-opacity="0.16"/>

  ${buildConnections(nodes)}
  ${buildNodeDots(nodes)}

  <!-- soft right panel -->
  <rect x="660" y="0" width="468" height="${H}" fill="#ffffff" fill-opacity="0.55"/>

  <!-- minimal copy — right centered -->
  <text x="${RX}" y="88" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="36" font-weight="800" fill="url(#word)" letter-spacing="-0.5">Our Value Yields</text>
  <text x="${RX}" y="114" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="11" font-weight="600" fill="#9ca3af" letter-spacing="3.5">VERIFIED · REMOTE · GLOBAL</text>

  <!-- numeric badges -->
  <circle cx="${RX - 52}" cy="142" r="16" fill="#fff1f2" stroke="#fda4af" stroke-width="1.2"/>
  <text x="${RX - 52}" y="147" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="12" font-weight="800" fill="#e11d48">12</text>

  <circle cx="${RX}" cy="142" r="16" fill="#faf5ff" stroke="#d8b4fe" stroke-width="1.2"/>
  <text x="${RX}" y="147" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="11" font-weight="800" fill="#9333ea">400+</text>

  <circle cx="${RX + 52}" cy="142" r="16" fill="#fdf4ff" stroke="#f0abfc" stroke-width="1.2"/>
  <text x="${RX + 52}" y="147" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="10" font-weight="800" fill="#c026d3">50+</text>

  <rect x="0" y="${H - 3}" width="${W}" height="3" fill="url(#accentBar)"/>
</svg>`);
}

async function main() {
  const banner = await sharp(buildSvg()).png({ compressionLevel: 9 }).toBuffer();

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_ASSETS), { recursive: true });

  await sharp(banner).toFile(OUTPUT);
  await sharp(banner).toFile(OUTPUT_ASSETS);

  const meta = await sharp(banner).metadata();
  console.log(`LinkedIn banner saved (${meta.width}×${meta.height}px):`);
  console.log(`  ${OUTPUT}`);
  console.log(`  ${OUTPUT_ASSETS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
