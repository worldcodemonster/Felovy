import 'dotenv/config';
import { createHomeCarouselBotDevelopers } from '../src/server/services/developer-bot.service';

async function main() {
  const result = await createHomeCarouselBotDevelopers((event) => {
    if (event.type === 'person_complete' || event.type === 'person_failed') {
      console.log(JSON.stringify(event));
    }
  });
  console.log(`Done: created ${result.created}, skipped/existing ${result.developers.length - result.created}, errors ${result.errors.length}`);
  if (result.errors.length) {
    result.errors.forEach((e) => console.error(e));
  }
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
