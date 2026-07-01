import { Client } from 'pg';

const client = new Client({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.rqgjibhxhyrnfrglbtjx',
  password: 'skwakftogjrjdto',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function run(sql, label) {
  try {
    await client.query(sql);
    console.log('OK  ', label);
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('SKIP', label, '(already exists)');
    } else {
      console.error('ERR ', label, '—', e.message);
    }
  }
}

await client.connect();
console.log('Connected to Supabase\n');

// ── Enums ──────────────────────────────────────────────────────────────────
const enums = [
  ["Role",              "DEVELOPER, EMPLOYER, ADMIN, OWNER"],
  ["UserStatus",        "ACTIVE, MUTED, BANNED"],
  ["JobStatus",         "PENDING, APPROVED, REJECTED, DISABLED"],
  ["LocationType",      "ONSITE, HYBRID, REMOTE"],
  ["SalaryType",        "HOURLY, MONTHLY, YEARLY"],
  ["ApplicationStatus", "PENDING, REVIEWING, SHORTLISTED, REJECTED, ACCEPTED"],
];
for (const [name, values] of enums) {
  await run(
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN CREATE TYPE "${name}" AS ENUM (${values.split(', ').map(v => `'${v}'`).join(',')}); END IF; END $$;`,
    `enum ${name}`
  );
}

// ── Tables ─────────────────────────────────────────────────────────────────
await run(`CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT,
  "role" "Role" NOT NULL, "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
)`, 'table users');

await run(`CREATE TABLE IF NOT EXISTS "developers" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "fullName" TEXT, "title" TEXT,
  "phone" TEXT, "location" TEXT, "linkedin" TEXT, "github" TEXT, "summary" TEXT,
  "skills" TEXT[], "workExperience" JSONB, "education" JSONB, "languages" TEXT[],
  "photoUrl" TEXT, "introVideoUrl" TEXT, "introVideoType" TEXT, "idCardUrl" TEXT,
  "profileStep" INTEGER NOT NULL DEFAULT 1, "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3), "githubId" TEXT, "githubUsername" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "developers_pkey" PRIMARY KEY ("id")
)`, 'table developers');

await run(`CREATE TABLE IF NOT EXISTS "employers" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "companyName" TEXT, "companyWebsite" TEXT,
  "companySummary" TEXT, "companySize" TEXT, "companyLocation" TEXT, "companyLinkedin" TEXT,
  "contactName" TEXT, "contactRole" TEXT, "contactInfo" TEXT, "companyLogoUrl" TEXT,
  "companyBrandUrl" TEXT, "companyAdImages" TEXT[], "contactPhotoUrl" TEXT,
  "introVideoUrl" TEXT, "introVideoType" TEXT, "idCardUrl" TEXT,
  "profileStep" INTEGER NOT NULL DEFAULT 1, "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
)`, 'table employers');

await run(`CREATE TABLE IF NOT EXISTS "admins" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "fullName" TEXT, "photoUrl" TEXT,
  "isOwner" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
)`, 'table admins');

await run(`CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "code" TEXT NOT NULL,
  "type" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "used" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
)`, 'table otp_codes');

await run(`CREATE TABLE IF NOT EXISTS "jobs" (
  "id" TEXT NOT NULL, "employerId" TEXT NOT NULL, "title" TEXT NOT NULL, "logoUrl" TEXT,
  "companyLocation" TEXT, "locationType" "LocationType" NOT NULL,
  "salaryMin" DOUBLE PRECISION, "salaryMax" DOUBLE PRECISION, "salaryType" "SalaryType",
  "currency" TEXT, "requiredSkills" TEXT[], "niceToHaveSkills" TEXT[], "languages" TEXT[],
  "industry" TEXT, "description" TEXT, "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "isPinned" BOOLEAN NOT NULL DEFAULT false, "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
)`, 'table jobs');

await run(`CREATE TABLE IF NOT EXISTS "applications" (
  "id" TEXT NOT NULL, "jobId" TEXT NOT NULL, "developerId" TEXT NOT NULL,
  "coverLetter" TEXT, "appliedData" JSONB NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
)`, 'table applications');

await run(`CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "employerId" TEXT NOT NULL,
  "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
)`, 'table conversations');

await run(`CREATE TABLE IF NOT EXISTS "messages" (
  "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "senderId" TEXT NOT NULL,
  "senderRole" "Role" NOT NULL, "content" TEXT NOT NULL, "attachments" TEXT[],
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
)`, 'table messages');

await run(`CREATE TABLE IF NOT EXISTS "favorite_jobs" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "jobId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "favorite_jobs_pkey" PRIMARY KEY ("id")
)`, 'table favorite_jobs');

// ── Indexes ────────────────────────────────────────────────────────────────
const indexes = [
  ['users_email_key',                   '"users"("email")'],
  ['developers_userId_key',             '"developers"("userId")'],
  ['developers_githubId_key',           '"developers"("githubId")'],
  ['employers_userId_key',              '"employers"("userId")'],
  ['admins_userId_key',                 '"admins"("userId")'],
  ['applications_jobId_developerId_key','"applications"("jobId", "developerId")'],
  ['conversations_applicationId_key',   '"conversations"("applicationId")'],
  ['favorite_jobs_userId_jobId_key',    '"favorite_jobs"("userId", "jobId")'],
];
for (const [name, cols] of indexes) {
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS "${name}" ON ${cols}`, `index ${name}`);
}

