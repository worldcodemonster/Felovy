import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../config/database';
import { uploadPortraitFromUrl } from './upload.service';
import { openRouterCompletion, parseJsonFromLlm } from './openrouter.service';
import {
  BOT_DOMAINS,
  BOT_DOMAIN_IDS,
  type BotDomain,
  type BotDomainId,
  COMPANIES,
  COUNTRY_NAME_POOLS,
  COUNTRY_NAT_MAP,
  FIRST_NAMES,
  LANGUAGE_POOL,
  LAST_NAMES,
  UNIVERSITIES,
  generateRealisticTestEmail,
} from '@/lib/developer-bot-data';
import { pickCityForCountry, needsLocationUpdate, resolveDeveloperLocation } from '@/lib/developer-location';
import { isLowResPortraitSource, PortraitSession } from '@/lib/portrait-sources';
import type { PortraitProviderId } from '@/lib/portrait-providers';
import { fetchPortraitCandidates } from './portrait-api.service';
import {
  HOME_CAROUSEL_BOT_SPECS,
  normalizeHomeCarouselCountry,
  type HomeCarouselBotSpec,
} from '@/lib/home-carousel-bots';
import { SITE_URL } from '@/lib/seo';

export type PhotoMode = 'none' | 'online';
export type BotGender = 'Male' | 'Female';

/** Shared login password for all bot-generated developer accounts. */
export const BOT_DEVELOPER_PASSWORD = '123456!';

/** Set the shared password on every existing bot developer user account. */
export async function syncAllBotDeveloperPasswords(): Promise<number> {
  const passwordHash = await bcrypt.hash(BOT_DEVELOPER_PASSWORD, 10);
  const bots = await prisma.developer.findMany({
    where: { isBot: true },
    select: { userId: true },
  });
  if (!bots.length) return 0;

  const { count } = await prisma.user.updateMany({
    where: { id: { in: bots.map((b) => b.userId) } },
    data: { password: passwordHash },
  });
  return count;
}

export interface CreateBotDevelopersInput {
  count: number;
  countries?: string[];
  domains?: BotDomainId[];
  photoMode?: PhotoMode;
  imageProviders?: PortraitProviderId[];
  verifiedStatuses?: boolean[];
}

export interface CreateBotDevelopersResult {
  created: number;
  developers: { id: string; fullName: string; email: string; country: string; isVerified: boolean }[];
  errors: string[];
}

export type BotStepId =
  | 'setup'
  | 'identity'
  | 'portrait'
  | 'skills'
  | 'ai_copy'
  | 'email'
  | 'database'
  | 'done';

export type BotProgressEvent =
  | { type: 'batch_start'; total: number }
  | { type: 'person_start'; index: number; total: number }
  | {
      type: 'step';
      index: number;
      step: BotStepId;
      label: string;
      detail?: string;
      status: 'running' | 'done' | 'skipped' | 'error';
    }
  | {
      type: 'person_complete';
      index: number;
      developer: CreateBotDevelopersResult['developers'][number];
    }
  | { type: 'person_failed'; index: number; error: string }
  | { type: 'batch_complete'; created: number; errors: string[] };

export type BotProgressCallback = (event: BotProgressEvent) => void;

interface PersonIdentity {
  fullName: string;
  gender: BotGender;
  portraitUrl?: string;
}

