import crypto from 'crypto';

export const generateOtp = (): string =>
  String(crypto.randomInt(100000, 999999));

export const otpExpiresAt = (): Date => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10); // 10-minute window
  return d;
};
