import { imagekit } from '../config/imagekit';
import { cloudinary } from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const PROFILE_MAX_WIDTH = 1600;
const PROFILE_MAX_HEIGHT = 2000;
const PROFILE_WEBP_QUALITY = 95;
const PROFILE_JPEG_QUALITY = 95;
/** Skip heavy re-encoding when the download is already a reasonably sized portrait */
const SKIP_REENCODE_MAX_BYTES = 1_200_000;

const jpegOut = (input: Buffer) =>
  sharp(input)
    .jpeg({ quality: PROFILE_JPEG_QUALITY, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();

const webpOut = (input: Buffer) =>
  sharp(input)
    .webp({ quality: PROFILE_WEBP_QUALITY, effort: 4, smartSubsample: false })
    .toBuffer();

/** Resize & compress a portrait for profile cards (used after downloading from external URLs). */
export async function compressProfileImage(buffer: Buffer): Promise<{ buffer: Buffer; ext: 'webp' | 'jpg' }> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const fitsBounds = width > 0 && height > 0 && width <= PROFILE_MAX_WIDTH && height <= PROFILE_MAX_HEIGHT;
  const isJpeg = meta.format === 'jpeg';
  const isWebp = meta.format === 'webp';
  const isPng = meta.format === 'png';

  // Well-sized source — rotate and keep the original format at high quality (no JPEG→WebP conversion)
  if (fitsBounds && buffer.length <= SKIP_REENCODE_MAX_BYTES) {
    if (isJpeg) {
      return { buffer: await jpegOut(await sharp(buffer).rotate().toBuffer()), ext: 'jpg' };
    }
    if (isWebp) {
      return { buffer: await webpOut(await sharp(buffer).rotate().toBuffer()), ext: 'webp' };
    }
    if (isPng) {
      return { buffer: await jpegOut(await sharp(buffer).rotate().toBuffer()), ext: 'jpg' };
    }
  }

  let pipeline = sharp(buffer).rotate();
  if (!fitsBounds) {
    pipeline = sharp(buffer).rotate().resize({
      width: PROFILE_MAX_WIDTH,
      height: PROFILE_MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  const resized = await pipeline.toBuffer();

  // Prefer JPEG for portraits — avoids double lossy compression from JPEG sources
  if (isJpeg || isPng) {
    return { buffer: await jpegOut(resized), ext: 'jpg' };
  }

  try {
    return { buffer: await webpOut(resized), ext: 'webp' };
  } catch {
    return { buffer: await jpegOut(resized), ext: 'jpg' };
  }
}

/** Fetch a public portrait URL, compress it, and store via ImageKit. Falls back to source URL on failure. */
export async function uploadPortraitFromUrl(
  sourceUrl: string,
  folder: string = 'felovy/profiles/bots',
): Promise<string> {
  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return sourceUrl;

    const raw = Buffer.from(await res.arrayBuffer());
    if (raw.length < 64) return sourceUrl;

    const { buffer, ext } = await compressProfileImage(raw);
    return uploadImage(buffer, `portrait.${ext}`, folder);
  } catch {
    return sourceUrl;
  }
}

// ─── Image upload via ImageKit ────────────────────────────────────────────────

export const uploadImage = async (
  buffer: Buffer,
  fileName: string,
  folder: string = 'felovy'
): Promise<string> => {
  const result = await imagekit.upload({
    file: buffer,
    fileName: `${uuidv4()}-${fileName}`,
    folder,
    useUniqueFileName: false,
  });
  return result.url;
};

// ─── Video upload via Cloudinary ──────────────────────────────────────────────

export const uploadVideo = async (
  buffer: Buffer,
  folder: string = 'felovy/videos'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder, chunk_size: 6000000 },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// ─── File (PDF, ID card, etc.) upload via ImageKit ───────────────────────────

export const uploadFile = async (
  buffer: Buffer,
  originalName: string,
  folder: string = 'felovy/id-cards'
): Promise<string> => {
  const result = await imagekit.upload({
    file: buffer,
    fileName: `${uuidv4()}-${originalName}`,
    folder,
    useUniqueFileName: false,
  });
  return result.url;
};
