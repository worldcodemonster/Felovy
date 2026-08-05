import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import {
  createEmployerAccount,
  OWNER_EMPLOYER_DEFAULT_PASSWORD,
} from './employer-creation.service';
import {
  generateEmployerCompanyName,
  generateEmployerContactName,
  generateEmployerTestEmail,
} from '@/lib/employer-creation-data';

export interface CreateBotEmployersInput {
  count: number;
  countries?: string[];
  verifiedStatuses?: boolean[];
  password?: string;
}

export interface CreateBotEmployersResult {
  created: number;
  employers: { id: string; companyName: string; email: string; country: string; isVerified: boolean }[];
  errors: string[];
}

export type EmployerBotStepId =
  | 'setup'
  | 'identity'
  | 'company_profile'
  | 'email'
  | 'database'
  | 'done';

export type EmployerBotProgressEvent =
  | { type: 'batch_start'; total: number }
  | { type: 'person_start'; index: number; total: number }
  | {
      type: 'step';
      index: number;
      step: EmployerBotStepId;
      label: string;
      detail?: string;
      status: 'running' | 'done' | 'skipped' | 'error';
    }
  | {
      type: 'person_complete';
      index: number;
      employer: CreateBotEmployersResult['employers'][number];
    }
  | { type: 'person_failed'; index: number; error: string }
  | { type: 'batch_complete'; created: number; errors: string[] };

export type EmployerBotProgressCallback = (event: EmployerBotProgressEvent) => void;

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

/** Set the shared password on every existing bot employer user account. */
export async function syncAllBotEmployerPasswords(
  password: string = OWNER_EMPLOYER_DEFAULT_PASSWORD,
): Promise<number> {
  const passwordHash = await bcrypt.hash(password, 10);
  const bots = await prisma.employer.findMany({
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

export async function createBotEmployers(
  input: CreateBotEmployersInput,
  countryFallback: string[],
  onEvent?: EmployerBotProgressCallback,
): Promise<CreateBotEmployersResult> {
  const count = Math.min(Math.max(1, Math.floor(input.count)), 50);
  const password = input.password?.trim() || OWNER_EMPLOYER_DEFAULT_PASSWORD;
  const verifiedPool = input.verifiedStatuses?.length ? input.verifiedStatuses : [true];

  const result: CreateBotEmployersResult = {
    created: 0,
    employers: [],
    errors: [],
  };

  onEvent?.({ type: 'batch_start', total: count });
  await syncAllBotEmployerPasswords(password);

  for (let i = 0; i < count; i++) {
    onEvent?.({ type: 'person_start', index: i, total: count });

    try {
      const country = resolveCountry(input.countries, countryFallback);
      const isVerified = verifiedPool[i % verifiedPool.length];

      onEvent?.({
        type: 'step',
        index: i,
        step: 'setup',
        label: 'Setup',
        detail: `${country} · ${isVerified ? 'Verified' : 'Unverified'}`,
        status: 'done',
      });

      const companyName = generateEmployerCompanyName();
      const contactName = generateEmployerContactName();

      onEvent?.({
        type: 'step',
        index: i,
        step: 'identity',
        label: 'Company identity',
        detail: `${companyName} — ${contactName}`,
        status: 'done',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'company_profile',
        label: 'Company profile',
        detail: 'Generating website, summary, size, and location…',
        status: 'running',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'email',
        label: 'Email address',
        detail: 'Assigning unique test email…',
        status: 'running',
      });

      const email = await uniqueEmail(generateEmployerTestEmail(companyName), companyName);

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
        detail: 'Creating user and employer profile…',
        status: 'running',
      });

      const summary = await createEmployerAccount({
        email,
        password,
        companyName,
        contactName,
        country,
        isVerified,
        profileStep: 2,
        isBot: true,
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'company_profile',
        label: 'Company profile',
        detail: 'Profile fields populated',
        status: 'done',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'database',
        label: 'Save to database',
        detail: 'Account created',
        status: 'done',
      });

      onEvent?.({
        type: 'step',
        index: i,
        step: 'done',
        label: 'Complete',
        status: 'done',
      });

      result.created += 1;
      result.employers.push(summary);
      onEvent?.({ type: 'person_complete', index: i, employer: summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Company ${i + 1}: ${msg}`);
      onEvent?.({ type: 'person_failed', index: i, error: msg });
    }
  }

  onEvent?.({ type: 'batch_complete', created: result.created, errors: result.errors });
  return result;
}
