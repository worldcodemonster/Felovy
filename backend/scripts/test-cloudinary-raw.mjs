import 'dotenv/config';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

console.log('Testing ImageKit upload...');
console.log('Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);

const buffer = Buffer.from('test id card content');

const result = await imagekit.upload({
  file: buffer,
  fileName: `test-id-${Date.now()}.txt`,
  folder: '/felovy/id-cards',
  useUniqueFileName: false,
});

console.log('✓ Upload success!');
console.log('URL:', result.url);
