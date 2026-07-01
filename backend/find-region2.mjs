import { execSync } from 'child_process';

const regions = ['us-east-1','us-east-2','eu-west-1','eu-west-2','eu-central-1','ap-southeast-1','ap-northeast-1','us-west-1','ca-central-1','sa-east-1'];
const pw = 'skwakftogjrjdto';
const ref = 'rqgjibhxhyrnfrglbtjx';

for (const r of regions) {
  const url = `postgresql://postgres.${ref}:${pw}@aws-0-${r}.pooler.supabase.com:6543/postgres`;
  process.stdout.write(`${r} ... `);
  try {
    const out = execSync(`npx prisma db push --skip-generate --url "${url}"`, {
      cwd: 'e:\\Felovy\\backend',
      stdio: ['pipe','pipe','pipe'],
      timeout: 15000,
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    });
    console.log('✓ FOUND');
    console.log(`URL: ${url}`);
    process.exit(0);
  } catch(e) {
    const msg = e.stderr?.toString() || e.message || '';
    if (msg.includes('P1000') || msg.includes('password')) { console.log('auth fail'); }
    else if (msg.includes('P1001') || msg.includes('reach')) { console.log('no connect'); }
    else { console.log('fail: ' + msg.slice(0,80).replace(/\n/g,' ')); }
  }
}
