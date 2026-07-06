/** JPEG/WebP quality for homepage photos (Next.js default is 75). */
export const HOME_IMAGE_QUALITY = {
  avatarSm: 50,
  avatarMd: 52,
  card: 55,
  grid: 58,
  illustration: 65,
} as const;

export const HOME_IMAGE_SIZES = {
  avatarSm: '36px',
  avatarMd: '(max-width: 768px) 64px, 80px',
  developerCard: '170px',
  workplaceGrid3: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  workplaceGrid4: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  workplaceGridMany: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  domainTile: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 160px',
  workflowTile: '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 280px',
} as const;

export function workplaceImageSizes(imageCount: number): string {
  if (imageCount === 3) return HOME_IMAGE_SIZES.workplaceGrid3;
  if (imageCount <= 4) return HOME_IMAGE_SIZES.workplaceGrid4;
  return HOME_IMAGE_SIZES.workplaceGridMany;
}