interface LlmProfileCopy {
  summary: string;
  workExperience: {
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function yearsAgo(n: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function randomGender(): BotGender {
  return Math.random() > 0.5 ? 'Male' : 'Female';
}

function genderToApi(g: BotGender): 'male' | 'female' {
  return g === 'Male' ? 'male' : 'female';
}

function genderLabelFromApi(g: string): BotGender {
  return g === 'female' ? 'Female' : 'Male';
}

function resolveCountry(pool: string[] | undefined, fallback: string[]): string {
  const source = pool?.length ? pool : fallback;
  return pick(source);
}

function resolveDomain(pool: BotDomainId[] | undefined): BotDomain {
  if (pool?.length) {
    const id = pick(pool);
    return BOT_DOMAINS.find((d) => d.id === id) ?? BOT_DOMAINS[0];
  }
  return pick(BOT_DOMAINS);
}

function buildLocation(country: string, stableKey?: string): string {
  const city = pickCityForCountry(country, stableKey);
  return city || country;
}

function buildSkills(domain: BotDomain): string[] {
  const extra = pickN(
    ['Git', 'Docker', 'Agile', 'REST APIs', 'Microservices', 'Redis', 'MongoDB', 'PostgreSQL', 'Linux', 'Jira'],
    2,
  );
  return pickN([...domain.skills, ...extra], 5 + Math.floor(Math.random() * 3));
}

function buildEducation() {
  return [
    {
      institution: pick(UNIVERSITIES),
      degree: pick(['B.S.', 'M.S.', 'B.Eng.']),
      field: pick(['Computer Science', 'Software Engineering', 'Information Technology', 'Data Science']),
      startDate: yearsAgo(8 + Math.floor(Math.random() * 4)),
      endDate: yearsAgo(4 + Math.floor(Math.random() * 2)),
      current: false,
    },
  ];
}

function buildLanguagesCefr(country: string): { name: string; level: import('@/types').CefrLevel }[] {
  const nativeMap: Record<string, string> = {
    France: 'French', Germany: 'German', Spain: 'Spanish', Mexico: 'Spanish',
    Argentina: 'Spanish', Colombia: 'Spanish', Chile: 'Spanish',
    Brazil: 'Portuguese', Japan: 'Japanese',
    'South Korea': 'Korean', China: 'Mandarin', India: 'Hindi',
    Uzbekistan: 'Uzbek', Kazakhstan: 'Kazakh',
    'United States': 'English', 'United Kingdom': 'English', Canada: 'English',
    Australia: 'English', Netherlands: 'Dutch', Turkey: 'Turkish',
    Poland: 'Polish', Israel: 'Hebrew', Sweden: 'Swedish',
  };

  const cefrPick = (): import('@/types').CefrLevel =>
    pick(['A2', 'B1', 'B2', 'C1', 'C2'] as import('@/types').CefrLevel[]);

  const out: { name: string; level: import('@/types').CefrLevel }[] = [];
  const nativeLang = nativeMap[country];

  if (nativeLang) {
    out.push({ name: nativeLang, level: 'Native' });
    if (nativeLang !== 'English') {
      out.push({ name: 'English', level: pick(['B2', 'C1', 'C2'] as import('@/types').CefrLevel[]) });
    }
  } else {
    out.push({ name: 'English', level: pick(['C1', 'C2'] as import('@/types').CefrLevel[]) });
  }

  const extra = pickN(LANGUAGE_POOL.filter((l) => !out.some((o) => o.name === l)), 1);
  extra.forEach((name) => out.push({ name, level: cefrPick() }));

  return out.slice(0, 3);
}

function randomBirthYear(totalCareerYears: number): number {
  const gradAge = 22 + Math.floor(Math.random() * 4);
  return new Date().getFullYear() - totalCareerYears - gradAge;
}

function namesFromCountryPool(country: string, gender: BotGender): PersonIdentity {
  const pool = COUNTRY_NAME_POOLS[country];
  if (!pool) {
    return {
      fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      gender,
    };
  }
  const first = pick(gender === 'Female' ? pool.first.female : pool.first.male);
  const last = pick(pool.last);
  return { fullName: `${first} ${last}`, gender };
}

async function attachPortrait(
  identity: PersonIdentity,
  country: string,
  photoMode: PhotoMode,
  session: PortraitSession,
  imageProviders: PortraitProviderId[] | undefined,
  preferredUrl?: string | null,
  onPortraitStep?: (detail: string) => void,
): Promise<PersonIdentity> {
  if (photoMode !== 'online') {
    delete identity.portraitUrl;
    return identity;
  }

  const highResPreferred =
    preferredUrl && !isLowResPortraitSource(preferredUrl) ? preferredUrl : null;

  if (highResPreferred && !session.isUsed(highResPreferred)) {
    onPortraitStep?.('Trying preferred high-res URL…');
    const uploaded = await uploadPortraitFromUrl(highResPreferred);
    if (uploaded !== highResPreferred) {
      session.markUsed(highResPreferred);
      identity.portraitUrl = uploaded;
      return identity;
    }
    session.markUsed(highResPreferred);
  }

  identity.portraitUrl = await uploadPortraitFromCandidates(
    country,
    identity.gender,
    session,
    imageProviders,
    null,
    onPortraitStep,
  );
  return identity;
}

async function fetchRandomUserIdentity(
  country: string,
  gender: BotGender,
): Promise<PersonIdentity | null> {
  const nat = COUNTRY_NAT_MAP[country];
  if (!nat) return null;

  try {
    const seed = randomUUID();
    const res = await fetch(
      `https://randomuser.me/api/?nat=${nat}&gender=${genderToApi(gender)}&inc=name,gender&seed=${seed}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: {
        name?: { first?: string; last?: string };
        gender?: string;
      }[];
    };

    const person = data.results?.[0];
    if (!person?.name?.first || !person?.name?.last) return null;

    return {
      fullName: `${person.name.first} ${person.name.last}`,
      gender: genderLabelFromApi(person.gender ?? genderToApi(gender)),
    };
  } catch {
    return null;
  }
}

/** Try portrait URLs from selected providers until one uploads successfully. */
async function uploadPortraitFromCandidates(
  country: string,
  gender: BotGender,
  session: PortraitSession,
  imageProviders: PortraitProviderId[] | undefined,
  preferredUrl?: string | null,
  onTrying?: (detail: string) => void,
): Promise<string | undefined> {
  const candidates = await fetchPortraitCandidates({
    providers: imageProviders,
    country,
    gender,
    session,
    preferredUrl,
  });

  for (const { url, provider, source } of candidates.slice(0, 24)) {
    if (session.isUsed(url)) continue;
    onTrying?.(`Trying ${provider} (${source})…`);
    const uploaded = await uploadPortraitFromUrl(url);
    if (uploaded !== url) {
      session.markUsed(url);
      onTrying?.(`Uploaded via ${provider} (${source})`);
      return uploaded;
    }
    session.markUsed(url);
  }
  return undefined;
}

async function resolveIdentity(
  country: string,
  photoMode: PhotoMode,
  session: PortraitSession,
  imageProviders: PortraitProviderId[] | undefined,
  onPortraitStep?: (detail: string) => void,
): Promise<PersonIdentity> {
  const gender = randomGender();

  const fromRandomUser = await fetchRandomUserIdentity(country, gender);
  if (fromRandomUser) {
    return attachPortrait(fromRandomUser, country, photoMode, session, imageProviders, null, onPortraitStep);
  }

  if (COUNTRY_NAME_POOLS[country]) {
    return attachPortrait(namesFromCountryPool(country, gender), country, photoMode, session, imageProviders, null, onPortraitStep);
  }

  const fallbackNat = pick(['us', 'gb', 'de', 'fr', 'in', 'au', 'br', 'mx']);
  try {
    const seed = randomUUID();
    const res = await fetch(
      `https://randomuser.me/api/?nat=${fallbackNat}&gender=${genderToApi(gender)}&inc=name,gender&seed=${seed}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        results?: { name?: { first?: string; last?: string }; gender?: string }[];
      };
      const person = data.results?.[0];
      if (person?.name?.first && person?.name?.last) {
        return attachPortrait(
          {
            fullName: `${person.name.first} ${person.name.last}`,
            gender: genderLabelFromApi(person.gender ?? genderToApi(gender)),
          },
          country,
          photoMode,
          session,
          imageProviders,
          null,
          onPortraitStep,
        );
      }
    }
  } catch {
    /* continue */
  }

  return attachPortrait(
    { fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, gender },
    country,
    photoMode,
    session,
    imageProviders,
    null,
    onPortraitStep,
  );
}

function fallbackWorkExperience(domain: BotDomain, count: number) {
  const used = new Set<string>();
  const entries = [];
  for (let i = 0; i < count; i++) {
    let company = pick(COMPANIES);
    while (used.has(company) && used.size < COMPANIES.length) company = pick(COMPANIES);
    used.add(company);
    const startYears = 2 + i * 3 + Math.floor(Math.random() * 2);
    entries.push({
      company,
      role: pick(domain.titles),
      startDate: yearsAgo(startYears),
      endDate: i === 0 ? undefined : yearsAgo(startYears - 2),
      current: i === 0,
      description: `Led ${domain.title.toLowerCase()} initiatives — architecture, delivery, and mentoring engineers across distributed teams.`,
    });
  }
  return entries;
}

async function generateLlmProfileCopy(params: {
  fullName: string;
  gender: BotGender;
  country: string;
  location: string;
  title: string;
  domain: BotDomain;
  skills: string[];
  birthYear: number;
  experienceCount: number;
}): Promise<LlmProfileCopy> {
  const companies = pickN(COMPANIES, 5);
  const systemPrompt = `You write fictional developer profile content for Felovy, a software outsourcing platform.
The developer is a TEST BOT — entirely fictional. Do not reference LinkedIn, GitHub, or social profiles.
Write in natural, professional English. Use realistic but fictional tech companies.
Return ONLY valid JSON with this exact shape (no markdown fences):
{"summary":"3-4 sentence professional overview tailored to their domain and seniority","workExperience":[{"company":"string","role":"string","startDate":"YYYY-MM","endDate":"YYYY-MM or omit if current","current":true|false,"description":"2-3 vivid sentences about impact and technologies"}]}
Generate exactly ${params.experienceCount} work experience entries in reverse chronological order. Only the most recent may have current:true. Dates must be plausible for someone born ${params.birthYear}.`;

  const userPrompt = JSON.stringify({
    fullName: params.fullName,
    gender: params.gender,
    country: params.country,
    location: params.location,
    birthYear: params.birthYear,
    jobTitle: params.title,
    domain: params.domain.title,
    skills: params.skills,
    experienceEntriesRequired: params.experienceCount,
    suggestedCompanies: companies,
  });

  const raw = await openRouterCompletion(systemPrompt, userPrompt, {
    maxTokens: 1200,
    temperature: 0.85,
    title: 'Felovy Bot Generator',
  });

  const parsed = parseJsonFromLlm<LlmProfileCopy>(raw);
  if (!parsed.summary?.trim() || !Array.isArray(parsed.workExperience) || !parsed.workExperience.length) {
    throw new Error('Invalid LLM profile structure');
  }

  return {
    summary: parsed.summary.trim().slice(0, 1600),
    workExperience: parsed.workExperience.slice(0, params.experienceCount).map((w) => ({
      company: String(w.company).slice(0, 120),
      role: String(w.role).slice(0, 120),
      startDate: String(w.startDate).slice(0, 7),
      endDate: w.endDate ? String(w.endDate).slice(0, 7) : undefined,
      current: Boolean(w.current),
      description: String(w.description).slice(0, 800),
    })),
  };
}

async function buildProfile(
  country: string,
  domain: BotDomain,
  isVerified: boolean,
  photoMode: PhotoMode,
  session: PortraitSession,
  imageProviders: PortraitProviderId[] | undefined,
  index: number,
  onEvent?: BotProgressCallback,
) {
  const emit = (event: BotProgressEvent) => onEvent?.(event);
  let portraitDetail = 'Fetching from selected image providers…';

  emit({
    type: 'step',
    index,
    step: 'setup',
    label: 'Configuration',
    detail: `${country} · ${domain.title} · ${isVerified ? 'Verified' : 'Unverified'}`,
    status: 'done',
  });

  if (photoMode === 'online') {
    emit({
      type: 'step',
      index,
      step: 'portrait',
      label: 'Portrait photo',
      detail: portraitDetail,
      status: 'running',
    });
  }

  emit({
    type: 'step',
    index,
    step: 'identity',
    label: 'Identity',
    detail: 'Fetching name and gender from RandomUser…',
    status: 'running',
  });

  const identity = await resolveIdentity(
    country,
    photoMode,
    session,
    imageProviders,
    (detail) => {
      portraitDetail = detail;
      if (photoMode === 'online') {
        emit({
          type: 'step',
          index,
          step: 'portrait',
          label: 'Portrait photo',
          detail,
          status: 'running',
        });
      }
    },
  );

  emit({
    type: 'step',
    index,
    step: 'identity',
    label: 'Identity',
    detail: `${identity.fullName} · ${identity.gender}`,
    status: 'done',
  });

  if (photoMode === 'online') {
    emit({
      type: 'step',
      index,
      step: 'portrait',
      label: 'Portrait photo',
      detail: identity.portraitUrl ? portraitDetail || 'Portrait uploaded' : 'No portrait from selected providers',
      status: identity.portraitUrl ? 'done' : 'error',
    });
  } else {
    emit({
      type: 'step',
      index,
      step: 'portrait',
      label: 'Portrait photo',
      detail: 'Skipped (no photo mode)',
      status: 'skipped',
    });
  }

  const location = buildLocation(country, identity.fullName);
  const title = pick(domain.titles);
  const skills = buildSkills(domain);
  const experienceCount = 1 + Math.floor(Math.random() * 4);
  const birthYear = randomBirthYear(experienceCount * 2 + 2 + Math.floor(Math.random() * 4));
  const languages = buildLanguagesCefr(country);

  emit({
    type: 'step',
    index,
    step: 'skills',
    label: 'Skills & profile',
    detail: `${title} · ${skills.slice(0, 3).join(', ')}${skills.length > 3 ? '…' : ''}`,
    status: 'done',
  });

  let summary: string;
  let workExperience: LlmProfileCopy['workExperience'];

  emit({
    type: 'step',
    index,
    step: 'ai_copy',
    label: 'AI content',
    detail: `Generating summary and ${experienceCount} work experience entries…`,
    status: 'running',
  });

  try {
    const llm = await generateLlmProfileCopy({
      fullName: identity.fullName,
      gender: identity.gender,
      country,
      location,
      title,
      domain,
      skills,
      birthYear,
      experienceCount,
    });
    summary = llm.summary;
    workExperience = llm.workExperience;
    emit({
      type: 'step',
      index,
      step: 'ai_copy',
      label: 'AI content',
      detail: `Summary and ${workExperience.length} roles generated`,
      status: 'done',
    });
  } catch (err) {
    console.warn('[Bot] LLM copy failed, using fallback:', err instanceof Error ? err.message : err);
    summary = pick(domain.summaryTemplates);
    workExperience = fallbackWorkExperience(domain, experienceCount);
    emit({
      type: 'step',
      index,
      step: 'ai_copy',
      label: 'AI content',
      detail: 'LLM unavailable — using template fallback',
      status: 'done',
    });
  }

  return {
    fullName: identity.fullName,
    title,
    phone: `+${100 + Math.floor(Math.random() * 899)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
    location,
    country,
    gender: identity.gender,
    birthYear,
    linkedin: null,
    github: null,
    summary,
    skills,
    workExperience,
    education: buildEducation(),
    languages,
    photoUrl: identity.portraitUrl ?? null,
    profileStep: 4,
    isVerified,
    verifiedAt: isVerified ? new Date() : null,
    isBot: true,
  };
}

export async function createBotDevelopers(
  input: CreateBotDevelopersInput,
  countryFallback: string[],
  onEvent?: BotProgressCallback,
): Promise<CreateBotDevelopersResult> {
  const count = Math.min(Math.max(1, Math.floor(input.count)), 50);
  const photoMode: PhotoMode = input.photoMode ?? 'none';
  const verifiedPool = input.verifiedStatuses?.length ? input.verifiedStatuses : [false];
  const session = new PortraitSession();

  const result: CreateBotDevelopersResult = {
    created: 0,
    developers: [],
    errors: [],
  };

  onEvent?.({ type: 'batch_start', total: count });

  await syncAllBotDeveloperPasswords();

  const passwordHash = await bcrypt.hash(BOT_DEVELOPER_PASSWORD, 10);

  for (let i = 0; i < count; i++) {
    onEvent?.({ type: 'person_start', index: i, total: count });

    try {
      const country = resolveCountry(input.countries, countryFallback);
      const domain = resolveDomain(input.domains);
      const isVerified = verifiedPool[i % verifiedPool.length];

      const profile = await buildProfile(
        country,
        domain,
        isVerified,
        photoMode,
        session,
        input.imageProviders,
        i,
        onEvent,
      );

      onEvent?.({
        type: 'step',
        index: i,
        step: 'email',
        label: 'Email address',
        detail: 'Assigning unique test email…',
        status: 'running',
      });

      let email = generateRealisticTestEmail(profile.fullName);
      for (let attempt = 0; attempt < 6; attempt++) {
        const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!taken) break;
        email = generateRealisticTestEmail(profile.fullName);
      }

      onEvent?.({
        type: 'step',
        index: i,
        step: 'email',
        label: 'Email address',
        detail: email,
        status: 'done',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'database',
        label: 'Save to database',
        detail: 'Creating user and developer profile…',
        status: 'running',
      });

      const created = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'DEVELOPER',
          status: 'ACTIVE',
          developer: { create: profile },
        },
        include: {
          developer: true,
        },
      });

      const developer = created.developer;
      if (!developer) throw new Error('Developer record was not created');

      result.created += 1;
      const summary = {
        id: developer.id,
        fullName: developer.fullName ?? 'Bot Developer',
        email: created.email,
        country: developer.country ?? country,
        isVerified: developer.isVerified,
      };
      result.developers.push(summary);

      onEvent?.({
        type: 'step',
        index: i,
        step: 'database',
        label: 'Save to database',
        detail: `Saved as ${developer.id.slice(0, 8)}…`,
        status: 'done',
      });
      onEvent?.({
        type: 'step',
        index: i,
        step: 'done',
        label: 'Complete',
        detail: `${summary.fullName} ready`,
        status: 'done',
      });
      onEvent?.({ type: 'person_complete', index: i, developer: summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Developer ${i + 1}: ${msg}`);
      onEvent?.({ type: 'person_failed', index: i, error: msg });
    }
  }

