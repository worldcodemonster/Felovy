import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import developerRoutes from './routes/developer.routes';
import employerRoutes from './routes/employer.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import messageRoutes from './routes/message.routes';
import ownerRoutes from './routes/owner.routes';

// ─── Prevent nodemon crash on unhandled rejections ────────────────────────────

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Felovy] Unhandled Rejection (server stays up):', reason);
});
process.on('uncaughtException', (err: Error) => {
  console.error('[Felovy] Uncaught Exception (server stays up):', err.message);
});

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/owner', ownerRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Felovy API' }));

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Felovy] Express error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Felovy API running on port ${PORT}`));
}

// Export for Vercel serverless
export default app;
