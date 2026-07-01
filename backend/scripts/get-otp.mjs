import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
const otp = await p.otpCode.findFirst({ where: { userId: process.argv[2] }, orderBy: { createdAt: 'desc' } });
console.log(JSON.stringify(otp));
await p.$disconnect();
