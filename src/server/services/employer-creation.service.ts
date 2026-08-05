import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { COUNTRY_NAMES } from '@/lib/countries';
import { pickCityForCountry } from '@/lib/developer-location';
import {
  COMPANY_SIZES,
  COMPANY_SUMMARY_TEMPLATES,
  CONTACT_ROLES,
  generateEmployerCompanyName,
  generateEmployerContactName,
  generateEmployerTestEmail,
} from '@/lib/employer-creation-data';

export const OWNER_EMPLOYER_DEFAULT_PASSWORD = 'Employer@123!';

export interface CreateEmployerManualInput {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  companyWebsite?: string;
  companySummary?: string;
  companySize?: string;
  companyLocation?: string;
  country?: string;
  companyLinkedin?: string;
  contactRole?: string;
  contactInfo?: string;
  isVerified?: boolean;
  profileStep?: number;
  isBot?: boolean;
}

export interface CreateEmployersBatchInput {
  count: number;
  password: string;
  countries?: string[];
  isVerified?: boolean;
}

export interface CreatedEmployerSummary {
  id: string;
  companyName: string;
  email: string;
  country: string;
  isVerified: boolean;
}

export interface CreateEmployersResult {
  created: number;
  employers: CreatedEmployerSummary[];
  errors: string[];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveCountry(pool: string[] | undefined, fallback: string[]): string {
  const source = pool?.length ? pool : fallback;
  return pick(source);
}

async function uniqueEmail(baseEmail: string, companyName: string): Promise<string> {
  let email = baseEmail.trim().toLowerCase();
  for (let attempt = 0; attempt < 8; attempt++) {
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!taken) return email;
    email = generateEmployerTestEmail(companyName);
  }
  throw new Error('Could not assign a unique email');
}

function buildEmployerProfile(params: {
  companyName: string;
  contactName: string;
  country: string;
  companyLocation?: string;
  isVerified: boolean;
  overrides?: Partial<CreateEmployerManualInput>;
}) {
  const location = params.companyLocation?.trim()
    || pickCityForCountry(params.country, params.companyName);

  return {
    companyName: params.companyName,
    contactName: params.contactName,
    country: params.country,
    companyLocation: location || null,
    companyWebsite: params.overrides?.companyWebsite?.trim() || `https://${params.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
    companySummary: params.overrides?.companySummary?.trim() || pick([...COMPANY_SUMMARY_TEMPLATES]),
    companySize: params.overrides?.companySize || pick([...COMPANY_SIZES]),
    companyLinkedin: params.overrides?.companyLinkedin?.trim() || null,
    contactRole: params.overrides?.contactRole?.trim() || pick([...CONTACT_ROLES]),
    contactInfo: params.overrides?.contactInfo?.trim() || `+1 ${100 + Math.floor(Math.random() * 899)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
    profileStep: params.overrides?.profileStep ?? 2,
    isVerified: params.isVerified,
    verifiedAt: params.isVerified ? new Date() : null,
    isBot: Boolean(params.overrides?.isBot),
  };
}

export async function createEmployerAccount(
  input: CreateEmployerManualInput,
): Promise<CreatedEmployerSummary> {
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() || OWNER_EMPLOYER_DEFAULT_PASSWORD;
  const companyName = input.companyName.trim();
  const contactName = input.contactName.trim();
  const country = input.country?.trim() || pick(COUNTRY_NAMES);

  if (!email) throw new Error('Email is required');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!companyName) throw new Error('Company name is required');
  if (!contactName) throw new Error('Contact name is required');

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new Error('Email is already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const isVerified = Boolean(input.isVerified);
  const profile = buildEmployerProfile({
    companyName,
    contactName,
    country,
    companyLocation: input.companyLocation,
    isVerified,
    overrides: input,
  });

  const created = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: 'EMPLOYER',
      status: 'ACTIVE',
      employer: { create: profile },
    },
    include: { employer: true },
  });

  const employer = created.employer;
  if (!employer) throw new Error('Employer record was not created');

  return {
    id: employer.id,
    companyName: employer.companyName ?? companyName,
    email: created.email,
    country: employer.country ?? country,
    isVerified: employer.isVerified,
  };
}

export async function createEmployerAccountsBatch(
  input: CreateEmployersBatchInput,
  countryFallback: string[],
): Promise<CreateEmployersResult> {
  const count = Math.min(Math.max(1, Math.floor(input.count)), 20);
  const password = input.password?.trim() || OWNER_EMPLOYER_DEFAULT_PASSWORD;
  const isVerified = Boolean(input.isVerified);

  const result: CreateEmployersResult = {
    created: 0,
    employers: [],
    errors: [],
  };

  for (let i = 0; i < count; i++) {
    try {
      const companyName = generateEmployerCompanyName();
      const contactName = generateEmployerContactName();
      const country = resolveCountry(input.countries, countryFallback);
      const email = await uniqueEmail(generateEmployerTestEmail(companyName), companyName);

      const summary = await createEmployerAccount({
        email,
        password,
        companyName,
        contactName,
        country,
        isVerified,
        profileStep: 2,
      });

      result.created += 1;
      result.employers.push(summary);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Employer ${i + 1}: ${msg}`);
    }
  }

  return result;
}
