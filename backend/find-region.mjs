import { execSync } from 'child_process';

const regions = ['us-east-1','us-east-2','eu-west-1','eu-west-2','eu-central-1','ap-southeast-1','ap-northeast-1','us-west-1','ca-central-1','sa-east-1'];
const pw = 'skwakftogjrjdto';
const ref = 'rqgjibhxhyrnfrglbtjx';

for (const r of regions) {
  const url = `postgresql://postgres.${ref}:${pw}@aws-0-${r}.pooler.supabase.com:6543/postgres`;
  process.stdout.write(`${r} ... `);
  try {
    execSync(`npx prisma db execute --url "${url}" --stdin`, {
      input: 'SELECT 1;',
      cwd: 'e:\\Felovy\\backend',
      stdio: ['pipe','pipe','pipe'],
      timeout: 10000,
    });
    console.log('✓ FOUND');
    console.log(`\nPOOLER URL:\n${url}`);
    process.exit(0);
  } catch {
    console.log('fail');
  }
}
console.log('No region found.');
