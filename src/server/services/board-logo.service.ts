import { uploadPortraitFromUrl } from './upload.service';

const LOGO_FOLDER = 'felovy/board-logos';

/** Cache a remote logo URL to ImageKit; returns stored URL or original on failure. */
export async function cacheRemoteLogo(
  ats: string,
  boardToken: string,
  remoteUrl: string,
): Promise<string> {
  if (!remoteUrl?.trim()) return remoteUrl;
  if (remoteUrl.includes('ik.imagekit.io') || remoteUrl.includes('cloudinary.com')) {
    return remoteUrl;
  }
  const folder = `${LOGO_FOLDER}/${ats}`;
  return uploadPortraitFromUrl(remoteUrl, folder);
}

/** Migrate felovy-asset:// or local file URLs — re-fetch if possible, else skip. */
export async function migrateLogoUrl(
  ats: string,
  boardToken: string,
  logoUrl: string | null | undefined,
): Promise<string | null> {
  if (!logoUrl?.trim()) return null;
  if (logoUrl.startsWith('felovy-asset://')) return null;
  if (logoUrl.includes('ik.imagekit.io') || logoUrl.includes('cloudinary.com')) {
    return logoUrl;
  }
  if (/^https?:\/\//i.test(logoUrl)) {
    try {
      return await cacheRemoteLogo(ats, boardToken, logoUrl);
    } catch {
      return logoUrl;
    }
  }
  return null;
}
