import { imagekit } from '../config/imagekit';
import { cloudinary } from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

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
