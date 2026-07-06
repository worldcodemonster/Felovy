import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'developers');

const PORTRAITS = [
  { file: 'carlos-r.jpg', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'mei-l.jpg', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'omar-h.jpg', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'ingrid-s.jpg', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'viktor-p.jpg', url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'amara-k.jpg', url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop' },
  { file: 'luca-b.jpg', url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop' },
  { file: 'chen-w.jpg', url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop' },
  { file: 'erik-j.jpg', url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop' },
  { file: 'zara-f.jpg', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'isabel-t.jpg', url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&h=800&q=80' },
  { file: 'raj-p.jpg', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&h=800&q=80' },
];

await mkdir(OUT_DIR, { recursive: true });

const failed = [];
for (const { file, url } of PORTRAITS) {
  const res = await fetch(url);
  if (!res.ok) {
    failed.push({ file, status: res.status });
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT_DIR, file), buf);
  console.log(`Saved ${file}`);
}

if (failed.length) {
  console.error('Failed:', failed);
  process.exit(1);
}
console.log(`Done — ${PORTRAITS.length} portraits in public/developers/`);
