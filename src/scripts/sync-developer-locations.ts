import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { syncAllDeveloperLocations } from '../server/services/developer-bot.service';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional when DATABASE_URL is already set
  }
}

async function main() {
  loadEnvFile();
  const updated = await syncAllDeveloperLocations();
  console.log(`Updated location for ${updated} developer profile(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../server/config/database');
    await prisma.$disconnect();
  });
