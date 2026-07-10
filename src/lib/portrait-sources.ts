/** Portrait image sources for bot developer generation — multiple public CDNs, not Unsplash-only. */

export type BotGender = 'Male' | 'Female';

type GenderPool = { male: string[]; female: string[] };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

/** RandomUser CDN portraits are ~128–256px — too small for profile photos. */
export function isLowResPortraitSource(url: string): boolean {
  return url.includes('randomuser.me/api/portraits');
}

/** RandomUser.me CDN — direct portrait paths (no API call). */
export function randomUserCdnPortrait(gender: BotGender, id?: number): string {
  const folder = gender === 'Female' ? 'women' : 'men';
  const portraitId = id ?? 1 + Math.floor(Math.random() * 99);
  return `https://randomuser.me/api/portraits/${folder}/${portraitId}.jpg`;
}

export function randomUserCdnPortraits(gender: BotGender, count = 3): string[] {
  const used = new Set<number>();
  const out: string[] = [];
  const folder = gender === 'Female' ? 'women' : 'men';
  while (out.length < count && used.size < 99) {
    const id = 1 + Math.floor(Math.random() * 99);
    if (used.has(id)) continue;
    used.add(id);
    out.push(`https://randomuser.me/api/portraits/${folder}/${id}.jpg`);
  }
  return out;
}

/** Tracks portrait URLs used within a single bot batch so images are not repeated. */
export class PortraitSession {
  private usedUrls = new Set<string>();
  private maleIdPool: number[];
  private femaleIdPool: number[];

  constructor() {
    this.maleIdPool = shuffle([...Array(99)].map((_, i) => i + 1));
    this.femaleIdPool = shuffle([...Array(99)].map((_, i) => i + 1));
  }

  isUsed(url: string): boolean {
    return this.usedUrls.has(url);
  }

  markUsed(url: string | undefined | null): void {
    if (url) this.usedUrls.add(url);
  }

  /** Next unused RandomUser CDN portrait for this gender, or null when exhausted. */
  claimRandomUserCdnPortrait(gender: BotGender): string | null {
    const pool = gender === 'Female' ? this.femaleIdPool : this.maleIdPool;
    const folder = gender === 'Female' ? 'women' : 'men';
    while (pool.length) {
      const id = pool.pop()!;
      const url = `https://randomuser.me/api/portraits/${folder}/${id}.jpg`;
      if (!this.isUsed(url)) return url;
    }
    return null;
  }

  /** All static pool URLs for a gender that have not been used in this batch. */
  unusedStaticUrls(gender: BotGender): string[] {
    const genderKey = gender === 'Female' ? 'female' : 'male';
    const all = [
      ...PEXELS_PORTRAITS[genderKey],
      ...PIXABAY_PORTRAITS[genderKey],
      ...UNSPLASH_PORTRAITS[genderKey],
      ...Object.values(REGION_PORTRAIT_POOLS).flatMap((r) => r[genderKey]),
    ];
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const url of all) {
      if (seen.has(url) || this.isUsed(url) || isLowResPortraitSource(url)) continue;
      seen.add(url);
      unique.push(url);
    }
    return shuffle(unique);
  }
}

/** Pexels query — full-color sRGB at 1600px instead of tiny/thumbnail variants */
const PEXELS_Q = 'auto=compress&cs=srgb&w=1600&h=2000&fit=crop';

/** Pexels — royalty-free portraits */
export const PEXELS_PORTRAITS: GenderPool = {
  male: [
    `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?${PEXELS_Q}`,
  ],
  female: [
    `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?${PEXELS_Q}`,
    `https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?${PEXELS_Q}`,
  ],
};

/** Pixabay CDN — royalty-free portraits */
export const PIXABAY_PORTRAITS: GenderPool = {
  male: [
    'https://cdn.pixabay.com/photo/2016/11/21/12/13/beard-1845166_1280.jpg',
    'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_1280.jpg',
    'https://cdn.pixabay.com/photo/2014/07/10/11/56/man-388104_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/03/27/19/54/man-1282224_1280.jpg',
    'https://cdn.pixabay.com/photo/2017/08/01/01/33/beanie-2562646_1280.jpg',
  ],
  female: [
    'https://cdn.pixabay.com/photo/2017/08/30/12/45/girl-2696947_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/11/29/09/38/adventure-1868612_1280.jpg',
    'https://cdn.pixabay.com/photo/2017/02/16/19/47/bokeh-2072271_1280.jpg',
    'https://cdn.pixabay.com/photo/2016/11/29/03/53/girl-1867092_1280.jpg',
    'https://cdn.pixabay.com/photo/2017/08/01/11/48/blue-eyes-2562565_1280.jpg',
  ],
};

const UNSPLASH_Q = 'auto=format&fit=crop&w=1600&h=2000&q=95&fm=jpg';

/** Unsplash — kept as one source among several */
export const UNSPLASH_PORTRAITS: GenderPool = {
  male: [
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1519345182560-3f2917c472ef?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?${UNSPLASH_Q}`,
  ],
  female: [
    `https://images.unsplash.com/photo-1580489944761-15a19d654956?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1494790108377-be9c29b29330?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1524504388940-b1c1722653e1?${UNSPLASH_Q}`,
    `https://images.unsplash.com/photo-1544005313-94ddf0286df2?${UNSPLASH_Q}`,
  ],
};

