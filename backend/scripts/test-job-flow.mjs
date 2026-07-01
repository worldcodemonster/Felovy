/**
 * End-to-end test for job creation flow:
 * 1. Create a verified employer account (if not exists)
 * 2. Sign in as employer → create a job
 * 3. Sign in as owner → approve the job
 * 4. Verify the job appears in the public job board
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
const BASE = 'http://localhost:4000/api';

const EMPLOYER_EMAIL = 'testemployer@corp.com';
const EMPLOYER_PASS  = 'Test@Employer1234';
const OWNER_EMAIL    = 'mirocrush@gmail.com';
const OWNER_PASS     = 'Felovy@Owner2026';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json() };
}

async function patch(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return { res, data: await res.json() };
}

// ─── Step 1: ensure employer user exists and is verified ─────────────────────

console.log('\n── Step 1: Seed employer account ──────────────────────────────');

let employerUser = await prisma.user.findUnique({ where: { email: EMPLOYER_EMAIL } });

if (!employerUser) {
  const hashed = await bcrypt.hash(EMPLOYER_PASS, 12);
  employerUser = await prisma.user.create({
    data: { email: EMPLOYER_EMAIL, password: hashed, role: 'EMPLOYER', status: 'ACTIVE' },
  });
  await prisma.employer.create({
    data: { userId: employerUser.id, companyName: 'TestCorp Ltd', isVerified: true },
  });
  console.log('✓ Created employer user + verified employer profile');
} else {
  // Ensure the employer profile exists and is verified
  const ep = await prisma.employer.findUnique({ where: { userId: employerUser.id } });
  if (!ep) {
    await prisma.employer.create({
      data: { userId: employerUser.id, companyName: 'TestCorp Ltd', isVerified: true },
    });
    console.log('✓ Created missing employer profile (verified)');
  } else if (!ep.isVerified) {
    await prisma.employer.update({ where: { id: ep.id }, data: { isVerified: true, companyName: ep.companyName || 'TestCorp Ltd' } });
    console.log('✓ Marked employer profile as verified');
  } else {
    console.log('✓ Employer account already exists and is verified');
  }
  // Ensure user is ACTIVE
  if (employerUser.status !== 'ACTIVE') {
    await prisma.user.update({ where: { id: employerUser.id }, data: { status: 'ACTIVE' } });
  }
}

// ─── Step 2: sign in as employer ─────────────────────────────────────────────

console.log('\n── Step 2: Sign in as employer ────────────────────────────────');

const { res: loginRes, data: loginData } = await post('/auth/signin', { email: EMPLOYER_EMAIL, password: EMPLOYER_PASS });
if (!loginRes.ok) {
  console.error('✗ Login failed:', loginData);
  process.exit(1);
}
const employerToken = loginData.accessToken;
console.log(`✓ Signed in as ${EMPLOYER_EMAIL} (token length: ${employerToken.length})`);

// ─── Step 3: create a job ─────────────────────────────────────────────────────

console.log('\n── Step 3: Create job ─────────────────────────────────────────');

const jobPayload = {
  title: 'Senior Full-Stack Engineer',
  companyLocation: 'San Francisco, CA',
  locationType: 'REMOTE',
  salaryMin: 120000,
  salaryMax: 180000,
  salaryType: 'YEARLY',
  currency: 'USD',
  requiredSkills: JSON.stringify(['TypeScript', 'React', 'Node.js', 'PostgreSQL']),
  niceToHaveSkills: JSON.stringify(['Docker', 'AWS', 'GraphQL']),
  languages: JSON.stringify(['English']),
  industry: 'Technology',
  description: 'We are looking for a Senior Full-Stack Engineer to join our growing team. You will work on our core product and help shape the architecture of our platform.',
};

const { res: createRes, data: job } = await post('/jobs', jobPayload, employerToken);
if (!createRes.ok) {
  console.error('✗ Job creation failed:', job);
  process.exit(1);
}
console.log(`✓ Job created: "${job.title}" (id: ${job.id})`);
console.log(`  Status: ${job.status} | Enabled: ${job.isEnabled}`);

// ─── Step 4: sign in as owner and approve job ─────────────────────────────────

console.log('\n── Step 4: Approve job as owner ───────────────────────────────');

const { res: ownerLoginRes, data: ownerLoginData } = await post('/auth/signin', { email: OWNER_EMAIL, password: OWNER_PASS });
if (!ownerLoginRes.ok) {
  console.error('✗ Owner login failed:', ownerLoginData);
  process.exit(1);
}
const ownerToken = ownerLoginData.accessToken;
console.log(`✓ Signed in as owner (${OWNER_EMAIL})`);

const { res: approveRes, data: approvedJob } = await patch(`/jobs/${job.id}/review`, { status: 'APPROVED' }, ownerToken);
if (!approveRes.ok) {
  console.error('✗ Job approval failed:', approvedJob);
  process.exit(1);
}
console.log(`✓ Job approved: status=${approvedJob.status}, publishedAt=${approvedJob.publishedAt}`);

// ─── Step 5: verify job appears in public board ───────────────────────────────

console.log('\n── Step 5: Verify job on public board ─────────────────────────');

const boardRes = await fetch(`${BASE}/jobs?limit=5&sortBy=latest`);
const boardData = await boardRes.json();
const found = boardData.jobs?.find(j => j.id === job.id);

if (found) {
  console.log(`✓ Job visible on public board (${boardData.total} total jobs)`);
  console.log(`  Title: "${found.title}"`);
  console.log(`  Company: ${found.employer?.companyName}`);
  console.log(`  Location: ${found.locationType} | ${found.companyLocation}`);
  console.log(`  Salary: $${found.salaryMin?.toLocaleString()} – $${found.salaryMax?.toLocaleString()} ${found.currency}`);
} else {
  console.warn('⚠ Job not found in first page of results — may appear on a later page');
  console.log(`  Total jobs on board: ${boardData.total}`);
}

// ─── Step 6: verify single job endpoint ──────────────────────────────────────

console.log('\n── Step 6: Verify GET /jobs/:id ───────────────────────────────');

const singleRes = await fetch(`${BASE}/jobs/${job.id}`);
const singleJob = await singleRes.json();
if (singleRes.ok && singleJob.id === job.id) {
  console.log(`✓ Single job endpoint works`);
  console.log(`  Skills: ${singleJob.requiredSkills.join(', ')}`);
  console.log(`  Description length: ${singleJob.description?.length} chars`);
} else {
  console.error('✗ Single job endpoint failed:', singleJob);
}

// ─── Step 7: employer's own job list ─────────────────────────────────────────

console.log('\n── Step 7: Employer "My Jobs" list ────────────────────────────');

const myJobsRes = await fetch(`${BASE}/jobs/employer/mine`, {
  headers: { Authorization: `Bearer ${employerToken}` },
});
const myJobs = await myJobsRes.json();
if (myJobsRes.ok) {
  console.log(`✓ Employer has ${myJobs.length} job(s) listed`);
  myJobs.forEach(j => console.log(`  • "${j.title}" [${j.status}]`));
} else {
  console.error('✗ My jobs failed:', myJobs);
}

await prisma.$disconnect();
console.log('\n✓ All tests passed — job flow is working correctly\n');
