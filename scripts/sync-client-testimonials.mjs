/** Regenerate src/lib/client-testimonials.ts from client-testimonial-data.mjs */
import { writeFile } from 'node:fs/promises';
import { CLIENT_TESTIMONIAL_SOURCES } from './client-testimonial-data.mjs';

function escapeTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const ts = `export interface ClientTestimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  location: string;
  photo: string;
  metric: string;
}

/** Generated from scripts/client-testimonial-data.mjs */
export const CLIENT_TESTIMONIALS: ClientTestimonial[] = [
${CLIENT_TESTIMONIAL_SOURCES.map(
  (t) => `  {
    id: '${t.id}',
    quote:
      '${escapeTs(t.quote)}',
    name: '${escapeTs(t.name)}',
    role: '${escapeTs(t.role)}',
    company: '${escapeTs(t.company)}',
    location: '${escapeTs(t.location)}',
    photo: '/clients/${t.id}.jpg',
    metric: '${escapeTs(t.metric)}',
  },`,
).join('\n')}
];
`;

await writeFile(new URL('../src/lib/client-testimonials.ts', import.meta.url), ts, 'utf8');
console.log(`Synced ${CLIENT_TESTIMONIAL_SOURCES.length} testimonials`);