/** Regional pools — high-res Pexels, Pixabay, and Unsplash only (no low-res RandomUser CDN). */
export const REGION_PORTRAIT_POOLS: Record<string, GenderPool> = {
  east_asia: {
    male: [
      `https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2016/03/27/19/54/man-1282224_1280.jpg',
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/08/30/12/45/girl-2696947_1280.jpg',
      `https://images.unsplash.com/photo-1544005313-94ddf0286df2?${UNSPLASH_Q}`,
    ],
  },
  south_asia: {
    male: [
      `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2014/07/10/11/56/man-388104_1280.jpg',
      `https://images.unsplash.com/photo-1521572267360-ee0c2909d518?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/02/16/19/47/bokeh-2072271_1280.jpg',
      `https://images.unsplash.com/photo-1580489944761-15a19d654956?${UNSPLASH_Q}`,
    ],
  },
  africa: {
    male: [
      `https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_1280.jpg',
      `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2016/11/29/09/38/adventure-1868612_1280.jpg',
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?${UNSPLASH_Q}`,
    ],
  },
  latin_america: {
    male: [
      `https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2016/11/21/12/13/beard-1845166_1280.jpg',
      `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/08/30/12/45/girl-2696947_1280.jpg',
      `https://images.unsplash.com/photo-1524504388940-b1c1722653e1?${UNSPLASH_Q}`,
    ],
  },
  southeast_asia: {
    male: [
      `https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/08/01/01/33/beanie-2562646_1280.jpg',
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2016/11/29/03/53/girl-1867092_1280.jpg',
      `https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?${UNSPLASH_Q}`,
    ],
  },
  europe: {
    male: [
      `https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2016/03/27/19/54/man-1282224_1280.jpg',
      `https://images.unsplash.com/photo-1519345182560-3f2917c472ef?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/08/01/11/48/blue-eyes-2562565_1280.jpg',
      `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?${UNSPLASH_Q}`,
    ],
  },
  middle_east: {
    male: [
      `https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_1280.jpg',
      `https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/02/16/19/47/bokeh-2072271_1280.jpg',
      `https://images.unsplash.com/photo-1494790108377-be9c29b29330?${UNSPLASH_Q}`,
    ],
  },
  central_asia: {
    male: [
      `https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2016/11/21/12/13/beard-1845166_1280.jpg',
      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?${UNSPLASH_Q}`,
    ],
    female: [
      `https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?${PEXELS_Q}`,
      'https://cdn.pixabay.com/photo/2017/08/01/11/48/blue-eyes-2562565_1280.jpg',
      `https://images.unsplash.com/photo-1580489944761-15a19d654956?${UNSPLASH_Q}`,
    ],
  },
};

/** Combined fallback pool — high-res providers only */
export const PORTRAIT_URL_POOL: string[] = [
  ...PEXELS_PORTRAITS.male,
  ...PEXELS_PORTRAITS.female,
  ...PIXABAY_PORTRAITS.male,
  ...PIXABAY_PORTRAITS.female,
  ...UNSPLASH_PORTRAITS.male,
  ...UNSPLASH_PORTRAITS.female,
];

/** Build a shuffled list of portrait URLs — high-res sources first, low-res last resort. */
export function buildPortraitCandidates(
  country: string,
  gender: BotGender,
  countryPortraitRegion: Record<string, string>,
  preferredUrl?: string | null,
  session?: PortraitSession,
): string[] {
  const genderKey = gender === 'Female' ? 'female' : 'male';
  const region = countryPortraitRegion[country] ?? 'europe';
  const regional = REGION_PORTRAIT_POOLS[region]?.[genderKey] ?? [];
  const isExcluded = (url: string) => session?.isUsed(url) ?? false;
  const isHighRes = (url: string) => !isExcluded(url) && !isLowResPortraitSource(url);

  const highRes: string[] = [];
  const lowRes: string[] = [];

  if (preferredUrl && isHighRes(preferredUrl)) {
    highRes.push(preferredUrl);
  }

  if (session) {
    highRes.push(...session.unusedStaticUrls(gender));
  } else {
    highRes.push(
      ...pickN(PEXELS_PORTRAITS[genderKey], 4),
      ...pickN(PIXABAY_PORTRAITS[genderKey], 4),
      ...pickN(UNSPLASH_PORTRAITS[genderKey], 3),
      ...pickN(regional, 3),
      pick(PORTRAIT_URL_POOL),
    );
  }

  for (const url of shuffle(regional)) {
    if (isHighRes(url)) highRes.push(url);
  }

  // RandomUser CDN only as absolute last resort when all high-res sources fail
  if (session) {
    for (let i = 0; i < 4; i++) {
      const cdn = session.claimRandomUserCdnPortrait(gender);
      if (cdn && !isExcluded(cdn)) lowRes.push(cdn);
    }
  } else {
    lowRes.push(...randomUserCdnPortraits(gender, 3));
  }

  const dedupe = (urls: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const url of urls) {
      if (!url || seen.has(url) || isExcluded(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  };

  return [...shuffle(dedupe(highRes)), ...dedupe(lowRes)];
}

export function regionalPortraitUrl(
  country: string,
  gender: BotGender,
  countryPortraitRegion: Record<string, string>,
): string {
  const genderKey = gender === 'Female' ? 'female' : 'male';
  const region = countryPortraitRegion[country] ?? 'europe';
  const regional = REGION_PORTRAIT_POOLS[region]?.[genderKey];
  if (regional?.length) return pick(regional);
  return pick(PORTRAIT_URL_POOL);
}
