import type { DeveloperProfile } from '@/components/home/DeveloperCommunitySection';

const GRADS = [
  'from-rose-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-yellow-600',
  'from-sky-500 to-blue-600',
  'from-pink-500 to-rose-600',
  'from-violet-500 to-purple-600',
  'from-teal-500 to-emerald-600',
  'from-indigo-500 to-violet-600',
  'from-orange-500 to-amber-600',
  'from-red-500 to-rose-600',
  'from-blue-500 to-cyan-600',
] as const;

/** Images in public/dev/ — profiles matched to each photo */
const DEV_PHOTOS = [
  'luis-machado-IipMu8OvS6k-unsplash.jpg',
  'the-connected-narrative-N8lRH2uxih4-unsplash.jpg',
  'abdullah-ali-W2ux-aiCKpU-unsplash.jpg',
  'vitaly-gariev-qp7A6YoVIyY-unsplash.jpg',
  'duman-photography-w3JKo9UgXFY-unsplash.jpg',
  'vicky-hladynets-1z9o4HKlpjU-unsplash.jpg',
  'gelmis-bartulis-nEOqllSdezQ-unsplash.jpg',
  'podmatch-UpiF461EAHU-unsplash.jpg',
  'vicky-hladynets-kC0YCW1sL8Y-unsplash.jpg',
  'oleg-shatilov-5lrYMZUeC7k-unsplash.jpg',
  'abdullah-ali-V4bv8rtprTE-unsplash.jpg',
  'janko-ferlic-GWFffQS5eWU-unsplash.jpg',
  'alessia-marusova-rs0zS97YkHk-unsplash.jpg',
  'dmitry-reshetnikov-ifMPtP0Kzss-unsplash.jpg',
  'ludovic-migneault-4uj3iZ5m084-unsplash.jpg',
] as const;

const PROFILES: Omit<DeveloperProfile, 'src' | 'grad'>[] = [
  { name: 'Leyla K.', role: 'UX Designer', country: 'Turkey' },
  { name: 'Chris M.', role: 'Full Stack Dev', country: 'United Kingdom' },
  { name: 'Arjun P.', role: 'Backend Engineer', country: 'India' },
  { name: 'Emma R.', role: 'Frontend Lead', country: 'Sweden' },
  { name: 'Marco D.', role: 'Mobile Developer', country: 'Italy' },
  { name: 'Erik L.', role: 'DevOps Engineer', country: 'Netherlands' },
  { name: 'Thomas B.', role: 'Cloud Architect', country: 'Ireland' },
  { name: 'David H.', role: 'Engineering Lead', country: 'USA' },
  { name: 'Lukas M.', role: 'AI Engineer', country: 'Germany' },
  { name: 'Stefan K.', role: 'Backend Dev', country: 'Poland' },
  { name: 'Ahmed R.', role: 'Mobile Dev', country: 'Egypt' },
  { name: 'Liam O.', role: 'Frontend Lead', country: 'Ireland' },
  { name: 'Alessia R.', role: 'UX Designer', country: 'Italy' },
  { name: 'Elena V.', role: 'Data Engineer', country: 'Ukraine' },
  { name: 'Ludovic M.', role: 'Full Stack Dev', country: 'France' },
];

export const DEVELOPER_CAROUSEL: DeveloperProfile[] = DEV_PHOTOS.map((file, i) => ({
  src: `/dev/${file}`,
  grad: GRADS[i % GRADS.length],
  ...PROFILES[i],
}));