// ── Foreign keys ───────────────────────────────────────────────────────────
const fks = [
  ['developers', 'developers_userId_fkey', '"userId"', '"users"("id")', 'CASCADE', 'CASCADE'],
  ['employers',  'employers_userId_fkey',  '"userId"', '"users"("id")', 'CASCADE', 'CASCADE'],
  ['admins',     'admins_userId_fkey',     '"userId"', '"users"("id")', 'CASCADE', 'CASCADE'],
  ['otp_codes',  'otp_codes_userId_fkey',  '"userId"', '"users"("id")', 'CASCADE', 'CASCADE'],
  ['jobs',       'jobs_employerId_fkey',   '"employerId"', '"employers"("id")', 'CASCADE', 'CASCADE'],
  ['applications','applications_jobId_fkey','"jobId"', '"jobs"("id")', 'CASCADE', 'CASCADE'],
  ['applications','applications_developerId_fkey','"developerId"', '"developers"("id")', 'CASCADE', 'CASCADE'],
  ['conversations','conversations_applicationId_fkey','"applicationId"','"applications"("id")', 'CASCADE', 'CASCADE'],
  ['conversations','conversations_employerId_fkey','"employerId"','"employers"("id")', 'RESTRICT', 'CASCADE'],
  ['messages',   'messages_conversationId_fkey','"conversationId"','"conversations"("id")', 'CASCADE', 'CASCADE'],
  ['messages',   'messages_senderId_fkey','"senderId"','"developers"("id")', 'RESTRICT', 'CASCADE'],
  ['favorite_jobs','favorite_jobs_userId_fkey','"userId"','"users"("id")', 'CASCADE', 'CASCADE'],
  ['favorite_jobs','favorite_jobs_jobId_fkey','"jobId"','"jobs"("id")', 'CASCADE', 'CASCADE'],
];
for (const [tbl, name, col, ref, onDel, onUpd] of fks) {
  await run(
    `ALTER TABLE "${tbl}" DROP CONSTRAINT IF EXISTS "${name}"; ALTER TABLE "${tbl}" ADD CONSTRAINT "${name}" FOREIGN KEY (${col}) REFERENCES ${ref} ON DELETE ${onDel} ON UPDATE ${onUpd}`,
    `fk ${name}`
  );
}

await client.end();
console.log('\nDone!');