  onEvent?.({ type: 'batch_complete', created: result.created, errors: result.errors });
  return result;
}

async function buildHomeCarouselProfile(spec: HomeCarouselBotSpec) {
  const country = normalizeHomeCarouselCountry(spec.country);
  const domain = BOT_DOMAINS.find((d) => d.id === spec.domainId) ?? BOT_DOMAINS[0];
  const location = spec.city;
  const skills = buildSkills(domain);
  const experienceCount = 2 + Math.floor(Math.random() * 2);
  const birthYear = randomBirthYear(experienceCount * 2 + 4);
  const languages = buildLanguagesCefr(country);

  const photoSource = `${SITE_URL}/dev/${spec.photoFile}`;
  const photoUrl = await uploadPortraitFromUrl(photoSource);

  let summary: string;
  let workExperience: LlmProfileCopy['workExperience'];
  try {
    const llm = await generateLlmProfileCopy({
      fullName: spec.fullName,
      gender: spec.gender,
      country,
      location,
      title: spec.title,
      domain,
      skills,
      birthYear,
      experienceCount,
    });
    summary = llm.summary;
    workExperience = llm.workExperience;
  } catch (err) {
    console.warn('[Bot] Homepage profile LLM failed, using fallback:', err instanceof Error ? err.message : err);
    summary = pick(domain.summaryTemplates);
    workExperience = fallbackWorkExperience(domain, experienceCount);
  }

  return {
    fullName: spec.fullName,
    title: spec.title,
    phone: `+${100 + Math.floor(Math.random() * 899)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
    location,
    country,
    gender: spec.gender,
    birthYear,
    linkedin: null,
    github: null,
    summary,
    skills,
    workExperience,
    education: buildEducation(),
    languages,
    photoUrl,
    profileStep: 4,
    isVerified: true,
    verifiedAt: new Date(),
    isBot: true,
  };
}

/** Create the 15 homepage carousel developers as verified bot profiles. */
export async function createHomeCarouselBotDevelopers(
  onEvent?: BotProgressCallback,
): Promise<CreateBotDevelopersResult> {
  const specs = HOME_CAROUSEL_BOT_SPECS;
  const result: CreateBotDevelopersResult = {
    created: 0,
    developers: [],
    errors: [],
  };

  onEvent?.({ type: 'batch_start', total: specs.length });
  await syncAllBotDeveloperPasswords();
  const passwordHash = await bcrypt.hash(BOT_DEVELOPER_PASSWORD, 10);

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const country = normalizeHomeCarouselCountry(spec.country);

    onEvent?.({ type: 'person_start', index: i, total: specs.length });

    try {
      const existing = await prisma.developer.findFirst({
        where: { isBot: true, fullName: spec.fullName, country },
        include: { user: { select: { email: true } } },
      });

      if (existing) {
        const resolved = resolveDeveloperLocation({
          id: existing.id,
          fullName: existing.fullName,
          location: existing.location,
          country: existing.country,
        });
        if (
          resolved
          && (existing.location !== resolved.location || existing.country !== resolved.country)
        ) {
          await prisma.developer.update({
            where: { id: existing.id },
            data: { location: resolved.location, country: resolved.country },
          });
        }

        const summary = {
          id: existing.id,
          fullName: existing.fullName ?? spec.fullName,
          email: existing.user.email,
          country: existing.country ?? country,
          isVerified: existing.isVerified,
        };
        result.developers.push(summary);
        onEvent?.({
          type: 'step',
          index: i,
          step: 'done',
          label: 'Complete',
          detail: `${spec.fullName} already exists — skipped`,
          status: 'skipped',
        });
        onEvent?.({ type: 'person_complete', index: i, developer: summary });
        continue;
      }

      onEvent?.({
        type: 'step',
        index: i,
        step: 'setup',
        label: 'Configuration',
        detail: `${spec.fullName} · ${spec.title} · ${country}`,
        status: 'done',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'portrait',
        label: 'Portrait photo',
        detail: `Uploading homepage photo…`,
        status: 'running',
      });

      const profile = await buildHomeCarouselProfile(spec);

      onEvent?.({
        type: 'step',
        index: i,
        step: 'portrait',
        label: 'Portrait photo',
        detail: profile.photoUrl ? 'Homepage photo ready' : 'Photo missing',
        status: profile.photoUrl ? 'done' : 'error',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'ai_copy',
        label: 'AI content',
        detail: 'Profile summary and experience ready',
        status: 'done',
      });

      let email = generateRealisticTestEmail(spec.fullName);
      for (let attempt = 0; attempt < 6; attempt++) {
        const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!taken) break;
        email = generateRealisticTestEmail(spec.fullName);
      }

      onEvent?.({
        type: 'step',
        index: i,
        step: 'email',
        label: 'Email address',
        detail: email,
        status: 'done',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'database',
        label: 'Save to database',
        detail: 'Creating user and developer profile…',
        status: 'running',
      });

      const created = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'DEVELOPER',
          status: 'ACTIVE',
          developer: { create: profile },
        },
        include: { developer: true },
      });

      const developer = created.developer;
      if (!developer) throw new Error('Developer record was not created');

      result.created += 1;
      const summary = {
        id: developer.id,
        fullName: developer.fullName ?? spec.fullName,
        email: created.email,
        country: developer.country ?? country,
        isVerified: developer.isVerified,
      };
      result.developers.push(summary);

      onEvent?.({
        type: 'step',
        index: i,
        step: 'database',
        label: 'Save to database',
        detail: `Saved as ${developer.id.slice(0, 8)}…`,
        status: 'done',
      });
      onEvent?.({
        type: 'step',
        index: i,
        step: 'done',
        label: 'Complete',
        detail: `${summary.fullName} ready`,
        status: 'done',
      });
      onEvent?.({ type: 'person_complete', index: i, developer: summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`${spec.fullName}: ${msg}`);
      onEvent?.({ type: 'person_failed', index: i, error: msg });
    }
  }

  onEvent?.({ type: 'batch_complete', created: result.created, errors: result.errors });
  return result;
}

/** Backfill city + country on every developer profile that is missing or inconsistent. */
export async function syncAllDeveloperLocations(): Promise<number> {
  const developers = await prisma.developer.findMany({
    select: { id: true, fullName: true, location: true, country: true },
  });

  let updated = 0;
  for (const dev of developers) {
    const resolved = resolveDeveloperLocation({
      id: dev.id,
      fullName: dev.fullName,
      location: dev.location,
      country: dev.country,
    });
    if (!resolved) continue;

    const shouldUpdate =
      needsLocationUpdate(dev.location, dev.country)
      || dev.location !== resolved.location
      || dev.country !== resolved.country;

    if (shouldUpdate) {
      await prisma.developer.update({
        where: { id: dev.id },
        data: {
          location: resolved.location,
          country: resolved.country,
        },
      });
      updated += 1;
    }
  }
  return updated;
}

export { BOT_DOMAIN_IDS };
