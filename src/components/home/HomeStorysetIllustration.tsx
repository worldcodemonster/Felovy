import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HOME_IMAGE_QUALITY } from '@/lib/home-image';

interface HomeStorysetIllustrationProps {
  src: string;
  sizes: string;
  aspectClass?: string;
  imagePadding?: string;
}

export function HomeStorysetIllustration({
  src,
  sizes,
  aspectClass = 'aspect-[5/4] lg:aspect-[4/3]',
  imagePadding = 'p-1.5 sm:p-2 lg:p-1',
}: HomeStorysetIllustrationProps) {
  return (
    <div className={cn('relative', aspectClass)} aria-hidden>
      <div className={cn('absolute inset-0 flex items-center justify-center', imagePadding)}>
        <Image
          src={src}
          alt=""
          fill
          quality={HOME_IMAGE_QUALITY.illustration}
          className="object-contain"
          sizes={sizes}
          aria-hidden
        />
      </div>
    </div>
  );
}
