import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'illustrations', 'domains');
mkdirSync(dir, { recursive: true });

const SKIN = '#fcd9b6';
const HAIR = '#334155';
const SHADOW = '<ellipse cx="400" cy="520" rx="220" ry="18" fill="#e2e8f0" opacity="0.65"/>';
const BLOBS = `
  <circle cx="110" cy="100" r="42" fill="#fef2f2"/>
  <circle cx="700" cy="120" r="52" fill="#f5f3ff"/>
`;

/** Standing person — cx/cy is torso anchor */
function person(cx, cy, { shirt = '#f43f5e', hair = HAIR, headR = 38 } = {}) {
  return `
  <circle cx="${cx}" cy="${cy - 50}" r="${headR}" fill="${SKIN}"/>
  <path d="M${cx - 44} ${cy - 78}c6-26 32-44 60-40s56 26 54 54c-2 26-26 44-52 42-26-2-48-18-62-56z" fill="${hair}"/>
  <path d="M${cx - 44} ${cy - 50}c-5 16-2 34 8 46s28 20 44 20 34-8 44-20 13-30 8-46" fill="${SKIN}"/>
  <path d="M${cx - 88} ${cy}c-10 44 4 90 34 120s74 46 118 46h6c44 0 88-16 118-46s44-76 34-120l-312 0z" fill="${shirt}"/>
  <circle cx="${cx - 12}" cy="${cy - 58}" r="4.5" fill="${hair}"/>
  <circle cx="${cx + 12}" cy="${cy - 58}" r="4.5" fill="${hair}"/>
  <path d="M${cx - 8} ${cy - 42}c5 5 15 5 20 0" stroke="${hair}" stroke-width="2.5" stroke-linecap="round"/>`;
}

/** Person seated at laptop */
function devAtLaptop(cx, cy, { shirt = '#f43f5e', screen = '#0f172a' } = {}) {
  return `
  ${person(cx, cy, { shirt, headR: 36 })}
  <rect x="${cx - 130}" y="${cy + 70}" width="260" height="14" rx="7" fill="#cbd5e1"/>
  <rect x="${cx - 110}" y="${cy - 10}" width="220" height="82" rx="8" fill="#64748b"/>
  <rect x="${cx - 98}" y="${cy + 2}" width="196" height="58" rx="4" fill="${screen}"/>
  <rect x="${cx - 86}" y="${cy + 16}" width="60" height="5" rx="2.5" fill="#f43f5e"/>
  <rect x="${cx - 86}" y="${cy + 28}" width="90" height="5" rx="2.5" fill="#38bdf8"/>
  <rect x="${cx - 86}" y="${cy + 40}" width="70" height="5" rx="2.5" fill="#a78bfa"/>`;
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">${SHADOW}${BLOBS}${body}</svg>`;
}

