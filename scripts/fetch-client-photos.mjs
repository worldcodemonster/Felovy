/**
 * Download formal professional client headshots into public/clients/
 * Curated Unsplash business portraits + RandomUser US/GB corporate-style portraits.
 * Run: npm run client-photos:fetch
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public', 'clients');

/** Unsplash IDs used by the developer carousel — never reuse */
const DEVELOPER_UNSplash_IDS = new Set([
  'photo-1573497019940-1c28c88b4f3e',
  'photo-1607990281513-2c110a25bd8c',
  'photo-1560250097-0b93528c311a',
  'photo-1573496359142-b8d87734a5a2',
  'photo-1568602471122-7832951cc4c5',
  'photo-1581091226825-a6a2a5aee158',
  'photo-1552058544-f2b08422138a',
  'photo-1570295999919-56ceb5ecca61',
  'photo-1543269865-cbf427effbad',
  'photo-1517841905240-472988babdf9',
  'photo-1500648767791-00dcc994a43e',
  'photo-1494790108377-be9c29b29330',
  'photo-1472099645785-5658abf4ff4e',
  'photo-1534528741775-53994a69daeb',
  'photo-1531746020798-e6953c6e8e04',
  'photo-1506794778202-cad84cf45f1d',
]);

/**
 * [slug, source]
 * source: unsplash photo id, or randomuser portrait path e.g. "men/75"
 */
const CLIENTS = [
  ['yuki-tanaka', 'men/75'],
  ['priya-kapoor', 'women/68'],
  ['sarah-williams', 'photo-1438761681033-6461ffad8d80'],
  ['marco-becker', 'photo-1519345182560-3f2917c472ef'],
  ['rachel-chen', 'photo-1607746882042-944635dfe10e'],
  ['tom-hughes', 'photo-1552374196-c4e7ffc6e126'],
  ['amina-hassan', 'photo-1524504388940-b1c1722653e1'],
  ['david-okonkwo', 'men/32'],
  ['elena-vasquez', 'photo-1487412720507-e7ab37603c6f'],
  ['james-whitfield', 'photo-1624561172888-ac93c696e10c'],
  ['fatima-al-razi', 'photo-1580489944761-15a19d654956'],
  ['henrik-lund', 'photo-1535713875002-d1d0cf377fde'],
  ['sofia-martinez', 'photo-1531427186611-ecfd6d936c79'],
  ['raj-mehta', 'men/82'],
  ['claire-dubois', 'photo-1554151228-14d9def656e4'],
  ['michael-obrien', 'photo-1571019613454-1cb2f99b2d8b'],
  ['hannah-fischer', 'photo-1582750433449-648ed127bb54'],
  ['kenji-watanabe', 'men/14'],
  ['lisa-nguyen', 'photo-1508214751196-bcfd4ca60f91'],
  ['omar-siddiqui', 'men/67'],
  ['isabelle-moreau', 'women/44'],
  ['chris-daniels', 'photo-1525134479668-1bee5c7c6845'],
];

async function fetchUnsplash(slug, photoId) {
  if (DEVELOPER_UNSplash_IDS.has(photoId)) {
    throw new Error(`${slug}: conflicts with developer carousel (${photoId})`);
  }
  const url = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&h=400&q=85&facepad=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchRandomUserPortrait(slug, portraitPath) {
  const url = `https://randomuser.me/api/portraits/${portraitPath}.jpg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

await mkdir(ROOT, { recursive: true });

const seenHashes = new Set();

for (const [slug, source] of CLIENTS) {
  const buf = source.includes('/')
    ? await fetchRandomUserPortrait(slug, source)
    : await fetchUnsplash(slug, source);

  const hash = createHash('md5').update(buf).digest('hex');
  if (seenHashes.has(hash)) throw new Error(`${slug}: duplicate image (${hash})`);
  seenHashes.add(hash);

  await writeFile(path.join(ROOT, `${slug}.jpg`), buf);
  console.log(`${slug}.jpg (${source})`);
}

console.log(`Done — ${CLIENTS.length} client photos in public/clients/`);
