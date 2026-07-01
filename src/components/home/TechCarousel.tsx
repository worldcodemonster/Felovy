'use client';

interface Props {
  row1: string[];
  row2: string[];
}

export function TechCarousel({ row1, row2 }: Props) {
  const pauseOnHover = (e: React.MouseEvent<HTMLDivElement>) =>
    ((e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused');
  const resumeOnLeave = (e: React.MouseEvent<HTMLDivElement>) =>
    ((e.currentTarget as HTMLDivElement).style.animationPlayState = 'running');

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden">
        <div
          className="flex gap-3 py-1"
          style={{ width: 'max-content', animation: 'marquee-left 32s linear infinite' }}
          onMouseEnter={pauseOnHover}
          onMouseLeave={resumeOnLeave}
        >
          {[...row1, ...row1].map((tag, i) => (
            <span key={i} className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white hover:border-felovy-red/40 transition-all duration-200 cursor-default whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-3 py-1"
          style={{ width: 'max-content', animation: 'marquee-right 38s linear infinite' }}
          onMouseEnter={pauseOnHover}
          onMouseLeave={resumeOnLeave}
        >
          {[...row2, ...row2].map((tag, i) => (
            <span key={i} className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white hover:border-felovy-red/40 transition-all duration-200 cursor-default whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
