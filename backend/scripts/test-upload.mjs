// Test ID card upload end-to-end
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';

const BASE = 'http://localhost:4000/api';

// 1. Sign in as the test developer
const loginRes = await fetch(`${BASE}/auth/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'testdev@corp.com', password: 'Test@1234' }),
});
const loginData = await loginRes.json();
if (!loginRes.ok) {
  console.error('Login failed:', loginData);
  process.exit(1);
}
const token = loginData.accessToken;
console.log('✓ Logged in, token length:', token.length);

// 2. Upload a minimal PNG as the ID card
// Minimal valid 1x1 PNG
const pngBytes = Buffer.from(
  '89504e470d0a1a0a0000000d494844520000000100000001' +
  '08020000009077 53de0000000c49444154' +
  '08d763f8cfc000000002000 1e221bc330000000049454e44ae426082',
  'hex'
);

// Build multipart form manually since we can't use FormData in Node ESM easily
// Actually Node 18+ has built-in FormData — let's use that
const formData = new FormData();
const blob = new Blob([pngBytes], { type: 'image/png' });
formData.append('idCard', blob, 'test-id.png');

console.log('Uploading ID card to Cloudinary via /developers/me/step4...');
const uploadRes = await fetch(`${BASE}/developers/me/step4`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

const uploadData = await uploadRes.json().catch(() => ({}));
console.log('HTTP Status:', uploadRes.status);
console.log('Response:', JSON.stringify(uploadData, null, 2));

if (uploadRes.ok) {
  console.log('\n✓ Upload SUCCESS');
  console.log('idCardUrl:', uploadData.idCardUrl);
} else {
  console.log('\n✗ Upload FAILED');
  process.exit(1);
}
