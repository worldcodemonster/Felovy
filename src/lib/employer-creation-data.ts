import { COMPANIES, FIRST_NAMES, LAST_NAMES } from '@/lib/developer-bot-data';

export const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'] as const;

export const CONTACT_ROLES = [
  'HR Manager',
  'Talent Acquisition Lead',
  'Head of Engineering',
  'CTO',
  'Hiring Manager',
  'People Operations',
] as const;

export const COMPANY_SUMMARY_TEMPLATES = [
  'Global technology company hiring remote engineers for product, platform, and growth teams.',
  'Fast-growing startup building customer-facing software and scaling engineering across time zones.',
  'Enterprise software firm partnering with Felovy to source verified developers worldwide.',
  'Digital product studio looking for full-stack, mobile, and cloud talent on flexible engagements.',
] as const;

const EMPLOYER_TEST_DOMAINS = [
  'hireco.io',
  'talentdesk.co',
  'workglobal.net',
  'teamscale.io',
  'peopleops.test',
] as const;

function slugifyCompany(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18);
  return slug || 'company';
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Plausible company email for owner-created test employers. */
export function generateEmployerTestEmail(companyName: string): string {
  const slug = slugifyCompany(companyName);
  const prefix = pick(['hr', 'talent', 'hiring', 'people', 'recruiting'] as const);
  const digits = String(Math.floor(10 + Math.random() * 990));
  const domain = pick(EMPLOYER_TEST_DOMAINS);
  return `${prefix}.${slug}${digits}@${domain}`;
}

export function generateEmployerContactName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function generateEmployerCompanyName(): string {
  const base = pick(COMPANIES);
  const suffix = pick(['Labs', 'Global', 'Digital', 'Group', 'HQ'] as const);
  return `${base} ${suffix}`;
}
