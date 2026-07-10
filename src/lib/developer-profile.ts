import type { CefrLevel, DeveloperLanguage } from '@/types';

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'];

export const CEFR_META: Record<CefrLevel, { label: string; pct: number; color: string }> = {
  A1:     { label: 'A1 · Beginner',       pct: 15,  color: 'bg-gray-300' },
  A2:     { label: 'A2 · Elementary',     pct: 28,  color: 'bg-slate-400' },
  B1:     { label: 'B1 · Intermediate',   pct: 45,  color: 'bg-sky-400' },
  B2:     { label: 'B2 · Upper Int.',     pct: 62,  color: 'bg-blue-500' },
  C1:     { label: 'C1 · Advanced',       pct: 80,  color: 'bg-violet-500' },
  C2:     { label: 'C2 · Proficient',     pct: 92,  color: 'bg-purple-600' },
  Native: { label: 'Native',              pct: 100, color: 'bg-felovy-red' },
};

/** Parse languages from DB — supports legacy string[] or { name, level }[] */
export function parseDeveloperLanguages(raw: unknown): DeveloperLanguage[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') {
        const match = item.match(/^(.+?)\s*[\(\·\-]\s*(A1|A2|B1|B2|C1|C2|Native)\)?$/i);
        if (match) {
          return { name: match[1].trim(), level: match[2] as CefrLevel };
        }
        return { name: item, level: 'B2' as CefrLevel };
      }
      if (item && typeof item === 'object' && 'name' in item) {
        const o = item as { name?: string; level?: string };
        const level = CEFR_LEVELS.includes(o.level as CefrLevel) ? (o.level as CefrLevel) : 'B2';
        return { name: String(o.name ?? ''), level };
      }
      return null;
    }).filter(Boolean) as DeveloperLanguage[];
  }
  return [];
}

export function computeAge(birthYear?: number | null): number | null {
  if (!birthYear || birthYear < 1940 || birthYear > new Date().getFullYear() - 16) return null;
  return new Date().getFullYear() - birthYear;
}

export function formatExperienceDates(start: string, end?: string, current?: boolean): string {
  const fmt = (d: string) => {
    const [y, m] = d.split('-');
    if (!y) return d;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mi = parseInt(m ?? '1', 10) - 1;
    return mi >= 0 && mi < 12 ? `${months[mi]} ${y}` : y;
  };
  const endLabel = current ? 'Present' : end ? fmt(end) : '';
  return `${fmt(start)} – ${endLabel}`;
}

export function experienceDurationYears(start: string, end?: string, current?: boolean): number {
  const sy = parseInt(start.slice(0, 4), 10);
  const ey = current ? new Date().getFullYear() : parseInt((end ?? start).slice(0, 4), 10);
  if (!sy || !ey) return 0;
  return Math.max(1, ey - sy + 1);
}
