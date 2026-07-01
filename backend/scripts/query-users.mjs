import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(JSON.stringify(users, null, 2));
} finally {
  await prisma.$disconnect();
}
