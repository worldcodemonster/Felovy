import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

const regions = ['us-east-1','us-east-2','eu-west-1','eu-west-2','eu-central-1','ap-southeast-1','ap-northeast-1','us-west-1'];
const pw = 'skwakftogjrjdto';
const ref = 'rqgjibhxhyrnfrglbtjx';

const origEnv = readFileSync('e:\\Felovy\\backend\\.env', 'utf8');

for (const r of regions) {
  const url = `postgresql://postgres.${ref}:${pw}@aws-0-${r}.pooler.supabase.com:6543/postgres`;
  process.stdout.write(`${r} ... `);

  // Temporarily patch .env
  const patched = origEnv
    .replace(/^DATABASE_URL=.*/m, `DATABASE_URL="${url}"`)
    .replace(/^DIRECT_URL=.*/m, `DIRECT_URL="${url}"`);
  writeFileSync('e:\\Felovy\\backend\\.env', patched);

  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: 'e:\\Felovy\\backend',
      stdio: ['pipe','pipe','pipe'],
      timeout: 20000,
    });
    console.log('✓ SUCCESS — REGION: ' + r);
    console.log('Pooler URL: ' + url);
    // Leave .env with the working URL
    process.exit(0);
  } catch(e) {
    const msg = (e.stderr?.toString() || '') + (e.stdout?.toString() || '');
    if (msg.includes('P1000') || msg.includes('authentication')) console.log('wrong password');
    else if (msg.includes('P1001') || msg.includes('reach')) console.log('unreachable');
    else console.log('err: ' + msg.replace(/\s+/g,' ').slice(0,100));
  }
}

// Restore original .env if nothing worked
writeFileSync('e:\\Felovy\\backend\\.env', origEnv);
console.log('\nRestored .env. Could not find working region.');
