import multer from 'multer';

// Store in memory so we can pass the buffer directly to ImageKit / Cloudinary / Supabase
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

export const singleUpload = (field: string) => uploadMiddleware.single(field);
export const multiUpload = (fields: { name: string; maxCount: number }[]) =>
  uploadMiddleware.fields(fields);