const svgs = {
  'ai-ml': wrap(`
    ${devAtLaptop(400, 250, { shirt: '#f43f5e' })}
    <circle cx="560" cy="180" r="50" fill="#fce7f3"/>
    <circle cx="560" cy="180" r="34" stroke="#e11d48" stroke-width="4"/>
    <circle cx="548" cy="172" r="6" fill="#e11d48"/><circle cx="572" cy="172" r="6" fill="#e11d48"/>
    <circle cx="548" cy="192" r="6" fill="#e11d48"/><circle cx="572" cy="192" r="6" fill="#e11d48"/>
    <circle cx="560" cy="180" r="6" fill="#e11d48"/>
    <path d="M548 172l12 8M572 172l-12 8M548 192l12-8M572 192l-12-8" stroke="#e11d48" stroke-width="2"/>
  `),

  'data-science': wrap(`
    ${person(320, 260, { shirt: '#3b82f6' })}
    <rect x="420" y="180" width="260" height="180" rx="14" fill="#fff" stroke="#bfdbfe" stroke-width="3"/>
    <rect x="450" y="300" width="32" height="40" rx="5" fill="#60a5fa"/>
    <rect x="495" y="270" width="32" height="70" rx="5" fill="#3b82f6"/>
    <rect x="540" y="240" width="32" height="100" rx="5" fill="#2563eb"/>
    <rect x="585" y="220" width="32" height="120" rx="5" fill="#1d4ed8"/>
    <path d="M450 230c50-40 90-20 120 10s80 20 110-10" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
  `),

  'web-dev': wrap(`
    ${devAtLaptop(400, 260, { shirt: '#10b981', screen: '#0f172a' })}
    <rect x="520" y="160" width="180" height="130" rx="10" fill="#fff" stroke="#a7f3d0" stroke-width="2"/>
    <rect x="520" y="160" width="180" height="28" rx="10" fill="#10b981"/>
    <circle cx="538" cy="174" r="5" fill="#fff" opacity="0.8"/>
    <circle cx="554" cy="174" r="5" fill="#fff" opacity="0.8"/>
  `),

  'mobile': wrap(`
    ${person(340, 260, { shirt: '#8b5cf6' })}
    <rect x="480" y="170" width="130" height="240" rx="22" fill="#1e1b4b"/>
    <rect x="494" y="195" width="102" height="190" rx="6" fill="#fff"/>
    <rect x="508" y="215" width="74" height="10" rx="5" fill="#8b5cf6"/>
    <rect x="508" y="238" width="74" height="50" rx="8" fill="#ede9fe"/>
    <rect x="508" y="300" width="74" height="8" rx="4" fill="#c4b5fd"/>
    <path d="M330 300c20-30 50-20 60 10" stroke="${SKIN}" stroke-width="18" stroke-linecap="round"/>
  `),

  'ar-vr': wrap(`
    ${person(380, 260, { shirt: '#0ea5e9', hair: '#1e293b' })}
    <path d="M340 220h160c18 0 32 14 32 32v28c0 18-14 32-32 32H340c-18 0-32-14-32-32v-28c0-18 14-32 32-32z" fill="#0284c7"/>
    <rect x="320" y="238" width="52" height="44" rx="16" fill="#0369a1"/>
    <rect x="468" y="238" width="52" height="44" rx="16" fill="#0369a1"/>
    <circle cx="400" cy="268" r="14" fill="#bae6fd"/>
    <circle cx="440" cy="268" r="14" fill="#bae6fd"/>
  `),

  'cloud-devops': wrap(`
    ${person(300, 270, { shirt: '#f97316' })}
    <path d="M520 220c0-38 30-68 68-68 32 0 60 22 68 52 22 4 38 24 38 48 0 28-22 50-50 50H470c-26 0-46-20-46-46 0-24 20-44 46-36z" fill="#fb923c"/>
    <rect x="460" y="290" width="200" height="100" rx="10" fill="#fff" stroke="#fdba74" stroke-width="2"/>
    <rect x="478" y="310" width="36" height="60" rx="5" fill="#f97316"/>
    <rect x="524" y="325" width="36" height="45" rx="5" fill="#fb923c"/>
    <rect x="570" y="318" width="36" height="52" rx="5" fill="#ea580c"/>
    <circle cx="496" cy="322" r="5" fill="#22c55e"/>
    <circle cx="542" cy="338" r="5" fill="#22c55e"/>
    <circle cx="588" cy="330" r="5" fill="#22c55e"/>
  `),

  'embedded-iot': wrap(`
    ${person(320, 270, { shirt: '#0f766e' })}
    <rect x="440" y="220" width="180" height="160" rx="12" fill="#134e4a"/>
    <rect x="458" y="238" width="144" height="124" rx="6" fill="#0f766e"/>
    <rect x="476" y="256" width="36" height="36" rx="4" fill="#5eead4"/>
    <rect x="524" y="256" width="36" height="36" rx="4" fill="#2dd4bf"/>
    <rect x="572" y="256" width="36" height="36" rx="4" fill="#14b8a6"/>
    <rect x="476" y="306" width="132" height="16" rx="3" fill="#99f6e4"/>
    <rect x="476" y="332" width="96" height="16" rx="3" fill="#5eead4"/>
  `),

  'cybersecurity': wrap(`
    ${person(360, 270, { shirt: '#ef4444' })}
    <path d="M540 190l70 26v78c0 54-35 84-70 96-35-12-70-42-70-96v-78l70-26z" fill="#dc2626"/>
    <path d="M540 224l44 16v48c0 34-22 52-44 60-22-8-44-26-44-60v-48l44-16z" fill="#fff"/>
    <rect x="524" y="290" width="32" height="40" rx="6" fill="#fca5a5"/>
    <circle cx="540" cy="306" r="8" fill="#fecaca" stroke="#b91c1c" stroke-width="2"/>
  `),

  'blockchain': wrap(`
    ${person(300, 270, { shirt: '#f59e0b' })}
    <rect x="430" y="250" width="56" height="56" rx="8" fill="#f59e0b"/>
    <rect x="500" y="220" width="56" height="56" rx="8" fill="#fbbf24"/>
    <rect x="570" y="250" width="56" height="56" rx="8" fill="#d97706"/>
    <path d="M486 278h14M556 248v14M556 278h14M486 278l28-28M486 278l28 28" stroke="#92400e" stroke-width="3"/>
    <circle cx="458" cy="278" r="6" fill="#fff"/>
    <circle cx="528" cy="248" r="6" fill="#fff"/>
    <circle cx="598" cy="278" r="6" fill="#fff"/>
  `),

  'game-dev': wrap(`
    ${person(340, 270, { shirt: '#22c55e' })}
    <rect x="470" y="280" width="220" height="110" rx="32" fill="#16a34a"/>
    <circle cx="530" cy="330" r="14" fill="#dcfce7"/>
    <circle cx="580" cy="330" r="14" fill="#dcfce7"/>
    <rect x="522" y="358" width="14" height="24" rx="7" fill="#dcfce7"/>
    <rect x="572" y="358" width="14" height="24" rx="7" fill="#dcfce7"/>
    <circle cx="630" cy="310" r="8" fill="#bbf7d0"/>
    <circle cx="655" cy="335" r="8" fill="#bbf7d0"/>
    <path d="M310 310c-10-20 10-50 40-40" stroke="${SKIN}" stroke-width="16" stroke-linecap="round"/>
  `),

  'ui-ux': wrap(`
    ${person(300, 270, { shirt: '#8b5cf6' })}
    <rect x="430" y="200" width="240" height="170" rx="12" fill="#fff" stroke="#ddd6fe" stroke-width="2"/>
    <rect x="450" y="220" width="90" height="60" rx="6" fill="#ede9fe"/>
    <rect x="556" y="220" width="90" height="28" rx="6" fill="#c4b5fd"/>
    <rect x="556" y="258" width="90" height="28" rx="6" fill="#a78bfa"/>
    <circle cx="480" cy="310" r="12" fill="#f43f5e"/>
    <circle cx="514" cy="310" r="12" fill="#38bdf8"/>
    <circle cx="548" cy="310" r="12" fill="#a78bfa"/>
    <path d="M290 300l20-30" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/>
  `),

  'api-integrations': wrap(`
    ${person(280, 270, { shirt: '#6366f1' })}
    <circle cx="480" cy="260" r="30" fill="#6366f1"/>
    <circle cx="560" cy="210" r="30" fill="#818cf8"/>
    <circle cx="640" cy="260" r="30" fill="#4f46e5"/>
    <circle cx="560" cy="330" r="30" fill="#a5b4fc"/>
    <path d="M508 252l36-24M536 238l16 16M588 234l16 26M616 260l-16 16M588 306l-16 26M536 302l-36 24" stroke="#4338ca" stroke-width="3"/>
    <path d="M310 240c40-10 60 20 50 50" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/>
  `),

  'ai-agents': wrap(`
    ${person(300, 270, { shirt: '#a855f7' })}
    <rect x="440" y="180" width="200" height="130" rx="16" fill="#fff" stroke="#e9d5ff" stroke-width="2"/>
    <rect x="460" y="205" width="80" height="8" rx="4" fill="#a855f7"/>
    <rect x="460" y="222" width="120" height="8" rx="4" fill="#c084fc"/>
    <rect x="460" y="239" width="60" height="8" rx="4" fill="#d8b4fe"/>
    <circle cx="580" cy="280" r="36" fill="#f0abfc"/>
    <circle cx="580" cy="272" r="24" fill="#fff"/>
    <circle cx="572" cy="268" r="4" fill="#7e22ce"/>
    <circle cx="588" cy="268" r="4" fill="#7e22ce"/>
    <path d="M574 282c4 4 10 4 14 0" stroke="#7e22ce" stroke-width="2" stroke-linecap="round"/>
    <path d="M560 250h8M592 250h8" stroke="#a855f7" stroke-width="3" stroke-linecap="round"/>
  `),
};

for (const [name, svg] of Object.entries(svgs)) {
  writeFileSync(join(dir, `${name}.svg`), svg.replace(/\n\s+/g, '\n').trim() + '\n', 'utf8');
  console.log('wrote', name);
}
