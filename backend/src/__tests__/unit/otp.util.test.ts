import { generateOtp, otpExpiresAt } from '../../utils/otp.util';

describe('generateOtp', () => {
  it('returns a string of exactly 6 characters', () => {
    expect(generateOtp()).toHaveLength(6);
  });

  it('contains only digits', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it('is within the range 100000–999999', () => {
    for (let i = 0; i < 50; i++) {
      const n = Number(generateOtp());
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });

  it('produces different values across calls (probabilistic)', () => {
    const values = new Set(Array.from({ length: 20 }, generateOtp));
    expect(values.size).toBeGreaterThan(1);
  });
});

describe('otpExpiresAt', () => {
  it('returns a Date object', () => {
    expect(otpExpiresAt()).toBeInstanceOf(Date);
  });

  it('is approximately 10 minutes in the future', () => {
    const before = Date.now();
    const exp = otpExpiresAt().getTime();
    const after = Date.now();

    const nineMin = 9 * 60 * 1000;
    const elevenMin = 11 * 60 * 1000;
    expect(exp).toBeGreaterThanOrEqual(before + nineMin);
    expect(exp).toBeLessThanOrEqual(after + elevenMin);
  });

  it('each call returns a fresh Date', () => {
    const a = otpExpiresAt().getTime();
    const b = otpExpiresAt().getTime();
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
