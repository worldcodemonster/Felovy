import 'dotenv/config';
import { prisma } from '../src/server/config/database';

async function main() {
  const devs = await prisma.developer.findMany({
    select: { id: true, fullName: true, location: true, country: true },
  });

  for (const dev of devs) {
    if (!dev.country && dev.location) {
      const loc = dev.location.toLowerCase();
      let country = 'United States';

      if (loc.includes('germany') || loc.includes('berlin') || loc.includes('munich') || loc.includes('hamburg')) country = 'Germany';
      else if (loc.includes('nigeria') || loc.includes('lagos') || loc.includes('abuja')) country = 'Nigeria';
      else if (loc.includes('korea') || loc.includes('seoul')) country = 'South Korea';
      else if (loc.includes('japan') || loc.includes('tokyo')) country = 'Japan';
      else if (loc.includes('uk') || loc.includes('london') || loc.includes('england')) country = 'United Kingdom';
      else if (loc.includes('france') || loc.includes('paris')) country = 'France';
      else if (loc.includes('india') || loc.includes('mumbai') || loc.includes('bangalore') || loc.includes('delhi')) country = 'India';
      else if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver')) country = 'Canada';
      else if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne')) country = 'Australia';
      else if (loc.includes('brazil') || loc.includes('são paulo') || loc.includes('sao paulo')) country = 'Brazil';
      else if (loc.includes('china') || loc.includes('beijing') || loc.includes('shanghai')) country = 'China';
      else if (loc.includes('russia') || loc.includes('moscow')) country = 'Russia';
      else if (loc.includes('turkey') || loc.includes('istanbul')) country = 'Turkey';
      else if (loc.includes('spain') || loc.includes('madrid') || loc.includes('barcelona')) country = 'Spain';
      else if (loc.includes('italy') || loc.includes('rome') || loc.includes('milan')) country = 'Italy';
      else if (loc.includes('netherlands') || loc.includes('amsterdam')) country = 'Netherlands';
      else if (loc.includes('poland') || loc.includes('warsaw')) country = 'Poland';
      else if (loc.includes('portugal') || loc.includes('lisbon')) country = 'Portugal';
      else if (loc.includes('ukraine') || loc.includes('kyiv')) country = 'Ukraine';
      else if (loc.includes('usa') || loc.includes('u.s.') || loc.includes('united states') ||
               loc.includes(', ca') || loc.includes(', ny') || loc.includes(', tx') ||
               loc.includes(', wa') || loc.includes(', fl') || loc.includes(', il')) country = 'United States';

      await prisma.developer.update({ where: { id: dev.id }, data: { country } });
      console.log(`✓ ${dev.fullName ?? dev.id}: "${dev.location}" → ${country}`);
    } else if (dev.country) {
      console.log(`  ${dev.fullName ?? dev.id}: already has "${dev.country}"`);
    } else {
      console.log(`  ${dev.fullName ?? dev.id}: no location to infer from, skipping`);
    }
  }

  console.log('\n✅ Done');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
