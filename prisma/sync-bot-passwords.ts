import 'dotenv/config';
import { syncAllBotDeveloperPasswords, BOT_DEVELOPER_PASSWORD } from '../src/server/services/developer-bot.service';

async function main() {
  const count = await syncAllBotDeveloperPasswords();
  console.log(`Updated password to "${BOT_DEVELOPER_PASSWORD}" for ${count} bot developer account(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import('../src/server/config/database');
    await prisma.$disconnect();
  });
