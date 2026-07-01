import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use session-mode pooler (DIRECT_URL) to avoid pgbouncer prepared-statement issues
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const OWNER_EMAIL = 'mirocrush@gmail.com';
const OWNER_PASSWORD = 'Felovy@Owner2026';

try {
  // Delete all users (cascades to Developer, Employer, OtpCode, etc.)
  const deleted = await prisma.user.deleteMany({});
  console.log(`Deleted ${deleted.count} user(s).`);

  // Create the owner account (no Developer/Employer profile needed)
  const hashed = await bcrypt.hash(OWNER_PASSWORD, 12);
  const owner = await prisma.user.create({
    data: {
      email: OWNER_EMAIL,
      password: hashed,
      role: 'OWNER',
      status: 'ACTIVE',
    },
    select: { id: true, email: true, role: true, status: true },
  });

  console.log('\nOwner account created:');
  console.log('  Email   :', owner.email);
  console.log('  Password:', OWNER_PASSWORD);
  console.log('  Role    :', owner.role);
  console.log('  ID      :', owner.id);
} finally {
  await prisma.$disconnect();
}
