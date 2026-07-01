import { describe, it, expect } from 'vitest';
import { cn, formatSalary, timeAgo } from '@/lib/utils';

// ─── cn ───────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates conflicting Tailwind classes (tailwind-merge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('a', undefined, null as any, 'b')).toBe('a b');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });

  it('merges object class notation', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });
});

// ─── formatSalary ─────────────────────────────────────────────────────────────

describe('formatSalary', () => {
  it('returns "Negotiable" when both min and max are absent', () => {
    expect(formatSalary()).toBe('Negotiable');
    expect(formatSalary(null, null)).toBe('Negotiable');
    expect(formatSalary(undefined, undefined)).toBe('Negotiable');
  });

  it('formats a range with both min and max', () => {
    const result = formatSalary(50000, 80000, 'USD');
    expect(result).toContain('50,000');
    expect(result).toContain('80,000');
    expect(result).toContain('–');
  });

  it('formats "From X" when only min is provided', () => {
    const result = formatSalary(60000, null, 'USD');
    expect(result).toContain('From');
    expect(result).toContain('60,000');
  });

  it('formats "Up to X" when only max is provided', () => {
    const result = formatSalary(null, 100000, 'USD');
    expect(result).toContain('Up to');
    expect(result).toContain('100,000');
  });

  it('appends salary type when provided', () => {
    const result = formatSalary(50000, 80000, 'USD', 'MONTHLY');
    expect(result).toContain('monthly');
  });

  it('does not append type when not provided', () => {
    const result = formatSalary(50000, 80000, 'USD');
    expect(result).not.toContain('/');
  });

  it('works with different currencies', () => {
    const result = formatSalary(50000, 80000, 'EUR');
    expect(result).toMatch(/€/);
  });
});

// ─── timeAgo ──────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  const now = new Date();

  it('returns "just now" for very recent dates', () => {
    const recent = new Date(now.getTime() - 30_000); // 30 seconds ago
    expect(timeAgo(recent)).toBe('just now');
  });

  it('returns minutes ago for recent timestamps', () => {
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago for timestamps within a day', () => {
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600_000);
    expect(timeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago for timestamps within a month', () => {
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400_000);
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('returns locale date string for dates older than a month', () => {
    const longAgo = new Date(now.getTime() - 40 * 86400_000);
    const result = timeAgo(longAgo);
    // Should be a formatted date, not Xd ago
    expect(result).not.toMatch(/ago/);
  });

  it('accepts ISO string input', () => {
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('accepts Date object input', () => {
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });
});
