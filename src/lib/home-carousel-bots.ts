import type { BotDomainId } from '@/lib/developer-bot-data';

export type HomeCarouselBotSpec = {
  fullName: string;
  title: string;
  /** City stored in developer.location */
  city: string;
  /** Shown on homepage carousel and stored on profile */
  country: string;
  gender: 'Male' | 'Female';
  domainId: BotDomainId;
  photoFile: string;
};

/** Homepage carousel developers — single source for carousel UI and bot seeding. */
export const HOME_CAROUSEL_BOT_SPECS: HomeCarouselBotSpec[] = [
  { fullName: 'Leyla K.', title: 'UX Designer', city: 'Istanbul', country: 'Turkey', gender: 'Female', domainId: 'ui-ux', photoFile: 'luis-machado-IipMu8OvS6k-unsplash.jpg' },
  { fullName: 'Chris M.', title: 'Full Stack Dev', city: 'London', country: 'United Kingdom', gender: 'Male', domainId: 'web-dev', photoFile: 'the-connected-narrative-N8lRH2uxih4-unsplash.jpg' },
  { fullName: 'Arjun P.', title: 'Backend Engineer', city: 'Bangalore', country: 'India', gender: 'Male', domainId: 'web-dev', photoFile: 'abdullah-ali-W2ux-aiCKpU-unsplash.jpg' },
  { fullName: 'Emma R.', title: 'Frontend Lead', city: 'Stockholm', country: 'Sweden', gender: 'Female', domainId: 'web-dev', photoFile: 'vitaly-gariev-qp7A6YoVIyY-unsplash.jpg' },
  { fullName: 'Marco D.', title: 'Mobile Developer', city: 'Milan', country: 'Italy', gender: 'Male', domainId: 'mobile', photoFile: 'duman-photography-w3JKo9UgXFY-unsplash.jpg' },
  { fullName: 'Erik L.', title: 'DevOps Engineer', city: 'Amsterdam', country: 'Netherlands', gender: 'Male', domainId: 'cloud-devops', photoFile: 'vicky-hladynets-1z9o4HKlpjU-unsplash.jpg' },
  { fullName: 'Thomas B.', title: 'Cloud Architect', city: 'Dublin', country: 'Ireland', gender: 'Male', domainId: 'cloud-devops', photoFile: 'gelmis-bartulis-nEOqllSdezQ-unsplash.jpg' },
  { fullName: 'David H.', title: 'Engineering Lead', city: 'Austin, TX', country: 'USA', gender: 'Male', domainId: 'web-dev', photoFile: 'podmatch-UpiF461EAHU-unsplash.jpg' },
  { fullName: 'Lukas M.', title: 'AI Engineer', city: 'Berlin', country: 'Germany', gender: 'Male', domainId: 'ai-ml', photoFile: 'vicky-hladynets-kC0YCW1sL8Y-unsplash.jpg' },
  { fullName: 'Stefan K.', title: 'Backend Dev', city: 'Warsaw', country: 'Poland', gender: 'Male', domainId: 'web-dev', photoFile: 'oleg-shatilov-5lrYMZUeC7k-unsplash.jpg' },
  { fullName: 'Ahmed R.', title: 'Mobile Dev', city: 'Cairo', country: 'Egypt', gender: 'Male', domainId: 'mobile', photoFile: 'abdullah-ali-V4bv8rtprTE-unsplash.jpg' },
  { fullName: 'Liam O.', title: 'Frontend Lead', city: 'Cork', country: 'Ireland', gender: 'Male', domainId: 'web-dev', photoFile: 'janko-ferlic-GWFffQS5eWU-unsplash.jpg' },
  { fullName: 'Alessia R.', title: 'UX Designer', city: 'Rome', country: 'Italy', gender: 'Female', domainId: 'ui-ux', photoFile: 'alessia-marusova-rs0zS97YkHk-unsplash.jpg' },
  { fullName: 'Elena V.', title: 'Data Engineer', city: 'Kyiv', country: 'Ukraine', gender: 'Female', domainId: 'data-science', photoFile: 'dmitry-reshetnikov-ifMPtP0Kzss-unsplash.jpg' },
  { fullName: 'Ludovic M.', title: 'Full Stack Dev', city: 'Paris', country: 'France', gender: 'Male', domainId: 'web-dev', photoFile: 'ludovic-migneault-4uj3iZ5m084-unsplash.jpg' },
];

export function normalizeHomeCarouselCountry(country: string): string {
  if (country === 'USA') return 'United States';
  return country;
}
