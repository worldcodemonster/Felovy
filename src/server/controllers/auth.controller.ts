import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateOtp, otpExpiresAt } from '../utils/otp.util';
import { sendOtpEmail } from '../services/email.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { Role } from '@prisma/client';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Personal email domains that employers cannot use
const PERSONAL_DOMAINS = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'aol.com','protonmail.com','mail.com','zoho.com','yandex.com',
];

const isPersonalEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return PERSONAL_DOMAINS.includes(domain);
};

// ─── Developer / Employer: initiate signup (send OTP) ────────────────────────

export const initiateSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, password, role } = req.body as { email: string; password: string; role: Role };
    const email = normalizeEmail(rawEmail);

    if (!['DEVELOPER', 'EMPLOYER'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    if (role === 'EMPLOYER' && isPersonalEmail(email)) {
      res.status(400).json({ message: 'Employers must use a company email address' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Allow re-initiation only when the user never verified (unused signup OTP still present)
      const pendingOtp = await prisma.otpCode.findFirst({
        where: { userId: existing.id, type: 'signup', used: false },
      });
      if (!pendingOtp) {
        res.status(409).json({ message: 'Email already registered' });
        return;
      }
      // Update password in case the user went back and changed it
      const hashed = await bcrypt.hash(password, 12);
      await prisma.user.update({ where: { id: existing.id }, data: { password: hashed } });
      // Replace old OTP with a fresh one
      await prisma.otpCode.deleteMany({ where: { userId: existing.id, type: 'signup', used: false } });
      const code = generateOtp();
      await prisma.otpCode.create({
        data: { userId: existing.id, code, type: 'signup', expiresAt: otpExpiresAt() },
      });
      try {
        await sendOtpEmail(email, code, 'signup');
      } catch (emailErr) {
        console.error('[initiateSignup] re-send email failed:', emailErr);
        res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
        return;
      }
      res.status(200).json({ message: 'New OTP sent to your email', userId: existing.id });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, role, status: 'ACTIVE' },
    });

    if (role === 'DEVELOPER') await prisma.developer.create({ data: { userId: user.id } });
    if (role === 'EMPLOYER') await prisma.employer.create({ data: { userId: user.id } });

    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId: user.id, code, type: 'signup', expiresAt: otpExpiresAt() },
    });

    try {
      await sendOtpEmail(email, code, 'signup');
    } catch (emailErr) {
      // Roll back so the user can retry with the same email
      await prisma.user.delete({ where: { id: user.id } });
      console.error('[initiateSignup] email failed, rolled back user:', emailErr);
      res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
      return;
    }

    res.status(201).json({ message: 'OTP sent to your email', userId: user.id });
  } catch (err) {
    console.error('[initiateSignup]', err);
    res.status(500).json({ message: 'Server error. Check your database connection' });
  }
};

// ─── Verify OTP (signup) ──────────────────────────────────────────────────────

export const verifySignupOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code: rawCode } = req.body as { userId: string; code: string };
    const code = rawCode?.trim();

    const otp = await prisma.otpCode.findFirst({
      where: { userId, code, type: 'signup', used: false },
    });

    if (!otp || otp.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const payload = { userId: user.id, role: user.role, email: user.email };
    res.json({
      message: 'Signup complete',
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[verifySignupOtp]', err);
    res.status(500).json({ message: 'Server error. Check your database connection' });
  }
};

// ─── Sign in ──────────────────────────────────────────────────────────────────

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, password } = req.body as { email: string; password: string };
    const email = normalizeEmail(rawEmail);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    if (user.status === 'BANNED') {
      res.status(403).json({ message: 'Account is banned' });
      return;
    }
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const payload = { userId: user.id, role: user.role, email: user.email };
    res.json({
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[signin]', err);
    res.status(500).json({ message: 'Server error. Check your database connection' });
  }
};

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  try {
    const { userId, role, email } = verifyRefreshToken(refreshToken);
    res.json({ accessToken: signAccessToken({ userId, role, email }) });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ─── Resend signup OTP ───────────────────────────────────────────────────────

export const resendSignupOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const pendingOtp = await prisma.otpCode.findFirst({
      where: { userId, type: 'signup', used: false },
    });
    if (!pendingOtp) {
      res.status(400).json({ message: 'Account is already verified' });
      return;
    }

    await prisma.otpCode.deleteMany({ where: { userId, type: 'signup', used: false } });
    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId, code, type: 'signup', expiresAt: otpExpiresAt() },
    });

    try {
      await sendOtpEmail(user.email, code, 'signup');
    } catch (emailErr) {
      console.error('[resendSignupOtp] email failed:', emailErr);
      res.status(500).json({ message: 'Failed to send email. Please try again.' });
      return;
    }

    res.json({ message: 'New OTP sent to your email' });
  } catch (err) {
    console.error('[resendSignupOtp]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Initiate email change ────────────────────────────────────────────────────

export const initiateEmailChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { newEmail: rawNewEmail } = req.body as { newEmail: string };
    const newEmail = normalizeEmail(rawNewEmail);

    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) { res.status(409).json({ message: 'Email already in use' }); return; }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const code = generateOtp();
    await prisma.otpCode.create({
      data: { userId, code, type: 'email_change', expiresAt: otpExpiresAt() },
    });
    await sendOtpEmail(user.email, code, 'email_change');

    res.json({ message: 'OTP sent to your current email', newEmail });
  } catch (err) {
    console.error('[initiateEmailChange]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Verify email change OTP ──────────────────────────────────────────────────

export const verifyEmailChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { code, newEmail } = req.body as { code: string; newEmail: string };

    const otp = await prisma.otpCode.findFirst({
      where: { userId, code, type: 'email_change', used: false },
    });
    if (!otp || otp.expiresAt < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });

    res.json({ message: 'Email updated successfully' });
  } catch (err) {
    console.error('[verifyEmailChange]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Change password ──────────────────────────────────────────────────────────

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string; newPassword: string;
    };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

